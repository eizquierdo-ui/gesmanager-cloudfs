
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // La ruta es correcta desde esta ubicación

const MONEDAS_COLLECTION = 'monedas';

/**
 * Obtiene todas las monedas de la colección.
 * @returns {Promise<Array>} Un array con todas las monedas.
 */
export const getAllMonedas = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, MONEDAS_COLLECTION));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener las monedas:", error);
    throw error;
  }
};

/**
 * Obtiene una moneda específica por su ID.
 * @param {string} id - El ID del documento de la moneda.
 * @returns {Promise<Object>} El objeto de la moneda.
 */
export const getMonedaById = async (id) => {
  try {
    const docRef = doc(db, MONEDAS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.error("No se encontró la moneda con el ID:", id);
      throw new Error("La moneda no existe.");
    }
  } catch (error) {
    console.error("Error al obtener la moneda por ID:", error);
    throw error;
  }
};

/**
 * Crea una nueva moneda.
 * @param {Object} monedaData - Los datos de la moneda a crear.
 * @returns {Promise<string>} El ID del documento creado.
 */
export const createMoneda = async (monedaData) => {
  try {
    const docRef = await addDoc(collection(db, MONEDAS_COLLECTION), {
      ...monedaData,
      estado: 'activo', // Estado por defecto
      fecha_creacion: serverTimestamp(),
      fecha_ultima_modificacion: serverTimestamp(),
      fecha_estado: serverTimestamp(),
      usuario_creo: 'SYSTEM_USER', // TODO: Reemplazar con el usuario autenticado
      usuario_ultima_modificacion: 'SYSTEM_USER'
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al crear la moneda:", error);
    throw error;
  }
};

/**
 * Actualiza una moneda existente.
 * @param {string} id - El ID de la moneda a actualizar.
 * @param {Object} monedaData - Los nuevos datos para la moneda.
 */
export const updateMoneda = async (id, monedaData) => {
  try {
    const monedaRef = doc(db, MONEDAS_COLLECTION, id);
    await updateDoc(monedaRef, {
      ...monedaData,
      fecha_ultima_modificacion: serverTimestamp(),
      usuario_ultima_modificacion: 'SYSTEM_USER' // TODO: Reemplazar
    });
  } catch (error) {
    console.error("Error al actualizar la moneda:", error);
    throw error;
  }
};

/**
 * Elimina una moneda de forma permanente.
 * @param {string} id - El ID de la moneda a eliminar.
 */
export const deleteMoneda = async (id) => {
  try {
    await deleteDoc(doc(db, MONEDAS_COLLECTION, id));
  } catch (error) {
    console.error("Error al eliminar la moneda:", error);
    throw error;
  }
};

/**
 * Cambia el estado (activo/inactivo) de una moneda.
 * @param {string} id - El ID de la moneda.
 * @param {string} nuevoEstado - El nuevo estado ('activo' o 'inactivo').
 */
export const setMonedaStatus = async (id, nuevoEstado) => {
  try {
    const monedaRef = doc(db, MONEDAS_COLLECTION, id);
    await updateDoc(monedaRef, {
      estado: nuevoEstado,
      fecha_estado: serverTimestamp()
    });
  } catch (error) {
    console.error("Error al cambiar el estado de la moneda:", error);
    throw error;
  }
};
