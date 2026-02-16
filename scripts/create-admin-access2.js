
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// --- Inicialización de Firebase Admin SDK ---
try {
  admin.initializeApp();
  console.log('Firebase Admin SDK inicializado.');
} catch (error) {
  if (!/already exists/i.test(error.message)) {
    console.error('Error fatal al inicializar Firebase Admin SDK:', error);
    process.exit(1);
  }
}

const db = getFirestore();

/**
 * Script para crear la colección 'roles-accesos2' 
 * y poblarla con todos los permisos para el rol 'administrador'
 * basándose en la colección 'menu2', INCLUYENDO los campos de jerarquía.
 */
async function createAdminAccessForMenu2() {
  const roleId = 'administrador';
  const sourceMenuCollection = 'menu2';
  const targetAccessCollection = 'roles-accesos2';

  console.log(`--- Iniciando la creación de accesos para el rol '${roleId}' ---`);
  console.log(`- Colección de menús de origen: ${sourceMenuCollection}`);
  console.log(`- Colección de accesos de destino: ${targetAccessCollection}`);

  try {
    // 1. Obtener todos los documentos de la colección de menús de origen.
    const menuSnapshot = await db.collection(sourceMenuCollection).get();
    
    if (menuSnapshot.empty) {
      console.warn(`Advertencia: La colección de menús '${sourceMenuCollection}' está vacía. No se creará ningún acceso.`);
      return;
    }

    console.log(`- Se encontraron ${menuSnapshot.size} ítems en la colección '${sourceMenuCollection}'.`);

    // 2. Preparar un batch para crear todos los documentos de acceso.
    const batch = db.batch();
    const now = admin.firestore.Timestamp.now();

    menuSnapshot.forEach(menuDoc => {
      const menuId = menuDoc.id;
      const menuData = menuDoc.data(); // <-- OBTENEMOS TODOS LOS DATOS DEL MENÚ
      const accessDocId = `${roleId}_${menuId}`;
      const accessDocRef = db.collection(targetAccessCollection).doc(accessDocId);

      const accessData = {
        role_id: roleId,
        menu_id: menuId,
        on_off: true, // El administrador tiene acceso a todo por defecto.
        
        // --- ¡¡CAMPOS DE JERARQUÍA AÑADIDOS!! ---
        Label: menuData.Label,
        Orden: menuData.Orden,
        es_padre: menuData.es_padre || false,
        id_padre: menuData.id_padre || '0',
        
        // --- Campos de Auditoría ---
        usuario_creo: 'SYSTEM_GENERATOR',
        fecha_creacion: now,
        usuario_ultima_modificacion: 'SYSTEM_GENERATOR',
        fecha_ultima_modificacion: now,
      };

      console.log(`  - Preparando acceso: ${accessDocId} con datos de jerarquía.`);
      batch.set(accessDocRef, accessData);
    });

    // 3. Ejecutar el batch para escribir en la base de datos.
    await batch.commit();

    console.log(`\n¡ÉXITO! Se crearon ${menuSnapshot.size} documentos de acceso para el rol '${roleId}' en la colección '${targetAccessCollection}'.`);

  } catch (error) {
    console.error('\n--- ¡ERROR DURANTE EL PROCESO! ---', error);
    console.error('La operación fue abortada y no se completó.');
    process.exit(1);
  }
}

// Ejecutar la función principal.
createAdminAccessForMenu2();
