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

// Middlewares
const { authenticate, authorize } = require('./middlewares/authMiddleware');

// Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.post('/register', authController.register);
app.post('/login', authController.login);

// // Test route to check admin user
// app.get('/test-admin', async (req, res) => {
//   try {
//     const admin = await userModel.findByUsername('admin');
    
//     if (!admin) {
//       return res.status(404).json({ 
//         error: 'Admin not found',
//         suggestion: 'Run the SQL query in the error details'
//       });
//     }

//     // Hide password hash in response
//     const { password_hash, ...safeAdmin } = admin; 
//     res.json(safeAdmin);

//   } catch (error) {
//     console.error('Test route error:', error);
//     res.status(500).json({ 
//       error: 'Server error',
//       details: error.message,
//       fix: "Make sure userModel.findByUsername() is properly implemented"
//     });
//   }
// });

// Anime Routes
app.get('/anime', animeController.getAllAnime);
app.get('/anime/:id', animeController.getAnimeById);
app.post('/anime', authenticate, authorize(['admin']), animeController.createAnime);

// Forum Routes
app.post('/threads', authenticate, forumController.createThread);
app.get('/threads/:anime_id', forumController.getThreadsByAnime);

// Watchlist Routes
app.post('/watchlist', authenticate, watchlistController.addToWatchlist);
app.get('/watchlist/:user_id', authenticate, watchlistController.getUserWatchlist);

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