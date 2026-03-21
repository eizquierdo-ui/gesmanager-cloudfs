
import React from 'react';
import { Modal, Box, Typography, Button, Paper, Grid, Table, TableContainer, TableBody, TableCell, TableHead, TableRow, Divider } from '@mui/material';
import { addDays, format, isValid } from 'date-fns';
import es from 'date-fns/locale/es';
import CheckIcon from '@mui/icons-material/Check';

const formatCurrency = (value, currency = 'Q.') => {
  const number = parseFloat(value) || 0;
  return `${currency} ${number.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getSafeDate = (timestamp) => {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === 'function') return timestamp.toDate();
    if (timestamp._seconds !== undefined) return new Date(timestamp._seconds * 1000);
    const date = new Date(timestamp);
    return isValid(date) ? date : null;
};

const formatDate = (date) => {
    const safeDate = getSafeDate(date);
    if (!safeDate) return 'N/A';
    return format(safeDate, 'dd/MM/yyyy', { locale: es });
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '95%',
  maxWidth: '1200px', // Aumentado para dar espacio a nuevas columnas
  bgcolor: 'background.paper',
  border: '1px solid #ddd',
  boxShadow: 24,
  p: 3,
  maxHeight: '95vh',
  overflowY: 'auto',
  fontSize: '0.8rem'
};

const TotalRow = ({ label, value, isHighlighted = false, isRed = false }) => (
    <Grid container justifyContent="space-between" alignItems="center" sx={{ p: 0.5, backgroundColor: isHighlighted ? 'grey.200' : 'transparent', borderRadius: '4px' }}>
        <Grid item>
            <Typography variant="body2" sx={{ fontWeight: isHighlighted ? 'bold' : 500 }}>{label}</Typography>
        </Grid>
        <Grid item>
            <Typography variant="body2" sx={{ fontWeight: isHighlighted ? 'bold' : 500, color: isRed ? 'red' : 'inherit', textAlign: 'right' }}>{value}</Typography>
        </Grid>
    </Grid>
);

const CotizacionDetalleModal = ({ open, onClose, cotizacion, onCopy, onPrint }) => {
  if (!cotizacion) return null;

  const {
    numero_cotizacion,
    fecha_emision,
    dias_vigencia,
    cliente_snapshot = {},
    items = [],
    totales = {},
    terminos_y_condiciones = '',
    forma_pago = '',
    financiero_snapshot = { tasa_compra: 1 }
  } = cotizacion;

  const safeFechaEmision = getSafeDate(fecha_emision);
  const fechaVigencia = safeFechaEmision && dias_vigencia ? addDays(safeFechaEmision, dias_vigencia) : null;
  
  const totalEnDolares = (totales.total_cotizacion_final || 0) / (financiero_snapshot?.tasa_compra || 1);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>Cotización</Typography>
            <Box>
                <Button variant="contained" color="secondary" onClick={onCopy} sx={{ mr: 1 }}>Copiar</Button>
                <Button variant="contained" color="primary" onClick={onPrint} sx={{ mr: 1 }}>Imprimir</Button>
                <Button variant="outlined" color="inherit" onClick={onClose}>Regresar</Button>
            </Box>
        </Box>
        
        <Paper variant="outlined" sx={{ p: 2, mb: 2, fontSize: '0.85rem' }}>
            <Grid container spacing={1}>
                <Grid item xs={12}><Typography><strong>{numero_cotizacion}</strong></Typography></Grid>
                <Grid item xs={12}><Typography><strong>Fecha:</strong> {formatDate(fecha_emision)}</Typography></Grid>
                <Grid item xs={12}><Typography><strong>Válida hasta:</strong> {fechaVigencia ? format(fechaVigencia, 'dd/MM/yyyy', { locale: es }) : 'N/A'}</Typography></Grid>
                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                <Grid item xs={12}><Typography><strong>Cliente:</strong> {cliente_snapshot.nombre_cliente}</Typography></Grid>
                <Grid item xs={12}><Typography><strong>NIT:</strong> {cliente_snapshot.nit_cliente}</Typography></Grid>
                <Grid item xs={12}><Typography><strong>Dirección:</strong> {cliente_snapshot.direccion_cliente}</Typography></Grid>
                <Grid item xs={12}><Typography><strong>Email:</strong> {cliente_snapshot.email_cliente}</Typography></Grid>
                <Grid item xs={12}><Typography><strong>Contacto:</strong> {cliente_snapshot.contacto_principal?.nombre} / <strong>Teléfono:</strong> {cliente_snapshot.contacto_principal?.telefono}</Typography></Grid>
            </Grid>
        </Paper>

        <Typography variant="body1" sx={{mb: 1}}>A continuación encontrará la propuesta de servicios:</Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="detalle de cotizacion">
            {/* --- CABECERA DE TABLA CORREGIDA --- */}
            <TableHead sx={{ backgroundColor: 'grey.200' }}>
              <TableRow>
                <TableCell>ITP</TableCell>
                <TableCell>Cantidad</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Descripción</TableCell>
                <TableCell align="right">Precio Venta</TableCell>
                <TableCell align="right">% Desc.</TableCell>
                <TableCell align="right">Monto Desc.</TableCell>
                <TableCell align="right">Venta Final</TableCell>
                <TableCell align="right">Total Q.</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* --- FILAS DE TABLA CORREGIDAS CON CAMPOS CORRECTOS --- */}
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.itp_servicio ? <CheckIcon fontSize="small" /> : ''}</TableCell>
                  <TableCell>{item.cantidad}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.nombre_servicio}</Typography>
                    <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap' }}>{item.descripcion}</Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(item.precio_venta_base_linea)}</TableCell>
                  <TableCell align="right">{`${(item.tasa_descuento_aplicada || 0).toFixed(2)}%`}</TableCell>
                  <TableCell align="right">{formatCurrency(item.total_descuento_aplicado_linea)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.precio_venta_final_linea)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.total_linea)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2, mt: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Términos y Condiciones / Notas:</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{terminos_y_condiciones}</Typography>
                <Box sx={{mt: 2}}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Información de Pago:</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>{forma_pago}</Typography>
                </Box>
            </Box>

            <Box sx={{ flexShrink: 0, width: { xs: '100%', md: '320px' } }}>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                    <TotalRow label="Total base sin descuento:" value={formatCurrency(totales.total_cotizacion_base || 0)} />
                    <TotalRow label="(-) Total Descuento:" value={formatCurrency(totales.descuento_total || 0)} isRed />
                    <TotalRow label="TOTAL COTIZACIÓN:" value={formatCurrency(totales.total_cotizacion_final || 0)} isHighlighted />
                    <TotalRow label="(-) Total IVA:" value={formatCurrency(totales.monto_iva_total || 0)} isRed />
                    <TotalRow label="SubTotal:" value={formatCurrency(totales.sub_total_sin_iva || 0)} />
                    
                    {/* --- SECCIÓN DE TIMBRE DE PRENSA CORREGIDA --- */}
                    <Divider sx={{ my: 1 }} />
                    <TotalRow label="Sub Total TP:" value={formatCurrency(totales.sub_total_base_tp || 0)} />
                    <TotalRow label="(-) Timbre Prensa:" value={formatCurrency(totales.monto_tp_total || 0)} isRed />

                    <Divider sx={{ my: 1 }} />
                    <TotalRow label="TOTAL EN:" value={formatCurrency(totalEnDolares, '$.')} />
                </Paper>
            </Box>
        </Box>

      </Box>
    </Modal>
  );
};

export default CotizacionDetalleModal;
