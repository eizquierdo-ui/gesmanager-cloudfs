
// scripts/diagnostico-db.cjs

const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Evitar reinicialización si ya existe
if (!getApps().length) {
  try {
    initializeApp();
    console.log('SDK de Firebase Admin inicializado para diagnóstico.');
  } catch (e) {
    console.error('Error inicializando Firebase Admin:', e);
    process.exit(1);
  }
} else {
    console.log('El SDK de Firebase Admin ya estaba inicializado.');
}


const db = getFirestore();

async function diagnosticarConexion() {
  console.log('--- Iniciando Diagnóstico de Conexión a Firestore ---');
  
  try {
    console.log('Intentando obtener la lista de colecciones raíz...');
    const collections = await db.listCollections();
    
    if (collections.length === 0) {
      console.warn('ADVERTENCIA: La base de datos no tiene ninguna colección.');
      console.log('Esto puede ser normal si la base de datos está vacía, pero confirma que la conexión fue exitosa.');
    } else {
      console.log('¡ÉXITO! Se pudo conectar y listar las colecciones:');
      collections.forEach(collection => {
        console.log(`- ${collection.id}`);
      });
    }

  } catch (error) {
    console.error('¡FALLO CATASTRÓFICO! No se pudo conectar o listar las colecciones.');
    console.error('Error detallado:', error);
    process.exit(1);
  }

  console.log('--- Diagnóstico de Conexión Completado ---');
}

diagnosticarConexion();
