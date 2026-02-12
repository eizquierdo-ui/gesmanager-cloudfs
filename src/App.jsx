
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Home from './pages/Home'; // Importamos Home directamente ya que es el layout principal

// --- Páginas Cargadas de Forma Perezosa (Lazy Loading) ---
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Empresas = lazy(() => import('./pages/accesos/Empresas.jsx'));
const RolesPage = lazy(() => import('./pages/accesos/RolesPage'));
const UsuariosPage = lazy(() => import('./pages/accesos/UsuariosPage'));
const UsuariosXEmpresaPage = lazy(() => import('./pages/accesos/UsuariosXEmpresaPage.jsx'));

// --- Componentes de Control de Rutas ---

// Protege las rutas que requieren autenticación.
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

// Gestiona las rutas públicas para usuarios ya autenticados.
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/" /> : children;
};

// --- Aplicación Principal ---

function App() {
  return (
    <Suspense fallback={<div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>Cargando...</div>}>
      <Routes>
        {/* 1. Ruta Pública: El login */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* 2. Rutas Privadas: El layout principal que contiene el Outlet */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        >
          {/* Estas rutas se renderizan DENTRO del componente Home */}
          <Route index element={<Dashboard />} />
          <Route path="accesos/empresas" element={<Empresas />} />
          <Route path="accesos/roles" element={<RolesPage />} />
          <Route path="accesos/usuarios" element={<UsuariosPage />} />
          <Route path="accesos/usuarios-x-empresa" element={<UsuariosXEmpresaPage />} />
        </Route>
        
        {/* 3. Ruta de Captura: Para cualquier URL no encontrada */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
