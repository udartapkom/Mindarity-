// Хелперы для приложения

import { Platform } from 'react-native';
import { COLORS, STATUSES, PRIORITIES } from '../constants';

/**
 * Получение цвета для статуса
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case STATUSES.GOALS.COMPLETED:
    case STATUSES.TASKS.DONE:
      return COLORS.SUCCESS;
    case STATUSES.GOALS.IN_PROGRESS:
    case STATUSES.TASKS.IN_PROGRESS:
      return COLORS.INFO;
    case STATUSES.GOALS.ON_HOLD:
    case STATUSES.TASKS.REVIEW:
      return COLORS.WARNING;
    case STATUSES.GOALS.CANCELLED:
    case STATUSES.TASKS.CANCELLED:
      return COLORS.ERROR;
    default:
      return COLORS.GRAY[500];
  }
};

/**
 * Получение цвета для приоритета
 */
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case PRIORITIES.URGENT:
      return COLORS.ERROR;
    case PRIORITIES.HIGH:
      return COLORS.WARNING;
    case PRIORITIES.MEDIUM:
      return COLORS.INFO;
    case PRIORITIES.LOW:
      return COLORS.SUCCESS;
    default:
      return COLORS.GRAY[500];
  }
};

/**
 * Получение текста для статуса
 */
export const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    [STATUSES.GOALS.NOT_STARTED]: 'Не начато',
    [STATUSES.GOALS.IN_PROGRESS]: 'В процессе',
    [STATUSES.GOALS.COMPLETED]: 'Завершено',
    [STATUSES.GOALS.ON_HOLD]: 'Приостановлено',
    [STATUSES.GOALS.CANCELLED]: 'Отменено',
    [STATUSES.TASKS.TODO]: 'К выполнению',
    [STATUSES.TASKS.IN_PROGRESS]: 'В процессе',
    [STATUSES.TASKS.REVIEW]: 'На проверке',
    [STATUSES.TASKS.DONE]: 'Выполнено',
    [STATUSES.TASKS.CANCELLED]: 'Отменено',
  };
  
  return statusMap[status] || status;
};

/**
 * Получение текста для приоритета
 */
export const getPriorityText = (priority: string): string => {
  const priorityMap: { [key: string]: string } = {
    [PRIORITIES.URGENT]: 'Срочно',
    [PRIORITIES.HIGH]: 'Высокий',
    [PRIORITIES.MEDIUM]: 'Средний',
    [PRIORITIES.LOW]: 'Низкий',
  };
  
  return priorityMap[priority] || priority;
};

/**
 * Получение текста для типа события
 */
export const getEventTypeText = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    [STATUSES.EVENTS.EVENT]: 'Событие',
    [STATUSES.EVENTS.THOUGHT]: 'Мысль',
    [STATUSES.EVENTS.MEMORY]: 'Воспоминание',
    [STATUSES.EVENTS.IDEA]: 'Идея',
  };
  
  return typeMap[type] || type;
};

/**
 * Проверка, является ли пользователь администратором
 */
export const isAdmin = (role?: string): boolean => {
  return role === 'admin';
};

/**
 * Проверка, является ли пользователь модератором
 */
export const isModerator = (role?: string): boolean => {
  return role === 'moderator' || role === 'admin';
};

/**
 * Получение инициалов пользователя
 */
export const getUserInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
};

/**
 * Форматирование даты для отображения
 */
export const formatDisplayDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Неверная дата';
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateObj.toDateString() === today.toDateString()) {
    return 'Сегодня';
  } else if (dateObj.toDateString() === yesterday.toDateString()) {
    return 'Вчера';
  } else {
    return dateObj.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
};

/**
 * Форматирование времени для отображения
 */
export const formatDisplayTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Неверное время';
  }

  return dateObj.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Получение относительного времени
 */
export const getRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'только что';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} мин назад`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ч назад`;
  } else if (diffInDays < 7) {
    return `${diffInDays} дн назад`;
  } else {
    return formatDisplayDate(dateObj);
  }
};

/**
 * Форматирование размера файла
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Б';
  
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Получение типа файла по расширению
 */
export const getFileType = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  if (!extension) return 'other';
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
  
  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'video';
  if (audioExtensions.includes(extension)) return 'audio';
  if (documentExtensions.includes(extension)) return 'document';
  if (archiveExtensions.includes(extension)) return 'archive';
  
  return 'other';
};

/**
 * Получение иконки для типа файла
 */
export const getFileIcon = (fileType: string): string => {
  switch (fileType) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'music';
    case 'document':
      return 'file-document';
    case 'archive':
      return 'archive';
    default:
      return 'file';
  }
};

/**
 * Проверка валидности email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Проверка валидности пароля
 */
export const isValidPassword = (password: string): boolean => {
  // Минимум 8 символов, хотя бы одна буква и одна цифра
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Получение платформы
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
};

/**
 * Проверка, является ли платформа iOS
 */
export const isIOS = (): boolean => {
  return Platform.OS === 'ios';
};

/**
 * Проверка, является ли платформа Android
 */
export const isAndroid = (): boolean => {
  return Platform.OS === 'android';
};

/**
 * Получение безопасной области для устройства
 */
export const getSafeAreaInsets = () => {
  // В реальном приложении нужно использовать react-native-safe-area-context
  return {
    top: isIOS() ? 44 : 24,
    bottom: isIOS() ? 34 : 0,
    left: 0,
    right: 0,
  };
};

/**
 * Получение высоты статус бара
 */
export const getStatusBarHeight = (): number => {
  return isIOS() ? 44 : 24;
};

/**
 * Получение высоты навигационной панели
 */
export const getNavigationBarHeight = (): number => {
  return isAndroid() ? 56 : 44;
};

/**
 * Получение общей высоты заголовка
 */
export const getHeaderHeight = (): number => {
  return getStatusBarHeight() + getNavigationBarHeight();
};

/**
 * Форматирование числа с разделителями
 */
export const formatNumber = (num: number, locale: string = 'ru-RU'): string => {
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * Форматирование валюты
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'RUB',
  locale: string = 'ru-RU'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Получение процента выполнения
 */
export const getProgressPercentage = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Получение цвета для процента выполнения
 */
export const getProgressColor = (percentage: number): string => {
  if (percentage >= 80) return COLORS.SUCCESS;
  if (percentage >= 60) return COLORS.INFO;
  if (percentage >= 40) return COLORS.WARNING;
  return COLORS.ERROR;
};

/**
 * Проверка, является ли значение пустым
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Глубокое клонирование объекта
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

/**
 * Дебаунс функция
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Троттлинг функция
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
