const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    // Test the connection
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Database connection successful!');
    
    // Count users
    const userCount = await prisma.user.count();
    console.log(`Number of users in the database: ${userCount}`);
    
    if (userCount > 0) {
      // Get first user
      const firstUser = await prisma.user.findFirst();
      console.log('Sample user:', {
        id: firstUser.id,
        email: firstUser.email,
        role: firstUser.role,
        status: firstUser.status
      });
    }
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();