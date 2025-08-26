import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/useAuth';
import apiService from '../../services/api';
import type { User, SystemMetrics, SecurityAlert } from '../../services/api';
import './Admin.scss';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUsers(),
        fetchSystemMetrics(),
        fetchSecurityAlerts(),
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      return;
    }
    fetchData();
    const interval = setInterval(fetchSystemMetrics, 30000); // Обновляем каждые 30 секунд
    return () => clearInterval(interval);
  }, [user, fetchData]);

  const fetchUsers = async () => {
    try {
      const users = await apiService.getUsers();
      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const metrics = await apiService.getSystemMetrics();
      setSystemMetrics(metrics);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    }
  };

  const fetchSecurityAlerts = async () => {
    try {
      const alerts = await apiService.getSecurityAlerts();
      setSecurityAlerts(alerts);
    } catch (error) {
      console.error('Error fetching security alerts:', error);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await apiService.updateUserStatus(userId, isActive);
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isActive } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const resetUserPassword = async (userId: string) => {
    try {
      await apiService.resetUserPassword(userId);
      alert('Пользователю отправлено уведомление о необходимости сброса пароля');
    } catch (error) {
      console.error('Error resetting user password:', error);
    }
  };

  const terminateUserSessions = async (userId: string) => {
    try {
      await apiService.terminateUserSessions(userId);
      alert('Все сессии пользователя завершены');
    } catch (error) {
      console.error('Error terminating user sessions:', error);
    }
  };

  const resolveSecurityAlert = async (alertId: string) => {
    try {
      await apiService.resolveSecurityAlert(alertId);
      setSecurityAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ));
    } catch (error) {
      console.error('Error resolving security alert:', error);
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#28a745';
      case 'medium': return '#ffc107';
      case 'high': return '#fd7e14';
      case 'critical': return '#dc3545';
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
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    
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
    <div className="admin">
      <div className="admin__header">
        <h1>Панель администратора</h1>
        <button className="btn btn--primary" onClick={fetchData}>
          Обновить данные
        </button>
      </div>

      <div className="admin__content">
        {/* Системные метрики */}
        <div className="admin-section">
          <h2>Системные ресурсы</h2>
          {systemMetrics && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">🖥️</div>
                <div className="metric-content">
                  <div className="metric-value">{systemMetrics.cpu}%</div>
                  <div className="metric-label">CPU</div>
                  <div 
                    className="metric-status"
                    style={{ color: getResourceStatus(systemMetrics.cpu).color }}
                  >
                    {getResourceStatus(systemMetrics.cpu).status}
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">💾</div>
                <div className="metric-content">
                  <div className="metric-value">{systemMetrics.memory}%</div>
                  <div className="metric-label">Память</div>
                  <div 
                    className="metric-status"
                    style={{ color: getResourceStatus(systemMetrics.memory).color }}
                  >
                    {getResourceStatus(systemMetrics.memory).status}
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">💿</div>
                <div className="metric-content">
                  <div className="metric-value">{systemMetrics.disk}%</div>
                  <div className="metric-label">Диск</div>
                  <div 
                    className="metric-status"
                    style={{ color: getResourceStatus(systemMetrics.disk).color }}
                  >
                    {getResourceStatus(systemMetrics.disk).status}
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                  <div className="metric-value">{systemMetrics.load.toFixed(2)}</div>
                  <div className="metric-label">Нагрузка</div>
                  <div 
                    className="metric-status"
                    style={{ color: getResourceStatus(systemMetrics.load * 20).color }}
                  >
                    {getResourceStatus(systemMetrics.load * 20).status}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Система безопасности */}
        <div className="admin-section">
          <h2>Система безопасности</h2>
          <div className="security-alerts">
            {securityAlerts.length === 0 ? (
              <div className="no-alerts">Активных предупреждений нет</div>
            ) : (
              securityAlerts.map(alert => (
                <div key={alert.id} className={`security-alert ${alert.severity}`}>
                  <div className="alert-header">
                    <div className="alert-type">
                      {alert.type === 'failed_login' ? '🔐' :
                       alert.type === 'system_error' ? '⚠️' :
                       alert.type === 'resource_high' ? '📈' : '🚨'}
                      {alert.type === 'failed_login' ? 'Неудачные попытки входа' :
                       alert.type === 'system_error' ? 'Ошибка системы' :
                       alert.type === 'resource_high' ? 'Высокая нагрузка' : 'Критическая ошибка'}
                    </div>
                    <div 
                      className="alert-severity"
                      style={{ backgroundColor: getSeverityColor(alert.severity) }}
                    >
                      {alert.severity.toUpperCase()}
                    </div>
                  </div>
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-footer">
                    <span className="alert-time">
                      {new Date(alert.timestamp).toLocaleString('ru-RU')}
                    </span>
                    {!alert.resolved && (
                      <button 
                        className="btn btn--small"
                        onClick={() => resolveSecurityAlert(alert.id)}
                      >
                        Решено
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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
                        style={{ backgroundColor: getStatusColor(user.isActive ? 'active' : 'inactive') }}
                      >
                        {user.isActive ? 'Активен' : 'Неактивен'}
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
                          onClick={() => toggleUserStatus(user.id, !user.isActive)}
                        >
                          {user.isActive ? 'Деактивировать' : 'Активировать'}
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
                {users.filter(u => u.isActive).length}
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
              <div className="stat-value">
                {securityAlerts.filter(a => !a.resolved).length}
              </div>
              <div className="stat-label">Активных предупреждений</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin; 