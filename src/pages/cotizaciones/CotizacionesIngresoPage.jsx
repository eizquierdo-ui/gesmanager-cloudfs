import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, TextField, Button, Grid, Chip,
  FormControlLabel, Checkbox, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import es from 'date-fns/locale/es';

// --- Hooks y Contextos ---
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext'; // IMPORTADO

// --- Importaciones de Firebase ---
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, limit, addDoc, Timestamp } from 'firebase/firestore';

// --- Modales ---
import BuscarClienteModal from '../../components/modals/BuscarClienteModal';
import BuscarTipoCambioModal from '../../components/modals/BuscarTipoCambioModal';

const CotizacionesIngresoPage = () => {
  // --- STATE MANAGEMENT ---
  const { sessionData } = useAppContext();
  const { currentUser } = useAuth(); // OBTENIDO
  const navigate = useNavigate();

  const [ultimaCotizacion, setUltimaCotizacion] = useState('2026-0000');
  const [proximaCotizacion, setProximaCotizacion] = useState('2026-0001');
  const [fechaEmision, setFechaEmision] = useState(new Date());
  const [diasVigencia, setDiasVigencia] = useState(8);
  const [fechaVigencia, setFechaVigencia] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isTipoCambioModalOpen, setIsTipoCambioModalOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [monedasDisponibles, setMonedasDisponibles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [formaPago, setFormaPago] = useState('');
  const [terminosYCondiciones, setTerminosYCondiciones] = useState('');

  const [financieroSnapshot, setFinancieroSnapshot] = useState({
    tipocambio_id: '',
    moneda_base_id: '',
    simbolo_moneda_base: '',
    moneda_destino_id: '',
    simbolo_moneda_destino: '',
    tasa_compra: 0,
    tasa_venta: 0,
    fecha_tipocambio: new Date(),
    incluye_iva: true,
  });

  // --- EFECTOS ---
  useEffect(() => {
    const fetchInitialData = async () => {
      // 1. Cargar monedas universales
      try {
        const querySnapshot = await getDocs(collection(db, 'monedas'));
        const monedas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMonedasDisponibles(monedas);
      } catch (error) {
        console.error("Error al cargar monedas universales:", error);
      }

      // 2. Cargar último correlativo
      const cotizacionesRef = collection(db, 'cotizaciones');
      const q = query(cotizacionesRef, orderBy('numero_cotizacion', 'desc'), limit(1));
      try {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
              const ultimoDoc = querySnapshot.docs[0].data();
              setUltimaCotizacion(ultimoDoc.numero_cotizacion);
              const [anio, corr] = ultimoDoc.numero_cotizacion.split('-');
              const proximoCorr = (parseInt(corr, 10) + 1).toString().padStart(4, '0');
              setProximaCotizacion(`${anio}-${proximoCorr}`);
          }
      } catch (error) {
          console.error("Error al obtener el último correlativo:", error);
      }

      // 3. Cargar datos de la sesión
      if (sessionData && sessionData.tipo_cambio_id) {
        setFinancieroSnapshot(prev => ({
          ...prev,
          tipocambio_id: sessionData.tipo_cambio_id,
          moneda_base_id: sessionData.tipo_cambio_moneda_base_id,
          simbolo_moneda_base: sessionData.tipo_cambio_moneda_base_simbolo,
          moneda_destino_id: sessionData.tipo_cambio_moneda_destino_id,
          simbolo_moneda_destino: sessionData.tipo_cambio_moneda_destino_simbolo,
          tasa_compra: sessionData.tipo_cambio_tasa_compra,
          tasa_venta: sessionData.tipo_cambio_tasa_venta,
          fecha_tipocambio: sessionData.tipo_cambio_fecha ? sessionData.tipo_cambio_fecha.toDate() : new Date(),
        }));
      }
    };
    
    fetchInitialData();
  }, [sessionData]);

  useEffect(() => {
    if (fechaEmision && diasVigencia > 0) {
      const resultDate = new Date(fechaEmision);
      resultDate.setDate(resultDate.getDate() + parseInt(diasVigencia, 10));
      setFechaVigencia(resultDate.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    } else {
      setFechaVigencia('');
    }
  }, [fechaEmision, diasVigencia]);

  useEffect(() => {
    if (sessionData) {
      const infoPago = `Cheques a nombre de VOICE, S.A.\n` +
                       `Deposito a Cta. Monetaria en Q. No. 7500030916 del Banco BI a nombre de VOICE, S.A.\n` +
                       `50% de anticipo al dar por aceptada esta cotización y 50% al finalizar.`;

      const terminos = `Los precios ya incluyen el IVA.\n` +
                       `Incluye Timbre de Prensa.\n` +
                       `La presente cotización tiene una vigencia de ${diasVigencia} días.\n` +
                       `Cualquier servicio solicitado que no esté descrito en la cotización se cobrará extra.\n` +
                       `Tipo de cambio es de $ 1.00 por Q. ${sessionData.tipo_cambio_tasa_venta.toFixed(4)}`;

      setFormaPago(infoPago);
      setTerminosYCondiciones(terminos);
    }
  }, [sessionData, diasVigencia]);

  // --- MANEJADORES DE EVENTOS ---
  const handleFinancieroChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFinancieroSnapshot(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleMonedaChange = (event) => {
    const { name, value } = event.target;
    const monedaSeleccionada = monedasDisponibles.find(m => m.id === value);
    
    if (monedaSeleccionada) {
      if (name === 'moneda_base_id') {
        setFinancieroSnapshot(prev => ({
          ...prev,
          moneda_base_id: monedaSeleccionada.id,
          simbolo_moneda_base: monedaSeleccionada.simbolo
        }));
      } else if (name === 'moneda_destino_id') {
        setFinancieroSnapshot(prev => ({
          ...prev,
          moneda_destino_id: monedaSeleccionada.id,
          simbolo_moneda_destino: monedaSeleccionada.simbolo
        }));
      }
    }
  };

  const handleSelectCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setIsClienteModalOpen(false);
  };

  const handleSelectTipoCambio = (tipoCambio) => {
    setFinancieroSnapshot({
        ...financieroSnapshot,
        tipocambio_id: tipoCambio.id,
        moneda_base_id: tipoCambio.moneda_base_id,
        simbolo_moneda_base: tipoCambio.simbolo_moneda_base, 
        moneda_destino_id: tipoCambio.moneda_destino_id,
        simbolo_moneda_destino: tipoCambio.simbolo_moneda_destino, 
        tasa_compra: tipoCambio.tasa_compra,
        tasa_venta: tipoCambio.tasa_venta,
        fecha_tipocambio: tipoCambio.fecha.toDate(),
    });
    setIsTipoCambioModalOpen(false);
  };

  const handleGrabarCotizacion = async () => {
    if (!currentUser) {
        alert("Error de autenticación. Por favor, inicie sesión de nuevo.");
        return;
    }
    if (!clienteSeleccionado) {
      alert("Por favor, seleccione un cliente.");
      return;
    }
    setIsSaving(true);
    try {
      const cotizacionData = {
        // IDs de Referencia
        empresa_id: sessionData.empresa_id,
        cliente_id: clienteSeleccionado.id,
        usuario_id: currentUser.uid, // CORREGIDO
        // Información General
        numero_cotizacion: proximaCotizacion,
        fecha_emision: Timestamp.fromDate(fechaEmision),
        dias_vigencia: parseInt(diasVigencia, 10),
        estado: "borrador",
        fecha_estado: Timestamp.now(), // AÑADIDO
        // Snapshots
        cliente_snapshot: {
          nombre_cliente: clienteSeleccionado.nombre_cliente,
          direccion_cliente: clienteSeleccionado.direccion_cliente,
          nit_cliente: clienteSeleccionado.nit_cliente,
          email_cliente: clienteSeleccionado.email_cliente,
          telefono_cliente: clienteSeleccionado.telefono_cliente,
          contacto_principal: {
            nombre: clienteSeleccionado.contacto,
            telefono: clienteSeleccionado.telefono_contacto
          }
        },
        financiero_snapshot: {
            ...financieroSnapshot,
            fecha_tipocambio: Timestamp.fromDate(financieroSnapshot.fecha_tipocambio)
        },
        // Secciones pendientes (con valores por defecto)
        totales: {
          total_costo_base: 0,
          total_cotizacion_base: 0,
          total_cotizacion_final: 0,
          total_tasa_descuento_aplicada: 0.00,
          total_tasa_feeglobal_aplicada: 0.00,
          tasa_iva_aplicada: 0.12,
          monto_iva_total: 0,
          sub_total_sin_iva: 0,
          sub_total_base_tp: 0,
          tasa_tp_aplicada: 0.005,
          monto_tp_total: 0,
          isr_calculado: {
              monto_tramo_1: 0,
              monto_tramo_2: 0,
              monto_isr_total: 0
          }
        },
        forma_pago: formaPago,
        terminos_y_condiciones: terminosYCondiciones,
        items: [],
        // Auditoría
        fecha_creacion: Timestamp.now(),
        usuario_creo: currentUser.uid, // CORREGIDO
        fecha_ultima_modificacion: Timestamp.now(),
        usuario_ultima_modificacion: currentUser.uid // CORREGIDO
      };

      const docRef = await addDoc(collection(db, "cotizaciones"), cotizacionData);
      console.log("Document written with ID: ", docRef.id);
      alert(`Cotización ${proximaCotizacion} guardada con éxito.`);
      // Aquí podríamos navegar a otra página o limpiar el formulario
      navigate('/'); // Redirige al dashboard

    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Error al guardar la cotización.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSalir = () => {
    navigate('/');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth={false} sx={{ mt: 2, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Ingreso y Modificación de Cotizaciones</Typography>
        <Paper elevation={3} sx={{ p: 2, mb: 2, backgroundColor: '#e3f2fd' }}>
            <Typography variant="subtitle1"><strong>Última Cotización Registrada:</strong> {ultimaCotizacion}</Typography>
        </Paper>

        {/* SECCIÓN INFO COTIZACIÓN */}
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Sección de Información de la Cotización</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary" startIcon={<SearchIcon />} size="small">Buscar Cotización</Button>
                <Button 
                    variant="contained" 
                    color="error" 
                    startIcon={<ExitToAppIcon />} 
                    size="small"
                    onClick={handleSalir}
                >
                    Salir
                </Button>
            </Box>
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
                <Grid item xs={12} md><DatePicker label="Fecha Tipo Cambio" value={financieroSnapshot.fecha_tipocambio} onChange={(newDate) => setFinancieroSnapshot(prev => ({...prev, fecha_tipocambio: newDate}))} format="dd/MM/yyyy" sx={{ width: '100%' }} slotProps={{ textField: { size: 'small' } }}/></Grid>
                
                <Grid item xs={12} md>
                  <FormControl fullWidth size="small">
                    <InputLabel>Moneda Base</InputLabel>
                    <Select
                      name="moneda_base_id"
                      label="Moneda Base"
                      value={financieroSnapshot.moneda_base_id || ''}
                      onChange={handleMonedaChange}
                    >
                      {monedasDisponibles.map((moneda) => (
                        <MenuItem key={moneda.id} value={moneda.id}>
                          {`${moneda.codigo} - ${moneda.simbolo}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md>
                  <FormControl fullWidth size="small">
                    <InputLabel>Moneda Destino</InputLabel>
                    <Select
                      name="moneda_destino_id"
                      label="Moneda Destino"
                      value={financieroSnapshot.moneda_destino_id || ''}
                      onChange={handleMonedaChange}
                    >
                      {monedasDisponibles.map((moneda) => (
                        <MenuItem key={moneda.id} value={moneda.id}>
                          {`${moneda.codigo} - ${moneda.simbolo}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md><TextField name="tasa_compra" label="Tasa Compra" value={financieroSnapshot.tasa_compra} onChange={handleFinancieroChange} fullWidth size="small" type="number"/></Grid>
                <Grid item xs={12} md><TextField name="tasa_venta" label="Tasa Venta" value={financieroSnapshot.tasa_venta} onChange={handleFinancieroChange} fullWidth size="small" type="number"/></Grid>
                <Grid item xs={12} md>
                    <FormControlLabel
                        control={<Checkbox name="incluye_iva" checked={financieroSnapshot.incluye_iva} onChange={handleFinancieroChange}/>}
                        label="Incluye IVA"
                        sx={{width: '100%', justifyContent: 'center'}}
                    />
                </Grid>
            </Grid>
        </Paper>
        
        {/* SECCIÓN CONDICIONES COMERCIALES */}
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Sección de Condiciones Comerciales</Typography>
          <Box display="flex" gap={2}>
            <Box flex="1 1 50%">
              <TextField
                label="Forma de Pago"
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
              />
            </Box>
            <Box flex="1 1 50%">
              <TextField
                label="Términos y Condiciones"
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                value={terminosYCondiciones}
                onChange={(e) => setTerminosYCondiciones(e.target.value)}
              />
            </Box>
          </Box>
        </Paper>

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
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />} 
              onClick={handleGrabarCotizacion}
              disabled={isSaving}
            >
              {isSaving ? 'Grabando...' : 'Grabar Cotización'}
            </Button>
            <Button variant="outlined" color="secondary" startIcon={<CleaningServicesIcon />}>Limpiar Formulario</Button>
          </Box>
        </Paper>

        <BuscarClienteModal open={isClienteModalOpen} onClose={() => setIsClienteModalOpen(false)} onSelect={handleSelectCliente} />
        
        {sessionData && (
          <BuscarTipoCambioModal 
              open={isTipoCambioModalOpen} 
              onClose={() => setIsTipoCambioModalOpen(false)} 
              onSelect={handleSelectTipoCambio}
              empresaId={sessionData.empresa_id}
              monedaBaseId={sessionData.tipo_cambio_moneda_base_id}
          />
        )}

      </Container>
    </LocalizationProvider>
  );
};

export default CotizacionesIngresoPage;
