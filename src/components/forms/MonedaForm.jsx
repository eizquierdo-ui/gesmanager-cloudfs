
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
  FormHelperText
} from '@mui/material';
import { styled } from '@mui/material/styles';

import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';

// --- Esquema de Validación para Monedas ---
const MonedaSchema = Yup.object().shape({
  codigo: Yup.string()
    .length(3, 'El código debe tener exactamente 3 caracteres (ej. GTQ)')
    .required('El código es obligatorio'),
  moneda: Yup.string()
    .min(3, 'El nombre de la moneda es muy corto')
    .required('El nombre de la moneda es obligatorio'),
  simbolo: Yup.string()
    .max(5, 'El símbolo es muy largo')
    .required('El símbolo es obligatorio'),
  estado: Yup.string(),
});

// --- Switch con Estilo Personalizado (reutilizado de EmpresaForm) ---
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
        '& + .MuiSwitch-track': {
          opacity: 1,
          backgroundColor: theme.palette.success.main,
        },
      },
    },
    '& .MuiSwitch-thumb': {
      backgroundColor: ownerState.checked ? theme.palette.success.light : theme.palette.error.light,
      width: 32,
      height: 32,
    },
    '& .MuiSwitch-track': {
      opacity: 1,
      backgroundColor: theme.palette.grey[400],
      borderRadius: 20 / 2,
    },
}));

const MonedaForm = ({ initialData, onSubmit, onCancel }) => {

  const isEditing = !!initialData;

  const initialValues = {
    codigo: initialData?.codigo || '',
    moneda: initialData?.moneda || '',
    simbolo: initialData?.simbolo || '',
    estado: initialData?.estado || 'activo',
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={MonedaSchema}
      onSubmit={onSubmit}
      enableReinitialize // Permite que el formulario se actualice con nuevos initialData
    >
      {({ errors, touched, isSubmitting, values, setFieldValue }) => (
        <Form>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                  <Field 
                    as={TextField} 
                    name="codigo" 
                    label="Código (ISO)" 
                    fullWidth 
                    variant="outlined" 
                    error={touched.codigo && !!errors.codigo} 
                    helperText={touched.codigo && errors.codigo} 
                    InputProps={{ style: { textTransform: 'uppercase' } }}
                  />
              </Grid>
              <Grid item xs={12} sm={8}>
                  <Field 
                    as={TextField} 
                    name="moneda" 
                    label="Nombre de la Moneda" 
                    fullWidth 
                    variant="outlined" 
                    error={touched.moneda && !!errors.moneda} 
                    helperText={touched.moneda && errors.moneda} 
                  />
              </Grid>
              <Grid item xs={12} sm={4}>
                  <Field 
                    as={TextField} 
                    name="simbolo" 
                    label="Símbolo" 
                    fullWidth 
                    variant="outlined" 
                    error={touched.simbolo && !!errors.simbolo} 
                    helperText={touched.simbolo && errors.simbolo} 
                  />
              </Grid>
              <Grid item xs={12} sm={8} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                    control={
                      <EstadoSwitch 
                        checked={values.estado === 'activo'} 
                        onChange={(e) => setFieldValue('estado', e.target.checked ? 'activo' : 'inactivo')}
                        ownerState={{ checked: values.estado === 'activo' }}
                      />
                    }
                    label={<Typography sx={{fontWeight: 'bold'}}>{values.estado === 'activo' ? "Activa" : "Inactiva"}</Typography>}
                  />
                  <FormHelperText>Estado de la moneda</FormHelperText>
              </Grid>
            </Grid>

            {/* --- BOTONES DE ACCIÓN --- */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
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

export default MonedaForm;
