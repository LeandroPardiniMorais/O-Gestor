import { Container, Table, Badge, Button, Stack, Card } from 'react-bootstrap';
import type { BudgetRecord, BudgetStatus } from '../types/budget';

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

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Orcamentos = ({ budgets, onUpdateStatus }: OrcamentosProps) => {
  const handleAccept = (id: string) => {
    onUpdateStatus(id, 'aceito');
  };

  const handleReject = (id: string) => {
    onUpdateStatus(id, 'recusado');
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Orçamentos</h2>
        <span className="text-secondary">{budgets.length} registro(s)</span>
      </div>

      {budgets.length === 0 ? (
        <CardPlaceholder />
      ) : (
        <Table hover responsive className="rounded-4 overflow-hidden">
          <thead className="table-light">
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Criado em</th>
              <th className="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map(budget => (
              <tr key={budget.id}>
                <td className="fw-semibold">{budget.codigo}</td>
                <td>{budget.clienteNome}</td>
                <td>{formatCurrency(budget.total)}</td>
                <td>
                  <Badge bg={statusVariant[budget.status]}>{statusLabel[budget.status]}</Badge>
                </td>
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
    <h5 className="mb-2">Nenhum orçamento registrado</h5>
    <p className="text-secondary mb-0">
      Gere um novo orçamento na aba "Novo Orçamento" para começar a alimentar o pipeline.
    </p>
  </Card>
);

export default Orcamentos;



