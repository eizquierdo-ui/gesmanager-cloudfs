import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../src/firebase.js";

async function cleanupMenu() {
  const docRef = doc(db, "menu", "salir-sistema");
  
  console.log("Intentando eliminar el documento de menú obsoleto: menu/salir-sistema...");

  try {
    await deleteDoc(docRef);
    console.log("¡Éxito! El ítem de menú 'Salir Sistema' ha sido eliminado de la base de datos.");
  } catch (error) {
    console.error("Error al eliminar el documento:", error);
  }
}

cleanupMenu();
