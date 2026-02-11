// src/components/forms/RoleForm.jsx

import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { 
  Box, 
  Button, 
  TextField, 
  Grid, 
  Typography, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

// Esquema de validación con Yup
const RoleSchema = Yup.object().shape({
  id: Yup.string()
    .required('El nombre del rol es obligatorio.')
    .min(3, 'Debe tener al menos 3 caracteres.')
    .matches(/^[a-z_]+$/, 'Solo se permiten letras minúsculas y guiones bajos (_).'),
  estado: Yup.string()
    .required('El estado es obligatorio.')
});

const RoleForm = ({ initialData, onSubmit, onCancel }) => {
  const isEditing = !!initialData;

  return (
    <Box sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        {isEditing ? 'Editar Rol' : 'Crear Nuevo Rol'}
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Formik
        initialValues={{
          id: initialData?.id || '',
          estado: initialData?.estado || 'activo'
        }}
        validationSchema={RoleSchema}
        onSubmit={(values, actions) => {
          onSubmit(values);
          actions.setSubmitting(false);
        }}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Field
                  as={TextField}
                  name="id"
                  label="Nombre del Rol (ID)"
                  fullWidth
                  disabled={isEditing} // El ID no se puede cambiar al editar
                  error={touched.id && Boolean(errors.id)}
                  helperText={<ErrorMessage name="id" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={touched.estado && Boolean(errors.estado)}>
                  <InputLabel id="estado-label">Estado</InputLabel>
                  <Field
                    as={Select}
                    name="estado"
                    labelId="estado-label"
                    label="Estado"
                  >
                    <MenuItem value="activo">Activo</MenuItem>
                    <MenuItem value="inactivo">Inactivo</MenuItem>
                  </Field>
                  <FormHelperText><ErrorMessage name="estado" /></FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={onCancel}
                sx={{ mr: 2 }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                disabled={isSubmitting}
              >
                {isEditing ? 'Actualizar' : 'Grabar'}
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default RoleForm;
