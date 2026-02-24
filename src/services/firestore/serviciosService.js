
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../../firebase';

const serviciosCollectionRef = collection(db, 'servicios');

export const getServiciosByCategoria = async (empresaId, categoriaId) => {
  const q = query(
    serviciosCollectionRef,
    where('empresa_id', '==', empresaId),
    where('categoria_id', '==', categoriaId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createServicio = (servicioData, userId) => {
  return addDoc(serviciosCollectionRef, {
    ...servicioData,
    
    // --- Campos de fecha corregidos ---
    estado: 'activo',
    fecha_estado: new Date(),
    usuario_creo: userId,
    fecha_creacion: new Date(),
    usuario_ultima_modificacion: userId,
    fecha_ultima_modificacion: new Date(),

    // --- Estructura de precios_calculados corregida ---
    precios_calculados: {
      costo_total_base: 0,
      tasa_ganancia_global: 0,
      valorfee_global: 0,
      costo_mas_feeglobal: 0,
      tasa_impuestos: 21,
      valor_impuetos: 0,
      precio_venta_base: 0,
      tipocambio_id: null,
      tipocambio_tasa_compra: 0,
      // --- Campos de moneda normalizados ---
      tipocambio_moneda_base_id: null,
      tipocambio_moneda_base_simbolo: null,
      tipocambio_moneda_destino_id: null,
      tipocambio_moneda_destino_simbolo: null,
      // ---
      tipocambios_fecha_tipocambio: null
    },

    rubros_detalle: [
      {
        descripcion_costo: "",
        valor: 0,
        tasa_fee: 0
      }
    ],

    // --- Historial con fecha corregida ---
    rubros_historial: [
      {
        fecha: new Date(),
        costo_total_base_ant: 0,
        precio_venta_base_ant: 0,
        tasa_ganancia_global_ant: 0,
        costo_total_base: 0,
        precio_venta_base: 0,
        tasa_ganancia_global: 0
      }
    ]
  });
};

export const updateServicio = (id, servicioData, userId) => {
  const servicioDoc = doc(db, 'servicios', id);
  const dataToUpdate = {
    ...servicioData,
    usuario_ultima_modificacion: userId,
    fecha_ultima_modificacion: serverTimestamp(),
  };
  if (Object.prototype.hasOwnProperty.call(servicioData, 'estado')) {
    dataToUpdate.fecha_estado = serverTimestamp();
  }
  return updateDoc(servicioDoc, dataToUpdate);
};

export const setServicioStatus = (id, nuevoEstado, userId) => {
  const servicioDoc = doc(db, 'servicios', id);
  return updateDoc(servicioDoc, {
    estado: nuevoEstado,
    fecha_estado: serverTimestamp(),
    usuario_ultima_modificacion: userId,
    fecha_ultima_modificacion: serverTimestamp(),
  });
};

export const deleteServicio = (id) => {
  const servicioDoc = doc(db, 'servicios', id);
  return deleteDoc(servicioDoc);
};

/**
 * Actualiza la estructura de precios de un servicio y guarda un registro en el historial.
 * @param {string} servicioId - El ID del servicio.
 * @param {Object} data - Objeto con precios_calculados y rubros_detalle.
 * @param {Object} newHistoryEntry - El nuevo objeto para el historial, sin la fecha.
 * @param {string} userId - El ID del usuario que realiza la operación.
 */
export const updateServicioPrecio = async (servicioId, data, newHistoryEntry, userId) => {
  const servicioDoc = doc(db, 'servicios', servicioId);

  // Prepara la entrada del historial con la fecha del cliente
  const historyEntryWithTimestamp = {
    ...newHistoryEntry,
    fecha: new Date(),
  };

  // Prepara el payload final para la actualización
  const dataToUpdate = {
    ...data,
    rubros_historial: arrayUnion(historyEntryWithTimestamp),
    usuario_ultima_modificacion: userId,
    fecha_ultima_modificacion: serverTimestamp(),
  };

  return updateDoc(servicioDoc, dataToUpdate);
};
