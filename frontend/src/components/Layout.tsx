import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="app-frame">
      <div className="app-body">
        <Sidebar />
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

