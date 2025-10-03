import { useMemo, useState } from 'react';
import { Container, Card, Table, Form, InputGroup, Badge } from 'react-bootstrap';
import { Layers, Search } from 'react-feather';
import type { ProductCatalogItem } from './Cadastros';

interface ProdutosProps {
  products: ProductCatalogItem[];
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const getStockVariant = (estoque: number) => {
  if (estoque <= 0) return 'danger';
  if (estoque < 5) return 'warning';
  if (estoque < 15) return 'info';
  return 'success';
};

const Produtos = ({ products }: ProdutosProps) => {
  const [query, setQuery] = useState('');

  const filteredProducts = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return products;
    const normalizedQuery = normalize(trimmed);
    return products.filter(product =>
      [product.nome, product.categoria]
        .filter(Boolean)
        .some(value => normalize(String(value)).includes(normalizedQuery)),
    );
  }, [products, query]);

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h2 className="mb-0">Produtos</h2>
          <small className="text-secondary">{filteredProducts.length} item(ns)</small>
        </div>
        <InputGroup className="w-auto" style={{ minWidth: 280 }}>
          <InputGroup.Text>
            <Search size={16} />
          </InputGroup.Text>
          <Form.Control
            type="search"
            placeholder="Filtrar por nome ou categoria"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </InputGroup>
      </div>

      <Card className="rounded-4">
        {filteredProducts.length === 0 ? (
          <div className="p-4 text-center text-secondary">
            Nenhum produto cadastrado corresponde ao filtro aplicado.
          </div>
        ) : (
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Estoque</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td className="fw-semibold">
                      <div className="d-flex align-items-center gap-2">
                        <Layers size={16} />
                        <span>{product.nome}</span>
                      </div>
                    </td>
                    <td>{product.categoria}</td>
                    <td>
                      <Badge bg={getStockVariant(product.estoque)}>
                        {product.estoque > 0 ? `${product.estoque} unidade(s)` : 'Repor estoque'}
                      </Badge>
                    </td>
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

export default Produtos;
