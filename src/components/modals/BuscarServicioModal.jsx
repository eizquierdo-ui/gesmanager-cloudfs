import React, { useState, useEffect } from 'react';
import {
  Modal, Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, CircularProgress, Button,
  FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// Firebase
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: '1200px',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  height: '90vh',
  maxHeight: '800px',
};

const BuscarServicioModal = ({ open, onClose, onSelectServicio, empresaId }) => {
  const [categorias, setCategorias] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategorias = async () => {
      if (!open || !empresaId) return;
      setLoadingCategorias(true);
      setError('');
      setCategorias([]);
      setServicios([]);
      setSelectedCategoria('');
      setSelectedServicio(null);

      try {
        const categoriasRef = collection(db, 'categorias');
        const qCategorias = query(categoriasRef, where("empresa_id", "==", empresaId));
        const categoriasSnapshot = await getDocs(qCategorias);
        const categoriasList = categoriasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        categoriasList.sort((a,b) => a.nombre_categoria.localeCompare(b.nombre_categoria));
        setCategorias(categoriasList);
      } catch (err) {
        console.error("Error al cargar categorías:", err);
        setError("Error al cargar las categorías.");
      } finally {
        setLoadingCategorias(false);
      }
    };

    fetchCategorias();
  }, [open, empresaId]);

  useEffect(() => {
    const fetchServicios = async () => {
      if (!selectedCategoria) {
        setServicios([]);
        return;
      }
      setLoadingServicios(true);
      setError('');
      setServicios([]);
      setSelectedServicio(null);

      try {
        const serviciosRef = collection(db, 'servicios');
        const qServicios = query(serviciosRef, where("categoria_id", "==", selectedCategoria));
        const serviciosSnapshot = await getDocs(qServicios);
        const serviciosList = serviciosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Asociar el nombre de la categoría a cada servicio
        const categoriaNombre = categorias.find(c => c.id === selectedCategoria)?.nombre_categoria || 'N/A';
        const serviciosConCategoria = serviciosList.map(s => ({...s, nombre_categoria: categoriaNombre}));

        serviciosConCategoria.sort((a,b) => a.nombre_servicio.localeCompare(b.nombre_servicio));
        setServicios(serviciosConCategoria);
        
      } catch (err) {
        console.error(`Error al cargar servicios para la categoría ${selectedCategoria}:`, err);
        setError("Error al cargar los servicios.");
      } finally {
        setLoadingServicios(false);
      }
    };

    fetchServicios();
  }, [selectedCategoria, categorias]);

  const handleRowClick = (servicio) => {
    setSelectedServicio(servicio);
  };

  const handleDoubleClick = (servicio) => {
    onSelectServicio(servicio);
    onClose();
  };

  const handleConfirmSelection = () => {
    if (selectedServicio) {
      onSelectServicio(selectedServicio);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
            <Typography variant="h6" component="h2">Agregar Servicio</Typography>
            <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <FormControl fullWidth size="small" sx={{ mb: 2, flexShrink: 0 }}>
          <InputLabel id="categoria-select-label">Categoría</InputLabel>
          <Select
            labelId="categoria-select-label"
            value={selectedCategoria}
            label="Categoría"
            onChange={(e) => setSelectedCategoria(e.target.value)}
            disabled={loadingCategorias}
          >
            <MenuItem value="">
              <em>-- Seleccione una Categoría --</em>
            </MenuItem>
            {categorias.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>{cat.nombre_categoria}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TableContainer component={Paper} sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {(loadingServicios || error) && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                    {loadingServicios && <CircularProgress />}
                    {error && <Typography color="error">{error}</Typography>}
                </Box>
            )}
            {!loadingServicios && !error && (
              <Table stickyHeader size="small" aria-label="tabla de servicios">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Servicio</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Qué Incluye</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">ITP</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio Venta</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {servicios.map((servicio) => (
                    <TableRow
                      key={servicio.id}
                      hover
                      onClick={() => handleRowClick(servicio)}
                      onDoubleClick={() => handleDoubleClick(servicio)}
                      selected={selectedServicio?.id === servicio.id}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{servicio.nombre_categoria}</TableCell>
                      <TableCell>{servicio.nombre_servicio}</TableCell>
                      <TableCell>{servicio.detalle_queincluyeservicio}</TableCell>
                      <TableCell align="center">
                          <Chip label={servicio.itp ? 'Sí' : 'No'} variant="outlined" size="small" color={servicio.itp ? 'info' : 'default'}/>
                      </TableCell>
                      <TableCell align="right">{`Q.${(servicio.precios_calculados?.precio_venta_base || 0).toFixed(2)}`}</TableCell>
                      <TableCell align="center">
                          <Chip label={servicio.estado} color={servicio.estado === 'activo' ? 'success' : 'default'} size="small"/>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!loadingServicios && !error && servicios.length === 0 && (
                <Typography sx={{ p: 2, textAlign: 'center' }}>
                    { selectedCategoria ? 'No se encontraron servicios para esta categoría.' : 'Por favor, seleccione una categoría para ver los servicios.' }
                </Typography>
            )}
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, flexShrink: 0, gap: 2 }}>
            <Button variant="outlined" color="secondary" onClick={onClose} startIcon={<CancelIcon />}>
                Cancelar
            </Button>
            <Button
                variant="contained"
                onClick={handleConfirmSelection}
                disabled={!selectedServicio}
                startIcon={<CheckCircleIcon />}
            >
                Seleccionar
            </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default BuscarServicioModal;
