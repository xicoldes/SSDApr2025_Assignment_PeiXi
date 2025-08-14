const request = require('supertest');
const app = require('../app');

describe('Watchlist API Tests', () => {
  let userToken;
  let userId;
  
  beforeAll(async () => {
    // Login as regular user
    const userLogin = await request(app)
      .post('/login')
      .send({
        username: 'jojofan',
        password: 'jojo123'
      });
    userToken = userLogin.body.token;
    userId = userLogin.body.user.id;
  });

  describe('POST /watchlist', () => {
    test('should add anime to watchlist', async () => {
      const watchlistEntry = {
        anime_id: 2, // Bleach
        status: 'plan-to-watch'
      };

      const response = await request(app)
        .post('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send(watchlistEntry)
        .expect(201);
      
      expect(response.body.message).toBe('Added to watchlist');
    });

    test('should reject duplicate watchlist entry', async () => {
      const watchlistEntry = {
        anime_id: 1, // JoJo (already in watchlist from seed data)
        status: 'watching'
      };

      await request(app)
        .post('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send(watchlistEntry)
        .expect(400);
    });

    test('should reject request without authentication', async () => {
      const watchlistEntry = {
        anime_id: 3,
        status: 'watching'
      };

      await request(app)
        .post('/watchlist')
        .send(watchlistEntry)
        .expect(401);
    });
  });

  describe('GET /watchlist/:user_id', () => {
    test('should get user watchlist with pagination', async () => {
      const response = await request(app)
        .get(`/watchlist/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter by status', async () => {
      const response = await request(app)
        .get(`/watchlist/${userId}?status=completed`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      response.body.data.forEach(entry => {
        expect(entry.status).toBe('completed');
      });
    });

    test('should sort by title ascending', async () => {
      const response = await request(app)
        .get(`/watchlist/${userId}?sortBy=title&sortOrder=ASC`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      const titles = response.body.data.map(entry => entry.title);
      
      // Only test sorting if we have more than one item
      if (titles.length > 1) {
        const sortedTitles = [...titles].sort((a, b) => a.localeCompare(b));
        expect(titles).toEqual(sortedTitles);
      } else {
        // If only one or no items, the test should pass
        expect(titles.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('PUT /watchlist/:anime_id', () => {
    test('should update watchlist entry', async () => {
      const updateData = {
        status: 'watching',
        rating: 4,
        progress: 5
      };

      const response = await request(app)
        .put('/watchlist/2') // Bleach
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.message).toBe('Watchlist entry updated successfully');
    });

    test('should return 404 for non-existent entry', async () => {
      const updateData = {
        status: 'completed'
      };

      await request(app)
        .put('/watchlist/999')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /watchlist/:anime_id', () => {
    test('should remove anime from watchlist', async () => {
      await request(app)
        .delete('/watchlist/2') // Remove Bleach
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);
    });

    test('should return 404 when removing non-existent entry', async () => {
      await request(app)
        .delete('/watchlist/999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});