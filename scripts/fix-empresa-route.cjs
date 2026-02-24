const { doc, updateDoc } = require("firebase/firestore");
const { db } = require("../src/firebase");

async function fixRoute() {
  const docRef = doc(db, "menu", "accesos-empresas");
  try {
    await updateDoc(docRef, {
      ruta: "/accesos/empresas"
    });
    console.log("Ruta del menú ‘Empresas’ corregida exitosamente.");
  } catch (error) {
    console.error("Error al actualizar la ruta:", error);
  }
}

fixRoute();
