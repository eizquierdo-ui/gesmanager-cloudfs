
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';

const RefrescarDatosPage = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    // Guardamos una bandera en sessionStorage ANTES de recargar.
    sessionStorage.setItem('force_redirect_after_reload', 'true');
    window.location.reload(true);
  };

  const handleCancel = () => {
    navigate('/'); // Volver a la página de inicio
  };

  return (
    <Box 
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
      }}
    >
      <Paper 
        elevation={6}
        sx={{
          p: 4,
          maxWidth: '500px',
          textAlign: 'center',
        }}
      >
        <SyncIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Confirmar Recarga Completa
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Esta acción recargará completamente la aplicación. Es útil para aplicar las últimas actualizaciones o si nota que los datos no están sincronizados. ¿Está seguro de que desea continuar?
        </Typography>
        <Box 
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Button variant="outlined" color="secondary" onClick={handleCancel} sx={{ minWidth: '120px' }}>
            Cancelar
          </Button>
          <Button variant="contained" color="primary" onClick={handleRefresh} sx={{ minWidth: '120px' }}>
            Continuar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default RefrescarDatosPage;
