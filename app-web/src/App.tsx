import React from 'react';
import { MainApp } from './MainApp';
import { Login } from './components/Auth/Login';
import { SignupPage } from './pages/SignupPage';
import { observer } from 'mobx-react-lite';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { store } from './models/store';
import { Loading } from './components/Shared/Loading';

const AuthWrapper = observer(() => {
  // Use MobX store state instead of local state
  const { isAuthenticated, isLoading } = store.authStore;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" /> : <SignupPage onComplete={() => { }} />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <MainApp /> : <Login onLogin={() => { }} />}
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
