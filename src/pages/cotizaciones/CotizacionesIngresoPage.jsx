import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, TextField, Button, Grid, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import es from 'date-fns/locale/es'; // Importar el locale en español

const CotizacionesIngresoPage = () => {
  const [fechaEmision, setFechaEmision] = useState(new Date());
  const [diasVigencia, setDiasVigencia] = useState(8);
  const [fechaVigencia, setFechaVigencia] = useState('');

  // Efecto para calcular la fecha de vigencia
  useEffect(() => {
    if (fechaEmision && diasVigencia > 0) {
      const resultDate = new Date(fechaEmision);
      resultDate.setDate(resultDate.getDate() + parseInt(diasVigencia, 10));
      
      // Formatear la fecha a dd/MM/yyyy
      const formattedDate = resultDate.toLocaleDateString('es-GT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      setFechaVigencia(formattedDate);
    } else {
      setFechaVigencia('');
    }
  }, [fechaEmision, diasVigencia]);


  // Estilo común para los labels de los TextField
  const inputLabelProps = {
    style: { fontSize: '12px' },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth={false} sx={{ mt: 2, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Ingreso y Modificación de Cotizaciones
        </Typography>

        {/* --- SECCIÓN 1: Información de la Cotización --- */}
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '14px' }}>
                Sección de Información de la Cotización
            </Typography>
            <Button variant="contained" color="primary" startIcon={<SearchIcon />} size="small">
                Buscar Cotización
            </Button>
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                label="No. Cotización"
                variant="outlined"
                fullWidth
                size="small"
                InputLabelProps={inputLabelProps}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Fecha Emisión"
                value={fechaEmision}
                onChange={(newValue) => setFechaEmision(newValue)}
                format="dd/MM/yyyy"
                slotProps={{ 
                  textField: { 
                    size: 'small', 
                    fullWidth: true, // <-- LA PROPIEDAD CORRECTA EN EL LUGAR CORRECTO
                    InputLabelProps: inputLabelProps 
                  } 
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Días de Vigencia"
                variant="outlined"
                fullWidth
                size="small"
                type="number"
                value={diasVigencia}
                onChange={(e) => setDiasVigencia(e.target.value)}
                InputLabelProps={inputLabelProps}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Fecha Vigencia"
                value={fechaVigencia}
                variant="outlined"
                fullWidth
                size="small"
                InputLabelProps={inputLabelProps}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip label="Borrador" color="primary" sx={{fontSize: '11px', width:'100%'}}/>
            </Grid>
          </Grid>
        </Paper>

        {/* --- SECCIÓN 2: Información del Cliente --- */}
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '14px' }}>
              Sección de Información del Cliente
            </Typography>
            <Button variant="contained" startIcon={<SearchIcon />} size="small">
              Buscar Cliente
            </Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField label="Nombre Cliente" variant="outlined" fullWidth size="small" InputLabelProps={inputLabelProps} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="NIT Cliente" variant="outlined" fullWidth size="small" InputLabelProps={inputLabelProps} InputProps={{ readOnly: true }}/>
            </Grid>
             <Grid item xs={12} md={4}>
              <TextField label="Teléfono Cliente" variant="outlined" fullWidth size="small" InputLabelProps={inputLabelProps} InputProps={{ readOnly: true }}/>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Dirección Cliente" variant="outlined" fullWidth size="small" InputLabelProps={inputLabelProps} InputProps={{ readOnly: true }}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Contacto Principal" variant="outlined" fullWidth size="small" InputLabelProps={inputLabelProps} InputProps={{ readOnly: true }}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Email Cliente" variant="outlined" fullWidth size="small" InputLabelProps={inputLabelProps} InputProps={{ readOnly: true }}/>
            </Grid>
          </Grid>
        </Paper>

      </Container>
    </LocalizationProvider>
  );
};

export default CotizacionesIngresoPage;
