
// src/contexts/AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onSessionChange } from '../services/sessionService';
import { useAuth } from './AuthContext'; // Se asume que AuthContext está en el mismo directorio

// 1. Creamos el contexto
const AppContext = createContext();

// 2. Creamos un hook personalizado para consumir el contexto fácilmente desde otros componentes
// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  return useContext(AppContext);
};

// 3. Creamos el componente Proveedor que envolverá nuestra aplicación
export const AppProvider = ({ children }) => {
  const { currentUser } = useAuth(); // Obtenemos el usuario del contexto de autenticación
  const [sessionData, setSessionData] = useState(null); // Estado para guardar los datos de la sesión
  const [loadingSession, setLoadingSession] = useState(true); // Estado para saber si aún estamos cargando la info

  useEffect(() => {
    setLoadingSession(true);
    let unsubscribe = () => {}; // Inicializamos la función de desuscripción

    if (currentUser) {
      // Si hay un usuario, nos suscribimos a los cambios de su sesión en Firestore
      unsubscribe = onSessionChange(currentUser.uid, (data) => {
        setSessionData(data);
        setLoadingSession(false);
      });
    } else {
      // Si no hay usuario, no hay sesión.
      setSessionData(null);
      setLoadingSession(false);
    }

    // La función de limpieza que se ejecuta cuando el componente se desmonta o el usuario cambia
    // Esto es crucial para evitar fugas de memoria.
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // El valor que proveeremos a todos los componentes hijos
  const value = {
    sessionData,
    loadingSession,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
