import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NovoOrcamento from './pages/NovoOrcamento';
import Clientes from './pages/Clientes';
import Orcamentos from './pages/Orcamentos';
import Prazos from './pages/Prazos';
import Relatorios from './pages/Relatorios';
import Fornecedores from './pages/Fornecedores';
import Produtos from './pages/Produtos';
import Configuracoes from './pages/Configuracoes';
import Producao from './pages/Producao';
import Cadastros from './pages/Cadastros';
import type {
  ProductCatalogItem,
  SupplierRecord,
  SupplierFormPayload,
  SupplierSpreadsheetRow,
} from './pages/Cadastros';
import { generateBudgetPdf } from './services/pdfGenerator';
import type {
  BudgetRecord,
  BudgetStatus,
  BudgetPriority,
  ProductionPlan,
  ProductionSectorPlan,
  ProductionSectorKey,
} from './types/budget';
import type { CompanyProfile } from './types/company';

export interface Client {
  id: string;
  nome: string;
  endereco: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  nomeEmpresa?: string;
  cnpj?: string;
}

export interface Material {
  id: string;
  name: string;
  costPerKg: number;
  costPerGram: number;
}

export interface AdditionalServiceConfig {
  id: string;
  name: string;
  amount: number;
}

export interface ServiceFeesConfig {
  design: number;
  scan: number;
  extras: AdditionalServiceConfig[];
}

const defaultCompanyProfile: CompanyProfile = {
  name: 'Vortex Projetos',
  address: 'Rua das Oficinas, 45 - Campinas - SP',
  phone: '(19) 4000-0000',
  email: 'contato@vortexprojetos.com.br',
  website: 'www.vortexprojetos.com.br',
};

const defaultSectorPlan: ProductionSectorPlan = {
  status: 'Aguardando',
  responsavel: 'A definir',
  inicioPrevisto: 'A definir',
  terminoPrevisto: 'A definir',
};

const createProductionPlan = (
  resumo: string,
  overrides: Partial<Record<ProductionSectorKey, Partial<ProductionSectorPlan>>>,
): ProductionPlan => {
  const setores: Record<ProductionSectorKey, ProductionSectorPlan> = {
    impressao: { ...defaultSectorPlan },
    acabamento: { ...defaultSectorPlan },
    pintura: { ...defaultSectorPlan },
    montagem: { ...defaultSectorPlan },
    revisao: { ...defaultSectorPlan },
    logistica: { ...defaultSectorPlan },
  };

  Object.entries(overrides).forEach(([key, value]) => {
    const typedKey = key as ProductionSectorKey;
    setores[typedKey] = { ...setores[typedKey], ...(value ?? {}) };
  });

  return {
    resumo,
    setores,
  };
};

const handleGeneratePdfForBudget = (
  budgets: BudgetRecord[],
  setBudgets: Dispatch<SetStateAction<BudgetRecord[]>>,
  company: CompanyProfile,
  budgetId: string,
): BudgetRecord | null => {
  let generated: BudgetRecord | null = null;
  const updated = budgets.map(entry => {
    if (entry.id !== budgetId) return entry;
    const pdfPayload = generateBudgetPdf(entry, { company });
    generated = {
      ...entry,
      pdfDataUri: pdfPayload.dataUri,
      pdfFileName: pdfPayload.fileName,
      pdfGeneratedAt: pdfPayload.generatedAt,
    };
    return generated;
  });
  setBudgets(updated);
  return generated;
};

const initialClients: Client[] = [
  {
    id: 'cli-001',
    nome: 'Vortex Projetos Cliente 1',
    endereco: 'Rua da Impressao, 100 - Sao Paulo/SP',
    cpf: '123.456.789-00',
    telefone: '(11) 98888-1010',
    email: 'contato@cliente1.com.br',
  },
  {
    id: 'cli-002',
    nome: 'Vortex Projetos Cliente 2',
    endereco: 'Avenida da Modelagem, 200 - Rio de Janeiro/RJ',
    cpf: '987.654.321-00',
    telefone: '(21) 97777-2020',
    email: 'projetos@cliente2.com.br',
  },
  {
    id: 'cli-003',
    nome: 'Cliente Teste LTDA',
    endereco: 'Avenida Teste, 300 - Belo Horizonte/MG',
    nomeEmpresa: 'Cliente Teste LTDA',
    cnpj: '12.345.678/0001-99',
    telefone: '(31) 3222-8899',
    email: 'financeiro@clienteteste.com.br',
  },
  {
    id: 'cli-004',
    nome: 'Impressoes Rapidas SA',
    endereco: 'Rua Rapida, 400 - Porto Alegre/RS',
    nomeEmpresa: 'Impressoes Rapidas SA',
    cnpj: '98.765.432/0001-11',
    telefone: '(51) 3003-7788',
    email: 'contato@impressoesrapidas.com',
  },
];

const createMaterial = (id: string, name: string, costPerKg: number): Material => ({
  id,
  name,
  costPerKg: Number(costPerKg.toFixed(2)),
  costPerGram: Number(((costPerKg * 17) / 1000).toFixed(6)),
});

const initialMaterials: Material[] = [
  createMaterial('mat-001', 'ABS', 57),
  createMaterial('mat-002', 'PETG', 65),
  createMaterial('mat-003', 'PLA', 75),
  createMaterial('mat-004', 'Resina', 100),
  createMaterial('mat-005', 'Tritan', 100),
  createMaterial('mat-006', 'TPU', 100),
  createMaterial('mat-007', 'Nylon', 100),
  createMaterial('mat-008', 'Carbono', 100),
];

const initialProductCatalog: ProductCatalogItem[] = [
  { id: 'prod-100', nome: 'Suporte Monitor', categoria: 'Acessorios', estoque: 12, price: 249.9 },
  { id: 'prod-101', nome: 'Case Raspberry Pi', categoria: 'Eletronicos', estoque: 8, price: 189.5 },
  { id: 'prod-102', nome: 'Engrenagem Custom', categoria: 'Industrial', estoque: 5, price: 329.75 },
];

const initialSuppliers: SupplierRecord[] = [
  {
    id: 'sup-010',
    nome: 'Alpha Polimeros',
    contato: 'contato@alpha.com',
    telefone: '(11) 4000-1001',
    catalog: [
      {
        id: 'sup-010-prod-100',
        productId: 'prod-100',
        productName: 'Suporte Monitor',
        productCategory: 'Acessorios',
        currency: 'BRL',
        price: 48.9,
        referenceCode: 'ALP-SUP-100',
      },
      {
        id: 'sup-010-prod-102',
        productId: 'prod-102',
        productName: 'Engrenagem Custom',
        productCategory: 'Industrial',
        currency: 'BRL',
        price: 112.5,
        referenceCode: 'ALP-ENG-200',
      },
    ],
    purchases: [
      {
        id: 'sup-010-purchase-001',
        productId: 'prod-100',
        productName: 'Suporte Monitor',
        purchaseDate: '2025-09-12',
        quantity: 40,
        unitPrice: 48.9,
        totalPrice: 1956,
        notes: 'Reposicao trimestral com ajuste de preco.',
      },
      {
        id: 'sup-010-purchase-002',
        productId: 'prod-102',
        productName: 'Engrenagem Custom',
        purchaseDate: '2025-08-28',
        quantity: 15,
        unitPrice: 112.5,
        totalPrice: 1687.5,
        notes: 'Pedido emergencial para linha de montagem.',
      },
    ],
  },
  {
    id: 'sup-011',
    nome: 'Makers Hub',
    contato: 'suporte@makershub.com',
    telefone: '(21) 3555-2020',
    catalog: [
      {
        id: 'sup-011-prod-100',
        productId: 'prod-100',
        productName: 'Suporte Monitor',
        productCategory: 'Acessorios',
        currency: 'BRL',
        price: 46.5,
        referenceCode: 'MKH-SUP-45',
      },
      {
        id: 'sup-011-prod-101',
        productId: 'prod-101',
        productName: 'Case Raspberry Pi',
        productCategory: 'Eletronicos',
        currency: 'BRL',
        price: 62,
        referenceCode: 'MKH-RPI-62',
      },
    ],
    purchases: [
      {
        id: 'sup-011-purchase-001',
        productId: 'prod-101',
        productName: 'Case Raspberry Pi',
        purchaseDate: '2025-09-18',
        quantity: 30,
        unitPrice: 61,
        totalPrice: 1830,
        notes: 'Remessa ajustada para nova revisao do produto.',
      },
      {
        id: 'sup-011-purchase-002',
        productId: 'prod-100',
        productName: 'Suporte Monitor',
        purchaseDate: '2025-09-03',
        quantity: 25,
        unitPrice: 46.5,
        totalPrice: 1162.5,
        notes: 'Estoque para clientes de escritorio.',
      },
    ],
  },
  {
    id: 'sup-012',
    nome: 'Smart Resinas',
    contato: 'vendas@smartresinas.com.br',
    telefone: '(31) 3222-8899',
    catalog: [
      {
        id: 'sup-012-prod-101',
        productId: 'prod-101',
        productName: 'Case Raspberry Pi',
        productCategory: 'Eletronicos',
        currency: 'BRL',
        price: 64.2,
        referenceCode: 'SMR-RPI-001',
      },
      {
        id: 'sup-012-prod-102',
        productId: 'prod-102',
        productName: 'Engrenagem Custom',
        productCategory: 'Industrial',
        currency: 'BRL',
        price: 118.4,
        referenceCode: 'SMR-ENG-118',
      },
    ],
    purchases: [
      {
        id: 'sup-012-purchase-001',
        productId: 'prod-102',
        productName: 'Engrenagem Custom',
        purchaseDate: '2025-09-15',
        quantity: 20,
        unitPrice: 118.4,
        totalPrice: 2368,
        notes: 'Lote com acabamento premium.',
      },
      {
        id: 'sup-012-purchase-002',
        productId: 'prod-101',
        productName: 'Case Raspberry Pi',
        purchaseDate: '2025-08-30',
        quantity: 40,
        unitPrice: 63.5,
        totalPrice: 2540,
        notes: 'Reposicao para estoque de kits educacionais.',
      },
    ],
  },
];

const initialBudgets: BudgetRecord[] = [
  {
    id: 'bud-001',
    codigo: '20250922.001',
    clienteId: 'cli-001',
    clienteNome: 'Vortex Projetos Cliente 1',
    clienteEndereco: 'Rua Ametista, 120 - Distrito Industrial, Sao Paulo - SP',
    clienteTelefone: '(11) 99999-1111',
    clienteEmail: 'compras+cliente1@vortex.com',
    clienteDocumento: '12.345.678/0001-90',
    criadoEm: '2025-09-18T12:30:00.000Z',
    status: 'aceito',
    total: 4820,
    desconto: 180,
    observacoes: 'Entrega prioritaria na sede do cliente.',
    resumoDoProjeto: 'Suportes de monitor personalizados para escritorio corporativo.',
    itens: [
      {
        id: 'bud-001-prod-01',
        nome: 'Suporte Monitor Ajustavel',
        quantidade: 12,
        partes: [
          {
            id: 'bud-001-part-01',
            nome: 'Base articulada',
            quantidade: 12,
            material: 'PETG',
            peso: 0.42,
            tempoImpressao: 6,
            custoAdicional: 40,
            valorCalculado: 220,
          },
          {
            id: 'bud-001-part-02',
            nome: 'Trilho lateral reforcado',
            quantidade: 24,
            material: 'PLA',
            peso: 0.18,
            tempoImpressao: 3,
            custoAdicional: 18,
            valorCalculado: 95,
          },
        ],
      },
    ],
    producao: createProductionPlan('Lote de suportes para escritorio', {
      impressao: {
        status: 'Em andamento',
        responsavel: 'Ana Lima',
        inicioPrevisto: '22/09/2025 08:00',
        terminoPrevisto: '24/09/2025 18:00',
        percentual: 60,
        observacoes: 'Operando na Prusa MK3S #2 com PETG preto.',
      },
      acabamento: {
        status: 'Agendado',
        responsavel: 'Equipe B',
        inicioPrevisto: '25/09/2025 09:00',
        terminoPrevisto: '25/09/2025 17:30',
      },
      logistica: {
        status: 'Aguardando',
        responsavel: 'Equipe Logistica',
        inicioPrevisto: '28/09/2025 09:00',
        terminoPrevisto: '28/09/2025 12:00',
      },
    }),
    previsaoInicio: '2025-09-22T08:00:00.000Z',
    previsaoEntrega: '2025-09-28T15:00:00.000Z',
    responsavelProjeto: 'Ana Lima',
    prioridade: 'alta',
    etapaAtual: 'Impressao',
    formaPagamento: '30 Dias',
    enderecoEntrega: 'Rua Ametista, 120 - Distrito Industrial, Sao Paulo - SP',
    enviosProgramados: 2,
  },
  {
    id: 'bud-002',
    codigo: '20250924.002',
    clienteId: 'cli-003',
    clienteNome: 'Cliente Teste LTDA',
    clienteEndereco: 'Avenida das Torres, 2500 - Curitiba - PR',
    clienteTelefone: '(41) 98888-2222',
    clienteEmail: 'contato@clienteteste.com',
    clienteDocumento: '45.678.912/0001-12',
    criadoEm: '2025-09-19T10:15:00.000Z',
    status: 'enviado',
    total: 12870,
    observacoes: 'Projeto com entregas parciais semanais.',
    resumoDoProjeto: 'Engrenagens customizadas para linha de montagem piloto.',
    itens: [
      {
        id: 'bud-002-prod-01',
        nome: 'Engrenagem Helicoidal',
        quantidade: 30,
        partes: [
          {
            id: 'bud-002-part-01',
            nome: 'Corpo principal',
            quantidade: 30,
            material: 'Nylon',
            peso: 0.28,
            tempoImpressao: 5.5,
            custoAdicional: 55,
            valorCalculado: 320,
          },
          {
            id: 'bud-002-part-02',
            nome: 'Inserto metalico',
            quantidade: 30,
            material: 'Carbono',
            peso: 0.12,
            tempoImpressao: 2.5,
            custoAdicional: 35,
            valorCalculado: 210,
          },
        ],
      },
    ],
    producao: createProductionPlan('Engrenagens customizadas - lote piloto', {
      impressao: {
        status: 'Pendente',
        responsavel: 'Equipe Impressao',
        inicioPrevisto: '26/09/2025 07:30',
        terminoPrevisto: '27/09/2025 18:00',
      },
      montagem: {
        status: 'Planejamento',
        responsavel: 'Equipe Montagem 1',
        inicioPrevisto: '30/09/2025 08:00',
        terminoPrevisto: '30/09/2025 12:00',
      },
    }),
    previsaoInicio: '2025-09-26T07:30:00.000Z',
    previsaoEntrega: '2025-10-03T18:00:00.000Z',
    responsavelProjeto: 'Marcelo Tavares',
    prioridade: 'media',
    etapaAtual: 'Negociacao',
    formaPagamento: '60 Dias',
    enderecoEntrega: 'Avenida das Torres, 2500 - Curitiba - PR',
    enviosProgramados: 3,
  },
  {
    id: 'bud-003',
    codigo: '20250925.003',
    clienteId: 'cli-002',
    clienteNome: 'Vortex Projetos Cliente 2',
    clienteEndereco: 'Rua das Oficinas, 45 - Campinas - SP',
    clienteTelefone: '(19) 97777-3333',
    clienteEmail: 'compras@cliente2.com',
    clienteDocumento: '987.654.321-00',
    criadoEm: '2025-09-20T14:40:00.000Z',
    status: 'rascunho',
    total: 3280,
    resumoDoProjeto: 'Kit de prototipos impressos em resina para testes internos.',
    itens: [
      {
        id: 'bud-003-prod-01',
        nome: 'Conjunto de prototipos',
        quantidade: 6,
        partes: [
          {
            id: 'bud-003-part-01',
            nome: 'Corpo em resina',
            quantidade: 6,
            material: 'Resina',
            peso: 0.22,
            tempoImpressao: 4,
            custoAdicional: 20,
            valorCalculado: 180,
          },
          {
            id: 'bud-003-part-02',
            nome: 'Suporte TPU',
            quantidade: 6,
            material: 'TPU',
            peso: 0.1,
            tempoImpressao: 2.5,
            custoAdicional: 15,
            valorCalculado: 95,
          },
        ],
      },
    ],
    producao: createProductionPlan('Prototipos impressos em resina', {
      impressao: {
        status: 'Planejamento',
        responsavel: 'Equipe Impressao',
        inicioPrevisto: '29/09/2025 09:00',
        terminoPrevisto: '01/10/2025 18:00',
      },
    }),
    previsaoInicio: '2025-09-29T09:00:00.000Z',
    previsaoEntrega: '2025-10-05T17:00:00.000Z',
    responsavelProjeto: 'Equipe Comercial',
    prioridade: 'baixa',
    etapaAtual: 'Revisao interna',
    formaPagamento: 'Personalizado',
    formaPagamentoPersonalizado: 'Entrada de 50% e saldo na entrega',
    enderecoEntrega: 'Rua das Oficinas, 45 - Campinas - SP',
    enviosProgramados: 1,
  },
];

function App() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [machineCount, setMachineCount] = useState<number>(4);
  const [serviceFees, setServiceFees] = useState<ServiceFeesConfig>({
    design: 2500,
    scan: 250,
    extras: [],
  });
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(defaultCompanyProfile);
  const [productCatalog, setProductCatalog] = useState<ProductCatalogItem[]>(initialProductCatalog);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(initialSuppliers);
  const [budgets, setBudgets] = useState<BudgetRecord[]>(initialBudgets);

  useEffect(() => {
    setBudgets(prev => {
      let changed = false;
      const updated = prev.map(entry => {
        const pdfPayload = generateBudgetPdf(entry, { company: companyProfile });
        const hasPdf =
          entry.pdfDataUri === pdfPayload.dataUri &&
          entry.pdfFileName === pdfPayload.fileName &&
          entry.pdfGeneratedAt === pdfPayload.generatedAt;
        if (hasPdf) return entry;
        changed = true;
        return {
          ...entry,
          pdfDataUri: pdfPayload.dataUri,
          pdfFileName: pdfPayload.fileName,
          pdfGeneratedAt: pdfPayload.generatedAt,
        };
      });
      return changed ? updated : prev;
    });
  }, [companyProfile]);

  const handleAddNewClient = (newClient: Omit<Client, 'id'>) => {
    const clientWithId = { ...newClient, id: crypto.randomUUID() };
    setClients(prev => [...prev, clientWithId]);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(client => (client.id === updatedClient.id ? updatedClient : client)));
  };

  const handleDeleteClient = (clientId: string) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
  };

  const handleCreateSupplier = (supplier: SupplierFormPayload) => {
    const supplierWithId: SupplierRecord = {
      id: crypto.randomUUID(),
      nome: supplier.nome,
      contato: supplier.contato,
      telefone: supplier.telefone,
      catalog: [],
      purchases: [],
    };
    setSuppliers(prev => [...prev, supplierWithId]);
  };

  const handleUpdateSupplier = (updatedSupplier: SupplierRecord) => {
    setSuppliers(prev => prev.map(record => (record.id === updatedSupplier.id ? updatedSupplier : record)));
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(prev => prev.filter(record => record.id !== supplierId));
  };

  const handleMergeSupplierSpreadsheet = (rows: SupplierSpreadsheetRow[]) => {
    if (!rows.length) {
      return;
    }

    setSuppliers(prev => {
      const clone = prev.map(supplier => ({
        ...supplier,
        catalog: supplier.catalog.map(item => ({ ...item })),
        purchases: supplier.purchases.map(entry => ({ ...entry })),
      }));

      const normalizeValue = (value: string) => value.trim().toLowerCase();

      rows.forEach(row => {
        const supplierNameRaw = row.supplierName?.trim();
        if (!supplierNameRaw) {
          return;
        }

        const contactRaw = row.contact?.trim() ?? '';
        const phoneRaw = row.phone?.trim() ?? '';
        const supplierKey = normalizeValue(supplierNameRaw);
        const contactKey = contactRaw ? normalizeValue(contactRaw) : null;

        let supplier =
          clone.find(item => normalizeValue(item.nome) === supplierKey) ??
          (contactKey
            ? clone.find(item => normalizeValue(item.contato) === contactKey)
            : undefined);

        if (!supplier) {
          const fallbackContact = contactRaw || `${supplierKey.replace(/[^a-z0-9]+/g, '.') || 'contato'}@fornecedor.com`;
          supplier = {
            id: crypto.randomUUID(),
            nome: supplierNameRaw,
            contato: fallbackContact,
            telefone: phoneRaw,
            catalog: [],
            purchases: [],
          };
          clone.push(supplier);
        } else {
          if (contactRaw) {
            supplier.contato = contactRaw;
          }
          if (phoneRaw) {
            supplier.telefone = phoneRaw;
          }
        }

        if (!row.productName) {
          return;
        }

        const productIdRaw = row.productId?.trim() ?? '';
        const productNameRaw = row.productName.trim();
        const currency = row.currency?.trim().toUpperCase() || 'BRL';
        const price = Number.isFinite(row.price) ? row.price : 0;

        let product = supplier.catalog.find(item => {
          if (productIdRaw && item.productId.toLowerCase() === productIdRaw.toLowerCase()) {
            return true;
          }
          return item.productName.toLowerCase() === productNameRaw.toLowerCase();
        });

        if (!product) {
          product = {
            id: crypto.randomUUID(),
            productId: productIdRaw || crypto.randomUUID(),
            productName: productNameRaw,
            productCategory: row.productCategory || '',
            currency,
            price,
            referenceCode: row.referenceCode || '',
          };
          supplier.catalog.push(product);
        } else {
          product.productName = productNameRaw;
          if (row.productCategory) {
            product.productCategory = row.productCategory;
          }
          if (row.referenceCode) {
            product.referenceCode = row.referenceCode;
          }
          if (Number.isFinite(row.price)) {
            product.price = row.price;
          }
          product.currency = currency;
        }

        if (row.lastPurchaseDate) {
          const purchaseDate = row.lastPurchaseDate;
          const quantity = row.lastPurchaseQuantity ?? 0;
          const unitPrice = row.lastPurchaseUnitPrice ?? product.price;
          const totalPrice =
            row.lastPurchaseTotal ?? Number((unitPrice * (quantity || 0)).toFixed(2));

          const hasPurchase = supplier.purchases.some(entry => {
            return (
              entry.productId === product.productId &&
              entry.purchaseDate === purchaseDate &&
              entry.quantity === quantity &&
              entry.unitPrice === unitPrice
            );
          });

          if (!hasPurchase) {
            supplier.purchases.push({
              id: crypto.randomUUID(),
              productId: product.productId,
              productName: product.productName,
              purchaseDate,
              quantity,
              unitPrice,
              totalPrice,
              notes: row.lastPurchaseNotes,
            });
          }
        }
      });

      return clone.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    });
  };

  const handleCreateProduct = (product: Omit<ProductCatalogItem, 'id'>) => {
    const normalizedProduct: Omit<ProductCatalogItem, 'id'> = {
      ...product,
      estoque: Number.isFinite(Number(product.estoque)) ? Number(product.estoque) : 0,
      price: Number.isFinite(Number(product.price)) ? Number(product.price) : 0,
    };
    const productWithId: ProductCatalogItem = { ...normalizedProduct, id: crypto.randomUUID() };
    setProductCatalog(prev => [...prev, productWithId]);
  };

  const handleUpdateProduct = (updatedProduct: ProductCatalogItem) => {
    const normalizedProduct: ProductCatalogItem = {
      ...updatedProduct,
      estoque: Number.isFinite(Number(updatedProduct.estoque)) ? Number(updatedProduct.estoque) : 0,
      price: Number.isFinite(Number(updatedProduct.price)) ? Number(updatedProduct.price) : 0,
    };
    setProductCatalog(prev => prev.map(item => (item.id === normalizedProduct.id ? normalizedProduct : item)));
  };

  const handleDeleteProduct = (productId: string) => {
    setProductCatalog(prev => prev.filter(item => item.id !== productId));
  };

  const handleCreateBudget = (budget: BudgetRecord) => {
    const defaultPriority: BudgetPriority = 'media';
    const fallbackInicio = budget.previsaoInicio ?? budget.criadoEm;
    const fallbackEntrega = (() => {
      if (budget.previsaoEntrega) return budget.previsaoEntrega;
      const parsedInicio = new Date(fallbackInicio);
      if (Number.isNaN(parsedInicio.getTime())) {
        return fallbackInicio;
      }
      return new Date(parsedInicio.getTime() + 72 * 60 * 60 * 1000).toISOString();
    })();

    const enrichedBudget: BudgetRecord = {
      ...budget,
      previsaoInicio: fallbackInicio,
      previsaoEntrega: fallbackEntrega,
      prioridade: budget.prioridade ?? defaultPriority,
      responsavelProjeto: budget.responsavelProjeto ?? 'Equipe Comercial',
      etapaAtual: budget.etapaAtual ?? (budget.status === 'aceito' ? 'Planejamento' : 'Proposta'),
    };

    const pdfPayload = generateBudgetPdf(enrichedBudget, { company: companyProfile });
    const budgetWithPdf: BudgetRecord = {
      ...enrichedBudget,
      pdfDataUri: pdfPayload.dataUri,
      pdfFileName: pdfPayload.fileName,
      pdfGeneratedAt: pdfPayload.generatedAt,
    };

    setBudgets(prev => [budgetWithPdf, ...prev]);
  };

  const handleUpdateBudgetStatus = (budgetId: string, status: BudgetStatus) => {
    setBudgets(prev => prev.map(entry => (entry.id === budgetId ? { ...entry, status } : entry)));
  };

  const handleGenerateBudgetPdf = (budgetId: string) =>
    handleGeneratePdfForBudget(budgets, setBudgets, companyProfile, budgetId);

  const handleUpdateMaterials = (updatedMaterials: Material[]) => {
    setMaterials(updatedMaterials);
  };

  const handleUpdateMachineCount = (nextCount: number) => {
    setMachineCount(nextCount);
  };

  const handleUpdateServiceFees = (nextFees: ServiceFeesConfig) => {
    setServiceFees(nextFees);
  };

  const handleUpdateCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
  };

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/orcamento/novo"
            element={
              <NovoOrcamento
                clients={clients}
                onAddNewClient={handleAddNewClient}
                materials={materials}
                onCreateBudget={handleCreateBudget}
                serviceFees={serviceFees}
              />
            }
          />
          <Route path="/novo-orcamento" element={<Navigate to="/orcamento/novo" replace />} />
          <Route path="/orcamento" element={<Navigate to="/orcamento/novo" replace />} />
          <Route path="/clientes" element={<Clientes clients={clients} />} />
          <Route path="/producao" element={<Producao budgets={budgets} />} />
          <Route
            path="/cadastros"
            element={(
              <Cadastros
                products={productCatalog}
                suppliers={suppliers}
                clients={clients}
                onCreateClient={handleAddNewClient}
                onUpdateClient={handleUpdateClient}
                onDeleteClient={handleDeleteClient}
                onCreateSupplier={handleCreateSupplier}
                onUpdateSupplier={handleUpdateSupplier}
                onDeleteSupplier={handleDeleteSupplier}
                onCreateProduct={handleCreateProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}
          />
          <Route path="/cadastros/clientes" element={<Clientes clients={clients} />} />
          <Route path="/cadastros/fornecedores" element={<Fornecedores suppliers={suppliers} onMergeSpreadsheet={handleMergeSupplierSpreadsheet} />} />
          <Route path="/cadastros/produtos" element={<Produtos products={productCatalog} />} />
          <Route
            path="/orcamentos"
            element={
              <Orcamentos
                budgets={budgets}
                onUpdateStatus={handleUpdateBudgetStatus}
                onGeneratePdf={handleGenerateBudgetPdf}
              />
            }
          />
          <Route path="/prazos" element={<Prazos budgets={budgets} />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route
            path="/configuracoes"
            element={
              <Configuracoes
                materials={materials}
                onUpdateMaterials={handleUpdateMaterials}
                machineCount={machineCount}
                onUpdateMachineCount={handleUpdateMachineCount}
                serviceFees={serviceFees}
                onUpdateServiceFees={handleUpdateServiceFees}
                companyProfile={companyProfile}
                onUpdateCompanyProfile={handleUpdateCompanyProfile}
              />
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;





