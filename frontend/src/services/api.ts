import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';

// Типы для API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface Event {
  id: string;
  title: string;
  content: string;
  type: 'event' | 'thought' | 'memory' | 'idea';
  emotionalReactions: string[];
  eventDate: string;
  isPrivate: boolean;
  location?: string;
  tags?: string[];
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  startDate?: string;
  completedDate?: string;
  progress: number;
  tags?: string[];
  isRecurring: boolean;
  recurringPattern?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completedDate?: string;
  estimatedHours: number;
  actualHours: number;
  notes?: string;
  order: number;
  goalId: string;
  createdAt: string;
  updatedAt: string;
}

// API клиент
class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Загружаем токен из localStorage
    this.token = localStorage.getItem('auth_token');
    if (this.token) {
      this.setAuthToken(this.token);
    }

    // Перехватчик для обновления токена
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Токен истек, очищаем localStorage
          localStorage.removeItem('auth_token');
          this.token = null;
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.token = token;
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  }

  clearAuthToken() {
    this.token = null;
    delete this.api.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }

  // Аутентификация
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    this.setAuthToken(response.data.access_token);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
    this.setAuthToken(response.data.access_token);
    return response.data;
  }

  async logout() {
    this.clearAuthToken();
  }

  async getProfile() {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  // События
  async getEvents(): Promise<Event[]> {
    const response = await this.api.get('/events');
    return response.data;
  }

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    const response = await this.api.post('/events', eventData);
    return response.data;
  }

  async updateEvent(id: string, eventData: Partial<Event>): Promise<Event> {
    const response = await this.api.patch(`/events/${id}`, eventData);
    return response.data;
  }

  async deleteEvent(id: string): Promise<void> {
    await this.api.delete(`/events/${id}`);
  }

  async searchEvents(query: string): Promise<Event[]> {
    const response = await this.api.get('/events/search', { params: { query } });
    return response.data;
  }

  // Цели
  async getGoals(): Promise<Goal[]> {
    const response = await this.api.get('/goals');
    return response.data;
  }

  async createGoal(goalData: Partial<Goal>): Promise<Goal> {
    const response = await this.api.post('/goals', goalData);
    return response.data;
  }

  async updateGoal(id: string, goalData: Partial<Goal>): Promise<Goal> {
    const response = await this.api.patch(`/goals/${id}`, goalData);
    return response.data;
  }

  async deleteGoal(id: string): Promise<void> {
    await this.api.delete(`/goals/${id}`);
  }

  // Задачи
  async getTasks(goalId: string): Promise<Task[]> {
    const response = await this.api.get(`/goals/${goalId}/tasks`);
    return response.data;
  }

  async createTask(goalId: string, taskData: Partial<Task>): Promise<Task> {
    const response = await this.api.post(`/goals/${goalId}/tasks`, taskData);
    return response.data;
  }

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    const response = await this.api.patch(`/goals/tasks/${id}`, taskData);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.api.delete(`/goals/tasks/${id}`);
  }

  // Статистика
  async getEmotionalReactionsStats() {
    const response = await this.api.get('/events/stats/emotional-reactions');
    return response.data;
  }

  async getGoalsStatistics() {
    const response = await this.api.get('/goals/statistics');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService; 