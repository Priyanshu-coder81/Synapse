import prisma from './config/prisma.js';

async function main() {
  try {
    console.log('Testing Prisma connection...');
    
    // Attempt a count on the User table (should be 0 or more)
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Current user count: ${userCount}`);
    
    // Try to create a dummy user just for validation (then delete it)
    console.log('Validating write access...');
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        username: `testuser-${Date.now()}`,
        password: 'temporary-password',
      },
    });
    console.log(`Successfully created test user: ${testUser.id}`);
    
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log('Successfully cleaned up test user.');
    
    console.log('Final check: Fetching all tables (indirectly)...');
    // Just a sanity check that we can access plural relations
    const guilds = await prisma.guild.count();
    console.log(`Guild count check: ${guilds}`);

    console.log('✅ ALL DATABASE CHECKS PASSED');
  } catch (error) {
    console.error('❌ DATABASE CHECK FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
