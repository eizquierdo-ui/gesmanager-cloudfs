
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Toolbar, Typography, TextField, InputAdornment, 
  Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Tooltip, CircularProgress, Modal, Fade, Backdrop, Chip
} from '@mui/material';

import { subscribeToMenus, addMenu, updateMenu, deleteMenu, updateMenuState, formatTimestamp } from '../../services/firestore/menuService';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteForeverTwoToneIcon from '@mui/icons-material/DeleteForeverTwoTone';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuForm from '../../components/forms/MenuForm';

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

const MenuPage = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeToMenus(data => {
      setMenus(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredMenus = useMemo(() => 
    menus.filter(item => 
      item.Label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.id && item.id.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [menus, searchTerm]);
    
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este ítem del menú?')) {
      try { await deleteMenu(id); } catch (error) { console.error("Error al eliminar:", error); }
    }
  };
  
  const handleToggleEstado = async (item) => {
    const nuevoEstado = item.estado === 'activo' ? 'inactivo' : 'activo';
    if (window.confirm(`¿Cambiar el estado a "${nuevoEstado}"?`)) {
      try { await updateMenuState(item.id, item.estado); } catch (error) { console.error("Error al cambiar estado:", error); }
    }
  };
  
  const handleOpenModal = (item = null) => {
    setCurrentItem(item);
    setOpenModal(true);
  };
  
  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentItem(null);
  };

  const handleFormSubmit = async (values) => {
    try {
      if (currentItem) {
        await updateMenu(currentItem.id, values);
      } else {
        await addMenu(values);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <Toolbar>
          <MenuOpenIcon sx={{ mr: 1, fontSize: '2rem' }} />
          <Typography variant="h6" component="div" sx={{ flex: '1 1 100%', fontWeight: 'bold' }}>
            Mantenimiento de Menú
          </Typography>

          <TextField 
            variant="outlined"
            size="small"
            placeholder="Buscar por ID o Label..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ mr: 2, width: '350px' }}
          />
          
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>Nuevo</Button>
          <Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={() => navigate('/')} sx={{ ml: 1 }}>Salir</Button>
        </Toolbar>

        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{fontWeight: 'bold'}}>ID</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Label</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Ruta</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Orden</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Padre</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Estado</TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold'}}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow>
              ) : filteredMenus.map((item) => (
                <TableRow hover key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.Label}</TableCell>
                  <TableCell>{item.Ruta}</TableCell>
                  <TableCell>{item.Orden}</TableCell>
                  <TableCell>{item.id_padre || 'N/A'}</TableCell>
                  <TableCell>
                     <Chip 
                        label={item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                        color={item.estado === 'activo' ? 'success' : 'error'} 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
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
            <MenuForm 
              initialData={currentItem}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
            />
            {currentItem && (
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'grey.300' }}>
                <Typography variant="caption" display="block" gutterBottom>Fecha Creación: {formatTimestamp(currentItem.fecha_creacion)} por {currentItem.usuario_creo}</Typography>
                <Typography variant="caption" display="block">Última Modificación: {formatTimestamp(currentItem.fecha_ultima_modificacion)} por {currentItem.usuario_ultima_modificacion}</Typography>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default MenuPage;
