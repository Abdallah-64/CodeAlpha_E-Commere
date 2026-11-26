import 'dotenv/config';
import bcrypt from 'bcryptjs';

import { connectDatabase } from '../config/database.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const seedCategories = [
  { name: 'Audio', description: 'Sound objects for focused listening.' },
  { name: 'Lighting', description: 'Architectural lighting for warm spaces.' },
  { name: 'Timepieces', description: 'Objects that mark time with restraint.' },
  { name: 'Objects', description: 'Functional forms for daily rituals.' }
];

const seedProducts = [
  { name: 'Aero Wireless Studio Headphones', description: 'Matte-black over-ear headphones with balanced wireless sound.', price: 280, category: 'Audio', images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85'] },
  { name: 'Brutalist Oak & Brass Lamp', description: 'A warm ambient desk lamp in solid oak and brushed brass.', price: 195, category: 'Lighting', images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85'] },
  { name: 'Chronos Automatic Watch', description: 'A charcoal-dial automatic timepiece with a supple black strap.', price: 420, category: 'Timepieces', images: ['https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=85'] },
  { name: 'Sculptural Ceramic Vessel', description: 'A quietly proportioned matte stoneware vessel.', price: 88, category: 'Objects', images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85'] }
];

export async function ensureAdminUser() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@lumen.local').toLowerCase();

  const accounts = [
    { name: 'Lumen Owner', email: adminEmail },
    { name: 'Store Owner', email: 'owner@lumen.local' }
  ];

  for (const account of accounts) {
    await User.findOneAndUpdate(
      { email: account.email },
      { name: account.name, email: account.email, password: hashedPassword, role: 'admin' },
      { upsert: true, new: true, runValidators: true }
    );
  }
}

export async function seedCatalog() {
  await connectDatabase();
  await ensureAdminUser();
  const categories = new Map();

  for (const categoryData of seedCategories) {
    const category = await Category.findOneAndUpdate(
      { name: categoryData.name },
      categoryData,
      { new: true, upsert: true, runValidators: true }
    );
    categories.set(category.name, category);
  }

  for (const productData of seedProducts) {
    const { category: categoryName, ...product } = productData;
    await Product.findOneAndUpdate(
      { name: product.name },
      { ...product, category: categories.get(categoryName)._id },
      { new: true, upsert: true, runValidators: true }
    );
  }

  console.log(`Seeded administrator and ${seedProducts.length} Lumen products.`);
}

if (process.argv[1] && process.argv[1].endsWith('seedCatalog.js')) {
  seedCatalog()
    .catch((error) => { console.error('Unable to seed catalog.', error); process.exitCode = 1; })
    .finally(async () => { await (await import('mongoose')).default.disconnect(); });
}
