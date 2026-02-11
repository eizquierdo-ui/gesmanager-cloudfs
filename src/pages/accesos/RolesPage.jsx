// src/pages/accesos/RolesPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Toolbar, Typography, TextField, InputAdornment, 
  Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Tooltip, CircularProgress, Modal, Fade, Backdrop, Chip
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

// --- Importación de Servicios ---
import { getAllRoles, createRole, updateRole, deleteRole, setRoleStatus } from '../../services/firestore/rolesService';

// --- Importación de Íconos ---
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteForeverTwoToneIcon from '@mui/icons-material/DeleteForeverTwoTone';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

import RoleForm from '../../components/forms/RoleForm';

// --- Estilo del Modal ---
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

const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const rolesData = await getAllRoles();
      setRoles(rolesData);
      setError(null);
    } catch (err) {
      console.error("Error en el componente al obtener los roles:", err);
      setError('No se pudieron cargar los roles.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = useMemo(() => 
    roles.filter(rol => 
      rol.role_nombre.toLowerCase().includes(searchTerm.toLowerCase())
    ), [roles, searchTerm]);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este rol? Esta acción es irreversible.')) {
      try {
        await deleteRole(id);
        fetchRoles();
      } catch (err) {
        setError("Error al eliminar el rol.");
      }
    }
  };
  
  const handleToggleEstado = async (rol) => {
    const nuevoEstado = rol.estado === 'activo' ? 'inactivo' : 'activo';
    if (window.confirm(`¿Deseas cambiar el estado a "${nuevoEstado}"?`)) {
      try {
        await setRoleStatus(rol.id, nuevoEstado, currentUser.uid);
        fetchRoles();
      } catch (err) {
        setError("Error al cambiar el estado del rol.");
      }
    }
  };
  
  const handleOpenModal = (rol = null) => {
    setCurrentRole(rol);
    setOpenModal(true);
  };
  
  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentRole(null);
  };

  const handleFormSubmit = async (values) => {
    try {
      if (currentRole) {
        // En edición, no se cambia el id, solo otros campos si es necesario.
        // El formulario deshabilita el campo 'id', así que usamos el de `currentRole`.
        await updateRole(currentRole.id, { estado: values.estado }, currentUser.uid);
      } else {
        await createRole(values, currentUser.uid);
      }
      fetchRoles();
      handleCloseModal();
    } catch (err) {
      setError("Error al guardar el rol.");
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flex: '1 1 100%', fontWeight: 'bold' }}>
            Mantenimiento de Roles
          </Typography>

          <TextField 
            variant="outlined"
            size="small"
            placeholder="Buscar por nombre..."
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

        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{fontWeight: 'bold'}}>Nombre del Rol</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Estado</TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold'}}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} align="center"><CircularProgress /></TableCell></TableRow>
              ) : filteredRoles.map((rol) => (
                <TableRow hover key={rol.id}>
                  <TableCell>{rol.role_nombre}</TableCell>
                  <TableCell>
                     <Chip 
                        label={rol.estado.charAt(0).toUpperCase() + rol.estado.slice(1)}
                        color={rol.estado === 'activo' ? 'success' : 'error'} 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={rol.estado === 'activo' ? 'Inactivar' : 'Activar'}>
                      <IconButton onClick={() => handleToggleEstado(rol)} size="small">
                        {rol.estado === 'activo' ? <ToggleOnIcon sx={{ color: '#388e3c' }} /> : <ToggleOffIcon sx={{ color: '#d32f2f' }} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenModal(rol)} size="small">
                        <EditTwoToneIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(rol.id)} size="small">
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
      
      <Modal open={openModal} onClose={handleCloseModal} closeAfterTransition>
        <Fade in={openModal}>
          <Box sx={style.modal}>
            <Typography variant="h5" component="h2" sx={{mb: 3, fontWeight: 'bold'}}>
              {currentRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
            </Typography>
            <RoleForm 
              initialData={currentRole}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
            />
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default RolesPage;
