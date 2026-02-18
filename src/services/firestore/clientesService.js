
// src/services/firestore/clientesService.js

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
} from 'firebase/firestore';
import { db } from '../../firebase'; // Asegúrate que la ruta a tu configuración de firebase sea correcta

const clientesCollectionRef = collection(db, 'clientes');

// Obtener todos los clientes de una empresa específica
export const getClientes = (empresaId) => {
  const q = query(clientesCollectionRef, where('empresa_id', '==', empresaId));
  return getDocs(q);
};

// Obtener un solo cliente por su ID
export const getCliente = (id) => {
  const clienteDoc = doc(db, 'clientes', id);
  return getDoc(clienteDoc);
};

// Crear un nuevo cliente
export const createCliente = (clienteData, userId) => {
  return addDoc(clientesCollectionRef, {
    ...clienteData,
    usuario_creo: userId,
    fecha_creacion: serverTimestamp(),
    usuario_ultima_modificacion: userId,
    fecha_ultima_modificacion: serverTimestamp(),
    fecha_estado: serverTimestamp(),
  });
};

// Actualizar un cliente existente
export const updateCliente = (id, clienteData, userId) => {
  const clienteDoc = doc(db, 'clientes', id);
  const dataToUpdate = {
    ...clienteData,
    usuario_ultima_modificacion: userId,
    fecha_ultima_modificacion: serverTimestamp(),
  };

  // Si el estado cambia, también actualizamos la fecha_estado
  if (Object.prototype.hasOwnProperty.call(clienteData, 'estado')) {
    dataToUpdate.fecha_estado = serverTimestamp();
  }

  return updateDoc(clienteDoc, dataToUpdate);
};


// Cambiar el estado de un cliente (activar/inactivar)
export const toggleClienteEstado = async (id, estadoActual, userId) => {
    const clienteDoc = doc(db, 'clientes', id);
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    return updateDoc(clienteDoc, {
        estado: nuevoEstado,
        usuario_ultima_modificacion: userId,
        fecha_ultima_modificacion: serverTimestamp(),
        fecha_estado: serverTimestamp(),
    });
};

// NO se incluye una función de borrado físico (deleteDoc) 
// para mantener la integridad de los datos. El borrado es lógico a través del estado.
