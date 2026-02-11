const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializar Firebase Admin SDK
try {
  initializeApp();
} catch (e) {
  if (e.code !== 'app/duplicate-app') {
    console.error('Error inicializando Firebase Admin SDK:', e);
    process.exit(1);
  }
}

const db = getFirestore();

async function setupRolesMenuAndAccess() {
  console.log('--- Iniciando la creación del menú y acceso para el CRUD de Roles (v2) ---');
  const batch = db.batch();

  // 1. Definir el nuevo ítem de menú con la ESTRUCTURA CORRECTA
  const menuRef = db.collection('menu').doc('accesos-roles');
  const menuItem = {
    id: 'accesos-roles',         // <-- CORREGIDO: Campo ID añadido
    label: 'Roles',
    ruta: '/accesos/roles',
    icon: 'MdManageAccounts',
    padre_id: 'accesos',
    orden: 4,
    es_fija: false               // <-- CORREGIDO: Campo es_fija añadido
  };
  batch.set(menuRef, menuItem);
  console.log("1/2: Ítem de menú 'accesos-roles' preparado para ser añadido.");

  // 2. Definir el permiso para el rol de administrador
  const accessRef = db.collection('roles-accesos').doc(); // ID autogenerado
  const accessItem = {
    role_id: 'administrador',
    menu_id: 'accesos-roles',
    on_off: true,
  };
  batch.set(accessRef, accessItem);
  console.log("2/2: Permiso para el rol 'administrador' preparado.");

  try {
    // 3. Ejecutar ambas operaciones en un batch
    await batch.commit();
    console.log('\n¡Éxito! El menú "Roles" y su permiso para administradores han sido creados.');
    console.log('Por favor, recarga la aplicación para ver el cambio en el menú lateral.');
  } catch (error) {
    console.error('\n¡Error! No se pudo completar la operación de creación del menú:', error);
  }
  console.log('--- Proceso finalizado ---');
}

// Ejecutar la función principal
setupRolesMenuAndAccess();
