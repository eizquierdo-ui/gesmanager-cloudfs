
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// --- Inicialización de Firebase Admin SDK ---
// Se asume que el entorno del IDE ya proporciona las credenciales.
try {
  admin.initializeApp();
  console.log('Firebase Admin SDK inicializado para la siembra.');
} catch (error) {
  if (!/already exists/i.test(error.message)) {
    console.error('Error fatal al inicializar Firebase Admin SDK:', error);
    process.exit(1);
  } else {
    console.log('La app de Firebase Admin ya estaba inicializada.');
  }
}

const db = getFirestore();

// --- Función Principal para Poblar la Nueva Colección 'menu2' ---
async function seedMenu2() {
  const collectionName = 'menu2';
  console.log(`--- Iniciando siembra para la nueva colección: ${collectionName} ---`);

  // 1. Leer los datos desde el archivo JSON correspondiente
  const menuDataPath = path.join(path.resolve(), 'scripts', 'data', 'menu2.json');
  let menuData;
  try {
    const jsonData = fs.readFileSync(menuDataPath, 'utf8');
    menuData = JSON.parse(jsonData);
    console.log(`- Se leyeron ${menuData.length} registros desde menu2.json.`);
  } catch (error) {
    console.error(`Error al leer o parsear el archivo de datos ${menuDataPath}:`, error);
    process.exit(1);
  }

  // 2. Preparar el batch de escritura en Firestore
  const batch = db.batch();
  
  // Calcular la fecha: hoy - 8 días
  const date = new Date();
  date.setDate(date.getDate() - 8);
  const firestoreTimestamp = admin.firestore.Timestamp.fromDate(date);

  menuData.forEach(menuItem => {
    // Usamos el 'id' numérico del JSON como ID del documento, convertido a string.
    const docId = String(menuItem.id);
    const docRef = db.collection(collectionName).doc(docId);
    
    const dataToSet = {
      ...menuItem,
      estado: 'activo',
      fecha_estado: firestoreTimestamp,
      usuario_creo: 'SYSTEM_SEEDER',
      fecha_creacion: firestoreTimestamp,
      usuario_ultima_modificacion: null, // Campo nulo como se pidió
      fecha_ultima_modificacion: null,   // Campo nulo como se pidió
    };

    console.log(`  - Preparando documento: ${docId}`);
    batch.set(docRef, dataToSet);
  });

  // 3. Ejecutar la operación de escritura
  try {
    await batch.commit();
    console.log(`\n¡ÉXITO! Se crearon ${menuData.length} documentos en la colección '${collectionName}'.`);
    console.log('La operación se completó sin errores.');
  } catch (error) {
    console.error('\n--- ¡ERROR DURANTE LA ESCRITURA DEL BATCH! ---', error);
    console.error('La siembra de datos no pudo completarse. Revisa los logs de error.');
    process.exit(1);
  }
}

// Ejecutar el script
seedMenu2();
