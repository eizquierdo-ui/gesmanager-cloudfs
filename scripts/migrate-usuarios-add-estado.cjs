
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializa la app. En el entorno de IDX, las credenciales se
// toman automáticamente del ambiente autenticado.
initializeApp();

const db = getFirestore();

async function migrateUsuarios() {
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
    // Solo actualiza si el campo 'estado' no existe
    if (usuarioData.estado === undefined) {
      const docRef = usuariosRef.doc(doc.id);
      batch.update(docRef, { 
        estado: 'activo',
        date_modified: new Date(),
        modified_user_id: 'SYSTEM_MIGRATION' 
      });
      console.log(`Se marcará para actualización el usuario: ${doc.id}`);
      updatesCount++;
    } else {
      console.log(`El usuario ${doc.id} ya tiene el campo 'estado'.`);
    }
  });

  if (updatesCount > 0) {
    await batch.commit();
    console.log(`Migración completada. Se actualizó el campo "estado" para ${updatesCount} usuarios.`);
  } else {
    console.log('No hubo usuarios que necesitaran ser migrados.');
  }
}

migrateUsuarios().catch(console.error);
