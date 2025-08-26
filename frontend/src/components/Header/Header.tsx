import React from 'react';
import './Header.scss';

interface HeaderProps {
  currentDate?: Date;
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentDate = new Date(), onMenuToggle }) => {
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
      year: 'numeric',
    };
    
    return date.toLocaleDateString('ru-RU', options);
  };

  return (
    <header className="header">
      <div className="header__left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <span className="menu-icon">☰</span>
        </button>
      </div>
      <div className="header__date">
        <span className="date-text">{formatDate(currentDate)}</span>
        <span className="date-icon">📅</span>
      </div>
    </header>
  );
};

export default Header; 