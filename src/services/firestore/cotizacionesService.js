import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Guarda una nueva cotización en la base de datos de Firestore.
 * @param {object} cotizacionData - El objeto completo de la cotización a guardar.
 * @returns {Promise<string>} - El ID del documento recién creado.
 */
export const addCotizacion = async (cotizacionData) => {
  try {
    const cotizacionesRef = collection(db, 'cotizaciones');
    const docRef = await addDoc(cotizacionesRef, {
      ...cotizacionData,
      fecha_creacion: serverTimestamp(),
      fecha_ultima_modificacion: serverTimestamp(),
    });
    console.log("Cotización guardada con ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error al guardar la cotización: ", error);
    throw new Error('Error al intentar guardar la cotización en Firestore.');
  }
};
