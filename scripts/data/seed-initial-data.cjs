const { initializeApp } = require('firebase/app');
const { getFirestore, getDocs, collection, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const fs = require('fs');

// 1. Cargar la configuración de Firebase desde firebaseConfig.json
let firebaseConfig;
try {
  const configRaw = fs.readFileSync('./firebaseConfig.json');
  firebaseConfig = JSON.parse(configRaw);
} catch (error) {
  console.error('Error: No se pudo encontrar o leer el archivo firebaseConfig.json.', error);
  process.exit(1);
}

// 2. Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. DATOS INICIALES (Como los definiste)
const ADMIN_UID = 'Z5VAALNZducBswP5xi0D6jqZhib2'; // Tu UID
const ROLE_ID = 'administrador'; // Usaremos el string como ID para simplicidad

const main = async () => {
  try {
    console.log('Iniciando la siembra de datos iniciales...');

    const now = serverTimestamp();

    // --- CREAR COLECCIÓN: roles ---
    const rolRef = doc(db, 'roles', ROLE_ID);
    await setDoc(rolRef, {
      role_nombre: 'Administrador',
      // Campos de auditoría
      created_user_id: ADMIN_UID,
      modified_user_id: ADMIN_UID,
      date_created: now,
      date_modified: now
    });
    console.log(`- Rol '${ROLE_ID}' creado correctamente.`);

    // --- CREAR COLECCIÓN: usuarios ---
    const userRef = doc(db, 'usuarios', ADMIN_UID);
    await setDoc(userRef, {
      email_usuario: 'evandro.izquierdo@gmail.com',
      nombre_usuario: 'Evandro Izquierdo',
      role: ROLE_ID, // ID del rol vinculado
      // Campos de auditoría
      created_user_id: ADMIN_UID,
      modified_user_id: ADMIN_UID,
      date_created: now,
      date_modified: now
    });
    console.log(`- Usuario para '${ADMIN_UID}' creado correctamente.`);

    // --- CREAR COLECCIÓN: roles-accesos ---
    console.log('Asignando todos los permisos de menú al rol de administrador...');
    const menuCollection = collection(db, 'menu');
    const menuSnapshot = await getDocs(menuCollection);

    if (menuSnapshot.empty) {
      console.warn('Advertencia: La colección \'menu\' está vacía. No se asignaron permisos.');
    } else {
      // Crear un documento por cada permiso
      for (const menuDoc of menuSnapshot.docs) {
        const menuId = menuDoc.id;
        const accesoRef = doc(db, 'roles-accesos', `${ROLE_ID}_${menuId}`);
        await setDoc(accesoRef, {
          role_id: ROLE_ID,
          menu_id: menuId,
          on_off: true, // Acceso concedido
          // Campos de auditoría
          created_user_id: ADMIN_UID,
          modified_user_id: ADMIN_UID,
          date_created: now,
          date_modified: now
        });
      }
       console.log(`- Se asignaron ${menuSnapshot.size} permisos al rol '${ROLE_ID}'.`);
    }

    console.log('\n¡Siembra de datos completada con éxito!');

  } catch (error) {
    console.error('\nError durante la siembra de datos:', error);
  } finally {
    // No cerramos la conexión para que el proceso termine naturalmente.
    process.exit(0);
  }
}

main();
