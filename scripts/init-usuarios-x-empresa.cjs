// scripts/init-usuarios-x-empresa.cjs

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializar la App de Firebase Admin (requiere credenciales en el entorno)
try {
  initializeApp();
} catch (e) {
  console.warn("Firebase Admin SDK ya inicializado.");
}

const db = getFirestore();

/**
 * Función para crear una asignación de ejemplo. Sirve como documentación
 * de la estructura de datos para la colección `usuarios_x_empresa`.
 */
async function crearAsignacionDeEjemplo() {
  console.log('Iniciando creación de asignación de ejemplo...');
  const coleccionRef = db.collection('usuarios_x_empresa');
  const adminUserId = 'script-admin';
  const timestamp = new Date();

  // NOTA: Estos IDs deberían existir en las colecciones `usuarios` y `empresas`
  const datosAsignacion = {
    usuario_id: "ID_DE_USUARIO_EJEMPLO", // Reemplazar con un UID real
    empresa_id: "ID_DE_EMPRESA_EJEMPLO",   // Reemplazar con un ID de empresa real
    estado: "activo",
    
    // Campos de auditoría
    fecha_creacion: timestamp,
    usuario_creo: adminUserId,
    fecha_ultima_actualizacion: timestamp,
    usuario_ultima_modificacion: adminUserId,
    fecha_estado: timestamp // Registra cuándo se estableció el estado (activo/inactivo)
  };

  try {
    const docRef = await coleccionRef.add(datosAsignacion);
    console.log(`¡Éxito! Asignación de ejemplo creada con el ID: ${docRef.id}`);
  } catch (err) {
    console.error('Error al crear la asignación de ejemplo:', err);
  }
}

async function main() {
  console.log('--- Iniciando Script de Inicialización para Usuarios x Empresa ---');
  await crearAsignacionDeEjemplo();
  console.log('--- Script de Inicialización Completado ---');
}

// Para ejecutar este script:
// 1. Autenticarse con `gcloud auth application-default login` o configurar GOOGLE_APPLICATION_CREDENTIALS
// 2. Ejecutar: node scripts/init-usuarios-x-empresa.cjs
main();
