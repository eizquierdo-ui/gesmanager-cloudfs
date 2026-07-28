import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box 
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const ConfirmarFechaEstadoModal = ({ open, onClose, onConfirm, estadoDestino }) => {
  const [fecha, setFecha] = useState(new Date());

  useEffect(() => {
    if (open) {
      setFecha(new Date());
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(fecha);
  };

  const getMensaje = () => {
    switch (estadoDestino) {
      case 'aceptada': return '¿En qué fecha fue aceptada la cotización?';
      case 'rechazada': return '¿En qué fecha fue rechazada la cotización?';
      case 'venta': return '¿En qué fecha se completó la venta/facturación?';
      case 'anulada': return '¿En qué fecha se anuló la cotización?';
      default: return 'Seleccione la fecha para este cambio de estado:';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Confirmar Fecha</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            {getMensaje()}
          </Typography>
        </Box>
        <DatePicker
          label="Fecha"
          value={fecha}
          onChange={(newValue) => setFecha(newValue)}
          slotProps={{ textField: { fullWidth: true } }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmarFechaEstadoModal;
