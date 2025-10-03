import { useMemo, useState } from 'react';
import { Container, Table, Badge, Button, Stack, Card, Form, InputGroup } from 'react-bootstrap';
import { Search, Filter } from 'react-feather';
import type { BudgetRecord, BudgetStatus, BudgetPriority } from '../types/budget';

interface OrcamentosProps {
  budgets: BudgetRecord[];
  onUpdateStatus: (budgetId: string, status: BudgetStatus) => void;
}

const statusVariant: Record<BudgetStatus, string> = {
  rascunho: 'secondary',
  enviado: 'warning',
  aceito: 'success',
  recusado: 'dark',
};

const statusLabel: Record<BudgetStatus, string> = {
  rascunho: 'Rascunho',
  enviado: 'Aguardando cliente',
  aceito: 'Aceito',
  recusado: 'Recusado',
};

const priorityVariant: Record<BudgetPriority, string> = {
  alta: 'danger',
  media: 'primary',
  baixa: 'secondary',
};

const priorityLabel: Record<BudgetPriority, string> = {
  alta: 'Alta',
  media: 'Media',
  baixa: 'Baixa',
};

const deadlineTextClass: Record<string, string> = {
  danger: 'text-danger',
  warning: 'text-warning',
};

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const describeDeadline = (budget: BudgetRecord) => {
  if (!budget.previsaoEntrega) return 'Sem data definida';
  const parsed = new Date(budget.previsaoEntrega);
  if (Number.isNaN(parsed.getTime())) return budget.previsaoEntrega;

  const today = new Date();
  const diffMs = parsed.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)} dia(s) em atraso`;
  if (diffDays === 0) return 'Vence hoje';
  if (diffDays === 1) return 'Vence em 1 dia';
  return `Vence em ${diffDays} dias`;
};
const deadlineVariant = (budget: BudgetRecord) => {
  if (!budget.previsaoEntrega) return 'secondary';
  const parsed = new Date(budget.previsaoEntrega);
  if (Number.isNaN(parsed.getTime())) return 'secondary';
  const today = new Date();
  const diffDays = Math.ceil((parsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'danger';
  if (diffDays <= 2) return 'warning';
  return 'info';
};

const Orcamentos = ({ budgets, onUpdateStatus }: OrcamentosProps) => {
  const [statusFilter, setStatusFilter] = useState<'todos' | BudgetStatus>('todos');
  const [query, setQuery] = useState('');

  const filteredBudgets = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    return budgets.filter(budget => {
      const statusMatches = statusFilter === 'todos' || budget.status === statusFilter;
      if (!statusMatches) return false;
      if (!normalizedQuery) return true;
      const searchableValues = [budget.codigo, budget.clienteNome, budget.resumoDoProjeto ?? '', budget.responsavelProjeto ?? ''];
      return searchableValues.some(value => normalize(value).includes(normalizedQuery));
    });
  }, [budgets, statusFilter, query]);

  const handleAccept = (id: string) => {
    onUpdateStatus(id, 'aceito');
  };

  const handleReject = (id: string) => {
    onUpdateStatus(id, 'recusado');
  };

  return (
    <Container fluid>
      <div className="d-flex flex-wrap gap-3 justify-content-between align-items-start mb-4">
        <div>
          <h2 className="mb-0">Orcamentos</h2>
          <small className="text-secondary">{filteredBudgets.length} registro(s)</small>
        </div>
        <Stack direction="horizontal" gap={2} className="flex-wrap">
          <InputGroup className="w-auto" style={{ minWidth: 260 }}>
            <InputGroup.Text>
              <Search size={16} />
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Buscar por codigo, cliente ou responsavel"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </InputGroup>
          <InputGroup className="w-auto" style={{ minWidth: 180 }}>
            <InputGroup.Text>
              <Filter size={16} />
            </InputGroup.Text>
            <Form.Select value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'todos' | BudgetStatus)}>
              <option value="todos">Todos os status</option>
              <option value="rascunho">Rascunho</option>
              <option value="enviado">Enviado</option>
              <option value="aceito">Aceito</option>
              <option value="recusado">Recusado</option>
            </Form.Select>
          </InputGroup>
        </Stack>
      </div>

      {filteredBudgets.length === 0 ? (
        <CardPlaceholder />
      ) : (
        <Table hover responsive className="rounded-4 overflow-hidden">
          <thead className="table-light">
            <tr>
              <th>Codigo</th>
              <th>Cliente</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Prioridade</th>
              <th>Entrega</th>
              <th>Responsavel</th>
              <th>Etapa</th>
              <th>Criado em</th>
              <th className="text-end">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filteredBudgets.map(budget => (
              <tr key={budget.id}>
                <td className="fw-semibold">{budget.codigo}</td>
                <td>
                  <div className="d-flex flex-column">
                    <span>{budget.clienteNome}</span>
                    {budget.resumoDoProjeto ? (
                      <small className="text-secondary">{budget.resumoDoProjeto}</small>
                    ) : null}
                  </div>
                </td>
                <td>{formatCurrency(budget.total)}</td>
                <td>
                  <Badge bg={statusVariant[budget.status]}>{statusLabel[budget.status]}</Badge>
                </td>
                <td>
                  <Badge bg={priorityVariant[budget.prioridade ?? 'media']}>
                    {priorityLabel[budget.prioridade ?? 'media']}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex flex-column">
                    <span>{budget.previsaoEntrega ? formatDate(budget.previsaoEntrega) : 'Sem data'}</span>
                    <small className={deadlineTextClass[deadlineVariant(budget)] ?? 'text-secondary'}>
                      {describeDeadline(budget)}
                    </small>
                  </div>
                </td>
                <td>{budget.responsavelProjeto ?? 'A definir'}</td>
                <td>{budget.etapaAtual ?? 'Planejamento'}</td>
                <td>{formatDate(budget.criadoEm)}</td>
                <td className="text-end">
                  <Stack direction="horizontal" gap={2} className="justify-content-end">
                    <Button
                      size="sm"
                      variant="outline-success"
                      disabled={budget.status === 'aceito'}
                      onClick={() => handleAccept(budget.id)}
                    >
                      Marcar como aceito
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      disabled={budget.status === 'recusado'}
                      onClick={() => handleReject(budget.id)}
                    >
                      Reprovar
                    </Button>
                  </Stack>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

const CardPlaceholder = () => (
  <Card className="p-4 rounded-4">
    <h5 className="mb-2">Nenhum orcamento corresponde aos filtros atuais</h5>
    <p className="text-secondary mb-0">
      Cadastre um novo orcamento na aba "Novo Orcamento" ou ajuste os filtros para visualizar registros existentes.
    </p>
  </Card>
);

export default Orcamentos;
