export type BudgetStatus = 'rascunho' | 'enviado' | 'aceito' | 'recusado';

export type BudgetPriority = 'baixa' | 'media' | 'alta';

export type ProductionSectorKey =
  | 'impressao'
  | 'acabamento'
  | 'pintura'
  | 'montagem'
  | 'revisao'
  | 'logistica';

export interface ProductionSectorPlan {
  status: string;
  responsavel: string;
  inicioPrevisto: string;
  terminoPrevisto: string;
  observacoes?: string;
  percentual?: number;
}

export interface ProductionPlan {
  resumo: string;
  setores: Record<ProductionSectorKey, ProductionSectorPlan>;
}

export interface BudgetLinePart {
  id: string;
  nome: string;
  quantidade: number;
  material: string;
  peso: number;
  tempoImpressao: number;
  custoAdicional: number;
  valorCalculado: number;
}

export interface BudgetLineProduct {
  id: string;
  nome: string;
  quantidade: number;
  montagem?: string;
  pintura?: string;
  partes: BudgetLinePart[];
}

export interface BudgetRecord {
  id: string;
  codigo: string;
  clienteId: string;
  clienteNome: string;
  criadoEm: string;
  status: BudgetStatus;
  total: number;
  desconto?: number;
  observacoes?: string;
  resumoDoProjeto?: string;
  anexos?: string[];
  itens: BudgetLineProduct[];
  producao?: ProductionPlan;
  previsaoInicio?: string;
  previsaoEntrega?: string;
  responsavelProjeto?: string;
  prioridade?: BudgetPriority;
  etapaAtual?: string;
}
