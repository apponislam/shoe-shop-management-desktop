import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initMockElectronAPI } from './utils/mockElectronAPI'

// Initialize fallback mock API if running directly in a web browser
initMockElectronAPI()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

