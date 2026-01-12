import React, { useState } from 'react';
import { MainApp } from './MainApp';
import { Login } from './components/Auth/Login';
import { Onboarding } from './components/Auth/Onboarding';
import { observer } from 'mobx-react-lite';

const App = observer(() => {
  // specific state for auth flow
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleOnboardingComplete = () => {
    setHasOnboarded(true);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (!hasOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return <MainApp />;
});

export default App;
