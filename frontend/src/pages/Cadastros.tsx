import { useMemo, useState } from 'react';
import { Container, Tabs, Tab, Card, Table, Button, Modal, Form, Stack, ListGroup, Badge } from 'react-bootstrap';
import { Plus, Edit2, Trash2 } from 'react-feather';
import type { Client } from '../App';

export interface ProductCatalogItem {
  id: string;
  nome: string;
  categoria: string;
  estoque: number;
  price: number;
}

export interface SupplierProductRecord {
  id: string;
  productId: string;
  productName: string;
  productCategory?: string;
  currency: string;
  price: number;
  referenceCode?: string;
}

export interface SupplierPurchaseRecord {
  id: string;
  productId: string;
  productName: string;
  purchaseDate: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface SupplierRecord {
  id: string;
  nome: string;
  contato: string;
  telefone: string;
  catalog: SupplierProductRecord[];
  purchases: SupplierPurchaseRecord[];
}

export interface SupplierFormPayload {
  nome: string;
  contato: string;
  telefone: string;
}

export interface SupplierSpreadsheetRow {
  supplierName: string;
  contact: string;
  phone?: string;
  productName: string;
  productId?: string;
  productCategory?: string;
  currency: string;
  price: number;
  referenceCode?: string;
  lastPurchaseDate?: string;
  lastPurchaseQuantity?: number;
  lastPurchaseUnitPrice?: number;
  lastPurchaseTotal?: number;
  lastPurchaseNotes?: string;
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
  onCreateSupplier: (supplier: SupplierFormPayload) => void;
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
type SupplierDraft = SupplierFormPayload & { id?: string };
type ProductDraft = Omit<ProductCatalogItem, 'id'> & { id?: string };

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(value) ? value : 0,
  );

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
  price: 0,
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
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const productMatches = useMemo<ProductCatalogItem[]>(() => {
    if (!modalState || modalState.entity !== 'product' || modalState.mode !== 'create') {
      return [];
    }
    const term = productSearchTerm.trim();
    if (!term) return [];
    const normalizedTerm = normalize(term);
    return products
      .filter(product =>
        [product.nome, product.categoria]
          .filter(Boolean)
          .some(value => normalize(String(value)).includes(normalizedTerm)),
      )
      .slice(0, 8);
  }, [modalState, products, productSearchTerm]);

  const handleUseCatalogProduct = (catalogProduct: ProductCatalogItem) => {
    setProductDraft({
      nome: catalogProduct.nome,
      categoria: catalogProduct.categoria ?? '',
      estoque: catalogProduct.estoque ?? 0,
      price: catalogProduct.price ?? 0,
    });
    setProductSearchTerm('');
  };

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
      setProductSearchTerm('');
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
        const { id: supplierId, nome, contato, telefone } = current;
        setSupplierDraft({ id: supplierId, nome, contato, telefone: telefone || '' });
      }
    }
    if (entity === 'product') {
      const current = products.find(product => product.id === id);
      if (current) {
        const { id: productId, ...rest } = current;
        setProductDraft({ ...rest, id: productId });
      }
      setProductSearchTerm('');
    }
  };

  const closeModal = () => {
    setModalState(null);
    setProductSearchTerm('');
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
      const payload = {
        nome: supplierDraft.nome,
        contato: supplierDraft.contato,
        telefone: supplierDraft.telefone,
      };
      if (modalState.mode === 'create') {
        onCreateSupplier(payload);
      } else if (supplierDraft.id) {
        const current = suppliers.find(supplier => supplier.id === supplierDraft.id);
        if (current) {
          onUpdateSupplier({ ...current, ...payload });
        }
      }
    }

    if (modalState.entity === 'product') {
      if (!productDraft.nome || !productDraft.categoria) {
        return;
      }
      const parsedEstoque = Number.isFinite(Number(productDraft.estoque))
        ? Number(productDraft.estoque)
        : 0;
      const parsedPrice = Number(productDraft.price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return;
      }
      const payload = { ...productDraft, estoque: parsedEstoque, price: parsedPrice };
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
            <Form.Label>Endereco</Form.Label>
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
        {modalState.mode === 'create' && (
          <Form.Group className="mb-3">
            <Form.Label>Buscar no banco de produtos</Form.Label>
            <Form.Control
              type="search"
              placeholder="Digite nome ou categoria"
              value={productSearchTerm}
              onChange={event => setProductSearchTerm(event.target.value)}
            />
            <Form.Text className="text-secondary">
              Clique em um resultado para preencher o formulario.
            </Form.Text>
            {productSearchTerm.trim() && (
              <div className="border rounded mt-2" style={{ maxHeight: 200, overflowY: 'auto' }}>
                {productMatches.length === 0 ? (
                  <div className="px-3 py-2 text-secondary small">Nenhum produto encontrado.</div>
                ) : (
                  <ListGroup variant="flush">
                    {productMatches.map(item => (
                      <ListGroup.Item key={item.id} action onClick={() => handleUseCatalogProduct(item)}>
                        <div className="d-flex justify-content-between align-items-start gap-3">
                          <div>
                            <div className="fw-semibold">{item.nome}</div>
                            <small className="text-secondary d-block">{item.categoria || 'Sem categoria'}</small>
                            <small className="text-secondary d-block">{formatCurrency(item.price)}</small>
                          </div>
                          <Badge bg={item.estoque > 0 ? 'success' : 'secondary'}>
                            {item.estoque > 0 ? `${item.estoque} em estoque` : 'Sem estoque'}
                          </Badge>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </div>
            )}
          </Form.Group>
        )}
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
        <Form.Group className="mb-3">
          <Form.Label>Estoque</Form.Label>
          <Form.Control
            type="number"
            min="0"
            value={productDraft.estoque}
            onChange={event => setProductDraft(prev => ({ ...prev, estoque: Number(event.target.value) }))}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Preco</Form.Label>
          <Form.Control
            type="number"
            min="0"
            step="0.01"
            value={productDraft.price}
            onChange={event =>
              setProductDraft(prev => ({ ...prev, price: Number(event.target.value) }))
            }
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
                  <th>Preco</th>
                  <th className="text-end">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {products.map(item => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.categoria}</td>
                    <td>{item.estoque}</td>
                    <td>{formatCurrency(item.price)}</td>
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
                  <th className="text-end">Acoes</th>
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
                  <th>Endereco</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th className="text-end">Acoes</th>
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








