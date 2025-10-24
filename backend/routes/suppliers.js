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

const mapSupplierProduct = (row) => ({
  id: row.id,
  supplierId: row.supplier_id,
  productId: row.product_id,
  productName: row.product_name,
  productCategory: row.product_category,
  currency: row.currency,
  referenceCode: row.reference_code,
  price: row.price !== null ? Number(row.price) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastPurchase: row.last_purchase_id
    ? {
        id: row.last_purchase_id,
        purchaseDate: row.last_purchase_date,
        quantity: row.last_purchase_quantity !== null ? Number(row.last_purchase_quantity) : null,
        unitPrice: row.last_purchase_unit_price !== null ? Number(row.last_purchase_unit_price) : null,
        totalPrice: row.last_purchase_total_price !== null ? Number(row.last_purchase_total_price) : null,
        notes: row.last_purchase_notes,
      }
    : null,
});

const mapSupplierPurchase = (row) => ({
  id: row.id,
  supplierId: row.supplier_id,
  productId: row.product_id,
  supplierProductId: row.supplier_product_id,
  purchaseDate: row.purchase_date,
  quantity: row.quantity !== null ? Number(row.quantity) : null,
  unitPrice: row.unit_price !== null ? Number(row.unit_price) : null,
  totalPrice: row.total_price !== null ? Number(row.total_price) : null,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  productName: row.product_name,
  productCategory: row.product_category,
});

const SUPPLIER_PRODUCT_SELECT = `
SELECT
  sp.id,
  sp.supplier_id,
  sp.product_id,
  p.nome AS product_name,
  p.categoria AS product_category,
  sp.currency,
  sp.reference_code,
  sp.price,
  sp.created_at,
  sp.updated_at,
  lp.id AS last_purchase_id,
  lp.purchase_date AS last_purchase_date,
  lp.quantity AS last_purchase_quantity,
  lp.unit_price AS last_purchase_unit_price,
  lp.total_price AS last_purchase_total_price,
  lp.notes AS last_purchase_notes
FROM supplier_products sp
JOIN products p ON p.id = sp.product_id
LEFT JOIN (
  SELECT
    spc.*,
    ROW_NUMBER() OVER (
      PARTITION BY spc.supplier_id, spc.product_id
      ORDER BY spc.purchase_date DESC, spc.created_at DESC, spc.id DESC
    ) AS rn
  FROM supplier_purchases spc
  WHERE spc.supplier_id = ?
) lp ON lp.supplier_id = sp.supplier_id AND lp.product_id = sp.product_id AND lp.rn = 1
WHERE sp.supplier_id = ?`;

const ensureSupplierExists = async (pool, supplierId) => {
  const [rows] = await pool.query('SELECT 1 FROM suppliers WHERE id = ? LIMIT 1', [supplierId]);
  return rows.length > 0;
};

const fetchSupplierProducts = async (pool, supplierId, filters = {}) => {
  const params = [supplierId, supplierId];
  let query = `${SUPPLIER_PRODUCT_SELECT}`;

  if (filters.supplierProductId) {
    query += ' AND sp.id = ?';
    params.push(filters.supplierProductId);
  }

  if (filters.productId) {
    query += ' AND sp.product_id = ?';
    params.push(filters.productId);
  }

  query += ' ORDER BY p.nome ASC';
  const [rows] = await pool.query(query, params);
  return rows.map(mapSupplierProduct);
};

const fetchSupplierProductById = async (pool, supplierId, supplierProductId) => {
  const products = await fetchSupplierProducts(pool, supplierId, { supplierProductId });
  return products[0] || null;
};

const fetchSupplierPurchaseById = async (pool, supplierId, purchaseId) => {
  const [rows] = await pool.query(
    `SELECT spc.*, p.nome AS product_name, p.categoria AS product_category
     FROM supplier_purchases spc
     JOIN products p ON p.id = spc.product_id
     WHERE spc.supplier_id = ? AND spc.id = ?`,
    [supplierId, purchaseId],
  );
  return rows[0] ? mapSupplierPurchase(rows[0]) : null;
};

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

router.get('/:supplierId/products', async (req, res) => {
  const { supplierId } = req.params;

  try {
    const pool = getPool();
    const exists = await ensureSupplierExists(pool, supplierId);
    if (!exists) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const products = await fetchSupplierProducts(pool, supplierId);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supplier products', details: error.message });
  }
});

router.post('/:supplierId/products', async (req, res) => {
  const { supplierId } = req.params;
  const { productId, price, currency, referenceCode } = req.body;

  if (!productId || price === undefined) {
    return res.status(400).json({ error: 'Fields "productId" and "price" are required.' });
  }

  const parsedPrice = Number(price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: 'Field "price" must be a positive number.' });
  }

  const currencyCode = (currency || 'BRL').toString().trim().toUpperCase();
  if (currencyCode.length !== 3) {
    return res.status(400).json({ error: 'Field "currency" must be a 3-letter code.' });
  }

  const reference = referenceCode ? referenceCode.toString().trim() || null : null;

  try {
    const pool = getPool();
    const exists = await ensureSupplierExists(pool, supplierId);
    if (!exists) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const [productRows] = await pool.query('SELECT id FROM products WHERE id = ? LIMIT 1', [productId]);
    if (!productRows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const id = randomUUID();
    await pool.execute(
      'INSERT INTO supplier_products (id, supplier_id, product_id, currency, reference_code, price) VALUES (?, ?, ?, ?, ?, ?)',
      [id, supplierId, productId, currencyCode, reference, parsedPrice],
    );

    const supplierProduct = await fetchSupplierProductById(pool, supplierId, id);
    res.status(201).json(supplierProduct);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Product already registered for this supplier.' });
    }
    res.status(500).json({ error: 'Failed to link product to supplier', details: error.message });
  }
});

router.put('/:supplierId/products/:supplierProductId', async (req, res) => {
  const { supplierId, supplierProductId } = req.params;
  const { price, currency, referenceCode } = req.body;

  if (price === undefined && currency === undefined && referenceCode === undefined) {
    return res.status(400).json({ error: 'Provide at least one field to update: price, currency, referenceCode.' });
  }

  const fields = [];
  const values = [];

  if (price !== undefined) {
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Field "price" must be a positive number.' });
    }
    fields.push('price = ?');
    values.push(parsedPrice);
  }

  if (currency !== undefined) {
    const currencyCode = currency.toString().trim().toUpperCase();
    if (currencyCode.length !== 3) {
      return res.status(400).json({ error: 'Field "currency" must be a 3-letter code.' });
    }
    fields.push('currency = ?');
    values.push(currencyCode);
  }

  if (referenceCode !== undefined) {
    const reference = referenceCode ? referenceCode.toString().trim() : null;
    fields.push('reference_code = ?');
    values.push(reference);
  }

  try {
    const pool = getPool();
    const exists = await ensureSupplierExists(pool, supplierId);
    if (!exists) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const [result] = await pool.execute(
      `UPDATE supplier_products SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE supplier_id = ? AND id = ?`,
      [...values, supplierId, supplierProductId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier product link not found' });
    }

    const supplierProduct = await fetchSupplierProductById(pool, supplierId, supplierProductId);
    res.json(supplierProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update supplier product', details: error.message });
  }
});

router.delete('/:supplierId/products/:supplierProductId', async (req, res) => {
  const { supplierId, supplierProductId } = req.params;

  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'DELETE FROM supplier_products WHERE supplier_id = ? AND id = ?',
      [supplierId, supplierProductId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier product link not found' });
    }

    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete supplier product', details: error.message });
  }
});

router.get('/:supplierId/purchases', async (req, res) => {
  const { supplierId } = req.params;
  const { productId, limit } = req.query;

  try {
    const pool = getPool();
    const exists = await ensureSupplierExists(pool, supplierId);
    if (!exists) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const params = [supplierId];
    let query = `SELECT spc.*, p.nome AS product_name, p.categoria AS product_category
      FROM supplier_purchases spc
      JOIN products p ON p.id = spc.product_id
      WHERE spc.supplier_id = ?`;

    if (productId) {
      query += ' AND spc.product_id = ?';
      params.push(productId);
    }

    let parsedLimit;
    if (limit !== undefined) {
      parsedLimit = Number(limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({ error: 'Query param "limit" must be a positive integer.' });
      }
    }

    query += ' ORDER BY spc.purchase_date DESC, spc.created_at DESC';
    if (parsedLimit) {
      query += ' LIMIT ?';
      params.push(parsedLimit);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows.map(mapSupplierPurchase));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supplier purchases', details: error.message });
  }
});

router.post('/:supplierId/purchases', async (req, res) => {
  const { supplierId } = req.params;
  const { productId, supplierProductId, purchaseDate, quantity, unitPrice, totalPrice, notes } = req.body;

  if (!productId || !purchaseDate || quantity === undefined || unitPrice === undefined) {
    return res.status(400).json({ error: 'Fields "productId", "purchaseDate", "quantity" and "unitPrice" are required.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
    return res.status(400).json({ error: 'Field "purchaseDate" must be in ISO format (YYYY-MM-DD).' });
  }

  const parsedQuantity = Number(quantity);
  if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({ error: 'Field "quantity" must be a positive integer.' });
  }

  const parsedUnitPrice = Number(unitPrice);
  if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
    return res.status(400).json({ error: 'Field "unitPrice" must be a positive number.' });
  }

  let parsedTotalPrice;
  if (totalPrice !== undefined) {
    parsedTotalPrice = Number(totalPrice);
    if (!Number.isFinite(parsedTotalPrice) || parsedTotalPrice < 0) {
      return res.status(400).json({ error: 'Field "totalPrice" must be a positive number when provided.' });
    }
  } else {
    parsedTotalPrice = Number((parsedQuantity * parsedUnitPrice).toFixed(2));
  }

  const sanitizedNotes = notes !== undefined ? notes.toString().trim() || null : null;

  try {
    const pool = getPool();
    const exists = await ensureSupplierExists(pool, supplierId);
    if (!exists) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const [productRows] = await pool.query('SELECT id FROM products WHERE id = ? LIMIT 1', [productId]);
    if (!productRows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let linkId = supplierProductId || null;
    if (linkId) {
      const supplierProduct = await fetchSupplierProductById(pool, supplierId, linkId);
      if (!supplierProduct) {
        return res.status(404).json({ error: 'Supplier product link not found' });
      }
      if (supplierProduct.productId !== productId) {
        return res.status(400).json({ error: 'Supplier product link does not match provided product.' });
      }
    } else {
      const linkedProducts = await fetchSupplierProducts(pool, supplierId, { productId });
      if (linkedProducts.length > 0) {
        linkId = linkedProducts[0].id;
      }
    }

    const id = randomUUID();
    await pool.execute(
      'INSERT INTO supplier_purchases (id, supplier_id, product_id, supplier_product_id, purchase_date, quantity, unit_price, total_price, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, supplierId, productId, linkId, purchaseDate, parsedQuantity, parsedUnitPrice, parsedTotalPrice, sanitizedNotes],
    );

    const purchase = await fetchSupplierPurchaseById(pool, supplierId, id);
    res.status(201).json(purchase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register supplier purchase', details: error.message });
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

