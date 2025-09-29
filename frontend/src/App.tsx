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
import type { BudgetRecord, BudgetStatus } from './types/budget';

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

function App() {
  const [clients, setClients] = useState<Client[]>([
    { id: '1', nome: 'Vortex Projetos Cliente 1', endereco: 'Rua da Impressão, 100 - SP' },
    { id: '2', nome: 'Vortex Projetos Cliente 2', endereco: 'Av. da Modelagem, 200 - RJ' },
    { id: '3', nome: 'Cliente Teste LTDA', endereco: 'Av. Teste, 300 - MG', nomeEmpresa: 'Cliente Teste LTDA', cnpj: '12.345.678/0001-99' },
    { id: '4', nome: 'Impressões Rápidas SA', endereco: 'Rua Rápida, 400 - RS', nomeEmpresa: 'Impressões Rápidas SA', cnpj: '98.765.432/0001-11' },
  ]);

  const [materials, setMaterials] = useState<Material[]>([
    { id: '1', name: 'ABS', cost: (57 / 1000) * 17 },
    { id: '2', name: 'PETG', cost: (65 / 1000) * 17 },
    { id: '3', name: 'PLA', cost: (75 / 1000) * 17 },
    { id: '4', name: 'Resina', cost: (100 / 1000) * 17 },
    { id: '5', name: 'Tritan', cost: (100 / 1000) * 17 },
    { id: '6', name: 'TPU', cost: (100 / 1000) * 17 },
    { id: '7', name: 'Nylon', cost: (100 / 1000) * 17 },
    { id: '8', name: 'Carbono', cost: (100 / 1000) * 17 },
  ]);

  const [productCatalog, setProductCatalog] = useState<ProductCatalogItem[]>([
    { id: 'p-100', nome: 'Suporte Monitor', categoria: 'Acessórios', estoque: 12 },
    { id: 'p-101', nome: 'Case Raspberry Pi', categoria: 'Eletrônicos', estoque: 8 },
    { id: 'p-102', nome: 'Engrenagem Custom', categoria: 'Industrial', estoque: 5 },
  ]);

  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([
    { id: 'f-10', nome: 'Alpha Polímeros', contato: 'contato@alpha.com', telefone: '(11) 4000-1001' },
    { id: 'f-11', nome: 'Makers Hub', contato: 'suporte@makershub.com', telefone: '(21) 3555-2020' },
    { id: 'f-12', nome: 'Smart Resinas', contato: 'vendas@smartresinas.com.br', telefone: '(31) 3222-8899' },
  ]);

  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);

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
    setBudgets(prev => [budget, ...prev]);
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
          <Route path="/prazos" element={<Prazos />} />
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

