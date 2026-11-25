import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initThemeListener } from './utils/theme';

// Inicializar escucha de modo oscuro automático según el SO móvil
initThemeListener();

function mountPuertoAdminApp() {
  const container = document.getElementById('puerto-admin-root') || document.getElementById('root');
  if (container) {
    container.innerHTML = '';
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    console.error('[Puerto Admin] No se encontró el contenedor #puerto-admin-root');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountPuertoAdminApp);
} else {
  mountPuertoAdminApp();
}
