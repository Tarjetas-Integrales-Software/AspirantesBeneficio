const { app, BrowserWindow } = require('electron');
const { updateElectronApp } = require('update-electron-app');

const path = require('path');
const url = require('url');

let mainWindow;

updateElectronApp();

if (require('electron-squirrel-startup')) app.quit();

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // Cargar la aplicación Angular
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, 'dist/aspirantes-beneficio/browser/index.html'),
            protocol: 'file:',
            slashes: true,
        })
    );

    // Abrir las herramientas de desarrollo (opcional)
    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});