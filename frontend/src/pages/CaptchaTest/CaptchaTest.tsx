import React, { useState } from 'react';
import Captcha from '../../components/Captcha';
import './CaptchaTest.scss';

const CaptchaTest: React.FC = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [verificationCount, setVerificationCount] = useState(0);

  const handleVerify = (isValid: boolean) => {
    setIsVerified(isValid);
    if (isValid) {
      setVerificationCount(prev => prev + 1);
    }
  };

  const handleRefresh = () => {
    setIsVerified(false);
  };

  return (
    <div className="captcha-test-page">
      <div className="captcha-test-container">
        <h1>Тестирование CAPTCHA</h1>
        <p>Это тестовая страница для проверки компонента CAPTCHA</p>
        
        <div className="test-info">
          <p><strong>Статус:</strong> {isVerified ? '✅ Проверено' : '❌ Не проверено'}</p>
          <p><strong>Количество успешных проверок:</strong> {verificationCount}</p>
        </div>

        <Captcha 
          onVerify={handleVerify}
          onRefresh={handleRefresh}
        />

        {isVerified && (
          <div className="success-message">
            <h3>🎉 CAPTCHA пройдена успешно!</h3>
            <p>Теперь вы можете продолжить работу с формой.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptchaTest;
