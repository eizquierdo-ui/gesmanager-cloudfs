
// src/services/firestore/categoriasService.js

import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  deleteDoc, // Se importa deleteDoc aunque la recomendación sea borrado lógico
} from 'firebase/firestore';
import { db } from '../../firebase'; // Asegúrate que la ruta a tu configuración de firebase sea correcta

const categoriasCollectionRef = collection(db, 'categorias');

/**
 * Obtiene todas las categorías de una empresa específica.
 * @param {string} empresaId - El ID de la empresa.
 * @returns {Promise<Array>} Un array con los documentos de las categorías.
 */
export const getAllCategorias = async (empresaId) => {
  const q = query(categoriasCollectionRef, where('empresa_id', '==', empresaId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Obtiene una sola categoría por su ID.
 * @param {string} id - El ID de la categoría.
 * @returns {Promise<Object|null>} El documento de la categoría o null si no se encuentra.
 */
export const getCategoriaById = async (id) => {
  const categoriaDoc = doc(db, 'categorias', id);
  const docSnap = await getDoc(categoriaDoc);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

/**
 * Crea una nueva categoría.
 * @param {Object} categoriaData - Los datos de la categoría a crear.
 * @param {string} userId - El ID del usuario que realiza la operación.
 * @returns {Promise<DocumentReference>} Referencia al nuevo documento.
 */
export const createCategoria = (categoriaData, userId) => {
  return addDoc(categoriasCollectionRef, {
    ...categoriaData,
    usuario_creo: userId,
    fecha_creacion: serverTimestamp(),
    usuario_ultima_modificacion: userId,
    fecha_ultima_modificacion: serverTimestamp(),
    fecha_estado: serverTimestamp(),
  });
};

/**
 * Actualiza una categoría existente.
 * @param {string} id - El ID de la categoría a actualizar.
 * @param {Object} categoriaData - Los datos a actualizar.
 * @param {string} userId - El ID del usuario que realiza la operación.
 * @returns {Promise<void>}
 */
export const updateCategoria = (id, categoriaData, userId) => {
  const categoriaDoc = doc(db, 'categorias', id);
  const dataToUpdate = {
    ...categoriaData,
    usuario_ultima_modificacion: userId,
    fecha_ultima_modificacion: serverTimestamp(),
  };

  if (Object.prototype.hasOwnProperty.call(categoriaData, 'estado')) {
    dataToUpdate.fecha_estado = serverTimestamp();
  }

  return updateDoc(categoriaDoc, dataToUpdate);
};

/**
 * Cambia el estado de una categoría (activo/inactivo).
 * @param {string} id - El ID de la categoría.
 * @param {string} nuevoEstado - El nuevo estado ('activo' o 'inactivo').
 * @param {string} userId - El ID del usuario que realiza la operación.
 * @returns {Promise<void>}
 */
export const setCategoriaStatus = (id, nuevoEstado, userId) => {
  const categoriaDoc = doc(db, 'categorias', id);
  return updateDoc(categoriaDoc, {
    estado: nuevoEstado,
    fecha_estado: serverTimestamp(),
    usuario_ultima_modificacion: userId,
    fecha_ultima_modificacion: serverTimestamp(),
  });
};

/**
 * Elimina una categoría de forma física de la base de datos. 
 * (Uso no recomendado, preferir borrado lógico via estado)
 * @param {string} id - El ID de la categoría a eliminar.
 * @returns {Promise<void>}
 */
export const deleteCategoria = (id) => {
  const categoriaDoc = doc(db, 'categorias', id);
  return deleteDoc(categoriaDoc);
};

