const request = require('supertest');
const app = require('../app');

describe('Anime API Tests', () => {
  let adminToken;
  let userToken;
  let testAnimeId;
  
  beforeAll(async () => {
    // Login as admin to get token
    const adminLogin = await request(app)
      .post('/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    adminToken = adminLogin.body.token;

    // Login as regular user
    const userLogin = await request(app)
      .post('/login')
      .send({
        username: 'jojofan',
        password: 'jojo123'
      });
    userToken = userLogin.body.token;
  });

  describe('GET /anime', () => {
    test('should return paginated anime list', async () => {
      const response = await request(app)
        .get('/anime')
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('total');
    });

    test('should filter by genre', async () => {
      const response = await request(app)
        .get('/anime?genre=Action')
        .expect(200);
      
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(anime => {
        expect(anime.genre).toMatch(/Action/i);
      });
    });

    test('should sort by rating descending', async () => {
      const response = await request(app)
        .get('/anime?sortBy=rating&sortOrder=DESC')
        .expect(200);
      
      const ratings = response.body.data.map(anime => anime.rating);
      for (let i = 0; i < ratings.length - 1; i++) {
        expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i + 1]);
      }
    });

    test('should search anime by title', async () => {
      const response = await request(app)
        .get('/anime?search=JoJo')
        .expect(200);
      
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(anime => {
        expect(anime.title.toLowerCase()).toMatch(/jojo/i);
      });
    });
  });

  describe('GET /anime/:id', () => {
    test('should return specific anime by ID', async () => {
      const response = await request(app)
        .get('/anime/1')
        .expect(200);
      
      expect(response.body).toHaveProperty('anime_id', 1);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('description');
    });

    test('should return 404 for non-existent anime', async () => {
      await request(app)
        .get('/anime/9999')
        .expect(404);
    });
  });

  describe('POST /anime', () => {
    test('should create new anime with admin token', async () => {
      const newAnime = {
        title: 'Test Anime ' + Date.now(),
        description: 'Test Description',
        genre: 'Action',
        episodes: 12,
        studio: 'Test Studio'
      };

      const response = await request(app)
        .post('/anime')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newAnime)
        .expect(201);
      
      expect(response.body).toHaveProperty('anime_id');
      testAnimeId = response.body.anime_id;
    });

    test('should reject creation without admin token', async () => {
      const newAnime = {
        title: 'Test Anime 2',
        description: 'Test Description',
        genre: 'Action',
        episodes: 12,
        studio: 'Test Studio'
      };

      await request(app)
        .post('/anime')
        .send(newAnime)
        .expect(401);
    });

    test('should reject creation with user token', async () => {
      const newAnime = {
        title: 'Test Anime 3',
        description: 'Test Description',
        genre: 'Action',
        episodes: 12,
        studio: 'Test Studio'
      };

      await request(app)
        .post('/anime')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newAnime)
        .expect(403);
    });
  });

  describe('PUT /anime/:id', () => {
    test('should update anime with admin token', async () => {
      const updateData = {
        title: 'Updated Test Anime',
        description: 'Updated Description',
        genre: 'Comedy',
        episodes: 24,
        studio: 'Updated Studio'
      };

      await request(app)
        .put(`/anime/${testAnimeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
    });

    test('should reject update without admin token', async () => {
      const updateData = {
        title: 'Updated Test Anime',
        description: 'Updated Description'
      };

      await request(app)
        .put(`/anime/${testAnimeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('DELETE /anime/:id', () => {
    test('should delete anime with admin token', async () => {
      await request(app)
        .delete(`/anime/${testAnimeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    test('should return 404 when deleting non-existent anime', async () => {
      await request(app)
        .delete('/anime/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});