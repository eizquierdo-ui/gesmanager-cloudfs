
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Toolbar, Typography, TextField, InputAdornment, 
  Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Tooltip, CircularProgress, Modal, Fade, /*Backdrop,*/ Chip
} from '@mui/material';
// import { format } from 'date-fns'; // Comentado porque formatFirestoreTimestamp está comentado

// --- Hooks y Contextos ---
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';

// --- Importación de Servicios ---
import {
  getAllEmpresas,
  createEmpresa,
  updateEmpresa,
  // deleteEmpresa, // Comentado porque handleDelete está comentado
  // setEmpresaStatus // Comentado porque handleToggleEstado está comentado
} from '../../services/firestore/inicializarEmpresasService';
import { updateSession } from '../../services/sessionService'; // ¡Importamos el servicio de sesión!

// --- Importación de Íconos ---
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteForeverTwoToneIcon from '@mui/icons-material/DeleteForeverTwoTone';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Icono para no seleccionado
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Icono para seleccionado

import InicializarEmpresaForm from '../../components/forms/InicializarEmpresaForm';

// --- Estilo del Modal ---
const style = {
  modal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '800px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  },
};

// --- FUNCIÓN UTILITARIA (COMENTADA POR NO USARSE) ---
/*
const formatFirestoreTimestamp = (timestamp) => {
  if (!timestamp || !timestamp.toDate) {
    return 'No disponible';
  }
  try {
    return format(timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss.SSS');
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return 'Fecha inválida';
  }
};
*/

const InicializarEmpresasPage = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [currentEmpresa, setCurrentEmpresa] = useState(null);
  const navigate = useNavigate();

  // --- Hooks para obtener el contexto ---
  const { currentUser } = useAuth();
  const { sessionData, setNombreEmpresa } = useAppContext();

  useEffect(() => {
    const fetchEmpresas = async () => {
      setLoading(true);
      try {
        const empresasData = await getAllEmpresas();
        setEmpresas(empresasData);
      } catch (error) {
        console.error("Error en el componente al obtener las empresas:", error);
      }
      setLoading(false);
    };

    fetchEmpresas();
  }, []); // El array de dependencias vacío asegura que se ejecuta solo una vez

  const filteredEmpresas = useMemo(() => 
    empresas.filter(empresa => 
      empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (empresa.nit && empresa.nit.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [empresas, searchTerm]);
    
  // --- LÓGICA DE SELECCIÓN DE SESIÓN ---
  const handleSelect = async (item) => {
    if (!currentUser) return; 

    const isSelected = sessionData?.empresaId === item.id;

    if (isSelected) {
      // Deseleccionar (limpiar los campos)
      await updateSession(currentUser.uid, {
        empresaId: null,
        nombreEmpresa: null,
      });
      setNombreEmpresa('No seleccionada'); // Actualizamos el header
    } else {
      // Seleccionar un nuevo item
      await updateSession(currentUser.uid, { 
        empresaId: item.id,
        nombreEmpresa: item.nombre,
      });
      setNombreEmpresa(item.nombre); // Actualizamos el header
    }
  };
  
  // --- Función fetch para recargar datos después de una acción ---
  const refreshData = async () => {
    setLoading(true);
    try {
      const empresasData = await getAllEmpresas();
      setEmpresas(empresasData);
    } catch (error) {
      console.error("Error recargando las empresas:", error);
    }
    setLoading(false);
  };


  // --- LÓGICA CRUD COMENTADA PORQUE LOS BOTONES ESTÁN DESHABILITADOS ---
  /*
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta empresa? Esta acción es irreversible.')) {
      try { await deleteEmpresa(id); refreshData(); } catch (error) { console.error("Error:", error); }
    }
  };
  const handleToggleEstado = async (empresa) => {
    const nuevoEstado = empresa.estado === 'activo' ? 'inactivo' : 'activo';
    if (window.confirm(`¿Deseas cambiar el estado a "${nuevoEstado}"?`)) {
      try { await setEmpresaStatus(empresa.id, nuevoEstado); refreshData(); } catch (error) { console.error("Error:", error); }
    }
  };
  const handleOpenModal = (empresa = null) => { setCurrentEmpresa(empresa); setOpenModal(true); };
  */
  const handleCloseModal = () => { setOpenModal(false); setCurrentEmpresa(null); };
  const handleFormSubmit = async (values) => {
    try {
      if (currentEmpresa) { await updateEmpresa(currentEmpresa.id, values); } 
      else { await createEmpresa(values); }
      refreshData(); 
      handleCloseModal();
    } catch (error) { console.error("Error:", error); }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flex: '1 1 100%', fontWeight: 'bold' }}>
            Selección de Empresa
          </Typography>

          <TextField 
            variant="outlined"
            size="small"
            placeholder="Buscar por nombre o NIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ mr: 2, width: '350px' }}
          />
          
          <Button variant="contained" startIcon={<AddIcon />} sx={{ mr: 1 }} disabled>  {/* BOTÓN DESHABILITADO */}
            Nuevo
          </Button>
          <Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={() => navigate('/')}>
            Salir
          </Button>
        </Toolbar>

        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center" style={{ width: '50px', fontWeight: 'bold' }}>Seleccionar</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Nombre</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>NIT</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Dirección</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Email</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Teléfono</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Contacto</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Tel. Contacto</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Estado</TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold'}}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} align="center"><CircularProgress /></TableCell></TableRow>
              ) : filteredEmpresas.map((empresa) => {
                const isSelected = sessionData?.empresaId === empresa.id;
                return (
                  <TableRow hover key={empresa.id} selected={isSelected}>
                    <TableCell align="center">
                      <Tooltip title={isSelected ? 'Deseleccionar' : 'Seleccionar'}>
                        <IconButton size="small" onClick={() => handleSelect(empresa)}>
                          {isSelected ? <CheckCircleIcon color="success" /> : <CheckCircleOutlineIcon color="action" />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{empresa.nombre}</TableCell>
                    <TableCell>{empresa.nit}</TableCell>
                    <TableCell>{empresa.direccion}</TableCell>
                    <TableCell>{empresa.email}</TableCell>
                    <TableCell>{empresa.telefono}</TableCell>
                    <TableCell>{empresa.contacto}</TableCell>
                    <TableCell>{empresa.telefono_contacto}</TableCell>
                    <TableCell>
                       <Chip 
                          label={empresa.estado.charAt(0).toUpperCase() + empresa.estado.slice(1)}
                          color={empresa.estado === 'activo' ? 'success' : 'error'} 
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Cambiar Estado (Deshabilitado)">
                        <span> {/* El span es necesario para que el Tooltip funcione en un botón deshabilitado */} 
                          <IconButton size="small" disabled> {/* BOTÓN DESHABILITADO */}
                            {empresa.estado === 'activo' ? <ToggleOnIcon /> : <ToggleOffIcon />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Editar (Deshabilitado)">
                        <span>
                          <IconButton size="small" disabled> {/* BOTÓN DESHABILITADO */}
                            <EditTwoToneIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Eliminar (Deshabilitado)">
                        <span>
                          <IconButton size="small" disabled> {/* BOTÓN DESHABILITADO */}
                            <DeleteForeverTwoToneIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )}
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* El modal sigue existiendo en el código pero no es visible/alcanzable desde la UI */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Fade in={openModal}>
          <Box sx={style.modal}>
            <Typography variant="h5" component="h2" sx={{mb: 3, fontWeight: 'bold'}}>
              {currentEmpresa ? 'Editar Empresa' : 'Crear Nueva Empresa'}
            </Typography>
            <InicializarEmpresaForm 
              initialData={currentEmpresa}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
            />
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default InicializarEmpresasPage;
