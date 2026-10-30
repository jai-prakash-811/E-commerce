require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('./server/models/User');
const Product = require('./server/models/Product');
const Order = require('./server/models/Order');

const app = express();
const port = Number(process.env.PORT) || 5000;
const jwtSecret = process.env.JWT_SECRET;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function issueToken(user) {
  return jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: '7d' });
}

const requireAuth = asyncRoute(async (req, res, next) => {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'Your account could not be found.' });
    }
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    }
    throw error;
  }
});

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Administrator access is required.' });
  }
  return next();
};

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.post('/api/auth/signup', asyncRoute(async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    return res.status(400).json({ message: 'Enter a valid name and email, and use a password of at least 8 characters.' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role: 'customer' });
  res.status(201).json({ token: issueToken(user), user: publicUser(user) });
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  res.json({ token: issueToken(user), user: publicUser(user) });
}));

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.get('/api/products', asyncRoute(async (req, res) => {
  const filter = { active: true };
  const query = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim().slice(0, 60) : '';
  const sortBy = {
    featured: { featured: -1, createdAt: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { rating: -1 }
  }[req.query.sort] || { featured: -1, createdAt: -1 };

  if (query) {
    filter.$text = { $search: query };
  }
  if (category) {
    filter.category = category;
  }

  const parsedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 100;
  const products = await Product.find(filter).sort(sortBy).limit(limit).lean();
  const categories = await Product.distinct('category', { active: true });
  res.json({ products, categories: categories.sort((a, b) => a.localeCompare(b)) });
}));

app.get('/api/products/:id', asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Product not found.' });
  }
  const product = await Product.findOne({ _id: req.params.id, active: true }).lean();
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }
  res.json(product);
}));

app.get('/api/wishlist', requireAuth, asyncRoute(async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: 'wishlist',
    match: { active: true }
  });
  res.json(user.wishlist);
}));

app.put('/api/wishlist/:productId', requireAuth, asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) {
    return res.status(404).json({ message: 'Product not found.' });
  }
  const product = await Product.findOne({ _id: req.params.productId, active: true });
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  const user = await User.findById(req.user.id);
  const alreadySaved = user.wishlist.some((id) => id.equals(product._id));
  if (alreadySaved) {
    user.wishlist.pull(product._id);
  } else {
    user.wishlist.addToSet(product._id);
  }
  await user.save();
  const wishlist = await User.findById(user.id).populate({ path: 'wishlist', match: { active: true } });
  res.json({ added: !alreadySaved, wishlist: wishlist.wishlist });
}));

app.post('/api/orders', requireAuth, asyncRoute(async (req, res) => {
  const { items, shippingAddress } = req.body;
  const addressFields = ['fullName', 'email', 'phone', 'address', 'city', 'postalCode'];
  if (!Array.isArray(items) || items.length === 0 || items.length > 50 ||
      !shippingAddress || addressFields.some((field) => typeof shippingAddress[field] !== 'string' || !shippingAddress[field].trim())) {
    return res.status(400).json({ message: 'A valid cart and complete delivery address are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email.trim()) ||
      !/^\d{6}$/.test(shippingAddress.postalCode.trim()) ||
      shippingAddress.fullName.trim().length > 100 ||
      shippingAddress.address.trim().length > 250) {
    return res.status(400).json({ message: 'Please check the email, delivery address, and 6-digit PIN code.' });
  }

  const quantities = new Map();
  for (const item of items) {
    if (!item || !mongoose.isValidObjectId(item.productId) ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      return res.status(400).json({ message: 'Your cart contains an invalid product or quantity.' });
    }
    const productId = item.productId.toLowerCase();
    const totalQuantity = (quantities.get(productId) || 0) + item.quantity;
    if (totalQuantity > 20) {
      return res.status(400).json({ message: 'You can order at most 20 of each product.' });
    }
    quantities.set(productId, totalQuantity);
  }

  const products = await Product.find({ _id: { $in: [...quantities.keys()] }, active: true });
  if (products.length !== quantities.size) {
    return res.status(400).json({ message: 'One or more products are no longer available.' });
  }

  const orderItems = [];
  const reserved = [];
  try {
    for (const product of products) {
      const quantity = quantities.get(product.id);
      const updated = await Product.findOneAndUpdate(
        { _id: product.id, active: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );
      if (!updated) {
        throw new Error(`${product.name} does not have enough stock.`);
      }
      reserved.push({ productId: product.id, quantity });
      orderItems.push({
        product: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity
      });
    }

    const subtotal = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const shippingCost = subtotal >= 2999 ? 0 : 99;
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress: Object.fromEntries(addressFields.map((field) => [field, shippingAddress[field].trim()])),
      shippingCost,
      total: subtotal + shippingCost
    });
    return res.status(201).json(order);
  } catch (error) {
    await Promise.all(reserved.map(({ productId, quantity }) =>
      Product.updateOne({ _id: productId }, { $inc: { stock: quantity } })
    ));
    if (error.message.includes('does not have enough stock')) {
      return res.status(409).json({ message: error.message });
    }
    throw error;
  }
}));

app.get('/api/orders', requireAuth, asyncRoute(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { user: req.user.id };
  const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
  res.json(orders);
}));

app.get('/api/admin/products', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  res.json(await Product.find().sort({ createdAt: -1 }).lean());
}));

function productPayload(body) {
  const { name, description, image, category, badge = '' } = body;
  const price = Number(body.price);
  const stock = Number(body.stock);
  const rating = body.rating === undefined ? 4.8 : Number(body.rating);
  if (typeof name !== 'string' || name.trim().length < 2 ||
      typeof description !== 'string' || description.trim().length < 8 ||
      typeof image !== 'string' || !/^https?:\/\//i.test(image) ||
      typeof category !== 'string' || !category.trim() ||
      !Number.isFinite(price) || price <= 0 ||
      !Number.isInteger(stock) || stock < 0 ||
      !Number.isFinite(rating) || rating < 0 || rating > 5 ||
      typeof badge !== 'string') {
    return null;
  }
  return {
    name: name.trim(),
    description: description.trim(),
    image: image.trim(),
    category: category.trim(),
    badge: badge.trim().slice(0, 40),
    price,
    stock,
    rating
  };
}

app.post('/api/admin/products', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const payload = productPayload(req.body);
  if (!payload) {
    return res.status(400).json({ message: 'Please provide valid product details.' });
  }
  res.status(201).json(await Product.create(payload));
}));

app.put('/api/admin/products/:id', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Product not found.' });
  }
  const payload = productPayload(req.body);
  if (!payload) {
    return res.status(400).json({ message: 'Please provide valid product details.' });
  }
  const product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }
  res.json(product);
}));

app.delete('/api/admin/products/:id', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Product not found.' });
  }
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }
  res.status(204).end();
}));

app.patch('/api/admin/orders/:id', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const allowedStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!mongoose.isValidObjectId(req.params.id) || !allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({ message: 'A valid order and status are required.' });
  }
  const currentOrder = await Order.findById(req.params.id);
  if (!currentOrder) {
    return res.status(404).json({ message: 'Order not found.' });
  }
  if (currentOrder.status === 'cancelled' && req.body.status !== 'cancelled') {
    return res.status(409).json({ message: 'Cancelled orders cannot be reopened.' });
  }
  if (req.body.status === 'cancelled') {
    if (currentOrder.status === 'cancelled') {
      return res.json(currentOrder);
    }
    if (currentOrder.status === 'delivered') {
      return res.status(409).json({ message: 'Delivered orders cannot be cancelled.' });
    }
    const cancelledOrder = await Order.findOneAndUpdate(
      { _id: currentOrder.id, status: currentOrder.status },
      { status: 'cancelled' },
      { new: true, runValidators: true }
    );
    if (!cancelledOrder) {
      return res.status(409).json({ message: 'The order changed. Refresh and try again.' });
    }
    await Promise.all(cancelledOrder.items.map((item) =>
      Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })
    ));
    return res.json(cancelledOrder);
  }
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }
  res.json(order);
}));

if (process.env.NODE_ENV === 'production') {
  const clientDirectory = path.join(__dirname, 'dist');
  app.use(express.static(clientDirectory));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(clientDirectory, 'index.html'));
  });
}

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must contain valid JSON.' });
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: 'Please check the submitted information.' });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }
  console.error(error);
  return res.status(500).json({ message: 'The server could not complete your request.' });
});

async function start() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be set before starting the server.');
  }
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('Set JWT_SECRET to a secret of at least 32 characters.');
  }
  if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_ORIGIN) {
    throw new Error('Set CLIENT_ORIGIN to your production storefront URL.');
  }
  await mongoose.connect(process.env.MONGO_URI);
  app.listen(port, () => console.log(`ShopVerse API ready on http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Unable to start ShopVerse:', error.message);
    process.exitCode = 1;
  });
}

module.exports = app;
