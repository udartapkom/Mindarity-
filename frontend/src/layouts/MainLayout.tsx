import React, { useState } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import Dashboard from '../pages/Dashboard/Dashboard';
import Events from '../pages/Events/Events';
import Tasks from '../pages/Tasks/Tasks';
import Files from '../pages/Files/Files';
import Profile from '../pages/Profile/Profile';
import Admin from '../pages/Admin/Admin';
import './MainLayout.scss';

const MainLayout: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'events':
        return <Events />;
      case 'tasks':
        return <Tasks />;
      case 'files':
        return <Files />;
      case 'profile':
        return <Profile />;
      case 'admin':
        return <Admin />;
      default:
        return <Dashboard />;
    }
  };

  const handlePageChange = (page: string) => {
    setActivePage(page);
    // Закрываем мобильное меню при переходе на страницу
    setIsSidebarOpen(false);
  };

  return (
    <div className="main-layout">
      <Sidebar 
        activePage={activePage} 
        onPageChange={handlePageChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="main-content">
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="page-content">
          {renderPage()}
        </main>
      </div>
      {/* Overlay для мобильного меню */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
};

export default MainLayout; 