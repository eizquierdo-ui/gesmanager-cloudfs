
// src/contexts/AppContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onSessionChange } from '../services/sessionService';
import { useAuth } from './AuthContext';

const AppContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [sessionData, setSessionData] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    if (currentUser) {
      setLoadingSession(true);
      unsubscribe = onSessionChange(currentUser.uid, (data) => {
        setSessionData(data);
        setLoadingSession(false);
      });
    } else {
      setSessionData(null);
      setLoadingSession(false);
    }

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // --- ¡LA SOLUCIÓN! ---
  // Función para permitir actualizaciones optimistas e inmediatas del estado de sesión
  const setSession = useCallback((newData) => {
    setSessionData(prevData => {
      const updatedData = { ...prevData, ...newData };
      // Si se limpia la empresa, limpiamos también el tipo de cambio
      if (newData.empresaId === null) {
          updatedData.tipoCambio = null;
      }
      return updatedData;
    });
  }, []);

  const value = {
    sessionData,
    loadingSession,
    setSession, // Exponemos la nueva función en el contexto
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
