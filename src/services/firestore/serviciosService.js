
// src/services/firestore/serviciosService.js

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
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';

const serviciosCollectionRef = collection(db, 'servicios');

/**
 * Obtiene todos los servicios de una empresa y categoría específicas.
 * @param {string} empresaId - El ID de la empresa.
 * @param {string} categoriaId - El ID de la categoría.
 * @returns {Promise<Array>} Un array con los documentos de los servicios.
 */
export const getServiciosByCategoria = async (empresaId, categoriaId) => {
  const q = query(
    serviciosCollectionRef,
    where('empresa_id', '==', empresaId),
    where('categoria_id', '==', categoriaId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Crea un nuevo servicio con valores iniciales y de auditoría.
 * @param {Object} servicioData - Datos básicos del servicio (nombre, detalle, itp).
 * @param {string} userId - El ID del usuario que crea el servicio.
 * @returns {Promise<DocumentReference>}
 */
export const createServicio = (servicioData, userId) => {
  return addDoc(serviciosCollectionRef, {
    ...servicioData,
    // --- Campos de Auditoría ---
    usuario_creo: userId,
    fecha_creacion: serverTimestamp(),
    usuario_ultima_modificacion: userId,
    fecha_ultima_modificacion: serverTimestamp(),
    fecha_estado: serverTimestamp(),
    // --- Campos de Precios Inicializados ---
    precios_calculados: {
      costo_total_base: 0,
      subtotal_base_impuestos: 0,
      precio_venta_base: 0,
      tasa_ganancia: 0
    },
    rubros_detalle: []
  });
};

/**
 * Actualiza la información básica de un servicio existente.
 * @param {string} id - El ID del servicio a actualizar.
 * @param {Object} servicioData - Los datos a actualizar (nombre, detalle, itp).
 * @param {string} userId - El ID del usuario que realiza la operación.
 * @returns {Promise<void>}
 */
export const updateServicio = (id, servicioData, userId) => {
  const servicioDoc = doc(db, 'servicios', id);
  const dataToUpdate = {
    ...servicioData,
    usuario_ultima_modificacion: userId,
    fecha_ultima_modificacion: serverTimestamp(),
  };

  // Si se está cambiando el estado, también actualizamos su fecha
  if (Object.prototype.hasOwnProperty.call(servicioData, 'estado')) {
    dataToUpdate.fecha_estado = serverTimestamp();
  }

  return updateDoc(servicioDoc, dataToUpdate);
};

/**
 * Cambia el estado de un servicio (activo/inactivo).
 * @param {string} id - El ID del servicio.
 * @param {string} nuevoEstado - El nuevo estado ('activo' o 'inactivo').
 * @param {string} userId - El ID del usuario que realiza la operación.
 * @returns {Promise<void>}
 */
export const setServicioStatus = (id, nuevoEstado, userId) => {
  const servicioDoc = doc(db, 'servicios', id);
  return updateDoc(servicioDoc, {
    estado: nuevoEstado,
    fecha_estado: serverTimestamp(),
    usuario_ultima_modificacion: userId,
    fecha_ultima_modificacion: serverTimestamp(),
  });
};

/**
 * Elimina un servicio de forma física de la base de datos.
 * @param {string} id - El ID del servicio a eliminar.
 * @returns {Promise<void>}
 */
export const deleteServicio = (id) => {
  const servicioDoc = doc(db, 'servicios', id);
  return deleteDoc(servicioDoc);
};

// --- AÚN NO IMPLEMENTADO: Función para la actualización de precios ---
/**
 * Actualiza la estructura de precios de un servicio y guarda un registro en el historial.
 * (Esta función se implementará en la Fase 2)
 * @param {string} servicioId - El ID del servicio.
 * @param {Object} nuevosPrecios - Objeto con precios_calculados y rubros_detalle.
 * @param {string} userId - El ID del usuario que realiza la operación.
 */
export const updateServicioPrecio = async (servicioId, nuevosPrecios, userId) => {
  // Lógica para batch write:
  // 1. Actualizar el documento principal del servicio.
  // 2. Crear un nuevo documento en la sub-colección 'historial_precios'.
  console.log("Función updateServicioPrecio aún no implementada.");
  return Promise.resolve();
};
