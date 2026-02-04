import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../globals.css'
import '@/core/ipc/tauriBridge'

// Force dark mode
document.documentElement.classList.add('dark')

// Disable context menu global listener


ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
