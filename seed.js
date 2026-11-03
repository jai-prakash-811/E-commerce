require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('./server/models/Product');
const User = require('./server/models/User');
const { CATEGORIES } = require('./shared/categories');

const baseImage = '/images/placeholder.svg';

const products = [
  // Sports Shoes (5 products)
  {
    name: 'Air Max Running Shoes',
    category: 'Sports Shoes',
    price: 4999,
    stock: 25,
    rating: 4.8,
    badge: 'Bestseller',
    featured: true,
    image: baseImage,
    description: 'Lightweight running shoes with responsive cushioning for daily training.',
    sizes: [7, 8, 9, 10, 11]
  },
  {
    name: 'Trailblazer Hiking Shoes',
    category: 'Sports Shoes',
    price: 5499,
    stock: 18,
    rating: 4.7,
    badge: 'New',
    featured: true,
    image: baseImage,
    description: 'Durable hiking shoes with superior grip and water-resistant upper.',
    sizes: [7, 8, 9, 10, 11]
  },
  {
    name: 'Court Master Tennis Shoes',
    category: 'Sports Shoes',
    price: 4299,
    stock: 22,
    rating: 4.6,
    badge: '',
    featured: false,
    image: baseImage,
    description: 'Stable tennis shoes with lateral support for quick court movements.',
    sizes: [7, 8, 9, 10, 11]
  },
  {
    name: 'Sprint Pro Track Spikes',
    category: 'Sports Shoes',
    price: 3799,
    stock: 15,
    rating: 4.9,
    badge: 'Pro Pick',
    featured: true,
    image: baseImage,
    description: 'Lightweight track spikes for explosive speed on the track.',
    sizes: [7, 8, 9, 10, 11]
  },
  {
    name: 'CrossFit Trainer X',
    category: 'Sports Shoes',
    price: 4599,
    stock: 20,
    rating: 4.7,
    badge: '',
    featured: false,
    image: baseImage,
    description: 'Versatile training shoes for lifting, running, and HIIT workouts.',
    sizes: [7, 8, 9, 10, 11]
  },

  // Sneakers (5 products)
  {
    name: 'Classic White Sneakers',
    category: 'Sneakers',
    price: 2999,
    stock: 40,
    rating: 4.8,
    badge: 'Essential',
    featured: true,
    image: baseImage,
    description: 'Clean minimalist sneakers that go with everything in your wardrobe.',
    sizes: [6, 7, 8, 9, 10, 11]
  },
  {
    name: 'Retro Runner Sneakers',
    category: 'Sneakers',
    price: 3499,
    stock: 30,
    rating: 4.7,
    badge: 'Trending',
    featured: true,
    image: baseImage,
    description: 'Vintage-inspired runners with modern comfort technology.',
    sizes: [6, 7, 8, 9, 10, 11]
  },
  {
    name: 'High-Top Canvas Sneakers',
    category: 'Sneakers',
    price: 2499,
    stock: 35,
    rating: 4.6,
    badge: '',
    featured: false,
    image: baseImage,
    description: 'Iconic high-top canvas sneakers with rubber toe cap.',
    sizes: [6, 7, 8, 9, 10, 11]
  },
  {
    name: 'Chunky Dad Sneakers',
    category: 'Sneakers',
    price: 3999,
    stock: 22,
    rating: 4.5,
    badge: 'Street Style',
    featured: false,
    image: baseImage,
    description: 'Bold chunky silhouette with layered construction and bold colors.',
    sizes: [7, 8, 9, 10, 11]
  },
  {
    name: 'Slip-On Knit Sneakers',
    category: 'Sneakers',
    price: 2799,
    stock: 28,
    rating: 4.7,
    badge: 'Comfort',
    featured: false,
    image: baseImage,
    description: 'Breathable knit upper with elastic collar for easy on/off wear.',
    sizes: [6, 7, 8, 9, 10, 11]
  },

  // Jackets (4 products)
  {
    name: 'Bomber Jacket Classic',
    category: 'Jackets',
    price: 4999,
    stock: 20,
    rating: 4.8,
    badge: 'Bestseller',
    featured: true,
    image: baseImage,
    description: 'Timeless bomber jacket with ribbed cuffs and hem.',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    name: 'Denim Trucker Jacket',
    category: 'Jackets',
    price: 4299,
    stock: 18,
    rating: 4.7,
    badge: '',
    featured: true,
    image: baseImage,
    description: 'Classic denim jacket with button-front and chest pockets.',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    name: 'Lightweight Windbreaker',
    category: 'Jackets',
    price: 3499,
    stock: 25,
    rating: 4.6,
    badge: 'Travel Ready',
    featured: false,
    image: baseImage,
    description: 'Packable windbreaker with water-repellent finish.',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    name: 'Leather Moto Jacket',
    category: 'Jackets',
    price: 8999,
    stock: 10,
    rating: 4.9,
    badge: 'Premium',
    featured: true,
    image: baseImage,
    description: 'Genuine leather moto jacket with asymmetric zip closure.',
    sizes: ['S', 'M', 'L', 'XL']
  },

  // Shirts (5 products)
  {
    name: 'Oxford Button-Down Shirt',
    category: 'Shirts',
    price: 2299,
    stock: 30,
    rating: 4.8,
    badge: 'Workwear',
    featured: true,
    image: baseImage,
    description: 'Classic Oxford cloth shirt with button-down collar.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    name: 'Linen Summer Shirt',
    category: 'Shirts',
    price: 2599,
    stock: 25,
    rating: 4.7,
    badge: 'Summer Essential',
    featured: true,
    image: baseImage,
    description: 'Breathable linen shirt in relaxed fit for hot days.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    name: 'Flannel Check Shirt',
    category: 'Shirts',
    price: 2199,
    stock: 28,
    rating: 4.6,
    badge: '',
    featured: false,
    image: baseImage,
    description: 'Soft brushed flannel shirt in classic check pattern.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    name: 'Chambray Work Shirt',
    category: 'Shirts',
    price: 2399,
    stock: 22,
    rating: 4.7,
    badge: '',
    featured: false,
    image: baseImage,
    description: 'Durable chambray shirt with double chest pockets.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    name: 'Silk-Cotton Dress Shirt',
    category: 'Shirts',
    price: 3499,
    stock: 15,
    rating: 4.8,
    badge: 'Premium',
    featured: false,
    image: baseImage,
    description: 'Luxurious silk-cotton blend for formal occasions.',
    sizes: ['S', 'M', 'L', 'XL']
  },

  // T-Shirts (5 products)
  {
    name: 'Heavyweight Crew Tee',
    category: 'T-Shirts',
    price: 899,
    stock: 50,
    rating: 4.9,
    badge: 'Essential',
    featured: true,
    image: baseImage,
    description: 'Premium heavyweight cotton tee that holds its shape.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  },
  {
    name: 'Vintage Graphic Tee',
    category: 'T-Shirts',
    price: 1199,
    stock: 35,
    rating: 4.7,
    badge: 'Limited',
    featured: true,
    image: baseImage,
    description: 'Retro-inspired graphic print on soft ring-spun cotton.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    name: 'Pocket Tee Basic',
    category: 'T-Shirts',
    price: 799,
    stock: 45,
    rating: 4.6,
    badge: '',
    featured: false,
    image: baseImage,
    description: 'Everyday pocket tee in 100% organic cotton.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  },
  {
    name: 'Longline Oversized Tee',
    category: 'T-Shirts',
    price: 999,
    stock: 30,
    rating: 4.5,
    badge: 'Street',
    featured: false,
    image: baseImage,
    description: 'Extended length oversized fit for layered looks.',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    name: 'Performance Moisture-Wick Tee',
    category: 'T-Shirts',
    price: 1299,
    stock: 25,
    rating: 4.8,
    badge: 'Active',
    featured: false,
    image: baseImage,
    description: 'Quick-dry technical fabric for workouts and active days.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },

  // Jeans (4 products)
  {
    name: 'Slim Fit Dark Wash Jeans',
    category: 'Jeans',
    price: 3299,
    stock: 30,
    rating: 4.8,
    badge: 'Bestseller',
    featured: true,
    image: baseImage,
    description: 'Modern slim fit in deep indigo with subtle stretch.',
    sizes: [28, 30, 32, 34, 36, 38]
  },
  {
    name: 'Relaxed Straight Leg Jeans',
    category: 'Jeans',
    price: 2999,
    stock: 28,
    rating: 4.7,
    badge: '',
    featured: true,
    image: baseImage,
    description: 'Comfortable straight leg cut in mid-wash denim.',
    sizes: [28, 30, 32, 34, 36, 38]
  },
  {
    name: 'Tapered Selvedge Jeans',
    category: 'Jeans',
    price: 4499,
    stock: 15,
    rating: 4.9,
    badge: 'Premium',
    featured: true,
    image: baseImage,
    description: 'Japanese selvedge denim with tapered fit and red-line edge.',
    sizes: [28, 30, 32, 34, 36]
  },
  {
    name: 'Distressed Light Wash Jeans',
    category: 'Jeans',
    price: 3199,
    stock: 22,
    rating: 4.6,
    badge: 'Trending',
    featured: false,
    image: baseImage,
    description: 'Vintage-style distressing on light wash stretch denim.',
    sizes: [28, 30, 32, 34, 36, 38]
  },

  // Trousers (4 products)
  {
    name: 'Wool Blend Dress Trousers',
    category: 'Trousers',
    price: 3499,
    stock: 20,
    rating: 4.8,
    badge: 'Formal',
    featured: true,
    image: baseImage,
    description: 'Tailored wool-blend trousers with permanent crease.',
    sizes: [28, 30, 32, 34, 36, 38]
  },
  {
    name: 'Chino Pants Classic',
    category: 'Trousers',
    price: 2499,
    stock: 30,
    rating: 4.7,
    badge: 'Versatile',
    featured: true,
    image: baseImage,
    description: 'Cotton twill chinos in classic fit for work or weekend.',
    sizes: [28, 30, 32, 34, 36, 38]
  },
  {
    name: 'Tech Stretch Trousers',
    category: 'Trousers',
    price: 2999,
    stock: 25,
    rating: 4.8,
    badge: 'Travel',
    featured: false,
    image: baseImage,
    description: 'Wrinkle-resistant 4-way stretch for all-day comfort.',
    sizes: [28, 30, 32, 34, 36, 38]
  },
  {
    name: 'Pleated Wide-Leg Trousers',
    category: 'Trousers',
    price: 3199,
    stock: 18,
    rating: 4.6,
    badge: 'Modern Fit',
    featured: false,
    image: baseImage,
    description: 'Contemporary wide-leg with front pleats in lightweight fabric.',
    sizes: [28, 30, 32, 34, 36]
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

  // Clear old products not in new categories
  await Product.deleteMany({ category: { $nin: CATEGORIES } });

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
  console.log(`Catalog seeded with ${products.length} sample products across ${CATEGORIES.length} categories.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Unable to seed products:', error.message);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exitCode = 1;
});