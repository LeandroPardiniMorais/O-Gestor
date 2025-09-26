import { Row, Col, Card, ListGroup, Button, Container } from 'react-bootstrap';
import { DollarSign, FileText, CheckCircle, UserPlus, PlusCircle } from 'react-feather';

const Dashboard = () => {
  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Painel de Controle</h2>
        <div className="d-flex gap-2">
          <Button variant="secondary">
            <UserPlus className="me-1" size={16} />
            Cadastrar Cliente
          </Button>
          <Button variant="danger">
            <PlusCircle className="me-1" size={16} />
            Cadastrar Orçamento
          </Button>
        </div>
      </div>

      {/* Informativos Rápidos */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="p-3 rounded-4 h-100">
            <div className="d-flex align-items-center">
              <div className="p-3 bg-light rounded-3 me-3">
                <DollarSign className="text-success" />
              </div>
              <div>
                <h6 className="text-secondary mb-1">Faturamento Mensal</h6>
                <h4 className="mb-0">R$ 1.234,56</h4>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="p-3 rounded-4 h-100">
            <div className="d-flex align-items-center">
              <div className="p-3 bg-light rounded-3 me-3">
                <FileText className="text-warning" />
              </div>
              <div>
                <h6 className="text-secondary mb-1">Orçamentos Pendentes</h6>
                <h4 className="mb-0">8</h4>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="p-3 rounded-4 h-100">
            <div className="d-flex align-items-center">
              <div className="p-3 bg-light rounded-3 me-3">
                <CheckCircle className="text-info" />
              </div>
              <div>
                <h6 className="text-secondary mb-1">Projetos Concluídos</h6>
                <h4 className="mb-0">12</h4>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Prazos Expirando */}
      <Card className="p-4 rounded-4">
        <h4 className="mb-3">Prazos Expirando</h4>
        <ListGroup variant="flush">
          <ListGroup.Item as="a" href="#" className="d-flex justify-content-between align-items-center px-0">
            <div>
              <strong>Projeto "Suporte Monitor"</strong> - Cliente: João Silva
            </div>
            <span className="badge bg-danger rounded-pill">Expira Hoje</span>
          </ListGroup.Item>
          <ListGroup.Item as="a" href="#" className="d-flex justify-content-between align-items-center px-0">
            <div>
              <strong>Projeto "Case Raspberry Pi"</strong> - Cliente: Maria Oliveira
            </div>
            <span className="badge bg-warning text-dark rounded-pill">Expira em 2 dias</span>
          </ListGroup.Item>
          <ListGroup.Item as="a" href="#" className="d-flex justify-content-between align-items-center px-0">
            <div>
              <strong>Projeto "Engrenagem Custom"</strong> - Cliente: Pedro Costa
            </div>
            <span className="badge bg-danger-subtle text-danger-emphasis rounded-pill">Expira em 5 dias</span>
          </ListGroup.Item>
        </ListGroup>
      </Card>
    </Container>
  );
};

export default Dashboard;
