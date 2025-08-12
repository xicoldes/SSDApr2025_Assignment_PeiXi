const request = require('supertest');
const app = require('../app');

describe('Authentication Tests', () => {
  describe('POST /login', () => {
    test('should authenticate valid admin user', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'admin');
      expect(response.body.user).toHaveProperty('role', 'admin');
    });

    test('should authenticate valid regular user', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'jojofan',
          password: 'jojo123'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.username).toBe('jojofan');
      expect(response.body.user.role).toBe('user');
    });

    test('should reject invalid credentials', async () => {
      await request(app)
        .post('/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    test('should reject non-existent user', async () => {
      await request(app)
        .post('/login')
        .send({
          username: 'nonexistent',
          password: 'password'
        })
        .expect(401);
    });
  });

  describe('POST /register', () => {
    test('should create new user with unique username', async () => {
      const uniqueUsername = 'testuser' + Date.now();
      const newUser = {
        username: uniqueUsername,
        email: uniqueUsername + '@example.com',
        password: 'testpass123'
      };

      const response = await request(app)
        .post('/register')
        .send(newUser)
        .expect(200);
      
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(uniqueUsername);
      expect(response.body.user.role).toBe('user');
    });

    test('should reject duplicate username', async () => {
      await request(app)
        .post('/register')
        .send({
          username: 'admin',
          email: 'duplicate@example.com',
          password: 'password123'
        })
        .expect(400);
    });
  });
});