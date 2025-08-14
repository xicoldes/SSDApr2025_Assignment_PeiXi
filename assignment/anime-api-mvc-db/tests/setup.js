// tests/setup.js
const { sql } = require('../dbConfig');

// Set a longer timeout for database operations
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
  try {
    await sql.close();
    console.log('Database connections closed');
  } catch (error) {
    console.log('Error closing database connections:', error.message);
  }
  
  // Give some time for cleanup
  await new Promise(resolve => setTimeout(resolve, 1000));
});