import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// 1. Creamos el Contexto
const AuthContext = createContext();

// 2. Creamos un Hook personalizado
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. Creamos el Proveedor del Contexto
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const db = getFirestore();

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    setUserData(null); // Limpiamos los datos del usuario al cerrar sesión
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // 1. Obtener datos del usuario desde la colección 'usuarios'
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const localUserData = userDocSnap.data();

          // 2. Verificar si el usuario tiene un rol asignado
          if (localUserData.role) {
            // 3. Obtener los datos del rol desde la colección 'roles'
            const roleDocRef = doc(db, 'roles', localUserData.role);
            const roleDocSnap = await getDoc(roleDocRef);

            // 4. Comprobar si el rol existe y está ACTIVO
            if (roleDocSnap.exists() && roleDocSnap.data().estado === 'activo') {
              // 5. El rol está activo, conceder acceso y guardar datos.
              //    Añadimos el estado del rol para futura referencia.
              setUserData({
                ...localUserData,
                roleStatus: 'activo'
              });
            } else {
              // 6. El rol está inactivo o no existe, DENEGAR acceso.
              console.error(`Acceso denegado: El rol '${localUserData.role}' asignado al usuario está inactivo o no existe.`);
              setUserData(null); // Paso crítico: Anula los permisos del usuario.
            }
          } else {
            console.error("Acceso denegado: El documento del usuario no tiene un rol asignado.");
            setUserData(null);
          }
        } else {
          console.error("Acceso denegado: No se encontró el documento del usuario en Firestore.");
          setUserData(null);
        }
      } else {
        // No hay usuario autenticado
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth, db]);

  // Valores que estarán disponibles globalmente
  const value = {
    currentUser,
    userData,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
