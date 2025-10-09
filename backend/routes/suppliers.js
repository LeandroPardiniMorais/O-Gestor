const { Router } = require('express');
const { randomUUID } = require('crypto');
const { getPool } = require('../db');

const router = Router();

const mapSupplier = (row) => ({
  id: row.id,
  nome: row.nome,
  contato: row.contato,
  telefone: row.telefone,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY created_at DESC');
    res.json(rows.map(mapSupplier));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers', details: error.message });
  }
});

router.post('/', async (req, res) => {
  const { nome, contato, telefone } = req.body;
  if (!nome || !contato) {
    return res.status(400).json({ error: 'Fields "nome" and "contato" are required.' });
  }

  try {
    const pool = getPool();
    const id = randomUUID();
    await pool.execute(
      'INSERT INTO suppliers (id, nome, contato, telefone) VALUES (?, ?, ?, ?)',
      [id, nome, contato, telefone || null],
    );
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    res.status(201).json(mapSupplier(rows[0]));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Supplier with provided contact already exists.' });
    }
    res.status(500).json({ error: 'Failed to create supplier', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nome, contato, telefone } = req.body;
  if (!nome || !contato) {
    return res.status(400).json({ error: 'Fields "nome" and "contato" are required.' });
  }

  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'UPDATE suppliers SET nome = ?, contato = ?, telefone = ? WHERE id = ?',
      [nome, contato, telefone || null, req.params.id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    res.json(mapSupplier(rows[0]));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Supplier with provided contact already exists.' });
    }
    res.status(500).json({ error: 'Failed to update supplier', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete supplier', details: error.message });
  }
});

module.exports = router;
