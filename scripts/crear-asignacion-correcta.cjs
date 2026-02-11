
// scripts/crear-asignacion-correcta.cjs

const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// --- IDs REALES Y CORRECTOS ---
const EMPRESA_ID_REAL = 'F1bVL9YITjtNm3H4rKsS'; 
const USUARIO_ID_REAL = 'Z5VAALNZducBswP5xi0D6jqZhib2'; 

// Inicializar Firebase Admin SDK si es necesario
if (!getApps().length) {
  try {
    initializeApp();
  } catch (e) {
    console.error('ERROR FATAL: No se pudo inicializar el SDK de Firebase Admin.', e);
    process.exit(1);
  }
}

const db = getFirestore();

async function crearAsignacionDirecta() {
  console.log('--- Iniciando Script de Creación Directa ---');
  
  const asignacionesRef = db.collection('usuarios_x_empresa');
  
  try {
    const nuevoDocumento = {
      usuario_id: USUARIO_ID_REAL,
      empresa_id: EMPRESA_ID_REAL,
      estado: 'activo',
      rol_id: 'user', // Asignando un rol por defecto, se puede ajustar luego
      fecha_creacion: FieldValue.serverTimestamp(),
      fecha_estado: FieldValue.serverTimestamp(),
      fecha_ultima_actualizacion: FieldValue.serverTimestamp(),
      usuario_creo: 'gemini-script-directo',
      usuario_ultima_modificacion: 'gemini-script-directo'
    };

    const docRef = await asignacionesRef.add(nuevoDocumento);

    console.log(`¡ÉXITO! Se creó un nuevo documento de asignación con el ID: ${docRef.id}`);

  } catch (error) {
    console.error('¡ERROR! Ocurrió un problema al crear el documento en Firestore:');
    console.error(error);
    process.exit(1); 
  }

  console.log('--- Script de Creación Completado ---');
}

crearAsignacionDirecta();
