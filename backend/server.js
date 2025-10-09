const express = require('express');
const cors = require('cors');
const { initDatabase, getPool, closePool } = require('./db');

const clientsRouter = require('./routes/clients');
const suppliersRouter = require('./routes/suppliers');
const productsRouter = require('./routes/products');
const budgetsRouter = require('./routes/budgets');

const app = express();
const PORT = process.env.PORT || 3001;

initDatabase().catch((error) => {
  console.warn('Initial MySQL connection failed:', error.message);
});

app.use(cors());
app.use(express.json());

app.use('/api/clients', clientsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/products', productsRouter);
app.use('/api/budgets', budgetsRouter);

app.get('/api', (req, res) => {
  res.json({ message: 'Backend da Vortex Projetos esta no ar! Conectado com sucesso.' });
});

app.get('/api/db/status', async (req, res) => {
  let pool;
  try {
    pool = getPool();
  } catch (error) {
    return res.status(503).json({
      connected: false,
      error: 'Connection pool not initialised. Check environment variables.',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const [rows] = await pool.query('SELECT NOW() AS currentTime');
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
  await closePool();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.listen(PORT, () => {
  console.log(Servidor backend rodando na porta );
});
