
const { initializeApp, getApps, getApp } = require('firebase/app');
const { getFirestore, collection, writeBatch, Timestamp } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// --- Obtener Configuración de Firebase desde el Entorno ---
// Esta es la forma correcta, usando las variables de entorno del proyecto.
function getFirebaseConfig() {
  if (process.env.FIREBASE_CONFIG) {
    return JSON.parse(process.env.FIREBASE_CONFIG);
  }
  throw new Error("La variable de entorno FIREBASE_CONFIG no está definida. Asegúrate de que el entorno esté configurado correctamente.");
}

// --- Inicialización de Firebase (manejando si ya está inicializado) ---
const firebaseConfig = getFirebaseConfig();
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// --- Función Principal para Poblar la Colección ---
async function seedMenu2() {
  console.log('--- Iniciando script para poblar la colección menu2 ---');

  // 1. Leer los datos desde el archivo JSON
  const menuDataPath = path.join(__dirname, 'data', 'menu2.json');
  let menuData;
  try {
    const jsonData = fs.readFileSync(menuDataPath, 'utf8');
    menuData = JSON.parse(jsonData);
    console.log(`Se leyeron ${menuData.length} registros del archivo menu2.json.`);
  } catch (error) {
    console.error("Error al leer o parsear el archivo menu2.json:", error);
    return; // Detener la ejecución si no se pueden cargar los datos
  }

  // 2. Preparar datos con valores por defecto
  const date = new Date();
  date.setDate(date.getDate() - 8);
  const firestoreTimestamp = Timestamp.fromDate(date);

  const batch = writeBatch(db);
  
  menuData.forEach(menuItem => {
    // El ID del documento en Firestore será el ID numérico del JSON, convertido a string
    const docRef = doc(db, "menu2", String(menuItem.id));
    
    const dataToSet = {
      ...menuItem,
      estado: 'activo',
      fecha_estado: firestoreTimestamp,
      usuario_creo: 'SYSTEM_SEEDER',
      fecha_creacion: firestoreTimestamp,
      usuario_ultima_modificacion: null,
      fecha_ultima_modificacion: null,
    };

    batch.set(docRef, dataToSet);
  });

  // 3. Ejecutar la escritura en Firestore
  try {
    await batch.commit();
    console.log(`¡ÉXITO! Se crearon ${menuData.length} documentos en la nueva colección 'menu2'.`);
    console.log("Puedes verificar los datos en la consola de Firebase.");
  } catch (error) {
    console.error("Error al escribir el batch en Firestore:", error);
    console.log("Asegúrate de que las reglas de seguridad de Firestore permiten la escritura en la colección 'menu2'.");
  }
}

// Ejecutar la función
seedMenu2();
