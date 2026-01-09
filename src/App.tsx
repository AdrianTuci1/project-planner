import React from 'react';
import { AppLayout } from './components/Layout/AppLayout';
import { MainView } from './components/MainView';
import './index.css';
import './animations.css';

function App() {
  return (
    <AppLayout>
      <MainView />
    </AppLayout>
  );
}

export default App;
