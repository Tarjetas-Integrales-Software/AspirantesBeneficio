import { APP_VERSION } from './version';

export const environment = {
    production: true,
    apiUrl: 'https://backmibeneficio.tisaweb.mx/api/v1',
    baseUrl: 'https://backmibeneficio.tisaweb.mx',
    cryptoKey: 'Tisa.2025',
    syncInterval: 600000,
    syncCurpInterval: 300000,
    syncMonitorInterval: 900000,
    syncAsistenciaInterval: 30000,
    syncArchivosDigitalizadosInterval: 10000,
    gitversion: APP_VERSION
};
