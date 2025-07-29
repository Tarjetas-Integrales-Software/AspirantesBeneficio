import { APP_VERSION } from './version';

export const environment = {
  production: true,
  apiUrl: 'https://backmibeneficio.tisaweb.mx/api/v1',
  baseUrl: 'https://backmibeneficio.tisaweb.mx',
  cryptoKey: 'Tisa.2025',
  syncInterval: 60 * 1000 * 60,
  syncCurpInterval: 30 * 1000 * 60,
  syncMonitorInterval: 9 * 1000,
  syncAsistenciaInterval: 30 * 1000, //segundos
  syncArchivosDigitalizadosInterval: 2 * 1000 * 60,
  syncCargarArchivosPendientes: 5 * 1000 * 60, //minutos
  gitversion: APP_VERSION
};
