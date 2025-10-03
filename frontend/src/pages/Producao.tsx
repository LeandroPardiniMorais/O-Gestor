import { useMemo, useState, type ComponentType } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  ProgressBar,
  Badge,
  Button,
  Offcanvas,
  Accordion,
  Stack,
} from 'react-bootstrap';
import { ChevronRight, Printer, Scissors, Droplet, Tool, CheckCircle, Truck } from 'react-feather';
import type { BudgetRecord, ProductionSectorPlan, ProductionSectorKey, BudgetPriority } from '../types/budget';

interface ProducaoProps {
  budgets: BudgetRecord[];
}

interface SectorInfo {
  status: string;
  responsavel: string;
  inicioPrevisto: string;
  terminoPrevisto: string;
  observacoes?: string;
  percentual?: number;
}

interface Project {
  id: string;
  nome: string;
  cliente: string;
  etapa: string;
  progresso: number;
  previsaoEntrega: string;
  responsavel: string;
  prioridade: 'Alta' | 'Media' | 'Baixa';
  ultimaAtualizacao: string;
  setores: Record<SectorKey, SectorInfo>;
}

type SectorKey = ProductionSectorKey;

type QueueStatus = 'Em andamento' | 'Pendente' | 'Conclu�do';

const priorityLabelMap: Record<BudgetPriority, Project['prioridade']> = {
  alta: 'Alta',
  media: 'Media',
  baixa: 'Baixa',
};

const priorityVariantMap: Record<Project['prioridade'], string> = {
  Alta: 'danger',
  Media: 'warning',
  Baixa: 'secondary',
};

const mockProjects: Project[] = [
  {
    id: '1',
    nome: 'Projeto Suporte Monitor',
    cliente: 'Jo�o Silva',
    etapa: 'Impress�o',
    progresso: 65,
    previsaoEntrega: '25/09/2025',
    responsavel: 'Ana Lima',
    prioridade: 'Alta',
    ultimaAtualizacao: 'H� 2 horas',
    setores: {
      impressao: {
        status: 'Em andamento',
        responsavel: 'Ana Lima',
        inicioPrevisto: 'Hoje - 08:00',
        terminoPrevisto: 'Hoje - 15:30',
        observacoes: 'Fila posicionada na impressora Prusa #2 com PLA vermelho.',
        percentual: 65,
      },
      acabamento: {
        status: 'Pendente',
        responsavel: 'Equipe B',
        inicioPrevisto: 'Hoje - 16:00',
        terminoPrevisto: 'Hoje - 17:30',
        observacoes: 'Necess�rio lixamento fino e primer cinza.',
      },
      pintura: {
        status: 'Aguardando',
        responsavel: 'Carla Souza',
        inicioPrevisto: '26/09 - 09:00',
        terminoPrevisto: '26/09 - 11:00',
        observacoes: 'Aplicar verniz fosco.',
      },
      montagem: {
        status: 'Aguardando',
        responsavel: 'Equipe Montagem 1',
        inicioPrevisto: '26/09 - 13:00',
        terminoPrevisto: '26/09 - 16:00',
      },
      revisao: {
        status: 'Aguardando',
        responsavel: 'Lucas Martins',
        inicioPrevisto: '27/09 - 09:00',
        terminoPrevisto: '27/09 - 10:00',
      },
      logistica: {
        status: 'Aguardando',
        responsavel: 'Equipe Log�stica',
        inicioPrevisto: '27/09 - 14:00',
        terminoPrevisto: '27/09 - 17:00',
      },
    },
  },
  {
    id: '2',
    nome: 'Case Raspberry Pi',
    cliente: 'Maria Oliveira',
    etapa: 'Acabamento',
    progresso: 45,
    previsaoEntrega: '28/09/2025',
    responsavel: 'Marcelo Tavares',
    prioridade: 'Media',
    ultimaAtualizacao: 'H� 30 minutos',
    setores: {
      impressao: {
        status: 'Conclu�do',
        responsavel: 'Equipe Impress�o',
        inicioPrevisto: 'Ontem - 07:30',
        terminoPrevisto: 'Ontem - 18:00',
        observacoes: 'Pe�as aprovadas no checklist dimensional.',
        percentual: 100,
      },
      acabamento: {
        status: 'Em prepara��o',
        responsavel: 'Equipe Acabamento',
        inicioPrevisto: 'Hoje - 13:00',
        terminoPrevisto: 'Hoje - 16:30',
        observacoes: 'Aplicar lixa 400 e primer cinza claro.',
        percentual: 10,
      },
      pintura: {
        status: 'Pendente',
        responsavel: 'Equipe Pintura',
        inicioPrevisto: '27/09 - 09:00',
        terminoPrevisto: '27/09 - 12:00',
      },
      montagem: {
        status: 'Aguardando',
        responsavel: 'Equipe Montagem 2',
        inicioPrevisto: '27/09 - 14:00',
        terminoPrevisto: '27/09 - 16:00',
      },
      revisao: {
        status: 'Aguardando',
        responsavel: 'Lucas Martins',
        inicioPrevisto: '28/09 - 09:00',
        terminoPrevisto: '28/09 - 10:30',
      },
      logistica: {
        status: 'Aguardando',
        responsavel: 'Equipe Log�stica',
        inicioPrevisto: '28/09 - 15:00',
        terminoPrevisto: '28/09 - 17:00',
      },
    },
  },
  {
    id: '3',
    nome: 'Engrenagem Custom',
    cliente: 'Pedro Costa',
    etapa: 'Planejamento',
    progresso: 15,
    previsaoEntrega: '02/10/2025',
    responsavel: 'Helena Prado',
    prioridade: 'Baixa',
    ultimaAtualizacao: 'H� 1 hora',
    setores: {
      impressao: {
        status: 'Programado',
        responsavel: 'Jo�o Mendes',
        inicioPrevisto: '27/09 - 08:00',
        terminoPrevisto: '27/09 - 18:00',
        observacoes: 'Teste de prot�tipo em Nylon com 100% infill.',
      },
      acabamento: {
        status: 'Aguardando',
        responsavel: 'Equipe Acabamento',
        inicioPrevisto: '28/09 - 10:00',
        terminoPrevisto: '28/09 - 12:00',
      },
      pintura: {
        status: 'Dispensado',
        responsavel: '-',
        inicioPrevisto: '-',
        terminoPrevisto: '-',
        observacoes: 'Cliente solicitou pe�a natural sem pintura.',
      },
      montagem: {
        status: 'Aguardando',
        responsavel: 'Equipe Montagem 1',
        inicioPrevisto: '29/09 - 09:00',
        terminoPrevisto: '29/09 - 11:00',
      },
      revisao: {
        status: 'Aguardando',
        responsavel: 'Lucas Martins',
        inicioPrevisto: '29/09 - 14:00',
        terminoPrevisto: '29/09 - 15:00',
      },
      logistica: {
        status: 'Aguardando',
        responsavel: 'Equipe Log�stica',
        inicioPrevisto: '30/09 - 13:00',
        terminoPrevisto: '30/09 - 17:00',
      },
    },
  },
];

const queue: Array<{ id: string; tarefa: string; responsavel: string; status: QueueStatus }> = [
  { id: 'A', tarefa: 'Preparar arquivos G-code', responsavel: 'Ana Lima', status: 'Em andamento' },
  { id: 'B', tarefa: 'Separar mat�ria-prima', responsavel: 'Marcos Ara�jo', status: 'Pendente' },
  { id: 'C', tarefa: 'Inspecionar lote anterior', responsavel: 'Lucia Prado', status: 'Conclu�do' },
];

const statusVariant: Record<string, string> = {
  'Em andamento': 'warning',
  'Em prepara��o': 'info',
  Pendente: 'secondary',
  Aguardando: 'secondary',
  Programado: 'secondary',
  Concluido: 'success',
  Dispensado: 'light',
  'N�o iniciado': 'secondary',
};

const sectorConfig: Array<{ key: SectorKey; label: string; icon: ComponentType<{ size?: number | string }>; description: string }> = [
  { key: 'impressao', label: 'Impress�o', icon: Printer, description: 'Fila de impressoras FDM/SLA' },
  { key: 'acabamento', label: 'Acabamento', icon: Scissors, description: 'Corte, lixamento e primer' },
  { key: 'pintura', label: 'Pintura', icon: Droplet, description: 'Aplica��o de tinta e verniz' },
  { key: 'montagem', label: 'Montagem', icon: Tool, description: 'Assemblagens e testes funcionais' },
  { key: 'revisao', label: 'Revis�o', icon: CheckCircle, description: 'Checklist dimensional e visual' },
  { key: 'logistica', label: 'Log�stica', icon: Truck, description: 'Embalo e expedi��o' },
];

const sectorOrder: SectorKey[] = ['impressao', 'acabamento', 'pintura', 'montagem', 'revisao', 'logistica'];
const sectorLabelMap = sectorConfig.reduce<Record<SectorKey, string>>((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {} as Record<SectorKey, string>);

const formatRelativeDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const convertBudgetToProject = (budget: BudgetRecord): Project | null => {
  if (!budget.producao) {
    return null;
  }

  const setores = budget.producao.setores as unknown as Record<SectorKey, ProductionSectorPlan>;
  const sectorEntries = sectorOrder.map(key => [key, setores[key]] as const);

  const activeEntry =
    sectorEntries.find(([, sector]) => ['Em andamento', 'Em prepara��o'].includes(sector?.status ?? '')) ||
    sectorEntries.find(([, sector]) => sector?.status && sector.status !== 'Aguardando');

  const progressValues = sectorEntries
    .map(([, sector]) => (typeof sector?.percentual === 'number' ? sector.percentual : null))
    .filter((value): value is number => value !== null);

  const progress = progressValues.length
    ? Math.round(progressValues.reduce((total, current) => total + current, 0) / progressValues.length)
    : 0;

  const firstResponsible =
    sectorEntries.find(([, sector]) => sector?.responsavel && sector.responsavel !== 'A definir')?.[1].responsavel ||
    'A definir';

  const setoresConvertidos = sectorEntries.reduce<Record<SectorKey, SectorInfo>>((acc, [key, sector]) => {
    acc[key] = {
      status: sector?.status ?? 'Aguardando',
      responsavel: sector?.responsavel ?? 'A definir',
      inicioPrevisto: sector?.inicioPrevisto ?? 'A definir',
      terminoPrevisto: sector?.terminoPrevisto ?? 'A definir',
      observacoes: sector?.observacoes,
      percentual: sector?.percentual,
    };
    return acc;
  }, {} as Record<SectorKey, SectorInfo>);

  return {
    id: budget.id,
    nome: budget.resumoDoProjeto || budget.codigo,
    cliente: budget.clienteNome,
    etapa: activeEntry ? sectorLabelMap[activeEntry[0]] : 'Planejamento',
    progresso: progress,
    previsaoEntrega: setoresConvertidos.logistica?.terminoPrevisto ?? 'A definir',
    responsavel: firstResponsible,
    prioridade: priorityLabelMap[budget.prioridade ?? 'media'],
    ultimaAtualizacao: formatRelativeDate(budget.criadoEm),
    setores: setoresConvertidos,
  };
};

const deriveProjectsFromBudgets = (budgets: BudgetRecord[]): Project[] =>
  budgets
    .filter(budget => budget.status === 'aceito' && budget.producao)
    .map(convertBudgetToProject)
    .filter((entry): entry is Project => Boolean(entry));

const Producao = ({ budgets }: ProducaoProps) => {
  const projectsFromBudgets = useMemo(() => deriveProjectsFromBudgets(budgets), [budgets]);
  const projectsToRender = projectsFromBudgets.length > 0 ? projectsFromBudgets : mockProjects;

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleOpenDetails = (project: Project) => {
    setSelectedProject(project);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedProject(null);
  };

  return (
    <Container fluid>
      <h2 className="mb-4">Produ��o</h2>
      <Row className="g-4">
        {projectsToRender.map(project => (
          <Col md={4} key={project.id}>
            <Card className="p-3 h-100 rounded-4">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h5 className="mb-1">{project.nome}</h5>
                  <small className="text-secondary">Cliente: {project.cliente}</small>
                </div>
                <Badge bg={priorityVariantMap[project.prioridade]}>
                  {project.prioridade}
                </Badge>
              </div>
              <p className="text-secondary mb-2">Etapa atual: {project.etapa}</p>
              <ProgressBar now={project.progresso} label={`${project.progresso}%`} className="mb-3" />
              <div className="d-flex justify-content-between text-secondary small">
                <span>Respons�vel: {project.responsavel}</span>
                <span>Entrega: {project.previsaoEntrega}</span>
              </div>
              <Button
                variant="outline-danger"
                size="sm"
                className="mt-3 align-self-start"
                onClick={() => handleOpenDetails(project)}
              >
                Ver andamento <ChevronRight size={14} className="ms-1" />
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="p-4 rounded-4 mt-4">
        <h4 className="mb-3">Fila de trabalho</h4>
        <div className="d-flex flex-column gap-3">
          {queue.map(item => (
            <div className="d-flex justify-content-between align-items-center" key={item.id}>
              <div>
                <h6 className="mb-1">{item.tarefa}</h6>
                <small className="text-secondary">Respons�vel: {item.responsavel}</small>
              </div>
              <Badge bg={statusVariant[item.status] || 'light'}>{item.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Offcanvas show={showDetails} onHide={handleCloseDetails} placement="end" scroll backdrop={false} className="w-50">
        <Offcanvas.Header closeButton>
          <div>
            <Offcanvas.Title>{selectedProject?.nome}</Offcanvas.Title>
            {selectedProject ? (
              <small className="text-secondary">
                Respons�vel: {selectedProject.responsavel} � �ltima atualiza��o: {selectedProject.ultimaAtualizacao}
              </small>
            ) : null}
          </div>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {selectedProject ? (
            <Accordion defaultActiveKey={['acompanhamento']} alwaysOpen>
              <Accordion.Item eventKey="acompanhamento">
                <Accordion.Header>Acompanhamento</Accordion.Header>
                <Accordion.Body>
                  <Stack gap={2} className="mb-3">
                    <div className="d-flex justify-content-between text-secondary">
                      <span>Cliente</span>
                      <span className="fw-semibold text-dark">{selectedProject.cliente}</span>
                    </div>
                    <div className="d-flex justify-content-between text-secondary">
                      <span>Prioridade</span>
                      <Badge bg={priorityVariantMap[selectedProject.prioridade]}>
                        {selectedProject.prioridade}
                      </Badge>
                    </div>
                    <div className="d-flex justify-content-between text-secondary">
                      <span>Previs�o de entrega</span>
                      <span className="fw-semibold text-dark">{selectedProject.previsaoEntrega}</span>
                    </div>
                  </Stack>
                  <div>
                    <span className="text-secondary small">Progresso geral</span>
                    <ProgressBar now={selectedProject.progresso} label={`${selectedProject.progresso}%`} className="mt-1" />
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              {sectorConfig.map(({ key, label, icon: Icon, description }) => {
                const sector = selectedProject.setores[key];
                const badgeVariant = statusVariant[sector.status] || 'secondary';
                return (
                  <Accordion.Item eventKey={key} key={key}>
                    <Accordion.Header>
                      <div className="d-flex align-items-center gap-2">
                        <Icon size={18} />
                        <span>{label}</span>
                        <Badge bg={badgeVariant} className="ms-2">{sector.status}</Badge>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <p className="text-secondary small mb-3">{description}</p>
                      <Stack gap={2}>
                        <div className="d-flex justify-content-between text-secondary">
                          <span>Respons�vel</span>
                          <span className="fw-semibold text-dark">{sector.responsavel}</span>
                        </div>
                        <div className="d-flex justify-content-between text-secondary">
                          <span>In�cio previsto</span>
                          <span className="text-dark">{sector.inicioPrevisto}</span>
                        </div>
                        <div className="d-flex justify-content-between text-secondary">
                          <span>T�rmino previsto</span>
                          <span className="text-dark">{sector.terminoPrevisto}</span>
                        </div>
                        {typeof sector.percentual === 'number' ? (
                          <div>
                            <span className="text-secondary small">Progresso do setor</span>
                            <ProgressBar now={sector.percentual} className="mt-1" />
                          </div>
                        ) : null}
                        {sector.observacoes ? (
                          <div className="bg-light p-3 rounded">
                            <span className="text-secondary small d-block">Observa��es</span>
                            <span>{sector.observacoes}</span>
                          </div>
                        ) : null}
                      </Stack>
                    </Accordion.Body>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          ) : null}
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
};

export default Producao;








