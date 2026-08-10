import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query/queryClient.ts'
import { purgeLegacySession } from './lib/auth/purgeLegacySession.ts'
import './index.css'
import App from './App.tsx'

// Antes do render: limpa dados de cartão que o onboarding antigo deixou no
// localStorage dos navegadores que já passaram por ele.
purgeLegacySession()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
