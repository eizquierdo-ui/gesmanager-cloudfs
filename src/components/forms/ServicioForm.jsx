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
  Divider,
  Checkbox
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
// --- Esquema de Validación ---
const ServicioSchema = Yup.object().shape({
  nombre_servicio: Yup.string()
    .min(3, 'El nombre es muy corto')
    .required('El nombre del servicio es obligatorio'),
  detalle_queincluyeservicio: Yup.string(),
  itp: Yup.boolean(),
  estado: Yup.string(),
});
// --- Switch con Estilo Personalizado ---
const EstadoSwitch = styled(Switch)(({ theme, ownerState }) => ({
    // Estilos del Switch (copiados de CategoriaForm)
}));
// --- Helper para Formatear Timestamps de Firestore ---
const formatTimestamp = (timestamp) => {
  if (timestamp && typeof timestamp.seconds === 'number') {
    return format(new Date(timestamp.seconds * 1000), 'dd/MM/yyyy HH:mm:ss');
  }
  return 'No disponible';
};
const ServicioForm = ({ initialData, onSubmit, onCancel }) => {
  const isEditing = !!initialData;
  const initialValues = {
    nombre_servicio: initialData?.nombre_servicio || '',
    detalle_queincluyeservicio: initialData?.detalle_queincluyeservicio || '',
    itp: initialData?.itp || false,
    estado: initialData?.estado || 'activo',
  };
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={ServicioSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, values, setFieldValue }) => (
        <Form>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Divider textAlign="left" sx={{ mb: 2, '&::before, &::after': {borderColor: 'primary.main'} }}><Typography variant="h6">Datos del Servicio</Typography></Divider>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Field as={TextField} name="nombre_servicio" label="Nombre del Servicio" fullWidth variant="outlined" error={touched.nombre_servicio && !!errors.nombre_servicio} helperText={touched.nombre_servicio && errors.nombre_servicio} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Field as={TextField} name="detalle_queincluyeservicio" label="Detalle que incluye (Opcional)" fullWidth variant="outlined" />
                </Grid>
                 <Grid item xs={12}>
                    <FormControlLabel
                        control={<Field as={Checkbox} type="checkbox" name="itp" />} 
                        label="Aplica Timbre de Prensa (ITP)"
                    />
                </Grid>
              </Grid>
            </Box>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={isEditing ? 6 : 12} sm={isEditing ? 4 : 6}>
                    <FormControlLabel
                        control={<EstadoSwitch checked={values.estado === 'activo'} readOnly={!isEditing} onChange={(e) => setFieldValue('estado', e.target.checked ? 'activo' : 'inactivo')} ownerState={{ checked: values.estado === 'activo' }} />}
                        label={<Typography sx={{fontWeight: 'bold'}}>{values.estado === 'activo' ? "Activo" : "Inactivo"}</Typography>}
                    />
                     <FormHelperText sx={{ml: 1.5}}>{isEditing ? "Estado del servicio" : "Se creará como Activo"}</FormHelperText>
                </Grid>
                <Grid item xs={6} sm={8}>
                    <Typography variant="caption" display="block">Fecha de Estado:</Typography>
                    <Typography variant="body2" sx={{fontWeight: 500}}>{isEditing ? formatTimestamp(initialData.fecha_estado) : format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</Typography>
                </Grid>
            </Grid>
            {isEditing && (
              <Box sx={{pt: 1}}>
                <Divider textAlign="left" sx={{ mb: 1.5, '&::before, &::after': {borderColor: 'primary.light'} }}><Typography variant="overline">Auditoría</Typography></Divider>
                <Grid container spacing={1} sx={{ color: 'text.secondary' }}>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Creado por:</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" sx={{fontWeight: 'bold'}}>{initialData.usuario_creo || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Fecha creación:</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" sx={{fontWeight: 'bold'}}>{formatTimestamp(initialData.fecha_creacion)}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Modificado por:</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" sx={{fontWeight: 'bold'}}>{initialData.usuario_ultima_modificacion || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Fecha modif.:</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" sx={{fontWeight: 'bold'}}>{formatTimestamp(initialData.fecha_ultima_modificacion)}</Typography></Grid>
                </Grid>
              </Box>
            )}
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
export default ServicioForm;