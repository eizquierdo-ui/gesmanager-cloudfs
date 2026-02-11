
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// --- Páginas Cargadas de Forma Perezosa (Lazy Loading) ---
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Empresas = lazy(() => import('./pages/accesos/Empresas.jsx'));
const RolesPage = lazy(() => import('./pages/accesos/RolesPage'));
const UsuariosPage = lazy(() => import('./pages/accesos/UsuariosPage'));
const UsuariosXEmpresaPage = lazy(() => import('./pages/accesos/UsuariosXEmpresaPage.jsx'));

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/" /> : children;
};

function App() {
  return (
    <Suspense fallback={<div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>Cargando...</div>}>
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
          <Route path="accesos/usuarios-x-empresa" element={<UsuariosXEmpresaPage />} />
          
          <Route path="*" element={<NotFound />} />
        </Route>
        
      </Routes>
    </Suspense>
  );
}

export default App;
