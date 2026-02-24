import React, { useState, useEffect } from 'react';
import {
  Modal, Box, Typography, Button, TextField, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import PropTypes from 'prop-types';

// --- Servicios de Firestore ---
import { getServiciosActivosPorEmpresa } from '../../services/firestore/serviciosService';

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
};

const BuscarServicioModal = ({ open, onClose, onSelect, empresaId }) => {
  const [servicios, setServicios] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchServicios = async () => {
        setLoading(true);
        try {
          const serviciosData = await getServiciosActivosPorEmpresa(empresaId);
          setServicios(serviciosData);
        } catch (error) {
          console.error("Error al cargar los servicios:", error);
          setServicios([]); // Limpiar en caso de error
        } finally {
          setLoading(false);
        }
      };

      fetchServicios();
    }
  }, [open, empresaId]);

  const handleSelect = (servicio) => {
    onSelect(servicio);
  };

  const filteredServicios = servicios.filter(s => 
    (s.nombre?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
    (s.categoria_nombre?.toLowerCase() || '').includes(filtro.toLowerCase())
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-buscar-servicio-title"
    >
      <Box sx={style}>
        <Typography id="modal-buscar-servicio-title" variant="h6" component="h2">
          Buscar Servicio
        </Typography>
        <TextField 
          label="Filtrar por categoría o servicio" 
          variant="outlined" 
          fullWidth 
          size="small" 
          value={filtro} 
          onChange={(e) => setFiltro(e.target.value)} 
          sx={{ my: 2 }}
        />
        <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Servicio</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio Venta</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Qué Incluye</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredServicios.length > 0 ? (
                  filteredServicios.map((servicio) => (
                    <TableRow key={servicio.id}>
                      <TableCell>{servicio.categoria_nombre}</TableCell>
                      <TableCell>{servicio.nombre}</TableCell>
                      <TableCell align="right">{servicio.precio_venta_base}</TableCell>
                      <TableCell>{servicio.descripcion_queincluyeservicio}</TableCell>
                      <TableCell align="center">
                        <Button variant="contained" size="small" onClick={() => handleSelect(servicio)}>Seleccionar</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No se encontraron servicios.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cerrar</Button>
        </Box>
      </Box>
    </Modal>
  );
};

BuscarServicioModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  empresaId: PropTypes.string.isRequired,
};

export default BuscarServicioModal;
