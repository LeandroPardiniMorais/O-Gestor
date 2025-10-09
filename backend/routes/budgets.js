const { Router } = require('express');
const { randomUUID } = require('crypto');
const { getPool } = require('../db');

const router = Router();

const STATUS_VALUES = new Set(['rascunho', 'enviado', 'aceito', 'recusado']);
const PRIORITY_VALUES = new Set(['baixa', 'media', 'alta']);
const SECTOR_KEYS = ['impressao', 'acabamento', 'pintura', 'montagem', 'revisao', 'logistica'];

const toISO = (value) => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
};

const mapPart = (row) => ({
  id: row.id,
  nome: row.nome,
  quantidade: row.quantidade,
  material: row.material,
  peso: row.peso !== null ? Number(row.peso) : null,
  tempoImpressao: row.tempo_impressao !== null ? Number(row.tempo_impressao) : null,
  custoAdicional: row.custo_adicional !== null ? Number(row.custo_adicional) : null,
  valorCalculado: row.valor_calculado !== null ? Number(row.valor_calculado) : null,
  createdAt: toISO(row.created_at),
  updatedAt: toISO(row.updated_at),
});

const mapItem = (row, parts = []) => {
  const mappedParts = parts.map(mapPart);
  const unitValue = mappedParts.reduce((sum, part) => {
    const partQuantity = part.quantidade !== null ? Number(part.quantidade) : 0;
    const partValue = part.valorCalculado !== null ? Number(part.valorCalculado) : 0;
    return sum + (partValue * partQuantity);
  }, 0);
  const productQuantity = row.quantidade !== null ? Number(row.quantidade) : 0;
  const totalValue = unitValue * productQuantity;

  return {
    id: row.id,
    nome: row.nome,
    quantidade: row.quantidade,
    montagem: row.montagem,
    pintura: row.pintura,
    createdAt: toISO(row.created_at),
    updatedAt: toISO(row.updated_at),
    partes: mappedParts,
    valorUnitario: Number(unitValue.toFixed(2)),
    valorTotal: Number(totalValue.toFixed(2)),
  };
};

const mapBudget = (row, items = [], productionPlan = null, sectors = []) => {
  const setorMap = {};
  sectors.forEach((sector) => {
    setorMap[sector.setor] = {
      status: sector.status,
      responsavel: sector.responsavel,
      inicioPrevisto: toISO(sector.inicio_previsto),
      terminoPrevisto: toISO(sector.termino_previsto),
      observacoes: sector.observacoes,
      percentual: sector.percentual !== null ? Number(sector.percentual) : null,
      createdAt: toISO(sector.created_at),
      updatedAt: toISO(sector.updated_at),
    };
  });

  const producao = productionPlan
    ? {
        id: productionPlan.id,
        resumo: productionPlan.resumo,
        setores: setorMap,
        createdAt: toISO(productionPlan.created_at),
        updatedAt: toISO(productionPlan.updated_at),
      }
    : null;

  return {
    id: row.id,
    codigo: row.codigo,
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome,
    status: row.status,
    total: Number(row.total),
    desconto: row.desconto !== null ? Number(row.desconto) : null,
    observacoes: row.observacoes,
    resumoDoProjeto: row.resumo_do_projeto,
    previsaoInicio: toISO(row.previsao_inicio),
    previsaoEntrega: toISO(row.previsao_entrega),
    responsavelProjeto: row.responsavel_projeto,
    prioridade: row.prioridade,
    etapaAtual: row.etapa_atual,
    createdAt: toISO(row.created_at),
    updatedAt: toISO(row.updated_at),
    itens: items.map((item) => mapItem(item.row, item.parts)),
    producao,
  };
};

const fetchBudgets = async (whereClause = '', params = []) => {
  const pool = getPool();
  const [budgetRows] = await pool.query(
    SELECT b.*, c.nome AS cliente_nome
     FROM budgets b
     JOIN clients c ON c.id = b.cliente_id
     
     ORDER BY b.created_at DESC,
    params,
  );

  if (budgetRows.length === 0) {
    return [];
  }

  const budgetIds = budgetRows.map((row) => row.id);
  const poolQueries = [];

  let itemRows = [];
  if (budgetIds.length) {
    const [rows] = await pool.query('SELECT * FROM budget_items WHERE budget_id IN (?) ORDER BY created_at', [budgetIds]);
    itemRows = rows;
  }

  const itemsByBudget = new Map();
  const itemMap = new Map();
  itemRows.forEach((row) => {
    const container = { row, parts: [] };
    itemMap.set(row.id, container);
    if (!itemsByBudget.has(row.budget_id)) {
      itemsByBudget.set(row.budget_id, []);
    }
    itemsByBudget.get(row.budget_id).push(container);
  });

  const itemIds = Array.from(itemMap.keys());
  if (itemIds.length) {
    const [partRows] = await pool.query('SELECT * FROM budget_parts WHERE item_id IN (?) ORDER BY created_at', [itemIds]);
    partRows.forEach((part) => {
      const item = itemMap.get(part.item_id);
      if (item) {
        item.parts.push(part);
      }
    });
  }

  let planRows = [];
  if (budgetIds.length) {
    const [rows] = await pool.query('SELECT * FROM production_plans WHERE budget_id IN (?)', [budgetIds]);
    planRows = rows;
  }

  const planByBudget = new Map();
  const planIds = [];
  planRows.forEach((plan) => {
    planByBudget.set(plan.budget_id, plan);
    planIds.push(plan.id);
  });

  const sectorsByPlan = new Map();
  if (planIds.length) {
    const [sectorRows] = await pool.query('SELECT * FROM production_sectors WHERE production_plan_id IN (?)', [planIds]);
    sectorRows.forEach((sector) => {
      if (!sectorsByPlan.has(sector.production_plan_id)) {
        sectorsByPlan.set(sector.production_plan_id, []);
      }
      sectorsByPlan.get(sector.production_plan_id).push(sector);
    });
  }

  return budgetRows.map((row) => {
    const items = itemsByBudget.get(row.id) || [];
    const plan = planByBudget.get(row.id) || null;
    const sectors = plan ? sectorsByPlan.get(plan.id) || [] : [];
    return mapBudget(row, items, plan, sectors);
  });
};

router.get('/', async (req, res) => {
  try {
    const budgets = await fetchBudgets();
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budgets', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const budgets = await fetchBudgets('WHERE b.id = ?', [req.params.id]);
    if (budgets.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json(budgets[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budget', details: error.message });
  }
});

router.post('/', async (req, res) => {
  const {
    codigo,
    clienteId,
    status = 'rascunho',
    total = 0,
    desconto,
    observacoes,
    resumoDoProjeto,
    previsaoInicio,
    previsaoEntrega,
    responsavelProjeto,
    prioridade = 'media',
    etapaAtual,
    itens = [],
    producao,
  } = req.body;

  if (!codigo || !clienteId) {
    return res.status(400).json({ error: 'Fields "codigo" and "clienteId" are required.' });
  }

  if (!STATUS_VALUES.has(status)) {
    return res.status(400).json({ error: Invalid status "". });
  }

  if (prioridade && !PRIORITY_VALUES.has(prioridade)) {
    return res.status(400).json({ error: Invalid priority "". });
  }

  const pool = getPool();
  const connection = await pool.getConnection();
  const budgetId = randomUUID();

  try {
    await connection.beginTransaction();

    await connection.execute(
      INSERT INTO budgets (
        id, codigo, cliente_id, status, total, desconto, observacoes, resumo_do_projeto,
        previsao_inicio, previsao_entrega, responsavel_projeto, prioridade, etapa_atual
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
      [
        budgetId,
        codigo,
        clienteId,
        status,
        Number(total),
        desconto !== undefined ? Number(desconto) : null,
        observacoes || null,
        resumoDoProjeto || null,
        previsaoInicio ? new Date(previsaoInicio) : null,
        previsaoEntrega ? new Date(previsaoEntrega) : null,
        responsavelProjeto || null,
        prioridade || 'media',
        etapaAtual || null,
      ],
    );

    for (const item of Array.isArray(itens) ? itens : []) {
      const itemId = randomUUID();
      await connection.execute(
        INSERT INTO budget_items (id, budget_id, nome, quantidade, montagem, pintura)
         VALUES (?, ?, ?, ?, ?, ?),
        [itemId, budgetId, item.nome || 'Item sem nome', Number(item.quantidade || 1), item.montagem || null, item.pintura || null],
      );

      if (Array.isArray(item.partes) && item.partes.length > 0) {
        for (const part of item.partes) {
          await connection.execute(
            INSERT INTO budget_parts (
              id, item_id, nome, quantidade, material, peso, tempo_impressao, custo_adicional, valor_calculado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?),
            [
              randomUUID(),
              itemId,
              part.nome || 'Parte sem nome',
              Number(part.quantidade || 1),
              part.material || null,
              part.peso !== undefined ? Number(part.peso) : null,
              part.tempoImpressao !== undefined ? Number(part.tempoImpressao) : null,
              part.custoAdicional !== undefined ? Number(part.custoAdicional) : null,
              part.valorCalculado !== undefined ? Number(part.valorCalculado) : null,
            ],
          );
        }
      }
    }

    let productionPlanId = null;
    if (producao && (producao.resumo || producao.setores)) {
      productionPlanId = randomUUID();
      await connection.execute(
        'INSERT INTO production_plans (id, budget_id, resumo) VALUES (?, ?, ?)',
        [productionPlanId, budgetId, producao.resumo || null],
      );

      if (producao.setores) {
        for (const setorKey of SECTOR_KEYS) {
          const sectorData = producao.setores[setorKey];
          if (!sectorData) continue;
          await connection.execute(
            INSERT INTO production_sectors (
              id, production_plan_id, setor, status, responsavel, inicio_previsto, termino_previsto, observacoes, percentual
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?),
            [
              randomUUID(),
              productionPlanId,
              setorKey,
              sectorData.status || 'Aguardando',
              sectorData.responsavel || null,
              sectorData.inicioPrevisto ? new Date(sectorData.inicioPrevisto) : null,
              sectorData.terminoPrevisto ? new Date(sectorData.terminoPrevisto) : null,
              sectorData.observacoes || null,
              sectorData.percentual !== undefined ? Number(sectorData.percentual) : null,
            ],
          );
        }
      }
    }

    await connection.commit();

    const budgets = await fetchBudgets('WHERE b.id = ?', [budgetId]);
    res.status(201).json(budgets[0] || null);
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Budget code already exists.' });
    }
    res.status(500).json({ error: 'Failed to create budget', details: error.message });
  } finally {
    connection.release();
  }
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!STATUS_VALUES.has(status)) {
    return res.status(400).json({ error: Invalid status "". });
  }

  try {
    const pool = getPool();
    const [result] = await pool.execute('UPDATE budgets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json({ id: req.params.id, status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update budget status', details: error.message });
  }
});

module.exports = router;

