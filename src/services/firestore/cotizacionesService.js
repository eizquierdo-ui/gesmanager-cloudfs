
import { 
  collection, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp, runTransaction, getDoc, setDoc 
} from 'firebase/firestore';
import { db } from '../../firebase'; // Asegúrate que la ruta a tu configuración de firebase sea correcta

/**
 * Obtiene las cotizaciones de una empresa para ser mostradas en el tablero Kanban.
 * @param {string} empresaId - El ID de la empresa.
 * @param {object} filters - Objeto con los filtros a aplicar.
 * @returns {Array} Un array de objetos de cotización.
 */
export const getCotizacionesKanban = async (empresaId, filters = {}) => {
  if (!empresaId) {
    console.error("Error: Se requiere un ID de empresa para obtener las cotizaciones.");
    return [];
  }

  try {
    let q = query(collection(db, 'cotizaciones'), where('empresa_id', '==', empresaId));
    
    // Aplicar filtros
    if (filters.clienteId && filters.clienteId !== 'todos') {
      q = query(q, where('cliente_id', '==', filters.clienteId));
    }
    if (filters.estado && filters.estado !== 'todos') {
      q = query(q, where('estado', '==', filters.estado));
    }
    // Ordenamiento
    q = query(q, orderBy('numero_cotizacion', 'desc'));

    const querySnapshot = await getDocs(q);
    let cotizaciones = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fecha_emision: doc.data().fecha_emision?.toDate(),
      fecha_estado: doc.data().fecha_estado?.toDate(),
      fecha_creacion: doc.data().fecha_creacion?.toDate(),
      fecha_ultima_modificacion: doc.data().fecha_ultima_modificacion?.toDate(),
    }));

    // Aplicar filtros de fecha en memoria para evitar requerimientos de índices compuestos en Firestore
    if (filters.fechaDesde) {
      cotizaciones = cotizaciones.filter(c => c.fecha_emision >= filters.fechaDesde);
    }
    if (filters.fechaHasta) {
      const fechaHastaEnd = new Date(filters.fechaHasta);
      fechaHastaEnd.setHours(23, 59, 59, 999); // Final del día
      cotizaciones = cotizaciones.filter(c => c.fecha_emision <= fechaHastaEnd);
    }

    return cotizaciones;

  } catch (error) {
    console.error("Error al obtener las cotizaciones para el Kanban:", error);
    // Si la consola muestra un error de "query requires an index", se debe crear un nuevo índice compuesto en Firestore.
    // El enlace para crearlo aparecerá en el mensaje de error de la consola del navegador.
    return [];
  }
};

/**
 * Actualiza el estado de una cotización en Firestore.
 * @param {string} cotizacionId - El ID del documento de la cotización a actualizar.
 * @param {string} nuevoEstado - El nuevo estado a establecer.
 */
export const updateCotizacionEstado = async (cotizacionId, nuevoEstado) => {
  if (!cotizacionId || !nuevoEstado) {
    throw new Error("Se requieren el ID de la cotización y el nuevo estado.");
  }
  
  const cotizacionRef = doc(db, 'cotizaciones', cotizacionId);

  try {
    await updateDoc(cotizacionRef, {
      estado: nuevoEstado,
      fecha_estado: serverTimestamp(),
    });
    console.log(`Cotización ${cotizacionId} actualizada al estado: ${nuevoEstado}`);
  } catch (error) {
    console.error("Error al actualizar el estado de la cotización:", error);
    throw error;
  }
};

/**
 * Obtiene el siguiente número de cotización correlativo para una empresa, de forma atómica.
 * @param {string} empresaId - El ID de la empresa.
 * @returns {Promise<number>} - El siguiente número de cotización.
 */
export const getSiguienteNumeroCotizacion = async (empresaId) => {
  const correlativoRef = doc(db, 'correlativos', `cotizacion_${empresaId}`);

  try {
    const nuevoCorrelativo = await runTransaction(db, async (transaction) => {
      const correlativoDoc = await transaction.get(correlativoRef);
      let siguienteNumero = 1;

      if (correlativoDoc.exists()) {
        siguienteNumero = correlativoDoc.data().valor + 1;
      }
      
      transaction.set(correlativoRef, { valor: siguienteNumero, actualizado: serverTimestamp() }, { merge: true });
      
      return siguienteNumero;
    });

    return nuevoCorrelativo;
  } catch (error) {
    console.error("Error generando el siguiente número de cotización:", error);
    throw error;
  }
};

/**
 * Crea un nuevo documento de cotización en Firestore.
 * @param {object} nuevaCotizacionData - El objeto con los datos de la nueva cotización.
 * @returns {Promise<string>} - El ID del nuevo documento creado.
 */
export const addCotizacion = async (nuevaCotizacionData) => {
  const nuevaCotizacionRef = doc(collection(db, 'cotizaciones'));
  
  try {
    await setDoc(nuevaCotizacionRef, {
      ...nuevaCotizacionData,
      id: nuevaCotizacionRef.id, 
    });
    return nuevaCotizacionRef.id;
  } catch (error) {
    console.error("Error al crear la nueva cotización:", error);
    throw error;
  }
};
