import React, { useState } from 'react';
import './TwoFactorTest.scss';

const TwoFactorTest: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable2FA = async () => {
    setIsLoading(true);
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setVerificationResult('Сначала войдите в систему');
        setIsLoading(false);
        return;
      }

      // Вызываем API для включения 2FA
      const response = await fetch('/api/users/profile/enable-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка при включении 2FA');
      }

      const data = await response.json();
      
      setIsEnabled(true);
      setVerificationResult(`2FA включена! Код: ${data.code}. Истекает: ${new Date(data.expiresAt).toLocaleTimeString()}`);
      setIsLoading(false);
    } catch (error) {
      setVerificationResult(`Ошибка при включении 2FA: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 4) {
      setVerificationResult('Введите 4-значный код');
      return;
    }

    setIsLoading(true);
    try {
      // Здесь будет вызов API для проверки OTP
      // Пока что симулируем
      setTimeout(() => {
        if (otpCode === '1234') { // Тестовый код
          setVerificationResult('✅ OTP код верный! Вход выполнен успешно.');
        } else {
          setVerificationResult('❌ Неверный OTP код. Попробуйте еще раз.');
        }
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setVerificationResult('Ошибка при проверке OTP');
      setIsLoading(false);
    }
  };

  return (
    <div className="two-factor-test-page">
      <div className="two-factor-test-container">
        <h1>🔐 Тестирование 2FA</h1>
        <p>Демонстрация двухфакторной аутентификации с OTP кодами</p>
        
        <div className="test-section">
          <h3>1. Включение 2FA</h3>
          <button 
            onClick={handleEnable2FA}
            disabled={isLoading || isEnabled}
            className="enable-btn"
          >
            {isLoading ? 'Включение...' : isEnabled ? '2FA включена' : 'Включить 2FA'}
          </button>
        </div>

        {isEnabled && (
          <div className="test-section">
            <h3>2. Тестирование OTP</h3>
            <div className="otp-input-section">
              <label htmlFor="otpCode">Введите 4-значный код:</label>
              <input
                type="text"
                id="otpCode"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setOtpCode(value);
                }}
                placeholder="0000"
                maxLength={4}
                pattern="[0-9]{4}"
                className="otp-input"
              />
              <button 
                onClick={handleVerifyOTP}
                disabled={isLoading || otpCode.length !== 4}
                className="verify-btn"
              >
                {isLoading ? 'Проверка...' : 'Проверить'}
              </button>
            </div>
            
            <div className="test-info">
              <p><strong>Тестовый код:</strong> 1234</p>
              <p><strong>Статус:</strong> {isEnabled ? '✅ Включена' : '❌ Отключена'}</p>
            </div>
          </div>
        )}

        {verificationResult && (
          <div className={`result-message ${verificationResult.includes('✅') ? 'success' : 'error'}`}>
            {verificationResult}
          </div>
        )}

        <div className="test-section">
          <h3>3. Как это работает</h3>
          <div className="info-cards">
            <div className="info-card">
              <h4>🔑 Первый фактор</h4>
              <p>Логин и пароль</p>
            </div>
            <div className="info-card">
              <h4>📱 Второй фактор</h4>
              <p>4-значный OTP код</p>
            </div>
            <div className="info-card">
              <h4>⏰ Время действия</h4>
              <p>5 минут</p>
            </div>
          </div>
        </div>

        <div className="test-section">
          <h3>4. Инструкция по тестированию</h3>
          <div className="instructions">
            <ol>
              <li><strong>Войдите в систему</strong> на странице <a href="/login" target="_blank">/login</a></li>
              <li><strong>Вернитесь сюда</strong> и нажмите "Включить 2FA"</li>
              <li><strong>Скопируйте код</strong> и вернитесь на страницу входа</li>
              <li><strong>Войдите снова</strong> - теперь должна появиться форма 2FA</li>
              <li><strong>Введите код</strong> для завершения входа</li>
            </ol>
          </div>
        </div>

        <div className="test-section">
          <h3>5. Демонстрация процесса входа с 2FA</h3>
          <div className="demo-section">
            <div className="demo-step">
              <h4>Шаг 1: Обычный вход</h4>
              <p>Пользователь вводит email и пароль</p>
              <div className="demo-code">
                <code>POST /api/auth/login</code>
              </div>
            </div>
            
            <div className="demo-step">
              <h4>Шаг 2: Проверка 2FA</h4>
              <p>Если 2FA включена, сервер возвращает:</p>
              <div className="demo-code">
                <pre>{`{
  "requires2FA": true,
  "userId": "user-id",
  "message": "2FA required",
  "otpCode": "1234"
}`}</pre>
              </div>
            </div>
            
            <div className="demo-step">
              <h4>Шаг 3: Форма 2FA</h4>
              <p>Frontend показывает форму для ввода OTP</p>
              <div className="demo-code">
                <code>&lt;TwoFactorAuth /&gt;</code>
              </div>
            </div>
            
            <div className="demo-step">
              <h4>Шаг 4: Проверка OTP</h4>
              <p>Пользователь вводит код и отправляет:</p>
              <div className="demo-code">
                <code>POST /api/auth/login-2fa</code>
              </div>
            </div>
          </div>
        </div>

        <div className="test-footer">
          <p>💡 <strong>Примечание:</strong> Это демонстрационная версия. В реальном проекте OTP коды генерируются сервером и отправляются пользователю.</p>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorTest;
