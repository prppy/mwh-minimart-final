// Server/src/lib/db.js
import { PrismaClient } from '@prisma/client';

// Create Prisma client instance
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

// Database connection function
export async function connectDB() {
  try {
    console.log('Connecting to database...');
    
    // Test the connection
    await prisma.$connect();
    
    // Test with a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('Database connected successfully');
    
    // Handle graceful shutdown
    process.on('beforeExit', async () => {
      console.log('Disconnecting from database...');
      await prisma.$disconnect();
    });
    
    process.on('SIGINT', async () => {
      console.log('Disconnecting from database...');
      await prisma.$disconnect();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('Disconnecting from database...');
      await prisma.$disconnect();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Database connection failed:', error);
    console.error('Error code:', error.code);
    
    // Provide helpful error messages
    if (error.code === 'P1001') {
      console.log('\nDatabase connection troubleshooting:');
      console.log('1. Check if your Supabase project is active (not paused)');
      console.log('2. Verify DATABASE_URL in .env file');
      console.log('3. Ensure SSL mode is enabled (?sslmode=require)');
      console.log('4. Try the connection pooler URL (port 6543)');
    }
    
    throw error;
  }
}

// Export default prisma instance
export default prisma;