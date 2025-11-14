/**
 * Prisma Database Seed Script
 * Creates initial data for development/testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create NEW Admin User
  const adminEmail = 'admin@ecommerce.com';
  const adminPassword = 'AdminPass2024!';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists:', adminEmail);
  } else {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'ADMIN',
        emailVerified: true,
        isActive: true,
      },
    });
    console.log('✅ Admin user created:', admin.email);
    console.log('   📧 Email:', adminEmail);
    console.log('   🔑 Password:', adminPassword);
    console.log('   👤 Name: Super Admin');
  }

  // 2. Create Test Customer User (optional)
  const customerEmail = 'customer@example.com';
  const customerPassword = 'Customer123!';
  const customerPasswordHash = await bcrypt.hash(customerPassword, 10);

  const existingCustomer = await prisma.user.findUnique({
    where: { email: customerEmail },
  });

  if (existingCustomer) {
    console.log('✅ Customer user already exists:', customerEmail);
  } else {
    const customer = await prisma.user.create({
      data: {
        email: customerEmail,
        passwordHash: customerPasswordHash,
        firstName: 'Test',
        lastName: 'Customer',
        role: 'CUSTOMER',
        emailVerified: true,
        isActive: true,
      },
    });
    console.log('✅ Customer user created:', customer.email);
    console.log('   Email:', customerEmail);
    console.log('   Password:', customerPassword);
  }

  // 3. Create Categories
  console.log('📦 Creating categories...');
  const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets' },
    { name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories' },
    { name: 'Home & Living', slug: 'home-living', description: 'Home decor and furniture' },
    { name: 'Sports', slug: 'sports', description: 'Sports equipment and gear' },
    { name: 'Books', slug: 'books', description: 'Books and literature' },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });
    if (existing) {
      console.log(`✅ Category already exists: ${cat.name}`);
      createdCategories.push(existing);
    } else {
      const category = await prisma.category.create({
        data: cat,
      });
      console.log(`✅ Category created: ${category.name}`);
      createdCategories.push(category);
    }
  }

  // 4. Create Sample Products
  console.log('🛍️ Creating sample products...');
  const products = [
    {
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      categoryId: createdCategories[0].id,
      description: 'High-quality wireless headphones with noise cancellation',
      price: 299.99,
      salePrice: 249.99,
      stockQuantity: 50,
      sku: 'WH-001',
      brand: 'AudioTech',
      isFeatured: true,
      images: [
        { url: '/images/products/headphones.jpg', altText: 'Wireless Headphones', isPrimary: true },
      ],
    },
    {
      name: 'Smart Watch',
      slug: 'smart-watch',
      categoryId: createdCategories[0].id,
      description: 'Feature-rich smartwatch with health tracking',
      price: 399.99,
      stockQuantity: 30,
      sku: 'SW-001',
      brand: 'TechWear',
      isFeatured: true,
      images: [
        { url: '/images/products/smartwatch.jpg', altText: 'Smart Watch', isPrimary: true },
      ],
    },
    {
      name: 'Cotton T-Shirt',
      slug: 'cotton-tshirt',
      categoryId: createdCategories[1].id,
      description: 'Comfortable 100% cotton t-shirt',
      price: 29.99,
      salePrice: 19.99,
      stockQuantity: 100,
      sku: 'TS-001',
      brand: 'FashionCo',
      images: [
        { url: '/images/products/tshirt.jpg', altText: 'Cotton T-Shirt', isPrimary: true },
      ],
      variants: [
        { name: 'Size', value: 'S', priceModifier: 0, stockQuantity: 25 },
        { name: 'Size', value: 'M', priceModifier: 0, stockQuantity: 30 },
        { name: 'Size', value: 'L', priceModifier: 0, stockQuantity: 25 },
        { name: 'Size', value: 'XL', priceModifier: 5, stockQuantity: 20 },
      ],
    },
    {
      name: 'Coffee Table',
      slug: 'coffee-table',
      categoryId: createdCategories[2].id,
      description: 'Modern wooden coffee table for your living room',
      price: 199.99,
      stockQuantity: 15,
      sku: 'CT-001',
      brand: 'HomeStyle',
      isFeatured: true,
      images: [
        { url: '/images/products/coffee-table.jpg', altText: 'Coffee Table', isPrimary: true },
      ],
    },
    {
      name: 'Running Shoes',
      slug: 'running-shoes',
      categoryId: createdCategories[3].id,
      description: 'Comfortable running shoes for daily exercise',
      price: 129.99,
      salePrice: 99.99,
      stockQuantity: 40,
      sku: 'RS-001',
      brand: 'SportMax',
      images: [
        { url: '/images/products/running-shoes.jpg', altText: 'Running Shoes', isPrimary: true },
      ],
      variants: [
        { name: 'Size', value: '40', priceModifier: 0, stockQuantity: 10 },
        { name: 'Size', value: '41', priceModifier: 0, stockQuantity: 10 },
        { name: 'Size', value: '42', priceModifier: 0, stockQuantity: 10 },
        { name: 'Size', value: '43', priceModifier: 0, stockQuantity: 10 },
      ],
    },
    {
      name: 'Programming Book',
      slug: 'programming-book',
      categoryId: createdCategories[4].id,
      description: 'Complete guide to modern web development',
      price: 49.99,
      stockQuantity: 25,
      sku: 'BK-001',
      brand: 'TechBooks',
      images: [
        { url: '/images/products/book.jpg', altText: 'Programming Book', isPrimary: true },
      ],
    },
  ];

  for (const productData of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: productData.slug },
    });
    if (existing) {
      console.log(`✅ Product already exists: ${productData.name}`);
    } else {
      const { images, variants, ...productFields } = productData;
      const product = await prisma.product.create({
        data: {
          ...productFields,
          images: images
            ? {
                create: images.map((img, index) => ({
                  imageUrl: img.url,
                  altText: img.altText,
                  isPrimary: img.isPrimary ?? index === 0,
                  sortOrder: index,
                })),
              }
            : undefined,
          variants: variants
            ? {
                create: variants.map((variant) => ({
                  name: variant.name,
                  value: variant.value,
                  priceModifier: variant.priceModifier,
                  stockQuantity: variant.stockQuantity,
                })),
              }
            : undefined,
        },
      });
      console.log(`✅ Product created: ${product.name}`);
    }
  }

  console.log('🌱 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
