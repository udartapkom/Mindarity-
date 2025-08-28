// Константы приложения

// API константы
export const API_CONFIG = {
  BASE_URL: 'https://mindarity.ru/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Навигационные константы
export const NAVIGATION = {
  AUTH: {
    LOGIN: 'Login',
    REGISTER: 'Register',
    TWO_FACTOR: 'TwoFactor',
  },
  MAIN: {
    DASHBOARD: 'Dashboard',
    EVENTS: 'Events',
    GOALS: 'Goals',
    TASKS: 'Tasks',
    FILES: 'Files',
    PROFILE: 'Profile',
    ADMIN: 'Admin',
  },
};

// Статусы
export const STATUSES = {
  EVENTS: {
    EVENT: 'event',
    THOUGHT: 'thought',
    MEMORY: 'memory',
    IDEA: 'idea',
  },
  GOALS: {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    ON_HOLD: 'on_hold',
    CANCELLED: 'cancelled',
  },
  TASKS: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    DONE: 'done',
    CANCELLED: 'cancelled',
  },
  USERS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending',
  },
};

// Приоритеты
export const PRIORITIES = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

// Цвета
export const COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#4caf50',
  WARNING: '#ff9800',
  ERROR: '#f44336',
  INFO: '#2196f3',
  LIGHT: '#f5f5f5',
  DARK: '#333333',
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

// Размеры
export const SIZES = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  XXXL: 64,
};

// Шрифты
export const FONTS = {
  SIZES: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
    XXXL: 28,
    TITLE: 32,
  },
  WEIGHTS: {
    LIGHT: '300',
    REGULAR: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
    EXTRABOLD: '800',
  },
};

// Анимации
export const ANIMATIONS = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE: 'ease',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
  },
};

// Локальное хранилище
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  APP_SETTINGS: 'app_settings',
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATIONS: 'notifications',
  BIOMETRIC: 'biometric',
};

// Уведомления
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

// Разрешения
export const PERMISSIONS = {
  CAMERA: 'camera',
  PHOTO_LIBRARY: 'photoLibrary',
  MICROPHONE: 'microphone',
  LOCATION: 'location',
  NOTIFICATIONS: 'notifications',
  BIOMETRICS: 'biometrics',
};

// Настройки приложения
export const APP_SETTINGS = {
  DEFAULT_THEME: 'light',
  DEFAULT_LANGUAGE: 'ru',
  DEFAULT_NOTIFICATIONS: true,
  DEFAULT_BIOMETRIC: false,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 минут
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 8,
};

// Ограничения
export const LIMITS = {
  FILE_UPLOAD_SIZE: 100 * 1024 * 1024, // 100 МБ
  IMAGE_MAX_DIMENSIONS: 2048,
  SEARCH_MAX_RESULTS: 50,
  PAGINATION_DEFAULT_LIMIT: 20,
  MAX_TAGS_PER_ITEM: 10,
  MAX_ATTACHMENTS_PER_ITEM: 5,
};

// Регулярные выражения
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/.+/,
};

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  NETWORK: 'Ошибка сети. Проверьте подключение к интернету.',
  UNAUTHORIZED: 'Необходима авторизация.',
  FORBIDDEN: 'Доступ запрещен.',
  NOT_FOUND: 'Ресурс не найден.',
  VALIDATION: 'Ошибка валидации данных.',
  SERVER: 'Ошибка сервера. Попробуйте позже.',
  UNKNOWN: 'Произошла неизвестная ошибка.',
  TIMEOUT: 'Превышено время ожидания.',
  FILE_TOO_LARGE: 'Файл слишком большой.',
  INVALID_FORMAT: 'Неверный формат файла.',
  PERMISSION_DENIED: 'Доступ к ресурсу запрещен.',
};

// Сообщения об успехе
export const SUCCESS_MESSAGES = {
  LOGIN: 'Вход выполнен успешно.',
  REGISTER: 'Регистрация завершена успешно.',
  LOGOUT: 'Выход выполнен успешно.',
  SAVE: 'Данные сохранены успешно.',
  DELETE: 'Элемент удален успешно.',
  UPLOAD: 'Файл загружен успешно.',
  UPDATE: 'Данные обновлены успешно.',
  PASSWORD_CHANGE: 'Пароль изменен успешно.',
  PROFILE_UPDATE: 'Профиль обновлен успешно.',
};

// Валидация
export const VALIDATION = {
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 255,
  MIN_DESCRIPTION_LENGTH: 0,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_TAG_LENGTH: 1,
  MAX_TAG_LENGTH: 50,
};

// Форматы дат
export const DATE_FORMATS = {
  DISPLAY: 'dd.MM.yyyy',
  DISPLAY_TIME: 'dd.MM.yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_TIME: 'yyyy-MM-dd HH:mm:ss',
  RELATIVE: 'relative',
};

// Языки
export const LANGUAGES = {
  RU: 'ru',
  EN: 'en',
};

// Темы
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
};

// Роли пользователей
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
};

// Типы файлов
export const FILE_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  ARCHIVE: 'archive',
  OTHER: 'other',
};

// MIME типы
export const MIME_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEO: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
  AUDIO: ['audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ARCHIVE: ['application/zip', 'application/rar', 'application/7z'],
};

// Настройки безопасности
export const SECURITY = {
  PASSWORD_POLICY: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false,
  },
  SESSION: {
    TIMEOUT: 30 * 60 * 1000, // 30 минут
    MAX_SESSIONS: 5,
  },
  LOGIN: {
    MAX_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 минут
  },
};
