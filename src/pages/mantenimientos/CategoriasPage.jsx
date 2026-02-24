
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Toolbar, Typography, TextField, InputAdornment, 
  Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Tooltip, CircularProgress, Modal, Fade, Backdrop, Chip,
  Container, Alert, AlertTitle
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business'; // Icono consistente

// --- Contextos ---
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';

// --- Servicios de Firestore ---
import {
  getAllCategorias,
  createCategoria,
  updateCategoria,
  setCategoriaStatus,
  deleteCategoria
} from '../../services/firestore/categoriasService';

// --- Componentes y Formularios ---
import CategoriaForm from '../../components/forms/CategoriaForm';

// --- Iconos ---
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteForeverTwoToneIcon from '@mui/icons-material/DeleteForeverTwoTone';
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
    maxWidth: '700px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  },
};

const CategoriasPage = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [currentCategoria, setCurrentCategoria] = useState(null);
  
  const navigate = useNavigate();
  const { sessionData: app, loadingSession } = useAppContext();
  const { currentUser: user } = useAuth();

  const fetchCategorias = useCallback(async () => {
    if (!app?.empresa_id || !user) return;
    try {
      setLoading(true);
      const categoriasList = await getAllCategorias(app.empresa_id);
      setCategorias(categoriasList);
    } catch (error) {
      console.error("Error al obtener las categorías:", error);
    } finally {
      setLoading(false);
    }
  }, [app, user]);

  useEffect(() => {
    if (!loadingSession) {
        fetchCategorias();
    }
  }, [fetchCategorias, loadingSession]);

  const filteredCategorias = useMemo(() => 
    categorias.filter(cat => 
      cat.nombre_categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.descripcion && cat.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [categorias, searchTerm]);
    
  const handleSetEstado = async (categoria) => {
    const nuevoEstado = categoria.estado === 'activo' ? 'inactivo' : 'activo';
    if (window.confirm(`¿Deseas cambiar el estado a "${nuevoEstado}"?`)) {
      try {
        await setCategoriaStatus(categoria.id, nuevoEstado, user.uid);
        fetchCategorias();
      } catch (error) {
        console.error("Error al cambiar el estado de la categoría:", error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta categoría? Esta acción es irreversible.')) {
      try {
        await deleteCategoria(id);
        fetchCategorias();
      } catch (error) {
        console.error("Error al eliminar la categoría:", error);
      }
    }
  };
  
  const handleOpenModal = (categoria = null) => {
    setCurrentCategoria(categoria);
    setOpenModal(true);
  };
  
  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentCategoria(null);
  };

  const handleFormSubmit = async (values) => {
    if (!app?.empresa_id || !user) {
      console.error("No hay empresa seleccionada o usuario autenticado");
      return;
    }
    try {
      const data = { ...values, empresa_id: app.empresa_id };
      if (currentCategoria) {
        await updateCategoria(currentCategoria.id, data, user.uid);
      } else {
        await createCategoria(data, user.uid);
      }
      fetchCategorias();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar la categoría:", error);
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
          Para gestionar categorías, primero debe seleccionar una empresa de trabajo. 
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
            Mantenimiento de Categorías
          </Typography>

          <TextField 
            variant="outlined"
            size="small"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
            sx={{ mr: 2, width: '350px' }}
          />
          
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ mr: 1 }}>
            Nueva
          </Button>
          <Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={() => navigate('/')}>
            Salir
          </Button>
        </Toolbar>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)', overflowX: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{fontWeight: 'bold', width: '30%'}}>Nombre</TableCell>
                <TableCell sx={{fontWeight: 'bold', width: '50%'}}>Descripción</TableCell>
                <TableCell sx={{fontWeight: 'bold', width: '10%'}}>Estado</TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold', width: '10%'}}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center"><CircularProgress /></TableCell></TableRow>
              ) : filteredCategorias.map((cat) => (
                <TableRow hover key={cat.id}>
                  <TableCell>{cat.nombre_categoria}</TableCell>
                  <TableCell>{cat.descripcion}</TableCell>
                  <TableCell>
                     <Chip 
                        label={cat.estado.charAt(0).toUpperCase() + cat.estado.slice(1)}
                        color={cat.estado === 'activo' ? 'success' : 'error'} 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={cat.estado === 'activo' ? 'Inactivar' : 'Activar'}>
                      <IconButton onClick={() => handleSetEstado(cat)} size="small">
                        {cat.estado === 'activo' ? <ToggleOnIcon color="success" /> : <ToggleOffIcon color="error" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenModal(cat)} size="small">
                        <EditTwoToneIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                     <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(cat.id)} size="small">
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
      
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 }}}
      >
        <Fade in={openModal}>
          <Box sx={style.modal}>
            <Typography variant="h5" component="h2" sx={{mb: 3, fontWeight: 'bold'}}>
              {currentCategoria ? 'Editar Categoría' : 'Crear Nueva Categoría'}
            </Typography>
            <CategoriaForm 
              initialData={currentCategoria}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
            />
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default CategoriasPage;
