require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('./server/models/Product');
const User = require('./server/models/User');

const products = [
  {
    name: 'Everyday Leather Jacket',
    category: 'Clothing',
    price: 4299,
    stock: 18,
    rating: 4.9,
    badge: 'Bestseller',
    featured: true,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=85',
    description: 'An easy layer with a confident silhouette. Crafted in soft-touch vegan leather with considered details for all-season wear.'
  },
  {
    name: 'Retro Runner Sneakers',
    category: 'Footwear',
    price: 2899,
    stock: 32,
    rating: 4.8,
    badge: 'Just in',
    featured: true,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85',
    description: 'Light on your feet, big on everyday comfort. A retro-inspired shape with a cushioned sole made for all-day plans.'
  },
  {
    name: 'The Sunday Cotton Shirt',
    category: 'Clothing',
    price: 1899,
    stock: 26,
    rating: 4.7,
    badge: '',
    featured: true,
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=85',
    description: 'The shirt you reach for without thinking. Relaxed, breathable cotton and an easy shape that works from slow mornings to late plans.'
  },
  {
    name: 'Sculpted Everyday Tote',
    category: 'Accessories',
    price: 1599,
    stock: 24,
    rating: 4.9,
    badge: 'Customer love',
    featured: true,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=85',
    description: 'Room for the things you carry, without carrying too much. A soft-structured tote with a clean, versatile finish.'
  },
  {
    name: 'Sunday Morning Knit',
    category: 'Clothing',
    price: 2499,
    stock: 15,
    rating: 4.8,
    badge: '',
    featured: false,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=85',
    description: 'Soft, warm, and made for taking your time. This everyday knit layers beautifully over your favourite basics.'
  },
  {
    name: 'Daylight Sunglasses',
    category: 'Accessories',
    price: 1299,
    stock: 40,
    rating: 4.6,
    badge: 'Easy favourite',
    featured: false,
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=85',
    description: 'A timeless shape made for bright days. Lightweight frames, comfortable fit, and UV-protective lenses.'
  },
  {
    name: 'City Walk Low Tops',
    category: 'Footwear',
    price: 3199,
    stock: 21,
    rating: 4.7,
    badge: '',
    featured: false,
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1000&q=85',
    description: 'A dependable everyday classic with a clean profile and a soft, supportive footbed for wherever the day goes.'
  },
  {
    name: 'Weekend Crossbody',
    category: 'Accessories',
    price: 2199,
    stock: 19,
    rating: 4.8,
    badge: 'Bestseller',
    featured: false,
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=85',
    description: 'Your hands-free companion for busy days and unplanned detours. Compact, thoughtful, and easy to style.'
  }
];

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be set before seeding products.');
  }
  if (Boolean(process.env.ADMIN_EMAIL) !== Boolean(process.env.ADMIN_PASSWORD)) {
    throw new Error('Set both ADMIN_EMAIL and ADMIN_PASSWORD to provision the store administrator.');
  }
  await mongoose.connect(process.env.MONGO_URI);
  for (const product of products) {
    await Product.updateOne(
      { name: product.name },
      { $setOnInsert: product },
      { upsert: true }
    );
  }
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) {
      throw new Error('Use a valid ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await User.updateOne(
      { email },
      {
        $set: { email, name: 'ShopVerse Admin', passwordHash, role: 'admin' }
      },
      { upsert: true }
    );
    console.log(`Administrator credentials configured for ${email}.`);
  }
  console.log(`Catalog seeded with ${products.length} sample products.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Unable to seed products:', error.message);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exitCode = 1;
});
