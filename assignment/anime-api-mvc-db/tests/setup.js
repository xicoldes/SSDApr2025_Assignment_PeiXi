const request = require('supertest');
const app = require('../app');
const { poolPromise, sql } = require('../dbConfig');

describe('Watchlist API Tests', () => {
  let userToken;
  let userId;
  
  // Runs once before all tests
  beforeAll(async () => {
    // Verify database connection
    const pool = await poolPromise;
    await pool.request().query("SELECT 1 as test"); // Simple connection test
    
    // Login to get token
    const userLogin = await request(app)
      .post('/login')
      .send({
        username: 'jojofan',
        password: 'jojo123' // Make sure this matches your database
      });
    
    if (!userLogin.body.token || !userLogin.body.user) {
      throw new Error('Login failed in beforeAll setup');
    }
    
    userToken = userLogin.body.token;
    userId = userLogin.body.user.id;
  });

  // Runs before each test
  beforeEach(async () => {
    const pool = await poolPromise;
    // Reset any test-specific data here
    await pool.request()
      .query(`DELETE FROM user_anime_list WHERE user_id = ${userId}`);
    
    // Add baseline test data if needed
    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('anime_id', sql.Int, 1) // JoJo anime
      .input('status', sql.VarChar, 'completed')
      .query(`
        INSERT INTO user_anime_list (user_id, anime_id, status)
        VALUES (@user_id, @anime_id, @status)
      `);
  });

  // Runs after all tests
  afterAll(async () => {
    // Clean up any test data
    const pool = await poolPromise;
    await pool.request()
      .query(`DELETE FROM user_anime_list WHERE user_id = ${userId}`);
  });
  
});