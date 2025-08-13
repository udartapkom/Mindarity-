import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import api from '../../services/api';
import type { Goal, Task } from '../../services/api';
import './Tasks.scss';

interface CreateGoalForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate: string;
  tags: string;
}

interface CreateTaskForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  estimatedTime: number;
  goalId: string;
  tags: string;
}

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'goals' | 'calendar' | 'kanban'>('goals');

  const [goalForm, setGoalForm] = useState<CreateGoalForm>({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    dueDate: '',
    tags: '',
  });

  const [taskForm, setTaskForm] = useState<CreateTaskForm>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    estimatedTime: 60,
    goalId: '',
    tags: '',
  });

  const priorities = [
    { value: 'low', label: 'Низкий', color: '#28a745' },
    { value: 'medium', label: 'Средний', color: '#ffc107' },
    { value: 'high', label: 'Высокий', color: '#dc3545' },
  ];

  const categories = ['Работа', 'Личное', 'Здоровье', 'Обучение', 'Финансы', 'Другое'];

  useEffect(() => {
    fetchGoals();
    fetchTasks();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await api.getGoals();
      setGoals(response);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      // Временно используем заглушку, так как метод getTasks требует goalId
      const mockTasks: Task[] = [];
      setTasks(mockTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const goalData = {
        ...goalForm,
        tags: goalForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        userId: user?.id,
      };

      await api.createGoal(goalData);
      
      setGoalForm({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        dueDate: '',
        tags: '',
      });
      setShowGoalForm(false);
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const taskData = {
        ...taskForm,
        tags: taskForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        userId: user?.id,
      };

      await api.createTask(taskForm.goalId, taskData);
      
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        estimatedTime: 60,
        goalId: '',
        tags: '',
      });
      setShowTaskForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleInputChange = (form: 'goal' | 'task', field: string, value: string | number) => {
    if (form === 'goal') {
      setGoalForm(prev => ({ ...prev, [field]: value }));
    } else {
      setTaskForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      await api.updateTask(taskId, { status });
      if (status === 'done') {
        await api.updateTask(taskId, { 
          completedDate: new Date().toISOString() 
        });
      }
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
  };

  const getPriorityColor = (priority: string) => {
    return priorities.find(p => p.value === priority)?.color || '#6c757d';
  };

  const getTasksForGoal = (goalId: string) => {
    return tasks.filter(task => task.goalId === goalId);
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  if (loading) {
    return (
      <div className="tasks">
        <div className="tasks__loading">Загрузка целей и задач...</div>
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

      <div className="tasks__view-controls">
        <button 
          className={`view-btn ${viewMode === 'goals' ? 'active' : ''}`}
          onClick={() => setViewMode('goals')}
        >
          Цели
        </button>
        <button 
          className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
          onClick={() => setViewMode('kanban')}
        >
          Канбан
        </button>
        <button 
          className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
          onClick={() => setViewMode('calendar')}
        >
          Календарь
        </button>
      </div>

      <div className="tasks__content">
        {viewMode === 'goals' && (
          <div className="goals-view">
            <div className="goals-grid">
              {goals.map((goal) => (
                <div key={goal.id} className="goal-card">
                  <div className="goal-card__header">
                    <div className="goal-card__priority" style={{ backgroundColor: getPriorityColor(goal.priority) }}>
                      {priorities.find(p => p.value === goal.priority)?.label}
                    </div>
                    <div className="goal-card__status">
                      {goal.status === 'in_progress' ? '🔄' : 
                       goal.status === 'completed' ? '✅' : 
                       goal.status === 'cancelled' ? '❌' : '⏸️'}
                    </div>
                  </div>

                  <div className="goal-card__title">{goal.title}</div>
                  <div className="goal-card__description">{goal.description}</div>
                  
                  <div className="goal-card__category">
                    📂 {'Категория'}
                  </div>

                  <div className="goal-card__progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{goal.progress}%</span>
                  </div>

                  {goal.deadline && (
                    <div className="goal-card__due-date">
                      📅 {formatDate(goal.deadline)}
                    </div>
                  )}

                  {goal.tags && goal.tags.length > 0 && (
                    <div className="goal-card__tags">
                      {goal.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="goal-card__tasks">
                    <h4>Задачи ({getTasksForGoal(goal.id).length})</h4>
                    {getTasksForGoal(goal.id).map(task => (
                      <div key={task.id} className="mini-task">
                        <input
                          type="checkbox"
                          checked={task.status === 'done'}
                          onChange={(e) => updateTaskStatus(
                            task.id, 
                            e.target.checked ? 'done' : 'todo'
                          )}
                        />
                        <span className={task.status === 'done' ? 'completed' : ''}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="goal-card__actions">
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
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'kanban' && (
          <div className="kanban-view">
            <div className="kanban-columns">
              <div className="kanban-column">
                <h3>К выполнению</h3>
                {tasks.filter(t => t.status === 'todo').map(task => (
                  <div key={task.id} className="kanban-task">
                    <div className="task-priority" style={{ backgroundColor: getPriorityColor(task.priority) }}></div>
                    <div className="task-title">{task.title}</div>
                    <div className="task-goal">
                      {goals.find(g => g.id === task.goalId)?.title}
                    </div>
                    <div className="task-due">{formatDate(task.dueDate)}</div>
                  </div>
                ))}
              </div>

              <div className="kanban-column">
                <h3>В работе</h3>
                {tasks.filter(t => t.status === 'in_progress').map(task => (
                  <div key={task.id} className="kanban-task">
                    <div className="task-priority" style={{ backgroundColor: getPriorityColor(task.priority) }}></div>
                    <div className="task-title">{task.title}</div>
                    <div className="task-goal">
                      {goals.find(g => g.id === task.goalId)?.title}
                    </div>
                    <div className="task-due">{formatDate(task.dueDate)}</div>
                  </div>
                ))}
              </div>

              <div className="kanban-column">
                <h3>Завершено</h3>
                {tasks.filter(t => t.status === 'done').map(task => (
                  <div key={task.id} className="kanban-task completed">
                    <div className="task-priority" style={{ backgroundColor: getPriorityColor(task.priority) }}></div>
                    <div className="task-title">{task.title}</div>
                    <div className="task-goal">
                      {goals.find(g => g.id === task.goalId)?.title}
                    </div>
                    <div className="task-time">
                      {formatTime(task.estimatedHours * 60)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'calendar' && (
          <div className="calendar-view">
            <div className="calendar-header">
              <button 
                className="calendar-nav"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
              >
                ←
              </button>
              <h3>
                {selectedDate.toLocaleDateString('ru-RU', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              <button 
                className="calendar-nav"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
              >
                →
              </button>
            </div>

            <div className="calendar-tasks">
              {getTasksForDate(selectedDate).map(task => (
                <div key={task.id} className="calendar-task">
                  <div className="task-priority" style={{ backgroundColor: getPriorityColor(task.priority) }}></div>
                  <div className="task-info">
                    <div className="task-title">{task.title}</div>
                    <div className="task-goal">
                      {goals.find(g => g.id === task.goalId)?.title}
                    </div>
                    <div className="task-time">
                      {formatTime(task.estimatedHours * 60)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
                  <label>Категория</label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => handleInputChange('goal', 'category', e.target.value)}
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Срок выполнения</label>
                  <input
                    type="date"
                    value={goalForm.dueDate}
                    onChange={(e) => handleInputChange('goal', 'dueDate', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Теги</label>
                  <input
                    type="text"
                    value={goalForm.tags}
                    onChange={(e) => handleInputChange('goal', 'tags', e.target.value)}
                    placeholder="тег1, тег2, тег3"
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

              <div className="form-row">
                <div className="form-group">
                  <label>Срок выполнения</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => handleInputChange('task', 'dueDate', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Оценка времени (минуты)</label>
                  <input
                    type="number"
                    value={taskForm.estimatedTime}
                    onChange={(e) => handleInputChange('task', 'estimatedTime', parseInt(e.target.value))}
                    min="15"
                    step="15"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Теги</label>
                <input
                  type="text"
                  value={taskForm.tags}
                  onChange={(e) => handleInputChange('task', 'tags', e.target.value)}
                  placeholder="тег1, тег2, тег3"
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