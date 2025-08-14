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

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
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

export interface Session {
  id: string;
  device: string;
  ipAddress: string;
  lastActivity: string;
  isCurrent: boolean;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  load: number;
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

// API клиент
class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
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

  // Дашборд статистика
  async getDashboardStats(period: 'week' | 'month' | 'year' = 'week') {
    const response = await this.api.get('/dashboard/stats', { params: { period } });
    return response.data;
  }

  // Пользователи (для админа)
  async getUsers() {
    const response = await this.api.get('/users');
    return response.data;
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const response = await this.api.patch(`/users/${userId}/status`, { isActive });
    return response.data;
  }

  async resetUserPassword(userId: string) {
    const response = await this.api.post(`/users/${userId}/reset-password`);
    return response.data;
  }

  async terminateUserSessions(userId: string) {
    const response = await this.api.post(`/users/${userId}/terminate-sessions`);
    return response.data;
  }

  // Системные метрики (для админа)
  async getSystemMetrics() {
    const response = await this.api.get('/monitoring/system-metrics');
    return response.data;
  }

  async getSecurityAlerts() {
    const response = await this.api.get('/monitoring/security-alerts');
    return response.data;
  }

  async resolveSecurityAlert(alertId: string) {
    const response = await this.api.patch(`/monitoring/security-alerts/${alertId}/resolve`);
    return response.data;
  }

  // Профиль пользователя
  async updateProfile(profileData: Partial<User>) {
    const response = await this.api.patch('/users/profile', profileData);
    return response.data;
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
    const response = await this.api.post('/users/change-password', passwordData);
    return response.data;
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await this.api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async getSessions() {
    const response = await this.api.get('/users/sessions');
    return response.data;
  }

  async terminateSession(sessionId: string) {
    const response = await this.api.delete(`/users/sessions/${sessionId}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService; 