
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Collapse,
  Col,
  Container,
  Form,
  Modal,
  Offcanvas,
  ProgressBar,
  Row,
  Stack,
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
  partsByProduct: Record<string, Array<{ partId: string; partNome: string; perProduct: number }>>
  totals: Record<StageKey, number>
}

interface ProjectRework {
  parts: Record<string, number>
  products: Record<string, number>
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
  rework: ProjectRework
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
interface StageItemProgress {
  id: string
  nome: string
  total: number
  completed: number
  remaining: number
  progress: number
}
interface MontagemPartDetail {
  partId: string
  partNome: string
  perProduct: number
  available: number
}

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

const createEmptyRework = (): ProjectRework => ({
  parts: {},
  products: {},
})

const cloneRework = (rework: ProjectRework): ProjectRework => ({
  parts: { ...rework.parts },
  products: { ...rework.products },
})

const generateLogId = (prefix: string) => {
  const random =
    typeof globalThis !== 'undefined' && typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${random}`
}

const cloneProjectData = (project: ProjectData): ProjectData => ({
  info: { ...project.info },
  inventory: {
    parts: project.inventory.parts.map(part => ({ ...part })),
    products: project.inventory.products.map(product => ({ ...product })),
    partsByProduct: Object.entries(project.inventory.partsByProduct).reduce<
      Record<string, Array<{ partId: string; partNome: string; perProduct: number }>>
    >((acc, [productId, parts]) => {
      acc[productId] = parts.map(item => ({ ...item }))
      return acc
    }, {}),
    totals: { ...project.inventory.totals },
  },
  logs: cloneLogs(project.logs),
  rework: cloneRework(project.rework),
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
  const partsByProduct: Record<string, Array<{ partId: string; partNome: string; perProduct: number }>> = {}

  const items = budget.itens || []

  items.forEach(product => {
    const total = Math.max(0, product.quantidade ?? 0)
    products.push({ productId: product.id, productNome: product.nome, total })
    const productParts: Array<{ partId: string; partNome: string; perProduct: number }> = []
    if (product.partes && product.partes.length > 0) {
      product.partes.forEach(part => {
        const entry = ensurePartSummary(product, part)
        parts.push(entry)
        productParts.push({
          partId: entry.partId,
          partNome: entry.partNome,
          perProduct: Math.max(1, part.quantidade ?? 1),
        })
      })
    } else {
      const entry = ensurePartSummary(product, null)
      parts.push(entry)
      productParts.push({
        partId: entry.partId,
        partNome: entry.partNome,
        perProduct: 1,
      })
    }
    partsByProduct[product.id] = productParts
  })

  const partsTotal = parts.reduce((sum, item) => sum + item.total, 0)
  const productTotal = products.reduce((sum, item) => sum + item.total, 0)

  return {
    parts,
    products,
    partsByProduct,
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
  rework: existing ? cloneRework(existing.rework) : createEmptyRework(),
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

const sumLogisticsLogs = (
  logs: LogisticsLog[],
  tipo: LogisticsMovementType,
  predicate?: (log: LogisticsLog) => boolean,
) =>
  logs.reduce((acc, log) => acc + (log.tipo === tipo && (!predicate || predicate(log)) ? log.quantidade : 0), 0)

const sumMapValues = (map: Record<string, number>) =>
  Object.values(map).reduce((acc, value) => acc + value, 0)

const getPartBacklog = (project: ProjectData, partId: string) => project.rework.parts[partId] ?? 0

const getProductBacklog = (project: ProjectData, productId: string) => project.rework.products[productId] ?? 0

const computeSnapshot = (project: ProjectData, stage: StageKey): StageSnapshot => {
  const baseTotal = stage === 'impressao' || stage === 'acabamento'
    ? project.inventory.parts.reduce((sum, part) => sum + part.total, 0)
    : project.inventory.products.reduce((sum, product) => sum + product.total, 0)
  const backlogTotal =
    stage === 'impressao' || stage === 'acabamento'
      ? sumMapValues(project.rework.parts)
      : sumMapValues(project.rework.products)
  const total = baseTotal + backlogTotal
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

  const remaining = Math.max(0, total - completed)
  const progress = total > 0 ? Math.round((completed / total) * 100) : 100
  const status: StageStatus = progress >= 100 ? 'Concluido' : progress > 0 ? 'Em andamento' : 'Pendente'

  return {
    key: stage,
    label: stageLabelMap[stage],
    total,
    completed,
    remaining,
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
  const part = display.data.inventory.parts.find(item => item.partId === partId)
  const baseTotal = part?.total ?? 0
  const backlog = getPartBacklog(display.data, partId)

  if (stage === 'impressao') {
    const printed = sumPartLogs(display.data.logs.impressao, log => log.partId === partId)
    const target = baseTotal + backlog
    return Math.max(0, target - printed)
  }

  const printed = sumPartLogs(display.data.logs.impressao, log => log.partId === partId)
  const finished = sumPartLogs(display.data.logs.acabamento, log => log.partId === partId)
  const effectivePrinted = Math.max(0, printed - backlog)
  const target = baseTotal + backlog
  const remainingByTarget = Math.max(0, target - finished)
  const remainingByAvailability = Math.max(0, effectivePrinted - finished)
  return Math.min(remainingByTarget, remainingByAvailability)
}

const computeFinishedSets = (display: ProjectDisplay, productId: string) => {
  const productParts = display.data.inventory.partsByProduct[productId] ?? []
  if (productParts.length === 0) return 0

  const availablePerPart = productParts.map(partRef => {
    const finished = sumPartLogs(display.data.logs.acabamento, log => log.partId === partRef.partId)
    const backlog = getPartBacklog(display.data, partRef.partId)
    const effectiveFinished = Math.max(0, finished - backlog)
    const perProduct = Math.max(1, partRef.perProduct)
    return Math.floor(effectiveFinished / perProduct)
  })

  return Math.min(...availablePerPart)
}

const productRemaining = (display: ProjectDisplay, stage: 'montagem' | 'logistica', productId: string) => {
  const product = display.data.inventory.products.find(item => item.productId === productId)
  const baseTotal = product?.total ?? 0
  const backlog = getProductBacklog(display.data, productId)
  const target = baseTotal + backlog

  if (stage === 'montagem') {
    const assembled = sumAssemblyLogs(display.data.logs.montagem, log => log.productId === productId)
    const remainingByTarget = Math.max(0, target - assembled)
    const finishedSets = computeFinishedSets(display, productId)
    const remainingByAvailability = Math.max(0, finishedSets - assembled)
    return Math.min(remainingByTarget, remainingByAvailability)
  }

  const enviados = sumLogisticsLogs(display.data.logs.logistica, 'envio', log => log.productId === productId)
  const recalls = sumLogisticsLogs(display.data.logs.logistica, 'recall', log => log.productId === productId)
  const netShipped = Math.max(0, enviados - recalls)
  const assembled = sumAssemblyLogs(display.data.logs.montagem, log => log.productId === productId)
  const remainingByTarget = Math.max(0, target - netShipped)
  const remainingByAvailability = Math.max(0, assembled - netShipped)
  return Math.min(remainingByTarget, remainingByAvailability)
}

const partDefectCapacity = (display: ProjectDisplay, partId: string) =>
  partRemaining(display, 'acabamento', partId)

const productDefectCapacity = (display: ProjectDisplay, productId: string) => {
  const finished = sumAssemblyLogs(display.data.logs.montagem, log => log.productId === productId)
  const backlog = getProductBacklog(display.data, productId)
  return Math.max(0, finished - backlog)
}

const applyPartDefectToLogs = (logs: PartLog[], partId: string, quantity: number) => {
  const nextLogs = logs.map(log => ({ ...log }))
  let remaining = quantity
  for (let index = nextLogs.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const log = nextLogs[index]
    if (log.partId !== partId) continue
    const deduction = Math.min(log.quantidade, remaining)
    remaining -= deduction
    if (deduction === log.quantidade) {
      nextLogs.splice(index, 1)
    } else {
      nextLogs[index] = { ...log, quantidade: log.quantidade - deduction }
    }
  }
  return { logs: nextLogs, processed: quantity - remaining }
}

const applyProductDefectToLogs = (logs: AssemblyLog[], productId: string, quantity: number) => {
  const nextLogs = logs.map(log => ({ ...log }))
  let remaining = quantity
  for (let index = nextLogs.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const log = nextLogs[index]
    if (log.productId !== productId) continue
    const deduction = Math.min(log.quantidade, remaining)
    remaining -= deduction
    if (deduction === log.quantidade) {
      nextLogs.splice(index, 1)
    } else {
      nextLogs[index] = { ...log, quantidade: log.quantidade - deduction }
    }
  }
  return { logs: nextLogs, processed: quantity - remaining }
}

const recallCapacity = (display: ProjectDisplay, productId: string) => {
  const enviados = sumLogisticsLogs(display.data.logs.logistica, 'envio', log => log.productId === productId)
  const recalls = sumLogisticsLogs(display.data.logs.logistica, 'recall', log => log.productId === productId)
  return Math.max(0, enviados - recalls)
}

const computeMontagemPartDetails = (display: ProjectDisplay, productId: string): MontagemPartDetail[] => {
  const refs = display.data.inventory.partsByProduct[productId] ?? []
  const assembledUnits = sumAssemblyLogs(display.data.logs.montagem, log => log.productId === productId)
  return refs.map(ref => {
    const perProduct = Math.max(1, ref.perProduct)
    const finished = sumPartLogs(display.data.logs.acabamento, log => log.partId === ref.partId)
    const available = Math.max(0, finished - perProduct * assembledUnits)
    return {
      partId: ref.partId,
      partNome: ref.partNome,
      perProduct,
      available,
    }
  })
}

const computeStageItems = (display: ProjectDisplay, stage: StageKey): StageItemProgress[] => {
  if (stage === 'impressao' || stage === 'acabamento') {
    return display.data.inventory.parts.reduce<StageItemProgress[]>((acc, part) => {
      const base = part.total
      const backlog = getPartBacklog(display.data, part.partId)
      const total = base + backlog
      if (total === 0) return acc
      const completedRaw = stage === 'impressao'
        ? sumPartLogs(display.data.logs.impressao, log => log.partId === part.partId)
        : sumPartLogs(display.data.logs.acabamento, log => log.partId === part.partId)
      const completed = Math.min(total, completedRaw)
      const remaining = Math.max(0, total - completed)
      const progress = total > 0 ? Math.round((completed / total) * 100) : 100
      acc.push({
        id: part.partId,
        nome: part.partNome,
        total,
        completed,
        remaining,
        progress,
      })
      return acc
    }, [])
  }

  return display.data.inventory.products.reduce<StageItemProgress[]>((acc, product) => {
    const base = product.total
    const backlog = getProductBacklog(display.data, product.productId)
    const total = base + backlog
    if (total === 0) return acc
    let completed = 0
    if (stage === 'montagem') {
      completed = Math.min(total, sumAssemblyLogs(display.data.logs.montagem, log => log.productId === product.productId))
    } else {
      const enviados = sumLogisticsLogs(display.data.logs.logistica, 'envio', log => log.productId === product.productId)
      const recalls = sumLogisticsLogs(display.data.logs.logistica, 'recall', log => log.productId === product.productId)
      completed = Math.min(total, Math.max(0, enviados - recalls))
    }
    const remaining = Math.max(0, total - completed)
    const progress = total > 0 ? Math.round((completed / total) * 100) : 100
    acc.push({
      id: product.productId,
      nome: product.productNome,
      total,
      completed,
      remaining,
      progress,
    })
    return acc
  }, [])
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
      partsByProduct: {
        'mock-prod': [
          { partId: 'mock-base', partNome: 'Base', perProduct: 1 },
          { partId: 'mock-braco', partNome: 'Braco', perProduct: 2 },
        ],
      },
      totals: {
        impressao: 30,
        acabamento: 30,
        montagem: 10,
        logistica: 10,
      },
    },
    logs: createEmptyLogs(),
    rework: createEmptyRework(),
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

  const [acabamentoObs, setAcabamentoObs] = useState('')
  const [montagemObs, setMontagemObs] = useState('')
  const [logisticaObs, setLogisticaObs] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showAcabamentoHistory, setShowAcabamentoHistory] = useState(false)
  const [editingAcabamentoLogId, setEditingAcabamentoLogId] = useState<string | null>(null)
  const [editingAcabamentoObs, setEditingAcabamentoObs] = useState('')
  const [showMontagemPieces, setShowMontagemPieces] = useState(false)
  const [montagemPiecesProductId, setMontagemPiecesProductId] = useState<string | null>(null)
  const [montagemPiecesInput, setMontagemPiecesInput] = useState<PartInputMap>({})

  const activeProjectDisplay = activeProjectId ? projectDisplays[activeProjectId] : null
  const activeProjectData = activeProjectDisplay?.data
  const montagemModalParts = useMemo<MontagemPartDetail[]>(() => {
    if (!montagemPiecesProductId || !activeProjectDisplay) return []
    return computeMontagemPartDetails(activeProjectDisplay, montagemPiecesProductId)
  }, [montagemPiecesProductId, activeProjectDisplay])
  const montagemModalProduct = montagemPiecesProductId && activeProjectDisplay
    ? activeProjectDisplay.data.inventory.products.find(item => item.productId === montagemPiecesProductId)
    : undefined

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
      setAcabamentoObs('')
      setMontagemObs('')
      setLogisticaObs('')
      setShowAcabamentoHistory(false)
      setEditingAcabamentoLogId(null)
      setEditingAcabamentoObs('')
      setShowMontagemPieces(false)
      setMontagemPiecesProductId(null)
      setMontagemPiecesInput({})
    } else if (panelMode !== 'launch') {
      setImpressaoInput({})
      setAcabamentoInput({})
      setMontagemInput({})
      setLogisticaInput({})
      setAcabamentoObs('')
      setMontagemObs('')
      setLogisticaObs('')
      setShowAcabamentoHistory(false)
      setEditingAcabamentoLogId(null)
      setEditingAcabamentoObs('')
      setShowMontagemPieces(false)
      setMontagemPiecesProductId(null)
      setMontagemPiecesInput({})
    }
  }, [panelMode, activeProjectData])

  const handleOpenDetails = (projectId: string) => {
    setFeedback(null)
    setActiveProjectId(projectId)
    setPanelMode('details')
  }

  const handleOpenLaunch = (projectId: string) => {
    setFeedback(null)
    setActiveProjectId(projectId)
    setPanelMode('launch')
  }

  const handleClosePanel = () => {
    setFeedback(null)
    setPanelMode(null)
    setActiveProjectId(null)
    setShowMontagemPieces(false)
    setMontagemPiecesProductId(null)
    setMontagemPiecesInput({})
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

    if (stage === 'acabamento') {
      const blocking = entries.find(([partId, qty]) => qty > partRemaining(activeProjectDisplay, stage, partId))
      if (blocking) {
        const [blockedPartId] = blocking
        const part = activeProjectDisplay.data.inventory.parts.find(item => item.partId === blockedPartId)
        setFeedback(`Nao ha impressao suficiente para processar "${part?.partNome ?? 'esta peca'}" no acabamento.`)
        return
      }
    }

    const validEntries = entries.reduce<PartLog[]>((acc, [partId, qty]) => {
      const remaining = partRemaining(activeProjectDisplay, stage, partId)
      const amount = Math.min(qty, remaining)
      if (amount <= 0) return acc
      const part = activeProjectDisplay.data.inventory.parts.find(item => item.partId === partId)
      if (!part) return acc
      acc.push({
        id: generateLogId(`${stage}-${partId}`),
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

    appendLogs(activeProjectId, current => {
      const nextRework =
        stage === 'acabamento'
          ? (() => {
              const copy = cloneRework(current.rework)
              validEntries.forEach(entry => {
                const currentBacklog = copy.parts[entry.partId] ?? 0
                copy.parts[entry.partId] = Math.max(0, currentBacklog - entry.quantidade)
              })
              return copy
            })()
          : current.rework

      return {
        ...current,
        info: {
          ...current.info,
          ultimaAtualizacao: formatDateTime(timestamp),
        },
        inventory: current.inventory,
        logs: {
          ...current.logs,
          [stage]: [...current.logs[stage], ...validEntries],
        },
        rework: nextRework,
      }
    })

    if (stage === 'impressao') {
      setImpressaoInput(prev => {
        const next = { ...prev }
        validEntries.forEach(entry => {
          next[entry.partId] = 0
        })
        return next
      })
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
    setFeedback(null)
  }

  const handleSubmitAcabamentoDefect = () => {
    if (!activeProjectId || !activeProjectDisplay) return
    const entries = Object.entries(acabamentoInput).filter(([, qty]) => qty > 0)
    if (entries.length === 0) return

    for (const [partId, qty] of entries) {
      const available = partDefectCapacity(activeProjectDisplay, partId)
      if (qty > available) {
        const part = activeProjectDisplay.data.inventory.parts.find(item => item.partId === partId)
        setFeedback(`Quantidade de defeito maior que o saldo pendente para "${part?.partNome ?? 'esta peca'}".`)
        return
      }
    }

    const timestamp = new Date().toISOString()

    appendLogs(activeProjectId, current => {
      const nextLogs: ProjectLogs = {
        impressao: current.logs.impressao.map(log => ({ ...log })),
        acabamento: current.logs.acabamento.map(log => ({ ...log })),
        montagem: current.logs.montagem.map(log => ({ ...log })),
        logistica: current.logs.logistica.map(log => ({ ...log })),
      }
      entries.forEach(([partId, qty]) => {
        const adjustPrints = applyPartDefectToLogs(nextLogs.impressao, partId, qty)
        nextLogs.impressao = adjustPrints.logs
      })

      return {
        ...current,
        info: {
          ...current.info,
          ultimaAtualizacao: formatDateTime(timestamp),
        },
        logs: nextLogs,
        rework: cloneRework(current.rework),
      }
    })

    setAcabamentoInput(prev => {
      const next = { ...prev }
      entries.forEach(([partId]) => {
        next[partId] = 0
      })
      return next
    })
    setFeedback(null)
    setShowAcabamentoHistory(true)
  }

  const handleSubmitMontagem = () => {
    if (!activeProjectId || !activeProjectDisplay) return
    const entries = Object.entries(montagemInput).filter(([, qty]) => qty > 0)
    if (entries.length === 0) return
    const timestamp = new Date().toISOString()
    const note = montagemObs.trim() || undefined

    const blocking = entries.find(([productId, qty]) => qty > productRemaining(activeProjectDisplay, 'montagem', productId))
    if (blocking) {
      const [blockedProductId] = blocking
      const product = activeProjectDisplay.data.inventory.products.find(item => item.productId === blockedProductId)
      setFeedback(`Finalize o acabamento de "${product?.productNome ?? 'este produto'}" antes de registrar a montagem.`)
      return
    }

    const validEntries = entries.reduce<AssemblyLog[]>((acc, [productId, qty]) => {
      const remaining = productRemaining(activeProjectDisplay, 'montagem', productId)
      const amount = Math.min(qty, remaining)
      if (amount <= 0) return acc
      const product = activeProjectDisplay.data.inventory.products.find(item => item.productId === productId)
      if (!product) return acc
      acc.push({
        id: generateLogId(`montagem-${productId}`),
        timestamp,
        productId: product.productId,
        productNome: product.productNome,
        quantidade: amount,
        observacoes: note,
      })
      return acc
    }, [])

    if (validEntries.length === 0) return

    appendLogs(activeProjectId, current => {
      const nextRework = cloneRework(current.rework)
      validEntries.forEach(entry => {
        const currentBacklog = nextRework.products[entry.productId] ?? 0
        nextRework.products[entry.productId] = Math.max(0, currentBacklog - entry.quantidade)
      })
      return {
        ...current,
        info: {
          ...current.info,
          ultimaAtualizacao: formatDateTime(timestamp),
        },
        inventory: current.inventory,
        logs: {
          ...current.logs,
          montagem: [...current.logs.montagem, ...validEntries],
        },
        rework: nextRework,
      }
    })

    setMontagemInput(prev => {
      const next = { ...prev }
      validEntries.forEach(entry => {
        next[entry.productId] = 0
      })
      return next
    })
    setMontagemObs('')
    setFeedback(null)
  }

  const handleSubmitLogistica = () => {
    if (!activeProjectId || !activeProjectDisplay) return
    const entries = Object.entries(logisticaInput)
    if (entries.length === 0) return
    const timestamp = new Date().toISOString()
    const note = logisticaObs.trim() || undefined

    const blockingShipment = entries.find(([productId, values]) => {
      const requested = sanitizeQuantity(values.envio)
      if (requested <= 0) return false
      const available = productRemaining(activeProjectDisplay, 'logistica', productId)
      return requested > available
    })

    if (blockingShipment) {
      const [blockedProductId] = blockingShipment
      const product = activeProjectDisplay.data.inventory.products.find(item => item.productId === blockedProductId)
      setFeedback(`Conclua a montagem de "${product?.productNome ?? 'este produto'}" antes de registrar o envio.`)
      return
    }

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
            id: generateLogId(`logistica-envio-${productId}`),
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
            id: generateLogId(`logistica-recall-${productId}`),
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
      ...current,
      info: {
        ...current.info,
        ultimaAtualizacao: formatDateTime(timestamp),
      },
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
    setFeedback(null)
  }

  const handleOpenMontagemPieces = (productId: string) => {
    if (!activeProjectDisplay) return
    const parts = computeMontagemPartDetails(activeProjectDisplay, productId)
    const defaults = parts.reduce((acc, part) => {
      acc[part.partId] = 0
      return acc
    }, {} as PartInputMap)
    setMontagemPiecesInput(defaults)
    setMontagemPiecesProductId(productId)
    setShowMontagemPieces(true)
    setFeedback(null)
  }

  const handleCloseMontagemPieces = () => {
    setShowMontagemPieces(false)
    setMontagemPiecesProductId(null)
    setMontagemPiecesInput({})
  }

  const handleSubmitMontagemPiecesDefect = () => {
    if (!activeProjectId || !activeProjectDisplay || !montagemPiecesProductId) return
    const entries = Object.entries(montagemPiecesInput).filter(([, qty]) => qty > 0)
    if (entries.length === 0) return

    const partDetails = computeMontagemPartDetails(activeProjectDisplay, montagemPiecesProductId)
    const partMap = partDetails.reduce<Record<string, MontagemPartDetail>>((acc, part) => {
      acc[part.partId] = part
      return acc
    }, {})

    for (const [partId, qty] of entries) {
      const detail = partMap[partId]
      if (!detail || qty > detail.available) {
        const part = activeProjectDisplay.data.inventory.parts.find(item => item.partId === partId)
        setFeedback(`Quantidade de defeito maior que o saldo pendente para "${part?.partNome ?? 'esta peca'}".`)
        return
      }
    }

    const productDefectRoom = productDefectCapacity(activeProjectDisplay, montagemPiecesProductId)
    const lostUnitCandidates = entries.map(([partId, qty]) => {
      const detail = partMap[partId]
      const perProduct = detail ? detail.perProduct : 1
      return Math.ceil(qty / perProduct)
    })
    const potentialLostUnits = lostUnitCandidates.length > 0 ? Math.max(...lostUnitCandidates) : 0
    const lostUnits = Math.min(productDefectRoom, potentialLostUnits)

    const timestamp = new Date().toISOString()

    appendLogs(activeProjectId, current => {
      const nextLogs: ProjectLogs = {
        impressao: current.logs.impressao.map(log => ({ ...log })),
        acabamento: current.logs.acabamento.map(log => ({ ...log })),
        montagem: current.logs.montagem.map(log => ({ ...log })),
        logistica: current.logs.logistica.map(log => ({ ...log })),
      }

      entries.forEach(([partId, qty]) => {
        const adjustFinish = applyPartDefectToLogs(nextLogs.acabamento, partId, qty)
        nextLogs.acabamento = adjustFinish.logs
        const adjustPrint = applyPartDefectToLogs(nextLogs.impressao, partId, qty)
        nextLogs.impressao = adjustPrint.logs
      })

      if (lostUnits > 0) {
        const productAdjustment = applyProductDefectToLogs(nextLogs.montagem, montagemPiecesProductId, lostUnits)
        nextLogs.montagem = productAdjustment.logs
      }

      return {
        ...current,
        info: {
          ...current.info,
          ultimaAtualizacao: formatDateTime(timestamp),
        },
        logs: nextLogs,
        rework: cloneRework(current.rework),
      }
    })

    setMontagemPiecesInput(prev => {
      const next = { ...prev }
      entries.forEach(([partId]) => {
        next[partId] = 0
      })
      return next
    })
    setFeedback(null)
    setShowAcabamentoHistory(true)
  }

  const handleStartEditAcabamentoLog = (log: PartLog) => {
    setShowAcabamentoHistory(true)
    setEditingAcabamentoLogId(log.id)
    setEditingAcabamentoObs(log.observacoes ?? '')
  }

  const handleCancelEditAcabamentoLog = () => {
    setEditingAcabamentoLogId(null)
    setEditingAcabamentoObs('')
  }

  const handleSaveAcabamentoLog = () => {
    if (!activeProjectId || !editingAcabamentoLogId) return
    const timestamp = new Date().toISOString()
    const updatedNote = editingAcabamentoObs.trim() || undefined

    appendLogs(activeProjectId, current => ({
      ...current,
      info: {
        ...current.info,
        ultimaAtualizacao: formatDateTime(timestamp),
      },
      logs: {
        ...current.logs,
        acabamento: current.logs.acabamento.map(entry =>
          entry.id === editingAcabamentoLogId ? { ...entry, observacoes: updatedNote } : entry,
        ),
      },
    }))

    setEditingAcabamentoLogId(null)
    setEditingAcabamentoObs('')
    setFeedback(null)
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
          {feedback ? (
            <Alert variant='danger' dismissible onClose={() => setFeedback(null)} className='mb-3'>
              {feedback}
            </Alert>
          ) : null}
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
                const items = computeStageItems(activeProjectDisplay, stage)
                const itemLabel = stage === 'impressao' || stage === 'acabamento' ? 'Peca' : 'Produto'
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
                    {items.length > 0 ? (
                      <Table responsive bordered size='sm' className='align-middle mb-0'>
                        <thead className='table-light'>
                          <tr>
                            <th>{itemLabel}</th>
                            <th className='text-center'>Total</th>
                            <th className='text-center'>Concluido</th>
                            <th className='text-center'>Restante</th>
                            <th className='text-center'>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(item => (
                            <tr key={`${stage}-${item.id}`}>
                              <td>{item.nome}</td>
                              <td className='text-center'>{item.total}</td>
                              <td className='text-center'>{item.completed}</td>
                              <td className='text-center'>{item.remaining}</td>
                              <td className='text-center'>{item.progress}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className='text-muted small mb-0'>Nenhuma unidade registrada neste setor.</p>
                    )}
                  </div>
                )
              })}
            </Stack>
          ) : null}

          {panelMode === 'launch' && activeProjectData && activeProjectDisplay ? (
            <Accordion>
              <Accordion.Item eventKey='impressao'>
                <Accordion.Header>Impressao</Accordion.Header>
                <Accordion.Body>
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
                  <div className='d-flex justify-content-end mt-3'>
                    <Button
                      type='button'
                      variant='danger'
                      onClick={() => handleSubmitPartStage('impressao', impressaoInput, '')}
                    >
                      Registrar impressao
                    </Button>
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey='acabamento'>
                <Accordion.Header>Acabamento</Accordion.Header>
                <Accordion.Body>
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
                        const inputMax = available
                        const disabled = inputMax === 0
                        return (
                          <tr key={`acab-${part.partId}`}>
                            <td>{part.productNome}</td>
                            <td>{part.partNome}</td>
                            <td className='text-center'>{available}</td>
                            <td className='text-center' style={{ maxWidth: '120px' }}>
                              <Form.Control
                                type='number'
                                min={0}
                                max={inputMax}
                                value={acabamentoInput[part.partId] ?? 0}
                                disabled={disabled}
                                onChange={event =>
                                  updatePartQuantity(setAcabamentoInput, acabamentoInput, part.partId, event.target.value)
                                }
                              />
                              <small className='text-muted d-block'>
                                Maximo para descartar: {available}
                              </small>
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
                  <div className='d-flex justify-content-end gap-2 mt-3'>
                    <Button type='button' variant='outline-danger' onClick={handleSubmitAcabamentoDefect}>
                      Registrar defeito
                    </Button>
                    <Button
                      type='button'
                      variant='danger'
                      onClick={() => handleSubmitPartStage('acabamento', acabamentoInput, acabamentoObs)}
                    >
                      Registrar acabamento
                    </Button>
                  </div>
                  {activeProjectData.logs.acabamento.length > 0 ? (
                    <div className='mt-4'>
                      <div className='d-flex justify-content-between align-items-center'>
                        <h6 className='mb-0'>Historico de acabamento</h6>
                        <Button
                          variant='outline-secondary'
                          size='sm'
                          onClick={() => setShowAcabamentoHistory(prev => !prev)}
                        >
                          {showAcabamentoHistory ? 'Ocultar' : 'Expandir'}
                        </Button>
                      </div>
                      <Collapse in={showAcabamentoHistory}>
                        <div>
                          <Table responsive bordered size='sm' className='align-middle mt-3'>
                            <thead className='table-light'>
                              <tr>
                                <th>Data</th>
                                <th>Produto</th>
                                <th>Peca</th>
                                <th className='text-center'>Qtd.</th>
                                <th>Observacoes</th>
                                <th className='text-center'>Acoes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeProjectData.logs.acabamento.slice().reverse().map(log => {
                                const isEditing = editingAcabamentoLogId === log.id
                                return (
                                  <tr key={log.id}>
                                    <td>{formatDateTime(log.timestamp)}</td>
                                    <td>{log.productNome}</td>
                                    <td>{log.partNome}</td>
                                    <td className='text-center'>{log.quantidade}</td>
                                    <td>
                                      {isEditing ? (
                                        <Form.Control
                                          as='textarea'
                                          rows={2}
                                          value={editingAcabamentoObs}
                                          onChange={event => setEditingAcabamentoObs(event.target.value)}
                                          placeholder='Atualize as observacoes do acabamento'
                                        />
                                      ) : (
                                        log.observacoes || '-'
                                      )}
                                    </td>
                                    <td className='text-center'>
                                      {isEditing ? (
                                        <div className='d-flex gap-2 justify-content-center'>
                                          <Button variant='outline-success' size='sm' onClick={handleSaveAcabamentoLog}>
                                            Salvar
                                          </Button>
                                          <Button variant='outline-secondary' size='sm' onClick={handleCancelEditAcabamentoLog}>
                                            Cancelar
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className='d-flex justify-content-center'>
                                          <Button variant='outline-secondary' size='sm' onClick={() => handleStartEditAcabamentoLog(log)}>
                                            Editar observacao
                                          </Button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </Table>
                        </div>
                      </Collapse>
                    </div>
                  ) : null}
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey='montagem'>
                <Accordion.Header>Montagem</Accordion.Header>
                <Accordion.Body>
                  <Table responsive bordered size='sm' className='align-middle'>
                    <thead className='table-light'>
                      <tr>
                        <th>Produto</th>
                        <th className='text-center'>Pendentes</th>
                        <th className='text-center'>Unidades montadas</th>
                        <th className='text-center'>Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeProjectData.inventory.products.map(product => {
                        const available = productRemaining(activeProjectDisplay, 'montagem', product.productId)
                        const defectAvailable = productDefectCapacity(activeProjectDisplay, product.productId)
                        const partDetails = computeMontagemPartDetails(activeProjectDisplay, product.productId)
                        const disabled = available === 0
                        const disablePiecesView = partDetails.length === 0
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
                                disabled={disabled}
                                onChange={event =>
                                  updateProductQuantity(setMontagemInput, montagemInput, product.productId, event.target.value)
                                }
                              />
                              <small className='text-muted d-block'>
                                Montados disponiveis para descarte: {defectAvailable}
                              </small>
                            </td>
                            <td className='text-center'>
                              <Button
                                variant='outline-secondary'
                                size='sm'
                                onClick={() => handleOpenMontagemPieces(product.productId)}
                                disabled={disablePiecesView}
                              >
                                Ver pecas
                              </Button>
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
                  {activeProjectData.logs.montagem.length > 0 ? (
                    <div className='mt-4'>
                      <h6 className='mb-2'>Historico de montagem</h6>
                      <Table responsive bordered size='sm' className='align-middle'>
                        <thead className='table-light'>
                          <tr>
                            <th>Data</th>
                            <th>Produto</th>
                            <th className='text-center'>Qtd.</th>
                            <th>Observacoes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeProjectData.logs.montagem.slice().reverse().map(log => (
                            <tr key={log.id}>
                              <td>{formatDateTime(log.timestamp)}</td>
                              <td>{log.productNome}</td>
                              <td className='text-center'>{log.quantidade}</td>
                              <td>{log.observacoes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : null}
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey='logistica'>
                <Accordion.Header>Logistica</Accordion.Header>
                <Accordion.Body>
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
                  {activeProjectData.logs.logistica.length > 0 ? (
                    <div className='mt-4'>
                      <h6 className='mb-2'>Historico logistico</h6>
                      <Table responsive bordered size='sm' className='align-middle'>
                        <thead className='table-light'>
                          <tr>
                            <th>Data</th>
                            <th>Produto</th>
                            <th>Tipo</th>
                            <th className='text-center'>Qtd.</th>
                            <th>Destino</th>
                            <th>Observacoes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeProjectData.logs.logistica.slice().reverse().map(log => (
                            <tr key={log.id}>
                              <td>{formatDateTime(log.timestamp)}</td>
                              <td>{log.productNome}</td>
                              <td className='text-capitalize'>{log.tipo}</td>
                              <td className='text-center'>{log.quantidade}</td>
                              <td>{log.destino || '-'}</td>
                              <td>{log.observacoes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : null}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          ) : null}
        </Offcanvas.Body>
      </Offcanvas>

      <Modal show={showMontagemPieces} onHide={handleCloseMontagemPieces} size='lg' centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Pecas vinculadas{' '}
            {montagemModalProduct ? `- ${montagemModalProduct.productNome}` : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {activeProjectDisplay && montagemModalParts.length > 0 ? (
            <Table responsive bordered size='sm' className='align-middle'>
              <thead className='table-light'>
                <tr>
                  <th>Peca</th>
                  <th className='text-center'>Disponivel na montagem</th>
                  <th className='text-center'>Descartar</th>
                </tr>
              </thead>
              <tbody>
                {montagemModalParts.map(partRef => {
                  const disabled = partRef.available === 0
                  return (
                    <tr key={`mont-modal-${partRef.partId}`}>
                      <td>{partRef.partNome}</td>
                      <td className='text-center'>{partRef.available}</td>
                      <td className='text-center' style={{ maxWidth: '140px' }}>
                        <Form.Control
                          type='number'
                          min={0}
                          max={partRef.available}
                          value={montagemPiecesInput[partRef.partId] ?? 0}
                          disabled={disabled}
                          onChange={event =>
                            updatePartQuantity(
                              setMontagemPiecesInput,
                              montagemPiecesInput,
                              partRef.partId,
                              event.target.value,
                            )
                          }
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          ) : (
            <p className='mb-0 text-muted'>Nenhuma peca disponivel para analise.</p>
          )}
        </Modal.Body>
        {montagemModalParts.length > 0 ? (
          <Modal.Footer className='d-flex justify-content-between'>
            <small className='text-muted'>
              Ajuste as quantidades de pecas concluidas na montagem que devem ser descartadas.
            </small>
            <div className='d-flex gap-2'>
              <Button variant='outline-secondary' onClick={handleCloseMontagemPieces}>
                Fechar
              </Button>
              <Button
                variant='danger'
                onClick={handleSubmitMontagemPiecesDefect}
                disabled={montagemModalParts.every(part => (montagemPiecesInput[part.partId] ?? 0) === 0)}
              >
                Registrar defeito
              </Button>
            </div>
          </Modal.Footer>
        ) : (
          <Modal.Footer>
            <Button variant='outline-secondary' onClick={handleCloseMontagemPieces}>
              Fechar
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </Container>
  )
}

export default Producao


