import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initThemeListener } from './utils/theme';

// Inicializar escucha de modo oscuro automático según el SO móvil
initThemeListener();

function mountPuertoUsuarioApp() {
  const container =
    document.getElementById('puerto-usuario-root') ||
    document.getElementById('root');

  if (container) {
    // Si contiene el placeholder de WordPress, limpiarlo
    container.innerHTML = '';
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    console.error(
      '[Puerto Analítico] No se encontró el contenedor #puerto-usuario-root para inicializar la aplicación.'
    );
  }
}

// Iniciar al cargar el DOM o inmediatamente si ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountPuertoUsuarioApp);
} else {
  mountPuertoUsuarioApp();
}

// Registro de Service Worker con ruta absoluta para evitar 404 en WordPress
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/wp-content/uploads/puerto-app/service-worker.js')
      .then((reg) => {
        console.log('[Puerto PWA] Service Worker registrado exitosamente:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Puerto PWA] Error al registrar Service Worker:', err);
      });
  });
}
