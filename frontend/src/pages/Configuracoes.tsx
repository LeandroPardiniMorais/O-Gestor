import { useState } from 'react';
import { Container, Table, Button, Modal, Form, Card } from 'react-bootstrap';
import type { Material } from '../App';

interface ConfiguracoesProps {
  materials: Material[];
  onUpdateMaterials: (updatedMaterials: Material[]) => void;
}

const Configuracoes = ({ materials, onUpdateMaterials }: ConfiguracoesProps) => {
  const [showModal, setShowModal] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialCost, setNewMaterialCost] = useState(0);

  const handleSaveMaterial = () => {
    if (newMaterialName && newMaterialCost > 0) {
      const newMaterial: Material = {
        id: Date.now().toString(),
        name: newMaterialName,
        cost: newMaterialCost,
      };
      onUpdateMaterials([...materials, newMaterial]);
      setNewMaterialName('');
      setNewMaterialCost(0);
      setShowModal(false);
    }
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Configurações</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>Adicionar Material</Button>
      </div>

      <Card>
        <Card.Header>
          <h4>Tabela de Custos de Materiais</h4>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Material</th>
                <th>Custo por grama (R$)</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material.id}>
                  <td>{material.name}</td>
                  <td>{`R$ ${material.cost.toFixed(2)}`}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Adicionar Novo Material</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nome do Material</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o nome do material"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Custo por grama (R$)</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                placeholder="Digite o custo"
                value={newMaterialCost}
                onChange={(e) => setNewMaterialCost(Number(e.target.value))}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveMaterial}>
            Salvar Material
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Configuracoes;


