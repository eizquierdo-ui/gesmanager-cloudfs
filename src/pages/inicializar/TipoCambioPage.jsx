
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Toolbar, Typography, TextField, InputAdornment, 
  Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Tooltip, CircularProgress, Modal, Fade, Backdrop, Chip
} from '@mui/material';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';

// --- Hooks y Contextos ---
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';

// --- Servicios ---
import { getAllTiposCambio, createTipoCambio, updateTipoCambio, deleteTipoCambio, setTipoCambioStatus } from '../../services/firestore/tipoCambioService';
import { getAllMonedas } from '../../services/firestore/monedasService';
import { updateSession } from '../../services/sessionService'; 

// --- Íconos ---
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteForeverTwoToneIcon from '@mui/icons-material/DeleteForeverTwoTone';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';


// --- Componentes ---
import TipoCambioForm from '../../components/forms/TipoCambioForm';

const style = { /* ...estilo del modal sin cambios... */ };

const TipoCambioPage = () => {
  const [tiposCambio, setTiposCambio] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const { sessionData, loadingSession } = useAppContext();

  useEffect(() => {
    if (loadingSession) return;
    if (!sessionData?.empresa_id) {
      alert("Debe seleccionar una empresa para acceder a esta opción.");
      navigate('/');
    }
  }, [sessionData, loadingSession, navigate]);

  const monedasMap = useMemo(() => 
    monedas.reduce((acc, m) => { acc[m.id] = m; return acc; }, {}), 
  [monedas]);

  useEffect(() => {
    if (!loadingSession && sessionData?.empresa_id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [tiposCambioData, monedasData] = await Promise.all([ getAllTiposCambio(), getAllMonedas() ]);
          setTiposCambio(tiposCambioData);
          setMonedas(monedasData);
        } catch (error) { console.error("Error al cargar datos iniciales:", error); }
        setLoading(false);
      };
      fetchData();
    }
  }, [sessionData, loadingSession]);

  const filteredData = useMemo(() => 
    tiposCambio.filter(item => {
        const origen = monedasMap[item.moneda_base_id]?.codigo.toLowerCase() || '';
        const origenNombre = monedasMap[item.moneda_base_id]?.moneda.toLowerCase() || '';
        const destino = monedasMap[item.moneda_destino_id]?.codigo.toLowerCase() || '';
        const destinoNombre = monedasMap[item.moneda_destino_id]?.moneda.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return origen.includes(search) || destino.includes(search) || origenNombre.includes(search) || destinoNombre.includes(search);
    }), 
  [tiposCambio, searchTerm, monedasMap]);

  // --- PASO 2.1: LÓGICA DE SELECCIÓN CORREGIDA --- 
  const handleSelect = async (item) => {
    if (!currentUser) return;

    const isSelected = sessionData?.tipo_cambio_id === item.id;
    
    let sessionUpdateData;

    if (isSelected) {
      // DESELECCIONAR: Poner todos los campos relevantes a null o 0
      sessionUpdateData = {
        tipo_cambio_id: null,
        tipo_cambio_fecha: null,
        tipo_cambio_moneda_base: null,
        tipo_cambio_moneda_destino: null,
        tipo_cambio_tasa_compra: 0,
        tipo_cambio_tasa_venta: 0,
      };
    } else {
      // SELECCIONAR: Construir el objeto plano con los campos existentes
      sessionUpdateData = {
        tipo_cambio_id: item.id,
        tipo_cambio_fecha: item.fecha, // El objeto Timestamp se guarda directamente
        tipo_cambio_moneda_base: monedasMap[item.moneda_base_id]?.moneda || '---', // Guardamos el nombre
        tipo_cambio_moneda_destino: monedasMap[item.moneda_destino_id]?.moneda || '---', // Guardamos el nombre
        tipo_cambio_tasa_compra: item.tasa_compra,
        tipo_cambio_tasa_venta: item.tasa_venta,
      };
    }

    // Actualización única en Firestore. No se usa setSession.
    await updateSession(currentUser.uid, sessionUpdateData);
  };

  // ... (el resto de funciones como formatNumber, refreshData, etc., se mantienen igual) ...
  const formatNumber = (value) => {
    if (typeof value !== 'number') return '0.0000';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4, useGrouping: false }).format(value);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const tiposCambioData = await getAllTiposCambio();
      setTiposCambio(tiposCambioData);
    } catch (error) {
      console.error("Error al recargar tipos de cambio:", error);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este tipo de cambio?')) {
      await deleteTipoCambio(id);
      refreshData();
    }
  }; 
  const handleToggleEstado = async (item) => {
    const nuevoEstado = item.estado === 'activo' ? 'inactivo' : 'activo';
    await setTipoCambioStatus(item.id, nuevoEstado);
    refreshData();
  }; 
  const handleOpenModal = (item = null) => { setCurrentItem(item); setOpenModal(true); };
  const handleCloseModal = () => { setOpenModal(false); setCurrentItem(null); };

  const handleFormSubmit = async (values) => {
    try {
      if (currentItem) { await updateTipoCambio(currentItem.id, values); }
      else { await createTipoCambio(values); }
      refreshData();
      handleCloseModal();
    } catch (error) { console.error("Error al guardar el tipo de cambio:", error); }
  }; 

  if (loadingSession || !sessionData?.empresa_id) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Verificando selección de empresa...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        {/* ... Toolbar sin cambios ... */}
        <Toolbar sx={{ p: 2, justifyContent: 'space-between' }}>
            <Typography variant="h6">Tipo de Cambio</Typography>
            <Box>
                <TextField placeholder="Buscar por moneda..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position='start'><SearchIcon /></InputAdornment> }} variant="standard" sx={{mr: 2}} />
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{mr: 1}}>NUEVO</Button>
                <Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={() => navigate('/')}>SALIR</Button>
            </Box>
        </Toolbar>

        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              {/* ... Thead sin cambios ... */}
               <TableRow>
                <TableCell align="center" style={{ width: '50px' }}>Seleccionar</TableCell> 
                <TableCell>Fecha</TableCell>
                <TableCell>Moneda Origen</TableCell>
                <TableCell>Moneda Destino</TableCell>
                <TableCell align="right">Tasa Compra</TableCell>
                <TableCell align="right">Tasa Venta</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} align="center"><CircularProgress /></TableCell></TableRow> :
              filteredData.map((item) => {
                // CORRECCIÓN: Comprobar contra tipo_cambio_id
                const isSelected = sessionData?.tipo_cambio_id === item.id;
                return (
                  <TableRow hover key={item.id} selected={isSelected}>
                    <TableCell align="center">
                      <Tooltip title={isSelected ? 'Deseleccionar' : 'Seleccionar'}>
                        <IconButton size="small" onClick={() => handleSelect(item)}>
                          {isSelected ? <CheckCircleIcon color="success" /> : <CheckCircleOutlineIcon color="action" />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>

                    <TableCell>{item.fecha ? format(item.fecha.toDate(), 'dd/MM/yyyy', { locale: es }) : 'N/A'}</TableCell>
                    <TableCell>{monedasMap[item.moneda_base_id]?.moneda || 'N/A'}</TableCell>
                    <TableCell>{monedasMap[item.moneda_destino_id]?.moneda || 'N/A'}</TableCell>
                    <TableCell align="right">{formatNumber(item.tasa_compra)}</TableCell>
                    <TableCell align="right">{formatNumber(item.tasa_venta)}</TableCell>
                    <TableCell><Chip label={item.estado} color={item.estado === 'activo' ? 'success' : 'error'} size="small" /></TableCell>
                    {/* ... Acciones sin cambios ... */}
                    <TableCell align="center">
                      <Tooltip title={item.estado === 'activo' ? 'Inactivar' : 'Activar'}><IconButton size="small" onClick={() => handleToggleEstado(item)}>{item.estado === 'activo' ? <ToggleOnIcon color="success" /> : <ToggleOffIcon color="error"/>}</IconButton></Tooltip>
                      <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenModal(item)}><EditTwoToneIcon /></IconButton></Tooltip>
                      <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><DeleteForeverTwoToneIcon /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ... Modal sin cambios ... */}
       <Modal open={openModal} onClose={handleCloseModal} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={openModal}>
          <Box sx={style}>
            <Typography variant="h5" gutterBottom>{currentItem ? 'Editar' : 'Nuevo'} Tipo de Cambio</Typography>
            <TipoCambioForm 
              initialData={currentItem}
              monedas={monedas.filter(m => m.estado === 'activo')}
              onSubmit={handleFormSubmit} 
              onCancel={handleCloseModal} 
            />
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default TipoCambioPage;
