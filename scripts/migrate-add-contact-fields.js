
// scripts/migrate-add-contact-fields.js
// Proposito: Anadir los campos de contacto que faltan a los documentos existentes en la coleccion 'empresas'.
// Metodo: SDK de Cliente (el correcto para este entorno).

import { collection, getDocs, getFirestore, writeBatch } from 'firebase/firestore';
import { db } from '../src/firebase'; // Usamos la misma instancia de DB que la app

const empresasRef = collection(db, 'empresas');

async function migrateEmpresas() {
  console.log('Iniciando migracion (Metodo Cliente): Anadiendo campos de contacto a la coleccion de empresas...');
  const snapshot = await getDocs(empresasRef);

  if (snapshot.empty) {
    console.log('No se encontraron documentos en la coleccion de empresas. No hay nada que migrar.');
    return;
  }

  const batch = writeBatch(db);
  let updatedCount = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    // Verificamos si los campos ya existen para no sobrescribir datos
    if (data.email === undefined || data.telefono === undefined || data.contacto === undefined || data.telefono_contacto === undefined) {
      console.log(`- Documento a actualizar: ${doc.id}`);
      batch.update(doc.ref, {
        email: data.email || '',
        telefono: data.telefono || '',
        contacto: data.contacto || '',
        telefono_contacto: data.telefono_contacto || ''
      });
      updatedCount++;
    }
  });

  if (updatedCount === 0) {
    console.log('Todos los documentos ya tenian los campos necesarios. No se realizaron cambios.');
    return;
  }

  try {
    await batch.commit();
    console.log(`¡Migracion completada con exito! Se actualizaron ${updatedCount} documentos.`);
  } catch (error) {
    console.error('Error al ejecutar la migracion:', error);
  }
}

migrateEmpresas();
