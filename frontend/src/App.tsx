import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login/Login';
import CaptchaTest from './pages/CaptchaTest';
import TwoFactorTest from './pages/TwoFactorTest';
import './styles/main.scss';

// Компонент для защищенных маршрутов
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/captcha-test" element={<CaptchaTest />} />
        <Route path="/2fa-test" element={<TwoFactorTest />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
    <div className="App">
        <AppContent />
    </div>
    </AuthProvider>
  );
}

export default App;
