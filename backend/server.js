const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

let dbPool;

const initDatabase = async () => {
  if (!dbConfig.database) {
    console.warn('DB_NAME is not defined. Update your .env file to enable the MySQL connection.');
    return;
  }

  try {
    dbPool = await mysql.createPool(dbConfig);
    await dbPool.query('SELECT 1');
    console.log('MySQL connection established successfully.');
  } catch (error) {
    console.warn('Unable to connect to MySQL:', error.message);
  }
};

initDatabase();

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ message: 'Backend da Vortex Projetos esta no ar! Conectado com sucesso.' });
});

app.get('/api/db/status', async (req, res) => {
  if (!dbPool) {
    return res.status(503).json({
      connected: false,
      error: 'Connection pool not initialised. Check environment variables.',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const [rows] = await dbPool.query('SELECT NOW() AS currentTime');
    return res.json({
      connected: true,
      serverTime: rows[0]?.currentTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

const shutdown = async () => {
  if (dbPool) {
    await dbPool.end().catch(() => null);
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.listen(PORT, () => {
  console.log('Servidor backend rodando na porta ' + PORT);
});
