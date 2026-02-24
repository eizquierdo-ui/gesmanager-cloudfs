
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
 * Script para actualizar la colección `menu` con los campos de auditoría y estado.
 */
async function backfillMenuCollection() {
  console.log('Iniciando la migración para la colección "menu"...');
  const menuRef = db.collection('menu');
  
  try {
    const snapshot = await menuRef.get();
    
    if (snapshot.empty) {
      console.log('No se encontraron documentos en la colección "menu". No hay nada que migrar.');
      return;
    }

    const batch = db.batch();
    
    // Calculamos la fecha: hoy menos 8 días.
    const creationDate = new Date();
    creationDate.setDate(creationDate.getDate() - 8);
    const firestoreTimestamp = admin.firestore.Timestamp.fromDate(creationDate);

    snapshot.forEach(doc => {
      console.log(`- Preparando actualización para el documento: ${doc.id}`);
      const docRef = menuRef.doc(doc.id);
      
      const updateData = {
        estado: 'activo',
        fecha_estado: firestoreTimestamp,
        fecha_creacion: firestoreTimestamp,
        usuario_creo: 'SYSTEM_SEEDER',
        fecha_ultima_modificacion: firestoreTimestamp,
        usuario_ultima_modificacion: 'SYSTEM_SEEDER'
      };

      batch.update(docRef, updateData);
    });

    await batch.commit();
    
    console.log(`\n¡Migración completada! ${snapshot.size} documentos han sido actualizados exitosamente en la colección "menu".`);

  } catch (error) {
    console.error('\n¡ERROR DURANTE LA MIGRACIÓN! La operación fue abortada.', error);
  }
}

backfillMenuCollection();
