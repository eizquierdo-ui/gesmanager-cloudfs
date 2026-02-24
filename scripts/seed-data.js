import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Inicializar Firebase Admin SDK
admin.initializeApp({
  projectId: 'gesmanager-cloundfs',
});

const db = admin.firestore();
const now = admin.firestore.FieldValue.serverTimestamp();
const ADMIN_UID = 'Z5VAALNZducBswP5xi0D6jqZhib2';

const seedCollection = async (fileName, collectionName) => {
  try {
    const dataPath = path.join(path.resolve(), 'scripts', 'data', fileName);
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const collectionRef = db.collection(collectionName);

    console.log(`Sembrando datos para la colección: ${collectionName}...`);
    const batch = db.batch();

    for (const item of data) {
      const docId = item._id;
      delete item._id;
      const docRef = collectionRef.doc(docId);
      batch.set(docRef, {
        ...item,
        created_user_id: ADMIN_UID,
        modified_user_id: ADMIN_UID,
        date_created: now,
        date_modified: now
      });
    }

    await batch.commit();
    console.log(`- ¡Colección ${collectionName} sembrada con ${data.length} documentos!`);
  } catch (error) {
    console.error(`Error sembrando ${collectionName}:`, error);
    throw error;
  }
};

const seedRoleAccess = async () => {
  try {
    const roleId = 'administrador';
    console.log(`Generando accesos para el rol: ${roleId}...`);

    const menuSnapshot = await db.collection('menu').get();
    if (menuSnapshot.empty) {
      // ESTA ES LA LÍNEA CORREGIDA
      console.warn('- Advertencia: La colección \'menu\' está vacía. No se generaron accesos.');
      return;
    }

    const accessCollectionRef = db.collection('roles-accesos');
    const batch = db.batch();

    menuSnapshot.forEach(menuDoc => {
      const menuId = menuDoc.id;
      const accesoId = `${roleId}_${menuId}`;
      const docRef = accessCollectionRef.doc(accesoId);
      batch.set(docRef, {
        role_id: roleId,
        menu_id: menuId,
        on_off: true,
        created_user_id: ADMIN_UID,
        modified_user_id: ADMIN_UID,
        date_created: now,
        date_modified: now
      });
    });

    await batch.commit();
    console.log(`- ¡Se crearon ${menuSnapshot.size} documentos de acceso para el rol '${roleId}'!`);
  } catch (error) {
    console.error('Error sembrando roles-accesos:', error);
    throw error;
  }
};

const main = async () => {
  try {
    console.log('--- INICIANDO SIEMBRA DE DATOS INICIALES ---');
    await seedCollection('roles.json', 'roles');
    await seedCollection('usuarios.json', 'usuarios');
    await seedRoleAccess();
    console.log('\n-------------------------------------');
    console.log('¡TODOS LOS DATOS SE HAN SEMBRADO CON ÉXITO!');
    console.log('-------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('\n--- ERROR FATAL DURANTE LA SIEMBRA ---');
    // Se usa console.error(error) para imprimir el stack trace completo.
    console.error('El proceso no pudo completarse. Revisa el error anterior:', error);
    process.exit(1);
  }
};

main();
