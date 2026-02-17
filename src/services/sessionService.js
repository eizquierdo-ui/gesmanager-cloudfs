
// src/services/sessionService.js
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Se asume que la configuración de db está en src/firebase.js

/**
 * Obtiene los datos de la sesión de un usuario desde Firestore.
 * Si no existe un documento para el usuario, lo crea con valores iniciales.
 * Este es el punto que CREA la colección 'sesiones' si es la primera vez que se ejecuta.
 * @param {string} userId - El UID del usuario autenticado.
 * @returns {Promise<object|null>} Los datos de la sesión del usuario, o null si ocurre un error.
 */
export const getSessionData = async (userId) => {
  if (!userId) return null;

  const sessionRef = doc(db, 'sesiones', userId);
  try {
    const docSnap = await getDoc(sessionRef);

    if (docSnap.exists()) {
      // El documento de sesión ya existe, lo retornamos.
      return docSnap.data();
    } else {
      // El documento no existe, es la primera vez que este usuario interactúa.
      // Lo creamos con la estructura base.
      console.log(`No se encontró sesión para ${userId}. Creando documento de sesión inicial.`);
      const initialData = {
        userId: userId,
        roleId: null,
        empresaId: null,
        nombreEmpresa: null,
        monedaBaseId: null,
        tipoCambioId: null,
        infoTipoCambio: null,
        fecha_creacion: serverTimestamp(),
        usuario_creo: userId,
        fecha_ultima_actualizacion: serverTimestamp(),
        usuario_ultima_modificacion: userId,
      };
      await setDoc(sessionRef, initialData);
      return initialData; // Retornamos los datos recién creados.
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
 * Proporciona una suscripción en tiempo real a los cambios en el documento de sesión de un usuario.
 * @param {string} userId - El UID del usuario.
 * @param {function} callback - La función que se ejecutará cada vez que los datos de la sesión cambien.
 * @returns {import('firebase/firestore').Unsubscribe} Una función para cancelar la suscripción.
 */
export const onSessionChange = (userId, callback) => {
  if (!userId || typeof callback !== 'function') {
    return () => {}; // Retorna una función de desuscripción vacía si los parámetros son incorrectos.
  }

  const sessionRef = doc(db, 'sesiones', userId);
  
  const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      // Si el documento es eliminado o no existe, intentamos obtener/crear uno
      // y lo pasamos al callback.
      getSessionData(userId).then(callback);
    }
  }, (error) => {
    console.error("Error en la suscripción en tiempo real a la sesión:", error);
  });

  return unsubscribe;
};
