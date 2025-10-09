const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool;

const initDatabase = async () => {
  if (pool) return pool;

  if (!dbConfig.database) {
    console.warn('DB_NAME is not defined. Update your .env file to enable the MySQL connection.');
    return null;
  }

  try {
    pool = await mysql.createPool(dbConfig);
    await pool.query('SELECT 1');
    console.log('MySQL connection established successfully.');
    return pool;
  } catch (error) {
    console.warn('Unable to connect to MySQL:', error.message);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialised. Call initDatabase() first.');
  }
  return pool;
};

const closePool = async () => {
  if (pool) {
    await pool.end().catch(() => null);
    pool = null;
  }
};

module.exports = {
  initDatabase,
  getPool,
  closePool,
  dbConfig,
};
