import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, TextField, Button, Grid, Chip,
  FormControlLabel, Checkbox, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import es from 'date-fns/locale/es';

// --- Hooks y Contextos ---
import { useAppContext } from '../../contexts/AppContext';

// --- Importaciones de Firebase ---
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';

// --- Modales ---
import BuscarClienteModal from '../../components/modals/BuscarClienteModal';
import BuscarTipoCambioModal from '../../components/modals/BuscarTipoCambioModal';

const CotizacionesIngresoPage = () => {
  // --- STATE MANAGEMENT ---
  const { sessionData } = useAppContext(); // <-- Se obtiene la sesión

  const [ultimaCotizacion, setUltimaCotizacion] = useState('2026-0000');
  const [proximaCotizacion, setProximaCotizacion] = useState('2026-0001');
  const [fechaEmision, setFechaEmision] = useState(new Date());
  const [diasVigencia, setDiasVigencia] = useState(8);
  const [fechaVigencia, setFechaVigencia] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isTipoCambioModalOpen, setIsTipoCambioModalOpen] = useState(false);
  const [items, setItems] = useState([]);

  // PASO 1: Limpiar el estado inicial
  const [financieroSnapshot, setFinancieroSnapshot] = useState({
    tipocambio_id: '',
    moneda_base_id: '',
    simbolo_moneda_base: '',      // <-- CORREGIDO: sin valor quemado
    moneda_destino_id: '',
    simbolo_moneda_destino: '', // <-- CORREGIDO: sin valor quemado
    tasa_compra: 0,
    tasa_venta: 0,
    fecha_tipocambio: '',
    incluye_iva: true,
  });

  // --- EFECTOS ---
  // Efecto para obtener el último correlativo (sin cambios)
  useEffect(() => {
    const obtenerUltimoCorrelativo = async () => {
        const cotizacionesRef = collection(db, 'cotizaciones');
        const q = query(cotizacionesRef, orderBy('no_cotizacion', 'desc'), limit(1));
        try {
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const ultimoDoc = querySnapshot.docs[0].data();
                setUltimaCotizacion(ultimoDoc.no_cotizacion);
                const [anio, corr] = ultimoDoc.no_cotizacion.split('-');
                const proximoCorr = (parseInt(corr, 10) + 1).toString().padStart(4, '0');
                setProximaCotizacion(`${anio}-${proximoCorr}`);
            }
        } catch (error) {
            console.error("Error al obtener el último correlativo:", error);
        }
    };
    obtenerUltimoCorrelativo();
  }, []);

  // Efecto para calcular la fecha de vigencia (sin cambios)
  useEffect(() => {
    if (fechaEmision && diasVigencia > 0) {
      const resultDate = new Date(fechaEmision);
      resultDate.setDate(resultDate.getDate() + parseInt(diasVigencia, 10));
      setFechaVigencia(resultDate.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    } else {
      setFechaVigencia('');
    }
  }, [fechaEmision, diasVigencia]);

  // PASO 2: Implementar la carga inicial de datos financieros
  useEffect(() => {
    const cargarDatosFinancierosIniciales = async () => {
      // PASO A y B: Verificar si hay datos en la sesión
      if (!sessionData?.tipo_cambio_id) return;

      try {
        // PASO C: Leer 'tipos_cambio' para obtener IDs de monedas
        const tipoCambioRef = doc(db, 'tipos_cambio', sessionData.tipo_cambio_id);
        const tipoCambioSnap = await getDoc(tipoCambioRef);

        if (!tipoCambioSnap.exists()) {
          console.error("Error: El tipo de cambio de la sesión no fue encontrado en la colección 'tipos_cambio'.");
          return;
        }
        const tipoCambioData = tipoCambioSnap.data();

        // PASO D: Leer 'monedas' para obtener los símbolos
        const monedaBaseRef = doc(db, 'monedas', tipoCambioData.moneda_base_id);
        const monedaDestinoRef = doc(db, 'monedas', tipoCambioData.moneda_destino_id);
        
        const [monedaBaseSnap, monedaDestinoSnap] = await Promise.all([
          getDoc(monedaBaseRef),
          getDoc(monedaDestinoRef)
        ]);

        const simboloBase = monedaBaseSnap.exists() ? monedaBaseSnap.data().simbolo : '?';
        const simboloDestino = monedaDestinoSnap.exists() ? monedaDestinoSnap.data().simbolo : '?';
        
        // PASO E: Poblar el estado con toda la información correcta
        setFinancieroSnapshot({
          tipocambio_id: sessionData.tipo_cambio_id,
          moneda_base_id: tipoCambioData.moneda_base_id,
          simbolo_moneda_base: simboloBase,
          moneda_destino_id: tipoCambioData.moneda_destino_id,
          simbolo_moneda_destino: simboloDestino,
          tasa_compra: sessionData.tipo_cambio_tasa_compra,
          tasa_venta: sessionData.tipo_cambio_tasa_venta,
          fecha_tipocambio: sessionData.tipo_cambio_fecha.toDate().toLocaleDateString('es-GT', {
            day: '2-digit', month: '2-digit', year: 'numeric'
          }),
          incluye_iva: true, // Se mantiene el valor por defecto
        });

      } catch (error) {
        console.error("Error fatal al cargar datos financieros iniciales:", error);
      }
    };

    cargarDatosFinancierosIniciales();
  }, [sessionData]); // El efecto se dispara cuando sessionData está disponible

  // --- MANEJADORES DE EVENTOS ---
  const handleSelectCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setIsClienteModalOpen(false);
  };

  const handleSelectTipoCambio = (tipoCambio) => {
    const fechaTC = tipoCambio.fecha_tipocambio.toDate().toLocaleDateString('es-GT', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    setFinancieroSnapshot({
        tipocambio_id: tipoCambio.id,
        moneda_base_id: tipoCambio.moneda_base_id,
        simbolo_moneda_base: tipoCambio.simbolo_moneda_base,
        moneda_destino_id: tipoCambio.moneda_destino_id,
        simbolo_moneda_destino: tipoCambio.simbolo_moneda_destino,
        tasa_compra: tipoCambio.tasa_compra,
        tasa_venta: tipoCambio.tasa_venta,
        fecha_tipocambio: fechaTC,
        incluye_iva: financieroSnapshot.incluye_iva, // Mantiene el valor actual
    });
    setIsTipoCambioModalOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth={false} sx={{ mt: 2, mb: 4 }}>
        {/* ... (código sin cambios) */}
        <Typography variant="h5" gutterBottom>Ingreso y Modificación de Cotizaciones</Typography>
        <Paper elevation={3} sx={{ p: 2, mb: 2, backgroundColor: '#e3f2fd' }}>
            <Typography variant="subtitle1"><strong>Última Cotización Registrada:</strong> {ultimaCotizacion}</Typography>
        </Paper>

        {/* SECCIÓN INFO COTIZACIÓN */}
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Sección de Información de la Cotización</Typography>
            <Button variant="contained" color="primary" startIcon={<SearchIcon />} size="small">Buscar Cotización</Button>
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2.4}><TextField label="No. Cotización" variant="outlined" fullWidth size="small" value={proximaCotizacion} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5', fontWeight: 'bold' } }}/></Grid>
            <Grid item xs={12} md={2.4}><DatePicker sx={{ width: '100%' }} label="Fecha Emisión" value={fechaEmision} onChange={setFechaEmision} format="dd/MM/yyyy" slotProps={{ textField: { size: 'small' } }}/></Grid>
            <Grid item xs={12} md={2.4}><TextField label="Días de Vigencia" variant="outlined" fullWidth size="small" type="number" value={diasVigencia} onChange={(e) => setDiasVigencia(e.target.value)}/></Grid>
            <Grid item xs={12} md={2.4}><TextField label="Fecha Vigencia" value={fechaVigencia} variant="outlined" fullWidth size="small" InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}/></Grid>
            <Grid item xs={12} md={2.4} sx={{ display: 'flex', justifyContent: 'center' }}><Chip label="Borrador" color="primary" sx={{fontSize: '12px', width: '100%', fontWeight: 'bold'}}/></Grid>
          </Grid>
        </Paper>

        {/* SECCIÓN INFO CLIENTE */}
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Sección de Información del Cliente</Typography>
            <Button variant="contained" startIcon={<SearchIcon />} size="small" onClick={() => setIsClienteModalOpen(true)}>Buscar Cliente</Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField label="Nombre Cliente" variant="outlined" fullWidth size="small" value={clienteSeleccionado?.nombre_cliente || ''} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }} /></Grid>
            <Grid item xs={12} md={4}><TextField label="NIT Cliente" variant="outlined" fullWidth size="small" value={clienteSeleccionado?.nit_cliente || ''} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}/></Grid>
            <Grid item xs={12} md={4}><TextField label="Teléfono Cliente" variant="outlined" fullWidth size="small" value={clienteSeleccionado?.telefono_cliente || ''} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}/></Grid>
            <Grid item xs={12}><TextField label="Dirección Cliente" variant="outlined" fullWidth size="small" value={clienteSeleccionado?.direccion_cliente || ''} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}/></Grid>
            <Grid item xs={12} md={6}><TextField label="Contacto" variant="outlined" fullWidth size="small" value={clienteSeleccionado?.contacto || ''} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}/></Grid>
            <Grid item xs={12} md={6}><TextField label="Teléfono Contacto" variant="outlined" fullWidth size="small" value={clienteSeleccionado?.telefono_contacto || ''} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}/></Grid>
          </Grid>
        </Paper>

        {/* SECCIÓN INFO FINANCIERA */}
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">Sección de Información Financiera</Typography>
                <Button variant="contained" startIcon={<SearchIcon />} size="small" onClick={() => setIsTipoCambioModalOpen(true)}>
                    Buscar Tipo de Cambio
                </Button>
            </Box>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={1.5}><TextField label="Moneda Base" value={financieroSnapshot.simbolo_moneda_base} InputProps={{readOnly: true, style: { backgroundColor: '#f5f5f5' }}} fullWidth size="small" /></Grid>
                <Grid item xs={12} md={1.5}><TextField label="Moneda Destino" value={financieroSnapshot.simbolo_moneda_destino} InputProps={{readOnly: true, style: { backgroundColor: '#f5f5f5' }}} fullWidth size="small" /></Grid>
                <Grid item xs={12} md={2}><TextField label="Tasa Compra" value={financieroSnapshot.tasa_compra} InputProps={{readOnly: true, style: { backgroundColor: '#f5f5f5' }}} fullWidth size="small" /></Grid>
                <Grid item xs={12} md={2}><TextField label="Tasa Venta" value={financieroSnapshot.tasa_venta} InputProps={{readOnly: true, style: { backgroundColor: '#f5f5f5' }}} fullWidth size="small" /></Grid>
                <Grid item xs={12} md={2.5}><TextField label="Fecha Tipo Cambio" value={financieroSnapshot.fecha_tipocambio} InputProps={{readOnly: true, style: { backgroundColor: '#f5f5f5' }}} fullWidth size="small" /></Grid>
                <Grid item xs={12} md={2.5}>
                    <FormControlLabel
                        control={<Checkbox checked={financieroSnapshot.incluye_iva} onChange={(e) => setFinancieroSnapshot({...financieroSnapshot, incluye_iva: e.target.checked})}/>}
                        label="Incluye IVA"
                        sx={{width: '100%'}}
                    />
                </Grid>
            </Grid>
        </Paper>
        
        {/* ... (código sin cambios) */}
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Sección de Detalle de la Cotización</Typography>
            <Button variant="contained" startIcon={<AddIcon />} size="small">Agregar Detalle</Button>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label="detalle de cotizacion">
              <TableHead>
                <TableRow>
                  <TableCell sx={{width: '5%', fontWeight: 'bold'}}>Item</TableCell>
                  <TableCell sx={{width: '40%', fontWeight: 'bold'}}>Servicio/Producto</TableCell>
                  <TableCell sx={{width: '10%', fontWeight: 'bold'}} align="right">Cantidad</TableCell>
                  <TableCell sx={{width: '15%', fontWeight: 'bold'}} align="right">Precio Unitario</TableCell>
                  <TableCell sx={{width: '15%', fontWeight: 'bold'}} align="right">Subtotal</TableCell>
                  <TableCell sx={{width: '15%', fontWeight: 'bold'}} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No se han agregado detalles a la cotización</TableCell>
                  </TableRow>
                ) : (
                  <></>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
            <Button variant="contained" color="primary" startIcon={<SaveIcon />}>Grabar Cotización</Button>
            <Button variant="outlined" color="secondary" startIcon={<CleaningServicesIcon />}>Limpiar Formulario</Button>
          </Box>
        </Paper>

        <BuscarClienteModal open={isClienteModalOpen} onClose={() => setIsClienteModalOpen(false)} onSelect={handleSelectCliente} />
        
        <BuscarTipoCambioModal 
            open={isTipoCambioModalOpen} 
            onClose={() => setIsTipoCambioModalOpen(false)} 
            onSelect={handleSelectTipoCambio}
        />

      </Container>
    </LocalizationProvider>
  );
};

export default CotizacionesIngresoPage;
