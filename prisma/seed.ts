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
