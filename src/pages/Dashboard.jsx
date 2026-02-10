import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // Importamos el hook

const styles = {
  dashboardContainer: {
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  titleSection: {},
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
  },
  selectors: {
    marginTop: '15px',
    display: 'flex',
    gap: '30px',
    color: '#555',
    fontSize: '16px',
  },
  userSection: {
    textAlign: 'right',
  },
  welcomeMessage: {
    margin: 0,
    color: '#007bff',
    fontWeight: '500',
  },
  userName: {
    margin: '5px 0 0',
    fontWeight: 'bold',
    color: '#333',
  },
};

function Dashboard() {
  const { userData } = useAuth(); // Usamos el hook para obtener los datos del usuario

  // Mostramos el nombre de usuario si está disponible, si no, un mensaje de carga
  const userName = userData ? userData.nombre_usuario : 'Cargando...';

  return (
    <div style={styles.dashboardContainer}>
      <header style={styles.header}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>GESManager-CloudFS - Gestor de Cotizaciones</h1>
          <div style={styles.selectors}>
            <span>Empresa: [Seleccion Empresa]</span>
            <span>Tipo Cambio: [Seleccione tipo de cambio]</span>
          </div>
        </div>
        <div style={styles.userSection}>
          <p style={styles.welcomeMessage}>Usuario:</p>
          <h2 style={styles.userName}>{userName}</h2>
        </div>
      </header>

      {/* El resto del contenido del dashboard irá aquí */}
    </div>
  );
}

export default Dashboard;
