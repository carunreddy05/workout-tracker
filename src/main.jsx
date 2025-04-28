import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// import App from './App.jsx'
import GymEntrySystem from './components/gymEntrySystem.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GymEntrySystem/>kk
  </StrictMode>,
)
