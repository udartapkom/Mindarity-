import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './SecurityAlerts.scss';

interface SecurityAlert {
  type: 'failed_login' | 'system_load';
  severity: 'high' | 'medium' | 'low';
  message: string;
  details: any;
  timestamp: string;
}

interface SecurityAlertsData {
  timestamp: string;
  alerts: {
    failedLogins: SecurityAlert[];
    systemLoad: SecurityAlert[];
  };
  totalAlerts: number;
}

const SecurityAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSecurityAlerts();
      setAlerts(data as SecurityAlertsData);
      setError(null);
    } catch (err) {
      setError('Failed to load security alerts');
      console.error('Error fetching security alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Обновляем каждые 30 секунд
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#dc3545';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'failed_login':
        return '🔒';
      case 'system_load':
        return '⚡';
      default:
        return '⚠️';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };

  const handleDeleteFailedLogin = async (username: string, ipAddress: string) => {
    const key = `${username}-${ipAddress}`;
    try {
      setDeleting(key);
      await apiService.deleteFailedLoginAttempts(username, ipAddress);
      // Обновляем список алертов после удаления
      await fetchAlerts();
    } catch (err) {
      console.error('Error deleting failed login attempts:', err);
      setError('Ошибка при удалении алерта');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAllFailedLogins = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить все алерты неудачных попыток входа?')) {
      return;
    }
    
    try {
      setDeleting('all');
      await apiService.deleteAllFailedLoginAttempts();
      // Обновляем список алертов после удаления
      await fetchAlerts();
    } catch (err) {
      console.error('Error deleting all failed login attempts:', err);
      setError('Ошибка при удалении всех алертов');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="security-alerts">
        <div className="security-alerts__header">
          <h2>Система безопасности</h2>
          <button onClick={fetchAlerts} disabled>
            Обновить
          </button>
        </div>
        <div className="security-alerts__loading">
          Загрузка алертов...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="security-alerts">
        <div className="security-alerts__header">
          <h2>Система безопасности</h2>
          <button onClick={fetchAlerts}>
            Обновить
          </button>
        </div>
        <div className="security-alerts__error">
          {error}
        </div>
      </div>
    );
  }

  const allAlerts = [
    ...(alerts?.alerts.failedLogins || []),
    ...(alerts?.alerts.systemLoad || [])
  ];

  return (
    <div className="security-alerts">
      <div className="security-alerts__header">
        <h2>Система безопасности</h2>
        <div className="security-alerts__stats">
          <span className="security-alerts__total">
            Всего алертов: {alerts?.totalAlerts || 0}
          </span>
          <button onClick={fetchAlerts}>
            Обновить
          </button>
          {alerts?.alerts.failedLogins && alerts.alerts.failedLogins.length > 0 && (
            <button 
              onClick={handleDeleteAllFailedLogins}
              disabled={deleting === 'all'}
              className="security-alerts__delete-all-btn"
            >
              {deleting === 'all' ? 'Удаление...' : 'Удалить все неудачные логины'}
            </button>
          )}
        </div>
      </div>

      {alerts?.totalAlerts === 0 ? (
        <div className="security-alerts__empty">
          <p>Алертов безопасности не обнаружено</p>
          <small>Система работает нормально</small>
        </div>
      ) : (
        <div className="security-alerts__list">
          {allAlerts.map((alert, index) => (
            <div
              key={index}
              className="security-alerts__alert"
              style={{ borderLeftColor: getSeverityColor(alert.severity) }}
            >
              <div className="security-alerts__alert-header">
                <span className="security-alerts__alert-icon">
                  {getAlertIcon(alert.type)}
                </span>
                <span className="security-alerts__alert-severity">
                  {alert.severity === 'high' ? 'Высокая' : 
                   alert.severity === 'medium' ? 'Средняя' : 'Низкая'}
                </span>
                <span className="security-alerts__alert-time">
                  {formatTimestamp(alert.timestamp)}
                </span>
              </div>
              <div className="security-alerts__alert-message">
                {alert.message}
              </div>
              {alert.details && (
                <div className="security-alerts__alert-details">
                  {alert.type === 'failed_login' && (
                    <div>
                      <strong>Пользователь:</strong> {alert.details.username}<br />
                      <strong>IP адрес:</strong> {alert.details.ipAddress}<br />
                      <strong>Попыток:</strong> {alert.details.attempts}
                    </div>
                  )}
                  {alert.type === 'system_load' && (
                    <div>
                      <strong>Компонент:</strong> {alert.details.component}<br />
                      <strong>Использование:</strong> {alert.details.usagePercent}%<br />
                      <strong>Порог:</strong> {alert.details.threshold}%
                    </div>
                  )}
                </div>
              )}
              {alert.type === 'failed_login' && (
                <div className="security-alerts__alert-actions">
                  <button
                    onClick={() => handleDeleteFailedLogin(alert.details.username, alert.details.ipAddress)}
                    disabled={deleting === `${alert.details.username}-${alert.details.ipAddress}`}
                    className="security-alerts__delete-btn"
                  >
                    {deleting === `${alert.details.username}-${alert.details.ipAddress}` ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SecurityAlerts;
