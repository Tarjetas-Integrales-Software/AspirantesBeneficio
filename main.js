const { app, BrowserWindow, Menu, ipcMain, dialog, webContents } = require('electron');
const { updateElectronApp } = require('update-electron-app');
const Database = require('better-sqlite3');
const url = require('url');
const fs = require('fs');
const path = require('path');

//Impresion de Credencial
const { exec } = require('child_process');
const axios = require('axios');
const { jsPDF } = require("jspdf");

const packageJson = require('./package.json');
const si = require('systeminformation');

let mainWindow;
let db; // Declare db as a global variable

if (process.platform === 'win32') {
  const sumatraPath = app.isPackaged
    ? path.join(process.resourcesPath, 'SumatraPDF.exe')
    : path.join(__dirname, '../tools/SumatraPDF.exe');

  app.commandLine.appendSwitch('pdf-viewer-path', sumatraPath);
}

updateElectronApp();

if (require('electron-squirrel-startup')) app.quit();

app.setAppUserModelId("com.squirrel.tisa.aspirantesbeneficio");

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      // enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js'), // Ruta absoluta
    },
  });

  // Cargar la aplicación Angular desde la build
  mainWindow.loadFile(
    path.join(__dirname, 'dist/aspirantes-beneficio/browser/index.html')
  );

  mainWindow.removeMenu();

  // Abre consola (para debug)
  // mainWindow.on('ready-to-show', () => {
  //   mainWindow.webContents.openDevTools();
  // });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function sendAppInfo() {
  try {
    // obtener la version de la aplicacion
    const currentVersion = packageJson.version;
    console.log('Version de la aplicacion:', currentVersion);

    // Obtener información del sistema
    const systemInfo = await si.system();
    const serialNumber = systemInfo.serial || 'Desconocido';

    if (serialNumber == 'Desconocido') {
      serialNumber = await getWindowsSerialNumber();
    }

    console.log(`Version: ${currentVersion}, Numero de serie: ${serialNumber}`);
  } catch (error) {
    console.error('Error al obtener información del sistema o enviarla:', error);
  }
}

function getWindowsSerialNumber() {
  return new Promise((resolve, reject) => {
    exec('wmic bios get serialnumber', (error, stdout) => {
      if (error) {
        return reject(error);
      }
      const serial = stdout.split('\n')[1].trim();
      resolve(serial || 'Desconocido');
    });
  });
}

function eliminarConfiguracionModulo() {
  try {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cat_ct_configuraciones';").get();

    if (row) {
      const stmt = db.prepare("DELETE FROM cat_ct_configuraciones WHERE clave = ?;");
      const result = stmt.run('modulo');

      if (result.changes > 0) console.log("Registro eliminado con éxito.");
      else console.log("No se encontró ningún registro con clave 'modulo'.");
    } else console.log("La tabla no existe, no se puede eliminar el registro.");
  } catch (error) {
    console.error('Error al eliminar el registro:', error);
  }
}

function addColumnIfNotExists() {
  try {
    // Verificar y agregar columna 'modulo' en ct_aspirantes_beneficio
    const rowsAspirantes = db.prepare("PRAGMA table_info(ct_aspirantes_beneficio);").all();
    const columnExists_modulo = rowsAspirantes.some(row => row.name === 'modulo');
    if (!columnExists_modulo) {
      db.prepare("ALTER TABLE ct_aspirantes_beneficio ADD COLUMN modulo TEXT NULL;").run();
    }

    // Verificar y agregar columnas en sy_config_digitalizador
    const rowsConfiguracionDigitalizador = db.prepare("PRAGMA table_info(sy_config_digitalizador);").all();
    const rowsGruposDigitalizador = db.prepare("PRAGMA table_info(digitalizador_grupos);").all();
    const rowsArchivosDigitalizar = db.prepare("PRAGMA table_info(archivos_digitalizar);").all();


    // Verificar columna 'extension'
    const columnExists_extension = rowsConfiguracionDigitalizador.some(row => row.name === 'extension');
    if (!columnExists_extension) {
      db.prepare("ALTER TABLE sy_config_digitalizador ADD COLUMN extension TEXT NULL;").run();
    }

    // Verificar columna 'peso_minimo'
    const columnExists_peso_minimo = rowsConfiguracionDigitalizador.some(row => row.name === 'peso_minimo');
    if (!columnExists_peso_minimo) {
      db.prepare("ALTER TABLE sy_config_digitalizador ADD COLUMN peso_minimo REAL NULL;").run();
    }

    // Verificar columna 'tipo'
    const columnExists_tipo = rowsConfiguracionDigitalizador.some(row => row.name === 'tipo');
    if (!columnExists_tipo) {
      db.prepare("ALTER TABLE sy_config_digitalizador ADD COLUMN tipo TEXT NULL;").run();
    }

    // Verificar columna 'regex_curp'
    const columnExists_regex_curp = rowsConfiguracionDigitalizador.some(row => row.name === 'regex_curp');
    if (!columnExists_regex_curp) {
      db.prepare("ALTER TABLE sy_config_digitalizador ADD COLUMN regex_curp TEXT NULL;").run();
    }

    // Verificar columna 'qr'
    const columnExists_qr = rowsConfiguracionDigitalizador.some(row => row.name === 'qr');
    if (!columnExists_qr) {
      db.prepare("ALTER TABLE sy_config_digitalizador ADD COLUMN qr INTEGER NULL;").run();
    }

    // Verificar columna 'barras'
    const columnExists_barras = rowsConfiguracionDigitalizador.some(row => row.name === 'barras');
    if (!columnExists_barras) {
      db.prepare("ALTER TABLE sy_config_digitalizador ADD COLUMN barras INTEGER NULL;").run();
    }

    // Verificar columna 'fecha_expediente'
    const columnExists_fecha_expediente = rowsGruposDigitalizador.some(row => row.name === 'fecha_expediente');
    if (!columnExists_fecha_expediente) {
      db.prepare("ALTER TABLE digitalizador_grupos ADD COLUMN fecha_expediente TEXT NULL;").run();
    }

    // Verificar columna 'grupo'
    const columnExists_grupo = rowsArchivosDigitalizar.some(row => row.name === 'grupo');
    if (!columnExists_grupo) {
      db.prepare("ALTER TABLE archivos_digitalizar ADD COLUMN grupo TEXT NULL;").run();
    }

  } catch (error) {
    console.error('Error altering table:', error);
  }
}

function initializeDatabase() {
  // Ruta de la base de datos en la carpeta de datos del usuario
  const dbPath = path.join(app.getPath('userData'), 'mydb.sqlite');

  console.log('Database path:', dbPath);

  db = new Database(dbPath);

  // Eliminacion de tablas en caso de ser requerido
  eliminarConfiguracionModulo();

  // Creacion de tablas en caso de no existir
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ct_aspirantes_beneficio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_modalidad INTEGER NOT NULL,
        curp TEXT NOT NULL,
        nombre_completo TEXT NOT NULL,
        nombre TEXT NOT NULL,
        apellido_paterno TEXT NOT NULL,
        apellido_materno TEXT NOT NULL,
        telefono TEXT NOT NULL,
        email TEXT NULL,
        fecha_nacimiento TEXT NULL,
        grado TEXT NULL,
        tipo_carrera TEXT NULL,
        carrera TEXT NULL,
        estado TEXT NULL,
        municipio TEXT NOT NULL,
        ciudad TEXT NULL,
        cp TEXT NOT NULL,
        colonia TEXT NOT NULL,
        tipo_asentamiento TEXT NULL,
        tipo_zona TEXT NULL,
        domicilio TEXT NOT NULL,
        com_obs TEXT NULL,
        fecha_evento TEXT NOT NULL,
        modulo TEXT NULL,
        created_id INTEGER NOT NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NULL,
        deleted_at TEXT NULL
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
        enviado INTEGER NULL,
        confirmado INTEGER NULL,
        created_id INTEGER,
        updated_id INTEGER,
        deleted_id INTEGER,
        created_at TEXT,
        updated_at TEXT,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS CS_CodigosPostales_Colonias (
        id INTEGER PRIMARY KEY,
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
        id INTEGER PRIMARY KEY,
        id_tipo_beneficio INTEGER NULL,
        nombre TEXT NULL,
        descripcion TEXT NULL,
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
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_id INTEGER NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL,
        created_at TEXT NULL,
        updated_at TEXT NULL,
        deleted_at TEXT NULL
      );

      CREATE TABLE IF NOT EXISTS cat_ct_configuraciones (
        id INTEGER PRIMARY KEY,
        id_equipo INTEGER NOT NULL,
        clave TEXT NOT NULL UNIQUE,
        valor TEXT NULL,
        descripcion TEXT NULL,
        created_id INTEGER NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL,
        created_at TEXT NULL,
        updated_at TEXT NULL,
        deleted_at TEXT NULL
      );

      CREATE TABLE IF NOT EXISTS cs_opciones_generales (
        id INTEGER PRIMARY KEY,
        opcion_general TEXT NULL UNIQUE,
        orden INTEGER NULL,
        valor TEXT NULL,
        agrupador TEXT NULL,
        descripcion TEXT NULL,
        created_at DATETIME NULL,
        updated_at DATETIME NULL,
        deleted_at DATETIME NULL,
        created_id INTEGER NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL
      );

      CREATE TABLE IF NOT EXISTS cat_curps_registradas (
        curp TEXT PRIMARY KEY NULL
      );

      CREATE TABLE IF NOT EXISTS cat_cs_grados (
        id INTEGER PRIMARY KEY,
        nombre TEXT NULL UNIQUE,
        descripcion TEXT NULL,
        created_at DATETIME NULL,
        updated_at DATETIME NULL,
        deleted_at DATETIME NULL,
        created_id INTEGER NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL
      );

      CREATE TABLE IF NOT EXISTS cat_cs_tipos_carreras (
        id INTEGER PRIMARY KEY,
        id_grado INTEGER NULL,
        nombre TEXT NULL UNIQUE,
        descripcion TEXT NULL,
        created_at DATETIME NULL,
        updated_at DATETIME NULL,
        deleted_at DATETIME NULL,
        created_id INTEGER NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL
      );


      CREATE TABLE IF NOT EXISTS cat_cs_carreras (
        id INTEGER PRIMARY KEY,
        id_grado INTEGER NULL,
        id_tipo INTEGER NULL,
        nombre TEXT NULL UNIQUE,
        descripcion TEXT NULL,
        created_at DATETIME NULL,
        updated_at DATETIME NULL,
        deleted_at DATETIME NULL,
        created_id INTEGER NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL
      );

      CREATE TABLE IF NOT EXISTS ct_curps_a_eliminar (
        curp TEXT PRIMARY KEY NULL,
        confirmo_eliminacion INTEGER NULL,
        created_at DATETIME NULL,
        updated_at DATETIME NULL,
        deleted_at DATETIME NULL,
        created_id INTEGER NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL
      );

      CREATE TABLE IF NOT EXISTS cat_ct_modulos (
        id INTEGER PRIMARY KEY,
        nombre INTEGER NULL,
        descripcion TEXT NULL,
        created_id INTEGER NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL,
        created_at TEXT NULL,
        updated_at TEXT NULL,
        deleted_at TEXT NULL
      );

      CREATE TABLE IF NOT EXISTS cs_monitor_equipos (
        id INTEGER PRIMARY KEY,
        numero_serial TEXT,
        version_instalada TEXT,
        app_en_ejecucion TEXT,
        usuario_ejecutando_app TEXT,
        lat TEXT,
        lng TEXT,
        created_at TEXT,
        updated_at TEXT,
        deleted_at TEXT,
        created_id INTEGER,
        updated_id INTEGER,
        deleted_id INTEGER
      );

      CREATE TABLE IF NOT EXISTS relacion_asistencia_fotos (
        id INTEGER PRIMARY KEY,
        id_asistencia INTEGER NULL,
        id_cajero_foto INTEGER NULL,
        id_status INTEGER NULL,
        sincronizado INTEGER NULL,
        created_id INTEGER NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL,
        created_at TEXT NULL,
        updated_at TEXT NULL,
        deleted_at TEXT NULL
      );

      CREATE TABLE IF NOT EXISTS cajeros_asistencia (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_user INTEGER,
        fecha_hora TEXT,
        id_tipo INTEGER,
        id_modulo INTEGER,
        created_id INTEGER NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL,
        created_at TEXT NULL,
        updated_at TEXT NULL,
        deleted_at TEXT NULL
      );

      CREATE TABLE IF NOT EXISTS cajeros_fotos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_status INTEGER,
        fecha TEXT,
        tipo TEXT,
        archivo TEXT,
        path TEXT,
        archivoOriginal TEXT,
        extension TEXT,
        created_id INTEGER NULL,
        updated_id INTEGER NULL,
        deleted_id INTEGER NULL,
        created_at TEXT NULL,
        updated_at TEXT NULL,
        deleted_at TEXT NULL
      );

      CREATE TABLE IF NOT EXISTS ct_documentos (
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

    CREATE TABLE IF NOT EXISTS sy_aspirantes_beneficio_documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_aspirante_beneficio INTEGER,
      id_documento INTEGER,
      id_status INTEGER,
      enviado INTEGER NULL,
      confirmado INTEGER NULL,
      created_id INTEGER,
      updated_id INTEGER,
      deleted_id INTEGER,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sy_config_digitalizador (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      ruta_digitalizados TEXT NULL,
      ruta_enviados TEXT NULL,
      tiempo_sync INTEGER NULL
    );

    CREATE TABLE IF NOT EXISTS ct_tipos_documentos_digitalizador (
      id INTEGER PRIMARY KEY,
      tipo_doc_dig TEXT NULL,
      created_id INTEGER,
      updated_id INTEGER,
      deleted_id INTEGER,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ct_contenedores (
      id INTEGER PRIMARY KEY,
      nombre TEXT NULL,
      descripcion_contenedor TEXT NULL,
      descripcion_ubicacion TEXT NULL,
      created_id INTEGER,
      updated_id INTEGER,
      deleted_id INTEGER,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ct_extensiones (
      id INTEGER PRIMARY KEY,
      nombre TEXT NULL,
      created_id INTEGER,
      updated_id INTEGER,
      deleted_id INTEGER,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ct_nombres_archivos_upload (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NULL,
      created_id INTEGER,
      updated_id INTEGER,
      deleted_id INTEGER,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS digitalizador_grupos (
      id INTEGER PRIMARY KEY,
      id_tipo_documento_digitalizacion TEXT,
      nombre_archivo_upload TEXT,
      fecha_expediente TEXT NULL,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS archivos_digitalizar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NULL,
      tipo INTEGER NULL,
      curp TEXT NULL,
      carpetaOrigen TEXT NULL,
      carpetaDestino TEXT NULL,
      extension TEXT NULL,
      grupo TEXT NULL,
      created_id INTEGER,
      updated_id INTEGER,
      deleted_id INTEGER,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS relacion_usuario_roles (
      pkUserPerfil INTEGER PRIMARY KEY,
      fkUser INTEGER NULL,
      fkRole INTEGER NULL,
      created_at TEXT NULL,
      updated_at TEXT NULL,
      creator_id INTEGER NULL,
      updated_id INTEGER NULL,
      deleted_id INTEGER NULL,
      deleted_at TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS configuracion (
      nombre TEXT PRIMARY KEY,
      intervalo INTEGER NULL,
      activo INTEGER NULL,
      curp TEXT NULL,
      created_id INTEGER,
      updated_id INTEGER,
      deleted_id INTEGER,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT
    );
    `);
  } catch (error) {
    console.error('Error creating table:', error);
  }

  // Ejecutar la función al iniciar Electron
  addColumnIfNotExists();

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
  sendAppInfo();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.handle('get-printers', async () => {
  if (!mainWindow) throw new Error('No se ha inicializado la ventana principal');

  return await mainWindow.webContents.getPrintersAsync();
});


ipcMain.handle('print', (event, pdfBuffer, printer) => {
  const dirPath = path.join(app.getPath("userData"), "aux");
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  const id = "id" + Math.random().toString(16).slice(2);
  const savePath = path.join(dirPath, id + ".pdf");

  // Guarda el buffer
  fs.writeFileSync(savePath, Buffer.from(pdfBuffer));

  return new Promise((resolve, reject) => {
    simplePrint(savePath, printer)
      .then((response) => {
        fs.unlinkSync(savePath);
        resolve(response);
      })
      .catch(err => {
        console.error('Error durante la impresión:', err);
        reject(err);
      });
  })
});


ipcMain.on('print-id-card', async (event, data, name) => {
  try {

    //se crea el archivo pdf
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [85, 54]
    });

    name = data.curp; //VARIABLE PARA EL NOMBRE DEL ARCHIVO PDF
    const dirPath = path.join(app.getPath("userData"), "credencialesgeneradas");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath); // Crear carpeta si no existe
    }
    const savePath_pdf = path.join(dirPath, name + ".pdf");

    const imageUrl = data.photoPath;
    const imagePath = path.join(app.getPath("userData"), "credencialesgeneradas/" + data.curp + '.jpg');
    console.log(imagePath, 'imagePath');

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(imagePath, response.data);


    /*----------------------------------------------*/


    // Convertir imagen a Base64
    const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });
    const imageFormat = path.extname(imagePath).toUpperCase().replace(".", ""); // Detectar formato (PNG/JPG)

    // Agregar imagen al PDF
    //doc.addImage(`data:image/${imageFormat};base64,${imageBase64}`, imageFormat, 20, 27, 70, 77);

    // Agregar la imagen (especificando en milímetros: x, y, ancho, alto)
    doc.addImage(
      `data:image/${imageFormat};base64,${imageBase64}`, // URL base64 de la imagen
      imageFormat,  // Formato de la imagen (JPEG, PNG, WEBP, etc.)
      6.2,           // Posición x en milímetros
      10,           // Posición y en milímetros
      24,           // Ancho de la imagen en milímetros
      28            // Alto de la imagen en milímetros
    );

    // Agregar datos a la credencial
    doc.setFontSize(6);
    doc.text(`${data.nombre_completo}`, 33, 16, { maxWidth: 120, lineBreak: false });         // Nombre

    doc.setFontSize(8);
    doc.text(`${data.curp}`, 33, 23.5, { maxWidth: 120, lineBreak: false });         // CURP
    doc.text(`${new Date().toISOString().substring(0, 10)}`, 33, 31, { maxWidth: 70, lineBreak: false });    // Fecha Expedicion
    doc.text(`${data.telefono}`, 58, 31, { maxWidth: 70, lineBreak: false });      // Telefono

    doc.save(savePath_pdf);

    event.reply("pdf-generado", `PDF guardado en: ${savePath_pdf}`);


    // CODIGO DAVID INICIO

    const pdfFilePath = path.resolve(savePath_pdf);
    const pdfFileUrl = 'file://' + pdfFilePath;

    printCard(pdfFilePath, data.printer)
      .then(() => console.log('Impresión completada'))
      .catch(err => console.error('Error durante la impresión:', err));

    // CODIGO DAVID FIN

    // Verificar si el archivo existe antes de intentar eliminarlo
    try {
      setTimeout(() => {
        if (fs.existsSync(imagePath)) {
          // El archivo existe, proceder a eliminarlo
          fs.unlinkSync(imagePath);
          console.log('El archivo ha sido eliminado exitosamente');
        } else {
          console.log('El archivo no existe, no se puede eliminar.');
        }
      }, 5000); // 5000 milisegundos = 5 segundos

    } catch (err) {
      console.error('Error al eliminar el archivo:', err);
    }


  } catch (error) {
    console.error("Error al generar el PDF:", error);
    event.reply("pdf-error", "Error al generar el PDF");
  }




});

ipcMain.handle('get-app-path', () => app.getPath('userData'))

ipcMain.on('print-id-card-manual', async (event, data, layout) => {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [85, 54] // Ancho x Alto en mm
    });

    const name = data.curp; // Nombre del archivo PDF
    const dirPath = path.join(app.getPath("userData"), "credencialesgeneradas");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath); // Crear carpeta si no existe
    }
    const savePath_pdf = path.join(dirPath, name + ".pdf");

    const imagePath = path.join(app.getPath("userData"), "credencialesgeneradas/" + data.curp + '.jpg');
    fs.writeFileSync(imagePath, Buffer.from(data.photoPath.split(",")[1], 'base64'));

    const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });
    const imageFormat = path.extname(imagePath).toUpperCase().replace(".", "");

    if (layout == 1) {
      doc.addImage(
        `data:image/${imageFormat};base64,${imageBase64}`,
        imageFormat,
        6.2,
        10,
        24,
        28
      );

      doc.setFontSize(6);
      doc.text(`${data.nombreBeneficiario}`, 33, 16, { maxWidth: 120, lineBreak: false });

      doc.setFontSize(8);
      doc.text(`${data.curp}`, 33, 23.5, { maxWidth: 120, lineBreak: false });
      doc.text(`${data.fechaExpedicion}`, 33, 31, { maxWidth: 70, lineBreak: false });
      doc.text(`${data.telefono}`, 58, 31, { maxWidth: 70, lineBreak: false });
    } else if (layout == 2) {
       doc.addImage(
        `data:image/${imageFormat};base64,${imageBase64}`,
        imageFormat,
        4,
        16,
        24,
        28
      );

      doc.setFontSize(7);

      doc.text(data.nombreBeneficiario, 33, 21, { maxWidth: 120, lineBreak: false });
      doc.text(data.curp, 33, 31, { maxWidth: 120, lineBreak: false });
    }

    doc.save(savePath_pdf);

    event.reply("pdf-generado", `PDF guardado en: ${savePath_pdf}`);

    const pdfFilePath = path.resolve(savePath_pdf);
    const pdfFileUrl = 'file://' + pdfFilePath;

    printCard(pdfFilePath, data.printer)
      .then(() => console.log('Impresión completada'))
      .catch(err => console.error('Error durante la impresión:', err));

    setTimeout(() => {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('El archivo ha sido eliminado exitosamente');
      } else {
        console.log('El archivo no existe, no se puede eliminar.');
      }
    }, 5000);

  } catch (error) {
    console.error("Error al generar el PDF:", error);
    event.reply("pdf-error", "Error al generar el PDF");
  }
});

app.on('window-all-closed', () => {
  if (db) db.close();
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on("save-image", (event, imageData, name, customPath) => {
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const dirPath = path.join(app.getPath("userData"), customPath);
  const savePath = path.join(dirPath, name + ".webp");

  // Crear la carpeta si no existe
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Guardar la imagen
  fs.writeFile(savePath, buffer, (err) => {
    if (err) {
      console.error("Error al guardar la imagen:", err);
      return;
    }
    console.log("Imagen guardada en:", savePath);
  });
});

ipcMain.on("get-image", (event, name, customPath) => {
  const dirPath = path.join(app.getPath("userData"), customPath);
  const filePath = path.join(dirPath, name + ".webp");

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("Error al leer la imagen:", err);
      event.reply("image-read-error", err);
      return;
    }
    event.reply("image-read-success", data);
  });
});

ipcMain.on("save-pdf", (event, pdfData, name) => {
  const dirPath = path.join(app.getPath("userData"), "pdfBeneficiarios");
  const savePath = path.join(dirPath, name + ".pdf");

  // Crear la carpeta si no existe
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Guardar el archivo PDF
  fs.writeFile(savePath, pdfData, (err) => {
    if (err) {
      console.error("Error al guardar el PDF:", err);
      return;
    }
    console.log("PDF guardado en:", savePath);
  });
});

ipcMain.on("get-pdf", (event, name) => {
  const dirPath = path.join(app.getPath("userData"), "pdfBeneficiarios");
  const filePath = path.join(dirPath, name + ".pdf");

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("Error al leer el archivo PDF:", err);
      event.reply("pdf-read-error", err);
      return;
    }
    event.reply("pdf-read-success", data);
  });
});

ipcMain.on("get-archivo-digitalizado", (event, args) => {
  const { fullPath, requestId } = args;

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      console.error("Error al leer el archivoo PDF:", err);
      event.sender.send(`pdf-read-error-${requestId}`, err.message);
      return;
    } else {
      event.sender.send(`pdf-read-success-${requestId}`, new Uint8Array(data));
    }
  });
});

ipcMain.handle("get-serial-number", async (event) => {
  // Obtener información del sistema
  const systemInfo = await si.system();
  let serialNumber = systemInfo.serial || 'Desconocido';

  return serialNumber;
});

async function printCard(pdfFileUrl, printerName) {
  return new Promise((resolve, reject) => {
    try {
      const pdfPath = pdfFileUrl.replace('file://', '').replace(/\//g, '\\');

      if (!fs.existsSync(pdfPath)) {
        return reject(new Error('Archivo PDF no encontrado: ' + pdfPath));
      }

      const sumatraPath = path.join(process.resourcesPath, 'SumatraPDF.exe');

      if (!fs.existsSync(sumatraPath)) {
        return reject(new Error('No se encontró SumatraPDF en: ' + sumatraPath));
      }

      const command = `"${sumatraPath}" -print-to "${printerName}" "${pdfPath}"`;

      console.log('Ejecutando comando:', command);

      exec(command, (err, stdout, stderr) => {
        if (err) {
          console.error('Error al imprimir:', err);
          return reject(err);
        }

        console.log('Impresión enviada correctamente');
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function simplePrint(pdfFileUrl, printerName) {
  return new Promise((resolve, reject) => {
    try {
      const pdfPath = pdfFileUrl.replace('file://', '').replace(/\//g, '\\');

      if (!fs.existsSync(pdfPath)) {
        return reject(new Error('Archivo PDF no encontrado: ' + pdfPath));
      }

      const sumatraPath = path.join(process.resourcesPath, 'SumatraPDF.exe');

      if (!fs.existsSync(sumatraPath)) {
        return reject(new Error('No se encontró SumatraPDF en: ' + sumatraPath));
      }

      const command = `"${sumatraPath}" -print-to "${printerName}" -print-settings "duplex=off" "${pdfPath}"`;

      exec(command, (err, stdout, stderr) => {
        if (err) {
          console.error('Error al imprimir:', err);
          return reject(err);
        }

        resolve('Impresión enviada correctamente');
      });
    } catch (error) {
      reject(error);
    }
  });
}

ipcMain.handle('select-folder', async (event, operation) => {
  const properties = operation === 'export' ? ['openDirectory', 'createDirectory'] : ['openDirectory'];
  const result = await dialog.showOpenDialog({
    properties: properties
  });

  if (result.canceled)
    return null;
  else
    return result.filePaths[0];
});

ipcMain.handle('get-filtered-files', (event, { folder, minSize, extension }) => {
  const files = fs.readdirSync(folder)
    .filter(file => {
      const fullPath = path.join(folder, file);
      const stats = fs.statSync(fullPath);
      return stats.isFile() &&
        (!minSize || (stats.size / 1024 >= minSize)) &&
        (!extension || file.endsWith(extension));
    });
  return files.map(file => path.join(folder, file));
});

ipcMain.handle('move-file-cross-device', async (event, src, dest) => {
  try {
    await moveFileCrossDevice(src, dest);
    return { success: true };
  } catch (error) {
    console.error('Error al mover archivo:', error);
    return { success: false, error: error.message };
  }
});

function moveFileCrossDevice(src, dest) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(src);
    const writeStream = fs.createWriteStream(dest);

    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('close', () => {
      fs.unlink(src, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    readStream.pipe(writeStream);
  });
}
