import { useMemo, useState, type ComponentType } from 'react'
import { Nav, Collapse } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import { Link, useLocation } from 'react-router-dom'
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
  ChevronLeft,
} from 'react-feather'

interface MenuItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string; size?: string | number }>
}

interface MenuSection {
  id: string
  title: string
  items: MenuItem[]
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation()

  const sections: MenuSection[] = useMemo(() => (
    [
      {
        id: 'operacao',
        title: 'Operacao',
        items: [
          { to: '/orcamento/novo', label: 'Novo Orcamento', icon: FileText },
          { to: '/orcamentos', label: 'Orcamentos', icon: FileText },
          { to: '/producao', label: 'Producao', icon: Activity },
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
        title: 'Analises',
        items: [
          { to: '/relatorios', label: 'Relatorios', icon: BarChart2 },
        ],
      },
      {
        id: 'sistema',
        title: 'Sistema',
        items: [
          { to: '/configuracoes', label: 'Configuracoes', icon: Settings },
        ],
      },
    ]
  ), [])

  const [openSections, setOpenSections] = useState(() => {
    return sections.reduce<Record<string, boolean>>((acc, section) => {
      acc[section.id] = true
      return acc
    }, {})
  })

  const isActive = (path: string) => location.pathname === path

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div className={`sidebar d-flex flex-column${collapsed ? ' collapsed' : ''}`}>
      <div className='sidebar-toolbar'>
        <Link to='/' className='sidebar-header text-decoration-none'>
          <h1 className='fs-4 fw-bold mb-0 text-reset sidebar-brand-full'>Vortex<span className='text-destaque'>Projetos</span></h1>
          <span className='sidebar-brand-compact'>VP</span>
          <small className='text-secondary d-block'>Gestao integrada</small>
        </Link>
        <button
          type='button'
          className='sidebar-collapse-toggle'
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <Nav className='flex-column gap-3 sidebar-sections'>
        {sections.map(section => {
          const isSectionOpen = collapsed ? true : openSections[section.id]
          const IconToggle = isSectionOpen ? ChevronDown : ChevronRight

          return (
            <div className='sidebar-section' key={section.id}>
              <button
                type='button'
                className='sidebar-section-toggle'
                onClick={() => !collapsed && toggleSection(section.id)}
                aria-expanded={isSectionOpen}
                disabled={collapsed}
              >
                <IconToggle size={16} className='me-2' />
                <span className='sidebar-section-title'>{section.title}</span>
              </button>

              <Collapse in={isSectionOpen}>
                <div>
                  <Nav className='flex-column gap-1 sidebar-section-items'>
                    {section.items.map(item => (
                      <LinkContainer to={item.to} key={item.to}>
                        <Nav.Link active={isActive(item.to)} title={collapsed ? item.label : undefined}>
                          <item.icon className='feather' />
                          <span className='nav-label'>{item.label}</span>
                        </Nav.Link>
                      </LinkContainer>
                    ))}
                  </Nav>
                </div>
              </Collapse>
            </div>
          )
        })}
      </Nav>
    </div>
  )
}

export default Sidebar
