
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../src/firebase.js";

async function fixEmpresaRoute() {
  // La ruta al documento que queremos corregir
  const docRef = doc(db, "menu", "accesos-empresas");
  
  console.log("Intentando actualizar el documento: menu/accesos-empresas...");

  try {
    // Añadimos el campo 'ruta' que faltaba
    await updateDoc(docRef, {
      ruta: "/accesos/empresas"
    });
    console.log("¡Éxito! La ruta del menú 'Empresas' ha sido corregida en la base de datos.");
  } catch (error) {
    console.error("Error al actualizar el documento:", error);
  }
}

fixEmpresaRoute();
