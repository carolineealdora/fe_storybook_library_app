import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { SessionProvider } from './features/session/SessionProvider'
import { createAppRouter } from './router'
import './styles/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root is missing from index.html')

createRoot(root).render(
  <StrictMode>
    <SessionProvider>
      <RouterProvider router={createAppRouter()} />
    </SessionProvider>
  </StrictMode>,
)
