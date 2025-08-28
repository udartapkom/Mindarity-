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
  isActive?: boolean;  // Keep for backward compatibility
  status: string;      // New field from API
  createdAt: string;
  lastLoginAt?: string;
}

export function normalizeAvatarUrl(url?: string): string | undefined {
  if (!url) return url;
  try {
    const base = (import.meta as any).env?.VITE_MINIO_PUBLIC_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:9000` : 'http://localhost:9000');
    // Replace domain-proxied form like https://mindarity.ru/minio/BUCKET/path -> {base}/BUCKET/path
    const idx = url.indexOf('/minio/');
    if (idx !== -1) {
      const suffix = url.substring(idx + '/minio/'.length);
      return `${base.replace(/\/$/, '')}/${suffix}`;
    }
    return url;
  } catch {
    return url;
  }
}

export interface AuthResponse {
  access_token?: string;
  user?: User;
  requires2FA?: boolean;
  userId?: string;
  message?: string;
  otpCode?: string;
  expiresAt?: Date;
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
  userId: string;
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
  userId: string;
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
  userId: string;
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
  timestamp: string;
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
    uptime: number;
  };
  resources: {
    memory: {
      total: string;
      used: string;
      free: string;
      usagePercent: number;
      critical: boolean;
    };
    cpu: {
      loadAverage: number[];
      usagePercent: number;
      critical: boolean;
    };
    disk: {
      usagePercent: number;
      critical: boolean;
    };
  };
  application: {
    processId: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    uptime: number;
  };
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
    const response: AxiosResponse<any> = await this.api.post('/auth/login', credentials);
    
    // 2FA теперь всегда требуется для всех пользователей
    if (response.data.requires2FA) {
      return {
        requires2FA: true,
        userId: response.data.userId,
        message: response.data.message,
        otpCode: response.data.otpCode,
        expiresAt: response.data.expiresAt,
      };
    }
    
    // Если по какой-то причине 2FA не требуется, обрабатываем обычный вход
    const mappedUser: User = {
      id: response.data.user.id,
      email: response.data.user.email,
      username: response.data.user.username,
      role: response.data.user.role,
      firstName: response.data.user.firstName,
      lastName: response.data.user.lastName,
      avatar: response.data.user.avatar,
      bio: (response.data.user as any).bio,
      isActive: (response.data.user as any).status ? (response.data.user as any).status === 'active' : true,
      status: (response.data.user as any).status || 'active',
      createdAt: (response.data.user as any).createdAt || new Date().toISOString(),
      lastLoginAt: (response.data.user as any).lastLoginAt || new Date().toISOString(),
    };
    
    this.setAuthToken(response.data.access_token);
    return { access_token: response.data.access_token, user: mappedUser };
  }

  async loginWith2FA(userId: string, otpCode: string): Promise<AuthResponse> {
    const response: AxiosResponse<any> = await this.api.post('/auth/login-2fa', { userId, otpCode });
    if (response.data?.access_token) {
      this.setAuthToken(response.data.access_token);
    }
    return response.data as AuthResponse;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<{ access_token: string; user: any }> = await this.api.post('/auth/register', userData);
    const mappedUser: User = {
      id: response.data.user.id,
      email: response.data.user.email,
      username: response.data.user.username,
      role: response.data.user.role,
      firstName: response.data.user.firstName,
      lastName: response.data.user.lastName,
      avatar: response.data.user.avatar,
      bio: (response.data.user as any).bio,
      isActive: (response.data.user as any).status ? (response.data.user as any).status === 'active' : true,
      status: (response.data.user as any).status || 'active',
      createdAt: (response.data.user as any).createdAt || new Date().toISOString(),
      lastLoginAt: (response.data.user as any).lastLoginAt || new Date().toISOString(),
    };
    this.setAuthToken(response.data.access_token);
    return { access_token: response.data.access_token, user: mappedUser };
  }

  async logout() {
    this.clearAuthToken();
  }

  async getProfile(): Promise<User> {
    // Используем бэкенд-эндпоинт users/profile (более полный профиль)
    const response: AxiosResponse<any> = await this.api.get('/users/profile');
    const data = response.data;
    const mapped: User = {
      id: data.id,
      email: data.email,
      username: data.username,
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
      avatar: data.avatar,
      bio: data.bio,
      isActive: (data.status ? data.status === 'active' : true),
      status: data.status || 'active',
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt,
    };
    return mapped;
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

  async getEventsStatistics() {
    const response = await this.api.get('/events/stats');
    return response.data;
  }

  async getGoalsStatistics() {
    const response = await this.api.get('/goals/statistics');
    return response.data;
  }

  // Дашборд статистика (упрощенная заглушка на основании доступных эндпоинтов)
  async getDashboardStats(period: 'week' | 'month' | 'year' = 'week') {
    try {
      const [goalsStats, emotional, eventsStats] = await Promise.all([
        this.getGoalsStatistics(),
        this.getEmotionalReactionsStats(),
        this.getEventsStatistics(),
      ]);
      return {
        totalEvents: eventsStats?.totalEvents ?? 0,
        totalGoals: goalsStats?.totalGoals ?? 0,
        totalTasks: goalsStats?.totalTasks ?? 0,
        completedTasks: goalsStats?.completedTasks ?? 0,
        upcomingDeadlines: goalsStats?.upcomingDeadlines ?? 0,
        moodDistribution: emotional || {},
        goalProgress: goalsStats?.goalProgress || [],
        recentActivity: eventsStats?.recentEvents || [],
        period,
      };
    } catch {
      return {
        totalEvents: 0,
        totalGoals: 0,
        totalTasks: 0,
        completedTasks: 0,
        upcomingDeadlines: 0,
        moodDistribution: {},
        goalProgress: [],
        recentActivity: [],
        period,
      };
    }
  }

  // Пользователи
  async getUsers(): Promise<User[]> {
    const response = await this.api.get('/users');
    return response.data;
  }

  async getUser(id: string): Promise<User> {
    const response = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await this.api.patch(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.api.delete(`/users/${id}`);
  }

  // Сессии
  async getSessions(): Promise<Session[]> {
    const response = await this.api.get('/users/sessions');
    return response.data;
  }

  async terminateSession(sessionId: string): Promise<void> {
    await this.api.delete(`/users/sessions/${sessionId}`);
  }

  async terminateAllOtherSessions(): Promise<void> {
    await this.api.delete('/users/sessions');
  }

  // Мониторинг
  async getSystemMetrics(): Promise<SystemMetrics> {
    const response = await this.api.get('/monitoring/metrics/system');
    return response.data;
  }

  async getApplicationMetrics() {
    const response = await this.api.get('/monitoring/metrics/application');
    return response.data;
  }



  // Файлы
  async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadLargeFile(formData: FormData, onProgress?: (progress: number) => void): Promise<any> {
    const response = await this.api.post('/files/upload-large', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  async getFiles(): Promise<any[]> {
    const response = await this.api.get('/files');
    return response.data;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.api.delete(`/files/${fileId}`);
  }

  // Поиск
  async search(query: string): Promise<any[]> {
    const response = await this.api.get('/search', { params: { query } });
    return response.data;
  }

  // Уведомления
  async getNotifications(): Promise<any[]> {
    const response = await this.api.get('/notifications');
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.api.put(`/notifications/${notificationId}/read`);
  }

  // Big Data
  async uploadBigDataFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post('/bigdata/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getBigDataStatus(jobId: string): Promise<any> {
    const response = await this.api.get(`/bigdata/status/${jobId}`);
    return response.data;
  }

  // Admin methods
  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    await this.api.patch(`/users/${userId}/status`, { status: isActive ? 'active' : 'inactive' });
  }

  async resetUserPassword(userId: string): Promise<void> {
    await this.api.post(`/users/${userId}/reset-password`);
  }

  async terminateUserSessions(userId: string): Promise<void> {
    await this.api.delete(`/users/${userId}/sessions`);
  }

  async terminateAllUserSessions(): Promise<void> {
    await this.api.delete('/users/sessions/all');
  }

  // Profile methods
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await this.api.patch('/users/profile', userData);
    return response.data;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await this.api.post('/auth/change-password', data);
  }

  async uploadAvatar(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await this.api.post('/users/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getSecurityAlerts(): Promise<any> {
    const response = await this.api.get('/monitoring/security/alerts');
    return response.data;
  }

  async deleteFailedLoginAttempts(username: string, ipAddress: string): Promise<any> {
    const response = await this.api.delete(`/monitoring/security/alerts/failed-logins/${encodeURIComponent(username)}/${encodeURIComponent(ipAddress)}`);
    return response.data;
  }

  async deleteAllFailedLoginAttempts(): Promise<any> {
    const response = await this.api.delete('/monitoring/security/alerts/failed-logins');
    return response.data;
  }
}

export default new ApiService();