
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getUsuarios, 
  toggleUsuarioStatus,
  getRoles,
  createUsuarioDocument,
  updateUsuario,
  deleteUsuario // Importar la función para eliminar
} from '../../services/usuariosService';
import UsuarioForm from './UsuarioForm';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  TextField, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  IconButton, 
  Chip,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { Edit, Search, Add, ExitToApp, Delete, PowerSettingsNew } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usuariosData, rolesData] = await Promise.all([getUsuarios(), getRoles()]);
        setUsuarios(usuariosData);
        setRoles(rolesData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
      const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
      if (window.confirm(`¿Estás seguro de que quieres cambiar el estado de este usuario a ${newStatus}?`)) {
        try {
          await toggleUsuarioStatus(id, currentStatus);
          setUsuarios(prev => prev.map(u => u.id === id ? { ...u, estado: newStatus } : u));
        } catch (error) {
          console.error('Error al cambiar el estado:', error);
        }
      }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
        try {
            // Aquí se llamaría a la función para eliminar de Firebase Auth también si fuera necesario
            await deleteUsuario(id);
            setUsuarios(prev => prev.filter(u => u.id !== id));
        } catch (error) {
            console.error("Error al eliminar el usuario:", error);
        }
    }
  };

  const handleOpenCreate = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (usuario) => {
    setCurrentUser(usuario);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleSave = async (userId, data, isEditMode) => {
    try {
        if (isEditMode) {
            await updateUsuario(userId, data);
            const usuariosData = await getUsuarios();
            setUsuarios(usuariosData);
        } else {
            await createUsuarioDocument(userId, data);
            const usuariosData = await getUsuarios();
            setUsuarios(usuariosData);
        }
    } catch (error) {
        console.error("Error al guardar el usuario:", error);
    }
  };

  const rolesMap = useMemo(() => {
    return roles.reduce((acc, role) => {
      acc[role.id] = role.role_nombre;
      return acc;
    }, {});
  }, [roles]);

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(usuario =>
      (usuario.nombre_usuario && usuario.nombre_usuario.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (usuario.email_usuario && usuario.email_usuario.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rolesMap[usuario.role] && rolesMap[usuario.role].toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [usuarios, searchTerm, rolesMap]);

  return (
    <Box sx={{ p: 3 }}>
       <Paper sx={{ p: 2, mb: 2, width: '100%', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              Mantenimiento de Usuarios
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                 <TextField
                    placeholder="Buscar por nombre o NIT..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                        <InputAdornment position="start">
                            <Search />
                        </InputAdornment>
                        ),
                    }}
                    sx={{ mr: 2 }}
                />
                <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleOpenCreate} sx={{ mr: 1 }}>
                    Nuevo
                </Button>
                <Button variant="contained" color="error" startIcon={<ExitToApp />} onClick={() => navigate('/')}>
                    Salir
                </Button>
            </Box>
        </Box>
      </Paper>

      {loading ? (
        <CircularProgress />
      ) : (
          <Paper sx={{ p: 2, width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader aria-label="tabla de usuarios">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsuarios.map(usuario => (
                  <TableRow hover key={usuario.id}>
                    <TableCell>{usuario.nombre_usuario}</TableCell>
                    <TableCell>{usuario.email_usuario}</TableCell>
                    <TableCell>{rolesMap[usuario.role] || 'Rol no definido'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={usuario.estado}
                        color={usuario.estado === 'activo' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                        <Tooltip title={usuario.estado === 'activo' ? 'Inactivar' : 'Activar'}>
                          <IconButton size="small" onClick={() => handleToggleStatus(usuario.id, usuario.estado)} color={usuario.estado === 'activo' ? 'error' : 'success'}>
                            <PowerSettingsNew />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleOpenEdit(usuario)} color="primary">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                           <IconButton size="small" onClick={() => handleDelete(usuario.id)} color="error">
                                <Delete />
                            </IconButton>
                        </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </Paper>
      )}

      <UsuarioForm 
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialData={currentUser}
        isEditMode={!!currentUser}
      />
    </Box>
  );
};

export default UsuariosPage;
