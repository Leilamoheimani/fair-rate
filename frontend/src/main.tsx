import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const Admin = lazy(() => import('./Admin'))
const isAdminRoute = window.location.hash.startsWith('#/admin')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAdminRoute ? <Suspense><Admin /></Suspense> : <App />}
  </React.StrictMode>,
)
