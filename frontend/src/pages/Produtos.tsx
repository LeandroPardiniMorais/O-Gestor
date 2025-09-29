import { Container, Card, Table } from 'react-bootstrap';
import type { ProductCatalogItem } from './Cadastros';

interface ProdutosProps {
  products: ProductCatalogItem[];
}

const Produtos = ({ products }: ProdutosProps) => {
  return (
    <Container fluid>
      <h2 className="mb-4">Produtos</h2>
      <Card className="rounded-4">
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Estoque</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.nome}</td>
                  <td>{product.categoria}</td>
                  <td>{product.estoque}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Produtos;

