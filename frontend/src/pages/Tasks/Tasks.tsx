import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import type { Goal, Task } from '../../services/api';
import './Tasks.scss';

interface CreateGoalForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
}

interface CreateTaskForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  goalId: string;
}

const Tasks: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  const [goalForm, setGoalForm] = useState<CreateGoalForm>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
  });

  const [taskForm, setTaskForm] = useState<CreateTaskForm>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    goalId: '',
  });

  const priorities = [
    { value: 'low', label: 'Низкий', color: '#28a745' },
    { value: 'medium', label: 'Средний', color: '#ffc107' },
    { value: 'high', label: 'Высокий', color: '#dc3545' },
  ];

  useEffect(() => {
    console.log('Tasks component mounted');
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      console.log('Fetching goals...');
      setError(null);
      const response = await apiService.getGoals();
      console.log('Goals fetched:', response);
      setGoals(response);
      await fetchTasks(response);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError('Ошибка загрузки целей');
      setLoading(false);
    }
  };

  const fetchTasks = async (goalsList: Goal[] = goals) => {
    try {
      console.log('Fetching tasks for goals:', goalsList);
      const allTasks: Task[] = [];
      for (const goal of goalsList) {
        try {
          const goalTasks = await apiService.getTasks(goal.id);
          allTasks.push(...goalTasks);
        } catch (error) {
          console.error(`Error fetching tasks for goal ${goal.id}:`, error);
        }
      }
      console.log('Tasks fetched:', allTasks);
      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Ошибка загрузки задач');
    } finally {
      setLoading(false);
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Map UI field dueDate -> backend DTO field deadline; drop unknown keys
      const { dueDate, ...restGoal } = goalForm as { [k: string]: any };
      const goalData = {
        ...restGoal,
        ...(dueDate ? { deadline: dueDate } : {}),
      };

      await apiService.createGoal(goalData);
      
      setGoalForm({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
      });
      setShowGoalForm(false);
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      setError('Ошибка создания цели');
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // goalId must come from URL param, not body; drop it from payload
      const { goalId, ...taskPayload } = taskForm as { [k: string]: any };
      await apiService.createTask(goalId, taskPayload);
      
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        goalId: '',
      });
      setShowTaskForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Ошибка создания задачи');
    }
  };

  const handleInputChange = (form: 'goal' | 'task', field: string, value: string) => {
    if (form === 'goal') {
      setGoalForm(prev => ({ ...prev, [field]: value }));
    } else {
      setTaskForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      await apiService.updateTask(taskId, { status });
      if (status === 'done') {
        await apiService.updateTask(taskId, { 
          completedDate: new Date().toISOString() 
        });
      }
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Ошибка обновления задачи');
    }
  };

  const toggleGoalExpansion = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    return priorities.find(p => p.value === priority)?.color || '#6c757d';
  };

  const getTasksForGoal = (goalId: string) => {
    return tasks.filter(task => task.goalId === goalId);
  };

  console.log('Tasks component rendering, loading:', loading, 'error:', error, 'goals count:', goals.length, 'tasks count:', tasks.length);

  if (loading) {
    return (
      <div className="tasks">
        <div className="tasks__loading">Загрузка целей и задач...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tasks">
        <div className="tasks__error">
          <p>{error}</p>
          <button onClick={fetchGoals} className="btn btn--primary">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks">
      <div className="tasks__header">
        <h1>Цели и задачи</h1>
        <div className="tasks__actions">
          <button 
            className="btn btn--secondary"
            onClick={() => setShowTaskForm(true)}
          >
            Добавить задачу
          </button>
          <button 
            className="btn btn--primary"
            onClick={() => setShowGoalForm(true)}
          >
            Добавить цель
          </button>
        </div>
      </div>

      <div className="tasks__content">
        <div className="goals-list">
          {goals.length === 0 ? (
            <div className="no-goals">
              <p>Целей пока нет. Создайте первую цель!</p>
              <button 
                className="btn btn--primary"
                onClick={() => setShowGoalForm(true)}
              >
                Создать цель
              </button>
            </div>
          ) : (
            goals.map((goal) => (
              <div key={goal.id} className="goal-item">
                <div className="goal-header" onClick={() => toggleGoalExpansion(goal.id)}>
                  <div className="goal-info">
                    <div className="goal-title">{goal.title}</div>
                    <div className="goal-priority" style={{ backgroundColor: getPriorityColor(goal.priority) }}>
                      {priorities.find(p => p.value === goal.priority)?.label}
                    </div>
                  </div>
                  <div className="goal-status">
                    {goal.status === 'in_progress' ? '🔄' : 
                     goal.status === 'completed' ? '✅' : 
                     goal.status === 'cancelled' ? '❌' : '⏸️'}
                  </div>
                  <div className="goal-toggle">
                    {expandedGoals.has(goal.id) ? '▼' : '▶'}
                  </div>
                </div>

                <div className="goal-description">{goal.description}</div>
                
                {goal.deadline && (
                  <div className="goal-deadline">
                    📅 Срок: {formatDate(goal.deadline)}
                  </div>
                )}

                <div className="goal-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{goal.progress}%</span>
                </div>

                {expandedGoals.has(goal.id) && (
                  <div className="goal-tasks">
                    <div className="tasks-header">
                      <h4>Задачи ({getTasksForGoal(goal.id).length})</h4>
                      <button 
                        className="btn btn--small"
                        onClick={() => {
                          setTaskForm(prev => ({ ...prev, goalId: goal.id }));
                          setShowTaskForm(true);
                        }}
                      >
                        Добавить задачу
                      </button>
                    </div>
                    
                    {getTasksForGoal(goal.id).map(task => (
                      <div key={task.id} className="task-item">
                        <div className="task-checkbox">
                          <input
                            type="checkbox"
                            checked={task.status === 'done'}
                            onChange={(e) => updateTaskStatus(
                              task.id, 
                              e.target.checked ? 'done' : 'todo'
                            )}
                          />
                        </div>
                        <div className="task-content">
                          <div className="task-title">{task.title}</div>
                          <div className="task-description">{task.description}</div>
                          <div className="task-details">
                            <span className="task-priority" style={{ backgroundColor: getPriorityColor(task.priority) }}>
                              {priorities.find(p => p.value === task.priority)?.label}
                            </span>
                            {task.dueDate && (
                              <span className="task-due">📅 {formatDate(task.dueDate)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Форма создания цели */}
      {showGoalForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Новая цель</h3>
              <button 
                className="modal-close"
                onClick={() => setShowGoalForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleGoalSubmit}>
              <div className="form-group">
                <label>Название цели</label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => handleInputChange('goal', 'title', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => handleInputChange('goal', 'description', e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Приоритет</label>
                  <select
                    value={goalForm.priority}
                    onChange={(e) => handleInputChange('goal', 'priority', e.target.value)}
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Срок выполнения</label>
                  <input
                    type="date"
                    value={goalForm.dueDate}
                    onChange={(e) => handleInputChange('goal', 'dueDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn--primary">
                  Создать цель
                </button>
                <button 
                  type="button" 
                  className="btn btn--secondary"
                  onClick={() => setShowGoalForm(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Форма создания задачи */}
      {showTaskForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Новая задача</h3>
              <button 
                className="modal-close"
                onClick={() => setShowTaskForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label>Название задачи</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => handleInputChange('task', 'title', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => handleInputChange('task', 'description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Цель</label>
                  <select
                    value={taskForm.goalId}
                    onChange={(e) => handleInputChange('task', 'goalId', e.target.value)}
                    required
                  >
                    <option value="">Выберите цель</option>
                    {goals.map(goal => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Приоритет</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => handleInputChange('task', 'priority', e.target.value)}
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Срок выполнения</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => handleInputChange('task', 'dueDate', e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn--primary">
                  Создать задачу
                </button>
                <button 
                  type="button" 
                  className="btn btn--secondary"
                  onClick={() => setShowTaskForm(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks; 