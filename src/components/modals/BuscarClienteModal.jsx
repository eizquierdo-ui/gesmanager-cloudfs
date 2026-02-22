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

const BuscarClienteModal = ({ open, onClose, onSelect }) => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRow, setSelectedRow] = useState(null); // <-- 1. ESTADO PARA LA SELECCIÓN

  const { sessionData } = useAppContext();

  useEffect(() => {
    const fetchClientes = async () => {
      if (!open) return;

      // Reiniciar estados al abrir
      setLoading(true);
      setError('');
      setClientes([]);
      setFilteredClientes([]);
      setSearchTerm('');
      setSelectedRow(null); // <-- Reiniciar selección

      try {
        const empresaId = sessionData?.empresa_id;
        if (!empresaId) {
          throw new Error("No se encontró un ID de empresa en la sesión. Por favor, seleccione una empresa.");
        }

        const clientesRef = collection(db, 'clientes');
        const qClientes = query(clientesRef, where("empresa_id", "==", empresaId));
        const clientesSnapshot = await getDocs(qClientes);

        const clientesList = clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        clientesList.sort((a, b) => a.nombre_cliente.localeCompare(b.nombre_cliente));

        setClientes(clientesList);
        setFilteredClientes(clientesList);

      } catch (err) {
        console.error("Error al cargar clientes:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, [open, sessionData]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = clientes.filter(item => (
      item.nombre_cliente?.toLowerCase().includes(lowercasedFilter) ||
      item.nit_cliente?.toLowerCase().includes(lowercasedFilter)
    ));
    setFilteredClientes(filteredData);
  }, [searchTerm, clientes]);

  // --- 2. MANEJADORES DE CLIC Y DOBLE CLIC ---
  const handleRowClick = (cliente) => {
    setSelectedRow(cliente);
  };

  const handleDoubleClick = (cliente) => {
    onSelect(cliente);
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
            <Typography variant="h6" component="h2">Buscar Cliente</Typography>
            <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por Nombre o NIT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
          sx={{ mb: 2, flexShrink: 0 }}
        />

        <TableContainer component={Paper} sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
            {error && <Typography color="error" sx={{ my: 2, textAlign: 'center' }}>{error}</Typography>}
            {!loading && !error && (
              <Table stickyHeader aria-label="tabla de clientes">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre Cliente</TableCell>
                    <TableCell>NIT</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Contacto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow 
                      key={cliente.id} 
                      hover 
                      onClick={() => handleRowClick(cliente)} 
                      onDoubleClick={() => handleDoubleClick(cliente)} 
                      selected={selectedRow?.id === cliente.id} // <-- Resaltar fila seleccionada
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{cliente.nombre_cliente}</TableCell>
                      <TableCell>{cliente.nit_cliente}</TableCell>
                      <TableCell>{cliente.telefono_cliente}</TableCell>
                      <TableCell>{cliente.contacto}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </TableContainer>

        {/* --- 3. BOTONES DE ACCIÓN --- */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, flexShrink: 0, gap: 2 }}>
            <Button variant="outlined" color="secondary" onClick={onClose} startIcon={<CancelIcon />}>
                Cancelar
            </Button>
            <Button 
                variant="contained" 
                onClick={handleConfirmSelection} 
                disabled={!selectedRow} // <-- Deshabilitado si no hay selección
                startIcon={<CheckCircleIcon />}
            >
                Seleccionar
            </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default BuscarClienteModal;
