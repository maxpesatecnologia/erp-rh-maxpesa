import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

const splash = document.getElementById('app-splash')
if (splash) {
  requestAnimationFrame(() => {
    splash.classList.add('app-splash-hidden')
    setTimeout(() => splash.remove(), 400)
  })
}
