import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, Switch,
  FormControlLabel, Checkbox, Grid, Typography, Divider, Box
} from '@mui/material';
import { grey } from '@mui/material/colors';

const formatDate = (date) => {
  return date ? new Date(date.seconds * 1000).toLocaleString('es-GT') : 'N/A';
};

const ServicioForm = ({ open, onClose, onSave, servicio }) => {
  const [nombre, setNombre] = useState('');
  const [detalle, setDetalle] = useState('');
  const [aplicaITP, setAplicaITP] = useState(false);
  const [activo, setActivo] = useState(true);

  const isEditing = Boolean(servicio);

  useEffect(() => {
    if (servicio) {
      setNombre(servicio.nombre_servicio || '');
      setDetalle(servicio.detalle_queincluyeservicio || '');
      setAplicaITP(servicio.itp || false);
      setActivo(servicio.estado === 'activo');
    } else {
      // Reset for new entry
      setNombre('');
      setDetalle('');
      setAplicaITP(false);
      setActivo(true);
    }
  }, [servicio, open]);

  const handleSave = () => {
    const servicioData = {
      nombre_servicio: nombre,
      detalle_queincluyeservicio: detalle,
      itp: aplicaITP,
      estado: activo ? 'activo' : 'inactivo',
    };
    onSave(servicioData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>DATOS DEL SERVICIO</Typography>
          <Divider sx={{ mb: 2 }}/>
          
          {/* --- CONTENEDOR FLEXBOX PARA LOS CAMPOS --- */}
          <Box display="flex" gap={2}>
            <Box flex="1 1 33%">
              <TextField
                autoFocus
                margin="dense"
                id="nombre"
                label="Nombre del Servicio"
                type="text"
                fullWidth
                variant="outlined"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </Box>
            <Box flex="1 1 67%">
              <TextField
                margin="dense"
                id="detalle"
                label="Detalle que incluye"
                type="text"
                fullWidth
                variant="outlined"
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
              />
            </Box>
          </Box>

          <FormControlLabel
            control={<Checkbox checked={aplicaITP} onChange={(e) => setAplicaITP(e.target.checked)} />}
            label="Aplica Timbre de Prensa (ITP)"
            sx={{ mt: 1 }}
          />
        </Box>

        {isEditing && (
          <Box sx={{ mt: 3 }}>
             <Grid container spacing={2} alignItems="center">
                <Grid item>
                    <FormControlLabel
                        control={<Switch checked={activo} onChange={(e) => setActivo(e.target.checked)} />}
                        label={activo ? 'Activo' : 'Inactivo'}
                    />
                </Grid>
                <Grid item>
                    <Typography variant="body2" color="text.secondary">
                        Fecha de Estado: {formatDate(servicio.fecha_estado)}
                    </Typography>
                </Grid>
            </Grid>
            <Box mt={2} p={2} sx={{ backgroundColor: grey[100], borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>AUDITORÍA</Typography>
              <Divider sx={{ mb: 1 }}/>
              <Typography variant="caption" display="block" color="text.secondary">
                Creado por: {servicio.usuario_creo} | Fecha creación: {formatDate(servicio.fecha_creacion)}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Modificado por: {servicio.usuario_ultima_modificacion} | Fecha modif.: {formatDate(servicio.fecha_ultima_modificacion)}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary">{isEditing ? 'Actualizar' : 'Crear'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServicioForm;
