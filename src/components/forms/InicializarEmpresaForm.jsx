
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

// --- Iconos para Botones ---
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';

// --- Esquema de Validación (sin cambios) ---
const EmpresaSchema = Yup.object().shape({
  nombre: Yup.string().min(3, 'El nombre es muy corto').required('El nombre es obligatorio'),
  nit: Yup.string().required('El NIT es obligatorio'),
  direccion: Yup.string().required('La dirección es obligatoria'),
  email: Yup.string().email('Email no válido').required('El email es obligatorio'),
  telefono: Yup.string().required('El teléfono es obligatorio'),
  contacto: Yup.string().required('El nombre del contacto es obligatorio'),
  telefono_contacto: Yup.string().required('El teléfono del contacto es obligatorio'),
  estado: Yup.string(),
  moneda_base_id: Yup.string().length(3, 'Debe ser un código de 3 letras (ej. GTQ)').required('La moneda es obligatoria'),
  config_fiscal: Yup.object().shape({
    tasa_iva: Yup.number().min(0, 'No puede ser negativo').required('Requerido'),
    tasa_itp: Yup.number().min(0, 'No puede ser negativo').required('Requerido'),
    isr_limite: Yup.number().min(0, 'No puede ser negativo').required('Requerido'),
    isr_bajo: Yup.number().min(0, 'No puede ser negativo').required('Requerido'),
    isr_alto: Yup.number().min(0, 'No puede ser negativo').required('Requerido'),
  })
});

// --- Switch con Estilo Personalizado (sin cambios) ---
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
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent('#fff')}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15-1.1l-1.1 2.8-2.8 1.1 2.8 1.1 1.1 2.8 1.1-2.8 2.8-1.1-2.8-1.1-1.1-2.8zM8.3 16.5l-2.1-2.1 1.4-1.4 2.1 2.1-1.4 1.4z"/></svg>')`,
        },
        '& + .MuiSwitch-track': {
          opacity: 1,
          backgroundColor: theme.palette.success.main,
        },
      },
    },
    '& .MuiSwitch-thumb': {
      backgroundColor: ownerState.checked ? theme.palette.success.main : theme.palette.error.main,
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
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent('#fff')}" d="M9.4 2.1l.6 1.3.6 1.3 1.3.6 1.3.6-1.3.6-1.3.6-.6 1.3-.6 1.3-.6-1.3-.6-1.3-1.3-.6-1.3-.6 1.3-.6 1.3-.6.6-1.3.6-1.3z"/></svg>')`,
      },
    },
    '& .MuiSwitch-track': {
      opacity: 1,
      backgroundColor: theme.palette.error.main,
      borderRadius: 20 / 2,
    },
}));

const InicializarEmpresaForm = ({ initialData, onSubmit, onCancel }) => {

  const isEditing = !!initialData;

  const initialValues = {
    nombre: initialData?.nombre || '',
    nit: initialData?.nit || '',
    direccion: initialData?.direccion || '',
    email: initialData?.email || '',
    telefono: initialData?.telefono || '',
    contacto: initialData?.contacto || '',
    telefono_contacto: initialData?.telefono_contacto || '',
    estado: initialData?.estado || 'activo',
    moneda_base_id: initialData?.moneda_base_id || 'GTQ',
    config_fiscal: {
      tasa_iva: initialData?.config_fiscal?.tasa_iva || 0.12,
      tasa_itp: initialData?.config_fiscal?.tasa_itp || 0.005,
      isr_limite: initialData?.config_fiscal?.isr_limite || 30000.00,
      isr_bajo: initialData?.config_fiscal?.isr_bajo || 0.05,
      isr_alto: initialData?.config_fiscal?.isr_alto || 0.07,
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={EmpresaSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, values, setFieldValue }) => (
        <Form>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* --- SECCIÓN INFORMACIÓN GENERAL --- */}
            <Box>
              <Divider textAlign="left" sx={{ mb: 2 }}><Typography variant="h6">Información General</Typography></Divider>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <Field as={TextField} name="nombre" label="Nombre de la Empresa" fullWidth variant="outlined" error={touched.nombre && !!errors.nombre} helperText={touched.nombre && errors.nombre} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Field as={TextField} name="nit" label="NIT" fullWidth variant="outlined" error={touched.nit && !!errors.nit} helperText={touched.nit && errors.nit} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Field as={TextField} name="direccion" label="Dirección" fullWidth variant="outlined" error={touched.direccion && !!errors.direccion} helperText={touched.direccion && errors.direccion} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Field as={TextField} name="email" label="Email" fullWidth variant="outlined" error={touched.email && !!errors.email} helperText={touched.email && errors.email} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Field as={TextField} name="telefono" label="Teléfono" fullWidth variant="outlined" error={touched.telefono && !!errors.telefono} helperText={touched.telefono && errors.telefono} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Field as={TextField} name="contacto" label="Nombre del Contacto" fullWidth variant="outlined" error={touched.contacto && !!errors.contacto} helperText={touched.contacto && errors.contacto} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Field as={TextField} name="telefono_contacto" label="Teléfono del Contacto" fullWidth variant="outlined" error={touched.telefono_contacto && !!errors.telefono_contacto} helperText={touched.telefono_contacto && errors.telefono_contacto} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Field as={TextField} name="moneda_base_id" label="Moneda Base (ISO)" fullWidth variant="outlined" error={touched.moneda_base_id && !!errors.moneda_base_id} helperText={touched.moneda_base_id && errors.moneda_base_id} />
                </Grid>
                <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                      control={
                        <EstadoSwitch 
                          checked={values.estado === 'activo'} 
                          onChange={(e) => setFieldValue('estado', e.target.checked ? 'activo' : 'inactivo')}
                          ownerState={{ checked: values.estado === 'activo' }}
                        />
                      }
                      label={<Typography sx={{fontWeight: 'bold'}}>{values.estado === 'activo' ? "Activo" : "Inactivo"}</Typography>}
                    />
                    <FormHelperText>Estado</FormHelperText>
                </Grid>
              </Grid>
            </Box>

            {/* --- SECCIÓN CONFIGURACIÓN FISCAL --- */}
            <Box sx={{ mt: 2 }}>
              <Divider textAlign="left" sx={{ mb: 2 }}><Typography variant="h6">Configuración Fiscal</Typography></Divider>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <Field as={TextField} name="config_fiscal.tasa_iva" label="Tasa IVA" type="number" fullWidth variant="outlined" error={touched.config_fiscal?.tasa_iva && !!errors.config_fiscal?.tasa_iva} helperText={touched.config_fiscal?.tasa_iva && errors.config_fiscal?.tasa_iva} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Field as={TextField} name="config_fiscal.tasa_itp" label="Tasa ITP" type="number" fullWidth variant="outlined" error={touched.config_fiscal?.tasa_itp && !!errors.config_fiscal?.tasa_itp} helperText={touched.config_fiscal?.tasa_itp && errors.config_fiscal?.tasa_itp} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Field as={TextField} name="config_fiscal.isr_limite" label="Límite ISR" type="number" fullWidth variant="outlined" error={touched.config_fiscal?.isr_limite && !!errors.config_fiscal?.isr_limite} helperText={touched.config_fiscal?.isr_limite && errors.config_fiscal?.isr_limite} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Field as={TextField} name="config_fiscal.isr_bajo" label="% ISR (Renta <= Límite)" type="number" fullWidth variant="outlined" error={touched.config_fiscal?.isr_bajo && !!errors.config_fiscal?.isr_bajo} helperText={touched.config_fiscal?.isr_bajo && errors.config_fiscal?.isr_bajo} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Field as={TextField} name="config_fiscal.isr_alto" label="% ISR (Renta > Límite)" type="number" fullWidth variant="outlined" error={touched.config_fiscal?.isr_alto && !!errors.config_fiscal?.isr_alto} helperText={touched.config_fiscal?.isr_alto && errors.config_fiscal?.isr_alto} />
                </Grid>
              </Grid>
            </Box>

            {/* --- BOTONES DE ACCIÓN --- */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button 
                variant="outlined"
                color="error"
                onClick={onCancel} 
                sx={{ mr: 2 }} 
                startIcon={<CancelIcon />}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="success" 
                disabled={isSubmitting}
                startIcon={<SaveIcon />}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'Actualizar' : 'Grabar')}
              </Button>
            </Box>
          </Box>
        </Form>
      )}
    </Formik>
  );
};

export default InicializarEmpresaForm;
