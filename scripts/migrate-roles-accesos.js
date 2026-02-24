
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// La inicialización de la app de Firebase Admin.
// Se asume que las credenciales están configuradas en el entorno del IDE.
try {
  admin.initializeApp();
  console.log('Firebase Admin SDK inicializado correctamente.');
} catch (error) {
  // Si la app ya está inicializada, no lanzamos un error, simplemente continuamos.
  if (!/already exists/i.test(error.message)) {
    console.error('Error inicializando Firebase Admin SDK:', error);
    process.exit(1);
  } else {
    console.log('La app de Firebase Admin ya estaba inicializada.');
  }
}

const db = getFirestore();

/**
 * Script para actualizar la colección `roles-accesos` con los campos de auditoría estándar.
 */
async function migrateRolesAccesos() {
  console.log('Iniciando la migración para la colección "roles-accesos"...');
  const collectionRef = db.collection('roles-accesos');
  
  try {
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
      console.log('No se encontraron documentos en "roles-accesos". No hay nada que migrar.');
      return;
    }

    console.log(`Se encontraron ${snapshot.size} documentos. Iniciando migración...`);

    const batch = db.batch();
    
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    const firestoreTimestamp = admin.firestore.Timestamp.fromDate(eightDaysAgo);
    const creationUser = 'SYSTEM_SEEDER';

    snapshot.forEach(doc => {
      console.log(`- Preparando actualización para el documento: ${doc.id}`);
      const docRef = collectionRef.doc(doc.id);
      
      const updateData = {
        // Campos a eliminar
        date_created: admin.firestore.FieldValue.delete(),
        created_user_id: admin.firestore.FieldValue.delete(),
        date_modified: admin.firestore.FieldValue.delete(),
        modified_user_id: admin.firestore.FieldValue.delete(),

        // Campos a añadir con el estándar correcto
        fecha_creacion: firestoreTimestamp,
        usuario_creo: creationUser,
        fecha_ultima_modificacion: firestoreTimestamp,
        usuario_ultima_modificacion: creationUser
      };

      batch.update(docRef, updateData);
    });

    await batch.commit();
    
    console.log(`\n¡Migración completada! ${snapshot.size} documentos han sido actualizados exitosamente en la colección "roles-accesos".`);

  } catch (error) {
    console.error('\n¡ERROR DURANTE LA MIGRACIÓN! La operación fue abortada.', error);
  }
}

migrateRolesAccesos();
