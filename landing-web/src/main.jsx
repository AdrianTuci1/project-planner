import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log(
  '%cBuilt and managed by Tucean. %cadrian.tucicovenco@gmail.com',
  'color: #8b5cf6; font-size: 14px; font-weight: bold;',
  'color: #94a3b8; font-size: 12px; font-weight: normal;'
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
