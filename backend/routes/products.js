const { Router } = require('express');
const { randomUUID } = require('crypto');
const { getPool } = require('../db');

const router = Router();

const mapProduct = (row) => ({
  id: row.id,
  nome: row.nome,
  categoria: row.categoria,
  estoque: row.estoque,
  price: row.price !== null ? Number(row.price) : 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows.map(mapProduct));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

router.post('/', async (req, res) => {
  const { nome, categoria, estoque, price } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'Field "nome" is required.' });
  }

  const normalizedEstoque = Number.isFinite(Number(estoque)) ? Number(estoque) : 0;
  const normalizedPrice = Number.isFinite(Number(price)) ? Number(price) : null;

  if (normalizedPrice === null) {
    return res.status(400).json({ error: 'Field "price" is required.' });
  }
  if (normalizedPrice < 0) {
    return res.status(400).json({ error: 'Field "price" must be zero or greater.' });
  }

  try {
    const pool = getPool();
    const id = randomUUID();
    await pool.execute(
      'INSERT INTO products (id, nome, categoria, estoque, price) VALUES (?, ?, ?, ?, ?)',
      [id, nome, categoria || null, normalizedEstoque, normalizedPrice],
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.status(201).json(mapProduct(rows[0]));
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nome, categoria, estoque, price } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'Field "nome" is required.' });
  }

  const normalizedEstoque = Number.isFinite(Number(estoque)) ? Number(estoque) : 0;
  const normalizedPrice = Number.isFinite(Number(price)) ? Number(price) : null;

  if (normalizedPrice === null) {
    return res.status(400).json({ error: 'Field "price" is required.' });
  }
  if (normalizedPrice < 0) {
    return res.status(400).json({ error: 'Field "price" must be zero or greater.' });
  }

  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'UPDATE products SET nome = ?, categoria = ?, estoque = ?, price = ? WHERE id = ?',
      [nome, categoria || null, normalizedEstoque, normalizedPrice, req.params.id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(mapProduct(rows[0]));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});

module.exports = router;
