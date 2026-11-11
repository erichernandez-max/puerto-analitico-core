/**
 * Puerto Analítico - Placeholder para aplicación administrativa React (Fase F4)
 */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        var root = document.getElementById('puerto-admin-root');
        if (!root) {
            return;
        }

        var config = window.PuertoConfig || {};

        root.innerHTML = [
            '<div class="puerto-admin-card">',
            '  <div class="puerto-badge admin-badge">Fase F1 - Panel de Administración</div>',
            '  <h3 class="puerto-admin-title">Puerto Analítico &bull; Gestión Administrativa</h3>',
            '  <p class="puerto-admin-desc">Panel administrativo preparado. En la Fase F4 aquí se inyectará el dashboard React con métricas, bloqueo masivo de consultorios, ajuste de saldos y control de terapeutas.</p>',
            '  <div class="puerto-status-grid">',
            '    <div class="puerto-status-item"><strong>Administrador:</strong> ' + (config.isAdmin ? '<span class="status-ok">manage_options Verificado</span>' : '<span class="status-err">No autorizado</span>') + '</div>',
            '    <div class="puerto-status-item"><strong>API Endpoint:</strong> <code>' + (config.apiUrl || '') + '</code></div>',
            '    <div class="puerto-status-item"><strong>Anticipación Cancelación:</strong> ' + (config.reglas ? config.reglas.cancelacionHorasMinimas + ' horas' : '24 horas') + '</div>',
            '    <div class="puerto-status-item"><strong>Horario Lunes-Viernes:</strong> ' + (config.reglas ? config.reglas.horarioLvInicio + ' a ' + config.reglas.horarioLvFin : '08:00 a 21:00') + '</div>',
            '  </div>',
            '</div>'
        ].join('\n');
    });
})();
