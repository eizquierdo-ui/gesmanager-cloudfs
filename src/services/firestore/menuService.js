
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  where, // <-- Importar 'where'
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { format } from 'date-fns';

const db = getFirestore();
const menuCollection = collection(db, 'menu2');

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : timestamp;
  return format(date, 'dd/MM/yyyy-HH:mm:ss.SSS');
};

const getCurrentUserEmail = () => {
  const auth = getAuth();
  return auth.currentUser ? auth.currentUser.email : 'SYSTEM';
};

export const subscribeToMenus = (callback) => {
  const q = query(menuCollection, orderBy('Orden'));
  return onSnapshot(q, (snapshot) => {
    const menus = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(menus);
  });
};

// --- NUEVA FUNCIÓN --- 
// Obtiene solo los menús que pueden ser padres
export const subscribeToParentMenus = (callback) => {
  const q = query(menuCollection, where('es_padre', '==', true), orderBy('Orden'));
  return onSnapshot(q, (snapshot) => {
    const parentMenus = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(parentMenus);
  });
};
// --- FIN NUEVA FUNCIÓN ---

export const addMenu = (menuData) => {
  const userEmail = getCurrentUserEmail();
  const now = serverTimestamp();
  
  const newMenu = {
    ...menuData,
    // Asegurarnos que el ID no se guarde en los datos del documento
    id: undefined,
    estado: 'activo',
    fecha_creacion: now,
    usuario_creo: userEmail,
    fecha_ultima_modificacion: now,
    usuario_ultima_modificacion: userEmail,
    fecha_estado: now,
  };
  delete newMenu.id; // Doble seguridad para no guardar el ID de firestore como un campo
  return addDoc(menuCollection, newMenu);
};

export const updateMenu = (id, menuData) => {
  const userEmail = getCurrentUserEmail();
  const docRef = doc(db, 'menu2', id);
  
  const updatedMenu = {
    ...menuData,
    fecha_ultima_modificacion: serverTimestamp(),
    usuario_ultima_modificacion: userEmail,
  };

  if (menuData.hasOwnProperty('estado')) {
      updatedMenu.fecha_estado = serverTimestamp();
  }

  return updateDoc(docRef, updatedMenu);
};

export const updateMenuState = (id, currentStatus) => {
  const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
  return updateDoc(doc(db, 'menu2', id), {
    estado: newStatus,
    fecha_estado: serverTimestamp(),
    fecha_ultima_modificacion: serverTimestamp(),
    usuario_ultima_modificacion: getCurrentUserEmail(),
  });
};

export const deleteMenu = (id) => {
  return deleteDoc(doc(db, 'menu2', id));
};
