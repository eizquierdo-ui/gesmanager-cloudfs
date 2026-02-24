
import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  TextField, Button, Grid, Box, CircularProgress, Typography, Switch,
  FormControlLabel, MenuItem // <-- Solo necesitamos MenuItem
} from '@mui/material';

// El servicio para traer los padres sigue siendo útil
import { subscribeToParentMenus } from '../../services/firestore/menuService'; 

import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';

// Esquema de validación (sin cambios)
const MenuSchema = Yup.object().shape({
  Label: Yup.string().min(3, 'El Label es muy corto').required('El Label es obligatorio'),
  Ruta: Yup.string().when('es_padre', {
    is: false,
    then: () => Yup.string().matches(/^(\/[a-z0-9-]+)+$/, 'Formato de ruta inválido').required('La ruta es obligatoria'),
    otherwise: () => Yup.string().nullable(),
  }),
  Orden: Yup.number().typeError('Debe ser un número').integer('Debe ser un entero').required('El orden es obligatorio'),
  id_padre: Yup.string().nullable(),
  Icon: Yup.string().nullable(),
  es_padre: Yup.boolean(),
  estado: Yup.string(),
});

const MenuForm = ({ initialData, onSubmit, onCancel }) => {
  const isEditing = !!initialData;
  const [parentMenus, setParentMenus] = useState([]);

  useEffect(() => {
    // Obtenemos la lista de posibles padres al cargar el componente
    const unsubscribe = subscribeToParentMenus(setParentMenus);
    return () => unsubscribe();
  }, []);

  const initialValues = {
    Label: initialData?.Label || '',
    Ruta: initialData?.Ruta || '',
    Orden: initialData?.Orden ?? 0,
    id_padre: initialData?.id_padre || '', // Usar string vacío para el select
    Icon: initialData?.Icon || '',
    es_padre: initialData?.es_padre ?? false,
    estado: initialData?.estado || 'activo',
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={MenuSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, values, setFieldValue }) => (
        <Form>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            {isEditing ? `Editando: ${initialData.Label}` : 'Nuevo Ítem de Menú'}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Field as={TextField} name="Label" label="Label (texto a mostrar)" fullWidth variant="outlined" error={touched.Label && !!errors.Label} helperText={touched.Label && errors.Label} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Field as={TextField} name="Orden" label="Orden" type="number" fullWidth variant="outlined" error={touched.Orden && !!errors.Orden} helperText={touched.Orden && errors.Orden} />
            </Grid>
            <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel control={<Switch checked={values.es_padre} onChange={(e) => setFieldValue('es_padre', e.target.checked)} />} label="Es Padre" />
            </Grid>

            {/* --- SELECT SIMPLE PARA EL PADRE --- */}
            <Grid item xs={12} sm={6}>
                <Field
                    as={TextField}
                    select
                    name="id_padre"
                    label="Menú Padre (si es hijo)"
                    fullWidth
                    variant="outlined"
                    disabled={values.es_padre}
                    error={touched.id_padre && !!errors.id_padre}
                    helperText={touched.id_padre && errors.id_padre}
                >
                    <MenuItem value=""><em>Ninguno</em></MenuItem>
                    {parentMenus.map(parent => (
                        <MenuItem key={parent.id} value={parent.id}>
                            {parent.Label}
                        </MenuItem>
                    ))}
                </Field>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Field as={TextField} name="Ruta" label="Ruta de Navegación" fullWidth variant="outlined" disabled={values.es_padre} error={touched.Ruta && !!errors.Ruta} helperText={touched.Ruta && errors.Ruta || 'Obligatorio si no es padre'} />
            </Grid>
            
            {/* --- CAMPO DE TEXTO SIMPLE PARA EL ICONO --- */}
            <Grid item xs={12} sm={6}>
              <Field as={TextField} name="Icon" label="Icono (ingreso manual)" fullWidth variant="outlined" error={touched.Icon && !!errors.Icon} helperText={touched.Icon && errors.Icon} />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel control={<Switch checked={values.estado === 'activo'} onChange={(e) => setFieldValue('estado', e.target.checked ? 'activo' : 'inactivo')} />} label={<Typography sx={{fontWeight: 'bold'}}>{values.estado === 'activo' ? "Activo" : "Inactivo"}</Typography>} />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button variant="outlined" color="secondary" onClick={onCancel} sx={{ mr: 2 }} startIcon={<CancelIcon />}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting} startIcon={<SaveIcon />}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'Actualizar' : 'Crear')}
            </Button>
          </Box>
        </Form>
      )}
    </Formik>
  );
};

export default MenuForm;
