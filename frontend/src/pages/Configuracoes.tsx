import { useEffect, useMemo, useState } from 'react';
import { Container, Table, Button, Modal, Form, Card, Row, Col } from 'react-bootstrap';
import type { Material, AdditionalServiceConfig, ServiceFeesConfig } from '../App';
import type { CompanyProfile } from '../types/company';

interface ConfiguracoesProps {
  materials: Material[];
  machineCount: number;
  serviceFees: ServiceFeesConfig;
  onUpdateMaterials: (updatedMaterials: Material[]) => void;
  onUpdateMachineCount: (nextCount: number) => void;
  onUpdateServiceFees: (nextFees: ServiceFeesConfig) => void;
  companyProfile: CompanyProfile;
  onUpdateCompanyProfile: (profile: CompanyProfile) => void;
}

type ModalMode = 'create' | 'edit';
type ExtraModalMode = 'create' | 'edit';

type PendingMachineCount = number | null;
type PendingServiceFees = ServiceFeesConfig | null;

const normalizeCurrency = (value: number) => Number(value.toFixed(2));

const cloneExtras = (extras: AdditionalServiceConfig[]) => extras.map(extra => ({ ...extra }));

const Configuracoes = ({
  materials,
  machineCount,
  serviceFees,
  onUpdateMaterials,
  onUpdateMachineCount,
  onUpdateServiceFees,
  companyProfile,
  onUpdateCompanyProfile,
}: ConfiguracoesProps) => {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCostPerKg, setDraftCostPerKg] = useState('');

  const [draftMachineCount, setDraftMachineCount] = useState(machineCount.toString());
  const [showMachineConfirm, setShowMachineConfirm] = useState(false);
  const [pendingMachineCount, setPendingMachineCount] = useState<PendingMachineCount>(null);

  const [draftDesignFee, setDraftDesignFee] = useState(serviceFees.design.toString());
  const [draftScanFee, setDraftScanFee] = useState(serviceFees.scan.toString());
  const [draftExtras, setDraftExtras] = useState<AdditionalServiceConfig[]>(cloneExtras(serviceFees.extras));
  const [showServiceConfirm, setShowServiceConfirm] = useState(false);
  const [pendingServiceFees, setPendingServiceFees] = useState<PendingServiceFees>(null);

  const [extraModalMode, setExtraModalMode] = useState<ExtraModalMode | null>(null);
  const [draftExtraId, setDraftExtraId] = useState<string | null>(null);
  const [draftExtraName, setDraftExtraName] = useState('');
  const [draftExtraAmount, setDraftExtraAmount] = useState('');
  const [draftCompany, setDraftCompany] = useState<CompanyProfile>({ ...companyProfile });

  useEffect(() => {
    setDraftMachineCount(machineCount.toString());
  }, [machineCount]);

  useEffect(() => {
    setDraftDesignFee(serviceFees.design.toString());
    setDraftScanFee(serviceFees.scan.toString());
    setDraftExtras(cloneExtras(serviceFees.extras));
  }, [serviceFees]);

  useEffect(() => {
    setDraftCompany({ ...companyProfile });
  }, [companyProfile]);

  const sortedMaterials = useMemo(
    () => [...materials].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [materials],
  );

  const draftCostPerGram = useMemo(() => {
    const parsed = Number(draftCostPerKg);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return normalizeCurrency((parsed * 17) / 1000);
  }, [draftCostPerKg]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setDraftId(null);
    setDraftName('');
    setDraftCostPerKg('');
  };

  const handleOpenEdit = (material: Material) => {
    setModalMode('edit');
    setDraftId(material.id);
    setDraftName(material.name);
    setDraftCostPerKg(material.costPerKg.toString());
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setDraftId(null);
    setDraftName('');
    setDraftCostPerKg('');
  };

  const handleSaveMaterial = () => {
    if (!modalMode) return;

    const normalizedName = draftName.trim();
    const parsedCost = Number(draftCostPerKg);
    if (!normalizedName || !Number.isFinite(parsedCost) || parsedCost <= 0) {
      return;
    }

    const costPerKg = normalizeCurrency(parsedCost);
    const costPerGram = normalizeCurrency((costPerKg * 17) / 1000);

    if (modalMode === 'create') {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      const newMaterial: Material = {
        id,
        name: normalizedName,
        costPerKg,
        costPerGram,
      };
      onUpdateMaterials([...materials, newMaterial]);
    } else if (modalMode === 'edit' && draftId) {
      const updated = materials.map(material =>
        material.id === draftId
          ? { ...material, name: normalizedName, costPerKg, costPerGram }
          : material,
      );
      onUpdateMaterials(updated);
    }

    handleCloseModal();
  };

  const machineInputNumber = Number(draftMachineCount);
  const machineInputIsValid = Number.isFinite(machineInputNumber) && machineInputNumber > 0 && Number.isInteger(machineInputNumber);
  const hasMachineChange = machineInputIsValid && machineInputNumber !== machineCount;

  const handlePrepareMachineUpdate = () => {
    if (!machineInputIsValid) {
      return;
    }
    setPendingMachineCount(machineInputNumber);
    setShowMachineConfirm(true);
  };

  const handleConfirmMachineUpdate = () => {
    if (pendingMachineCount === null) {
      return;
    }
    onUpdateMachineCount(pendingMachineCount);
    setShowMachineConfirm(false);
    setPendingMachineCount(null);
  };

  const handleCancelMachineUpdate = () => {
    setShowMachineConfirm(false);
    setPendingMachineCount(null);
  };

  const handleCompanyFieldChange = (field: keyof CompanyProfile, value: string) => {
    setDraftCompany(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetCompanyDraft = () => {
    setDraftCompany({ ...companyProfile });
  };

  const handleSaveCompanyProfile = () => {
    if (!companyIsValid) {
      return;
    }
    onUpdateCompanyProfile(normalizedCompany);
  };

  const designFeeCandidate = Number(draftDesignFee);
  const scanFeeCandidate = Number(draftScanFee);
  const designFeeIsValid = Number.isFinite(designFeeCandidate) && designFeeCandidate >= 0;
  const scanFeeIsValid = Number.isFinite(scanFeeCandidate) && scanFeeCandidate >= 0;

  const normalizedDesignFee = designFeeIsValid ? normalizeCurrency(designFeeCandidate) : null;
  const normalizedScanFee = scanFeeIsValid ? normalizeCurrency(scanFeeCandidate) : null;

  const normalizedDraftExtras = useMemo(
    () =>
      draftExtras.map(extra => ({
        ...extra,
        name: extra.name.trim(),
        amount: normalizeCurrency(extra.amount),
      })),
    [draftExtras],
  );

  const normalizedCompany = useMemo<CompanyProfile>(() => ({
    name: (draftCompany.name ?? '').trim(),
    address: draftCompany.address?.trim() || undefined,
    phone: draftCompany.phone?.trim() || undefined,
    email: draftCompany.email?.trim() || undefined,
    website: draftCompany.website?.trim() || undefined,
  }), [draftCompany]);

  const companySnapshot = useMemo<CompanyProfile>(() => ({
    name: (companyProfile.name ?? '').trim(),
    address: companyProfile.address?.trim() || undefined,
    phone: companyProfile.phone?.trim() || undefined,
    email: companyProfile.email?.trim() || undefined,
    website: companyProfile.website?.trim() || undefined,
  }), [companyProfile]);

  const companyIsValid = normalizedCompany.name.length > 0;

  const companyChanged = useMemo(() => JSON.stringify(normalizedCompany) !== JSON.stringify(companySnapshot), [normalizedCompany, companySnapshot]);

  const extrasChanged = useMemo(() => {
    const original = JSON.stringify(
      serviceFees.extras
        .map(extra => ({ ...extra, name: extra.name.trim(), amount: normalizeCurrency(extra.amount) }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    );
    const draftSnapshot = JSON.stringify(
      normalizedDraftExtras.slice().sort((a, b) => a.id.localeCompare(b.id)),
    );
    return original !== draftSnapshot;
  }, [serviceFees.extras, normalizedDraftExtras]);

  const hasServiceChange =
    (normalizedDesignFee !== null && normalizedDesignFee !== normalizeCurrency(serviceFees.design)) ||
    (normalizedScanFee !== null && normalizedScanFee !== normalizeCurrency(serviceFees.scan)) ||
    extrasChanged;

  const handlePrepareServiceUpdate = () => {
    if (!hasServiceChange || normalizedDesignFee === null || normalizedScanFee === null) {
      return;
    }
    setPendingServiceFees({
      design: normalizedDesignFee,
      scan: normalizedScanFee,
      extras: normalizedDraftExtras,
    });
    setShowServiceConfirm(true);
  };

  const handleConfirmServiceUpdate = () => {
    if (!pendingServiceFees) {
      return;
    }
    onUpdateServiceFees(pendingServiceFees);
    setPendingServiceFees(null);
    setShowServiceConfirm(false);
  };

  const handleCancelServiceUpdate = () => {
    setPendingServiceFees(null);
    setShowServiceConfirm(false);
  };

  const handleOpenExtraModal = (mode: ExtraModalMode, extra?: AdditionalServiceConfig) => {
    setExtraModalMode(mode);
    if (mode === 'edit' && extra) {
      setDraftExtraId(extra.id);
      setDraftExtraName(extra.name);
      setDraftExtraAmount(extra.amount.toString());
    } else {
      setDraftExtraId(null);
      setDraftExtraName('');
      setDraftExtraAmount('');
    }
  };

  const handleCloseExtraModal = () => {
    setExtraModalMode(null);
    setDraftExtraId(null);
    setDraftExtraName('');
    setDraftExtraAmount('');
  };

  const handleSaveExtra = () => {
    if (!extraModalMode) return;

    const normalizedName = draftExtraName.trim();
    const parsedAmount = Number(draftExtraAmount);
    if (!normalizedName || !Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return;
    }

    const normalizedAmount = normalizeCurrency(parsedAmount);

    if (extraModalMode === 'create') {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      setDraftExtras(prev => [...prev, { id, name: normalizedName, amount: normalizedAmount }]);
    } else if (extraModalMode === 'edit' && draftExtraId) {
      setDraftExtras(prev =>
        prev.map(extra => (extra.id === draftExtraId ? { ...extra, name: normalizedName, amount: normalizedAmount } : extra)),
      );
    }

    handleCloseExtraModal();
  };

  const handleDeleteExtra = (id: string) => {
    const target = draftExtras.find(extra => extra.id === id);
    if (!target) return;
    const confirmed = window.confirm(`Remover o serviço "${target.name}"?`);
    if (!confirmed) return;
    setDraftExtras(prev => prev.filter(extra => extra.id !== id));
  };

  const previewServiceFees = pendingServiceFees ?? {
    design: normalizeCurrency(serviceFees.design),
    scan: normalizeCurrency(serviceFees.scan),
    extras: normalizedDraftExtras,
  };

    const renderCompanyCard = () => (
    <Card className="mb-4">
      <Card.Header className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2">
        <div>
          <h4 className="mb-1">Dados da empresa</h4>
          <small className="text-muted">Essas informacoes aparecem nos orcamentos enviados aos clientes.</small>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={handleResetCompanyDraft} disabled={!companyChanged}>
            Reverter
          </Button>
          <Button variant="primary" size="sm" onClick={handleSaveCompanyProfile} disabled={!companyIsValid || !companyChanged}>
            Salvar dados
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="g-3">
          <Col md={6}>
            <Form.Group controlId="companyName">
              <Form.Label>Nome da empresa</Form.Label>
              <Form.Control
                type="text"
                value={draftCompany.name ?? ''}
                onChange={event => handleCompanyFieldChange('name', event.target.value)}
                isInvalid={!companyIsValid}
                placeholder="Ex: Vortex Projetos"
                required
              />
              <Form.Control.Feedback type="invalid">Informe o nome da empresa.</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="companyAddress">
              <Form.Label>Endereco</Form.Label>
              <Form.Control
                type="text"
                value={draftCompany.address ?? ''}
                onChange={event => handleCompanyFieldChange('address', event.target.value)}
                placeholder="Rua, numero, cidade - UF"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="companyPhone">
              <Form.Label>Telefone</Form.Label>
              <Form.Control
                type="text"
                value={draftCompany.phone ?? ''}
                onChange={event => handleCompanyFieldChange('phone', event.target.value)}
                placeholder="(00) 00000-0000"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="companyEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={draftCompany.email ?? ''}
                onChange={event => handleCompanyFieldChange('email', event.target.value)}
                placeholder="contato@empresa.com"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="companyWebsite">
              <Form.Label>Website</Form.Label>
              <Form.Control
                type="text"
                value={draftCompany.website ?? ''}
                onChange={event => handleCompanyFieldChange('website', event.target.value)}
                placeholder="www.seusite.com"
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

const renderServiceFeeCard = () => (
    <Card className="mb-4">
      <Card.Header>
        <h4>Servicos adicionais</h4>
      </Card.Header>
      <Card.Body>
        <Row className="g-3 align-items-end">
          <Col md={4} lg={3}>
            <Form.Label>Projeto desenhado do zero (R$)</Form.Label>
            <Form.Control
              type="number"
              min="0"
              step="0.01"
              value={draftDesignFee}
              onChange={event => setDraftDesignFee(event.target.value)}
              isInvalid={!designFeeIsValid}
            />
            <Form.Control.Feedback type="invalid">Informe um valor maior ou igual a zero.</Form.Control.Feedback>
            <Form.Text className="text-muted">Atual: {`R$ ${serviceFees.design.toFixed(2)}`}</Form.Text>
          </Col>
          <Col md={4} lg={3}>
            <Form.Label>Servico de escaneamento (R$)</Form.Label>
            <Form.Control
              type="number"
              min="0"
              step="0.01"
              value={draftScanFee}
              onChange={event => setDraftScanFee(event.target.value)}
              isInvalid={!scanFeeIsValid}
            />
            <Form.Control.Feedback type="invalid">Informe um valor maior ou igual a zero.</Form.Control.Feedback>
            <Form.Text className="text-muted">Atual: {`R$ ${serviceFees.scan.toFixed(2)}`}</Form.Text>
          </Col>
          <Col xs="auto" className="d-flex align-items-end pb-1">
            <Button variant="primary" onClick={handlePrepareServiceUpdate} disabled={!hasServiceChange}>
              Atualizar valores
            </Button>
          </Col>
        </Row>

        <hr className="my-4" />
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Servicos extras configurados</h5>
          <Button size="sm" variant="outline-primary" onClick={() => handleOpenExtraModal('create')}>
            Adicionar servico
          </Button>
        </div>
        {draftExtras.length === 0 ? (
          <p className="text-muted mb-0">Nenhum servico extra cadastrado.</p>
        ) : (
          <Table striped bordered hover responsive size="sm" className="mb-0">
            <thead>
              <tr>
                <th>Servico</th>
                <th>Valor (R$)</th>
                <th style={{ width: '1%', whiteSpace: 'nowrap' }}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {draftExtras.map(extra => (
                <tr key={extra.id}>
                  <td>{extra.name}</td>
                  <td>{`R$ ${extra.amount.toFixed(2)}`}</td>
                  <td className="text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => handleOpenExtraModal('edit', extra)}
                      >
                        Editar
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDeleteExtra(extra.id)}>
                        Remover
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );

  const renderMachineCard = () => (
    <Card className="mb-4">
      <Card.Header>
        <h4>Capacidade operacional</h4>
      </Card.Header>
      <Card.Body>
        <Row className="align-items-end g-3">
          <Col md={4} lg={3}>
            <Form.Label>Maquinas ativas</Form.Label>
            <Form.Control
              type="number"
              min="1"
              step="1"
              value={draftMachineCount}
              onChange={event => setDraftMachineCount(event.target.value)}
              isInvalid={!machineInputIsValid && draftMachineCount.trim() !== ''}
            />
            <Form.Control.Feedback type="invalid">Informe um valor inteiro maior que zero.</Form.Control.Feedback>
            <Form.Text className="text-muted">Informe apenas maquinas operando.</Form.Text>
          </Col>
          <Col xs="auto">
            <Button variant="primary" onClick={handlePrepareMachineUpdate} disabled={!hasMachineChange}>
              Atualizar quantidade
            </Button>
          </Col>
          <Col xs="12" md="auto" className="text-muted">
            Atual: {machineCount}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  return (
    <Container fluid>
      <div className="d-flex align-items-center mb-4">
        <h2 className="mb-0">Configuracoes</h2>
      </div>

      {renderCompanyCard()}
      {renderServiceFeeCard()}
      {renderMachineCard()}

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Tabela de custos de materiais</h4>
          <Button size="sm" variant="primary" onClick={handleOpenCreate}>Adicionar material</Button>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Material</th>
                <th>Custo por kg (R$)</th>
                <th>Custo por grama (R$)</th>
                <th style={{ width: '1%', whiteSpace: 'nowrap' }}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {sortedMaterials.map(material => (
                <tr key={material.id}>
                  <td>{material.name}</td>
                  <td>{`R$ ${material.costPerKg.toFixed(2)}`}</td>
                  <td>{`R$ ${material.costPerGram.toFixed(4)}`}</td>
                  <td className="text-end">
                    <Button size="sm" variant="outline-secondary" onClick={() => handleOpenEdit(material)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={modalMode !== null} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'create' ? 'Adicionar novo material' : 'Editar material'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nome do material</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o nome do material"
                value={draftName}
                onChange={event => setDraftName(event.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Custo por kg (R$)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                placeholder="Informe o valor por kg"
                value={draftCostPerKg}
                onChange={event => setDraftCostPerKg(event.target.value)}
              />
              <Form.Text className="text-muted">Informe o preco por kg; o custo por grama e calculado automaticamente.</Form.Text>
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Custo por grama (R$)</Form.Label>
              <Form.Control
                type="text"
                value={draftCostPerGram !== null ? `R$ ${draftCostPerGram.toFixed(4)}` : 'N/A'}
                readOnly
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveMaterial}>
            Salvar material
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showServiceConfirm} onHide={handleCancelServiceUpdate}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar atualizacao</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            Projeto do zero: <strong>{`R$ ${previewServiceFees.design.toFixed(2)}`}</strong>
            <br />
            Escaneamento: <strong>{`R$ ${previewServiceFees.scan.toFixed(2)}`}</strong>
          </p>
          <div>
            <span className="text-secondary">Servicos extras:</span>
            {previewServiceFees.extras.length === 0 ? (
              <p className="mb-0 text-secondary">Nenhum servico extra configurado.</p>
            ) : (
              <ul className="mb-0">
                {previewServiceFees.extras.map(extra => (
                  <li key={extra.id}>{`${extra.name} - R$ ${extra.amount.toFixed(2)}`}</li>
                ))}
              </ul>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelServiceUpdate}>
            Nao
          </Button>
          <Button variant="primary" onClick={handleConfirmServiceUpdate}>
            Sim, atualizar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showMachineConfirm} onHide={handleCancelMachineUpdate}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar atualizacao</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Tem certeza de que deseja definir <strong>{pendingMachineCount ?? machineCount}</strong> maquinas ativas?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelMachineUpdate}>
            Nao
          </Button>
          <Button variant="primary" onClick={handleConfirmMachineUpdate}>
            Sim, atualizar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={extraModalMode !== null} onHide={handleCloseExtraModal}>
        <Modal.Header closeButton>
          <Modal.Title>{extraModalMode === 'create' ? 'Adicionar servico extra' : 'Editar servico extra'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nome do servico</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ex: Montagem especial"
                value={draftExtraName}
                onChange={event => setDraftExtraName(event.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Valor (R$)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                placeholder="Informe o valor"
                value={draftExtraAmount}
                onChange={event => setDraftExtraAmount(event.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseExtraModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveExtra}>
            Salvar servico
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Configuracoes;
