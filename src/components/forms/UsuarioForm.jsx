
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  FormHelperText
} from '@mui/material';
import { getRoles } from '../../services/usuariosService';
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";

const UsuarioForm = ({ open, onClose, onSave, initialData, isEditMode }) => {
  const [formData, setFormData] = useState({ 
    nombre_usuario: initialData?.nombre_usuario || '', 
    email_usuario: initialData?.email_usuario || '', 
    password: '',
    role: initialData?.role || '',
    estado: initialData?.estado || 'activo' // Valor por defecto
  });
  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getRoles().then(setRoles).catch(err => console.error("Error al cargar roles: ", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre_usuario) newErrors.nombre_usuario = 'El nombre es requerido';
    if (!formData.email_usuario) newErrors.email_usuario = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email_usuario)) newErrors.email_usuario = 'El formato del email es inválido';
    if (!isEditMode && !formData.password) newErrors.password = 'La contraseña es requerida';
    else if (!isEditMode && formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    if (!formData.role) newErrors.role = 'El rol es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
        let userId = isEditMode ? initialData.id : null;

        if (!isEditMode) {
            const auth = getAuth();
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email_usuario, formData.password);
            userId = userCredential.user.uid;
        }

        const firestoreData = {
          nombre_usuario: formData.nombre_usuario,
          email_usuario: formData.email_usuario,
          role: formData.role,
          estado: formData.estado
        };
        
        onSave(userId, firestoreData, isEditMode);
        onClose();

    } catch (error) {
        console.error("Error al guardar el usuario:", error);
        const newErrors = {};
        if (error.code === 'auth/email-already-in-use') {
            newErrors.email_usuario = 'Este correo electrónico ya está en uso.';
        } else {
            newErrors.general = `Error: ${error.message}`;
        }
        setErrors(newErrors);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
      <DialogContent>
        {errors.general && <p style={{ color: 'red' }}>{errors.general}</p>}
        <TextField
          autoFocus
          margin="dense"
          name="nombre_usuario"
          label="Nombre Completo"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.nombre_usuario}
          onChange={handleChange}
          error={!!errors.nombre_usuario}
          helperText={errors.nombre_usuario}
        />
        <TextField
          margin="dense"
          name="email_usuario"
          label="Correo Electrónico"
          type="email"
          fullWidth
          variant="outlined"
          value={formData.email_usuario}
          onChange={handleChange}
          error={!!errors.email_usuario}
          helperText={errors.email_usuario}
          disabled={isEditMode}
        />
        {!isEditMode && (
          <TextField
            margin="dense"
            name="password"
            label="Contraseña"
            type="password"
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
          />
        )}
        <FormControl fullWidth margin="dense" error={!!errors.role}>
          <InputLabel>Rol</InputLabel>
          <Select
            name="role"
            value={formData.role}
            label="Rol"
            onChange={handleChange}
          >
            {roles.map(role => (
              <MenuItem key={role.id} value={role.id}>
                {role.role_nombre}
              </MenuItem>
            ))}
          </Select>
          {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
        </FormControl>
        {isEditMode && (
            <FormControl fullWidth margin="dense">
                <InputLabel>Estado</InputLabel>
                <Select
                    name="estado"
                    value={formData.estado}
                    label="Estado"
                    onChange={handleChange}
                >
                    <MenuItem value="activo">Activo</MenuItem>
                    <MenuItem value="inactivo">Inactivo</MenuItem>
                </Select>
            </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">{isEditMode ? 'Actualizar' : 'Guardar'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UsuarioForm;
