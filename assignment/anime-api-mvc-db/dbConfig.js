const sql = require('mssql');
require('dotenv').config(); // Load environment variables first

// Define dbConfig as a separate constant
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// Create connection pool
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL');
    return pool;
  })
  .catch(err => {
    console.error('Database Connection Failed:', err);
    
    // Don't exit if we're in test environment
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    } else {
      // Just throw the error in test mode
      throw err;
    }
  });

// Export both the SQL library and pool promise
module.exports = {
  sql,
  poolPromise,
  dbConfig // Exporting config is optional but can be useful
};