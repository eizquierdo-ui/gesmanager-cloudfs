import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// 1. Creamos el Contexto
const AuthContext = createContext();

// 2. Creamos un Hook personalizado
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. Creamos el Proveedor del Contexto
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null); // <-- NUEVO: Estado para datos de Firestore
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
        // Si hay un usuario, buscamos sus datos en Firestore
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data()); // Guardamos los datos del documento
        } else {
          // Manejar el caso donde el usuario existe en Auth pero no en Firestore
          console.error("Error: No se encontró el documento del usuario en Firestore.");
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth, db]);

  // Valores que estarán disponibles globalmente
  const value = {
    currentUser,
    userData, // <-- NUEVO: Exponemos los datos del usuario
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
