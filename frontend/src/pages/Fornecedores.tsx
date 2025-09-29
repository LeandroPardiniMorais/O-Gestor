import { Container, Card, Table } from 'react-bootstrap';
import type { SupplierRecord } from './Cadastros';

interface FornecedoresProps {
  suppliers: SupplierRecord[];
}

const Fornecedores = ({ suppliers }: FornecedoresProps) => {
  return (
    <Container fluid>
      <h2 className="mb-4">Fornecedores</h2>
      <Card className="rounded-4">
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th>Contato</th>
                <th>Telefone</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>{supplier.nome}</td>
                  <td>{supplier.contato}</td>
                  <td>{supplier.telefone}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Fornecedores;

