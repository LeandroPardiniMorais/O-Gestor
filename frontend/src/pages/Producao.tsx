
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  Container,
  Row,
  Col,
  Card,
  ProgressBar,
  Badge,
  Button,
  Offcanvas,
  Stack,
  Form,
  Table,
} from 'react-bootstrap'
import { ChevronRight, Printer, Scissors, Tool, Truck } from 'react-feather'
import type {
  BudgetRecord,
  BudgetLineProduct,
  BudgetLinePart,
  ProductionSectorKey,
  BudgetPriority,
} from '../types/budget'

type StageKey = Extract<ProductionSectorKey, 'impressao' | 'acabamento' | 'montagem' | 'logistica'>
type StageStatus = 'Pendente' | 'Em andamento' | 'Concluido'

type QueueStatus = 'Em andamento' | 'Pendente' | 'Concluido'

type LogisticsMovementType = 'envio' | 'recall'

interface ProducaoProps {
  budgets: BudgetRecord[]
}

interface ProjectBase {
  id: string
  nome: string
  cliente: string
  previsaoEntrega: string
  responsavel: string
  prioridade: 'Alta' | 'Media' | 'Baixa'
  ultimaAtualizacao: string
}

interface PartSummary {
  productId: string
  productNome: string
  partId: string
  partNome: string
  total: number
}

interface ProductSummary {
  productId: string
  productNome: string
  total: number
}

interface ProjectInventory {
  parts: PartSummary[]
  products: ProductSummary[]
  totals: Record<StageKey, number>
}

interface PartLog {
  id: string
  timestamp: string
  productId: string
  productNome: string
  partId: string
  partNome: string
  quantidade: number
  observacoes?: string
}

interface AssemblyLog {
  id: string
  timestamp: string
  productId: string
  productNome: string
  quantidade: number
  observacoes?: string
}

interface LogisticsLog {
  id: string
  timestamp: string
  productId: string
  productNome: string
  quantidade: number
  tipo: LogisticsMovementType
  destino?: string
  observacoes?: string
}

interface ProjectLogs {
  impressao: PartLog[]
  acabamento: PartLog[]
  montagem: AssemblyLog[]
  logistica: LogisticsLog[]
}

interface ProjectData {
  info: ProjectBase
  inventory: ProjectInventory
  logs: ProjectLogs
}

interface StageSnapshot {
  key: StageKey
  label: string
  total: number
  completed: number
  remaining: number
  progress: number
  status: StageStatus
}

interface ProjectDisplay {
  data: ProjectData
  info: ProjectBase
  snapshots: Record<StageKey, StageSnapshot>
  etapaAtual: StageKey | 'Concluido'
  progresso: number
}

type PartInputMap = Record<string, number>
type ProductInputMap = Record<string, number>
interface LogisticsInputItem {
  envio: number
  recall: number
  destino: string
}
type LogisticsInputMap = Record<string, LogisticsInputItem>

const stageConfig: Array<{ key: StageKey; label: string; icon: ComponentType<{ size?: number | string }> }> = [
  { key: 'impressao', label: 'Impressao', icon: Printer },
  { key: 'acabamento', label: 'Acabamento', icon: Scissors },
  { key: 'montagem', label: 'Montagem', icon: Tool },
  { key: 'logistica', label: 'Logistica', icon: Truck },
]

const stageOrder: StageKey[] = stageConfig.map(item => item.key)

const stageLabelMap = stageConfig.reduce<Record<StageKey, string>>((acc, item) => {
  acc[item.key] = item.label
  return acc
}, {} as Record<StageKey, string>)

const priorityLabelMap: Record<BudgetPriority, ProjectBase['prioridade']> = {
  alta: 'Alta',
  media: 'Media',
  baixa: 'Baixa',
}

const priorityVariantMap: Record<ProjectBase['prioridade'], string> = {
  Alta: 'danger',
  Media: 'warning',
  Baixa: 'secondary',
}

const statusVariant: Record<StageStatus, string> = {
  Pendente: 'secondary',
  'Em andamento': 'warning',
  Concluido: 'success',
}

const queue: Array<{ id: string; tarefa: string; responsavel: string; status: QueueStatus }> = [
  { id: 'queue-1', tarefa: 'Preparar arquivos G-code', responsavel: 'Ana Lima', status: 'Em andamento' },
  { id: 'queue-2', tarefa: 'Separar embalagens', responsavel: 'Claudio Souza', status: 'Pendente' },
  { id: 'queue-3', tarefa: 'Inspecionar lote anterior', responsavel: 'Lucia Prado', status: 'Concluido' },
]

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const sanitizeQuantity = (value: number) => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.floor(value))
}

const createEmptyLogs = (): ProjectLogs => ({
  impressao: [],
  acabamento: [],
  montagem: [],
  logistica: [],
})

const cloneLogs = (logs: ProjectLogs): ProjectLogs => ({
  impressao: logs.impressao.map(log => ({ ...log })),
  acabamento: logs.acabamento.map(log => ({ ...log })),
  montagem: logs.montagem.map(log => ({ ...log })),
  logistica: logs.logistica.map(log => ({ ...log })),
})

const cloneProjectData = (project: ProjectData): ProjectData => ({
  info: { ...project.info },
  inventory: {
    parts: project.inventory.parts.map(part => ({ ...part })),
    products: project.inventory.products.map(product => ({ ...product })),
    totals: { ...project.inventory.totals },
  },
  logs: cloneLogs(project.logs),
})

const ensurePartSummary = (product: BudgetLineProduct, part: BudgetLinePart | null): PartSummary => {
  const perProduct = part?.quantidade !== undefined ? Math.max(0, part.quantidade) : 1
  const count = Math.max(0, product.quantidade ?? 0)
  return {
    productId: product.id,
    productNome: product.nome,
    partId: part ? part.id : `${product.id}-peca`,
    partNome: part ? part.nome : product.nome,
    total: count * perProduct,
  }
}

const buildInventory = (budget: BudgetRecord): ProjectInventory => {
  const parts: PartSummary[] = []
  const products: ProductSummary[] = []

  const items = budget.itens || []

  items.forEach(product => {
    const total = Math.max(0, product.quantidade ?? 0)
    products.push({ productId: product.id, productNome: product.nome, total })
    if (product.partes && product.partes.length > 0) {
      product.partes.forEach(part => parts.push(ensurePartSummary(product, part)))
    } else {
      parts.push(ensurePartSummary(product, null))
    }
  })

  const partsTotal = parts.reduce((sum, item) => sum + item.total, 0)
  const productTotal = products.reduce((sum, item) => sum + item.total, 0)

  return {
    parts,
    products,
    totals: {
      impressao: partsTotal,
      acabamento: partsTotal,
      montagem: productTotal,
      logistica: productTotal,
    },
  }
}

const extractTimestamp = (budget: BudgetRecord) => {
  const maybe = budget as BudgetRecord & { atualizadoEm?: string }
  return maybe.atualizadoEm || budget.previsaoEntrega || budget.criadoEm
}

const createProjectFromBudget = (budget: BudgetRecord, existing?: ProjectData): ProjectData => ({
  info: {
    id: budget.id,
    nome: budget.resumoDoProjeto || budget.codigo,
    cliente: budget.clienteNome,
    previsaoEntrega: budget.previsaoEntrega || budget.producao?.prazoPrevisto || 'A definir',
    responsavel: budget.responsavelProjeto || 'Equipe a definir',
    prioridade: priorityLabelMap[budget.prioridade ?? 'media'],
    ultimaAtualizacao: formatDateTime(extractTimestamp(budget)),
  },
  inventory: buildInventory(budget),
  logs: existing ? cloneLogs(existing.logs) : createEmptyLogs(),
})

const selectAcceptedBudgets = (budgets: BudgetRecord[]) =>
  budgets.filter(budget => budget.status === 'aceito' && budget.itens && budget.itens.length > 0)

const createProjectMap = (projects: ProjectData[]) =>
  projects.reduce<Record<string, ProjectData>>((acc, project) => {
    acc[project.info.id] = project
    return acc
  }, {})

const syncProjectsWithBudgets = (budgets: BudgetRecord[], prev: Record<string, ProjectData>) => {
  const accepted = selectAcceptedBudgets(budgets)
  if (accepted.length === 0) {
    if (Object.keys(prev).length === 0) {
      return createProjectMap(mockProjectsData.map(cloneProjectData))
    }
    return prev
  }

  const next: Record<string, ProjectData> = {}

  accepted.forEach(budget => {
    const existing = prev[budget.id]
    const project = createProjectFromBudget(budget, existing)
    next[project.info.id] = project
  })

  Object.keys(prev).forEach(id => {
    if (!next[id]) {
      next[id] = prev[id]
    }
  })

  return next
}

const sumPartLogs = (logs: PartLog[], predicate?: (log: PartLog) => boolean) =>
  logs.reduce((acc, log) => acc + (predicate && !predicate(log) ? 0 : log.quantidade), 0)

const sumAssemblyLogs = (logs: AssemblyLog[], predicate?: (log: AssemblyLog) => boolean) =>
  logs.reduce((acc, log) => acc + (predicate && !predicate(log) ? 0 : log.quantidade), 0)

const sumLogisticsLogs = (logs: LogisticsLog[], tipo: LogisticsMovementType, predicate?: (log: LogisticsLog) => boolean) =>
  logs.reduce((acc, log) => acc + (log.tipo === tipo && (!predicate || predicate(log)) ? log.quantidade : 0), 0)

const computeSnapshot = (project: ProjectData, stage: StageKey): StageSnapshot => {
  const total = project.inventory.totals[stage]
  let completed = 0

  if (stage === 'impressao' || stage === 'acabamento') {
    completed = Math.min(total, sumPartLogs(project.logs[stage]))
  } else if (stage === 'montagem') {
    completed = Math.min(total, sumAssemblyLogs(project.logs.montagem))
  } else {
    const enviados = sumLogisticsLogs(project.logs.logistica, 'envio')
    const recalls = sumLogisticsLogs(project.logs.logistica, 'recall')
    completed = Math.min(total, Math.max(0, enviados - recalls))
  }

  const progress = total > 0 ? Math.round((completed / total) * 100) : 100
  const status: StageStatus = progress >= 100 ? 'Concluido' : progress > 0 ? 'Em andamento' : 'Pendente'

  return {
    key: stage,
    label: stageLabelMap[stage],
    total,
    completed,
    remaining: Math.max(0, total - completed),
    progress,
    status,
  }
}

const deriveProjectDisplay = (project: ProjectData): ProjectDisplay => {
  const snapshots = stageOrder.reduce<Record<StageKey, StageSnapshot>>((acc, stage) => {
    acc[stage] = computeSnapshot(project, stage)
    return acc
  }, {} as Record<StageKey, StageSnapshot>)

  const stages = stageOrder.map(stage => snapshots[stage])
  const active = stages.find(stage => stage.total > 0 && stage.progress < 100)
  const etapaAtual = active ? active.key : 'Concluido'

  const withWork = stages.filter(stage => stage.total > 0)
  const progresso = withWork.length > 0
    ? Math.round(withWork.reduce((sum, stage) => sum + stage.progress, 0) / withWork.length)
    : 100

  return {
    data: project,
    info: project.info,
    snapshots,
    etapaAtual,
    progresso,
  }
}


const partRemaining = (display: ProjectDisplay, stage: 'impressao' | 'acabamento', partId: string) => {
  const logs = stage === 'impressao' ? display.data.logs.impressao : display.data.logs.acabamento
  const total = display.data.inventory.parts.find(part => part.partId === partId)?.total ?? 0
  const done = sumPartLogs(logs, log => log.partId === partId)
  return Math.max(0, total - done)
}

const productRemaining = (display: ProjectDisplay, stage: 'montagem' | 'logistica', productId: string) => {
  const total = display.data.inventory.products.find(product => product.productId === productId)?.total ?? 0
  if (stage === 'montagem') {
    const done = sumAssemblyLogs(display.data.logs.montagem, log => log.productId === productId)
    return Math.max(0, total - done)
  }
  const enviados = sumLogisticsLogs(display.data.logs.logistica, 'envio', log => log.productId === productId)
  const recalls = sumLogisticsLogs(display.data.logs.logistica, 'recall', log => log.productId === productId)
  return Math.max(0, total - Math.max(0, enviados - recalls))
}

const recallCapacity = (display: ProjectDisplay, productId: string) => {
  const enviados = sumLogisticsLogs(display.data.logs.logistica, 'envio', log => log.productId === productId)
  const recalls = sumLogisticsLogs(display.data.logs.logistica, 'recall', log => log.productId === productId)
  return Math.max(0, enviados - recalls)
}

const mockProjectsData: ProjectData[] = [
  {
    info: {
      id: 'mock-1',
      nome: 'Suporte Monitor',
      cliente: 'Joao Silva',
      previsaoEntrega: '30/09/2025',
      responsavel: 'Ana Lima',
      prioridade: 'Alta',
      ultimaAtualizacao: formatDateTime(new Date().toISOString()),
    },
    inventory: {
      products: [{ productId: 'mock-prod', productNome: 'Suporte Monitor', total: 10 }],
      parts: [
        { productId: 'mock-prod', productNome: 'Suporte Monitor', partId: 'mock-base', partNome: 'Base', total: 10 },
        { productId: 'mock-prod', productNome: 'Suporte Monitor', partId: 'mock-braco', partNome: 'Braco', total: 20 },
      ],
      totals: {
        impressao: 30,
        acabamento: 30,
        montagem: 10,
        logistica: 10,
      },
    },
    logs: createEmptyLogs(),
  },
]

const Producao = ({ budgets }: ProducaoProps) => {
  const [projectsById, setProjectsById] = useState<Record<string, ProjectData>>(() => {
    const accepted = selectAcceptedBudgets(budgets)
    if (accepted.length > 0) {
      return createProjectMap(accepted.map(budget => createProjectFromBudget(budget)))
    }
    return createProjectMap(mockProjectsData.map(cloneProjectData))
  })

  useEffect(() => {
    setProjectsById(prev => syncProjectsWithBudgets(budgets, prev))
  }, [budgets])

  const projectDisplays = useMemo(() => {
    const map: Record<string, ProjectDisplay> = {}
    Object.values(projectsById).forEach(project => {
      map[project.info.id] = deriveProjectDisplay(project)
    })
    return map
  }, [projectsById])

  const projects = useMemo(() => {
    const order: Record<ProjectBase['prioridade'], number> = { Alta: 0, Media: 1, Baixa: 2 }
    return Object.values(projectDisplays).sort((a, b) => {
      if (a.info.prioridade === b.info.prioridade) {
        return a.info.nome.localeCompare(b.info.nome)
      }
      return order[a.info.prioridade] - order[b.info.prioridade]
    })
  }, [projectDisplays])

  const [panelMode, setPanelMode] = useState<'details' | 'launch' | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  const [impressaoInput, setImpressaoInput] = useState<PartInputMap>({})
  const [acabamentoInput, setAcabamentoInput] = useState<PartInputMap>({})
  const [montagemInput, setMontagemInput] = useState<ProductInputMap>({})
  const [logisticaInput, setLogisticaInput] = useState<LogisticsInputMap>({})

  const [impressaoObs, setImpressaoObs] = useState('')
  const [acabamentoObs, setAcabamentoObs] = useState('')
  const [montagemObs, setMontagemObs] = useState('')
  const [logisticaObs, setLogisticaObs] = useState('')

  const activeProjectDisplay = activeProjectId ? projectDisplays[activeProjectId] : null
  const activeProjectData = activeProjectDisplay?.data

  useEffect(() => {
    if (panelMode === 'launch' && activeProjectData) {
      const partDefaults = activeProjectData.inventory.parts.reduce((acc, part) => {
        acc[part.partId] = 0
        return acc
      }, {} as PartInputMap)
      const productDefaults = activeProjectData.inventory.products.reduce((acc, product) => {
        acc[product.productId] = 0
        return acc
      }, {} as ProductInputMap)
      const logisticsDefaults = activeProjectData.inventory.products.reduce((acc, product) => {
        acc[product.productId] = { envio: 0, recall: 0, destino: '' }
        return acc
      }, {} as LogisticsInputMap)
      setImpressaoInput(partDefaults)
      setAcabamentoInput(partDefaults)
      setMontagemInput(productDefaults)
      setLogisticaInput(logisticsDefaults)
      setImpressaoObs('')
      setAcabamentoObs('')
      setMontagemObs('')
      setLogisticaObs('')
    } else if (panelMode !== 'launch') {
      setImpressaoInput({})
      setAcabamentoInput({})
      setMontagemInput({})
      setLogisticaInput({})
      setImpressaoObs('')
      setAcabamentoObs('')
      setMontagemObs('')
      setLogisticaObs('')
    }
  }, [panelMode, activeProjectData])

  const handleOpenDetails = (projectId: string) => {
    setActiveProjectId(projectId)
    setPanelMode('details')
  }

  const handleOpenLaunch = (projectId: string) => {
    setActiveProjectId(projectId)
    setPanelMode('launch')
  }

  const handleClosePanel = () => {
    setPanelMode(null)
    setActiveProjectId(null)
  }

  const updatePartQuantity = (
    setter: (value: PartInputMap) => void,
    map: PartInputMap,
    partId: string,
    raw: string,
  ) => {
    const value = sanitizeQuantity(Number(raw))
    setter({ ...map, [partId]: value })
  }

  const updateProductQuantity = (
    setter: (value: ProductInputMap) => void,
    map: ProductInputMap,
    productId: string,
    raw: string,
  ) => {
    const value = sanitizeQuantity(Number(raw))
    setter({ ...map, [productId]: value })
  }

  const updateLogisticaField = (
    productId: string,
    field: keyof LogisticsInputItem,
    value: string,
    transform: (raw: string) => number | string,
  ) => {
    setLogisticaInput(prev => {
      const current = prev[productId] ?? { envio: 0, recall: 0, destino: '' }
      const nextValue = transform(value)
      const next: LogisticsInputItem = {
        ...current,
        [field]: nextValue,
      } as LogisticsInputItem
      return {
        ...prev,
        [productId]: next,
      }
    })
  }

  const appendLogs = (projectId: string, updater: (current: ProjectData) => ProjectData) => {
    setProjectsById(prev => {
      const current = prev[projectId]
      if (!current) return prev
      const updated = updater(current)
      return {
        ...prev,
        [projectId]: updated,
      }
    })
  }

  const handleSubmitPartStage = (stage: 'impressao' | 'acabamento', input: PartInputMap, obs: string) => {
    if (!activeProjectId || !activeProjectDisplay) return
    const entries = Object.entries(input).filter(([, qty]) => qty > 0)
    if (entries.length === 0) return
    const timestamp = new Date().toISOString()
    const note = obs.trim() || undefined

    const validEntries = entries.reduce<PartLog[]>((acc, [partId, qty]) => {
      const remaining = partRemaining(activeProjectDisplay, stage, partId)
      const amount = Math.min(qty, remaining)
      if (amount <= 0) return acc
      const part = activeProjectDisplay.data.inventory.parts.find(item => item.partId === partId)
      if (!part) return acc
      acc.push({
        id: `${stage}-${partId}-${Date.now()}`,
        timestamp,
        productId: part.productId,
        productNome: part.productNome,
        partId: part.partId,
        partNome: part.partNome,
        quantidade: amount,
        observacoes: note,
      })
      return acc
    }, [])

    if (validEntries.length === 0) return

    appendLogs(activeProjectId, current => ({
      info: {
        ...current.info,
        ultimaAtualizacao: formatDateTime(timestamp),
      },
      inventory: current.inventory,
      logs: {
        ...current.logs,
        [stage]: [...current.logs[stage], ...validEntries],
      },
    }))

    if (stage === 'impressao') {
      setImpressaoInput(prev => {
        const next = { ...prev }
        validEntries.forEach(entry => {
          next[entry.partId] = 0
        })
        return next
      })
      setImpressaoObs('')
    } else {
      setAcabamentoInput(prev => {
        const next = { ...prev }
        validEntries.forEach(entry => {
          next[entry.partId] = 0
        })
        return next
      })
      setAcabamentoObs('')
    }
  }

  const handleSubmitMontagem = () => {
    if (!activeProjectId || !activeProjectDisplay) return
    const entries = Object.entries(montagemInput).filter(([, qty]) => qty > 0)
    if (entries.length === 0) return
    const timestamp = new Date().toISOString()
    const note = montagemObs.trim() || undefined

    const validEntries = entries.reduce<AssemblyLog[]>((acc, [productId, qty]) => {
      const remaining = productRemaining(activeProjectDisplay, 'montagem', productId)
      const amount = Math.min(qty, remaining)
      if (amount <= 0) return acc
      const product = activeProjectDisplay.data.inventory.products.find(item => item.productId === productId)
      if (!product) return acc
      acc.push({
        id: montagem--,
        timestamp,
        productId: product.productId,
        productNome: product.productNome,
        quantidade: amount,
        observacoes: note,
      })
      return acc
    }, [])

    if (validEntries.length === 0) return

    appendLogs(activeProjectId, current => ({
      info: {
        ...current.info,
        ultimaAtualizacao: formatDateTime(timestamp),
      },
      inventory: current.inventory,
      logs: {
        ...current.logs,
        montagem: [...current.logs.montagem, ...validEntries],
      },
    }))

    setMontagemInput(prev => {
      const next = { ...prev }
      validEntries.forEach(entry => {
        next[entry.productId] = 0
      })
      return next
    })
    setMontagemObs('')
  }

  const handleSubmitLogistica = () => {
    if (!activeProjectId || !activeProjectDisplay) return
    const entries = Object.entries(logisticaInput)
    if (entries.length === 0) return
    const timestamp = new Date().toISOString()
    const note = logisticaObs.trim() || undefined

    const shipments: LogisticsLog[] = []
    const recalls: LogisticsLog[] = []

    entries.forEach(([productId, values]) => {
      const product = activeProjectDisplay.data.inventory.products.find(item => item.productId === productId)
      if (!product) return

      const envioSolicitado = sanitizeQuantity(values.envio)
      const recallSolicitado = sanitizeQuantity(values.recall)

      if (envioSolicitado > 0) {
        const disponivel = productRemaining(activeProjectDisplay, 'logistica', productId)
        const quantidade = Math.min(envioSolicitado, disponivel)
        const destino = values.destino.trim()
        if (quantidade > 0 && destino) {
          shipments.push({
            id: envio--,
            timestamp,
            productId: product.productId,
            productNome: product.productNome,
            quantidade,
            tipo: 'envio',
            destino,
            observacoes: note,
          })
        }
      }

      if (recallSolicitado > 0) {
        const capacidade = recallCapacity(activeProjectDisplay, productId)
        const quantidade = Math.min(recallSolicitado, capacidade)
        if (quantidade > 0) {
          recalls.push({
            id: ecall--,
            timestamp,
            productId: product.productId,
            productNome: product.productNome,
            quantidade,
            tipo: 'recall',
            observacoes: note,
          })
        }
      }
    })

    if (shipments.length === 0 && recalls.length === 0) return

    appendLogs(activeProjectId, current => ({
      info: {
        ...current.info,
        ultimaAtualizacao: formatDateTime(timestamp),
      },
      inventory: current.inventory,
      logs: {
        ...current.logs,
        logistica: [...current.logs.logistica, ...shipments, ...recalls],
      },
    }))

    setLogisticaInput(prev => {
      const next: LogisticsInputMap = {}
      Object.entries(prev).forEach(([productId, item]) => {
        next[productId] = {
          envio: shipments.find(entry => entry.productId === productId) ? 0 : item.envio,
          recall: recalls.find(entry => entry.productId === productId) ? 0 : item.recall,
          destino: item.destino,
        }
      })
      return next
    })
    setLogisticaObs('')
  }

  return (
    <Container fluid className='producao-page px-0'>
      <h2 className='mb-4 px-3'>Producao</h2>

      <Row className='g-4 px-3'>
        {projects.map(project => {
          const etapaLabel = project.etapaAtual === 'Concluido' ? 'Finalizado' : stageLabelMap[project.etapaAtual]
          return (
            <Col md={4} key={project.info.id}>
              <Card className='p-3 h-100 rounded-4'>
                <div className='d-flex justify-content-between align-items-start mb-2'>
                  <div>
                    <h5 className='mb-1'>{project.info.nome}</h5>
                    <small className='text-secondary'>Cliente: {project.info.cliente}</small>
                  </div>
                  <Badge bg={priorityVariantMap[project.info.prioridade]}>
                    {project.info.prioridade}
                  </Badge>
                </div>
                <p className='text-secondary mb-2'>Etapa atual: {etapaLabel}</p>
                <ProgressBar now={project.progresso} label={`${project.progresso}%`} className='mb-3' />
                <div className='d-flex justify-content-between text-secondary small'>
                  <span>Responsavel: {project.info.responsavel}</span>
                  <span>Entrega: {project.info.previsaoEntrega}</span>
                </div>
                <div className='d-flex gap-2 flex-wrap mt-3'>
                  <Button
                    variant='outline-danger'
                    size='sm'
                    className='align-self-start'
                    onClick={() => handleOpenDetails(project.info.id)}
                  >
                    Ver andamento <ChevronRight size={14} className='ms-1' />
                  </Button>
                  <Button
                    variant='danger'
                    size='sm'
                    className='align-self-start'
                    onClick={() => handleOpenLaunch(project.info.id)}
                  >
                    Lancar producao
                  </Button>
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>

      <Card className='p-4 rounded-4 mt-4 mx-3'>
        <h4 className='mb-3'>Fila de trabalho</h4>
        <div className='d-flex flex-column gap-3'>
          {queue.map(item => (
            <div className='d-flex justify-content-between align-items-center' key={item.id}>
              <div>
                <h6 className='mb-1'>{item.tarefa}</h6>
                <small className='text-secondary'>Responsavel: {item.responsavel}</small>
              </div>
              <Badge bg={statusVariant[item.status]}>{item.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Offcanvas
        placement='end'
        show={Boolean(panelMode && activeProjectDisplay)}
        onHide={handleClosePanel}
        scroll
        backdrop={false}
        className='w-75'
      >
        <Offcanvas.Header closeButton>
          <div className='d-flex flex-column'>
            <Offcanvas.Title>{activeProjectDisplay?.info.nome}</Offcanvas.Title>
            {activeProjectDisplay ? (
              <small className='text-secondary'>Ultima atualizacao: {activeProjectDisplay.info.ultimaAtualizacao}</small>
            ) : null}
          </div>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {panelMode === 'details' && activeProjectDisplay ? (
            <Stack gap={3}>
              <div className='bg-light border rounded px-3 py-2'>
                <div className='d-flex justify-content-between small text-secondary'>
                  <span>Cliente</span>
                  <span className='text-dark fw-semibold'>{activeProjectDisplay.info.cliente}</span>
                </div>
                <div className='d-flex justify-content-between small text-secondary'>
                  <span>Entrega prevista</span>
                  <span className='text-dark fw-semibold'>{activeProjectDisplay.info.previsaoEntrega}</span>
                </div>
              </div>
              {stageOrder.map(stage => {
                const snapshot = activeProjectDisplay.snapshots[stage]
                const Icon = stageConfig.find(item => item.key === stage)?.icon ?? Printer
                return (
                  <div className='border rounded px-3 py-3' key={stage}>
                    <div className='d-flex justify-content-between align-items-center mb-2'>
                      <div className='d-flex align-items-center gap-2'>
                        <Icon size={18} />
                        <span className='fw-semibold'>{snapshot.label}</span>
                      </div>
                      <Badge bg={statusVariant[snapshot.status]}>{snapshot.status}</Badge>
                    </div>
                    <ProgressBar now={snapshot.progress} label={`${snapshot.progress}%`} className='mb-3' />
                    <Stack gap={1} className='text-secondary small'>
                      <div className='d-flex justify-content-between'>
                        <span>Total</span>
                        <span className='text-dark fw-semibold'>{snapshot.total}</span>
                      </div>
                      <div className='d-flex justify-content-between'>
                        <span>Concluido</span>
                        <span className='text-dark fw-semibold'>{snapshot.completed}</span>
                      </div>
                      <div className='d-flex justify-content-between'>
                        <span>Restante</span>
                        <span className='text-dark fw-semibold'>{snapshot.remaining}</span>
                      </div>
                    </Stack>
                  </div>
                )
              })}
            </Stack>
          ) : null}

          {panelMode === 'launch' && activeProjectData && activeProjectDisplay ? (
            <Stack gap={4}>
              <section>
                <h5 className='mb-3'>Impressao</h5>
                <Table responsive bordered size='sm' className='align-middle'>
                  <thead className='table-light'>
                    <tr>
                      <th>Produto</th>
                      <th>Peca</th>
                      <th className='text-center'>Pendentes</th>
                      <th className='text-center'>Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProjectData.inventory.parts.map(part => {
                      const available = partRemaining(activeProjectDisplay, 'impressao', part.partId)
                      return (
                        <tr key={`imp-${part.partId}`}>
                          <td>{part.productNome}</td>
                          <td>{part.partNome}</td>
                          <td className='text-center'>{available}</td>
                          <td className='text-center' style={{ maxWidth: '120px' }}>
                            <Form.Control
                              type='number'
                              min={0}
                              max={available}
                              value={impressaoInput[part.partId] ?? 0}
                              disabled={available === 0}
                              onChange={event => updatePartQuantity(setImpressaoInput, impressaoInput, part.partId, event.target.value)}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
                <Form.Group className='mt-3'>
                  <Form.Label>Observacoes</Form.Label>
                  <Form.Control
                    as='textarea'
                    rows={2}
                    value={impressaoObs}
                    onChange={event => setImpressaoObs(event.target.value)}
                    placeholder='Detalhes adicionais para esta remessa de impressao'
                  />
                </Form.Group>
                <div className='d-flex justify-content-end mt-3'>
                  <Button
                    type='button'
                    variant='danger'
                    onClick={() => handleSubmitPartStage('impressao', impressaoInput, impressaoObs)}
                  >
                    Registrar impressao
                  </Button>
                </div>
              </section>

              <section>
                <h5 className='mb-3'>Acabamento</h5>
                <Table responsive bordered size='sm' className='align-middle'>
                  <thead className='table-light'>
                    <tr>
                      <th>Produto</th>
                      <th>Peca</th>
                      <th className='text-center'>Pendentes</th>
                      <th className='text-center'>Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProjectData.inventory.parts.map(part => {
                      const available = partRemaining(activeProjectDisplay, 'acabamento', part.partId)
                      return (
                        <tr key={`acab-${part.partId}`}>
                          <td>{part.productNome}</td>
                          <td>{part.partNome}</td>
                          <td className='text-center'>{available}</td>
                          <td className='text-center' style={{ maxWidth: '120px' }}>
                            <Form.Control
                              type='number'
                              min={0}
                              max={available}
                              value={acabamentoInput[part.partId] ?? 0}
                              disabled={available === 0}
                              onChange={event => updatePartQuantity(setAcabamentoInput, acabamentoInput, part.partId, event.target.value)}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
                <Form.Group className='mt-3'>
                  <Form.Label>Observacoes</Form.Label>
                  <Form.Control
                    as='textarea'
                    rows={2}
                    value={acabamentoObs}
                    onChange={event => setAcabamentoObs(event.target.value)}
                    placeholder='Detalhes sobre acabamento, pintura ou ajustes'
                  />
                </Form.Group>
                <div className='d-flex justify-content-end mt-3'>
                  <Button
                    type='button'
                    variant='danger'
                    onClick={() => handleSubmitPartStage('acabamento', acabamentoInput, acabamentoObs)}
                  >
                    Registrar acabamento
                  </Button>
                </div>
              </section>

              <section>
                <h5 className='mb-3'>Montagem</h5>
                <Table responsive bordered size='sm' className='align-middle'>
                  <thead className='table-light'>
                    <tr>
                      <th>Produto</th>
                      <th className='text-center'>Pendentes</th>
                      <th className='text-center'>Unidades montadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProjectData.inventory.products.map(product => {
                      const available = productRemaining(activeProjectDisplay, 'montagem', product.productId)
                      return (
                        <tr key={`mont-${product.productId}`}>
                          <td>{product.productNome}</td>
                          <td className='text-center'>{available}</td>
                          <td className='text-center' style={{ maxWidth: '140px' }}>
                            <Form.Control
                              type='number'
                              min={0}
                              max={available}
                              value={montagemInput[product.productId] ?? 0}
                              disabled={available === 0}
                              onChange={event => updateProductQuantity(setMontagemInput, montagemInput, product.productId, event.target.value)}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
                <Form.Group className='mt-3'>
                  <Form.Label>Observacoes</Form.Label>
                  <Form.Control
                    as='textarea'
                    rows={2}
                    value={montagemObs}
                    onChange={event => setMontagemObs(event.target.value)}
                    placeholder='Checklist de montagem ou testes realizados'
                  />
                </Form.Group>
                <div className='d-flex justify-content-end mt-3'>
                  <Button type='button' variant='danger' onClick={handleSubmitMontagem}>
                    Registrar montagem
                  </Button>
                </div>
              </section>

              <section>
                <h5 className='mb-3'>Logistica</h5>
                <Table responsive bordered size='sm' className='align-middle'>
                  <thead className='table-light'>
                    <tr>
                      <th>Produto</th>
                      <th className='text-center'>Disponivel p/ envio</th>
                      <th className='text-center'>Enviar</th>
                      <th>Destino</th>
                      <th className='text-center'>Disponivel para recall</th>
                      <th className='text-center'>Recall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProjectData.inventory.products.map(product => {
                      const envioDisponivel = productRemaining(activeProjectDisplay, 'logistica', product.productId)
                      const recallDisponivel = recallCapacity(activeProjectDisplay, product.productId)
                      const item = logisticaInput[product.productId] ?? { envio: 0, recall: 0, destino: '' }
                      return (
                        <tr key={`log-${product.productId}`}>
                          <td>{product.productNome}</td>
                          <td className='text-center'>{envioDisponivel}</td>
                          <td className='text-center' style={{ maxWidth: '120px' }}>
                            <Form.Control
                              type='number'
                              min={0}
                              max={envioDisponivel}
                              value={item.envio}
                              disabled={envioDisponivel === 0}
                              onChange={event => updateLogisticaField(product.productId, 'envio', event.target.value, raw => sanitizeQuantity(Number(raw)))}
                            />
                          </td>
                          <td style={{ minWidth: '180px' }}>
                            <Form.Control
                              type='text'
                              value={item.destino}
                              placeholder='Destino do envio'
                              onChange={event => updateLogisticaField(product.productId, 'destino', event.target.value, raw => raw)}
                              disabled={envioDisponivel === 0}
                            />
                          </td>
                          <td className='text-center'>{recallDisponivel}</td>
                          <td className='text-center' style={{ maxWidth: '120px' }}>
                            <Form.Control
                              type='number'
                              min={0}
                              max={recallDisponivel}
                              value={item.recall}
                              disabled={recallDisponivel === 0}
                              onChange={event => updateLogisticaField(product.productId, 'recall', event.target.value, raw => sanitizeQuantity(Number(raw)))}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
                <Form.Group className='mt-3'>
                  <Form.Label>Observacoes</Form.Label>
                  <Form.Control
                    as='textarea'
                    rows={2}
                    value={logisticaObs}
                    onChange={event => setLogisticaObs(event.target.value)}
                    placeholder='Detalhes sobre expedicao ou motivos de recall'
                  />
                </Form.Group>
                <div className='d-flex justify-content-end mt-3'>
                  <Button type='button' variant='danger' onClick={handleSubmitLogistica}>
                    Registrar logistica
                  </Button>
                </div>
              </section>
            </Stack>
          ) : null}
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  )
}

export default Producao










