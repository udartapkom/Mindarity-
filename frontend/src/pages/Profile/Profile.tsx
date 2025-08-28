import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import apiService, { normalizeAvatarUrl } from '../../services/api';
import type { User, Session } from '../../services/api';
import './Profile.scss';

// type UserProfile = User; // Убран неиспользуемый тип

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { logout, updateUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showAvatarForm, setShowAvatarForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
  });

  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchSessions();
  }, []);

  const fetchProfile = async () => {
    try {
      const profileData = await apiService.getProfile();
      setProfile(profileData);
      setProfileForm({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        bio: profileData.bio || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const sessions = await apiService.getSessions();
      setSessions(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await apiService.updateProfile(profileForm);
      setProfile(prev => prev ? { ...prev, ...profileForm } : null);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Новые пароли не совпадают');
      return;
    }

    try {
      await apiService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
      alert('Пароль успешно изменен');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Ошибка при смене пароля');
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) return;

    try {
      const updatedUser = await apiService.uploadAvatar(selectedFile);
      setShowAvatarForm(false);
      setSelectedFile(null);
      setAvatarPreview('');
      
      // Обновляем профиль с новыми данными
      setProfile(prev => prev ? { ...prev, avatar: updatedUser.avatar } : null);
      
      // Обновляем пользователя в AuthContext (это обновит аватар в Sidebar)
      updateUser({ avatar: updatedUser.avatar });
      
      alert('Аватар успешно загружен');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Ошибка при загрузке аватара');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      await apiService.terminateSession(sessionId);
      // Обновляем локальное состояние
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      alert('Сессия завершена');
    } catch (error) {
      console.error('Error terminating session:', error);
      alert('Ошибка при завершении сессии');
    }
  };

  const terminateAllOtherSessions = async () => {
    try {
      await apiService.terminateAllOtherSessions();
      // Обновляем локальное состояние - оставляем только текущую сессию
      setSessions(prev => prev.filter(session => session.isCurrent));
      alert('Все другие сессии завершены');
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      alert('Ошибка при завершении сессий');
    }
  };

  const terminateAllSessions = async () => {
    const confirmed = window.confirm(
      'Вы уверены, что хотите завершить ВСЕ сессии? Это приведет к выходу из системы на всех устройствах, включая текущее.'
    );
    
    if (!confirmed) return;
    
    try {
      // Завершаем все сессии, включая текущую
      await apiService.terminateAllUserSessions();
      alert('Все сессии завершены. Вы будете перенаправлены на страницу входа.');
      // Выходим из системы и перенаправляем на страницу входа
      logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      alert('Ошибка при завершении всех сессий');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (device: string) => {
    if (device.includes('Mobile')) return '📱';
    if (device.includes('Tablet')) return '📱';
    if (device.includes('Windows')) return '💻';
    if (device.includes('Mac')) return '🍎';
    if (device.includes('Linux')) return '🐧';
    return '💻';
  };

  if (loading) {
    return (
      <div className="profile">
        <div className="profile__loading">Загрузка профиля...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile">
        <div className="profile__error">Ошибка загрузки профиля</div>
      </div>
      );
  }

  return (
    <div className="profile">
      <div className="profile__header">
        <h1>Профиль пользователя</h1>
      </div>

      <div className="profile__content">
        {/* Основная информация */}
        <div className="profile-section">
          <div className="profile-avatar">
            <img 
              src={normalizeAvatarUrl(profile.avatar) || '/default-avatar.png'} 
              alt="Аватар" 
              className="avatar-image"
            />
            <button 
              className="avatar-edit-btn"
              onClick={() => setShowAvatarForm(true)}
            >
              ✏️
            </button>
          </div>

          <div className="profile-info">
            <h2>{profile.firstName} {profile.lastName}</h2>
            <p className="profile-email">{profile.email}</p>
            <p className="profile-role">Роль: {profile.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
            <p className="profile-status">
              Статус: {profile.isActive ? '🟢 Активен' : '🔴 Неактивен'}
            </p>
            <p className="profile-joined">
              Присоединился: {formatDate(profile.createdAt)}
            </p>
            {profile.lastLoginAt && (
              <p className="profile-last-login">
                Последний вход: {formatDate(profile.lastLoginAt)}
              </p>
            )}
          </div>
        </div>

        {/* Редактирование профиля */}
        <div className="profile-section">
          <div className="section-header">
            <h3>Личная информация</h3>
            <button 
              className="btn btn--secondary"
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Отмена' : 'Редактировать'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Имя</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Фамилия</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>О себе</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  placeholder="Расскажите о себе..."
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn--primary">
                  Сохранить
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <p><strong>Имя:</strong> {profile.firstName}</p>
              <p><strong>Фамилия:</strong> {profile.lastName}</p>
              <p><strong>О себе:</strong> {profile.bio || 'Не указано'}</p>
            </div>
          )}
        </div>

        {/* Смена пароля */}
        <div className="profile-section">
          <div className="section-header">
            <h3>Безопасность</h3>
            <button 
              className="btn btn--secondary"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              {showPasswordForm ? 'Отмена' : 'Сменить пароль'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="form-group">
                <label>Текущий пароль</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Новый пароль</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength={8}
                  />
                </div>
                <div className="form-group">
                  <label>Подтвердите новый пароль</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn--primary">
                  Изменить пароль
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Активные сессии */}
        <div className="profile-section">
          <div className="section-header">
            <h3>Активные сессии</h3>
            <div className="session-actions">
              <button 
                className="btn btn--secondary"
                onClick={terminateAllOtherSessions}
              >
                Завершить другие сессии
              </button>
              <button 
                className="btn btn--danger"
                onClick={terminateAllSessions}
              >
                Завершить ВСЕ сессии
              </button>
            </div>
          </div>

          <div className="sessions-list">
            {sessions.map((session) => (
              <div key={session.id} className="session-item">
                <div className="session-info">
                  <div className="session-device">
                    {getDeviceIcon(session.device)} {session.device}
                  </div>
                  <div className="session-ip">{session.ipAddress}</div>
                  <div className="session-activity">
                    Активность: {formatDate(session.lastActivity)}
                  </div>
                  {session.isCurrent && (
                    <div className="session-current">Текущая сессия</div>
                  )}
                </div>
                {!session.isCurrent && (
                  <button 
                    className="btn btn--danger btn--small"
                    onClick={() => terminateSession(session.id)}
                  >
                    Завершить
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Действия */}
        <div className="profile-section">
          <div className="section-header">
            <h3>Действия</h3>
          </div>
          <div className="profile-actions">
            <button className="btn btn--danger" onClick={logout}>
              Выйти из системы
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно загрузки аватара */}
      {showAvatarForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Изменить аватар</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowAvatarForm(false);
                  setSelectedFile(null);
                  setAvatarPreview('');
                }}
              >
                ×
              </button>
            </div>
            <div className="avatar-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="file-input"
              />
              {avatarPreview && (
                <div className="avatar-preview">
                  <img src={avatarPreview} alt="Предпросмотр" />
                </div>
              )}
              <div className="upload-actions">
                <button 
                  className="btn btn--primary"
                  onClick={handleAvatarUpload}
                  disabled={!selectedFile}
                >
                  Загрузить
                </button>
                <button 
                  className="btn btn--secondary"
                  onClick={() => {
                    setShowAvatarForm(false);
                    setSelectedFile(null);
                    setAvatarPreview('');
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 