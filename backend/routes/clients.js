const { Router } = require('express');
const { randomUUID } = require('crypto');
const { getPool } = require('../db');

const router = Router();

const mapClient = (row) => ({
  id: row.id,
  nome: row.nome,
  endereco: row.endereco,
  cpf: row.cpf,
  telefone: row.telefone,
  email: row.email,
  nomeEmpresa: row.nome_empresa,
  cnpj: row.cnpj,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(rows.map(mapClient));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(mapClient(rows[0]));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client', details: error.message });
  }
});

router.post('/', async (req, res) => {
  const { nome, endereco, cpf, telefone, email, nomeEmpresa, cnpj } = req.body;

  if (!nome || !endereco) {
    return res.status(400).json({ error: 'Fields "nome" and "endereco" are required.' });
  }

  try {
    const pool = getPool();
    const id = randomUUID();
    await pool.execute(
      INSERT INTO clients (id, nome, endereco, cpf, telefone, email, nome_empresa, cnpj)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?),
      [id, nome, endereco, cpf || null, telefone || null, email || null, nomeEmpresa || null, cnpj || null],
    );

    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
    res.status(201).json(mapClient(rows[0]));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Client with provided document or email already exists.' });
    }
    res.status(500).json({ error: 'Failed to create client', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nome, endereco, cpf, telefone, email, nomeEmpresa, cnpj } = req.body;

  if (!nome || !endereco) {
    return res.status(400).json({ error: 'Fields "nome" and "endereco" are required.' });
  }

  try {
    const pool = getPool();
    const [result] = await pool.execute(
      UPDATE clients
       SET nome = ?, endereco = ?, cpf = ?, telefone = ?, email = ?, nome_empresa = ?, cnpj = ?
       WHERE id = ?,
      [nome, endereco, cpf || null, telefone || null, email || null, nomeEmpresa || null, cnpj || null, req.params.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    res.json(mapClient(rows[0]));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Client with provided document or email already exists.' });
    }
    res.status(500).json({ error: 'Failed to update client', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute('DELETE FROM clients WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete client', details: error.message });
  }
});

module.exports = router;
