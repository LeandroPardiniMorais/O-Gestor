import { Nav } from 'react-bootstrap';
import { Grid, PlusCircle, Users, FileText, Clock, BarChart2, Settings } from 'react-feather';
import { useLocation } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar d-flex flex-column">
      <h1 className="fs-4 fw-bold text-center mb-4">Vortex<span className="text-destaque">Projetos</span></h1>
      <Nav className="flex-column gap-2">
        <LinkContainer to="/">
          <Nav.Link active={location.pathname === '/'}>
            <Grid className="feather" />
            Dashboard
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/novo-orcamento">
          <Nav.Link active={location.pathname === '/novo-orcamento'}>
            <PlusCircle className="feather" />
            Novo Orçamento
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/clientes">
          <Nav.Link active={location.pathname === '/clientes'}>
            <Users className="feather" />
            Clientes
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/orcamentos">
          <Nav.Link active={location.pathname === '/orcamentos'}>
            <FileText className="feather" />
            Orçamentos
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/prazos">
          <Nav.Link active={location.pathname === '/prazos'}>
            <Clock className="feather" />
            Prazos
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/relatorios">
          <Nav.Link active={location.pathname === '/relatorios'}>
            <BarChart2 className="feather" />
            Relatórios
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/configuracoes">
          <Nav.Link active={location.pathname === '/configuracoes'}>
            <Settings className="feather" />
            Configurações
          </Nav.Link>
        </LinkContainer>
      </Nav>
    </div>
  );
};

export default Sidebar;
