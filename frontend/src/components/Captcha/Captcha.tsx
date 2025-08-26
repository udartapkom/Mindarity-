import React, { useState, useEffect } from 'react';
import './Captcha.scss';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
  onRefresh?: () => void;
}

const Captcha: React.FC<CaptchaProps> = ({ onVerify, onRefresh }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);

  const generateCaptcha = () => {
    const operators = ['+', '-', '×'];
    const randomOperator = operators[Math.floor(Math.random() * operators.length)];
    
    let newNum1, newNum2;
    
    switch (randomOperator) {
      case '+':
        newNum1 = Math.floor(Math.random() * 20) + 1;
        newNum2 = Math.floor(Math.random() * 20) + 1;
        break;
      case '-':
        newNum1 = Math.floor(Math.random() * 30) + 10;
        newNum2 = Math.floor(Math.random() * newNum1);
        break;
      case '×':
        newNum1 = Math.floor(Math.random() * 12) + 1;
        newNum2 = Math.floor(Math.random() * newNum1);
        break;
      default:
        newNum1 = Math.floor(Math.random() * 20) + 1;
        newNum2 = Math.floor(Math.random() * 20) + 1;
    }
    
    setNum1(newNum1);
    setNum2(newNum2);
    setOperator(randomOperator);
    setUserAnswer('');
    setIsCorrect(null);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const calculateAnswer = (): number => {
    switch (operator) {
      case '+':
        return num1 + num2;
      case '-':
        return num1 - num2;
      case '×':
        return num1 * num2;
      default:
        return num1 + num2;
    }
  };

  const handleSubmit = () => {
    const correctAnswer = calculateAnswer();
    const userAnswerNum = parseInt(userAnswer);
    
    if (userAnswerNum === correctAnswer) {
      setIsCorrect(true);
      onVerify(true);
    } else {
      setIsCorrect(false);
      setAttempts(prev => prev + 1);
      onVerify(false);
      
      if (attempts >= 2) {
        generateCaptcha();
        setAttempts(0);
      }
    }
  };

  const handleRefresh = () => {
    generateCaptcha();
    setAttempts(0);
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="captcha-container">
      <div className="captcha-header">
        <span className="captcha-label">Подтвердите, что вы человек:</span>
        <button 
          type="button" 
          className="captcha-refresh-btn" 
          onClick={handleRefresh}
          title="Обновить капчу"
        >
          🔄
        </button>
      </div>
      
      <div className="captcha-question">
        <span className="captcha-number">{num1}</span>
        <span className="captcha-operator">{operator}</span>
        <span className="captcha-number">{num2}</span>
        <span className="captcha-equals">=</span>
        <input
          type="number"
          className={`captcha-input ${isCorrect === false ? 'error' : ''}`}
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="?"
          min="0"
          max="999"
        />
      </div>
      
      {isCorrect === false && (
        <div className="captcha-error">
          Неверный ответ. Попробуйте еще раз.
        </div>
      )}
      
      {isCorrect === true && (
        <div className="captcha-success">
          ✓ Проверка пройдена
        </div>
      )}
      
      <button 
        type="button" 
        className="captcha-submit-btn" 
        onClick={handleSubmit}
        disabled={!userAnswer.trim()}
      >
        Проверить
      </button>
    </div>
  );
};

export default Captcha;

