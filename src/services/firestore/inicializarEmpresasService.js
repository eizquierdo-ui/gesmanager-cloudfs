
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

const EMPRESAS_COLLECTION = 'empresas';

/**
 * Obtiene todas las empresas, ordenadas por nombre.
 */
export const getAllEmpresas = async () => {
  const q = query(collection(db, EMPRESAS_COLLECTION), orderBy('nombre', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Crea una nueva empresa.
 */
export const createEmpresa = async (empresaData) => {
  await addDoc(collection(db, EMPRESAS_COLLECTION), {
    ...empresaData,
    estado: 'activo',
    fecha_creacion: serverTimestamp(),
  });
};

/**
 * Actualiza una empresa existente.
 */
export const updateEmpresa = async (id, empresaData) => {
  const empresaRef = doc(db, EMPRESAS_COLLECTION, id);
  await updateDoc(empresaRef, {
    ...empresaData,
    fecha_ultima_modificacion: serverTimestamp(),
  });
};

/**
 * Elimina una empresa.
 */
export const deleteEmpresa = async (id) => {
  await deleteDoc(doc(db, EMPRESAS_COLLECTION, id));
};

/**
 * Cambia el estado de una empresa.
 */
export const setEmpresaStatus = async (id, nuevoEstado) => {
  const empresaRef = doc(db, EMPRESAS_COLLECTION, id);
  await updateDoc(empresaRef, { estado: nuevoEstado });
};
