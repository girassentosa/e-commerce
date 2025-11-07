/**
 * Reset Admin Script
 * HARD DELETE all admin users from database
 * WARNING: This action is irreversible!
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAdmin() {
  try {
    console.log('🔍 Checking for existing admin users...');

    // Count existing admins
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    console.log(`📊 Found ${adminCount} admin user(s)`);

    if (adminCount === 0) {
      console.log('✅ No admin users to delete');
      return;
    }

    // Get admin details before deletion (for logging)
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    console.log('\n⚠️  ADMIN USERS TO BE DELETED:');
    admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.email} (${admin.firstName} ${admin.lastName}) - Created: ${admin.createdAt}`);
    });

    console.log('\n🗑️  Starting deletion process...');

    // Delete all admin users
    // Cascade delete will automatically remove related records (orders, cart, wishlist, etc.)
    const deleteResult = await prisma.user.deleteMany({
      where: { role: 'ADMIN' },
    });

    console.log(`✅ Successfully deleted ${deleteResult.count} admin user(s)`);
    console.log('✅ All related data (orders, cart, wishlist) cascade deleted');
    console.log('\n🎯 Next step: Run "npm run db:seed" to create new admin user');

  } catch (error) {
    console.error('❌ Error during admin reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
resetAdmin()
  .then(() => {
    console.log('\n✅ Admin reset completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Admin reset failed:', error);
    process.exit(1);
  });

