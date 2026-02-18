
import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  TextField,
  Button,
  Grid,
  Box,
  CircularProgress,
  Typography,
  Switch,
  FormControlLabel,
  FormHelperText,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';

// --- Esquema de Validación ---
const CategoriaSchema = Yup.object().shape({
  nombre_categoria: Yup.string()
    .min(3, 'El nombre es muy corto')
    .required('El nombre de la categoría es obligatorio'),
  descripcion: Yup.string(),
  estado: Yup.string(),
});

// --- Switch con Estilo Personalizado ---
const EstadoSwitch = styled(Switch)(({ theme, ownerState }) => ({
    width: 62,
    height: 34,
    padding: 7,
    '& .MuiSwitch-switchBase': {
      margin: 1,
      padding: 0,
      transform: 'translateX(6px)',
      '&.Mui-checked': {
        color: '#fff',
        transform: 'translateX(22px)',
        '& .MuiSwitch-thumb:before': {
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent('#fff')}" d="M16.7,5.3c-0.4-0.4-1-0.4-1.4,0L9,11.6L5.7,8.3c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l4,4C8.5,13.9,8.7,14,9,14s0.5-0.1,0.7-0.3l7-7C17.1,6.3,17.1,5.7,16.7,5.3z"/></svg>')`,
        },
        '& + .MuiSwitch-track': { opacity: 1, backgroundColor: theme.palette.success.main },
      },
    },
    '& .MuiSwitch-thumb': {
      backgroundColor: ownerState.checked ? theme.palette.success.dark : theme.palette.error.dark,
      width: 32,
      height: 32,
      '&:before': {
        content: "''",
        position: 'absolute',
        width: '100%',
        height: '100%',
        left: 0,
        top: 0,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent('#fff')}" d="M14.3,5.7c-0.4-0.4-1-0.4-1.4,0L10,8.6L7.1,5.7c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4L8.6,10l-2.9,2.9c-0.4,0.4-0.4,1,0,1.4C6,14.5,6.2,14.6,6.4,14.6s0.5-0.1,0.7-0.3L10,11.4l2.9,2.9c0.2,0.2,0.4,0.3,0.7,0.3s0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4L11.4,10l2.9-2.9C14.7,6.7,14.7,6.1,14.3,5.7z"/></svg>')`,
      },
    },
    '& .MuiSwitch-track': { opacity: 1, backgroundColor: theme.palette.grey[500], borderRadius: 20 / 2 },
}));

// --- Helper para Formatear Timestamps de Firestore ---
const formatTimestamp = (timestamp) => {
  if (timestamp && typeof timestamp.seconds === 'number') {
    return format(new Date(timestamp.seconds * 1000), 'dd/MM/yyyy HH:mm:ss');
  }
  return 'No disponible';
};

const CategoriaForm = ({ initialData, onSubmit, onCancel }) => {

  const isEditing = !!initialData;

  const initialValues = {
    nombre_categoria: initialData?.nombre_categoria || '',
    descripcion: initialData?.descripcion || '',
    estado: initialData?.estado || 'activo',
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={CategoriaSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, values, setFieldValue }) => (
        <Form>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* --- SECCIÓN DATOS DE LA CATEGORÍA --- */}
            <Box>
              <Divider textAlign="left" sx={{ mb: 2, '&::before, &::after': {borderColor: 'primary.main'} }}><Typography variant="h6">Datos de la Categoría</Typography></Divider>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Field as={TextField} name="nombre_categoria" label="Nombre de la Categoría" fullWidth variant="outlined" error={touched.nombre_categoria && !!errors.nombre_categoria} helperText={touched.nombre_categoria && errors.nombre_categoria} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Field as={TextField} name="descripcion" label="Descripción (Opcional)" fullWidth variant="outlined" />
                </Grid>
              </Grid>
            </Box>

            {/* --- ESTADO Y FECHA DE ESTADO --- */}
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={isEditing ? 6 : 12} sm={isEditing ? 4 : 6}>
                    <FormControlLabel
                        control={<EstadoSwitch checked={values.estado === 'activo'} onChange={(e) => setFieldValue('estado', e.target.checked ? 'activo' : 'inactivo')} ownerState={{ checked: values.estado === 'activo' }} />}
                        label={<Typography sx={{fontWeight: 'bold'}}>{values.estado === 'activo' ? "Activo" : "Inactivo"}</Typography>}
                    />
                    <FormHelperText sx={{ml: 1.5}}>Estado de la categoría</FormHelperText>
                </Grid>
                {isEditing && (
                    <Grid item xs={6} sm={8}>
                        <Typography variant="caption" display="block">Último cambio de estado:</Typography>
                        <Typography variant="body2" sx={{fontWeight: 500}}>{formatTimestamp(initialData.fecha_estado)}</Typography>
                    </Grid>
                )}
            </Grid>

            {/* --- SECCIÓN DE AUDITORÍA (SOLO EN EDICIÓN) --- */}
            {isEditing && (
              <Box sx={{pt: 1}}>
                <Divider textAlign="left" sx={{ mb: 1.5, '&::before, &::after': {borderColor: 'primary.light'} }}><Typography variant="overline">Auditoría</Typography></Divider>
                <Grid container spacing={1} sx={{ color: 'text.secondary' }}>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Creado por:</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" sx={{fontWeight: 'bold'}}>{initialData.usuario_creacion || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Fecha creación:</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" sx={{fontWeight: 'bold'}}>{formatTimestamp(initialData.fecha_creacion)}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Modificado por:</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" sx={{fontWeight: 'bold'}}>{initialData.usuario_modificacion || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Fecha modif.:</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" sx={{fontWeight: 'bold'}}>{formatTimestamp(initialData.fecha_modificacion)}</Typography></Grid>
                </Grid>
              </Box>
            )}

            {/* --- BOTONES DE ACCIÓN --- */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: isEditing ? 1 : 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button variant="outlined" color="secondary" onClick={onCancel} sx={{ mr: 2 }} startIcon={<CancelIcon />}>Cancelar</Button>
              <Button type="submit" variant="contained" color="primary" disabled={isSubmitting} startIcon={<SaveIcon />}>
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'Actualizar' : 'Grabar')}
              </Button>
            </Box>
          </Box>
        </Form>
      )}
    </Formik>
  );
};

export default CategoriaForm;
