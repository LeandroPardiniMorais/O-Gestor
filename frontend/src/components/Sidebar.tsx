import { useMemo, useState, type ComponentType } from 'react';
import { Nav, Collapse } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useLocation } from 'react-router-dom';
import {
  FileText,
  Activity,
  Users,
  Truck,
  Package,
  Clock,
  BarChart2,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'react-feather';

interface MenuItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; size?: string | number }>;
}

interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
}

const Sidebar = () => {
  const location = useLocation();

  const sections: MenuSection[] = useMemo(() => (
    [
      {
        id: 'operacao',
        title: 'Operação',
        items: [
          { to: '/orcamento/novo', label: 'Novo Orçamento', icon: FileText },
          { to: '/orcamentos', label: 'Orçamentos', icon: FileText },
          { to: '/producao', label: 'Produção', icon: Activity },
          { to: '/prazos', label: 'Prazos', icon: Clock },
        ],
      },
      {
        id: 'cadastros',
        title: 'Cadastros',
        items: [
          { to: '/cadastros/clientes', label: 'Clientes', icon: Users },
          { to: '/cadastros/fornecedores', label: 'Fornecedores', icon: Truck },
          { to: '/cadastros/produtos', label: 'Produtos', icon: Package },
        ],
      },
      {
        id: 'analise',
        title: 'Análises',
        items: [
          { to: '/relatorios', label: 'Relatórios', icon: BarChart2 },
        ],
      },
      {
        id: 'sistema',
        title: 'Sistema',
        items: [
          { to: '/configuracoes', label: 'Configurações', icon: Settings },
        ],
      },
    ]
  ), []);

  const [openSections, setOpenSections] = useState(() => {
    return sections.reduce<Record<string, boolean>>((acc, section) => {
      acc[section.id] = true;
      return acc;
    }, {});
  });

  const isActive = (path: string) => location.pathname === path;

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="sidebar d-flex flex-column">
      <div className="sidebar-header text-center mb-4">
        <h1 className="fs-4 fw-bold mb-0">Vortex<span className="text-destaque">Projetos</span></h1>
        <small className="text-secondary">Gestão integrada</small>
      </div>

      <Nav className="flex-column gap-3 sidebar-sections">
        {sections.map(section => {
          const IconToggle = openSections[section.id] ? ChevronDown : ChevronRight;

          return (
            <div className="sidebar-section" key={section.id}>
              <button
                type="button"
                className="sidebar-section-toggle"
                onClick={() => toggleSection(section.id)}
              >
                <IconToggle size={16} className="me-2" />
                <span>{section.title}</span>
              </button>

              <Collapse in={openSections[section.id]}>
                <div>
                  <Nav className="flex-column gap-1 sidebar-section-items">
                    {section.items.map(item => (
                      <LinkContainer to={item.to} key={item.to}>
                        <Nav.Link active={isActive(item.to)}>
                          <item.icon className="feather" />
                          {item.label}
                        </Nav.Link>
                      </LinkContainer>
                    ))}
                  </Nav>
                </div>
              </Collapse>
            </div>
          );
        })}
      </Nav>
    </div>
  );
};

export default Sidebar;




