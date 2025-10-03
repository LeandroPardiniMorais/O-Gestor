import { useMemo, useState } from 'react';
import { Container, Card, Table, Form, InputGroup } from 'react-bootstrap';
import { Search, Mail, Phone } from 'react-feather';
import type { SupplierRecord } from './Cadastros';

interface FornecedoresProps {
  suppliers: SupplierRecord[];
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const Fornecedores = ({ suppliers }: FornecedoresProps) => {
  const [query, setQuery] = useState('');

  const filteredSuppliers = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return suppliers;
    const normalizedQuery = normalize(trimmed);
    return suppliers.filter(supplier =>
      [supplier.nome, supplier.contato, supplier.telefone]
        .filter(Boolean)
        .some(value => normalize(String(value)).includes(normalizedQuery)),
    );
  }, [suppliers, query]);

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h2 className="mb-0">Fornecedores</h2>
          <small className="text-secondary">{filteredSuppliers.length} registro(s)</small>
        </div>
        <InputGroup className="w-auto" style={{ minWidth: 280 }}>
          <InputGroup.Text>
            <Search size={16} />
          </InputGroup.Text>
          <Form.Control
            type="search"
            placeholder="Buscar por nome ou contato"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </InputGroup>
      </div>

      <Card className="rounded-4">
        {filteredSuppliers.length === 0 ? (
          <div className="p-4 text-center text-secondary">
            Nenhum fornecedor encontrado. Ajuste os filtros ou cadastre um novo registro.
          </div>
        ) : (
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Fornecedor</th>
                  <th>Contato</th>
                  <th>Telefone</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(supplier => (
                  <tr key={supplier.id}>
                    <td className="fw-semibold">{supplier.nome}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Mail size={14} className="text-secondary" />
                        <span>{supplier.contato}</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Phone size={14} className="text-secondary" />
                        <span>{supplier.telefone}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        )}
        <Card.Footer className="text-end text-secondary small">
          Integre estes cadastros ao banco de dados para sincronizar compras automaticamente.
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default Fornecedores;
