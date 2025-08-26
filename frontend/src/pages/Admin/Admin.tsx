import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/useAuth';
import type { User, SystemMetrics } from '../../services/api';
import apiService from '../../services/api';
import SecurityAlerts from '../../components/SecurityAlerts/SecurityAlerts';
import './Admin.scss';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await fetchUsers();
      await fetchSystemMetrics();
    } catch (error: unknown) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchUsers = async () => {
    try {
      const users = await apiService.getUsers();
      setUsers(users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const metrics = await apiService.getSystemMetrics();
      setSystemMetrics(metrics);
    } catch (error: any) {
      console.error('Error fetching system metrics:', error);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await apiService.updateUserStatus(userId, isActive);
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: isActive ? 'active' : 'inactive' } : user
      ));
    } catch (error: any) {
      console.error('Error updating user status:', error);
    }
  };

  const resetUserPassword = async (userId: string) => {
    try {
      await apiService.resetUserPassword(userId);
      alert('Пользователю отправлено уведомление о необходимости сброса пароля');
    } catch (error: any) {
      console.error('Error resetting user password:', error);
    }
  };

  const terminateUserSessions = async (userId: string) => {
    try {
      await apiService.terminateUserSessions(userId);
      alert('Все сессии пользователя завершены');
      // Обновляем список пользователей для отображения актуального состояния
      await fetchUsers();
    } catch (error: any) {
      console.error('Error terminating user sessions:', error);
      alert('Ошибка при завершении сессий пользователя');
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'inactive': return '#dc3545';
      case 'locked': return '#ffc107';
      case 'pending': return '#17a2b8';
      default: return '#6c757d';
    }
  };



  const getResourceStatus = (value: number) => {
    if (value < 50) return { status: 'normal', color: '#28a745' };
    if (value < 75) return { status: 'warning', color: '#ffc107' };
    if (value < 85) return { status: 'high', color: '#fd7e14' };
    return { status: 'critical', color: '#dc3545' };
  };

  const filteredUsers = users.filter(user => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const matchesSearch = firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.status === 'active') ||
                         (filterStatus === 'inactive' && user.status !== 'active');
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (user?.role !== 'admin') {
    return (
      <div className="admin">
        <div className="admin__access-denied">
          <h2>Доступ запрещен</h2>
          <p>У вас нет прав для доступа к панели администратора.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin">
        <div className="admin__loading">Загрузка панели администратора...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1>Администрирование</h1>
      <div className="admin__content">
        {/* Системные метрики */}
        <div className="admin-section">
          <h2>Системные ресурсы</h2>
          {systemMetrics && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">💻</div>
                <div className="metric-content">
                  <div className="metric-value">{systemMetrics.resources?.cpu?.usagePercent?.toFixed(1) || '0.0'}%</div>
                  <div className="metric-label">CPU</div>
                  <div 
                    className="metric-status"
                    style={{ color: getResourceStatus(systemMetrics.resources?.cpu?.usagePercent || 0).color }}
                  >
                    {getResourceStatus(systemMetrics.resources?.cpu?.usagePercent || 0).status}
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">🧠</div>
                <div className="metric-content">
                  <div className="metric-value">{systemMetrics.resources?.memory?.usagePercent?.toFixed(1) || '0.0'}%</div>
                  <div className="metric-label">Память</div>
                  <div 
                    className="metric-status"
                    style={{ color: getResourceStatus(systemMetrics.resources?.memory?.usagePercent || 0).color }}
                  >
                    {getResourceStatus(systemMetrics.resources?.memory?.usagePercent || 0).status}
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">💾</div>
                <div className="metric-content">
                  <div className="metric-value">{systemMetrics.resources?.disk?.usagePercent?.toFixed(1) || '0.0'}%</div>
                  <div className="metric-label">Диск</div>
                  <div 
                    className="metric-status"
                    style={{ color: getResourceStatus(systemMetrics.resources?.disk?.usagePercent || 0).color }}
                  >
                    {getResourceStatus(systemMetrics.resources?.disk?.usagePercent || 0).status}
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                  <div className="metric-value">{systemMetrics.resources?.cpu?.loadAverage?.[0]?.toFixed(2) || '0.00'}</div>
                  <div className="metric-label">Нагрузка</div>
                  <div 
                    className="metric-status"
                    style={{ color: getResourceStatus(Math.min((systemMetrics.resources?.cpu?.loadAverage?.[0] || 0) * 25, 100)).color }}
                  >
                    {getResourceStatus(Math.min((systemMetrics.resources?.cpu?.loadAverage?.[0] || 0) * 25, 100)).status}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Система безопасности */}
        <SecurityAlerts />

        {/* Управление пользователями */}
        <div className="admin-section">
          <div className="section-header">
            <h2>Управление пользователями</h2>
            <div className="filters">
              <input
                type="text"
                placeholder="Поиск пользователей..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                className="filter-select"
              >
                <option value="all">Все роли</option>
                <option value="user">Пользователь</option>
                <option value="admin">Администратор</option>
              </select>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="inactive">Неактивные</option>
              </select>
            </div>
          </div>

          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Последний вход</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-name">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="user-id">ID: {user.id}</div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(user.status) }}
                      >
                        {user.status === 'active' ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td>
                      {user.lastLoginAt ? 
                        new Date(user.lastLoginAt).toLocaleDateString('ru-RU') : 
                        'Никогда'
                      }
                    </td>
                    <td>
                      <div className="user-actions">
                        <button 
                          className="btn btn--small"
                          onClick={() => toggleUserStatus(user.id, user.status !== 'active')}
                        >
                          {user.status === 'active' ? 'Деактивировать' : 'Активировать'}
                        </button>
                        <button 
                          className="btn btn--small btn--secondary"
                          onClick={() => resetUserPassword(user.id)}
                        >
                          Сброс пароля
                        </button>
                        <button 
                          className="btn btn--small btn--danger"
                          onClick={() => terminateUserSessions(user.id)}
                        >
                          Завершить сессии
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Статистика системы */}
        <div className="admin-section">
          <h2>Статистика системы</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Всего пользователей</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {users.filter(u => u.status === 'active').length}
              </div>
              <div className="stat-label">Активных пользователей</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="stat-label">Администраторов</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">-</div>
              <div className="stat-label">Активных предупреждений</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin; 