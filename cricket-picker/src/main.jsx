import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register' // This handles the offline magic
import './index.css'
import App from './App.jsx'

// Register the Service Worker for offline use
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New update available for 12 MEN. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('12 MEN is now ready for offline match-day use!')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)