// src/services/firestore/rolesService.js

import { db } from '../../firebase'; // <-- RUTA CORREGIDA
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';

const rolesCollection = collection(db, 'roles');

// --- OBTENER TODOS LOS ROLES ---
export const getAllRoles = async () => {
  try {
    const snapshot = await getDocs(rolesCollection);
    const roles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return roles;
  } catch (error) {
    console.error("Error al obtener roles: ", error);
    throw error;
  }
};

// --- CREAR UN NUEVO ROL ---
export const createRole = async (roleData, userId) => {
  try {
    // El ID del documento será el nombre del rol para evitar duplicados
    const newRoleRef = doc(rolesCollection, roleData.id);
    await setDoc(newRoleRef, {
      role_nombre: roleData.id, // El ID es el nombre
      estado: roleData.estado,
      date_created: serverTimestamp(),
      date_modified: serverTimestamp(),
      created_user_id: userId,
      modified_user_id: userId,
      fecha_estado: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al crear rol: ", error);
    throw error;
  }
};

// --- ACTUALIZAR UN ROL ---
export const updateRole = async (roleId, roleData, userId) => {
  try {
    const roleRef = doc(db, 'roles', roleId);
    await updateDoc(roleRef, {
      ...roleData,
      date_modified: serverTimestamp(),
      modified_user_id: userId,
    });
  } catch (error) {
    console.error("Error al actualizar rol: ", error);
    throw error;
  }
};

// --- CAMBIAR ESTADO DE UN ROL ---
export const setRoleStatus = async (roleId, newStatus, userId) => {
  try {
    const roleRef = doc(db, 'roles', roleId);
    await updateDoc(roleRef, {
      estado: newStatus,
      date_modified: serverTimestamp(),
      modified_user_id: userId,
      fecha_estado: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al cambiar estado del rol: ", error);
    throw error;
  }
};

// --- ELIMINAR UN ROL ---
export const deleteRole = async (roleId) => {
  try {
    const roleRef = doc(db, 'roles', roleId);
    await deleteDoc(roleRef);
  } catch (error) {
    console.error("Error al eliminar rol: ", error);
    throw error;
  }
};
