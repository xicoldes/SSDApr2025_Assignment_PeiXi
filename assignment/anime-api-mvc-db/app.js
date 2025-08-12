require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const sql = require('mssql');
const userModel = require('./models/userModel');
const { poolPromise } = require('./dbConfig');

// Controllers
const authController = require('./controllers/authController');
const animeController = require('./controllers/animeController');
const forumController = require('./controllers/forumController');
const watchlistController = require('./controllers/watchlistController');
const userController = require('./controllers/userController');

// Middlewares
const { authenticate, authorize } = require('./middlewares/authMiddleware');


// Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// AUTH ROUTES
app.post('/register', authController.register);
app.post('/login', authController.login);

// USER ROUTES
app.get('/users/:id', authenticate, userController.getUserProfile);
app.put('/users/:id', authenticate, userController.updateProfile);
app.delete('/users/:id', authenticate, authorize(['admin']), userController.deleteUser); // NEW

// ANIME ROUTES
//---------------------
// Get all anime (now with pagination/filtering)
app.get('/anime', animeController.getAllAnime);
// Get anime by ID
app.get('/anime/:id', animeController.getAnimeById);
// Create anime route with authentication and authorization
app.post('/anime', authenticate, authorize(['admin']), animeController.createAnime);
// Update and delete routes for anime
app.put('/anime/:id', authenticate, authorize(['admin']), animeController.updateAnime);
app.delete('/anime/:id', authenticate, authorize(['admin']), animeController.deleteAnime);

// FORUM ROUTES
//---------------------
// Create a new thread
app.post('/threads', authenticate, forumController.createThread);
// Get all threads for a specific anime (now with pagination)
app.get('/threads/:anime_id', forumController.getThreadsByAnime);
// Update a thread (NEW)
app.put('/threads/:id', authenticate, forumController.updateThread);
// Delete a thread and comments within it (admin only)
app.delete('/threads/:id', authenticate, authorize(['admin']), forumController.deleteThread);

// Create a comment on a thread
app.post('/comments', authenticate, forumController.createComment);
// Get comments for a specific thread
app.get('/comments/:thread_id', forumController.getComments);
// Upvote a comment
app.put('/comments/:id/upvote', authenticate, forumController.upvoteComment);
// Delete a comment (NEW)
app.delete('/comments/:id', authenticate, forumController.deleteComment);

// WATCHLIST ROUTES
//---------------------
// Add to watchlist
app.post('/watchlist', authenticate, watchlistController.addToWatchlist);
// Get user watchlist (now with pagination/filtering)
app.get('/watchlist/:user_id', authenticate, watchlistController.getUserWatchlist);
// Update watchlist entry (NEW)
app.put('/watchlist/:anime_id', authenticate, watchlistController.updateWatchlistEntry);
// Remove from watchlist (NEW)
app.delete('/watchlist/:anime_id', authenticate, watchlistController.removeFromWatchlist);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});

module.exports = app; // Export app for testing