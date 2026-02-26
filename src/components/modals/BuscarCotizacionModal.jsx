
import React, { useState, useEffect } from 'react';
import {
  Modal, Box, Typography, TextField, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, 
  CircularProgress, Button, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { db } from '../../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '1200px',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  height: '90vh',
  maxHeight: '700px',
};

const formatCurrency = (value, currencySymbol = 'Q.') => {
  const number = parseFloat(value) || 0;
  return `${currencySymbol} ${number.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date) => {
    if (!date) return '';
    const jsDate = new Date(date.seconds * 1000);
    return jsDate.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const estadoColors = {
    borrador: 'primary',
    aceptada: 'success',
    facturada: 'default',
    anulada: 'error',
};

const BuscarCotizacionModal = ({ open, onClose, onSelect, empresaId }) => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [filteredCotizaciones, setFilteredCotizaciones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    const fetchCotizaciones = async () => {
      if (!open || !empresaId) return;
      
      setLoading(true);
      setError('');
      setCotizaciones([]);
      setFilteredCotizaciones([]);
      setSearchTerm('');
      setSelectedRow(null);

      try {
        const cotizacionesRef = collection(db, 'cotizaciones');
        const q = query(
          cotizacionesRef, 
          where('empresa_id', '==', empresaId),
          where('estado', 'in', ['borrador', 'aceptada']),
          orderBy('numero_cotizacion', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            setError("No se encontraron cotizaciones en estado 'borrador' o 'aceptada' para esta empresa.");
        }
        const cotizacionesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCotizaciones(cotizacionesList);
        setFilteredCotizaciones(cotizacionesList);
      } catch (err) {
        console.error("Error al cargar cotizaciones:", err);
        if (err.code === 'failed-precondition') {
            setError("Error: La consulta requiere un índice de Firestore. Por favor, cree el índice desde el enlace en la consola de desarrollador y vuelva a intentarlo.");
        } else {
            setError(`Error inesperado al cargar cotizaciones: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCotizaciones();
  }, [open, empresaId]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = cotizaciones.filter(cot => (
      (cot.numero_cotizacion?.toLowerCase() || '').includes(lowercasedFilter) ||
      (cot.cliente_snapshot?.nombre_cliente?.toLowerCase() || '').includes(lowercasedFilter)
    ));
    setFilteredCotizaciones(filteredData);
  }, [searchTerm, cotizaciones]);

  const handleRowClick = (cotizacion) => {
    setSelectedRow(cotizacion);
  };

  const handleDoubleClick = (cotizacion) => {
    onSelect(cotizacion);
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
            <Typography variant="h6" component="h2">Buscar Cotización</Typography>
            <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por No. de Cotización o Nombre de Cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
          sx={{ mb: 2, flexShrink: 0 }}
        />

        <TableContainer component={Paper} sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
            {error && <Typography color="error" sx={{ my: 2, mx: 2, textAlign: 'center' }}>{error}</Typography>}
            {!loading && !error && (
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>No. Cotización</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Estado</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Monto Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCotizaciones.map((cot) => (
                    <TableRow 
                      key={cot.id} 
                      hover 
                      onClick={() => handleRowClick(cot)} 
                      onDoubleClick={() => handleDoubleClick(cot)} 
                      selected={selectedRow?.id === cot.id}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{cot.numero_cotizacion}</TableCell>
                      <TableCell>{formatDate(cot.fecha_emision)}</TableCell>
                      <TableCell>{cot.cliente_snapshot?.nombre_cliente}</TableCell>
                      <TableCell align="center">
                        <Chip 
                            label={cot.estado}
                            color={estadoColors[cot.estado] || 'default'}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(cot.totales?.total_cotizacion_final, cot.financiero_snapshot?.simbolo_moneda_base)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, flexShrink: 0, gap: 2 }}>
            <Button variant="outlined" color="secondary" onClick={onClose} startIcon={<CancelIcon />}>
                Cancelar
            </Button>
            <Button 
                variant="contained" 
                onClick={handleConfirmSelection} 
                disabled={!selectedRow}
                startIcon={<CheckCircleIcon />}
            >
                Seleccionar
            </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default BuscarCotizacionModal;
