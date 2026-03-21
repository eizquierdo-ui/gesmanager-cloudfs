// src/services/sessionService.js
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, deleteField, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// --- EXPORTACIÓN DE UTILIDADES DE FIRESTORE ---
export { deleteField };

/**
 * Obtiene los datos de la sesión de un usuario desde Firestore.
 * Si no existe un documento para el usuario, lo crea con la estructura ESTANDARIZADA y CORREGIDA.
 * @param {string} userId - El UID del usuario autenticado.
 * @returns {Promise<object|null>} Los datos de la sesión del usuario, o null si ocurre un error.
 */
export const getSessionData = async (userId) => {
  if (!userId) return null;

  const sessionRef = doc(db, 'sesiones', userId);
  try {
    const docSnap = await getDoc(sessionRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log(`No se encontró sesión para ${userId}. Creando documento de sesión con la estructura DEFINITIVA.`);
      
      const initialData = {
        usuario_id: userId,
        role_id: null,
        empresa_id: null,
        empresa_nombre: null,
        tipo_cambio_id: null,
        tipo_cambio_fecha: null,
        tipo_cambio_moneda_base_id: null,
        tipo_cambio_moneda_base_simbolo: null,
        tipo_cambio_moneda_destino_id: null,
        tipo_cambio_moneda_destino_simbolo: null,
        tipo_cambio_tasa_compra: 0,
        tipo_cambio_tasa_venta: 0,
        fecha_creacion: serverTimestamp(),
        usuario_creo: userId,
        fecha_ultima_actualizacion: serverTimestamp(),
        usuario_ultima_modificacion: userId,
      };

      await setDoc(sessionRef, initialData);
      return initialData;
    }
  } catch (error) {
    console.error("Error crítico al obtener o crear la sesión del usuario:", error);
    return null;
  }
};

/**
 * Actualiza los datos de la sesión de un usuario en Firestore.
 * @param {string} userId - El UID del usuario.
 * @param {object} data - Un objeto con los campos a actualizar en el documento de sesión.
 * @returns {Promise<boolean>} True si la actualización fue exitosa, false en caso contrario.
 */
export const updateSession = async (userId, data) => {
  if (!userId || !data) return false;

  const sessionRef = doc(db, 'sesiones', userId);
  try {
    await updateDoc(sessionRef, {
      ...data,
      fecha_ultima_actualizacion: serverTimestamp(),
      usuario_ultima_modificacion: userId,
    });
    console.log(`Sesión del usuario ${userId} actualizada correctamente.`);
    return true;
  } catch (error) {
    console.error("Error al actualizar la sesión del usuario:", error);
    return false;
  }
};

/**
 * Proporciona una suscripción en tiempo real a los cambios en el documento de sesión de un usuario,
 * ENRIQUECIENDO los datos con la información de la empresa y sus monedas.
 * @param {string} userId - El UID del usuario.
 * @param {function} callback - La función que se ejecutará cada vez que los datos de la sesión cambien.
 * @returns {import('firebase/firestore').Unsubscribe} Una función para cancelar la suscripción.
 */
export const onSessionChange = (userId, callback) => {
  if (!userId || typeof callback !== 'function') {
    return () => {};
  }

  const sessionRef = doc(db, 'sesiones', userId);

  const unsubscribe = onSnapshot(sessionRef, async (sessionDoc) => {
    let sessionData;

    if (sessionDoc.exists()) {
      sessionData = sessionDoc.data();
    } else {
      sessionData = await getSessionData(userId);
    }

    // Si hay una empresa seleccionada, enriquecemos la sesión
    if (sessionData && sessionData.empresa_id) {
      try {
        const empresaRef = doc(db, 'empresas', sessionData.empresa_id);
        const [empresaDoc, monedasSnapshot] = await Promise.all([
          getDoc(empresaRef),
          getDocs(collection(empresaRef, 'monedas'))
        ]);

        if (empresaDoc.exists()) {
          sessionData.datosEmpresa = { id: empresaDoc.id, ...empresaDoc.data() };
        } else {
          sessionData.datosEmpresa = null;
        }

        sessionData.monedas = monedasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      } catch (error) {
        console.error("Error al enriquecer la sesión con datos de la empresa:", error);
        sessionData.datosEmpresa = null;
        sessionData.monedas = []; // Aseguramos que sea un array vacío en caso de error
      }
    } else {
      // Si no hay empresa, nos aseguramos que los campos estén limpios
      sessionData.datosEmpresa = null;
      sessionData.monedas = [];
    }
    
    // Llamamos al callback con la sesión (posiblemente enriquecida)
    callback(sessionData);

  }, (error) => {
    console.error("Error en la suscripción en tiempo real a la sesión:", error);
  });

  return unsubscribe;
};
