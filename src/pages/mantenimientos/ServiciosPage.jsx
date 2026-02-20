import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Toolbar, Typography, TextField, InputAdornment,
  Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Tooltip, CircularProgress, Chip,
  Container, Alert, AlertTitle, Select, MenuItem, FormControl, InputLabel, Checkbox, Modal, Fade, Backdrop
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PriceChangeIcon from '@mui/icons-material/PriceChange';

import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';

import { getAllCategorias } from '../../services/firestore/categoriasService';
import { 
  getServiciosByCategoria, 
  createServicio,
  updateServicio,
  setServicioStatus, 
  deleteServicio, 
  updateServicioPrecio
} from '../../services/firestore/serviciosService';

import ServicioForm from '../../components/forms/ServicioForm';
import PrecioServicioModal from '../../components/forms/PrecioServicioModal';

import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteForeverTwoToneIcon from '@mui/icons-material/DeleteForeverTwoTone';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

const ServiciosPage = () => {
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openFormModal, setOpenFormModal] = useState(false);
  const [isPrecioModalOpen, setIsPrecioModalOpen] = useState(false);
  const [currentServicio, setCurrentServicio] = useState(null);
  const [selectedServicioId, setSelectedServicioId] = useState(null);
  const navigate = useNavigate();
  const { sessionData: app, loadingSession } = useAppContext();
  const { currentUser: user } = useAuth();

  const fetchCategorias = useCallback(async () => {
    if (!app?.empresa_id || !user) return;
    try {
      const categoriasList = await getAllCategorias(app.empresa_id);
      setCategorias(categoriasList);
    } catch (error) {
      console.error("Error al obtener las categorías:", error);
    }
  }, [app?.empresa_id, user]);

  useEffect(() => {
    if (!loadingSession && app?.empresa_id) {
      fetchCategorias();
    }
  }, [loadingSession, app?.empresa_id, fetchCategorias]);

  const fetchServicios = useCallback(async () => {
    if (!app?.empresa_id || !user || !selectedCategoria) return;
    try {
      setLoading(true);
      const serviciosList = await getServiciosByCategoria(app.empresa_id, selectedCategoria);
      setServicios(serviciosList);
      setSelectedServicioId(null);
    } catch (error) {
      console.error("Error al obtener los servicios:", error);
    } finally {
      setLoading(false);
    }
  }, [app?.empresa_id, user, selectedCategoria]);

  useEffect(() => {
    if (selectedCategoria) {
      fetchServicios();
    } else {
      setServicios([]);
    }
  }, [selectedCategoria, fetchServicios]);


  const filteredServicios = useMemo(() =>
    servicios.filter(srv =>
      srv.nombre_servicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (srv.detalle_queincluyeservicio && srv.detalle_queincluyeservicio.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [servicios, searchTerm]);

  const handleSelectServicio = (servicioId) => {
    setSelectedServicioId(prevSelected => (prevSelected === servicioId ? null : servicioId));
  };

  const handleSetEstado = async (servicio) => {
    const nuevoEstado = servicio.estado === 'activo' ? 'inactivo' : 'activo';
    if (window.confirm(`¿Deseas cambiar el estado a \"${nuevoEstado}\"?`)) {
      try {
        await setServicioStatus(servicio.id, nuevoEstado, user.uid);
        fetchServicios();
      } catch (error) {
        console.error("Error al cambiar el estado del servicio:", error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este servicio? Esta acción es irreversible.')) {
      try {
        await deleteServicio(id);
        fetchServicios();
      } catch (error) {
        console.error("Error al eliminar el servicio:", error);
      }
    }
  };

  const handleOpenFormModal = (servicio = null) => {
    setCurrentServicio(servicio);
    setOpenFormModal(true);
  };

  const handleCloseFormModal = () => {
    setOpenFormModal(false);
    setCurrentServicio(null);
  };
  
  const handleOpenPrecioModal = () => {
    if (servicioSeleccionado) {
      setIsPrecioModalOpen(true);
    }
  };
  
  const handleClosePrecioModal = () => {
    setIsPrecioModalOpen(false);
  };

  const handleFormSubmit = async (values) => {
    if (!app?.empresa_id || !user || !selectedCategoria) {
      console.error("Faltan datos clave para guardar el servicio.");
      return;
    }
    try {
      const data = {
        ...values,
        empresa_id: app.empresa_id,
        categoria_id: selectedCategoria
      };

      if (currentServicio) {
        await updateServicio(currentServicio.id, data, user.uid);
      } else {
        await createServicio(data, user.uid);
      }
      fetchServicios();
      handleCloseFormModal();
    } catch (error) {
      console.error("Error al guardar el servicio:", error);
    }
  };

  const handlePrecioSave = async (servicioId, data, newHistoryEntry) => {
    try {
      await updateServicioPrecio(servicioId, data, newHistoryEntry, user.uid);
    } catch (error) {
      console.error("Error al actualizar el precio del servicio:", error);
    }
  };
  
  const servicioSeleccionado = useMemo(() => {
    if (!selectedServicioId) return null;
    return servicios.find(s => s.id === selectedServicioId);
  }, [selectedServicioId, servicios]);


  if (loadingSession) {
    return <Container sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Container>;
  }

  if (!app?.empresa_id) {
    return (
      <Container sx={{ p: 3 }}>
        <Alert severity="error" variant="outlined" sx={{ '& .MuiAlert-icon': { fontSize: 30 } }}>
          <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Acceso Bloqueado</AlertTitle>
          Para gestionar servicios, primero debe seleccionar una empresa de trabajo.
          <br /><br />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/inicializar/empresa')} 
            startIcon={<BusinessIcon />}
          >
            Ir a Seleccionar Empresa
          </Button>
        </Alert>
      </Container>
    );
  } 
  
  if (!app?.tipo_cambio_id) {
    return (
        <Container sx={{ p: 3 }}>
          <Alert severity="warning" variant="outlined" sx={{ '& .MuiAlert-icon': { fontSize: 30 } }}>
            <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Acción Requerida</AlertTitle>
            Para gestionar precios de servicios, necesita una tasa de cambio activa para la sesión.
            <br /><br />
            <Button 
              variant="contained" 
              color="warning"
              onClick={() => navigate('/inicializar/tipo-cambio')}
              startIcon={<PriceChangeIcon />}
            >
              Ir a Seleccionar Tipo de Cambio
            </Button>
          </Alert>
        </Container>
      );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <Toolbar>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                Mantenimiento de Servicios
            </Typography>

            {selectedCategoria && (
                 <Button 
                    variant="contained" 
                    startIcon={<PriceChangeIcon />} 
                    disabled={!servicioSeleccionado} 
                    onClick={handleOpenPrecioModal}
                    sx={{
                        ml: 5,
                        whiteSpace: 'nowrap',
                        background: servicioSeleccionado ? '#ffc107' : '#e0e0e0',
                        color: servicioSeleccionado ? '#d32f2f' : 'rgba(0, 0, 0, 0.26)',
                        fontWeight: 'bold',
                        '&.Mui-disabled': {
                            background: '#e0e0e0', 
                            color: 'rgba(0, 0, 0, 0.26)' 
                        }
                    }}>
                    Actualizar Precio
                </Button>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <FormControl size="small" sx={{ mr: 2, minWidth: 220 }}>
                <InputLabel id="categoria-select-label">Categoría</InputLabel>
                <Select
                labelId="categoria-select-label"
                value={selectedCategoria}
                label="Categoría"
                onChange={(e) => setSelectedCategoria(e.target.value)}
                >
                <MenuItem value="">
                    <em>-- Seleccione --</em>
                </MenuItem>
                {categorias.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.nombre_categoria}</MenuItem>
                ))}
                </Select>
            </FormControl>

            {selectedCategoria && (
                <>
                    <TextField
                        variant="outlined"
                        size="small"
                        label="Servicio"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                        }}
                        sx={{ mr: 2, width: '300px' }}
                    />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenFormModal()} sx={{ mr: 2 }}>
                        Nuevo
                    </Button>
                </>
            )}

            <Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={() => navigate('/')}>
                Salir
            </Button>
        </Toolbar>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)', overflowX: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"></TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Detalle Incluye</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Costo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Precio Base</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tasa Ganancia</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ITP</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} align="center"><CircularProgress /></TableCell></TableRow>
              ) : filteredServicios.map((srv) => (
                <TableRow hover key={srv.id}>
                   <TableCell padding="checkbox">
                        <Checkbox
                            color="primary"
                            checked={selectedServicioId === srv.id}
                            onChange={() => handleSelectServicio(srv.id)}
                        />
                    </TableCell>
                  <TableCell>{srv.nombre_servicio}</TableCell>
                  <TableCell>{srv.detalle_queincluyeservicio}</TableCell>
                  <TableCell>{srv.precios_calculados?.costo_total_base?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{srv.precios_calculados?.precio_venta_base?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{(srv.precios_calculados?.tasa_ganancia || 0).toFixed(2)}%</TableCell>
                  <TableCell>
                    <Chip label={srv.itp ? 'Sí' : 'No'} size="small" color={srv.itp ? 'primary' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={srv.estado.charAt(0).toUpperCase() + srv.estado.slice(1)}
                      color={srv.estado === 'activo' ? 'success' : 'error'}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={srv.estado === 'activo' ? 'Inactivar' : 'Activar'}>
                      <IconButton onClick={() => handleSetEstado(srv)} size="small">
                        {srv.estado === 'activo' ? <ToggleOnIcon color="success" /> : <ToggleOffIcon color="error" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenFormModal(srv)} size="small">
                        <EditTwoToneIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(srv.id)} size="small">
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

      <ServicioForm 
        open={openFormModal}
        onClose={handleCloseFormModal}
        onSave={handleFormSubmit}
        servicio={currentServicio}
      />

      {servicioSeleccionado && (
        <PrecioServicioModal
            open={isPrecioModalOpen}
            onClose={handleClosePrecioModal}
            servicio={servicioSeleccionado}
            onUpdate={fetchServicios} 
            onSave={handlePrecioSave}
        />
      )}

    </Box>
  );
};

export default ServiciosPage;
