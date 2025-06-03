console.log('✅ preload.js cargado');
global.fromPreload = true;


const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getImage: (imageName, path) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('get-image', imageName, path);
      ipcRenderer.once('image-read-success', (event, data) => resolve(data));
      ipcRenderer.once('image-read-error', (event, err) => reject(err));
    });
  },
  getFile: (fileName) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('get-pdf', fileName);
      ipcRenderer.once('pdf-read-success', (event, data) => resolve(data));
      ipcRenderer.once('pdf-read-error', (event, err) => reject(err));
    });
  },
  getDigitalizedFile: (fileName) => {
    return new Promise((resolve, reject) => {
      const requestId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      ipcRenderer.once(`pdf-read-success-${requestId}`, resolve);
      ipcRenderer.once(`pdf-read-error-${requestId}`, reject);

      ipcRenderer.send('get-archivo-digitalizado', {
        fileName,
        requestId
      });
    });
  },
  getSerialNumber: () => ipcRenderer.invoke('get-serial-number'),
  savePhoto: (imageData, name, path) => {
    ipcRenderer.send('save-image', imageData, name, path);
  },
  savePdf: (pdfData, fileName) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('save-pdf', pdfData, fileName);
      ipcRenderer.once('pdf-save-success', resolve);
      ipcRenderer.once('pdf-save-error', reject);
    });
  },
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printIdCard: (data) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('print-id-card-manual', data);
      ipcRenderer.once('print-id-card-success', resolve);
      ipcRenderer.once('print-id-card-error', reject);
    });
  },
  fs: {
    readFileSync: (filePath, encoding = 'utf8') => fs.readFileSync(filePath, encoding),
    writeFileSync: (filePath, data) => fs.writeFileSync(filePath, data),
    existsSync: (filePath) => fs.existsSync(filePath),
    mkdirSync: (dirPath, options) => fs.mkdirSync(dirPath, options),
    // expón las funciones de fs que necesites
  },
  path: {
    join: (...args) => path.join(...args),
    basename: (p) => path.basename(p),
    // expón las funciones de path que necesites
  }
});