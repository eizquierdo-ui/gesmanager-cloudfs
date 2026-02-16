
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Toolbar, Typography, TextField, InputAdornment, 
  Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Tooltip, CircularProgress, Modal, Fade, Backdrop, Chip
} from '@mui/material';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';

// --- Servicios ---
import { getAllTiposCambio, createTipoCambio, updateTipoCambio, deleteTipoCambio, setTipoCambioStatus } from '../../services/firestore/tipoCambioService';
import { getAllMonedas } from '../../services/firestore/monedasService';

// --- Íconos ---
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteForeverTwoToneIcon from '@mui/icons-material/DeleteForeverTwoTone';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

// --- Componentes ---
import TipoCambioForm from '../../components/forms/TipoCambioForm';

// Estilo para el modal
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'clamp(500px, 60vw, 800px)',
  bgcolor: 'background.paper',
  borderRadius: '8px',
  boxShadow: 24,
  p: 4,
};

const TipoCambioPage = () => {
  const [tiposCambio, setTiposCambio] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const navigate = useNavigate();

  const monedasMap = useMemo(() => 
    monedas.reduce((acc, m) => { acc[m.id] = m; return acc; }, {}), 
  [monedas]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tiposCambioData, monedasData] = await Promise.all([ getAllTiposCambio(), getAllMonedas() ]);
      setTiposCambio(tiposCambioData);
      setMonedas(monedasData); 
    } catch (error) { console.error("Error al cargar datos iniciales:", error); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

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

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este tipo de cambio?')) {
      await deleteTipoCambio(id);
      fetchData();
    }
  };
  
  const handleToggleEstado = async (item) => {
    const nuevoEstado = item.estado === 'activo' ? 'inactivo' : 'activo';
    await setTipoCambioStatus(item.id, nuevoEstado);
    fetchData();
  };
  
  const handleOpenModal = (item = null) => { setCurrentItem(item); setOpenModal(true); };
  const handleCloseModal = () => { setOpenModal(false); setCurrentItem(null); };

  const handleFormSubmit = async (values) => {
    try {
      if (currentItem) { await updateTipoCambio(currentItem.id, values); }
      else { await createTipoCambio(values); }
      fetchData();
      handleCloseModal();
    } catch (error) { console.error("Error al guardar el tipo de cambio:", error); }
  };
  
  // --- FUNCIÓN DE FORMATO CORREGIDA ---
  const formatNumber = (value) => {
      if (typeof value !== 'number') return '0.0000';
      return new Intl.NumberFormat('en-US', { 
          minimumFractionDigits: 4, 
          maximumFractionDigits: 4, 
          useGrouping: false 
      }).format(value);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
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
              <TableRow>
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
              {loading ? <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow> :
              filteredData.map((item) => (
                <TableRow hover key={item.id}>
                  <TableCell>{item.fecha ? format(item.fecha.toDate(), 'dd/MM/yyyy', { locale: es }) : 'N/A'}</TableCell>
                  <TableCell>{monedasMap[item.moneda_base_id]?.moneda || 'N/A'}</TableCell>
                  <TableCell>{monedasMap[item.moneda_destino_id]?.moneda || 'N/A'}</TableCell>
                  {/* --- VALORES CON FORMATO CORREGIDO --- */}
                  <TableCell align="right">{formatNumber(item.tasa_compra)}</TableCell>
                  <TableCell align="right">{formatNumber(item.tasa_venta)}</TableCell>
                  <TableCell><Chip label={item.estado} color={item.estado === 'activo' ? 'success' : 'error'} size="small" /></TableCell>
                  <TableCell align="center">
                    <Tooltip title={item.estado === 'activo' ? 'Inactivar' : 'Activar'}><IconButton size="small" onClick={() => handleToggleEstado(item)}>{item.estado === 'activo' ? <ToggleOnIcon color="success" /> : <ToggleOffIcon color="error"/>}</IconButton></Tooltip>
                    <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenModal(item)}><EditTwoToneIcon /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><DeleteForeverTwoToneIcon /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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
