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
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedPeriod]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const stats = await apiService.getDashboardStats(selectedPeriod);
      setStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionRate = () => {
    if (!stats) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  };

  const getAverageGoalProgress = () => {
    if (!stats) return 0;
    const total = stats.goalProgress.reduce((sum, goal) => sum + goal.progress, 0);
    return Math.round(total / stats.goalProgress.length);
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
        <div className="period-selector">
          <button 
            className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('week')}
          >
            Неделя
          </button>
          <button 
            className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('month')}
          >
            Месяц
          </button>
          <button 
            className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('year')}
          >
            Год
          </button>
        </div>
      </div>

      <div className="dashboard__grid">
        {/* Основные метрики */}
        <div className="metrics-row">
          <div className="metric-card">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <div className="metric-value">{stats.totalEvents}</div>
              <div className="metric-label">Всего событий</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🎯</div>
            <div className="metric-content">
              <div className="metric-value">{stats.totalGoals}</div>
              <div className="metric-label">Активных целей</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <div className="metric-value">{getCompletionRate()}%</div>
              <div className="metric-label">Выполнение задач</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⏰</div>
            <div className="metric-content">
              <div className="metric-value">{stats.upcomingDeadlines}</div>
              <div className="metric-label">Срочные задачи</div>
            </div>
          </div>
        </div>

        {/* Графики */}
        <div className="charts-row">
          <div className="chart-card">
            <h3>Распределение настроений</h3>
            <div className="chart-container">
              <div className="mood-chart">
                {Object.entries(stats.moodDistribution).map(([mood, count]) => (
                  <div key={mood} className="mood-item">
                    <div className="mood-emoji">{mood}</div>
                    <div className="mood-bar">
                      <div 
                        className="mood-fill" 
                        style={{ 
                          width: `${(count / Math.max(...Object.values(stats.moodDistribution))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="mood-count">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3>Прогресс целей</h3>
            <div className="chart-container">
              <div className="goals-progress">
                {stats.goalProgress.map((goal, index) => (
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
          </div>
        </div>

        {/* Дополнительная статистика */}
        <div className="stats-row">
          <div className="stats-card">
            <h3>Общая статистика</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Средний прогресс целей</div>
                <div className="stat-value">{getAverageGoalProgress()}%</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Завершенных задач</div>
                <div className="stat-value">{stats.completedTasks}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Активных задач</div>
                <div className="stat-value">{stats.totalTasks - stats.completedTasks}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Период</div>
                <div className="stat-value">
                  {selectedPeriod === 'week' ? 'Неделя' : 
                   selectedPeriod === 'month' ? 'Месяц' : 'Год'}
                </div>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <h3>Последняя активность</h3>
            <div className="activity-list">
              {stats.recentActivity.map((activity, index) => (
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

        {/* Быстрые действия */}
        <div className="actions-row">
          <div className="actions-card">
            <h3>Быстрые действия</h3>
            <div className="actions-grid">
              <button className="action-btn">
                <span className="action-icon">📝</span>
                <span className="action-text">Новое событие</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">🎯</span>
                <span className="action-text">Новая цель</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">✅</span>
                <span className="action-text">Новая задача</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">📊</span>
                <span className="action-text">Подробная статистика</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 