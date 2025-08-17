# 🎌 Anime Community API

A comprehensive RESTful API for an anime community platform that enables users to discover anime, maintain personal watchlists, and participate in discussions. Built with Node.js, Express, and SQL Server.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)  
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Usage Examples](#usage-examples)
- [Contributing](#contributing)

## ✨ Features

### Core Functionality
- **User Authentication**: JWT-based registration and login system
- **Anime Management**: CRUD operations for anime database
- **Personal Watchlists**: Track anime with custom status and ratings
- **Forum System**: Create discussion threads and comments with nested replies
- **User Profiles**: Manage personal information and preferences

### Advanced Features  
- **Role-Based Access Control**: Admin and user permission levels
- **Advanced Filtering**: Search, sort, and paginate all major endpoints
- **Data Relationships**: Proper foreign key handling with cascade operations
- **Comprehensive Testing**: Full test suite with Jest and Supertest
- **API Documentation**: Interactive Swagger documentation
- **Error Handling**: Centralized error management with proper HTTP codes

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js  
- **Database**: Microsoft SQL Server
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Testing**: Jest, Supertest
- **Documentation**: Swagger UI
- **Logging**: Winston
- **Environment**: dotenv

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- Microsoft SQL Server
- npm or yarn package manager

### Clone Repository
```bash
git clone <repository-url>
cd anime-api-mvc-db
```

### Install Dependencies
```bash
npm install
```

## 🗄 Database Setup

1. **Create Database**: Run the provided SQL script
```bash
# Execute anime_db.sql in SQL Server Management Studio or similar tool
# This will create the database, tables, and insert sample data
```

2. **Database Schema**: The application uses 5 main tables:
   - `users` - User accounts and profiles
   - `anime` - Anime information and metadata
   - `user_anime_list` - Personal watchlists
   - `forum_threads` - Discussion threads  
   - `forum_comments` - Thread comments and replies

## ⚙ Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_USER=your_db_username
DB_PASSWORD=your_db_password  
DB_SERVER=your_server_name
DB_DATABASE=anime_db

# JWT Secret (use a secure random string)
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with debug information
npm run test:debug
```

The application will start on `http://localhost:3000`

## 📚 API Documentation

### Interactive Documentation
Visit `http://localhost:3000/api-docs` for the complete Swagger UI documentation.

### Quick Start Endpoints

#### Authentication
```bash
# Register new user
POST /register
Content-Type: application/json
{
  "username": "newuser",
  "email": "user@example.com", 
  "password": "password123"
}

# Login
POST /login
Content-Type: application/json
{
  "username": "admin",
  "password": "admin123"
}
```

#### Test Credentials
```
Admin: admin / admin123
User: jojofan / jojo123  
User: bleachlover / bleach123
```

#### Sample API Calls
```bash
# Get all anime with filtering
GET /anime?genre=Action&sortBy=rating&sortOrder=DESC&page=1&limit=5

# Add anime to watchlist
POST /watchlist
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
{
  "anime_id": 2,
  "status": "plan-to-watch"
}

# Create forum thread
POST /threads  
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
{
  "anime_id": 1,
  "title": "Best JoJo Stand Discussion",
  "content": "Which stand is most overpowered?"
}
```

## 🧪 Testing

The project includes comprehensive tests covering:

- **Authentication**: Registration, login, token validation
- **Anime CRUD**: Create, read, update, delete operations
- **Watchlist Management**: Add, update, remove anime from lists
- **Forum System**: Thread and comment functionality
- **Authorization**: Role-based access control

```bash
# Run specific test files
npm test auth.test.js
npm test anime.test.js
npm test watchlist.test.js
```

## 📁 Project Structure

```
anime-api-mvc-db/
├── controllers/          # Route handlers
│   ├── authController.js
│   ├── animeController.js
│   ├── forumController.js
│   ├── userController.js
│   └── watchlistController.js
├── logs/                # Application logs (generated)
├── middlewares/         # Custom middleware
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── models/              # Database interaction
│   ├── animeModel.js
│   ├── forumModel.js
│   └── userModel.js
├── node_modules/        # Dependencies (npm install)
├── public/              # Static files
│   ├── css/
│   │   └── nostromo.css
│   ├── html/
│   │   └── index.html
│   └── js/
│       └── nostromo.js
├── swagger/             # API documentation
│   ├── docs/           # Swagger documentation files
│   │   ├── anime.js
│   │   ├── auth.js
│   │   ├── forum.js
│   │   ├── static.js
│   │   ├── users.js
│   │   └── watchlist.js
│   └── index.js        # Swagger configuration
├── tests/               # Test suites
│   ├── anime.test.js
│   ├── auth.test.js
│   ├── jest.setup.js
│   └── watchlist.test.js
├── utils/               # Utility functions
│   └── logger.js
├── .env                 # Environment variables
├── .gitignore          # Git ignore rules
├── app.js              # Main application entry point
├── dbConfig.js         # Database configuration
├── package-lock.json   # Dependency lock file
├── package.json        # Project dependencies & scripts
├── postmanTestPrompts.txt # Postman testing guide
├── swagger.js          # Swagger setup
```

## 💻 Usage Examples

### Managing Watchlists
```javascript
// Add anime to watchlist
const response = await fetch('/watchlist', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    anime_id: 1,
    status: 'watching'
  })
});

// Update watchlist entry
await fetch('/watchlist/1', {
  method: 'PUT', 
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'completed',
    rating: 5,
    progress: 190
  })
});
```

### Forum Interactions
```javascript
// Create discussion thread
const thread = await fetch('/threads', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'  
  },
  body: JSON.stringify({
    anime_id: 1,
    title: 'Animation Quality Discussion',
    content: 'What did you think of the latest episode?'
  })
});

// Add comment to thread  
await fetch('/comments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    thread_id: 1,
    content: 'The animation was incredible!',
    parent_comment_id: null
  })
});
```

## 🔧 Advanced Features

### Filtering and Pagination
All major GET endpoints support advanced querying:

```bash
# Complex anime search
GET /anime?genre=Action&studio=MAPPA&search=titan&sortBy=rating&sortOrder=DESC&page=1&limit=10

# Filter user watchlist by status
GET /watchlist/2?status=completed&sortBy=title&sortOrder=ASC

# Get forum threads with pagination  
GET /threads/1?page=2&limit=5&sortBy=view_count&sortOrder=DESC
```

### Role-Based Access Control
- **Admin Users**: Full CRUD access to all resources
- **Regular Users**: Can manage their own data and participate in forums
- **Guest Access**: Public read access to anime data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Commit changes: `git commit -am 'Add feature'`
5. Push to branch: `git push origin feature-name`  
6. Submit a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is part of an academic assignment for the Server-Side Development course.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify SQL Server is running
- Check database credentials in `.env`
- Ensure database exists and is accessible

**JWT Token Errors** 
- Verify JWT_SECRET is set in environment
- Check token format in Authorization header: `Bearer <token>`

**Port Already in Use**
- Change PORT in `.env` file
- Kill existing process: `kill -9 $(lsof -ti:3000)`

For additional support, please check the logs in the `logs/` directory or create an issue in the repository.

---

**Made with ❤️ for the anime community** 🎌
