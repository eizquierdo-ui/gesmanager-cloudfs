const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Inicialización del Admin SDK
// El entorno ya provee las credenciales, por lo que no se necesita un service account.
try {
  admin.initializeApp();
} catch (error) {
  // Si ya está inicializada, no hacemos nada.
  if (!/already exists/i.test(error.message)) {
    console.error('Error al inicializar Firebase Admin SDK:', error);
    process.exit(1);
  }
}

const db = getFirestore();

async function seedFinanzas() {
  console.log('--- Iniciando script para poblar Monedas y Tipos de Cambio ---');
  const now = Timestamp.now();
  const auditFields = {
    estado: 'activo',
    fecha_estado: now,
    usuario_creo: 'system_init',
    fecha_creacion: now,
    usuario_ultima_modificacion: 'system_init',
    fecha_ultima_modificacion: now,
  };

  const batch = db.batch();

  try {
    // --- 1. Preparar MONEDAS ---
    const monedasCollection = db.collection('monedas');
    const gtqDocRef = monedasCollection.doc(); // Generar ID automáticamente
    const usdDocRef = monedasCollection.doc(); // Generar ID automáticamente

    const gtqData = {
      codigo: 'GTQ',
      moneda: 'Quetzal',
      simbolo: 'Q.',
      ...auditFields
    };
    batch.set(gtqDocRef, gtqData);
    console.log(`- Preparando Moneda GTQ con ID: ${gtqDocRef.id}`);

    const usdData = {
      codigo: 'USD',
      moneda: 'Dolar',
      simbolo: '$',
      ...auditFields
    };
    batch.set(usdDocRef, usdData);
    console.log(`- Preparando Moneda USD con ID: ${usdDocRef.id}`);

    // --- 2. Preparar TIPOS_CAMBIO ---
    const tiposCambioCollection = db.collection('tipos_cambio');
    const tipoCambioDocRef = tiposCambioCollection.doc(); // Generar ID

    const tipoCambioData = {
      empresa_id: 'F1bVL9YITjtNm3H4rKsS',
      moneda_base_id: usdDocRef.id,
      moneda_destino_id: gtqDocRef.id,
      fecha: now,
      tasa_compra: 7.4215,
      tasa_venta: 7.8543,
      ...auditFields
    };
    batch.set(tipoCambioDocRef, tipoCambioData);
    console.log(`- Preparando Tipo de Cambio con ID: ${tipoCambioDocRef.id}`);

    // --- 3. Ejecutar el Batch ---
    await batch.commit();
    console.log('\n¡ÉXITO! Se han creado las colecciones y documentos de finanzas.');

  } catch (error) {
    console.error('\n--- ERROR DURANTE EL SEEDING ---', error);
    process.exit(1);
  }
}

seedFinanzas();
