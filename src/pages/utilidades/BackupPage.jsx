import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Toolbar, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Tooltip, CircularProgress, Container, Alert, AlertTitle
} from '@mui/material';

// Iconos
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';

const BackupPage = () => {
  const [backupsDiarios, setBackupsDiarios] = useState([]);
  const [backupsMensuales, setBackupsMensuales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const GITHUB_REPO = 'eizquierdo-ui/gesmanager-cloudfs';
  const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/backups`;

  const fetchBackups = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener backups diarios (raíz de la carpeta backups)
      const resDiarios = await fetch(API_URL);
      if (!resDiarios.ok) {
        throw new Error('No se pudo obtener la lista de backups diarios.');
      }
      const dataDiarios = await resDiarios.json();
      
      // Filtrar solo los archivos .json
      const diarios = dataDiarios.filter(file => file.type === 'file' && file.name.endsWith('.json'));
      setBackupsDiarios(diarios);

      // Intentar obtener backups mensuales (subcarpeta mensuales)
      try {
        const resMensuales = await fetch(`${API_URL}/mensuales`);
        if (resMensuales.ok) {
          const dataMensuales = await resMensuales.json();
          const mensuales = dataMensuales.filter(file => file.type === 'file' && file.name.endsWith('.json'));
          setBackupsMensuales(mensuales);
        }
      } catch (err) {
        console.warn('La carpeta de mensuales aún no existe o no tiene acceso.', err);
      }
      
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleDownload = (downloadUrl, fileName) => {
    // Para descargar el archivo, abrimos la URL cruda de GitHub en una nueva pestaña
    window.open(downloadUrl, '_blank');
  };

  const handleRestore = (fileName) => {
    alert(`La funcionalidad de restauración para "${fileName}" está programada para la Fase 2.\n\nPor seguridad, actualmente las restauraciones deben hacerse mediante procesos Batch en el backend.`);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- Renderizado de Tabla ---
  const renderTable = (archivos, titulo) => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', px: 2 }}>
        {titulo}
      </Typography>
      <TableContainer sx={{ overflowX: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{fontWeight: 'bold'}}>Nombre del Archivo</TableCell>
              <TableCell sx={{fontWeight: 'bold'}}>Tamaño</TableCell>
              <TableCell align="right" sx={{fontWeight: 'bold'}}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {archivos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No se encontraron archivos de backup.
                </TableCell>
              </TableRow>
            ) : archivos.map((file) => (
              <TableRow hover key={file.sha}>
                <TableCell>{file.name}</TableCell>
                <TableCell>{formatSize(file.size)}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Descargar Backup">
                    <IconButton color="primary" onClick={() => handleDownload(file.download_url, file.name)}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Restaurar Base de Datos">
                    <IconButton color="warning" onClick={() => handleRestore(file.name)}>
                      <SettingsBackupRestoreIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}> 
      <Paper sx={{ width: '100%', mb: 2, pb: 3, overflow: 'hidden' }}>
        <Toolbar sx={{ borderBottom: '1px solid #e0e0e0', mb: 3 }}>
          <Typography variant="h5" component="div" sx={{ flex: '1 1 100%', fontWeight: 'bold' }}>
            Gestión de Backups (Base de Datos)
          </Typography>
          <Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={() => navigate('/')}>
            Salir
          </Button>
        </Toolbar>

        {error && (
          <Container sx={{ mb: 3 }}>
            <Alert severity="error">
              <AlertTitle>Error de Conexión</AlertTitle>
              {error} - Asegúrate de que los backups se hayan generado exitosamente en GitHub.
            </Alert>
          </Container>
        )}

        <Container maxWidth="xl">
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {renderTable(backupsDiarios, 'Backups Diarios (Rotativos)')}
              {renderTable(backupsMensuales, 'Backups Mensuales (Histórico)')}
            </>
          )}
        </Container>
      </Paper>
    </Box>
  );
};

export default BackupPage;
