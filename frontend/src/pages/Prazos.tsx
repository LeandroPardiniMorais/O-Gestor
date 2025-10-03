import { useMemo, useState } from 'react';
import { Container, Card, Table, Badge, Stack, InputGroup, Form } from 'react-bootstrap';
import { Clock, Search } from 'react-feather';
import type { BudgetRecord, BudgetStatus } from '../types/budget';

interface PrazosProps {
  budgets: BudgetRecord[];
}

interface DeadlineMeta {
  label: string;
  variant: string;
  dateLabel: string;
  rawDate?: Date;
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

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
};

const computeDeadlineMeta = (budget: BudgetRecord): DeadlineMeta => {
  if (!budget.previsaoEntrega) {
    return {
      label: 'Sem data definida',
      variant: 'secondary',
      dateLabel: 'Aguardando planejamento',
    };
  }

  const parsed = new Date(budget.previsaoEntrega);
  if (Number.isNaN(parsed.getTime())) {
    return {
      label: 'Data invalida',
      variant: 'secondary',
      dateLabel: budget.previsaoEntrega,
    };
  }

  const today = new Date();
  const diffDays = Math.ceil((parsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)} dia(s) em atraso`,
      variant: 'danger',
      dateLabel: formatDate(budget.previsaoEntrega),
      rawDate: parsed,
    };
  }
  if (diffDays === 0) {
    return {
      label: 'Entrega hoje',
      variant: 'warning',
      dateLabel: formatDate(budget.previsaoEntrega),
      rawDate: parsed,
    };
  }
  if (diffDays <= 2) {
    return {
      label: `Vence em ${diffDays} dia(s)`,
      variant: 'warning',
      dateLabel: formatDate(budget.previsaoEntrega),
      rawDate: parsed,
    };
  }
  return {
    label: `Vence em ${diffDays} dia(s)`,
    variant: 'info',
    dateLabel: formatDate(budget.previsaoEntrega),
    rawDate: parsed,
  };
};
const Prazos = ({ budgets }: PrazosProps) => {
  const [statusFilter, setStatusFilter] = useState<'todos' | BudgetStatus>('todos');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const normalizedQuery = normalize(query.trim());

    return budgets
      .filter(budget => statusFilter === 'todos' || budget.status === statusFilter)
      .filter(budget => {
        if (!normalizedQuery) return true;
        const searchable = [
          budget.codigo,
          budget.clienteNome,
          budget.responsavelProjeto ?? '',
          budget.etapaAtual ?? '',
        ];
        return searchable.some(value => normalize(value).includes(normalizedQuery));
      })
      .map(budget => ({
        budget,
        deadline: computeDeadlineMeta(budget),
      }))
      .sort((a, b) => {
        if (a.deadline.rawDate && b.deadline.rawDate) {
          return a.deadline.rawDate.getTime() - b.deadline.rawDate.getTime();
        }
        if (a.deadline.rawDate) return -1;
        if (b.deadline.rawDate) return 1;
        return 0;
      });
  }, [budgets, statusFilter, query]);

  return (
    <Container fluid>
      <div className="d-flex flex-wrap justify-content-between gap-3 align-items-start mb-4">
        <div>
          <h2 className="mb-0">Prazos</h2>
          <small className="text-secondary">Monitoramento de entregas programadas</small>
        </div>
        <Stack direction="horizontal" gap={2} className="flex-wrap">
          <InputGroup className="w-auto" style={{ minWidth: 260 }}>
            <InputGroup.Text>
              <Search size={16} />
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Filtrar por cliente, codigo ou responsavel"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </InputGroup>
          <Form.Select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value as 'todos' | BudgetStatus)}
            style={{ minWidth: 200 }}
          >
            <option value="todos">Todos os status</option>
            <option value="rascunho">Rascunho</option>
            <option value="enviado">Enviado</option>
            <option value="aceito">Aceito</option>
            <option value="recusado">Recusado</option>
          </Form.Select>
        </Stack>
      </div>

      <Card className="rounded-4">
        {rows.length === 0 ? (
          <div className="p-4 text-center text-secondary">
            Nenhum prazo encontrado para os filtros informados. Gere orcamentos ou defina datas estimadas.
          </div>
        ) : (
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Orcamento</th>
                  <th>Cliente</th>
                  <th>Entrega</th>
                  <th>Status</th>
                  <th>Responsavel</th>
                  <th>Etapa</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ budget, deadline }) => (
                  <tr key={budget.id}>
                    <td className="fw-semibold">{budget.codigo}</td>
                    <td>{budget.clienteNome}</td>
                    <td>
                      <div className="d-flex flex-column">
                        <span>{deadline.dateLabel}</span>
                        <Badge bg={deadline.variant} className="align-self-start mt-1">
                          <Clock size={12} className="me-1" />
                          {deadline.label}
                        </Badge>
                      </div>
                    </td>
                    <td>
                      <Badge bg={statusVariant[budget.status]}>{statusLabel[budget.status]}</Badge>
                    </td>
                    <td>{budget.responsavelProjeto ?? 'A definir'}</td>
                    <td>{budget.etapaAtual ?? 'Planejamento'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        )}
      </Card>
    </Container>
  );
};

export default Prazos;
