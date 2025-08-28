// Дополнительные типы для приложения

export interface NavigationProps {
  navigation: any;
  route: any;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface SearchResult {
  id: string;
  type: 'event' | 'goal' | 'task' | 'file' | 'user';
  title: string;
  description?: string;
  url: string;
  relevance: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: string;
    strokeWidth?: number;
  }>;
}

export interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  priority?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: boolean;
  biometricAuth: boolean;
  autoSync: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  retry?: () => void;
}

export interface RefreshState {
  isRefreshing: boolean;
  lastRefresh?: Date;
}

export interface NetworkState {
  isConnected: boolean;
  connectionType?: string;
  isMetered?: boolean;
}

export interface PermissionState {
  camera: boolean;
  photoLibrary: boolean;
  microphone: boolean;
  location: boolean;
  notifications: boolean;
}

export interface BiometricState {
  isAvailable: boolean;
  isEnrolled: boolean;
  type?: 'fingerprint' | 'face' | 'iris';
}

export interface SecuritySettings {
  requireBiometric: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  privacyLevel: 'public' | 'friends' | 'private';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

export interface AppMetrics {
  appVersion: string;
  buildNumber: string;
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
    manufacturer: string;
  };
  performance: {
    startupTime: number;
    memoryUsage: number;
    batteryLevel: number;
  };
  usage: {
    sessionsCount: number;
    totalUsageTime: number;
    lastActive: string;
  };
}
