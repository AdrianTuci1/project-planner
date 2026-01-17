import React, { useState, useEffect } from 'react';
import { MainApp } from './MainApp';
import { Login } from './components/Auth/Login';
import { SignupPage } from './pages/SignupPage';
import { observer } from 'mobx-react-lite';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const AuthWrapper = observer(() => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial auth check
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" /> : <SignupPage onComplete={handleLogin} />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <MainApp /> : <Login onLogin={handleLogin} />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
});

const App = () => {
  return (
    <BrowserRouter>
      <AuthWrapper />
    </BrowserRouter>
  );
};

export default App;
