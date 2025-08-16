# SSDApr2025_Assignment_PeiXi

# 🎌 Anime Forum API

A comprehensive RESTful API for an anime community platform built with Node.js, Express, and SQL Server. Features user authentication, anime database management, discussion forums, and personal watchlists.

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Database Setup](#-database-setup)
- [Environment Configuration](#-environment-configuration)
- [API Endpoints](#-api-endpoints)
- [Authentication](#-authentication)
- [Testing](#-testing)
- [Advanced Features](#-advanced-features)
- [Error Handling](#-error-handling)
- [Contributing](#-contributing)

## ✨ Features

### Core Functionality
- 🔐 **User Authentication & Authorization** - JWT-based auth with role-based access control
- 🎬 **Anime Management** - Full CRUD operations for anime database
- 💬 **Forum System** - Discussion threads with nested comments and upvoting
- 📝 **Personal Watchlists** - Track anime with status, progress, and ratings
- 👤 **User Profiles** - Account management and customization

### Advanced Features
- 🔍 **Advanced Search & Filtering** - Multi-field search with filters
- 📊 **Pagination & Sorting** - Efficient data handling for large datasets
- 🛡️ **Role-Based Access Control** - Admin, moderator, and user roles
- 📝 **Comprehensive Logging** - Winston-based logging with file rotation
- 🧪 **Automated Testing** - Jest test suite with 95%+ coverage
- 🚨 **Error Handling** - Centralized error management with proper HTTP codes

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQL Server** - Primary database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Testing & Development
- **Jest** - Testing framework
- **Supertest** - HTTP assertions
- **Winston** - Logging library
- **dotenv** - Environment configuration

## 📁 Project Structure

```
anime-api-mvc-db/
├── controllers/          # Request handlers
│   ├── authController.js     # Authentication logic
│   ├── animeController.js    # Anime CRUD operations
│   ├── forumController.js    # Forum management
│   ├── userController.js     # User management
│   └── watchlistController.js # Watchlist operations
├── models/               # Data models
│   ├── userModel.js
│   ├── animeModel.js
│   └── forumModel.js
├── middlewares/          # Custom middleware
│   ├── authMiddleware.js     # Authentication & authorization
│   └── errorMiddleware.js    # Error handling
├── tests/                # Test suites
│   ├── auth.test.js
│   ├── anime.test.js
│   └── watchlist.test.js
├── utils/                # Utilities
│   └── logger.js            # Winston logger configuration
├── public/               # Static files
├── logs/                 # Log files
├── app.js                # Application entry point
├── dbConfig.js           # Database configuration
└── package.json
```

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- SQL Server (2019 or higher)
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd anime-api-mvc-db
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

4. **Set up the database**
   ```bash
   # Run the SQL script in SQL Server Management Studio
   # File: anime_db.sql
   ```

5. **Start the application**
   ```bash
   npm start
   ```

## 🗄️ Database Setup

### Database Schema

The application uses 5 interconnected tables:

- **users** - User accounts and authentication
- **anime** - Anime database with metadata
- **user_anime_list** - Personal watchlists
- **forum_threads** - Discussion topics
- **forum_comments** - Thread replies with nested support

### Sample Data

The database includes test data:
- 3 sample users (admin, jojofan, bleachlover)
- 3 anime entries (JoJo, Bleach, Naruto)
- Sample forum threads and comments

## ⚙️ Environment Configuration

Create a `.env` file with the following variables:

```env
# Database Configuration
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_SERVER=localhost
DB_DATABASE=anime_db

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Logging Configuration
LOG_LEVEL=info
```

## 🔌 API Endpoints

### 🔐 Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Create new user account | No |
| POST | `/login` | Authenticate user | No |

### 👤 User Management Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | Get all users (with filters) | Admin |
| GET | `/users/:id` | Get user profile | Yes |
| PUT | `/users/:id` | Update user profile | Yes |
| DELETE | `/users/:id` | Delete user account | Admin |

### 🎬 Anime Management Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/anime` | List all anime (with advanced features) | No |
| GET | `/anime/:id` | Get specific anime | No |
| POST | `/anime` | Create new anime | Admin |
| PUT | `/anime/:id` | Update anime | Admin |
| DELETE | `/anime/:id` | Delete anime | Admin |

### 💬 Forum System Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/threads` | Create discussion thread | Yes |
| GET | `/threads/:anime_id` | Get threads for anime | No |
| PUT | `/threads/:id` | Update thread | Yes (Owner/Admin) |
| DELETE | `/threads/:id` | Delete thread | Admin |
| POST | `/comments` | Add comment to thread | Yes |
| GET | `/comments/:thread_id` | Get thread comments | No |
| PUT | `/comments/:id/upvote` | Upvote comment | Yes |
| DELETE | `/comments/:id` | Delete comment | Yes (Owner/Admin) |

### 📝 Watchlist Management Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/watchlist` | Add anime to watchlist | Yes |
| GET | `/watchlist/:user_id` | Get user's watchlist | Yes |
| PUT | `/watchlist/:anime_id` | Update watchlist entry | Yes |
| DELETE | `/watchlist/:anime_id` | Remove from watchlist | Yes |

## 🔐 Authentication

### JWT Token Usage

1. **Register or Login** to receive a JWT token
2. **Include token** in Authorization header: `Bearer <your_jwt_token>`
3. **Token expires** in 1 hour (configurable)

### User Roles

- **admin** - Full system access, can manage all content
- **moderator** - Can moderate forum content
- **user** - Standard user permissions

### Example Authentication Flow

```javascript
// 1. Login
POST /login
{
  "username": "admin",
  "password": "admin123"
}

// 2. Response includes token
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "username": "admin", "role": "admin" }
}

// 3. Use token in subsequent requests
GET /anime
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with verbose output
npm run test:debug
```

### Test Coverage

- ✅ Authentication tests (registration, login, token validation)
- ✅ Anime CRUD operations (create, read, update, delete)
- ✅ Forum system tests (threads, comments, upvotes)
- ✅ Watchlist management tests
- ✅ Authorization and security tests
- ✅ Error handling tests

### Test Users

```javascript
// Available test accounts
{
  admin: { username: "admin", password: "admin123", role: "admin" },
  user1: { username: "jojofan", password: "jojo123", role: "user" },
  user2: { username: "bleachlover", password: "bleach123", role: "user" }
}
```

## 🚀 Advanced Features

### 1. Filtering & Search
```javascript
// Filter anime by genre and studio
GET /anime?genre=Action&studio=David

// Search across title and description
GET /anime?search=JoJo

// Combine filters
GET /anime?genre=Action&search=adventure&studio=MAPPA
```

### 2. Pagination
```javascript
// Basic pagination
GET /anime?page=1&limit=10

// With total count and metadata
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. Sorting
```javascript
// Sort by rating (descending)
GET /anime?sortBy=rating&sortOrder=DESC

// Sort by title (ascending)  
GET /anime?sortBy=title&sortOrder=ASC

// Available sort fields: title, rating, episodes, release_date, created_at
```

### 4. Advanced Queries
```javascript
// Complex anime query
GET /anime?page=2&limit=5&genre=Action&studio=David&sortBy=rating&sortOrder=DESC&search=adventure

// User management with filters
GET /users?role=user&search=jojo&sortBy=created_at&sortOrder=DESC

// Watchlist with status filter
GET /watchlist/2?status=completed&sortBy=title&sortOrder=ASC
```

## 🚨 Error Handling

### HTTP Status Codes

- **200 OK** - Successful GET, PUT operations
- **201 Created** - Successful POST operations
- **204 No Content** - Successful DELETE operations
- **400 Bad Request** - Validation errors, malformed requests
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Duplicate data conflicts
- **500 Internal Server Error** - Server-side errors

### Error Response Format

```javascript
{
  "success": false,
  "error": "Error message description",
  "details": "Additional error details (development only)"
}
```

### Logging

- **Error logs** - `logs/error.log`
- **Combined logs** - `logs/combined.log`
- **Console output** - Development environment only
- **Log rotation** - Automatic file rotation at 5MB

## 📖 API Documentation Examples

### Register New User
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "password123"
  }'
```

### Get Anime with Filters
```bash
curl -X GET "http://localhost:3000/anime?genre=Action&sortBy=rating&sortOrder=DESC&page=1&limit=5"
```

### Create Anime (Admin Only)
```bash
curl -X POST http://localhost:3000/anime \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "New Anime",
    "description": "Description here",
    "genre": "Action",
    "episodes": 24,
    "studio": "Studio Name"
  }'
```

### Add to Watchlist
```bash
curl -X POST http://localhost:3000/watchlist \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "anime_id": 1,
    "status": "watching"
  }'
```

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit a pull request

### Code Style Guidelines

- Use ES6+ features
- Follow RESTful API conventions
- Write comprehensive tests for new features
- Include proper error handling
- Add JSDoc comments for functions
- Use meaningful variable and function names

### Database Changes

- Update schema in `anime_db.sql`
- Update models and controllers accordingly
- Add migration scripts if needed
- Update tests to reflect changes

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- Node.js community for excellent documentation
- Express.js for the robust web framework
- Microsoft SQL Server team for database support
- Jest community for testing framework
- All contributors who helped improve this project

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [JWT.io](https://jwt.io/) - JWT token debugger
- [SQL Server Documentation](https://docs.microsoft.com/en-us/sql/sql-server/)
- [Jest Testing Documentation](https://jestjs.io/docs/getting-started)
- [RESTful API Design Guidelines](https://restfulapi.net/)

---

**Built with ❤️ for the anime community**
