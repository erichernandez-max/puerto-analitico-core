export interface ReglasConfig {
  cancelacionHorasMinimas: number;
  bloqueMinHoras: number;
  horarioLvInicio: string;
  horarioLvFin: string;
  horarioSabInicio: string;
  horarioSabFin: string;
  domingoCerrado: boolean;
  timezone: string;
}

export interface PuertoConfig {
  apiUrl: string;
  nonce: string;
  isLoggedIn: boolean;
  userId: number;
  tz: string;
  logoUrl: string;
  canReserve: boolean;
  isAdmin: boolean;
  reglas: ReglasConfig;
}

declare global {
  interface Window {
    PuertoConfig?: PuertoConfig;
    puertoConfig?: PuertoConfig;
  }
}
