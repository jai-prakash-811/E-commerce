const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  image: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  price: { type: Number, required: true, min: 1 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 4.8 },
  badge: { type: String, trim: true, maxlength: 40, default: '' },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
