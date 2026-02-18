// src/components/forms/AsignacionForm.jsx
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  FormControl, InputLabel, Select, MenuItem, Box, Typography, Divider
} from '@mui/material';

const AsignacionForm = ({ open, onClose, onSave, initialData, usuarios, empresas }) => {
  const [formData, setFormData] = useState(
    initialData 
      ? { 
          usuario_id: initialData.usuario_id || '',
          empresa_id: initialData.empresa_id || '',
          estado: initialData.estado || 'activo'
        }
      : { usuario_id: '', empresa_id: '', estado: 'activo' }
  );
  const isEditing = Boolean(initialData);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">{isEditing ? 'Editar Asignación' : 'Crear Nueva Asignación'}</Typography>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Box sx={{ width: '33.33%' }}>
            <FormControl fullWidth>
              <InputLabel id="usuario-select-label">Usuario</InputLabel>
              <Select
                  labelId="usuario-select-label"
                  name="usuario_id"
                  value={formData.usuario_id}
                  label="Usuario"
                  onChange={handleChange}
                  disabled={isEditing}
              >
                  <MenuItem value="" disabled><em>Seleccione</em></MenuItem>
                  {usuarios.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                          {user.nombre_usuario || user.email_usuario} 
                      </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ width: '33.33%' }}>
            <FormControl fullWidth>
              <InputLabel id="empresa-select-label">Empresa</InputLabel>
              <Select
                  labelId="empresa-select-label"
                  name="empresa_id"
                  value={formData.empresa_id}
                  label="Empresa"
                  onChange={handleChange}
                  disabled={isEditing}
              >
                  <MenuItem value="" disabled><em>Seleccione</em></MenuItem>
                  {empresas.map(empresa => (
                      <MenuItem key={empresa.id} value={empresa.id}>{empresa.nombre}</MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ width: '33.33%' }}>
            <FormControl fullWidth>
              <InputLabel id="estado-select-label">Estado</InputLabel>
              <Select
                labelId="estado-select-label"
                name="estado"
                value={formData.estado}
                label="Estado"
                onChange={handleChange}
              >
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="inactivo">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} variant="outlined" color="error">
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" color="success">
          {isEditing ? 'Actualizar' : 'Grabar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AsignacionForm;
