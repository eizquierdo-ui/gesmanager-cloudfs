
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const MENU_COLLECTION = 'menu2';
const ROLES_COLLECTION = 'roles';
const PERMISSIONS_COLLECTION = 'roles-accesos2';

/**
 * Obtiene todos los roles de la base de datos.
 * @returns {Promise<Array>} Una promesa que se resuelve con un array de documentos de roles.
 */
export const getRoles = async () => {
  const rolesRef = collection(db, ROLES_COLLECTION);
  const q = query(rolesRef);
  const querySnapshot = await getDocs(q);
  const roles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return roles.sort((a, b) => a.id.localeCompare(b.id)); 
};

/**
 * Función principal que obtiene, sincroniza y devuelve los permisos para un rol específico.
 * Compara la colección 'menu2' (fuente de la verdad) con 'roles-accesos2'.
 * @param {string} roleId El ID del rol a consultar.
 * @returns {Promise<Array>} Una promesa que se resuelve con la lista de permisos completa y sincronizada.
 */
export const getAndSyncPermissionsForRole = async (roleId) => {
  if (!roleId) return [];

  const auth = getAuth();
  const userId = auth.currentUser ? auth.currentUser.uid : 'system';

  const batch = writeBatch(db);

  // 1. Obtener la fuente de la verdad: todos los ítems de menu2
  const menuQuery = query(collection(db, MENU_COLLECTION));
  const menuSnapshot = await getDocs(menuQuery);
  const masterMenuMap = new Map(menuSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));

  // 2. Obtener los permisos actuales para el rol
  const permissionsQuery = query(collection(db, PERMISSIONS_COLLECTION), where('role_id', '==', roleId));
  const permissionsSnapshot = await getDocs(permissionsQuery);
  const currentPermissionsMap = new Map(permissionsSnapshot.docs.map(doc => [doc.data().menu_id, { id: doc.id, ...doc.data() }]));

  let hasChanges = false;

  // 3. Sincronizar: Iterar sobre el menú maestro
  for (const [menuId, menuItem] of masterMenuMap.entries()) {
    const existingPermission = currentPermissionsMap.get(menuId);

    if (!existingPermission) {
      const newPermRef = doc(db, PERMISSIONS_COLLECTION, `${roleId}_${menuId}`);
      batch.set(newPermRef, {
        role_id: roleId,
        menu_id: menuId,
        on_off: false,
        Label: menuItem.Label,
        Orden: menuItem.Orden, // <- Aseguramos que se guarde como 'Orden' (Mayúscula)
        es_padre: menuItem.es_padre,
        id_padre: menuItem.id_padre,
        fecha_creacion: serverTimestamp(),
        usuario_creo: userId,
      });
      hasChanges = true;
    } else {
        if (existingPermission.Label !== menuItem.Label || existingPermission.Orden !== menuItem.Orden) {
            const permRef = doc(db, PERMISSIONS_COLLECTION, existingPermission.id);
            batch.update(permRef, {
                Label: menuItem.Label,
                Orden: menuItem.Orden // <- Aseguramos que se actualice como 'Orden' (Mayúscula)
            });
            hasChanges = true;
        }
    }
  }

  // 4. Limpieza: Eliminar permisos sobrantes
  for (const [menuId, permission] of currentPermissionsMap.entries()) {
    if (!masterMenuMap.has(menuId)) {
      const permToDeleteRef = doc(db, PERMISSIONS_COLLECTION, permission.id);
      batch.delete(permToDeleteRef);
      hasChanges = true;
    }
  }

  // 5. Ejecutar el batch si hubo cambios
  if (hasChanges) {
    await batch.commit();
  }

  // 6. Devolver la lista ya sincronizada y ordenada
  // ¡¡¡ ESTA ES LA LÍNEA CRÍTICA CORREGIDA SEGÚN LOS DATOS REALES !!!
  const finalPermissionsQuery = query(collection(db, PERMISSIONS_COLLECTION), where('role_id', '==', roleId), orderBy('Orden')); // Usando 'Orden' con MAYÚSCULA
  const finalSnapshot = await getDocs(finalPermissionsQuery);
  
  return finalSnapshot.docs.map(doc => ({
    doc_id: doc.id,
    ...doc.data()
  }));
};

/**
 * Actualiza el estado (on_off) de un permiso específico.
 */
export const updatePermission = async (docId, newStatus) => {
    if(!docId) throw new Error("Se requiere el ID del documento de permiso.");
    
    const auth = getAuth();
    const userId = auth.currentUser ? auth.currentUser.uid : 'system';
    const permissionRef = doc(db, PERMISSIONS_COLLECTION, docId);

    await updateDoc(permissionRef, {
        on_off: newStatus,
        fecha_ultima_modificacion: serverTimestamp(),
        usuario_ultima_modificacion: userId,
    });
};
