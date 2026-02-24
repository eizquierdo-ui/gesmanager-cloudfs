import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, TextField, IconButton, Checkbox, TextareaAutosize, Typography
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

const ItemsTable = ({ items, handleItemChange, handleDeleteItem, simboloMoneda }) => {

  const renderItemRow = (item, index) => {
    return (
      <TableRow key={item.id_temporal}>
        <TableCell padding="checkbox">
          <Checkbox 
            checked={item.itp_servicio || false} 
            onChange={(e) => handleItemChange(index, 'itp_servicio', e.target.checked)}
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {item.nombre_servicio || 'Servicio sin nombre'}
          </Typography>
          <StyledTextarea
            minRows={2}
            value={item.detalle_queincluyeservicio}
            onChange={(e) => handleItemChange(index, 'detalle_queincluyeservicio', e.target.value)}
          />
        </TableCell>
        <TableCell align="right">
          <TextField
            type="number"
            name="cantidad"
            value={item.cantidad}
            onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
            size="small"
            inputProps={{ style: { textAlign: 'right' }, min: 1 }}
            sx={{ width: '80px' }}
          />
        </TableCell>
        <TableCell align="right">
          <TextField
            type="number"
            name="tasa_descuento_aplicada"
            value={item.tasa_descuento_aplicada} 
            onChange={(e) => handleItemChange(index, 'tasa_descuento_aplicada', e.target.value)}
            size="small"
            inputProps={{ style: { textAlign: 'right' }, min: 0, max: 100, step: "0.01" }}
             sx={{ width: '80px' }}
          />
        </TableCell>
        <TableCell align="right">
          <TextField
            type="number"
            name="precio_venta_final_linea"
            value={item.precio_venta_final_linea}
            onChange={(e) => handleItemChange(index, 'precio_venta_final_linea', e.target.value)}
            size="small"
            InputProps={{
                startAdornment: <span style={{ marginRight: '4px' }}>{simboloMoneda}</span>,
                inputProps: { style: { textAlign: 'right' }, min: 0, step: "0.01" }
            }}
             sx={{ width: '120px' }}
          />
        </TableCell>
        <TableCell align="right">
          {/* CORRECCIÓN: Aumentar tamaño y poner en negrita */}
          <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '14px' }}>
            {`${simboloMoneda} ${(parseFloat(item.total_linea) || 0).toFixed(2)}`}
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
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', width: '5%' }}>ITP</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>SERVICIO + DESCRIPCIÓN</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '10%' }} align="right">CANTIDAD</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '10%' }} align="right">% DESC.</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '15%' }} align="right">PRECIO VENTA</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '10%' }} align="right">TOTAL VENTA</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: '10%' }} align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">No se han agregado detalles a la cotización</TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => renderItemRow(item, index))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ItemsTable;
