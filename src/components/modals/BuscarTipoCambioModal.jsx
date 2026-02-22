import React, { useState, useEffect } from 'react';
import {
  Modal, Box, Typography, TextField, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, 
  CircularProgress, Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// --- Hooks y Contextos ---
import { useAppContext } from '../../contexts/AppContext';

// --- Importaciones de Firebase ---
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Estilos
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

const BuscarTipoCambioModal = ({ open, onClose, onSelect }) => {
  const { sessionData } = useAppContext();
  const [tiposCambio, setTiposCambio] = useState([]);
  const [filteredTiposCambio, setFilteredTiposCambio] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    const fetchTiposCambio = async () => {
      // PASO 1: Verificar que tengamos el empresa_id de la sesión
      if (!sessionData?.empresa_id) {
        setError("No se ha podido identificar la empresa del usuario.");
        return;
      }

      setLoading(true);
      setError('');
      setTiposCambio([]); // Limpiar datos anteriores
      setFilteredTiposCambio([]);

      try {
        // PASO 2: Obtener todos los símbolos de moneda y guardarlos en un Mapa para fácil acceso
        const monedasRef = collection(db, 'monedas');
        const monedasSnap = await getDocs(monedasRef);
        const monedasMap = new Map();
        monedasSnap.forEach(doc => monedasMap.set(doc.id, doc.data().simbolo));

        // PASO 3: Construir la consulta a tipos_cambio, filtrando por empresa
        const q = query(
          collection(db, 'tipos_cambio'),
          where('empresa_id', '==', sessionData.empresa_id)
        );
        const querySnapshot = await getDocs(q);

        // PASO 4: Mapear y "Enriquecer" los resultados con los símbolos del Mapa
        const data = querySnapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            simbolo_moneda_base: monedasMap.get(docData.moneda_base_id) || '?',
            simbolo_moneda_destino: monedasMap.get(docData.moneda_destino_id) || '?',
          };
        });

        // Ordenar los resultados por fecha (más recientes primero) en el lado del cliente
        data.sort((a, b) => {
          if (a.fecha_tipocambio && b.fecha_tipocambio) {
            return b.fecha_tipocambio.toMillis() - a.fecha_tipocambio.toMillis();
          }
          return 0;
        });

        setTiposCambio(data);
        setFilteredTiposCambio(data);

      } catch (err) {
        console.error("Error al buscar tipos de cambio:", err);
        setError("Ocurrió un error al cargar los tipos de cambio.");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchTiposCambio();
      setSearchTerm(''); // Limpiar búsqueda y selección al abrir
      setSelectedRow(null);
    }
  }, [open, sessionData]);

  // Lógica de filtrado en tiempo real
  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = tiposCambio.filter(item => {
        const fechaStr = item.fecha_tipocambio?.toDate().toLocaleDateString('es-GT') || '';
        return (
            (item.simbolo_moneda_base || '').toLowerCase().includes(lowercasedFilter) ||
            (item.simbolo_moneda_destino || '').toLowerCase().includes(lowercasedFilter) ||
            fechaStr.includes(lowercasedFilter) ||
            item.tasa_compra.toString().includes(lowercasedFilter) ||
            item.tasa_venta.toString().includes(lowercasedFilter)
        );
    });
    setFilteredTiposCambio(filteredData);
  }, [searchTerm, tiposCambio]);

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
                    <TableCell>{item.fecha_tipocambio.toDate().toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric'})}</TableCell>
                    <TableCell align="right">{item.tasa_compra}</TableCell>
                    <TableCell align="right">{item.tasa_venta}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} align="center">No se encontraron tipos de cambio para esta empresa.</TableCell></TableRow>
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

export default BuscarTipoCambioModal;
