import { APP_VERSION } from './version';

export const environment = {
  production: false,
  apiUrl: 'http://192.168.1.182:8000/api/v1',
  baseUrl: 'http://192.168.1.182:8000',
  cryptoKey: 'Tisa.2025',
  syncInterval: 60000,
  syncCurpInterval: 30000,
  syncMonitorInterval: 90000,
  syncAsistenciaInterval: 30000,
  gitversion: APP_VERSION
};
