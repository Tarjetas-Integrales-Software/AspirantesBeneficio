const { app, BrowserWindow, Menu, ipcMain } = require('electron'); // Added ipcMain
const { updateElectronApp } = require('update-electron-app');
const Database = require('better-sqlite3');
const path = require('path');
const url = require('url');

let mainWindow;
let db; // Declare db as a global variable

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

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ct_aspirantes_beneficio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_modalidad INTEGER,
        curp TEXT NOT NULL,
        nombre_completo TEXT NOT NULL,
        telefono TEXT NOT NULL,
        email TEXT,
        fecha_nacimiento TEXT,
        estado TEXT NOT NULL,
        municipio TEXT NOT NULL,
        ciudad TEXT NOT NULL,
        cp TEXT NOT NULL,
        colonia TEXT NOT NULL,
        tipo_asentamiento TEXT,
        tipo_zona TEXT NOT NULL,
        domicilio TEXT NOT NULL,
        com_obs TEXT,
        fecha_evento TEXT NOT NULL,
        created_id INTEGER NOT NULL,
        updated_id INTEGER,
        deleted_id INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ct_fotos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_status INTEGER NOT NULL,
        fecha TEXT NOT NULL,
        tipo TEXT NOT NULL,
        archivo TEXT NOT NULL,
        path TEXT NOT NULL,
        archivoOriginal TEXT NOT NULL,
        extension TEXT NOT NULL,
        created_id INTEGER NOT NULL,
        updated_id INTEGER,
        deleted_id INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sy_aspirantes_beneficio_fotos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_aspirante_beneficio INTEGER,
        id_foto INTEGER,
        id_status INTEGER,
        created_id INTEGER,
        updated_id INTEGER,
        deleted_id INTEGER,
        created_at TEXT,
        updated_at TEXT,
        deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS CS_CodigosPostales_Colonias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estado TEXT NOT NULL,
        municipio TEXT NOT NULL,
        ciudad TEXT,
        cp TEXT NOT NULL,
        colonia TEXT NOT NULL,
        tipo_asentamiento TEXT NOT NULL,
        tipo_zona TEXT NOT NULL,
        created_id INTEGER,
        updated_id INTEGER,
        deleted_id INTEGER,
        created_at TEXT,
        updated_at TEXT,
        deleted_at TEXT
    );

      CREATE TABLE IF NOT EXISTS cat_ct_modalidades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_tipo_beneficio INTEGER NULL,
        nombre TEXT NULL,
        descripcion TEXT NULL,
        imagen TEXT NULL,
        created_id INTEGER NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL,
        created_at TEXT NULL,
        updated_at TEXT NULL,
        deleted_at TEXT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NULL,
        p_surname TEXT NULL,
        m_surname TEXT NULL,
        electoralid TEXT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        created_id INTEGER NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL,
        created_at TEXT NULL,
        updated_at TEXT NULL,
        deleted_at TEXT NULL
      );
    `);
  } catch (error) {
    console.error('Error creating table:', error);
  }

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
