import { useState, useEffect, useCallback, useMemo } from 'react';
import type { BudgetRecord, BudgetLineProduct, ProductionPlan, ProductionSectorPlan, ProductionSectorKey, BudgetPriority } from '../types/budget';
import { Row, Col, Card, Form, Button, Container, ListGroup, Modal } from 'react-bootstrap';
import { UserPlus, PlusCircle } from 'react-feather';
import type { Client, Material, ServiceFeesConfig } from '../App';

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
  montagem?: string;
  pintura?: string;
  parts: Part[];
}

interface NovoOrcamentoProps {
  clients: Client[];
  onAddNewClient: (newClient: Omit<Client, 'id'>) => void;
  materials: Material[];
  onCreateBudget: (budget: BudgetRecord) => void;
  serviceFees: ServiceFeesConfig;
}

const NovoOrcamento = ({ clients, onAddNewClient, materials, onCreateBudget, serviceFees }: NovoOrcamentoProps) => {
  const costOfHour = 30; // Custo da hora de impressão

const parseCurrencyValue = (value: string) => {
  if (!value) return 0;
  const normalized = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildProductionPlan = (
  resumo: string,
  inicioPrevisto: string,
): ProductionPlan => {
  const formattedInicio = inicioPrevisto ? inicioPrevisto : 'A definir';
  const defaultSector: ProductionSectorPlan = {
    status: 'Aguardando',
    responsavel: 'A definir',
    inicioPrevisto: formattedInicio,
    terminoPrevisto: 'A definir',
  };

  const setores: Record<ProductionSectorKey, ProductionSectorPlan> = {
    impressao: { ...defaultSector, status: 'Pendente' },
    acabamento: { ...defaultSector },
    pintura: { ...defaultSector },
    montagem: { ...defaultSector },
    revisao: { ...defaultSector },
    logistica: { ...defaultSector },
  };

  return {
    resumo,
    setores,
  };
};

const convertProductsToBudgetLines = (products: Product[]): BudgetLineProduct[] =>
  products.map(product => {
    const unitValue = product.parts.reduce((sum, part) => sum + (part.valorPeca * (part.quantity || 0)), 0);
    const totalValue = unitValue * product.quantity;

    return {
      id: product.id,
      nome: product.name || 'Novo produto',
      quantidade: product.quantity,
      valorUnitario: Number(unitValue.toFixed(2)),
      valorTotal: Number(totalValue.toFixed(2)),
      partes: product.parts.map(part => ({
        id: part.id,
        nome: part.name || 'Peça sem título',
        quantidade: part.quantity,
        material: part.material,
        peso: part.peso,
        tempoImpressao: part.tempoImpressao,
        custoAdicional: part.custoAdicional,
        valorCalculado: part.valorPeca,
      })),
    };
  });

  // State variables for form fields
  const [nomeServico, setNomeServico] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Para o campo de busca do cliente
  const [selectedClient, setSelectedClient] = useState<Client | null>(null); // Cliente selecionado
  const [filteredClients, setFilteredClients] = useState<Client[]>([]); // Clientes filtrados para o autocomplete
  const [showClientSuggestions, setShowClientSuggestions] = useState(false); // Controla a visibilidade das sugestÃµes
  const [dataCriacao, setDataCriacao] = useState(new Date().toISOString().split('T')[0]); // Current date, editable
  const [previsaoInicio, setPrevisaoInicio] = useState('');
  const [previsaoEntrega, setPrevisaoEntrega] = useState(''); // Auto-calculated
  const [formaPagamento, setFormaPagamento] = useState('');
  const [formaPagamentoPersonalizada, setFormaPagamentoPersonalizada] = useState('');
  const [tipoProjeto, setTipoProjeto] = useState('');
  const [prioridade, setPrioridade] = useState<BudgetPriority>('media');
  const [enviosProgramados, setEnviosProgramados] = useState<number | ''>(0);
  const [descontoManual, setDescontoManual] = useState('');
  const [enderecoEntrega, setEnderecoEntrega] = useState('');
  const [observacoesOrcamento, setObservacoesOrcamento] = useState('');

  // State for products
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCustoProdutos, setTotalCustoProdutos] = useState(0);
  const [selectedExtraServices, setSelectedExtraServices] = useState<string[]>([]);

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
    setProducts([...products, { id: Date.now().toString(), name: '', quantity: 1, montagem: 'N/A', pintura: 'N/A', parts: [] }]);
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
            const materialCost = material ? material.costPerGram : 0;
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

  const calculateTotalHours = useCallback(() => {
    return products.reduce((total, product) => {
      const hoursPerItem = product.parts.reduce((sum, part) => sum + (part.tempoImpressao || 0), 0);
      return total + (hoursPerItem * product.quantity);
    }, 0);
  }, [products]);

  // Effect to calculate total cost
  useEffect(() => {
    const total = products.reduce((acc, product) => {
      const unitValue = product.parts.reduce((sum, part) => sum + (part.valorPeca * (part.quantity || 0)), 0);
      return acc + (unitValue * product.quantity);
    }, 0);
    setTotalCustoProdutos(total);
  }, [products]);

  useEffect(() => {
    setSelectedExtraServices(prev =>
      prev.filter(id => serviceFees.extras.some(extra => extra.id === id)),
    );
  }, [serviceFees.extras]);

  useEffect(() => {
    if (!previsaoInicio) {
      setPrevisaoEntrega('');
      return;
    }

    const estimatedHours = calculateTotalHours();
    const baseline = new Date(`${previsaoInicio}T08:00:00`);
    if (Number.isNaN(baseline.getTime())) {
      setPrevisaoEntrega('');
      return;
    }

    const hoursWithBuffer = Math.max(estimatedHours, 24);
    const delivery = new Date(baseline.getTime() + (hoursWithBuffer + 8) * 60 * 60 * 1000);
    setPrevisaoEntrega(delivery.toISOString().split('T')[0]);
  }, [previsaoInicio, calculateTotalHours]);

  const formasPagamento = ['Ã€ Vista', '30 Dias', '60 Dias', 'Personalizado'];
  const prioridades: { label: string; value: BudgetPriority }[] = [
    { label: 'Alta', value: 'alta' },
    { label: 'Media', value: 'media' },
    { label: 'Baixa', value: 'baixa' },
  ];
  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;
  const projectTypeOptions = useMemo(
    () => [
      { value: 'design', label: `Desenho do zero (${formatCurrency(serviceFees.design)})`, fee: serviceFees.design },
      { value: 'scan', label: `Escaneamento (${formatCurrency(serviceFees.scan)})`, fee: serviceFees.scan },
      { value: 'existing', label: `Cliente ja possui 3D (${formatCurrency(0)})`, fee: 0 },
    ],
    [serviceFees.design, serviceFees.scan],
  );
  const selectedProjectType = projectTypeOptions.find(option => option.value === tipoProjeto) ?? null;
  const projectServiceFee = selectedProjectType?.fee ?? 0;
  const customPaymentDescription = formaPagamentoPersonalizada.trim();
  const selectedExtras = useMemo(
    () => serviceFees.extras.filter(extra => selectedExtraServices.includes(extra.id)),
    [serviceFees.extras, selectedExtraServices],
  );
  const extrasTotal = useMemo(
    () => selectedExtras.reduce((sum, extra) => sum + extra.amount, 0),
    [selectedExtras],
  );
  const descontoValor = parseCurrencyValue(descontoManual);
  const subtotalOrcamento = totalCustoProdutos + projectServiceFee + extrasTotal;
  const totalComDesconto = Math.max(subtotalOrcamento - descontoValor, 0);

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
    setShowClientSuggestions(false); // Esconde as sugestÃµes
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedClient(null);
  };

  const handleToggleExtraService = (extraId: string) => {
    setSelectedExtraServices(prev =>
      prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId],
    );
  };

  const handleGenerateBudget = () => {
    if (!selectedClient) {
      window.alert('Selecione um cliente antes de gerar o orçamento.');
      return;
    }

    if (products.length === 0) {
      window.alert('Adicione ao menos um produto ao orçamento.');
      return;
    }

    if (!formaPagamento) {
      window.alert('Selecione uma forma de pagamento antes de gerar o orçamento.');
      return;
    }

    const personalPaymentNote = formaPagamento === 'Personalizado' ? customPaymentDescription : '';
    const normalizedObservacoes = observacoesOrcamento.trim();
    if (formaPagamento === 'Personalizado' && !personalPaymentNote) {
      window.alert('Descreva como sera o pagamento personalizado antes de gerar o orçamento.');
      return;
    }

    const items = convertProductsToBudgetLines(products);
    const codigo = getOrcamentoNumber();
    const totalCalculado = totalComDesconto;
    const extraServiceSelections = selectedExtras.map(extra => ({
      id: extra.id,
      nome: extra.name,
      valor: Number(extra.amount.toFixed(2)),
    }));
    const trimmedServiceName = nomeServico.trim();
    if (!trimmedServiceName) {
      window.alert('Informe o nome do serviço antes de gerar o orçamento.');
      return;
    }

    const resumo = trimmedServiceName;
    const producao = buildProductionPlan(resumo, previsaoInicio);
    const estimatedHours = calculateTotalHours();
    const baselineDate = previsaoInicio ? new Date(`${previsaoInicio}T08:00:00`) : new Date();
    const safeBaseline = Number.isNaN(baselineDate.getTime()) ? new Date() : baselineDate;
    const inicioIso = safeBaseline.toISOString();
    const hoursWithBuffer = Math.max(estimatedHours, 24);
    const entregaCalculada = new Date(safeBaseline.getTime() + (hoursWithBuffer + 8) * 60 * 60 * 1000);
    const entregaIso = previsaoEntrega ? new Date(`${previsaoEntrega}T18:00:00`).toISOString() : entregaCalculada.toISOString();


    const budget: BudgetRecord = {
      id: crypto.randomUUID(),
      codigo,
      clienteId: selectedClient.id,
      clienteNome: selectedClient.nome,
      clienteEndereco: selectedClient.endereco || undefined,
      clienteTelefone: selectedClient.telefone || undefined,
      clienteEmail: selectedClient.email || undefined,
      clienteDocumento: selectedClient.cnpj || selectedClient.cpf || undefined,
      formaPagamento,
      formaPagamentoPersonalizado: personalPaymentNote || undefined,
      criadoEm: new Date().toISOString(),
      status: 'enviado',
      total: Number(totalCalculado.toFixed(2)),
      valorServicosProjeto: projectServiceFee ? Number(projectServiceFee.toFixed(2)) : undefined,
      valorServicosExtras: extrasTotal ? Number(extrasTotal.toFixed(2)) : undefined,
      servicosAdicionais: extraServiceSelections.length ? extraServiceSelections : undefined,
      desconto: descontoValor ? Number(descontoValor.toFixed(2)) : undefined,
      observacoes: normalizedObservacoes || undefined,
      resumoDoProjeto: resumo,
      tipoProjeto: selectedProjectType?.value,
      itens: items,
      producao,
      previsaoInicio: inicioIso,
      previsaoEntrega: entregaIso,
      prioridade,
      responsavelProjeto: 'Equipe Comercial',
      etapaAtual: 'Aguardando aprovacao',
      enderecoEntrega: enderecoEntrega || undefined,
      enviosProgramados: typeof enviosProgramados === 'number' ? enviosProgramados : undefined,
    };

    onCreateBudget(budget);
    window.alert('Orçamento registrado e encaminhado para aprovação do cliente.');
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
        <h2 className="mb-0">Gerar Novo OrÃ§amento</h2>
      </div>
      <Row className="g-4">
        {/* Coluna do FormulÃ¡rio */}
        <Col lg={7}>
          <Card className="p-4 rounded-4">
            <h4 className="mb-4 border-bottom pb-2">Dados Gerais do OrÃ§amento</h4>

            <Form>
              <Row className="g-3 mb-4">
                {/* NÂº OrÃ§amento */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>NÂº OrÃ§amento</Form.Label>
                    <Form.Control type="text" value={getOrcamentoNumber()} disabled />
                  </Form.Group>
                </Col>
                {/* Data de CriaÃ§Ã£o */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Data de CriaÃ§Ã£o</Form.Label>
                    <Form.Control
                      type="date"
                      value={dataCriacao}
                      onChange={(e) => setDataCriacao(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                {/* Nome do ServiÃ§o */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Nome do serviço <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: Prototipagem de PeÃ§a X"
                      required aria-required="true"
                      value={nomeServico}
                      onChange={(e) => setNomeServico(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* SeÃ§Ã£o Cliente */}
              <fieldset className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5>InformaÃ§Ãµes do Cliente</h5>
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
                      <Form.Label>EndereÃ§o de Entrega</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="EndereÃ§o do cliente"
                        value={enderecoEntrega}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Prioridade</Form.Label>
                      <Form.Select
                        value={prioridade}
                        onChange={(e) => setPrioridade(e.target.value as BudgetPriority)}
                      >
                        {prioridades.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  {serviceFees.extras.length > 0 && (
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Servicos extras</Form.Label>
                        <div className="d-flex flex-column gap-2">
                          {serviceFees.extras.map(extra => (
                            <Form.Check
                              key={extra.id}
                              type="checkbox"
                              label={`${extra.name} (${formatCurrency(extra.amount)})`}
                              checked={selectedExtraServices.includes(extra.id)}
                              onChange={() => handleToggleExtraService(extra.id)}
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                  )}
                </Row>
              </fieldset>

              {/* SeÃ§Ã£o Prazos e Pagamento */}
              <fieldset className="mb-4">
                <h5>Prazos e Pagamento</h5>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>PrevisÃ£o de InÃ­cio</Form.Label>
                      <Form.Control
                        type="date"
                        value={previsaoInicio}
                        onChange={(e) => setPrevisaoInicio(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>PrevisÃ£o de Entrega</Form.Label>
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
                        onChange={event => {
                          const value = event.target.value;
                          setFormaPagamento(value);
                          if (value !== 'Personalizado') {
                            setFormaPagamentoPersonalizada('');
                          }
                        }}
                      >
                        <option value="">Selecione</option>
                        {formasPagamento.map((forma) => (
                          <option key={forma} value={forma}>
                            {forma}
                          </option>
                        ))}
                      </Form.Select>
                      {formaPagamento === 'Personalizado' ? (
                        <Form.Control
                          type="text"
                          className="mt-3"
                          placeholder="Descreva como sera o pagamento combinado"
                          value={formaPagamentoPersonalizada}
                          onChange={event => setFormaPagamentoPersonalizada(event.target.value)}
                          required
                        />
                      ) : null}
                    </Form.Group>
                    <Form.Group controlId="observacoesOrcamento" className="mt-3">
                      <Form.Label>Observacoes para o cliente</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={observacoesOrcamento}
                        onChange={event => setObservacoesOrcamento(event.target.value)}
                        placeholder="Mensagem opcional exibida no PDF do orcamento"
                      />
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
                        {projectTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  {serviceFees.extras.length > 0 && (
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Servicos extras</Form.Label>
                        <div className="d-flex flex-column gap-2">
                          {serviceFees.extras.map(extra => (
                            <Form.Check
                              key={extra.id}
                              type="checkbox"
                              label={`${extra.name} (${formatCurrency(extra.amount)})`}
                              checked={selectedExtraServices.includes(extra.id)}
                              onChange={() => handleToggleExtraService(extra.id)}
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                  )}
                </Row>
              </fieldset>

              {/* SeÃ§Ã£o Outros Detalhes */}
              <fieldset className="mb-4">
                <h5>Outros Detalhes</h5>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Envios Programados</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        placeholder="NÃºmero de envios"
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
                  {serviceFees.extras.length > 0 && (
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Servicos extras</Form.Label>
                        <div className="d-flex flex-column gap-2">
                          {serviceFees.extras.map(extra => (
                            <Form.Check
                              key={extra.id}
                              type="checkbox"
                              label={`${extra.name} (${formatCurrency(extra.amount)})`}
                              checked={selectedExtraServices.includes(extra.id)}
                              onChange={() => handleToggleExtraService(extra.id)}
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                  )}
                </Row>
              </fieldset>

              {/* SeÃ§Ã£o de Produtos DinÃ¢micos */}
              <fieldset className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Produtos</h5>
                  <Button variant="outline-danger" size="sm" onClick={handleAddProduct} title="Adicionar Produto">
                    <PlusCircle size={16} className="me-1" /> Adicionar Produto
                  </Button>
                </div>

                {products.map((product) => {
                  const unitValue = product.parts.reduce((sum, part) => sum + (part.valorPeca * (part.quantity || 0)), 0);
                  const totalValue = unitValue * product.quantity;

                  return (
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

                        <Row className="g-3 mt-2">
                          <Col md={6}>
                            <div className="text-secondary text-uppercase small">Valor unitario</div>
                            <div className="fw-semibold">{`R$ ${unitValue.toFixed(2)}`}</div>
                          </Col>
                          <Col md={6} className="text-md-end">
                            <div className="text-secondary text-uppercase small">Subtotal do produto</div>
                            <div className="fw-semibold">{`R$ ${totalValue.toFixed(2)}`}</div>
                          </Col>
                        </Row>

                        <hr />

                        <h6 className="mt-3">Pecas do Produto</h6>
                        {product.parts.map((part) => (
                          <Card key={part.id} className="bg-light p-3 mb-3">
                            <Row className="g-3">
                              {/* Coluna de Inputs */}
                              <Col md={8}>
                                <Row className="g-3">
                                  <Col xs={12}>
                                    <Form.Group>
                                      <Form.Label>Nome da Peca</Form.Label>
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
                                      <Form.Label>Tempo de Impressao (horas)</Form.Label>
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
                                        <option value="Facil">Facil</option>
                                        <option value="Medio">Medio</option>
                                        <option value="Dificil">Dificil</option>
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
                                  <Form.Label>Valor por Peca</Form.Label>
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
                                  Remover Peca
                                </Button>
                              </Col>
                            </Row>
                          </Card>
                        ))}
                        <Button variant="secondary" size="sm" className="mt-2" onClick={() => handleAddPart(product.id)}>
                          Adicionar Peca
                        </Button>
                      </Card.Body>
                    </Card>
                  );
                })}
              </fieldset>
            </Form>
          </Card>
        </Col>

        {/* Coluna do Resumo */}
        <Col lg={5}>
          <div className="position-sticky" style={{ top: '2rem' }}>
            <Card className="p-4 rounded-4">
              <h4 className="mb-4 border-bottom pb-2">Resumo do OrÃ§amento</h4>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between"><span className="text-secondary">Custo dos produtos:</span> <span className="fw-bold">{`R$ ${totalCustoProdutos.toFixed(2)}`}</span></div>
                {projectServiceFee > 0 && (
                  <div className="d-flex justify-content-between"><span className="text-secondary">Servico do projeto:</span> <span className="fw-bold">{`R$ ${projectServiceFee.toFixed(2)}`}</span></div>
                )}
                {selectedProjectType && (
                  <div className="text-secondary small">{`Tipo de projeto selecionado: ${selectedProjectType.label}`}</div>
                )}
                {selectedExtras.length > 0 && (
                  <div className="d-flex justify-content-between"><span className="text-secondary">Servicos extras:</span> <span className="fw-bold">{`R$ ${extrasTotal.toFixed(2)}`}</span></div>
                )}
                {selectedExtras.length > 0 && (
                  <div className="text-secondary small">{selectedExtras.map(extra => extra.name).join(', ')}</div>
                )}
                {formaPagamento ? (
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary">Forma de pagamento:</span>
                    <span className="fw-bold">{formaPagamento}</span>
                  </div>
                ) : null}
                {formaPagamento === 'Personalizado' && customPaymentDescription ? (
                  <div className="text-secondary small">{customPaymentDescription}</div>
                ) : null}
                {observacoesOrcamento.trim() ? (
                  <div className="bg-light border rounded-3 p-3">
                    <div className="text-secondary text-uppercase small mb-1">Observacoes</div>
                    <div>{observacoesOrcamento.trim()}</div>
                  </div>
                ) : null}
                {descontoValor > 0 && (
                  <div className="d-flex justify-content-between text-danger"><span className="text-secondary">Desconto manual:</span> <span className="fw-bold">{`- R$ ${descontoValor.toFixed(2)}`}</span></div>
                )}
                {products.length > 0 && (
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="text-secondary text-uppercase small">Resumo por produto</div>
                    <div className="mt-2 d-flex flex-column gap-2">
                      {products.map((product) => {
                        const unitValue = product.parts.reduce((sum, part) => sum + (part.valorPeca * (part.quantity || 0)), 0);
                        const totalValue = unitValue * product.quantity;
                        const label = product.name ? product.name : 'Produto sem nome';
                        return (
                          <div key={product.id} className="d-flex flex-column">
                            <div className="d-flex justify-content-between">
                              <span>{`${label} x ${product.quantity}`}</span>
                              <span className="fw-semibold">{`R$ ${totalValue.toFixed(2)}`}</span></div>
                            <span className="text-secondary small">{`R$ ${unitValue.toFixed(2)} por unidade`}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <hr className="my-2" />
                <div className="d-flex justify-content-between fs-5"><strong>Subtotal:</strong> <strong className="fw-bold">{`R$ ${subtotalOrcamento.toFixed(2)}`}
                </strong></div>
                <div className="summary-total p-3 mt-3 rounded-3 text-center">
                  <h3 className="fs-6 mb-1 text-secondary text-uppercase">Total do Orcamento</h3>
                  <div className="display-5 fw-bold text-destaque">{`R$ ${totalComDesconto.toFixed(2)}`}</div>
                </div>

                <Button variant="danger" size="lg" className="mt-3" onClick={handleGenerateBudget}>Gerar Orçamento Final</Button>
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
              <Form.Label>EndereÃ§o</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o endereÃ§o do cliente"
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



















