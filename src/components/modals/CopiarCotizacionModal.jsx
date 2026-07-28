import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField, Divider, Grid, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CancelIcon from '@mui/icons-material/Cancel';
import BuscarClienteModal from './BuscarClienteModal';

const CopiarCotizacionModal = ({ open, onClose, onConfirmCopy, cotizacionActual, proximaCotizacion }) => {
  const [isBuscarClienteOpen, setIsBuscarClienteOpen] = useState(false);
  const [clienteDestino, setClienteDestino] = useState(null);

  React.useEffect(() => {
    if (open) {
      if (cotizacionActual && cotizacionActual.cliente_snapshot) {
        setClienteDestino({
          ...cotizacionActual.cliente_snapshot,
          id: cotizacionActual.cliente_id
        });
      } else {
        setClienteDestino(null);
      }
    }
  }, [open, cotizacionActual]);

  const handleSelectCliente = (cliente) => {
    setClienteDestino(cliente);
    setIsBuscarClienteOpen(false);
  };

  const handleCopiar = () => {
    if (clienteDestino) {
      onConfirmCopy(clienteDestino);
    }
  };

  if (!cotizacionActual) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#2e7d32', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ContentCopyIcon /> Copiar Cotización
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Cotización Origen
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={3}>
              <TextField
                label="No. Cotización"
                value={cotizacionActual.numero_cotizacion || ''}
                fullWidth
                size="small"
                InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="NIT Cliente"
                value={cotizacionActual.cliente_snapshot?.nit_cliente || ''}
                fullWidth
                size="small"
                InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Nombre Cliente"
                value={cotizacionActual.cliente_snapshot?.nombre_cliente || ''}
                fullWidth
                size="small"
                InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Nueva Cotización
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={() => setIsBuscarClienteOpen(true)}
              size="small"
            >
              Buscar Cliente
            </Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <TextField
                label="Nuevo No."
                value={proximaCotizacion || '(Siguiente)'}
                fullWidth
                size="small"
                InputProps={{ readOnly: true, style: { backgroundColor: '#e8f5e9', fontWeight: 'bold' } }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="NIT Nuevo Cliente"
                value={clienteDestino?.nit_cliente || ''}
                fullWidth
                size="small"
                placeholder="-"
                InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Nombre Nuevo Cliente"
                value={clienteDestino?.nombre_cliente || ''}
                fullWidth
                size="small"
                placeholder="Seleccione un cliente..."
                InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="error" startIcon={<CancelIcon />} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleCopiar}
            color="success"
            variant="contained"
            startIcon={<ContentCopyIcon />}
            disabled={!clienteDestino}
          >
            Copiar a Formulario
          </Button>
        </DialogActions>
      </Dialog>
      <BuscarClienteModal
        open={isBuscarClienteOpen}
        onClose={() => setIsBuscarClienteOpen(false)}
        onSelect={handleSelectCliente}
      />
    </>
  );
};

export default CopiarCotizacionModal;
