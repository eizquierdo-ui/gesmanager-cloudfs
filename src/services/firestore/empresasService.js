import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase'; // Ajustamos la ruta para que suba dos niveles

// Obtener todas las empresas
export const getAllEmpresas = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'empresas'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener las empresas:", error);
    throw error; // Propagar el error para que el componente lo pueda manejar
  }
};

// Crear una nueva empresa
export const createEmpresa = async (empresaData) => {
  try {
    const docRef = await addDoc(collection(db, 'empresas'), {
      ...empresaData,
      fecha_creacion: serverTimestamp(),
      fecha_ultima_actualizacion: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al crear la empresa:", error);
    throw error;
  }
};

// Actualizar una empresa existente
export const updateEmpresa = async (id, empresaData) => {
  try {
    const empresaRef = doc(db, 'empresas', id);
    await updateDoc(empresaRef, {
      ...empresaData,
      fecha_ultima_actualizacion: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al actualizar la empresa:", error);
    throw error;
  }
};

// Eliminar una empresa
export const deleteEmpresa = async (id) => {
  try {
    await deleteDoc(doc(db, 'empresas', id));
  } catch (error) {
    console.error("Error al eliminar la empresa:", error);
    throw error;
  }
};

// Cambiar el estado de una empresa
export const setEmpresaStatus = async (id, nuevoEstado) => {
  try {
    const empresaRef = doc(db, 'empresas', id);
    await updateDoc(empresaRef, {
      estado: nuevoEstado,
      fecha_estado: serverTimestamp()
    });
  } catch (error) {
    console.error("Error al cambiar el estado de la empresa:", error);
    throw error;
  }
};
