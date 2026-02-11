
// scripts/actualizar-asignacion-ejemplo.cjs

const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// --- IDs REALES ---
// Obtenidos de las colecciones existentes en la base de datos 'gesmanager-cloundfs'
const EMPRESA_ID_REAL = 'F1bVL9YITjtNm3H4rKsS'; 
const USUARIO_ID_REAL = 'Z5VAALNZducBswP5xi0D6jqZhib2'; 

// --- VALOR DE EJEMPLO A BUSCAR Y REEMPLAZAR ---
const PLACEHOLDER_USUARIO_ID = 'ID DE USUARIO EJEMPLO';


// Inicializar Firebase Admin SDK si no se ha hecho ya
if (!getApps().length) {
  try {
    // initializeApp() sin argumentos usará las credenciales del entorno de Google
    initializeApp();
    console.log('SDK de Firebase Admin inicializado correctamente.');
  } catch (e) {
    console.error('ERROR FATAL: No se pudo inicializar el SDK de Firebase Admin.', e);
    process.exit(1);
  }
}

const db = getFirestore();

async function corregirAsignacionDeEjemplo() {
  console.log('--- Iniciando Script de Corrección de Datos de Asignación ---');
  
  const asignacionesRef = db.collection('usuarios_x_empresa');
  
  // 1. Buscar el documento que fue creado con datos de placeholder
  const q = asignacionesRef.where('usuario_id', '==', PLACEHOLDER_USUARIO_ID);
  
  try {
    const snapshot = await q.get();

    if (snapshot.empty) {
      console.log('No se encontraron asignaciones con datos de ejemplo. Es posible que ya se haya ejecutado este script.');
      console.log('--- Script finalizado sin cambios. ---');
      return;
    }

    // 2. Usar un "batch" para actualizar todos los documentos encontrados de forma atómica
    const batch = db.batch();
    snapshot.forEach(doc => {
      console.log(`Documento encontrado para corregir: ${doc.id}. Actualizando con IDs reales...`);
      batch.update(doc.ref, {
        usuario_id: USUARIO_ID_REAL,
        empresa_id: EMPRESA_ID_REAL,
        usuario_ultima_modificacion: 'script-correccion-ids',
        fecha_ultima_actualizacion: FieldValue.serverTimestamp(),
      });
    });

    // 3. Ejecutar la actualización
    await batch.commit();
    console.log(`¡ÉXITO! Se corrigieron ${snapshot.size} documento(s) de asignación.`);

  } catch (error) {
    console.error('¡ERROR! Ocurrió un problema al ejecutar la consulta o la actualización en Firestore:');
    console.error(error);
    process.exit(1); // Salir con código de error
  }

  console.log('--- Script de Corrección Completado ---');
}

// Ejecutar la función principal
corregirAsignacionDeEjemplo();
