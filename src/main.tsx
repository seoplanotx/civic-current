import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initContent } from './content/init'
import { ClerkProvider } from './auth/ClerkProvider'
import { AuthBridge } from './auth/AuthBridge'

// Bootstrap the content layer before mounting the React tree so the first
// render already has the base pack's terrains, buildings, and event deck
// available through the registry hooks.
initContent()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider>
      {/* AuthBridge mounts once, plumbs Clerk's session into apiClient,
          and reloads entitlements from /api/entitlements on sign-in. */}
      <AuthBridge />
      <App />
    </ClerkProvider>
  </StrictMode>,
)
