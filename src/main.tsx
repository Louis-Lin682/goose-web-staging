import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AdminNotificationsProvider } from './context/AdminNotificationsProvider'
import { CartProvider } from './context/CartProvider'
import { AuthProvider } from './context/AuthProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AdminNotificationsProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AdminNotificationsProvider>
    </AuthProvider>
  </StrictMode>,
)
