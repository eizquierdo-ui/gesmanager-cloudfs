import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, Box, Typography, TextField, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, 
  CircularProgress, Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// --- Servicios ---
// IMPORTANTE: Ahora importamos nuestra nueva función de servicio
import { getTiposCambioFiltrados } from '../../services/firestore/tipoCambioService'; 
import { getAllMonedas } from '../../services/firestore/monedasService';

// Estilos (sin cambios)
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: '1000px',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  height: '90vh',
  maxHeight: '700px',
};

// **INICIO DE LA REFACTORIZACIÓN DEL MODAL**
// El componente ahora es "tonto" y recibe los IDs necesarios como props.
const BuscarTipoCambioModal = ({ open, onClose, onSelect, empresaId, monedaBaseId }) => {
  const [tiposCambio, setTiposCambio] = useState([]);
  const [monedasMap, setMonedasMap] = useState(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);

  // Efecto para cargar los datos cuando se abre el modal
  useEffect(() => {
    // Función asíncrona para encapsular la lógica de carga
    const fetchData = async () => {
      // Valida que los props necesarios estén presentes. Si no, no hace nada.
      if (!empresaId || !monedaBaseId) {
        setError("Faltan parámetros para la búsqueda (empresa o moneda base).");
        return;
      }

      setLoading(true);
      setError('');
      setTiposCambio([]);
      setSelectedRow(null);
      setSearchTerm('');

      try {
        // 1. Carga el mapa de monedas una sola vez para enriquecer los datos.
        const monedasSnap = await getAllMonedas();
        const newMonedasMap = new Map();
        monedasSnap.forEach(moneda => newMonedasMap.set(moneda.id, moneda.simbolo));
        setMonedasMap(newMonedasMap);

        // 2. Llama a la nueva función del servicio con los props.
        const data = await getTiposCambioFiltrados(empresaId, monedaBaseId);
        setTiposCambio(data);
        
      } catch (err) {
        console.error("Error al buscar tipos de cambio:", err);
        setError("Ocurrió un error al cargar los tipos de cambio. Es posible que se requiera un índice en la base de datos.");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, empresaId, monedaBaseId]); // El efecto se dispara si cambia algún prop clave.

  // useMemo para optimizar el filtrado y el enriquecimiento de datos.
  const filteredTiposCambio = useMemo(() => {
    // Primero, enriquecemos los datos con los símbolos de moneda
    const enrichedData = tiposCambio.map(tc => ({
      ...tc,
      simbolo_moneda_base: monedasMap.get(tc.moneda_base_id) || '?',
      simbolo_moneda_destino: monedasMap.get(tc.moneda_destino_id) || '?',
    }));

    // Luego, aplicamos el filtro de búsqueda del usuario
    const lowercasedFilter = searchTerm.toLowerCase();
    if (!lowercasedFilter) {
      return enrichedData; // Si no hay búsqueda, retorna todos los datos enriquecidos.
    }

    return enrichedData.filter(item => {
        const fechaStr = item.fecha?.toDate().toLocaleDateString('es-GT') || '';
        return (
            (item.simbolo_moneda_base).toLowerCase().includes(lowercasedFilter) ||
            (item.simbolo_moneda_destino).toLowerCase().includes(lowercasedFilter) ||
            fechaStr.includes(lowercasedFilter) ||
            item.tasa_compra.toString().includes(lowercasedFilter) ||
            item.tasa_venta.toString().includes(lowercasedFilter)
        );
    });
  }, [searchTerm, tiposCambio, monedasMap]);

  // Manejadores (sin cambios)
  const handleRowClick = (item) => setSelectedRow(item);
  const handleDoubleClick = (item) => {
    onSelect(item);
    onClose();
  };
  const handleConfirmSelection = () => {
    if (selectedRow) {
      onSelect(selectedRow);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">Buscar Tipo de Cambio</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <TextField
          fullWidth variant="outlined" placeholder="Buscar por símbolo, fecha o tasa..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
          sx={{ mb: 2, flexShrink: 0 }}
        />

        <TableContainer component={Paper} sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Table stickyHeader size="small" aria-label="tabla de tipos de cambio">
            <TableHead>
              <TableRow>
                <TableCell sx={{fontWeight: 'bold'}}>Mon. Base</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Mon. Destino</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Fecha</TableCell>
                <TableCell sx={{fontWeight: 'bold'}} align="right">Tasa Compra</TableCell>
                <TableCell sx={{fontWeight: 'bold'}} align="right">Tasa Venta</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography color="error">{error}</Typography></TableCell></TableRow>
              ) : filteredTiposCambio.length > 0 ? (
                filteredTiposCambio.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    onClick={() => handleRowClick(item)}
                    onDoubleClick={() => handleDoubleClick(item)}
                    selected={selectedRow?.id === item.id}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{item.simbolo_moneda_base}</TableCell>
                    <TableCell>{item.simbolo_moneda_destino}</TableCell>
                    <TableCell>{item.fecha.toDate().toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric'})}</TableCell>
                    <TableCell align="right">{item.tasa_compra}</TableCell>
                    <TableCell align="right">{item.tasa_venta}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} align="center">No se encontraron tipos de cambio para la moneda base de esta empresa.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, flexShrink: 0, gap: 2 }}>
            <Button variant="outlined" color="secondary" onClick={onClose} startIcon={<CancelIcon />}>Cancelar</Button>
            <Button variant="contained" onClick={handleConfirmSelection} disabled={!selectedRow} startIcon={<CheckCircleIcon />}>Seleccionar</Button>
        </Box>
      </Box>
    </Modal>
  );
};
// **FIN DE LA REFACTORIZACIÓN DEL MODAL**

export default BuscarTipoCambioModal;
