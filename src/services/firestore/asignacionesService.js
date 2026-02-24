
// src/services/firestore/asignacionesService.js
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase'; // Ajustar la ruta a tu configuración de Firebase si es necesario

const COL_NAME = 'usuarios_x_empresa';

/**
 * READ - Obtener todas las asignaciones de usuarios a empresas.
 */
export const getAllAsignaciones = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COL_NAME));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener las asignaciones:", error);
    throw error; // Propagar el error para que la UI pueda manejarlo
  }
};

/**
 * CREATE - Añadir una nueva asignación.
 * @param {object} data - Objeto con los datos de la nueva asignación (ej. { usuario_id, empresa_id, estado }).
 * @param {string} userId - El ID del usuario que está realizando la operación (para auditoría).
 */
export const createAsignacion = async (data, userId) => {
  try {
    const docData = {
      ...data,
      fecha_creacion: serverTimestamp(),
      usuario_creo: userId,
      fecha_ultima_actualizacion: serverTimestamp(),
      usuario_ultima_modificacion: userId,
    };
    const docRef = await addDoc(collection(db, COL_NAME), docData);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear la asignación:", error);
    throw error;
  }
};

/**
 * UPDATE - Actualizar una asignación existente.
 * @param {string} id - El ID del documento a actualizar.
 * @param {object} data - Objeto con los campos a actualizar.
 * @param {string} userId - El ID del usuario que está realizando la operación (para auditoría).
 */
export const updateAsignacion = async (id, data, userId) => {
  try {
    const docRef = doc(db, COL_NAME, id);
    const docData = {
      ...data,
      fecha_ultima_actualizacion: serverTimestamp(),
      usuario_ultima_modificacion: userId,
    };
    await updateDoc(docRef, docData);
  } catch (error) {
    console.error("Error al actualizar la asignación:", error);
    throw error;
  }
};

/**
 * DELETE - Eliminar una asignación.
 * @param {string} id - El ID del documento a eliminar.
 */
export const deleteAsignacion = async (id) => {
  try {
    await deleteDoc(doc(db, COL_NAME, id));
  } catch (error) {
    console.error("Error al eliminar la asignación:", error);
    throw error;
  }
};
