import React from 'react';
import { useAuth } from '../../contexts/useAuth';
import { normalizeAvatarUrl } from '../../services/api';
import './Sidebar.scss';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange, isOpen = false }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="user-info">
          <div className="avatar">
            {user?.avatar ? (
              <img src={normalizeAvatarUrl(user.avatar)} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder">
                {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="user-details">
            <h3>{user?.firstName || user?.username}</h3>
            <p>{user?.email}</p>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li>
            <button
              className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
              onClick={() => onPageChange('dashboard')}
            >
              <span className="nav-icon">📊</span>
              Дашборд
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${activePage === 'events' ? 'active' : ''}`}
              onClick={() => onPageChange('events')}
            >
              <span className="nav-icon">📝</span>
              События
            </button>
          </li>
                    <li>
            <button
              className={`nav-item ${activePage === 'tasks' ? 'active' : ''}`}
              onClick={() => onPageChange('tasks')}
            >
              <span className="nav-icon">🎯</span>
              Цели и задачи
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${activePage === 'files' ? 'active' : ''}`}
              onClick={() => onPageChange('files')}
            >
              <span className="nav-icon">📁</span>
              Файлы
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${activePage === 'profile' ? 'active' : ''}`}
              onClick={() => onPageChange('profile')}
            >
              <span className="nav-icon">👤</span>
              Профиль
            </button>
          </li>
          {user?.role === 'admin' && (
            <li>
              <button
                className={`nav-item ${activePage === 'admin' ? 'active' : ''}`}
                onClick={() => onPageChange('admin')}
              >
                <span className="nav-icon">⚙️</span>
                Администрирование
              </button>
            </li>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          Выйти
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 