import { Container, Card, Row, Col } from 'react-bootstrap';
import { Client } from '../App'; // Import Client from App

interface ClientesProps {
  clients: Client[];
}

const Clientes = ({ clients }: ClientesProps) => {
  return (
    <Container fluid>
      <h2 className="mb-4">Clientes</h2>
      {clients.map((client, index) => (
        <Card key={client.id} className="mb-3">
          <Card.Header>
            <h5>{index + 1}. {client.nome}</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>Endereço:</strong> {client.endereco}</p>
                <p><strong>CPF:</strong> {client.cpf || 'N/A'}</p>
                <p><strong>Telefone:</strong> {client.telefone || 'N/A'}</p>
                <p><strong>Email:</strong> {client.email || 'N/A'}</p>
              </Col>
              <Col md={6}>
                <p><strong>Empresa:</strong> {client.nomeEmpresa || 'N/A'}</p>
                <p><strong>CNPJ:</strong> {client.cnpj || 'N/A'}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default Clientes;
