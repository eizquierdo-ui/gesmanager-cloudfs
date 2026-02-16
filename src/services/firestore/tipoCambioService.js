
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

const TIPO_CAMBIO_COLLECTION = 'tipos_cambio'; // El nombre de la colección sigue siendo el mismo

/**
 * Obtiene todos los tipos de cambio, ordenados por fecha descendente.
 * @returns {Promise<Array>} Un array con todos los tipos de cambio.
 */
export const getAllTiposCambio = async () => {
  try {
    const q = query(collection(db, TIPO_CAMBIO_COLLECTION), orderBy('fecha', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener los tipos de cambio:", error);
    throw error;
  }
};

/**
 * Crea un nuevo tipo de cambio.
 * @param {Object} tipoCambioData - Los datos del tipo de cambio a crear.
 * @returns {Promise<string>} El ID del documento creado.
 */
export const createTipoCambio = async (tipoCambioData) => {
  try {
    // La fecha la debe enviar el formulario, ya que es un dato clave.
    const docRef = await addDoc(collection(db, TIPO_CAMBIO_COLLECTION), {
      ...tipoCambioData,
      estado: 'activo',
      fecha_creacion: serverTimestamp(),
      fecha_ultima_modificacion: serverTimestamp(),
      usuario_creo: 'SYSTEM_USER', // TODO: Implementar usuario real
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al crear el tipo de cambio:", error);
    throw error;
  }
};

/**
 * Actualiza un tipo de cambio existente.
 * @param {string} id - El ID del tipo de cambio a actualizar.
 * @param {Object} tipoCambioData - Los nuevos datos.
 */
export const updateTipoCambio = async (id, tipoCambioData) => {
  try {
    const tipoCambioRef = doc(db, TIPO_CAMBIO_COLLECTION, id);
    await updateDoc(tipoCambioRef, {
      ...tipoCambioData,
      fecha_ultima_modificacion: serverTimestamp(),
      usuario_ultima_modificacion: 'SYSTEM_USER' // TODO: Implementar
    });
  } catch (error) {
    console.error("Error al actualizar el tipo de cambio:", error);
    throw error;
  }
};

/**
 * Elimina un tipo de cambio.
 * @param {string} id - El ID del tipo de cambio a eliminar.
 */
export const deleteTipoCambio = async (id) => {
  try {
    await deleteDoc(doc(db, TIPO_CAMBIO_COLLECTION, id));
  } catch (error) {
    console.error("Error al eliminar el tipo de cambio:", error);
    throw error;
  }
};

/**
 * Cambia el estado de un tipo de cambio.
 * @param {string} id - El ID del tipo de cambio.
 * @param {string} nuevoEstado - 'activo' o 'inactivo'.
 */
export const setTipoCambioStatus = async (id, nuevoEstado) => {
  try {
    const tipoCambioRef = doc(db, TIPO_CAMBIO_COLLECTION, id);
    await updateDoc(tipoCambioRef, {
      estado: nuevoEstado,
      fecha_estado: serverTimestamp()
    });
  } catch (error) {
    console.error("Error al cambiar el estado del tipo de cambio:", error);
    throw error;
  }
};
