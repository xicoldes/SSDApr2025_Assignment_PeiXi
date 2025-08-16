require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const sql = require('mssql');
const { poolPromise } = require('./dbConfig');

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

// // Password Reset Route
// app.post('/reset-passwords', authController.resetAllPasswords);

// Auth Routes
app.post('/register', authController.register);
app.post('/login', authController.login);

// User Routes
app.get('/users', authenticate, authorize(['admin']), userController.getAllUsers);
app.get('/users/:id', authenticate, userController.getUserProfile);
app.put('/users/:id', authenticate, userController.updateProfile);
app.delete('/users/:id', authenticate, authorize(['admin']), userController.deleteUser);

// Anime Routes
app.get('/anime', animeController.getAllAnime);
app.get('/anime/:id', animeController.getAnimeById);
app.post('/anime', authenticate, authorize(['admin']), animeController.createAnime);
app.put('/anime/:id', authenticate, authorize(['admin']), animeController.updateAnime);
app.delete('/anime/:id', authenticate, authorize(['admin']), animeController.deleteAnime);

// Forum Routes
app.post('/threads', authenticate, forumController.createThread);
app.get('/threads/:anime_id', forumController.getThreadsByAnime);
app.put('/threads/:id', authenticate, forumController.updateThread);
app.delete('/threads/:id', authenticate, authorize(['admin']), forumController.deleteThread);

app.post('/comments', authenticate, forumController.createComment);
app.get('/comments/:thread_id', forumController.getComments);
app.put('/comments/:id/upvote', authenticate, forumController.upvoteComment);
app.delete('/comments/:id', authenticate, forumController.deleteComment);

// Watchlist Routes
app.post('/watchlist', authenticate, watchlistController.addToWatchlist);
app.get('/watchlist/:user_id', authenticate, watchlistController.getUserWatchlist);
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