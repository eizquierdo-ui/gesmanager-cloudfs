
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy,
  setDoc,
  deleteDoc // Importar deleteDoc
} from 'firebase/firestore';

const getCurrentUserId = () => {
  const authState = JSON.parse(localStorage.getItem('firebase-auth-state'));
  return authState?.user?.uid || 'SYSTEM';
};

export const getRoles = async () => {
  const rolesCollection = collection(db, 'roles');
  const q = query(rolesCollection, orderBy('role_nombre', 'asc'));
  const rolesSnapshot = await getDocs(q);
  return rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getUsuarios = async () => {
  const usuariosCollection = collection(db, 'usuarios');
  const q = query(usuariosCollection, orderBy('nombre_usuario', 'asc'));
  const usuariosSnapshot = await getDocs(q);
  return usuariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createUsuarioDocument = async (uid, data) => {
    const userDocRef = doc(db, 'usuarios', uid);
    const currentUserId = getCurrentUserId();
    await setDoc(userDocRef, {
        nombre_usuario: data.nombre_usuario,
        email_usuario: data.email_usuario,
        role: data.role,
        estado: 'activo', // Por defecto activo al crear
        fecha_estado: serverTimestamp(),
        date_created: serverTimestamp(),
        created_user_id: currentUserId,
        date_modified: serverTimestamp(),
        modified_user_id: currentUserId,
    });
};

export const updateUsuario = async (id, data) => {
  const usuarioDoc = doc(db, 'usuarios', id);
  const currentUserId = getCurrentUserId();
  await updateDoc(usuarioDoc, {
    ...data,
    date_modified: serverTimestamp(),
    modified_user_id: currentUserId
  });
};

export const toggleUsuarioStatus = async (id, currentStatus) => {
  const usuarioDoc = doc(db, 'usuarios', id);
  const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
  const currentUserId = getCurrentUserId();
  await updateDoc(usuarioDoc, {
    estado: newStatus,
    fecha_estado: serverTimestamp(),
    date_modified: serverTimestamp(),
    modified_user_id: currentUserId
  });
};

// Nueva función para eliminar un usuario de Firestore
export const deleteUsuario = async (id) => {
  const usuarioDoc = doc(db, 'usuarios', id);
  await deleteDoc(usuarioDoc);
};
