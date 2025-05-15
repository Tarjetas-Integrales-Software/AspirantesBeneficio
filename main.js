const { app, BrowserWindow, Menu, ipcMain } = require('electron'); // Added ipcMain
const { updateElectronApp } = require('update-electron-app');
const Database = require('better-sqlite3');
const path = require('path');
const url = require('url');
const fs = require("fs");

//Impresion de Credencial
const { exec } = require('child_process');
const PDFDocument = require('pdfkit');
// import { print } from "pdf-to-printer";
const axios = require('axios');
const { jsPDF } = require("jspdf");

const packageJson = require('./package.json');
const si = require('systeminformation');

let mainWindow;
let db; // Declare db as a global variable

updateElectronApp();

if (require('electron-squirrel-startup')) app.quit();

app.setAppUserModelId("com.squirrel.tisa.aspirantesbeneficio");


// para poder usar el sistema de archivos de windows
const remote = require('@electron/remote/main');
// Inicializar @electron/remote
remote.initialize();


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Abre consola
  // mainWindow.webContents.openDevTools();

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

  // Habilitar remote para esta ventana
  remote.enable(win.webContents);

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

    // axios.post('https://tu-backend.com/api/version', { serialNumber, version })
    //       .then(response => console.log(`SerialNumber: ${serialNumber}, Versión reportada: ${version}`))
    //       .catch(error => console.error('Error al reportar versión:', error));


    console.log('Informacion reportada exitosamente');

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

function dropTablesIfExists() {
  try {
    // Ruta de la base de datos en la carpeta de datos del usuario
    const dbPath = path.join(app.getPath('userData'), 'mydb.sqlite');

    console.log('Database path:', dbPath);

    db = new Database(dbPath);

    // Verificar si la tabla existe antes de eliminarla
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cat_ct_configuraciones';").get();

    if (row) {
      db.prepare("DROP TABLE cat_ct_configuraciones;").run();
      console.log("Tabla eliminada con éxito.");
    } else {
      console.log("La tabla no existe, no se elimino.");
    }

  } catch (error) {
    console.error('Error en drop table:', error);
  }

}
function addColumnIfNotExists() {
  try {
    // Ruta de la base de datos en la carpeta de datos del usuario
    const dbPath = path.join(app.getPath('userData'), 'mydb.sqlite');

    console.log('Database path:', dbPath);

    db = new Database(dbPath);

    const rows = db.prepare("PRAGMA table_info(ct_aspirantes_beneficio);").all();

    // Verificar si la columna 'modulo' ya existe
    const columnExists_modulo = rows.some(row => row.name === 'modulo');
    if (!columnExists_modulo) {
      console.log("Agregando la columna 'modulo'...");
      db.prepare("ALTER TABLE ct_aspirantes_beneficio ADD COLUMN modulo TEXT NULL;").run();
      console.log("Columna 'modulo' agregada con éxito.");
    } else {
      console.log("La columna 'modulo' ya existe. No es necesario agregarla.");
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
  dropTablesIfExists();

  // Creacion de tablas en caso de no existir
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ct_aspirantes_beneficio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_modalidad INTEGER NOT NULL,
        curp TEXT NOT NULL,
        nombre_completo TEXT NOT NULL,
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

// Obtener la lista de impresoras en Windows
ipcMain.handle('get-printers', async () => {
  return new Promise((resolve, reject) => {
    exec('wmic printer get name', (error, stdout, stderr) => {
      if (error) {
        console.error('Error al obtener impresoras:', error);
        reject(error);
        return;
      }

      // Convertir la salida en una lista de impresoras
      const printers = stdout.split('\n')
        .map(line => line.trim())
        .filter(line => line && line !== 'Name') // Filtrar líneas vacías y encabezado
        .map(name => ({ name }));

      resolve(printers);
    });
  });
});


ipcMain.on('print-id-card', async (event, data, name) => {
  try {

    //se crea el archivo pdf
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [85, 54] // Ancho x Alto en mm
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
      3,           // Posición x en milímetros
      10,           // Posición y en milímetros
      24,           // Ancho de la imagen en milímetros
      28            // Alto de la imagen en milímetros
    );

    // Agregar datos a la credencial
    doc.setFontSize(6);
    doc.text(`${data.nombre_completo}`, 30.5, 16, { maxWidth: 120, lineBreak: false });         // Nombre

    doc.setFontSize(8);
    doc.text(`${data.curp}`, 30.5, 23.5, { maxWidth: 120, lineBreak: false });         // CURP
    doc.text(`${new Date().toISOString().substring(0, 10)}`, 30.5, 31, { maxWidth: 70, lineBreak: false });    // Fecha Expedicion
    doc.text(`${data.telefono}`, 55, 31, { maxWidth: 70, lineBreak: false });      // Telefono

    doc.save(savePath_pdf);

    event.reply("pdf-generado", `PDF guardado en: ${savePath_pdf}`);


    // CODIGO DAVID INICIO

    console.log('Impresora: ', data.printer, 'printer');

    win = new BrowserWindow({ width: 200, height: 200, show: false });
    // win.once('ready-to-show', () => win.hide())
    win.loadFile(savePath_pdf);
    // if pdf is loaded start printing.
    win.webContents.on('did-stop-loading', async () => {
      console.log('Cargó la ventana');

      try {
        console.log('Intentando imprimir silenciosamente...');

        win.webContents.print({
          silent: true,
          deviceName: data.printer,
          pageSize: { width: 54000, height: 85000 },
          landscape: true,
          margins: { marginType: 'none' }
        }, (success, errorType) => {
          if (!success) console.log(errorType)

          win.close();
        });

      } catch (error) {
        console.error('Error en impresión:', error);
        win.close();
      }
    });

    // CODIGO DAVID FIN

    // Enviar el PDF a la impresora
    /*
    print(savePath_pdf, { printer: data.printer })
      .then(() => console.log("Impresion completada"))
      .catch((err) => console.error("Error al imprimir", err));
    */

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

ipcMain.on('print-id-card_v2', async (event, data, name) => {
  const doc = new PDFDocument({ size: [241, 153] });
  name = data.curp; //VARIABLE PARA EL NOMBRE DEL ARCHIVO PDF
  const dirPath = path.join(app.getPath("userData"), "credencialesgeneradas");
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath); // Crear carpeta si no existe
  }
  const savePath = path.join(dirPath, name + ".pdf");

  // Crear un archivo usando fs.createWriteStream
  const writeStream = fs.createWriteStream(savePath);
  doc.pipe(writeStream);

  // Descargar la imagen desde la URL
  try {
    console.log(data.photoPath);
    /*
    const response = await fetch(data.photoPath);
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    */

    const imageUrl = data.photoPath;
    const imagePath = path.join(app.getPath("userData"), "credencialesgeneradas/" + data.curp + '.jpg');
    console.log(imagePath, 'imagePath');

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    //console.log(response,'response');
    fs.writeFileSync(imagePath, response.data);

    //const imageBuffer = Buffer.from(imagePath, 'binary');

    // Insertar la imagen en el PDF
    //doc.image(imageBuffer, 20, 27, { width: 70, height: 77 }); // Ajusta la posición y tamaño

    const imagePath2 = "C:\\Users\\Juan Pablo\\AppData\\Roaming\\Electron\\credencialesgeneradas\\AAAC031029HJCLLRA4.png";

    if (!fs.existsSync(imagePath2)) {
      console.error(`Error: La imagen no se encuentra en la ruta: ${imagePath2}`);
    } else {
      doc.image(imagePath2, 20, 27, { width: 70, height: 77 });
    }


  } catch (error) {
    console.error("Error al descargar la imagen:", error);
  }

  // Agregar datos a la credencial
  // doc.fontSize(8).text(`${data.cardNumber}`, 167, 17, {maxWidth: 65, align: 'center', lineBreak: false});  // Numero de tarjeta
  doc.fontSize(6).text(`${data.nombre_completo}`, 99, 40, { maxWidth: 120, align: 'center', lineBreak: false });         // Nombre
  doc.fontSize(8).text(`${data.curp}`, 99, 60, { maxWidth: 120, align: 'center', lineBreak: false });         // CURP
  doc.fontSize(8).text(`${new Date().toISOString().substring(0, 10)}`, 99, 82, { maxWidth: 70, align: 'center', lineBreak: false });    // Fecha Expedicion
  doc.fontSize(8).text(`${data.telefono}`, 169, 82, { maxWidth: 70, align: 'center', lineBreak: false });      // Telefono

  doc.end();

  writeStream.on('finish', () => {
    // Enviar el archivo a imprimir
    /*
    print(savePath, { printer: data.printer })
    .then(() => console.log('Impresion completada'))
    .catch(err => console.error('Error al imprimir', err));
    */
  });

  writeStream.on('error', (err) => {
    console.error('Error al escribir el archivo PDF', err);
  });
});

ipcMain.on('print-id-card-manual', async (event, data) => {
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

    doc.addImage(
      `data:image/${imageFormat};base64,${imageBase64}`,
      imageFormat,
      3,
      10,
      24,
      28
    );

    doc.setFontSize(6);
    doc.text(`${data.nombreBeneficiario}`, 30.5, 16, { maxWidth: 120, lineBreak: false });

    doc.setFontSize(8);
    doc.text(`${data.curp}`, 30.5, 23.5, { maxWidth: 120, lineBreak: false });
    doc.text(`${data.fechaExpedicion}`, 30.5, 31, { maxWidth: 70, lineBreak: false });
    doc.text(`${data.telefono}`, 55, 31, { maxWidth: 70, lineBreak: false });

    doc.save(savePath_pdf);

    event.reply("pdf-generado", `PDF guardado en: ${savePath_pdf}`);

    const win = new BrowserWindow({ width: 200, height: 200, show: false });
    win.loadFile(savePath_pdf);
    win.webContents.on('did-stop-loading', async () => {
      console.log('Cargó la ventana');

      try {
        console.log('Intentando imprimir silenciosamente...');

        win.webContents.print({
          silent: true,
          deviceName: data.printer,
          pageSize: { width: 54000, height: 85000 },
          landscape: true,
          margins: { marginType: 'none' }
        }, (success, errorType) => {
          if (!success) console.log(errorType)

          win.close();
        });

      } catch (error) {
        console.error('Error en impresión:', error);
        win.close();
      }
    });


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
  if (process.platform !== 'darwin') {
    app.quit();
  }
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

  const { fileName, requestId } = args;

  //const dirPath = path.join(app.getPath("userData"), "ArchivosDigitalizados");
  const dirPath = "C:\\ExpedientesBeneficiarios\\Digitalizados";
  const filePath = path.join(dirPath, fileName + ".pdf");

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("Error al leer el archivoo PDF:", err);
      event.sender.send(`pdf-read-error-${requestId}`, err.message);
      return;
    }else{
      event.sender.send(`pdf-read-success-${requestId}`, data);
    }
  });
});

ipcMain.handle("get-serial-number", async (event) => {
  // Obtener información del sistema
  const systemInfo = await si.system();
  let serialNumber = systemInfo.serial || 'Desconocido';

  return serialNumber;
});
