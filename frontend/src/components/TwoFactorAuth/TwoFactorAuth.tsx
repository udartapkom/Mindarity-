import React, { useState } from 'react';
import './TwoFactorAuth.scss';

interface TwoFactorAuthProps {
  onVerify: (otpCode: string) => void;
  onCancel: () => void;
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onVerify, onCancel }) => {
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await onVerify(otpCode);
    } catch (err: any) {
      setError(err.message || 'Неверный код 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="two-factor-auth-overlay">
      <div className="two-factor-auth-modal">
        <h2>Двухфакторная аутентификация</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="otpCode">Код OTP</label>
            <input
              type="text"
              id="otpCode"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={4}
              required
              disabled={isLoading}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="button-group">
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Проверка...' : 'Подтвердить'}
            </button>
            <button type="button" className="cancel-btn" onClick={onCancel} disabled={isLoading}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorAuth;
