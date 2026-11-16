import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Badge } from '../components/common/Badge';
import { NavigationTabs } from '../components/common/NavigationTabs';
import { Header } from '../components/common/Header';
import { ConsultoriosSelector } from '../components/booking/ConsultoriosSelector';
import { useAuthStore } from '../store/useAuthStore';
import { useConsultoriosStore } from '../store/useConsultoriosStore';
import { useUiStore } from '../store/useUiStore';

describe('UI Components', () => {
  beforeEach(() => {
    useUiStore.getState().setActiveTab('reservar');
  });

  it('Badge renderiza su contenido', () => {
    render(<Badge variant="emerald">Activo</Badge>);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('NavigationTabs cambia la pestaña activa', () => {
    render(<NavigationTabs />);

    const botonMisReservas = screen.getByText('Mis Reservas');
    fireEvent.click(botonMisReservas);

    expect(useUiStore.getState().activeTab).toBe('mis-reservas');
  });

  it('Header muestra el nombre del terapeuta y horas de saldo', () => {
    useAuthStore.setState({
      perfil: {
        id: 10,
        username: 'dra_elena',
        nombre: 'Dra. Elena Silva',
        email: 'elena@example.com',
        roles: ['puerto_paciente'],
        tipo_membresia: 'prepago',
        estado: 'activo',
        fecha_alta: '2026-11-01',
        notas: null,
        puede_reservar: true,
      },
      saldos: {
        horas_compradas: 20,
        horas_apartadas: 5,
        horas_consumidas: 0,
        horas_disponibles: 15,
        fecha_vencimiento: '2027-05-13',
        saldos: [],
        resumen: { total_horas_disponibles: 15, paquetes_vigentes_cantidad: 1 },
      },
    });

    render(<Header />);
    expect(screen.getByText('Dra. Elena Silva')).toBeInTheDocument();
    expect(screen.getByText('15 hrs')).toBeInTheDocument();
  });

  it('ConsultoriosSelector renderiza los consultorios disponibles', () => {
    useConsultoriosStore.setState({
      consultorios: [
        {
          id: 1,
          nombre: 'Verde',
          color: '#2E7D32',
          activo: true,
          google_calendar_id: null,
          capacidad_fisica_semanal_horas: 74,
          capacidad_max_semanal_horas: 72,
          horas_mantenimiento_semanal: 2,
          disponibilidad_semanal: {
            semana_inicio: '2026-11-23',
            semana_fin: '2026-11-29',
            horas_ocupadas: 10,
            horas_disponibles: 62,
            horas_disponibles_fisicas: 62,
            porcentaje_ocupacion_fisica: 13.5,
            porcentaje_ocupacion_vendible: 13.9,
            porcentaje_ocupacion: 13.9,
          },
        },
      ],
      consultorioSeleccionadoId: 1,
    });

    render(<ConsultoriosSelector />);
    expect(screen.getByText('Verde')).toBeInTheDocument();
    expect(screen.getByText('62h libres')).toBeInTheDocument();
  });
});
