
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Toolbar, Typography, TextField, InputAdornment, 
  Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Tooltip, CircularProgress, Modal, Fade, Backdrop, Chip,
  Container, Alert, AlertTitle
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

// --- Contextos ---
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';

// --- Servicios de Firestore ---
import {
  getClientes,
  createCliente,
  updateCliente,
  toggleClienteEstado,
} from '../../services/firestore/clientesService';

// --- Componentes y Formularios ---
import ClienteForm from '../../components/forms/ClienteForm';

// --- Iconos ---
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

// --- Estilo del Modal ---
const style = {
  modal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '900px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  },
};

const ClientesPage = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [currentCliente, setCurrentCliente] = useState(null);
  
  const navigate = useNavigate();
  const { sessionData: app, loadingSession } = useAppContext();
  const { currentUser: user } = useAuth();

  const fetchClientes = useCallback(async () => {
    if (!app?.empresa_id || !user) return;
    try {
      setLoading(true);
      const clientesSnapshot = await getClientes(app.empresa_id);
      const clientesList = clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClientes(clientesList);
    } catch (error) {
      console.error("Error al obtener los clientes:", error);
    } finally {
      setLoading(false);
    }
  }, [app, user]);

  useEffect(() => {
    if (!loadingSession) {
        fetchClientes();
    }
  }, [fetchClientes, loadingSession]);

  const filteredClientes = useMemo(() => 
    clientes.filter(cliente => 
      cliente.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.nit_cliente && cliente.nit_cliente.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [clientes, searchTerm]);
    
  const handleToggleEstado = async (cliente) => {
    const nuevoEstado = cliente.estado === 'activo' ? 'inactivo' : 'activo';
    if (window.confirm(`¿Deseas cambiar el estado a "${nuevoEstado}"?`)) {
      try {
        await toggleClienteEstado(cliente.id, cliente.estado, user.uid);
        fetchClientes();
      } catch (error) {
        console.error("Error al cambiar el estado del cliente:", error);
      }
    }
  };
  
  const handleOpenModal = (cliente = null) => {
    setCurrentCliente(cliente);
    setOpenModal(true);
  };
  
  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentCliente(null);
  };

  const handleFormSubmit = async (values) => {
    if (!app?.empresa_id || !user) {
      console.error("No hay empresa seleccionada o usuario autenticado");
      return;
    }
    try {
      const data = { ...values, empresa_id: app.empresa_id };
      if (currentCliente) {
        await updateCliente(currentCliente.id, data, user.uid);
      } else {
        await createCliente(data, user.uid);
      }
      fetchClientes();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar el cliente:", error);
    }
  };

  // --- Guard Clause: Renderizado de Bloqueo ---
  if (loadingSession) {
    return (
        <Container sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
        </Container>
    );
  }

  if (!app?.empresa_id) {
    return (
      <Container sx={{ p: 3 }}>
        <Alert severity="error" variant="outlined" sx={{ '& .MuiAlert-icon': { fontSize: 30 } }}>
          <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Acceso Bloqueado</AlertTitle>
          Para gestionar clientes, primero debe seleccionar una empresa de trabajo. 
          Esta acción establece la empresa con la que operará en todos los módulos de mantenimiento y gestión.
          <br /><br />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/inicializar/empresa')} 
            startIcon={<BusinessIcon />}
          >
            Ir a Inicializar Empresa
          </Button>
        </Alert>
      </Container>
    );
  }

  // --- Renderizado Principal ---
  return (
    <Box sx={{ width: '100%' }}> 
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flex: '1 1 100%', fontWeight: 'bold' }}>
            Mantenimiento de Clientes
          </Typography>

          <TextField 
            variant="outlined"
            size="small"
            placeholder="Buscar por nombre o NIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
            sx={{ mr: 2, width: '350px' }}
          />
          
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ mr: 1 }}>
            Nuevo
          </Button>
          <Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={() => navigate('/')}>
            Salir
          </Button>
        </Toolbar>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)', overflowX: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{fontWeight: 'bold'}}>Nombre</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Razón Social</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>NIT</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Teléfono</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Email</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Contacto</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Estado</TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold'}}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center"><CircularProgress /></TableCell></TableRow>
              ) : filteredClientes.map((cliente) => (
                <TableRow hover key={cliente.id}>
                  <TableCell>{cliente.nombre_cliente}</TableCell>
                  <TableCell>{cliente.nombre_razonsocial}</TableCell>
                  <TableCell>{cliente.nit_cliente}</TableCell>
                  <TableCell>{cliente.telefono_cliente}</TableCell>
                  <TableCell>{cliente.email_cliente}</TableCell>
                  <TableCell>{cliente.contacto}</TableCell>
                  <TableCell>
                     <Chip 
                        label={cliente.estado.charAt(0).toUpperCase() + cliente.estado.slice(1)}
                        color={cliente.estado === 'activo' ? 'success' : 'error'} 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={cliente.estado === 'activo' ? 'Inactivar' : 'Activar'}>
                      <IconButton onClick={() => handleToggleEstado(cliente)} size="small">
                        {cliente.estado === 'activo' ? <ToggleOnIcon color="success" /> : <ToggleOffIcon color="error" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenModal(cliente)} size="small">
                        <EditTwoToneIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openModal}>
          <Box sx={style.modal}>
            <Typography variant="h5" component="h2" sx={{mb: 3, fontWeight: 'bold'}}>
              {currentCliente ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
            </Typography>
            <ClienteForm 
              initialData={currentCliente}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
            />
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default ClientesPage;
