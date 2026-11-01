import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { EggProvider } from '@course/lib/eggContext'
import { PrefsProvider } from '@course/lib/prefs'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrefsProvider>
      <EggProvider>
        <App />
      </EggProvider>
    </PrefsProvider>
  </StrictMode>,
)
