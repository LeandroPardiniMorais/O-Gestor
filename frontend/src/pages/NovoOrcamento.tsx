import { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Container, ListGroup, Modal } from 'react-bootstrap';
import { UserPlus, PlusCircle } from 'react-feather';
import { Client, Material } from '../App'; // Import Client and Material from App

interface Part {
  id: string;
  name: string;
  quantity: number;

  // Inputs
  material: string;
  peso: number;
  tempoImpressao: number; // in hours
  custoAdicional: number;
  acabamento: {
    montagem: string;
    pintura: string;
  };

  // Outputs
  valorPeca: number;
  desconto: number;
  prazo: number; // in hours
}

interface Product {
  id: string;
  name: string;
  quantity: number;
  parts: Part[];
}

interface NovoOrcamentoProps {
  clients: Client[];
  onAddNewClient: (newClient: Omit<Client, 'id'>) => void;
  materials: Material[];
}

const NovoOrcamento = ({ clients, onAddNewClient, materials }: NovoOrcamentoProps) => {
  const costOfHour = 30; // Custo da hora de impressão

  // State variables for form fields
  const [nomeServico, setNomeServico] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Para o campo de busca do cliente
  const [selectedClient, setSelectedClient] = useState<Client | null>(null); // Cliente selecionado
  const [filteredClients, setFilteredClients] = useState<Client[]>([]); // Clientes filtrados para o autocomplete
  const [showClientSuggestions, setShowClientSuggestions] = useState(false); // Controla a visibilidade das sugestões
  const [dataCriacao, setDataCriacao] = useState(new Date().toISOString().split('T')[0]); // Current date, editable
  const [previsaoInicio, setPrevisaoInicio] = useState('');
  const [previsaoEntrega, setPrevisaoEntrega] = useState(''); // Auto-calculated, disabled
  const [formaPagamento, setFormaPagamento] = useState('');
  const [tipoProjeto, setTipoProjeto] = useState('');
  const [enviosProgramados, setEnviosProgramados] = useState<number | ''>(0);
  const [descontoManual, setDescontoManual] = useState('');
  const [enderecoEntrega, setEnderecoEntrega] = useState('');

  // State for products
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCustoProdutos, setTotalCustoProdutos] = useState(0);

  // State for new client modal
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientCpf, setNewClientCpf] = useState('');
  const [newClientTelefone, setNewClientTelefone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientNomeEmpresa, setNewClientNomeEmpresa] = useState('');
  const [newClientCnpj, setNewClientCnpj] = useState('');


  // Handlers for Products and Parts
  const handleAddProduct = () => {
    setProducts([...products, { id: Date.now().toString(), name: '', quantity: 1, parts: [] }]);
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const handleProductChange = (productId: string, field: string, value: string | number) => {
    setProducts(products.map(p => p.id === productId ? { ...p, [field]: value } : p));
  };

  const handleAddPart = (productId: string) => {
    const newProducts = products.map(p => {
      if (p.id === productId) {
        const newPart: Part = {
          id: Date.now().toString(),
          name: '',
          quantity: 1,
          material: materials.length > 0 ? materials[0].name : '',
          peso: 0,
          tempoImpressao: 0,
          custoAdicional: 0,
          acabamento: { montagem: 'N/A', pintura: 'N/A' },
          valorPeca: 0,
          desconto: 0,
          prazo: 0,
        };
        return { ...p, parts: [...p.parts, newPart] };
      }
      return p;
    });
    setProducts(newProducts);
  };

  const handleRemovePart = (productId: string, partId: string) => {
    const newProducts = products.map(p => {
      if (p.id === productId) {
        return { ...p, parts: p.parts.filter(part => part.id !== partId) };
      }
      return p;
    });
    setProducts(newProducts);
  };

  const handlePartChange = (productId: string, partId: string, field: string, value: string | number | boolean) => {
    const newProducts = products.map(p => {
      if (p.id === productId) {
        const updatedParts = p.parts.map(part => {
          if (part.id === partId) {
            const newPart = { ...part, [field]: value };
            if (field === 'montagem' || field === 'pintura') {
              newPart.acabamento = { ...part.acabamento, [field]: value };
            }
            const material = materials.find(m => m.name === newPart.material);
            const materialCost = material ? material.cost : 0;
            newPart.valorPeca = (newPart.peso * materialCost) + (newPart.tempoImpressao * costOfHour) + newPart.custoAdicional;
            return newPart;
          }
          return part;
        });
        return { ...p, parts: updatedParts };
      }
      return p;
    });
    setProducts(newProducts);
  };

  // Effect to calculate total cost
  useEffect(() => {
    const total = products.reduce((acc, product) => {
      const productTotal = product.parts.reduce((partAcc, part) => {
        return partAcc + (part.valorPeca * part.quantity);
      }, 0);
      return acc + (productTotal * product.quantity);
    }, 0);
    setTotalCustoProdutos(total);
  }, [products]);

  const formasPagamento = ['À Vista', '30 Dias', '60 Dias', 'Personalizado'];
  const tiposProjeto = ['Desenhar do 0 (R$2500)', 'Escaneamento (R$200/peça)', 'Cliente já possui 3D (R$0)'];

  // Auto-generated placeholder for Orcamento Number
  const getOrcamentoNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    // This '001' would be dynamic from backend in a real app
    return `${year}${month}${day}.001`;
  };

  // Effect to filter clients based on search term
  useEffect(() => {
    if (searchTerm.length > 0 && !selectedClient) {
      setFilteredClients(
        clients.filter(client =>
          client.nome.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredClients([]);
    }
  }, [searchTerm, clients, selectedClient]);

  // Effect to update enderecoEntrega when selectedClient changes
  useEffect(() => {
    if (selectedClient) {
      setEnderecoEntrega(selectedClient.endereco);
    } else {
      setEnderecoEntrega('');
    }
  }, [selectedClient]);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setSearchTerm(client.nome); // Atualiza o campo de busca com o nome completo
    setShowClientSuggestions(false); // Esconde as sugestões
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedClient(null);
  };

  const handleSaveNewClient = () => {
    if (newClientName && newClientAddress) {
      onAddNewClient({
        nome: newClientName,
        endereco: newClientAddress,
        cpf: newClientCpf,
        telefone: newClientTelefone,
        email: newClientEmail,
        nomeEmpresa: newClientNomeEmpresa,
        cnpj: newClientCnpj,
      });
      setNewClientName('');
      setNewClientAddress('');
      setNewClientCpf('');
      setNewClientTelefone('');
      setNewClientEmail('');
      setNewClientNomeEmpresa('');
      setNewClientCnpj('');
      setShowNewClientModal(false);
    }
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Gerar Novo Orçamento</h2>
      </div>
      <Row className="g-4">
        {/* Coluna do Formulário */}
        <Col lg={7}>
          <Card className="p-4 rounded-4">
            <h4 className="mb-4 border-bottom pb-2">Dados Gerais do Orçamento</h4>

            <Form>
              <Row className="g-3 mb-4">
                {/* Nº Orçamento */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Nº Orçamento</Form.Label>
                    <Form.Control type="text" value={getOrcamentoNumber()} disabled />
                  </Form.Group>
                </Col>
                {/* Data de Criação */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Data de Criação</Form.Label>
                    <Form.Control
                      type="date"
                      value={dataCriacao}
                      onChange={(e) => setDataCriacao(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                {/* Nome do Serviço */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Nome do Serviço</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: Prototipagem de Peça X"
                      value={nomeServico}
                      onChange={(e) => setNomeServico(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Seção Cliente */}
              <fieldset className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Informações do Cliente</h5>
                  <Button variant="outline-danger" onClick={() => setShowNewClientModal(true)} size="sm" title="Novo Cliente">
                    <UserPlus size={16} />
                  </Button>
                </div>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Cliente</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Digite para buscar cliente..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onFocus={() => setShowClientSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowClientSuggestions(false), 100)}
                      />
                      {showClientSuggestions && filteredClients.length > 0 && (
                        <ListGroup className="position-absolute w-100" style={{ zIndex: 1000 }}>
                          {filteredClients.map((client) => (
                            <ListGroup.Item
                              key={client.id}
                              action
                              onMouseDown={() => handleClientSelect(client)}
                            >
                              {client.nome}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Endereço de Entrega</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Endereço do cliente"
                        value={enderecoEntrega}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </fieldset>

              {/* Seção Prazos e Pagamento */}
              <fieldset className="mb-4">
                <h5>Prazos e Pagamento</h5>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Previsão de Início</Form.Label>
                      <Form.Control
                        type="date"
                        value={previsaoInicio}
                        onChange={(e) => setPrevisaoInicio(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Previsão de Entrega</Form.Label>
                      <Form.Control
                        type="date"
                        value={previsaoEntrega} // This will be calculated
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Forma de Pagamento</Form.Label>
                      <Form.Select
                        value={formaPagamento}
                        onChange={(e) => setFormaPagamento(e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {formasPagamento.map((forma) => (
                          <option key={forma} value={forma}>
                            {forma}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Tipo de Projeto</Form.Label>
                      <Form.Select
                        value={tipoProjeto}
                        onChange={(e) => setTipoProjeto(e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {tiposProjeto.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </fieldset>

              {/* Seção Outros Detalhes */}
              <fieldset className="mb-4">
                <h5>Outros Detalhes</h5>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Envios Programados</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        placeholder="Número de envios"
                        value={enviosProgramados}
                        onChange={(e) => setEnviosProgramados(Number(e.target.value))}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Desconto Manual</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ex: 10% ou R$50"
                        value={descontoManual}
                        onChange={(e) => setDescontoManual(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </fieldset>

              {/* Seção de Produtos Dinâmicos */}
              <fieldset className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Produtos</h5>
                  <Button variant="outline-danger" size="sm" onClick={handleAddProduct} title="Adicionar Produto">
                    <PlusCircle size={16} className="me-1" /> Adicionar Produto
                  </Button>
                </div>

                {products.map((product, productIndex) => (
                  <Card key={product.id} className="mb-3">
                    <Card.Body>
                      <Row className="g-3 align-items-center">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Nome do Produto</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Ex: Kit de Engrenagens"
                              value={product.name}
                              onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Quantidade</Form.Label>
                            <Form.Control
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => handleProductChange(product.id, 'quantity', Number(e.target.value))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2} className="text-end">
                          <Button variant="outline-danger" size="sm" onClick={() => handleRemoveProduct(product.id)}>
                            Remover
                          </Button>
                        </Col>
                      </Row>

                      <hr />

                      <h6 className="mt-3">Peças do Produto</h6>
                      {product.parts.map((part) => (
                        <Card key={part.id} className="bg-light p-3 mb-3">
                          <Row className="g-3">
                            {/* Coluna de Inputs */}
                            <Col md={8}>
                              <Row className="g-3">
                                <Col xs={12}>
                                  <Form.Group>
                                    <Form.Label>Nome da Peça</Form.Label>
                                    <Form.Control
                                      type="text"
                                      placeholder="Ex: Engrenagem principal"
                                      value={part.name}
                                      onChange={(e) => handlePartChange(product.id, part.id, 'name', e.target.value)}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Material</Form.Label>
                                    <Form.Select value={part.material} onChange={(e) => handlePartChange(product.id, part.id, 'material', e.target.value)}>
                                      {materials.map(material => (
                                        <option key={material.id} value={material.name}>{material.name}</option>
                                      ))}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Peso (g)</Form.Label>
                                    <Form.Control
                                      type="number"
                                      value={part.peso}
                                      onChange={(e) => handlePartChange(product.id, part.id, 'peso', Number(e.target.value))}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Tempo de Impressão (horas)</Form.Label>
                                    <Form.Control
                                      type="number"
                                      value={part.tempoImpressao}
                                      onChange={(e) => handlePartChange(product.id, part.id, 'tempoImpressao', Number(e.target.value))}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Custo Adicional (R$)</Form.Label>
                                    <Form.Control
                                      type="number"
                                      value={part.custoAdicional}
                                      onChange={(e) => handlePartChange(product.id, part.id, 'custoAdicional', Number(e.target.value))}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Montagem</Form.Label>
                                    <Form.Select value={part.acabamento.montagem} onChange={(e) => handlePartChange(product.id, part.id, 'montagem', e.target.value)}>
                                      <option value="N/A">N/A</option>
                                      <option value="Fácil">Fácil</option>
                                      <option value="Médio">Médio</option>
                                      <option value="Dificil">Difícil</option>
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Pintura</Form.Label>
                                    <Form.Select value={part.acabamento.pintura} onChange={(e) => handlePartChange(product.id, part.id, 'pintura', e.target.value)}>
                                      <option value="N/A">N/A</option>
                                      <option value="Lixar">Lixar</option>
                                      <option value="Primer">Primer</option>
                                      <option value="Verniz">Verniz</option>
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                              </Row>
                            </Col>

                            {/* Coluna de Resultados */}
                            <Col md={4} className="border-start ps-4">
                              <h6 className="text-muted">Resultados</h6>
                              <Form.Group className="mb-2">
                                <Form.Label>Valor por Peça</Form.Label>
                                <Form.Control value={`R$ ${part.valorPeca.toFixed(2)}`} disabled />
                              </Form.Group>
                              <Form.Group className="mb-2">
                                <Form.Label>Desconto</Form.Label>
                                <Form.Control value={`${part.desconto}%`} disabled />
                              </Form.Group>
                              <Form.Group>
                                <Form.Label>Prazo (horas)</Form.Label>
                                <Form.Control value={`${part.prazo} horas`} disabled />
                              </Form.Group>
                              <Button variant="danger" size="sm" className="w-100 mt-3" onClick={() => handleRemovePart(product.id, part.id)}>
                                Remover Peça
                              </Button>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                      <Button variant="secondary" size="sm" className="mt-2" onClick={() => handleAddPart(product.id)}>
                        Adicionar Peça
                      </Button>
                    </Card.Body>
                  </Card>
                ))}
              </fieldset>
            </Form>
          </Card>
        </Col>

        {/* Coluna do Resumo */}
        <Col lg={5}>
          <div className="position-sticky" style={{ top: '2rem' }}>
            <Card className="p-4 rounded-4">
              <h4 className="mb-4 border-bottom pb-2">Resumo do Orçamento</h4>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between"><span className="text-secondary">Custo dos Produtos:</span> <span className="fw-bold">{`R$ ${totalCustoProdutos.toFixed(2)}`}</span></div>
                <div className="d-flex justify-content-between"><span className="text-secondary">Custo de Mão de Obra:</span> <span className="fw-bold">R$ 0,00</span></div>
                <hr className="my-2" />
                <div className="d-flex justify-content-between fs-5"><strong>Subtotal:</strong> <strong className="fw-bold">{`R$ ${totalCustoProdutos.toFixed(2)}`}</strong></div>
                <div className="summary-total p-3 mt-3 rounded-3 text-center">
                  <h3 className="fs-6 mb-1 text-secondary text-uppercase">Total do Orçamento</h3>
                  <div className="display-5 fw-bold text-destaque">{`R$ ${totalCustoProdutos.toFixed(2)}`}</div>
                </div>
                <Button variant="danger" size="lg" className="mt-3">Gerar Orçamento Final</Button>
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Modal Novo Cliente */}
      <Modal show={showNewClientModal} onHide={() => setShowNewClientModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Adicionar Novo Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nome do Cliente</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o nome do cliente"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>CPF</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o CPF do cliente"
                value={newClientCpf}
                onChange={(e) => setNewClientCpf(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Telefone</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o telefone do cliente"
                value={newClientTelefone}
                onChange={(e) => setNewClientTelefone(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Digite o email do cliente"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Endereço</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o endereço do cliente"
                value={newClientAddress}
                onChange={(e) => setNewClientAddress(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nome da Empresa</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o nome da empresa (opcional)"
                value={newClientNomeEmpresa}
                onChange={(e) => setNewClientNomeEmpresa(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>CNPJ</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o CNPJ da empresa (opcional)"
                value={newClientCnpj}
                onChange={(e) => setNewClientCnpj(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewClientModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveNewClient}>
            Salvar Cliente
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default NovoOrcamento;