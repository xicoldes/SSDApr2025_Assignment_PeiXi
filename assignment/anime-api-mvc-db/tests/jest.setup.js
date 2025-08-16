const request = require('supertest');
const app = require('../app');
const { poolPromise, sql } = require('../dbConfig');

// Store the server instance
let server;

// Global setup
module.exports = async () => {
  // Start the server on a random port for tests
  server = app.listen(0); // 0 means random available port
  
  // Verify database connection
  const pool = await poolPromise;
  await pool.request().query("SELECT 1 as test");
  
  // Login to get token
  const userLogin = await request(app)
    .post('/login')
    .send({
      username: 'jojofan',
      password: 'jojo123'
    });
  
  if (!userLogin.body.token || !userLogin.body.user) {
    throw new Error('Login failed in setup');
  }
  
  // Make these available to all tests
  global.__TEST_TOKEN__ = userLogin.body.token;
  global.__TEST_USER__ = userLogin.body.user;
};

// Add global teardown
module.exports.teardown = async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
};