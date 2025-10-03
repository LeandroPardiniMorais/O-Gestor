import { useState } from 'react';
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
import type { ProductCatalogItem, SupplierRecord } from './pages/Cadastros';
import type {
  BudgetRecord,
  BudgetStatus,
  BudgetPriority,
  ProductionPlan,
  ProductionSectorPlan,
  ProductionSectorKey,
} from './types/budget';

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
  cost: number;
}

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

const initialMaterials: Material[] = [
  { id: 'mat-001', name: 'ABS', cost: (57 / 1000) * 17 },
  { id: 'mat-002', name: 'PETG', cost: (65 / 1000) * 17 },
  { id: 'mat-003', name: 'PLA', cost: (75 / 1000) * 17 },
  { id: 'mat-004', name: 'Resina', cost: (100 / 1000) * 17 },
  { id: 'mat-005', name: 'Tritan', cost: (100 / 1000) * 17 },
  { id: 'mat-006', name: 'TPU', cost: (100 / 1000) * 17 },
  { id: 'mat-007', name: 'Nylon', cost: (100 / 1000) * 17 },
  { id: 'mat-008', name: 'Carbono', cost: (100 / 1000) * 17 },
];

const initialProductCatalog: ProductCatalogItem[] = [
  { id: 'prod-100', nome: 'Suporte Monitor', categoria: 'Acessorios', estoque: 12 },
  { id: 'prod-101', nome: 'Case Raspberry Pi', categoria: 'Eletronicos', estoque: 8 },
  { id: 'prod-102', nome: 'Engrenagem Custom', categoria: 'Industrial', estoque: 5 },
];

const initialSuppliers: SupplierRecord[] = [
  { id: 'sup-010', nome: 'Alpha Polimeros', contato: 'contato@alpha.com', telefone: '(11) 4000-1001' },
  { id: 'sup-011', nome: 'Makers Hub', contato: 'suporte@makershub.com', telefone: '(21) 3555-2020' },
  { id: 'sup-012', nome: 'Smart Resinas', contato: 'vendas@smartresinas.com.br', telefone: '(31) 3222-8899' },
];

const initialBudgets: BudgetRecord[] = [
  {
    id: 'bud-001',
    codigo: '20250922.001',
    clienteId: 'cli-001',
    clienteNome: 'Vortex Projetos Cliente 1',
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
  },
  {
    id: 'bud-002',
    codigo: '20250924.002',
    clienteId: 'cli-003',
    clienteNome: 'Cliente Teste LTDA',
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
  },
  {
    id: 'bud-003',
    codigo: '20250925.003',
    clienteId: 'cli-002',
    clienteNome: 'Vortex Projetos Cliente 2',
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
  },
];

function App() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [productCatalog, setProductCatalog] = useState<ProductCatalogItem[]>(initialProductCatalog);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(initialSuppliers);
  const [budgets, setBudgets] = useState<BudgetRecord[]>(initialBudgets);

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

  const handleCreateSupplier = (supplier: Omit<SupplierRecord, 'id'>) => {
    const supplierWithId: SupplierRecord = { ...supplier, id: crypto.randomUUID() };
    setSuppliers(prev => [...prev, supplierWithId]);
  };

  const handleUpdateSupplier = (updatedSupplier: SupplierRecord) => {
    setSuppliers(prev => prev.map(record => (record.id === updatedSupplier.id ? updatedSupplier : record)));
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(prev => prev.filter(record => record.id !== supplierId));
  };

  const handleCreateProduct = (product: Omit<ProductCatalogItem, 'id'>) => {
    const productWithId: ProductCatalogItem = { ...product, id: crypto.randomUUID() };
    setProductCatalog(prev => [...prev, productWithId]);
  };

  const handleUpdateProduct = (updatedProduct: ProductCatalogItem) => {
    setProductCatalog(prev => prev.map(item => (item.id === updatedProduct.id ? updatedProduct : item)));
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

    setBudgets(prev => [enrichedBudget, ...prev]);
  };

  const handleUpdateBudgetStatus = (budgetId: string, status: BudgetStatus) => {
    setBudgets(prev => prev.map(entry => (entry.id === budgetId ? { ...entry, status } : entry)));
  };

  const handleUpdateMaterials = (updatedMaterials: Material[]) => {
    setMaterials(updatedMaterials);
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
          <Route path="/cadastros/fornecedores" element={<Fornecedores suppliers={suppliers} />} />
          <Route path="/cadastros/produtos" element={<Produtos products={productCatalog} />} />
          <Route path="/orcamentos" element={<Orcamentos budgets={budgets} onUpdateStatus={handleUpdateBudgetStatus} />} />
          <Route path="/prazos" element={<Prazos budgets={budgets} />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route
            path="/configuracoes"
            element={<Configuracoes materials={materials} onUpdateMaterials={handleUpdateMaterials} />}
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
