const { app, BrowserWindow, Menu } = require('electron');
const { updateElectronApp } = require('update-electron-app');

const Database = require('better-sqlite3');

const path = require('path');
const url = require('url');

let mainWindow;

updateElectronApp();

if (require('electron-squirrel-startup')) app.quit();

app.setAppUserModelId("com.squirrel.tisa.aspirantesbeneficio");

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

    Menu.setApplicationMenu(null);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function initializeDatabase() {
    // Ruta de la base de datos en la carpeta de datos del usuario
    const dbPath = path.join(app.getPath('userData'), 'mydb.sqlite');
    db = new Database(dbPath);

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
      );
    `);

    // Maneja solicitudes de consulta desde Angular
    ipcMain.handle('query', (event, sql, params) => {
        const stmt = db.prepare(sql);
        return stmt.all(params);
    });

    // Maneja solicitudes de ejecución desde Angular
    ipcMain.handle('execute', (event, sql, params) => {
        const stmt = db.prepare(sql);
        return stmt.run(params);
    });
}

// Inicializa la aplicación cuando esté lista
app.whenReady().then(() => {
    initializeDatabase();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});