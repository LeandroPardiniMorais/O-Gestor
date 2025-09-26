import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NovoOrcamento from './pages/NovoOrcamento';
import Clientes from './pages/Clientes';
import Orcamentos from './pages/Orcamentos';
import Prazos from './pages/Prazos';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';

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

  const handleAddNewClient = (newClient: Omit<Client, 'id'>) => {
    const clientWithId = { ...newClient, id: Date.now().toString() };
    setClients(prevClients => [...prevClients, clientWithId]);
  };

  const handleUpdateMaterials = (updatedMaterials: Material[]) => {
    setMaterials(updatedMaterials);
  };

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/novo-orcamento" element={<NovoOrcamento clients={clients} onAddNewClient={handleAddNewClient} materials={materials} />} />
          <Route path="/clientes" element={<Clientes clients={clients} />} />
          <Route path="/orcamentos" element={<Orcamentos />} />
          <Route path="/prazos" element={<Prazos />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/configuracoes" element={<Configuracoes materials={materials} onUpdateMaterials={handleUpdateMaterials} />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
