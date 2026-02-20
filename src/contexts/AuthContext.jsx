import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
// ¡IMPORTANTE! Usamos el servicio centralizado que acabamos de corregir.
import { getSessionData, updateSession } from '../services/sessionService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

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
    setUserData(null); 
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // --- ¡LÓGICA COMPLETAMENTE REFACTORIZADA! ---

        // 1. Aseguramos que el documento de sesión exista con la estructura correcta.
        await getSessionData(user.uid);
        console.log(`Verificación de sesión para el usuario ${user.uid} completada usando sessionService.`);

        // 2. Obtenemos los datos del perfil del usuario.
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const localUserData = userDocSnap.data();

          if (localUserData.role) {
            // 3. Verificamos que el rol del usuario esté activo.
            const roleDocRef = doc(db, 'roles', localUserData.role);
            const roleDocSnap = await getDoc(roleDocRef);

            if (roleDocSnap.exists() && roleDocSnap.data().estado === 'activo') {
              // Si todo está bien, actualizamos el estado local de la app.
              setUserData({
                ...localUserData,
                roleStatus: 'activo'
              });

              // 4. ¡CRÍTICO! Actualizamos la sesión con el role_id que acabamos de encontrar.
              await updateSession(user.uid, { role_id: localUserData.role });
              console.log(`Sesión del usuario ${user.uid} actualizada con el role_id: ${localUserData.role}.`);

            } else {
              console.error(`Acceso denegado: El rol '${localUserData.role}' está inactivo o no existe.`);
              setUserData(null);
            }
          } else {
            console.error("Acceso denegado: El usuario no tiene un rol asignado.");
            setUserData(null);
          }
        } else {
          console.error("Acceso denegado: No se encontró el documento del usuario.");
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth, db]);

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
