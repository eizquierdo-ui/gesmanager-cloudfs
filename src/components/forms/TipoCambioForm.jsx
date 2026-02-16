
import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  TextField,
  Button,
  Grid,
  Box,
  CircularProgress,
  MenuItem,
  InputAdornment,
  Divider,
  Typography
} from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';

// --- Helper para formatear la fecha a YYYY-MM-DD ---
const formatDateForInput = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Esquema de Validación ---
const TipoCambioSchema = Yup.object().shape({
  fecha: Yup.date()
    .required('La fecha es obligatoria')
    .typeError('Debe ser una fecha válida'),
  moneda_base_id: Yup.string()
    .required('La moneda de origen es obligatoria'),
  moneda_destino_id: Yup.string()
    .required('La moneda de destino es obligatoria')
    .notOneOf([Yup.ref('moneda_base_id')], 'La moneda de destino no puede ser igual a la de origen'),
  tasa_compra: Yup.number()
    .min(0.0001, 'La tasa debe ser mayor que cero')
    .required('La tasa de compra es obligatoria')
    .typeError('Debe ser un número'),
  tasa_venta: Yup.number()
    .min(0.0001, 'La tasa debe ser mayor que cero')
    .required('La tasa de venta es obligatoria')
    .typeError('Debe ser un número'),
});

const TipoCambioForm = ({ initialData, monedas, onSubmit, onCancel }) => {

  const isEditing = !!initialData;

  const initialValues = {
    fecha: initialData?.fecha ? formatDateForInput(initialData.fecha) : formatDateForInput(new Date()),
    moneda_base_id: initialData?.moneda_base_id || '',
    moneda_destino_id: initialData?.moneda_destino_id || '',
    tasa_compra: initialData?.tasa_compra || '',
    tasa_venta: initialData?.tasa_venta || '',
  };

  const handleFormSubmit = (values, actions) => {
      const submissionData = {
          ...values,
          fecha: new Date(values.fecha + 'T00:00:00-06:00') 
      };
      onSubmit(submissionData, actions);
  };

  return (
      <Formik
        initialValues={initialValues}
        validationSchema={TipoCambioSchema}
        onSubmit={handleFormSubmit}
        enableReinitialize
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                   <Field
                        as={TextField}
                        name="fecha"
                        label="Fecha del Tipo de Cambio"
                        type="date"
                        fullWidth
                        variant="outlined"
                        error={touched.fecha && !!errors.fecha}
                        helperText={touched.fecha && errors.fecha}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>

                <Grid item xs={12}><Divider sx={{mt: 1}}><Typography variant="caption">Monedas</Typography></Divider></Grid>

                <Grid item xs={12} sm={6}>
                  <Field
                    as={TextField}
                    select
                    name="moneda_base_id"
                    label="Moneda de Origen"
                    fullWidth
                    variant="outlined"
                    error={touched.moneda_base_id && !!errors.moneda_base_id}
                    helperText={touched.moneda_base_id && errors.moneda_base_id}
                  >
                    <MenuItem value="" disabled><em>Seleccione una moneda</em></MenuItem>
                    {monedas.map((moneda) => (
                      <MenuItem key={moneda.id} value={moneda.id}>
                        {moneda.codigo} - {moneda.moneda}
                      </MenuItem>
                    ))}
                  </Field>
                </Grid>
                <Grid item xs={12} sm={6}>
                   <Field
                    as={TextField}
                    select
                    name="moneda_destino_id"
                    label="Moneda de Destino"
                    fullWidth
                    variant="outlined"
                    error={touched.moneda_destino_id && !!errors.moneda_destino_id}
                    helperText={touched.moneda_destino_id && errors.moneda_destino_id}
                  >
                    <MenuItem value="" disabled><em>Seleccione una moneda</em></MenuItem>
                    {monedas.map((moneda) => (
                      <MenuItem key={moneda.id} value={moneda.id}>
                        {moneda.codigo} - {moneda.moneda}
                      </MenuItem>
                    ))}
                  </Field>
                </Grid>

                <Grid item xs={12}><Divider sx={{mt: 1}}><Typography variant="caption">Tasas de Intercambio</Typography></Divider></Grid>

                {/* --- CAMPOS SIN SÍMBOLO DE MONEDA --- */}
                <Grid item xs={12} sm={6}>
                  <Field 
                    as={TextField}
                    name="tasa_compra"
                    label="Tasa de Compra"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={touched.tasa_compra && !!errors.tasa_compra}
                    helperText={touched.tasa_compra && errors.tasa_compra}
                    inputProps={{ step: "0.0001" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field 
                    as={TextField}
                    name="tasa_venta"
                    label="Tasa de Venta"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={touched.tasa_venta && !!errors.tasa_venta}
                    helperText={touched.tasa_venta && errors.tasa_venta}
                    inputProps={{ step: "0.0001" }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button variant="outlined" color="error" onClick={onCancel} sx={{ mr: 2 }} startIcon={<CancelIcon />}>
                  CANCELAR
                </Button>
                <Button type="submit" variant="contained" color="success" disabled={isSubmitting} startIcon={<SaveIcon />}>
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'ACTUALIZAR' : 'GRABAR')}
                </Button>
              </Box>
            </Box>
          </Form>
        )}
      </Formik>
  );
};

export default TipoCambioForm;
