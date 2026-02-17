import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext'; // Para obtener info del usuario
import { useAppContext } from '../contexts/AppContext'; // Para obtener info de la sesión
import './Home.css';

// --- Componente HeaderInfo --- 
// Lo creamos aquí mismo para mantener la lógica encapsulada
const HeaderInfo = () => {
  const { currentUser } = useAuth();
  const { sessionData, loadingSession } = useAppContext();

  // Extraemos el nombre de usuario del email si no hay displayName
  const userName = currentUser?.displayName || currentUser?.email.split('@')[0];

  return (
    <header className="header-info">
      <div className="header-left">
        <h1>GESManager-CloudFS - Gestor de Cotizaciones</h1>
        <div className="session-details">
          <span>Empresa: 
            <span className="session-value">
              {loadingSession ? 'Cargando...' : (sessionData?.nombreEmpresa || '[Seleccione Empresa]')}
            </span>
          </span>
          <span>Tipo Cambio: 
            <span className="session-value">
            {loadingSession ? '' : (sessionData?.infoTipoCambio || '[Seleccione Tipo Cambio]')}
            </span>
          </span>
        </div>
      </div>
      <div className="header-right">
        <span className="user-label">Usuario</span>
        <span className="user-name">{userName}</span>
      </div>
    </header>
  );
};


// --- Layout Principal Home ---
function Home() {
  return (
    <div className="home-layout">
      <Sidebar />
      <main className="main-content">
        <HeaderInfo /> { /* Añadimos el header aquí */ }
        <div className="content-area">
            <Outlet /> { /* Las páginas se renderizan aquí */ }
        </div>
      </main>
    </div>
  );
}

export default Home;
