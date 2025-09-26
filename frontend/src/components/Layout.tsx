import React from 'react';
import Sidebar from './Sidebar';

// A 'prop' children é usada para renderizar qualquer conteúdo que for passado dentro do Layout
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
