import { useState } from 'react';
import { Container, Tabs, Tab, Card, Table, Button, Modal, Form, Stack } from 'react-bootstrap';
import { Plus, Edit2, Trash2 } from 'react-feather';
import type { Client } from '../App';

export interface ProductCatalogItem {
  id: string;
  nome: string;
  categoria: string;
  estoque: number;
}

export interface SupplierRecord {
  id: string;
  nome: string;
  contato: string;
  telefone: string;
}

type Entity = 'client' | 'supplier' | 'product';
type Mode = 'create' | 'edit';

interface CadastrosProps {
  products: ProductCatalogItem[];
  suppliers: SupplierRecord[];
  clients: Client[];
  onCreateClient: (client: Omit<Client, 'id'>) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onCreateSupplier: (supplier: Omit<SupplierRecord, 'id'>) => void;
  onUpdateSupplier: (supplier: SupplierRecord) => void;
  onDeleteSupplier: (id: string) => void;
  onCreateProduct: (product: Omit<ProductCatalogItem, 'id'>) => void;
  onUpdateProduct: (product: ProductCatalogItem) => void;
  onDeleteProduct: (id: string) => void;
}

interface ModalState {
  entity: Entity;
  mode: Mode;
  show: boolean;
}

type ClientDraft = Omit<Client, 'id'> & { id?: string };
type SupplierDraft = Omit<SupplierRecord, 'id'> & { id?: string };
type ProductDraft = Omit<ProductCatalogItem, 'id'> & { id?: string };

const emptyClient: ClientDraft = {
  nome: '',
  endereco: '',
  cpf: '',
  telefone: '',
  email: '',
  nomeEmpresa: '',
  cnpj: '',
};

const emptySupplier: SupplierDraft = {
  nome: '',
  contato: '',
  telefone: '',
};

const emptyProduct: ProductDraft = {
  nome: '',
  categoria: '',
  estoque: 0,
};

const Cadastros = ({
  products,
  suppliers,
  clients,
  onCreateClient,
  onUpdateClient,
  onDeleteClient,
  onCreateSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
}: CadastrosProps) => {
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [clientDraft, setClientDraft] = useState<ClientDraft>(emptyClient);
  const [supplierDraft, setSupplierDraft] = useState<SupplierDraft>(emptySupplier);
  const [productDraft, setProductDraft] = useState<ProductDraft>(emptyProduct);

  const openCreate = (entity: Entity) => {
    setModalState({ entity, mode: 'create', show: true });
    if (entity === 'client') {
      setClientDraft(emptyClient);
    }
    if (entity === 'supplier') {
      setSupplierDraft(emptySupplier);
    }
    if (entity === 'product') {
      setProductDraft(emptyProduct);
    }
  };

  const openEdit = (entity: Entity, id: string) => {
    setModalState({ entity, mode: 'edit', show: true });
    if (entity === 'client') {
      const current = clients.find(client => client.id === id);
      if (current) {
        const { id: clientId, ...rest } = current;
        setClientDraft({ ...rest, id: clientId });
      }
    }
    if (entity === 'supplier') {
      const current = suppliers.find(supplier => supplier.id === id);
      if (current) {
        const { id: supplierId, ...rest } = current;
        setSupplierDraft({ ...rest, id: supplierId });
      }
    }
    if (entity === 'product') {
      const current = products.find(product => product.id === id);
      if (current) {
        const { id: productId, ...rest } = current;
        setProductDraft({ ...rest, id: productId });
      }
    }
  };

  const closeModal = () => {
    setModalState(null);
  };

  const handleSubmit = () => {
    if (!modalState) return;

    if (modalState.entity === 'client') {
      if (!clientDraft.nome || !clientDraft.endereco) {
        return;
      }
      if (modalState.mode === 'create') {
        onCreateClient(clientDraft);
      } else if (clientDraft.id) {
        onUpdateClient({ id: clientDraft.id, ...clientDraft });
      }
    }

    if (modalState.entity === 'supplier') {
      if (!supplierDraft.nome || !supplierDraft.contato) {
        return;
      }
      if (modalState.mode === 'create') {
        onCreateSupplier(supplierDraft);
      } else if (supplierDraft.id) {
        onUpdateSupplier({ id: supplierDraft.id, ...supplierDraft });
      }
    }

    if (modalState.entity === 'product') {
      if (!productDraft.nome || !productDraft.categoria) {
        return;
      }
      const parsedEstoque = Number(productDraft.estoque) || 0;
      const payload = { ...productDraft, estoque: parsedEstoque };
      if (modalState.mode === 'create') {
        onCreateProduct(payload);
      } else if (productDraft.id) {
        onUpdateProduct({ id: productDraft.id, ...payload });
      }
    }

    closeModal();
  };

  const handleDelete = (entity: Entity, id: string, name: string) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir ${name}?`);
    if (!confirmed) return;

    if (entity === 'client') {
      onDeleteClient(id);
    }
    if (entity === 'supplier') {
      onDeleteSupplier(id);
    }
    if (entity === 'product') {
      onDeleteProduct(id);
    }
  };

  const renderModalBody = () => {
    if (!modalState) return null;

    if (modalState.entity === 'client') {
      return (
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Nome</Form.Label>
            <Form.Control
              value={clientDraft.nome}
              onChange={event => setClientDraft(prev => ({ ...prev, nome: event.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Endereço</Form.Label>
            <Form.Control
              value={clientDraft.endereco}
              onChange={event => setClientDraft(prev => ({ ...prev, endereco: event.target.value }))}
            />
          </Form.Group>
          <Stack direction="horizontal" gap={3} className="mb-3">
            <Form.Group className="flex-fill">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={clientDraft.email ?? ''}
                onChange={event => setClientDraft(prev => ({ ...prev, email: event.target.value }))}
              />
            </Form.Group>
            <Form.Group className="flex-fill">
              <Form.Label>Telefone</Form.Label>
              <Form.Control
                value={clientDraft.telefone ?? ''}
                onChange={event => setClientDraft(prev => ({ ...prev, telefone: event.target.value }))}
              />
            </Form.Group>
          </Stack>
          <Stack direction="horizontal" gap={3} className="mb-3">
            <Form.Group className="flex-fill">
              <Form.Label>Empresa</Form.Label>
              <Form.Control
                value={clientDraft.nomeEmpresa ?? ''}
                onChange={event => setClientDraft(prev => ({ ...prev, nomeEmpresa: event.target.value }))}
              />
            </Form.Group>
            <Form.Group className="flex-fill">
              <Form.Label>CNPJ</Form.Label>
              <Form.Control
                value={clientDraft.cnpj ?? ''}
                onChange={event => setClientDraft(prev => ({ ...prev, cnpj: event.target.value }))}
              />
            </Form.Group>
          </Stack>
          <Stack direction="horizontal" gap={3}>
            <Form.Group className="flex-fill">
              <Form.Label>CPF</Form.Label>
              <Form.Control
                value={clientDraft.cpf ?? ''}
                onChange={event => setClientDraft(prev => ({ ...prev, cpf: event.target.value }))}
              />
            </Form.Group>
          </Stack>
        </Form>
      );
    }

    if (modalState.entity === 'supplier') {
      return (
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Fornecedor</Form.Label>
            <Form.Control
              value={supplierDraft.nome}
              onChange={event => setSupplierDraft(prev => ({ ...prev, nome: event.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contato</Form.Label>
            <Form.Control
              value={supplierDraft.contato}
              onChange={event => setSupplierDraft(prev => ({ ...prev, contato: event.target.value }))}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Telefone</Form.Label>
            <Form.Control
              value={supplierDraft.telefone}
              onChange={event => setSupplierDraft(prev => ({ ...prev, telefone: event.target.value }))}
            />
          </Form.Group>
        </Form>
      );
    }

    return (
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Produto</Form.Label>
          <Form.Control
            value={productDraft.nome}
            onChange={event => setProductDraft(prev => ({ ...prev, nome: event.target.value }))}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Categoria</Form.Label>
          <Form.Control
            value={productDraft.categoria}
            onChange={event => setProductDraft(prev => ({ ...prev, categoria: event.target.value }))}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Estoque</Form.Label>
          <Form.Control
            type="number"
            value={productDraft.estoque}
            onChange={event => setProductDraft(prev => ({ ...prev, estoque: Number(event.target.value) }))}
          />
        </Form.Group>
      </Form>
    );
  };

  const modalTitle = () => {
    if (!modalState) return '';
    const prefix = modalState.mode === 'create' ? 'Adicionar' : 'Editar';
    if (modalState.entity === 'client') return `${prefix} cliente`;
    if (modalState.entity === 'supplier') return `${prefix} fornecedor`;
    return `${prefix} produto`;
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Cadastros</h2>
        <Button variant="danger" onClick={() => openCreate('client')}>
          <Plus size={16} className="me-2" /> Novo cliente
        </Button>
      </div>

      <Card className="p-4 rounded-4">
        <Tabs defaultActiveKey="products" id="cadastros-tabs" className="mb-3">
          <Tab eventKey="products" title="Produtos">
            <div className="d-flex justify-content-end mb-3">
              <Button size="sm" variant="danger" onClick={() => openCreate('product')}>
                <Plus size={14} className="me-2" /> Adicionar produto
              </Button>
            </div>
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Estoque</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(item => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.categoria}</td>
                    <td>{item.estoque}</td>
                    <td className="text-end">
                      <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => openEdit('product', item.id)}>
                        <Edit2 size={14} className="me-1" /> Editar
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete('product', item.id, item.nome)}>
                        <Trash2 size={14} className="me-1" /> Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab>
          <Tab eventKey="suppliers" title="Fornecedores">
            <div className="d-flex justify-content-end mb-3">
              <Button size="sm" variant="danger" onClick={() => openCreate('supplier')}>
                <Plus size={14} className="me-2" /> Adicionar fornecedor
              </Button>
            </div>
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Contato</th>
                  <th>Telefone</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(item => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.contato}</td>
                    <td>{item.telefone}</td>
                    <td className="text-end">
                      <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => openEdit('supplier', item.id)}>
                        <Edit2 size={14} className="me-1" /> Editar
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete('supplier', item.id, item.nome)}>
                        <Trash2 size={14} className="me-1" /> Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab>
          <Tab eventKey="clients" title="Clientes">
            <div className="d-flex justify-content-end mb-3">
              <Button size="sm" variant="danger" onClick={() => openCreate('client')}>
                <Plus size={14} className="me-2" /> Adicionar cliente
              </Button>
            </div>
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Endereço</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(item => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.endereco}</td>
                    <td>{item.email || 'N/A'}</td>
                    <td>{item.telefone || 'N/A'}</td>
                    <td className="text-end">
                      <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => openEdit('client', item.id)}>
                        <Edit2 size={14} className="me-1" /> Editar
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete('client', item.id, item.nome)}>
                        <Trash2 size={14} className="me-1" /> Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab>
        </Tabs>
      </Card>

      <Modal show={modalState?.show ?? false} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle()}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{renderModalBody()}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleSubmit}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Cadastros;





