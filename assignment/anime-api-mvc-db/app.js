require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const sql = require('mssql');
const { poolPromise } = require('./dbConfig');

// Import Swagger configuration
const { swaggerUi, specs } = require('./swagger');

// ======================
// Middleware Setup
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files Configuration
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// ======================
// Swagger Documentation
// ======================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Anime Community API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// ======================
// Route Handlers
// ======================

/**
 * @swagger
 * /:
 *   get:
 *     summary: Serve the main application page
 *     tags: [Static]
 *     responses:
 *       200:
 *         description: HTML page served successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

// Import Controllers
const authController = require('./controllers/authController');
const animeController = require('./controllers/animeController');
const forumController = require('./controllers/forumController');
const watchlistController = require('./controllers/watchlistController');
const userController = require('./controllers/userController');
const { authenticate, authorize } = require('./middlewares/authMiddleware');

// ======================
// API Routes
// ======================

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             username: "newuser"
 *             email: "newuser@example.com"
 *             password: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
app.post('/register', authController.register);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate user and get JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *           example:
 *             username: "admin"
 *             password: "admin123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
app.post('/login', authController.login);

// User Routes
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with filtering and pagination (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, moderator, user]
 *         description: Filter by user role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in username and email
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [username, email, role, created_at]
 *           default: created_at
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
app.get('/users', authenticate, authorize(['admin']), userController.getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               bio:
 *                 type: string
 *           example:
 *             username: "updatedusername"
 *             email: "newemail@example.com"
 *             bio: "Updated bio"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
app.get('/users/:id', authenticate, userController.getUserProfile);
app.put('/users/:id', authenticate, userController.updateProfile);
app.delete('/users/:id', authenticate, authorize(['admin']), userController.deleteUser);

// Anime Routes
/**
 * @swagger
 * /anime:
 *   get:
 *     summary: Get all anime with advanced filtering, sorting, and pagination
 *     tags: [Anime]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre (partial match)
 *       - in: query
 *         name: studio
 *         schema:
 *           type: string
 *         description: Filter by animation studio (partial match)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, episodes, rating, release_date, created_at]
 *           default: title
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Anime list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Anime'
 *                     filters:
 *                       type: object
 *                       description: Applied filters and sorting
 *   post:
 *     summary: Create new anime (Admin only)
 *     tags: [Anime]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               genre:
 *                 type: string
 *               episodes:
 *                 type: integer
 *               studio:
 *                 type: string
 *           example:
 *             title: "Attack on Titan"
 *             description: "Humanity fights against giant humanoid Titans"
 *             genre: "Action, Drama"
 *             episodes: 75
 *             studio: "MAPPA"
 *     responses:
 *       201:
 *         description: Anime created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 anime_id:
 *                   type: integer
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
app.get('/anime', animeController.getAllAnime);
app.post('/anime', authenticate, authorize(['admin']), animeController.createAnime);

/**
 * @swagger
 * /anime/{id}:
 *   get:
 *     summary: Get anime by ID
 *     tags: [Anime]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     responses:
 *       200:
 *         description: Anime retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Anime'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update anime (Admin only)
 *     tags: [Anime]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               genre:
 *                 type: string
 *               episodes:
 *                 type: integer
 *               studio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Anime updated successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete anime and all related data (Admin only)
 *     tags: [Anime]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     responses:
 *       204:
 *         description: Anime deleted successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
app.get('/anime/:id', animeController.getAnimeById);
app.put('/anime/:id', authenticate, authorize(['admin']), animeController.updateAnime);
app.delete('/anime/:id', authenticate, authorize(['admin']), animeController.deleteAnime);

// Forum Routes
/**
 * @swagger
 * /threads:
 *   post:
 *     summary: Create a new discussion thread
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               anime_id:
 *                 type: integer
 *                 description: Related anime ID (optional for general discussions)
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *           example:
 *             anime_id: 1
 *             title: "Best JoJo Part Discussion"
 *             content: "Which JoJo part is your favorite and why?"
 *     responses:
 *       201:
 *         description: Thread created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 thread_id:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
app.post('/threads', authenticate, forumController.createThread);

/**
 * @swagger
 * /threads/{anime_id}:
 *   get:
 *     summary: Get all threads for a specific anime
 *     tags: [Forum]
 *     parameters:
 *       - in: path
 *         name: anime_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, title, view_count]
 *           default: created_at
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Threads retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Thread'
 */
app.get('/threads/:anime_id', forumController.getThreadsByAnime);

/**
 * @swagger
 * /threads/{id}:
 *   put:
 *     summary: Update thread (Owner or Admin only)
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Thread ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thread updated successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete thread (Admin only)
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Thread ID
 *     responses:
 *       204:
 *         description: Thread deleted successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
app.put('/threads/:id', authenticate, forumController.updateThread);
app.delete('/threads/:id', authenticate, authorize(['admin']), forumController.deleteThread);

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Add a comment to a thread
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [thread_id, content]
 *             properties:
 *               thread_id:
 *                 type: integer
 *               content:
 *                 type: string
 *               parent_comment_id:
 *                 type: integer
 *                 nullable: true
 *                 description: ID of parent comment for nested replies
 *           example:
 *             thread_id: 1
 *             content: "I think Star Platinum is the strongest stand!"
 *             parent_comment_id: null
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comment_id:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
app.post('/comments', authenticate, forumController.createComment);

/**
 * @swagger
 * /comments/{thread_id}:
 *   get:
 *     summary: Get all comments for a thread
 *     tags: [Forum]
 *     parameters:
 *       - in: path
 *         name: thread_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
app.get('/comments/:thread_id', forumController.getComments);

/**
 * @swagger
 * /comments/{id}/upvote:
 *   put:
 *     summary: Upvote a comment
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment upvoted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment upvoted"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
app.put('/comments/:id/upvote', authenticate, forumController.upvoteComment);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment (Owner or Admin only)
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       204:
 *         description: Comment deleted successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
app.delete('/comments/:id', authenticate, forumController.deleteComment);

// Watchlist Routes
/**
 * @swagger
 * /watchlist:
 *   post:
 *     summary: Add anime to user's watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [anime_id, status]
 *             properties:
 *               anime_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [watching, completed, on-hold, dropped, plan-to-watch]
 *           example:
 *             anime_id: 2
 *             status: "plan-to-watch"
 *     responses:
 *       201:
 *         description: Anime added to watchlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Added to watchlist"
 *       400:
 *         description: Anime already in watchlist
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
app.post('/watchlist', authenticate, watchlistController.addToWatchlist);

/**
 * @swagger
 * /watchlist/{user_id}:
 *   get:
 *     summary: Get user's watchlist with filtering and pagination
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [watching, completed, on-hold, dropped, plan-to-watch]
 *         description: Filter by watch status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [updated_at, title, rating]
 *           default: updated_at
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Watchlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Anime'
 *                           - $ref: '#/components/schemas/WatchlistEntry'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
app.get('/watchlist/:user_id', authenticate, watchlistController.getUserWatchlist);

/**
 * @swagger
 * /watchlist/{anime_id}:
 *   put:
 *     summary: Update watchlist entry
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: anime_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [watching, completed, on-hold, dropped, plan-to-watch]
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *               notes:
 *                 type: string
 *           example:
 *             status: "completed"
 *             rating: 4
 *             progress: 366
 *             notes: "Great anime, loved the Soul Society arc!"
 *     responses:
 *       200:
 *         description: Watchlist entry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Watchlist entry updated successfully"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Remove anime from watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: anime_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     responses:
 *       204:
 *         description: Anime removed from watchlist successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
app.put('/watchlist/:anime_id', authenticate, watchlistController.updateWatchlistEntry);
app.delete('/watchlist/:anime_id', authenticate, watchlistController.removeFromWatchlist);

// ======================
// Error Handling
// ======================
const { errorHandler } = require('./middlewares/errorMiddleware');
app.use(errorHandler);

// ======================
// Server Startup
// ======================
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("Server is gracefully shutting down");
  
  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
    });
  }
  
  try {
    await sql.close();
    console.log("Database connections closed");
  } catch (error) {
    console.error("Error closing database:", error);
  }
  
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

module.exports = app;