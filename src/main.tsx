import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useAuthStore } from './store/auth'

// Auto-login via ?user=ze
const USERS: Record<string, string> = { hugo: 'Hugo', ze: 'Zé', lisa: 'Lisa' }
const params = new URLSearchParams(window.location.search)
const userParam = params.get('user')?.toLowerCase()
if (userParam && USERS[userParam]) {
  useAuthStore.getState().setUser(userParam, USERS[userParam])
  // Clean URL
  window.history.replaceState({}, '', window.location.pathname)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
