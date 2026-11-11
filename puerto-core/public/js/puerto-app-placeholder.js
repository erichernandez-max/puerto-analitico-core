/**
 * Puerto Analítico - Placeholder para aplicación de usuario React (Fase F3)
 */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        var root = document.getElementById('puerto-usuario-root');
        if (!root) {
            return;
        }

        var config = window.PuertoConfig || {};

        root.innerHTML = [
            '<div class="puerto-card">',
            '  <div class="puerto-badge">Fase F1 - Backend Core Activo</div>',
            '  <h3 class="puerto-title">Puerto Analítico &bull; Portal de Reservas</h3>',
            '  <p class="puerto-desc">El backend REST (<code>puerto/v1</code>) está instalado y respondiendo. En la Fase F3 esta vista será reemplazada automáticamente por la aplicación React de reserva y gestión de saldos.</p>',
            '  <div class="puerto-status-grid">',
            '    <div class="puerto-status-item"><strong>Estado Usuario:</strong> ' + (config.isLoggedIn ? '<span class="status-ok">Autenticado (ID #' + config.userId + ')</span>' : '<span class="status-warn">No autenticado (inicia sesión)</span>') + '</div>',
            '    <div class="puerto-status-item"><strong>Permiso para Reservar:</strong> ' + (config.canReserve ? '<span class="status-ok">Habilitado</span>' : '<span class="status-warn">Sin permiso (rol puerto_paciente requerido)</span>') + '</div>',
            '    <div class="puerto-status-item"><strong>API Endpoint:</strong> <code>' + (config.apiUrl || '') + '</code></div>',
            '    <div class="puerto-status-item"><strong>Zona Horaria Negocio:</strong> ' + (config.reglas ? config.reglas.timezone : 'America/Mexico_City') + '</div>',
            '  </div>',
            '</div>'
        ].join('\n');
    });
})();
