// tests/setup.js
const { sql } = require('../dbConfig');

// Clean up after all tests
afterAll(async () => {
  await sql.close();
});