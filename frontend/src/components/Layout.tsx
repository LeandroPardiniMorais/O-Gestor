import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev)
  }

  return (
    <div className={`app-frame${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <div className={`app-body${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
