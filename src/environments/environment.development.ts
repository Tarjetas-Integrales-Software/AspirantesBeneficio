import { APP_VERSION } from './version';

export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000/api/v1',
  baseUrl: 'http://127.0.0.1:8000',
  cryptoKey: 'Tisa.2025',
  syncInterval: 60 * 1000 * 60,
  syncCurpInterval: 30 * 1000 * 60,
  syncMonitorInterval: 9 * 1000,
  syncAsistenciaInterval: 30 * 1000, //segundos
  syncArchivosDigitalizadosInterval: 2 * 1000 * 60,
  syncCargarArchivosPendientes: 5 * 1000 * 60, //minutos
  gitversion: APP_VERSION
};
