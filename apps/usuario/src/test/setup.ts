import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

// Configuración global mock de PuertoConfig en window
beforeEach(() => {
  window.PuertoConfig = {
    apiUrl: 'https://test.puertoanalitico.mx/wp-json/puerto/v1',
    nonce: 'test-nonce-123',
    isLoggedIn: true,
    userId: 10,
    tz: 'America/Mexico_City',
    logoUrl: '/icons/icon-192.png',
    canReserve: true,
    isAdmin: false,
    reglas: {
      cancelacionHorasMinimas: 24,
      bloqueMinHoras: 3,
      horarioLvInicio: '08:00',
      horarioLvFin: '21:00',
      horarioSabInicio: '08:00',
      horarioSabFin: '17:00',
      domingoCerrado: true,
      timezone: 'America/Mexico_City',
    },
  };
});
