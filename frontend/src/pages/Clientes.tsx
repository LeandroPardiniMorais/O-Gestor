import { useMemo, useState } from 'react';
import { Container, Card, Table, Badge, Form, InputGroup } from 'react-bootstrap';
import { Search } from 'react-feather';
import type { Client } from '../App';

interface ClientesProps {
  clients: Client[];
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const Clientes = ({ clients }: ClientesProps) => {
  const [query, setQuery] = useState('');

  const filteredClients = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return clients;
    const normalizedQuery = normalize(trimmed);
    return clients.filter(client => {
      const valuesToSearch = [
        client.nome,
        client.nomeEmpresa ?? '',
        client.cnpj ?? '',
        client.cpf ?? '',
        client.email ?? '',
        client.telefone ?? '',
      ];
      return valuesToSearch.some(value => normalize(value).includes(normalizedQuery));
    });
  }, [clients, query]);

  const formatDocument = (client: Client) => client.cnpj ?? client.cpf ?? 'Sem documento';
  const resolveTipo = (client: Client) => (client.cnpj ? 'PJ' : 'PF');
  const formatContato = (client: Client) => [client.telefone, client.email].filter(Boolean).join(' | ');

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h2 className="mb-0">Clientes</h2>
          <small className="text-secondary">{filteredClients.length} registro(s)</small>
        </div>
        <InputGroup className="w-auto" style={{ minWidth: 300 }}>
          <InputGroup.Text>
            <Search size={16} />
          </InputGroup.Text>
          <Form.Control
            type="search"
            placeholder="Buscar por nome, documento ou email"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </InputGroup>
      </div>

      <Card className="rounded-4">
        {filteredClients.length === 0 ? (
          <div className="p-4 text-center text-secondary">
            Nenhum cliente encontrado. Ajuste os filtros ou cadastre um novo registro.
          </div>
        ) : (
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Tipo</th>
                  <th>Contato</th>
                  <th>Endereco</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => (
                  <tr key={client.id}>
                    <td className="fw-semibold">
                      <div className="d-flex flex-column">
                        <span>{client.nome}</span>
                        {client.nomeEmpresa ? (
                          <small className="text-secondary">{client.nomeEmpresa}</small>
                        ) : null}
                      </div>
                    </td>
                    <td>{formatDocument(client)}</td>
                    <td>
                      <Badge bg={client.cnpj ? 'info' : 'secondary'}>{resolveTipo(client)}</Badge>
                    </td>
                    <td>{formatContato(client) || 'Sem contato cadastrado'}</td>
                    <td>{client.endereco}</td>
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

export default Clientes;
