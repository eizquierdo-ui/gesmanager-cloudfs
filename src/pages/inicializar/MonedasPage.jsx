
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Toolbar, Typography, TextField, InputAdornment, 
  Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Tooltip, CircularProgress, Modal, Fade, Backdrop, Chip
} from '@mui/material';
import { format } from 'date-fns';

// --- Servicios ---
import {
  getAllMonedas,
  createMoneda,
  updateMoneda,
  deleteMoneda,
  setMonedaStatus
} from '../../services/firestore/monedasService';

// --- Íconos ---
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteForeverTwoToneIcon from '@mui/icons-material/DeleteForeverTwoTone';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

// --- Componentes ---
import MonedaForm from '../../components/forms/MonedaForm';

// --- Estilos ---
const style = {
  modal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '600px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  },
};

// --- Utilidad de Formato de Fecha ---
const formatFirestoreTimestamp = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return 'N/A';
  try {
    return format(timestamp.toDate(), 'dd/MM/yyyy HH:mm');
  } catch (e) {
    console.error("Error al formatear la fecha:", e);
    return 'Fecha inválida';
  }
};

const MonedasPage = () => {
  const [monedas, setMonedas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [currentMoneda, setCurrentMoneda] = useState(null);
  const [refetchIndex, setRefetchIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMonedas = async () => {
      setLoading(true);
      try {
        const data = await getAllMonedas();
        setMonedas(data);
      } catch (error) {
        console.error("Error al obtener monedas:", error);
      }
      setLoading(false);
    };

    fetchMonedas();
  }, [refetchIndex]);

  const forceRefetch = () => {
    setRefetchIndex(prev => prev + 1);
  }

  const filteredMonedas = useMemo(() => 
    monedas.filter(m => 
      m.moneda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    ), [monedas, searchTerm]);
    
  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta moneda? Esta acción no se puede deshacer.')) {
      try {
        await deleteMoneda(id);
        forceRefetch();
      } catch (error) {
        console.error("Error al eliminar moneda:", error);
      }
    }
  };
  
  const handleToggleEstado = async (item) => {
    const nuevoEstado = item.estado === 'activo' ? 'inactivo' : 'activo';
    if (window.confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) {
      try {
        await setMonedaStatus(item.id, nuevoEstado);
        forceRefetch();
      } catch (error) {
        console.error("Error al cambiar estado:", error);
      }
    }
  };
  
  const handleOpenModal = (item = null) => {
    setCurrentMoneda(item);
    setOpenModal(true);
  };
  
  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentMoneda(null);
  };

  const handleFormSubmit = async (values) => {
    try {
      if (currentMoneda) {
        await updateMoneda(currentMoneda.id, values);
      } else {
        await createMoneda(values);
      }
      forceRefetch();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar moneda:", error);
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flex: '1 1 100%', fontWeight: 'bold' }}>
            Mantenimiento de Monedas
          </Typography>

          <TextField 
            variant="standard" placeholder="Buscar..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ mr: 2, width: '300px' }}
          />
          
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ mr: 1 }}>
            NUEVO
          </Button>
          <Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={() => navigate('/')}>
            SALIR
          </Button>
        </Toolbar>

        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{fontWeight: 'bold'}}>Código</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Moneda</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Símbolo</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Estado</TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold'}}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
              ) : filteredMonedas.map((item) => (
                <TableRow hover key={item.id}>
                  <TableCell sx={{fontWeight: 'bold'}}>{item.codigo}</TableCell>
                  <TableCell>{item.moneda}</TableCell>
                  <TableCell>{item.simbolo}</TableCell>
                  <TableCell>
                     <Chip 
                        label={item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                        color={item.estado === 'activo' ? 'success' : 'error'} 
                        size="small" sx={{ fontWeight: 'bold' }}
                      />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={item.estado === 'activo' ? 'Inactivar' : 'Activar'}>
                      <IconButton onClick={() => handleToggleEstado(item)} size="small">
                        {item.estado === 'activo' ? <ToggleOnIcon color="success" /> : <ToggleOffIcon color="error" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenModal(item)} size="small">
                        <EditTwoToneIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(item.id)} size="small">
                        <DeleteForeverTwoToneIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Modal open={openModal} onClose={handleCloseModal} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={openModal}>
          <Box sx={style.modal}>
            <Typography variant="h5" component="h2" sx={{mb: 3, fontWeight: 'bold'}}>
              {currentMoneda ? 'Editar Moneda' : 'Crear Nueva Moneda'}
            </Typography>
            <MonedaForm 
              initialData={currentMoneda}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
            />
            {currentMoneda && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'grey.300', textAlign: 'center' }}>
                <Typography variant="caption" display="block">
                  Creado: {formatFirestoreTimestamp(currentMoneda.fecha_creacion)} por {currentMoneda.usuario_creo}
                </Typography>
                <Typography variant="caption" display="block">
                  Modificado: {formatFirestoreTimestamp(currentMoneda.fecha_ultima_modificacion)} por {currentMoneda.usuario_ultima_modificacion}
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default MonedasPage;
