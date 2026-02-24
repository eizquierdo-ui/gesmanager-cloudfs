
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, IconButton, Checkbox, TextareaAutosize, Typography, TableFooter
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/system';

const StyledTextarea = styled(TextareaAutosize)(() => ({
  width: '100%',
  padding: '8px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  resize: 'vertical',
  minHeight: '32px',
  backgroundColor: 'transparent',
  '&:focus': {
    outline: 'none',
    borderColor: '#1976d2',
  },
}));

const ItemsTable = ({ items, handleItemChange, handleDeleteItem, simboloMoneda, formatCurrency, totales }) => {

  const handleInputChange = (index, field, value) => {
    // Pasa el valor (que puede tener comas) directamente al manejador principal
    handleItemChange(index, field, value);
  };

  const renderItemRow = (item, index) => {
    return (
      <TableRow key={item.id_temporal}>
        <TableCell padding="checkbox">
          <Checkbox
            checked={item.itp_servicio || false}
            onChange={(e) => handleItemChange(index, 'itp_servicio', e.target.checked)}
          />
        </TableCell>
        <TableCell sx={{ minWidth: 300 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {item.nombre_servicio || 'Servicio sin nombre'}
          </Typography>
          <StyledTextarea
            minRows={1}
            value={item.detalle_queincluyeservicio}
            onChange={(e) => handleItemChange(index, 'detalle_queincluyeservicio', e.target.value)}
          />
        </TableCell>
        <TableCell align="right">
          <TextField
            type="text" 
            value={item.cantidad}
            onChange={(e) => handleInputChange(index, 'cantidad', e.target.value)}
            size="small"
            inputProps={{ style: { textAlign: 'right' } }}
            sx={{ width: '80px' }}
          />
        </TableCell>
        <TableCell align="right">
          <TextField
            type="text" 
            value={item.tasa_descuento_aplicada}
            onChange={(e) => handleInputChange(index, 'tasa_descuento_aplicada', e.target.value)}
            size="small"
            inputProps={{ style: { textAlign: 'right' } }}
            sx={{ width: '120px' }}
          />
        </TableCell>
        <TableCell align="right">
           <Typography variant="body2">
            {formatCurrency(item.total_descuento_aplicado_linea, simboloMoneda)}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <TextField
            type="text"
            value={item.precio_venta_final_linea}
            onChange={(e) => handleInputChange(index, 'precio_venta_final_linea', e.target.value)}
            size="small"
            InputProps={{
                startAdornment: <span style={{ marginRight: '4px' }}>{simboloMoneda}</span>,
                inputProps: { style: { textAlign: 'right' } }
            }}
             sx={{ width: '180px' }}
          />
        </TableCell>
        <TableCell align="right">
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {formatCurrency(item.total_linea, simboloMoneda)}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <IconButton onClick={() => handleDeleteItem(index)} color="error">
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="detalle de cotizacion">
        <TableHead>
          <TableRow sx={{ '& > th': { fontWeight: 'bold' } }}>
            <TableCell sx={{ width: '5%' }}>ITP</TableCell>
            <TableCell sx={{ width: '35%' }}>SERVICIO + DESCRIPCIÓN</TableCell>
            <TableCell sx={{ width: '8%' }} align="right">CANTIDAD</TableCell>
            <TableCell sx={{ width: '12%' }} align="right">% DESC.</TableCell>
            <TableCell sx={{ width: '12%' }} align="right">MONTO DESC.</TableCell>
            <TableCell sx={{ width: '15%' }} align="right">PRECIO VENTA</TableCell>
            <TableCell sx={{ width: '10%' }} align="right">TOTAL VENTA</TableCell>
            <TableCell sx={{ width: '5%' }} align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">No se han agregado detalles a la cotización</TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => renderItemRow(item, index))
          )}
        </TableBody>
        <TableFooter>
            <TableRow sx={{ '& > td': { fontWeight: 'bold', fontSize: '1.0rem' } }}>
                <TableCell colSpan={4} />
                <TableCell align="right">
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(totales.total_descuento_aplicado, simboloMoneda)}
                    </Typography>
                </TableCell>
                <TableCell />
                <TableCell align="right">
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(totales.total_cotizacion_final, simboloMoneda)}
                    </Typography>
                </TableCell>
                <TableCell />
            </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default ItemsTable;
