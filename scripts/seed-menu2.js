import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Inicialización del SDK de Administrador de Firebase ---
try {
  // SOLUCIÓN: Especificar explícitamente el ID del proyecto correcto.
  admin.initializeApp({
    projectId: 'gesmanager-cloundfs',
  });
  console.log('Firebase Admin SDK inicializado para el proyecto: gesmanager-cloundfs');
} catch (e) {
  if (!/already exists/.test(e.message)) {
    console.error('Error al inicializar Firebase Admin SDK:', e);
    process.exit(1);
  } else {
    console.log('Firebase Admin SDK ya estaba inicializado.');
  }
}

const db = admin.firestore();

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar los datos del nuevo menú
const menuDataPath = path.join(__dirname, 'data', 'menu2.json');
const menuData = JSON.parse(fs.readFileSync(menuDataPath, 'utf8'));

const seedMenu2 = async () => {
  console.log('Iniciando la inserción de las 3 nuevas opciones de menú...');

  const batch = db.batch();
  const menuCollection = db.collection('menu');

  menuData.forEach(item => {
    const docRef = menuCollection.doc(item.id);
    const { id, ...dataToSave } = item;
    batch.set(docRef, dataToSave);
    console.log(`- Preparado para añadir: ${item.label} (ID: ${item.id})`);
  });

  try {
    await batch.commit();
    console.log('\n¡Éxito! Las 3 nuevas opciones de menú han sido añadidas a Firestore.');
  } catch (error) {
    console.error('\nError al escribir el batch en Firestore:', error);
  }
};

seedMenu2();
