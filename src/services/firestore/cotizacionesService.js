
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

const cotizacionesCollectionRef = collection(db, 'cotizaciones');
const serviciosCollectionRef = collection(db, 'servicios');

/**
 * Guarda una nueva cotización en la base de datos de Firestore.
 * @param {object} cotizacionData - El objeto completo de la cotización a guardar.
 * @returns {Promise<string>} - El ID del documento recién creado.
 */
export const addCotizacion = async (cotizacionData) => {
  try {
    const docRef = await addDoc(cotizacionesCollectionRef, {
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

/**
 * Obtiene todos los servicios activos que pertenecen a una categoría específica.
 * Esta función está diseñada para ser usada en el contexto de la creación de cotizaciones.
 * @param {string} categoriaId - El ID de la categoría por la cual filtrar los servicios.
 * @returns {Promise<Array>} Un array con los documentos de los servicios que coinciden.
 */
export const getServiciosByCategoriaId = async (categoriaId) => {
  const q = query(
    serviciosCollectionRef,
    where('categoria_id', '==', categoriaId),
    where('estado', '==', 'activo')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
