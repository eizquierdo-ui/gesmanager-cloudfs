
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

// --- Páginas de Mantenimientos ---
import Empresas from './pages/accesos/Empresas.jsx';
import RolesPage from './pages/accesos/RolesPage'; 
import UsuariosPage from './pages/accesos/UsuariosPage';
import UsuariosXEmpresaPage from './pages/accesos/UsuariosXEmpresaPage.jsx'; // <-- NUEVA PÁGINA

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/" /> : children;
}

function App() {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route 
        path="/*" 
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        
        {/* --- Mantenimientos de Accesos --- */}
        <Route path="accesos/empresas" element={<Empresas />} />
        <Route path="accesos/roles" element={<RolesPage />} />
        <Route path="accesos/usuarios" element={<UsuariosPage />} />
        <Route path="accesos/usuarios-x-empresa" element={<UsuariosXEmpresaPage />} /> {/* <-- NUEVA RUTA */}
        
        <Route path="*" element={<NotFound />} />
      </Route>
      
    </Routes>
  );
}

export default App;
