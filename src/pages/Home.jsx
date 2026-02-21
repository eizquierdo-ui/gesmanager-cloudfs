import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import './Home.css';

// --- Componente HeaderInfo ---
const HeaderInfo = () => {
  const { currentUser } = useAuth();
  const { sessionData, loadingSession } = useAppContext();

  const userName = currentUser?.displayName || currentUser?.email.split('@')[0];

  let tipoCambioDisplay = '[seleccione el tipo de cambio]';
  if (sessionData?.tipo_cambio_id) {
    try {
      const fecha = sessionData.tipo_cambio_fecha ? format(sessionData.tipo_cambio_fecha.toDate(), 'dd/MM/yyyy', { locale: es }) : '--/--/--';
      const monedaBase = sessionData.tipo_cambio_moneda_base || '---';
      const monedaDestino = sessionData.tipo_cambio_moneda_destino || '---';
      const tasaCompra = sessionData.tipo_cambio_tasa_compra?.toFixed(4) || '0.0000';
      const tasaVenta = sessionData.tipo_cambio_tasa_venta?.toFixed(4) || '0.0000';

      tipoCambioDisplay = `[Fecha: ${fecha} ${monedaBase}-${monedaDestino} Tc: ${tasaCompra} Tv: ${tasaVenta}]`;

    } catch (error) {
      console.error("Error al formatear la información del tipo de cambio:", error);
      tipoCambioDisplay = '[Error al mostrar tipo de cambio]';
    }
  }

  return (
    <header className="header-info">
      <div className="header-left">
        <h1>GESManager-CloudFS - Gestor de Cotizaciones</h1>
        <div className="session-details">
          <span>Empresa: 
            <span className="session-value">
              {loadingSession ? 'Cargando...' : (sessionData?.empresa_nombre || '[Seleccione Empresa]')}
            </span>
          </span>
          <span>Tipo Cambio: 
            <span className="session-value">
              {loadingSession ? '' : tipoCambioDisplay}
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
  const navigate = useNavigate();

  useEffect(() => {
    // Comprueba si existe la bandera de redirección forzada.
    if (sessionStorage.getItem('force_redirect_after_reload') === 'true') {
      // Si existe, la elimina para evitar bucles.
      sessionStorage.removeItem('force_redirect_after_reload');
      // Navega a la página de inicio.
      navigate('/', { replace: true });
    }
  }, [navigate]); // Se ejecuta solo una vez al montar el componente.

  return (
    <div className="home-layout">
      <Sidebar />
      <main className="main-content">
        <HeaderInfo />
        <div className="content-area">
            <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Home;
