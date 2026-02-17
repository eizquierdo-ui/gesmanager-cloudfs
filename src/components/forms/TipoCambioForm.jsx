import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  MenuItem,
  Divider,
  Typography
} from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';

// --- Helpers para Formato de Fechas ---
const formatDateForInput = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate();
  return d.toISOString().split('T')[0]; // Formato YYYY-MM-DD
};

const formatAuditDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('es-GT', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    }).format(date);
};

// --- Esquema de Validación ---
const TipoCambioSchema = Yup.object().shape({
  fecha: Yup.date().required('La fecha es obligatoria').typeError('Debe ser una fecha válida'),
  moneda_base_id: Yup.string().required('La moneda de origen es obligatoria'),
  moneda_destino_id: Yup.string().required('La moneda de destino es obligatoria').notOneOf([Yup.ref('moneda_base_id')], 'Las monedas no pueden ser iguales'),
  tasa_compra: Yup.number().min(0.0001, 'La tasa debe ser > 0').required('La tasa de compra es obligatoria').typeError('Debe ser un número'),
  tasa_venta: Yup.number().min(0.0001, 'La tasa debe ser > 0').required('La tasa de venta es obligatoria').typeError('Debe ser un número'),
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
          fecha: new Date(values.fecha + 'T00:00:00-06:00'),
          tasa_compra: parseFloat(values.tasa_compra),
          tasa_venta: parseFloat(values.tasa_venta)
      };
      onSubmit(submissionData, actions);
  };

  return (
      <Formik initialValues={initialValues} validationSchema={TipoCambioSchema} onSubmit={handleFormSubmit} enableReinitialize>
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 3 }}>

                {/* Fila 1: Fecha */}
                <Field
                    as={TextField}
                    name="fecha"
                    label="Fecha"
                    type="date"
                    fullWidth
                    variant="outlined"
                    error={touched.fecha && !!errors.fecha}
                    helperText={touched.fecha && errors.fecha}
                    InputLabelProps={{ shrink: true }}
                />

                {/* Fila 2: Monedas */}
                <Divider sx={{ mt: 1}}><Typography variant="caption">MONEDAS</Typography></Divider>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ width: '50%' }}>
                        <Field as={TextField} select name="moneda_base_id" label="Moneda Origen" fullWidth variant="outlined" error={touched.moneda_base_id && !!errors.moneda_base_id} helperText={touched.moneda_base_id && errors.moneda_base_id}>
                            <MenuItem value="" disabled><em>Seleccione moneda</em></MenuItem>
                            {monedas.map((m) => (<MenuItem key={m.id} value={m.id}>{`${m.codigo} - ${m.moneda}`}</MenuItem>))}
                        </Field>
                    </Box>
                    <Box sx={{ width: '50%' }}>
                        <Field as={TextField} select name="moneda_destino_id" label="Moneda Destino" fullWidth variant="outlined" error={touched.moneda_destino_id && !!errors.moneda_destino_id} helperText={touched.moneda_destino_id && errors.moneda_destino_id}>
                            <MenuItem value="" disabled><em>Seleccione moneda</em></MenuItem>
                            {monedas.map((m) => (<MenuItem key={m.id} value={m.id}>{`${m.codigo} - ${m.moneda}`}</MenuItem>))}
                        </Field>
                    </Box>
                </Box>

                {/* Fila 3: Tipo de Cambio */}
                <Divider sx={{ mt: 1 }}><Typography variant="caption">TIPO DE CAMBIO</Typography></Divider>
                 <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ width: '50%' }}>
                        <Field as={TextField} name="tasa_compra" label="Tasa Compra" type="number" fullWidth variant="outlined" error={touched.tasa_compra && !!errors.tasa_compra} helperText={touched.tasa_compra && errors.tasa_compra} inputProps={{ step: "0.0001" }} />
                    </Box>
                     <Box sx={{ width: '50%' }}>
                        <Field as={TextField} name="tasa_venta" label="Tasa Venta" type="number" fullWidth variant="outlined" error={touched.tasa_venta && !!errors.tasa_venta} helperText={touched.tasa_venta && errors.tasa_venta} inputProps={{ step: "0.0001" }} />
                    </Box>
                </Box>

              {isEditing && initialData && (
                <Box sx={{ mt: 2, p: 1, border: '1px dashed #ccc', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
                    <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>Creado: {formatAuditDate(initialData.fecha_creacion)} por <strong>{initialData.usuario_creo || 'N/A'}</strong></Typography>
                    <Typography variant="caption" display="block">Modificado: {formatAuditDate(initialData.fecha_ultima_actualizacion)} por <strong>{initialData.usuario_ultima_modificacion || 'N/A'}</strong></Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button variant="outlined" color="error" onClick={onCancel} sx={{ mr: 2 }} startIcon={<CancelIcon />}>CANCELAR</Button>
                <Button type="submit" variant="contained" color="success" disabled={isSubmitting} startIcon={<SaveIcon />}>{isSubmitting ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'ACTUALIZAR' : 'GRABAR')}</Button>
              </Box>
            </Box>
          </Form>
        )}
      </Formik>
  );
};

export default TipoCambioForm;
