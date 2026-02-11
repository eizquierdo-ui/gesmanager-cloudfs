
// src/components/forms/AsignacionForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  FormControl, InputLabel, Select, MenuItem, Grid, Typography, Divider
} from '@mui/material';

const AsignacionForm = ({ open, onClose, onSave, initialData, usuarios, empresas }) => {
  const [formData, setFormData] = useState({ usuario_id: '', empresa_id: '', estado: 'activo' });
  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        usuario_id: initialData.usuario_id || '',
        empresa_id: initialData.empresa_id || '',
        estado: initialData.estado || 'activo'
      });
    } else {
      setFormData({ usuario_id: '', empresa_id: '', estado: 'activo' });
    }
  }, [initialData, isEditing, open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    // 1. Ancho del modal recortado a "sm" (small)
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">{isEditing ? 'Editar Asignación' : 'Crear Nueva Asignación'}</Typography>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
            
            {/* 2. Distribución de anchos: Usuario (5/12), Empresa (5/12), Estado (2/12) */}
            <Grid item xs={12} sm={5}>
                 {/* 3. Se elimina el "disabled". TODOS los campos son siempre editables */}
                 <FormControl fullWidth>
                    <InputLabel id="usuario-select-label">Usuario</InputLabel>
                    <Select
                        labelId="usuario-select-label"
                        name="usuario_id"
                        value={formData.usuario_id}
                        label="Usuario"
                        onChange={handleChange}
                    >
                        {usuarios.map(user => (
                            <MenuItem key={user.id} value={user.id}>
                                {user.nombre_usuario || user.email_usuario} 
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={12} sm={5}>
                 <FormControl fullWidth>
                    <InputLabel id="empresa-select-label">Empresa</InputLabel>
                    <Select
                        labelId="empresa-select-label"
                        name="empresa_id"
                        value={formData.empresa_id}
                        label="Empresa"
                        onChange={handleChange}
                    >
                        {empresas.map(empresa => (
                            <MenuItem key={empresa.id} value={empresa.id}>{empresa.nombre}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={12} sm={2}>
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
            </Grid>

        </Grid>
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
