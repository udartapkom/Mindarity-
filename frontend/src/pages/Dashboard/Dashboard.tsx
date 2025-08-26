import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './Dashboard.scss';

interface DashboardStats {
  totalEvents: number;
  totalGoals: number;
  totalTasks: number;
  completedTasks: number;
  upcomingDeadlines: number;
  moodDistribution: Record<string, number>;
  goalProgress: Array<{ name: string; progress: number }>;
  recentActivity: Array<{ type: string; title: string; date: string }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const stats = await apiService.getDashboardStats('week');
      setStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionRate = () => {
    if (!stats) return 0;
    if (stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  };

  const getTopEmotions = () => {
    if (!stats) return [];
    return Object.entries(stats.moodDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">Загрузка статистики...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard">
        <div className="dashboard__error">Ошибка загрузки данных</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>Дашборд</h1>
      </div>

      <div className="dashboard__content">
        {/* Основные метрики */}
        <div className="metrics-section">
          <h3>Основная статистика</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-value">{stats.totalEvents}</div>
              <div className="metric-label">Записей</div>
            </div>

            <div className="metric-item">
              <div className="metric-value">{stats.totalGoals}</div>
              <div className="metric-label">Целей</div>
            </div>

            <div className="metric-item">
              <div className="metric-value">{getCompletionRate()}%</div>
              <div className="metric-label">Выполнение задач</div>
            </div>

            <div className="metric-item">
              <div className="metric-value">{stats.upcomingDeadlines}</div>
              <div className="metric-label">Срочные задачи</div>
            </div>
          </div>
        </div>

        {/* Эмоциональные реакции */}
        <div className="emotions-section">
          <h3>Часто используемые эмоции</h3>
          <div className="emotions-chart">
            {getTopEmotions().map(([emotion, count]) => (
              <div key={emotion} className="emotion-item">
                <div className="emotion-emoji">{emotion}</div>
                <div className="emotion-bar">
                  <div 
                    className="emotion-fill" 
                    style={{ 
                      width: `${Object.values(stats.moodDistribution).length > 0 
                        ? (count / Math.max(...Object.values(stats.moodDistribution))) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="emotion-count">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Прогресс целей */}
        <div className="goals-section">
          <h3>Прогресс целей</h3>
          <div className="goals-progress">
            {stats.goalProgress.slice(0, 5).map((goal, index) => (
              <div key={index} className="goal-progress-item">
                <div className="goal-name">{goal.name}</div>
                <div className="goal-progress-bar">
                  <div 
                    className="goal-progress-fill" 
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                <div className="goal-progress-value">{goal.progress}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Последняя активность */}
        <div className="activity-section">
          <h3>Последняя активность</h3>
          <div className="activity-list">
            {stats.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'event' ? '📝' : 
                   activity.type === 'task' ? '✅' : '🎯'}
                </div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-time">{activity.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 