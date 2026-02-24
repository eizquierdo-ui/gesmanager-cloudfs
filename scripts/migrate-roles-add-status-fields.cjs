// 1. Importar los módulos de Firebase Admin usando require()
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore'); // <-- CORREGIDO: Importar FieldValue

// 2. Inicializar la App de Firebase Admin
try {
  initializeApp();
  console.log("SDK de Firebase Admin inicializado correctamente.");
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.warn("Advertencia: El SDK de Firebase Admin ya parece estar inicializado.");
  } else {
    console.error("Error inicializando el SDK de Firebase Admin:", error);
    process.exit(1);
  }
}

// 3. Obtener la instancia de la base de datos
const db = getFirestore();

/**
 * Actualiza los documentos en la colección 'roles' que no tengan el campo 'estado'.
 */
async function addStatusToRoles() {
  console.log("Iniciando migración de la colección 'roles'...");
  const rolesRef = db.collection('roles');

  try {
    const snapshot = await rolesRef.get();

    if (snapshot.empty) {
      console.log("La colección 'roles' está vacía. No hay nada que migrar.");
      return;
    }

    const batch = db.batch();
    let documentsToUpdateCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.estado === undefined) {
        console.log(`- Preparando actualización para el rol: ${doc.id}`);
        const docRef = rolesRef.doc(doc.id);
        batch.update(docRef, { 
          estado: 'activo',
          fecha_estado: FieldValue.serverTimestamp() // <-- CORREGIDO: Usar FieldValue.serverTimestamp()
        });
        documentsToUpdateCount++;
      }
    });

    if (documentsToUpdateCount > 0) {
      await batch.commit();
      console.log(`\n¡Éxito! ${documentsToUpdateCount} documento(s) en 'roles' han sido actualizados.`);
    } else {
      console.log("\nTodos los documentos en 'roles' ya tienen el campo 'estado'. No se necesita ninguna actualización.");
    }

  } catch (err) {
    console.error("\nError durante la migración de datos de roles:", err);
  }
}

async function main() {
  console.log("--- Iniciando Script de Migración de Roles (Versión 3) ---");
  await addStatusToRoles();
  console.log("--- Script de Migración de Roles Completado ---");
}

main();
