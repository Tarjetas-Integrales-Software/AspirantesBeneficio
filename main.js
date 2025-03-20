const { app, BrowserWindow, Menu, ipcMain } = require('electron'); // Added ipcMain
const { updateElectronApp } = require('update-electron-app');
const Database = require('better-sqlite3');
const path = require('path');
const url = require('url');
const fs = require("fs");

//Impresion de Credencial
const { exec } = require('child_process');
const PDFDocument = require('pdfkit');
const printer = require('pdf-to-printer');
const axios = require('axios');
const { jsPDF } = require("jspdf");

let mainWindow;
let db; // Declare db as a global variable

updateElectronApp();

if (require('electron-squirrel-startup')) app.quit();

app.setAppUserModelId("com.squirrel.tisa.aspirantesbeneficio");

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
  mainWindow.webContents.openDevTools();

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
      console.log("Tabla eliminada con exito.");
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
    console.log(imagePath,'imagePath');

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
      7,           // Posición x en milímetros
      8.5,           // Posición y en milímetros
      25,           // Ancho de la imagen en milímetros
      30            // Alto de la imagen en milímetros
    );

    // Agregar datos a la credencial
    doc.setFontSize(6);
    doc.text(`${data.nombre_completo}`, 40, 16.5, { maxWidth: 120, lineBreak: false });         // Nombre

    doc.setFontSize(8);
    doc.text(`${data.curp}`, 40, 23.5, { maxWidth: 120, lineBreak: false });         // CURP
    doc.text(`${new Date().toISOString().substring(0, 10)}`, 40, 31, { maxWidth: 70, lineBreak: false });    // Fecha Expedicion
    doc.text(`${data.telefono}`, 62, 31, { maxWidth: 70, lineBreak: false });      // Telefono

    doc.save(savePath_pdf) ;

    event.reply("pdf-generado", `PDF guardado en: ${savePath_pdf}`);

    // Enviar el PDF a la impresora
    printer.print(savePath_pdf, { printer: data.printer })
      .then(() => console.log("Impresion completada"))
      .catch((err) => console.error("Error al imprimir", err));


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


  }catch (error) {
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
      console.log(imagePath,'imagePath');

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
    printer.print(savePath, { printer: data.printer })
      .then(() => console.log('Impresion completada'))
      .catch(err => console.error('Error al imprimir', err));
  });

  writeStream.on('error', (err) => {
    console.error('Error al escribir el archivo PDF', err);
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on("save-image", (event, imageData, name) => {
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const dirPath = path.join(app.getPath("userData"), "imagenesBeneficiarios");
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

ipcMain.on("get-image", (event, name) => {
  const dirPath = path.join(app.getPath("userData"), "imagenesBeneficiarios");
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
