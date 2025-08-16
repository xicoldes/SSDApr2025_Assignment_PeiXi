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
// Swagger Documentation Setup
// ======================
// Serve interactive API documentation at /api-docs endpoint
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

// Serve index.html at root
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

// Authentication Routes
app.post('/register', authController.register);
app.post('/login', authController.login);

// User Management Routes (Admin features)
app.get('/users', authenticate, authorize(['admin']), userController.getAllUsers);
app.get('/users/:id', authenticate, userController.getUserProfile);
app.put('/users/:id', authenticate, userController.updateProfile);
app.delete('/users/:id', authenticate, authorize(['admin']), userController.deleteUser);

// Anime Management Routes (CRUD operations)
app.get('/anime', animeController.getAllAnime);
app.get('/anime/:id', animeController.getAnimeById);
app.post('/anime', authenticate, authorize(['admin']), animeController.createAnime);
app.put('/anime/:id', authenticate, authorize(['admin']), animeController.updateAnime);
app.delete('/anime/:id', authenticate, authorize(['admin']), animeController.deleteAnime);

// Forum System Routes (Threads and Comments)
app.post('/threads', authenticate, forumController.createThread);
app.get('/threads/:anime_id', forumController.getThreadsByAnime);
app.put('/threads/:id', authenticate, forumController.updateThread);
app.delete('/threads/:id', authenticate, authorize(['admin']), forumController.deleteThread);

// Comment Routes
app.post('/comments', authenticate, forumController.createComment);
app.get('/comments/:thread_id', forumController.getComments);
app.put('/comments/:id/upvote', authenticate, forumController.upvoteComment);
app.delete('/comments/:id', authenticate, forumController.deleteComment);

// Watchlist Management Routes (Personal anime lists)
app.post('/watchlist', authenticate, watchlistController.addToWatchlist);
app.get('/watchlist/:user_id', authenticate, watchlistController.getUserWatchlist);
app.put('/watchlist/:anime_id', authenticate, watchlistController.updateWatchlistEntry);
app.delete('/watchlist/:anime_id', authenticate, watchlistController.removeFromWatchlist);

// ======================
// Error Handling Middleware
// ======================
const { errorHandler } = require('./middlewares/errorMiddleware');
app.use(errorHandler);

// ======================
// Server Startup and Configuration
// ======================
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🌐 Application: http://localhost:${PORT}`);
});

// ======================
// Graceful Shutdown Handler
// ======================
const gracefulShutdown = async () => {
  console.log("🔄 Server is gracefully shutting down...");
  
  // Close HTTP server
  if (server) {
    server.close(() => {
      console.log("✅ HTTP server closed");
    });
  }
  
  // Close database connections
  try {
    await sql.close();
    console.log("✅ Database connections closed");
  } catch (error) {
    console.error("❌ Error closing database:", error);
  }
  
  process.exit(0);
};

// Handle shutdown signals
process.on("SIGINT", gracefulShutdown);  // Ctrl+C
process.on("SIGTERM", gracefulShutdown); // Termination signal

module.exports = app;