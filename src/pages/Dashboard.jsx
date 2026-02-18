import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // Importamos el hook
import { Typography, Box, Paper } from '@mui/material';

const styles = {
  dashboardContainer: {
    padding: '24px',
    height: '100%',
  },
  welcomePaper: {
    padding: '32px',
    textAlign: 'center',
  },
  welcomeMessage: {
    marginBottom: '16px',
  }
};

function Dashboard() {
  const { userData } = useAuth(); // Usamos el hook para obtener los datos del usuario

  // Mostramos el nombre de usuario si está disponible, si no, un mensaje de carga
  const userName = userData ? userData.nombre_usuario : 'Cargando...';

  return (
    <Box sx={styles.dashboardContainer}>
      <Paper sx={styles.welcomePaper}>
        <Typography variant="h4" component="h1" sx={styles.welcomeMessage}>
          ¡Bienvenido de nuevo, {userName}!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Aquí puedes ver un resumen de tu actividad y estado. Selecciona una opción del menú de la izquierda para comenzar.
        </Typography>
      </Paper>
    </Box>
  );
}

export default Dashboard;
