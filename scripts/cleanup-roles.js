import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../src/firebase.js";

async function cleanupRoles() {
  // El ID del documento a eliminar es 'administrador_salir-sistema'
  const docRef = doc(db, "roles-accesos", "administrador_salir-sistema");
  
  console.log("Intentando eliminar el documento de acceso obsoleto: roles-accesos/administrador_salir-sistema...");

  try {
    await deleteDoc(docRef);
    console.log("¡Éxito! El acceso de rol obsoleto ha sido eliminado de la base de datos.");
  } catch (error) {
    console.error("Error al eliminar el documento de acceso:", error);
  }
}

cleanupRoles();
