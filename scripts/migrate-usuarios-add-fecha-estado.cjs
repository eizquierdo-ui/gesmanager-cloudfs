
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializa la app. Las credenciales se toman automáticamente del ambiente.
initializeApp();

const db = getFirestore();

async function addFechaEstadoToUsuarios() {
  const usuariosRef = db.collection('usuarios');
  const snapshot = await usuariosRef.get();

  if (snapshot.empty) {
    console.log('No se encontraron usuarios para migrar.');
    return;
  }

  const batch = db.batch();
  let updatesCount = 0;
  snapshot.forEach(doc => {
    const usuarioData = doc.data();
    // Solo actualiza si el campo 'fecha_estado' no existe
    if (usuarioData.fecha_estado === undefined) {
      const docRef = usuariosRef.doc(doc.id);
      batch.update(docRef, { 
        fecha_estado: new Date(),
        date_modified: new Date(),
        modified_user_id: 'SYSTEM_MIGRATION_FIX' 
      });
      console.log(`Se marcará para añadir fecha_estado al usuario: ${doc.id}`);
      updatesCount++;
    } else {
      console.log(`El usuario ${doc.id} ya tiene el campo 'fecha_estado'.`);
    }
  });

  if (updatesCount > 0) {
    await batch.commit();
    console.log(`Migración completada. Se añadió el campo "fecha_estado" a ${updatesCount} usuarios.`);
  } else {
    console.log('No hubo usuarios que necesitaran la migración.');
  }
}

addFechaEstadoToUsuarios().catch(console.error);
