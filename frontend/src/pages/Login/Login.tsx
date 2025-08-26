import React, { useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import Captcha from '../../components/Captcha';
import TwoFactorAuth from '../../components/TwoFactorAuth';
import './Login.scss';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  
  // 2FA состояния
  const [show2FA, setShow2FA] = useState(false);
  const [userId, setUserId] = useState('');

  const { login, register, complete2FA } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isCaptchaVerified) {
      setError('Пожалуйста, пройдите проверку CAPTCHA');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        await register(username, email, password, firstName, lastName);
        navigate('/dashboard');
      } else {
        const response = await login(email, password);
        
        // 2FA теперь всегда требуется для всех пользователей
        if (response.requires2FA && response.userId) {
          setUserId(response.userId);
          setShow2FA(true);
          
          // Показываем код во всплывающем окне
          if (response.otpCode) {
            alert(`🔐 Код для входа: ${response.otpCode}\n\nКод действителен 5 минут.`);
          }
        } else {
          // Это не должно происходить, так как 2FA теперь обязательна
          setError('Ошибка: 2FA не инициализирована');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async (otpCode: string) => {
    try {
      setIsLoading(true);
      
      // Используем метод из AuthContext для завершения 2FA
      await complete2FA(userId, otpCode);
      
      // После успешной 2FA принудительно переходим на дашборд
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при проверке 2FA';
      setError(errorMessage);
      throw err; // Пробрасываем ошибку, чтобы TwoFactorAuth мог её обработать
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setUserId('');
    setError('');
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setIsCaptchaVerified(false);
  };

  const handleCaptchaVerify = (isValid: boolean) => {
    setIsCaptchaVerified(isValid);
    if (isValid) {
      setError('');
    }
  };

  const handleCaptchaRefresh = () => {
    setIsCaptchaVerified(false);
    setError('');
  };

  // Если показывается 2FA, рендерим только её
  if (show2FA) {
    return (
      <TwoFactorAuth
        onVerify={handle2FAVerify}
        onCancel={handle2FACancel}
      />
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Mindarity</h1>
          <p>Личный дневник и управление целями</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <>
              <div className="form-group">
                <label htmlFor="username">Имя пользователя</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={isRegister}
                  placeholder="Введите имя пользователя"
                />
              </div>

              <div className="form-group"> 
                <label htmlFor="firstName">Имя</label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Введите имя"
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Фамилия</label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Введите фамилию"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Введите email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Введите пароль"
            />
          </div>

          <Captcha 
            onVerify={handleCaptchaVerify}
            onRefresh={handleCaptchaRefresh}
          />

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isLoading || !isCaptchaVerified}
          >
            {isLoading ? 'Загрузка...' : (isRegister ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>

        <div className="login-footer">
          <button type="button" className="toggle-mode-btn" onClick={toggleMode}>
            {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
