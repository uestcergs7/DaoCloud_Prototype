import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'
import { I18nProvider } from './I18nContext.tsx'
import './index.css'

// Read language from URL param (set by Portal iframe)
const params = new URLSearchParams(window.location.search);
const lang = params.get('lang') || 'zh';

// Listen for language change messages from Portal
window.addEventListener('message', (event) => {
  if (event.data?.type === 'CHANGE_LANG') {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', event.data.lang);
    window.location.href = url.toString();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider lang={lang}>
      <HashRouter>
        <App />
      </HashRouter>
    </I18nProvider>
  </React.StrictMode>,
)
