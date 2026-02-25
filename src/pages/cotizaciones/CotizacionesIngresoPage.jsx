
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, TextField, Button, Grid, Chip,
  FormControlLabel, Checkbox, Select, MenuItem, InputLabel, FormControl, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import es from 'date-fns/locale/es';

import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy, limit, addDoc, Timestamp } from 'firebase/firestore';
import BuscarClienteModal from '../../components/modals/BuscarClienteModal';
import BuscarTipoCambioModal from '../../components/modals/BuscarTipoCambioModal';
import BuscarServicioModal from '../../components/modals/BuscarServicioModal';
import ItemsTable from '../../components/cotizaciones/ItemsTable';

const round = (value, decimals = 4) => {
  if (typeof value !== 'number') return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

const formatCurrency = (value, currencySymbol = 'Q.') => {
  const number = parseFloat(value) || 0;
  return `${currencySymbol} ${number.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const initialTotals = {
  total_costo_base: 0, total_cotizacion_base: 0, total_cotizacion_final: 0,
  total_descuento_aplicado: 0, total_tasa_feeglobal_aplicada: 0,
  tasa_iva_aplicada: 0.12, monto_iva_total: 0, sub_total_sin_iva: 0,
  sub_total_base_tp: 0, tasa_tp_aplicada: 0.005, monto_tp_total: 0,
  isr_calculado: { monto_tramo_1: 0, monto_tramo_2: 0, monto_isr_total: 0, },
};

// --- COMPONENTE DE TOTALES CORREGIDO PARA USAR EL CÓDIGO DE MONEDA EN LA ETIQUETA ---
const TotalsDisplay = ({ 
    totales, formatCurrency, simboloMoneda, simboloMonedaDestino, tasaCompra, 
    monedasDisponibles, monedaDestinoId
}) => {
    const totalEnDestino = totales.total_cotizacion_final / (tasaCompra || 1);

    // 1. Buscar la moneda de destino usando el ID.
    const monedaDestino = monedasDisponibles?.find(m => m.id === monedaDestinoId);
    // 2. Extraer el CÓDIGO (ej: 'USD'), no el símbolo.
    const codigoMonedaDestino = monedaDestino?.codigo || '';

    const TotalRow = ({ label, value, color, fontWeight = 'normal' }) => (
        <Box sx={{ display: 'flex', width: '100%', py: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight, whiteSpace: 'nowrap' }}>{label}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="body1" sx={{ fontWeight, color, whiteSpace: 'nowrap' }}>{value}</Typography>
        </Box>
    );

    return (
        <Box sx={{ 
            width: '380px', 
            float: 'right', 
            mt: 2, 
            p: 2, 
            border: '1px solid #e0e0e0', 
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5 
        }}>
            <TotalRow 
                label="Total Cotizacion" 
                value={formatCurrency(totales.total_cotizacion_final, simboloMoneda)}
                fontWeight="bold"
            />
            <TotalRow 
                label={`Iva (${((totales.tasa_iva_aplicada || 0) * 100).toFixed(2)}%)`} 
                value={formatCurrency(totales.monto_iva_total, simboloMoneda)} 
                color="error.main" 
            />
            <TotalRow 
                label="Sub Total" 
                value={formatCurrency(totales.sub_total_sin_iva, simboloMoneda)} 
            />
            
            <Divider sx={{ my: 1 }} />

            <TotalRow 
                label="Sub Total TP" 
                value={formatCurrency(totales.sub_total_base_tp, simboloMoneda)} 
            />
            <TotalRow 
                label={`TP (${((totales.tasa_tp_aplicada || 0) * 100).toFixed(2)}%)`} 
                value={formatCurrency(totales.monto_tp_total, simboloMoneda)} 
            />

            <Divider sx={{ my: 1 }} />
            
            {/* 3. Construir la etiqueta como "Total en [CÓDIGO]." */}
            <TotalRow 
                label={`Total en ${codigoMonedaDestino}.`}
                value={formatCurrency(totalEnDestino, simboloMonedaDestino)}
                fontWeight="bold"
            />
        </Box>
    );
}


const CotizacionesIngresoPage = () => {
  const { sessionData } = useAppContext();
  const { currentUser } = useAuth(); 
  const navigate = useNavigate();
  const [ultimaCotizacion, setUltimaCotizacion] = useState('2026-0000');
  const [proximaCotizacion, setProximaCotizacion] = useState('2026-0001');
  const [fechaEmision, setFechaEmision] = useState(new Date());
  const [diasVigencia, setDiasVigencia] = useState(8);
  const [fechaVigencia, setFechaVigencia] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isTipoCambioModalOpen, setIsTipoCambioModalOpen] = useState(false);
  const [buscarServicioModalOpen, setBuscarServicioModalOpen] = useState(false); 
  const [items, setItems] = useState([]);
  const [monedasDisponibles, setMonedasDisponibles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formaPago, setFormaPago] = useState('');
  const [terminosYCondiciones, setTerminosYCondiciones] = useState('');
  const [totales, setTotales] = useState(initialTotals);
  const [financieroSnapshot, setFinancieroSnapshot] = useState({ tipocambio_id: '', moneda_base_id: '', simbolo_moneda_base: 'Q.', moneda_destino_id: '', simbolo_moneda_destino: '$', tasa_compra: 7.8, tasa_venta: 7.9, fecha_tipocambio: new Date(), incluye_iva: true, });

  const recalculateLine = useCallback((item, incluyeIva) => {
    const newItem = { ...item };
    const cantidad = parseFloat(String(newItem.cantidad).replace(',', '.')) || 0;
    const precio_venta_base_linea = parseFloat(String(newItem.precio_venta_base_linea).replace(',', '.')) || 0;
    const precio_venta_final_linea = parseFloat(String(newItem.precio_venta_final_linea).replace(',', '.')) || 0;
    const tasa_descuento_aplicada = parseFloat(String(newItem.tasa_descuento_aplicada).replace(',', '.')) || 0;
    const iva_tasa_linea = newItem.iva_tasa_linea || 0.12;
    const tp_tasa_linea = newItem.tp_tasa_linea || 0.005;
    newItem.total_descuento_aplicado_linea = round((cantidad * precio_venta_base_linea) * (tasa_descuento_aplicada / 100));
    newItem.total_linea = round(cantidad * precio_venta_final_linea, 2);
    newItem.iva_total_linea = incluyeIva ? round(newItem.total_linea - (newItem.total_linea / (1 + iva_tasa_linea))) : 0;
    newItem.sub_total_sin_iva_linea = round(newItem.total_linea - newItem.iva_total_linea, 2);
    newItem.sub_total_base_tp_linea = newItem.itp_servicio ? newItem.sub_total_sin_iva_linea : 0;
    newItem.tp_total_linea = round(newItem.sub_total_base_tp_linea * tp_tasa_linea);
    return newItem;
  }, []);

  const handleItemChange = useCallback((index, field, value) => {
    setItems(prevItems => {
        const updatedItems = [...prevItems];
        let itemToUpdate = { ...updatedItems[index] };
        const sanitizedValue = String(value).replace(',', '.');
        itemToUpdate[field] = sanitizedValue;
        if (field === 'tasa_descuento_aplicada') {
            const numericValue = parseFloat(sanitizedValue) || 0;
            const basePrice = itemToUpdate.precio_venta_base_linea;
            itemToUpdate.precio_venta_final_linea = round(basePrice * (1 - (numericValue / 100)), 2);
        } else if (field === 'precio_venta_final_linea') {
            const numericValue = parseFloat(sanitizedValue) || 0;
            const basePrice = itemToUpdate.precio_venta_base_linea;
            itemToUpdate.tasa_descuento_aplicada = basePrice > 0 ? round(100 - (100 * (numericValue / basePrice))) : 0;
        }
        updatedItems[index] = recalculateLine(itemToUpdate, financieroSnapshot.incluye_iva);
        return updatedItems;
    });
  }, [recalculateLine, financieroSnapshot.incluye_iva]);
  
  const handleSelectServicio = useCallback((servicio) => {
    const precioBase = servicio.precios_calculados?.precio_venta_base || 0;
    let newItem = { 
        id_temporal: Date.now(), categoria_id: servicio.categoria_id, servicio_id: servicio.id, cantidad: 1, 
        nombre_servicio: servicio.nombre_servicio, detalle_queincluyeservicio: servicio.detalle_queincluyeservicio, 
        itp_servicio: servicio.itp, costo_total_linea: servicio.precios_calculados?.costo_total_base || 0, 
        precio_venta_base_linea: precioBase, precio_venta_final_linea: precioBase, tasa_descuento_aplicada: 0, 
        iva_tasa_linea: 0.12, tp_tasa_linea: 0.005,
    };
    const calculatedItem = recalculateLine(newItem, financieroSnapshot.incluye_iva);
    setItems(prev => [...prev, calculatedItem]);
    setBuscarServicioModalOpen(false);
  }, [recalculateLine, financieroSnapshot.incluye_iva]);

  const handleDeleteItem = useCallback((index) => { setItems(prev => prev.filter((_, i) => i !== index)); }, []);

  useEffect(() => {
    const newTotals = items.reduce((acc, item) => {
        acc.total_costo_base += item.costo_total_linea || 0;
        acc.total_descuento_aplicado += item.total_descuento_aplicado_linea || 0;
        acc.monto_iva_total += item.iva_total_linea || 0;
        acc.sub_total_sin_iva += item.sub_total_sin_iva_linea || 0;
        acc.sub_total_base_tp += item.sub_total_base_tp_linea || 0;
        acc.monto_tp_total += item.tp_total_linea || 0;
        acc.total_linea_sum += item.total_linea || 0;
        return acc;
    }, { ...initialTotals, total_linea_sum: 0 });
    newTotals.total_cotizacion_final = round(newTotals.total_linea_sum, 2);
    newTotals.total_descuento_aplicado = round(newTotals.total_descuento_aplicado, 2);
    newTotals.total_cotizacion_base = round(newTotals.total_cotizacion_final + newTotals.total_descuento_aplicado, 2);
    newTotals.monto_iva_total = round(newTotals.monto_iva_total, 2);
    const calculatedSubTotal = newTotals.total_cotizacion_final - newTotals.monto_iva_total;
    newTotals.sub_total_sin_iva = round(calculatedSubTotal, 2);
    newTotals.sub_total_base_tp = round(newTotals.sub_total_base_tp, 2);
    newTotals.monto_tp_total = round(newTotals.monto_tp_total, 2);

    if (newTotals.total_cotizacion_final > 0) {
        newTotals.total_tasa_feeglobal_aplicada = round(100 - ((newTotals.total_costo_base / newTotals.total_cotizacion_final) * 100));
    } else {
        newTotals.total_tasa_feeglobal_aplicada = 0;
    }
    const isrBase = newTotals.sub_total_sin_iva;
    if (isrBase <= 30000) { newTotals.isr_calculado.monto_tramo_1 = round(isrBase * 0.05, 2); newTotals.isr_calculado.monto_tramo_2 = 0; } else { newTotals.isr_calculado.monto_tramo_1 = round(30000 * 0.05, 2); const diferencia = isrBase - 30000; newTotals.isr_calculado.monto_tramo_2 = round(diferencia * 0.07, 2); }
    newTotals.isr_calculado.monto_isr_total = round(newTotals.isr_calculado.monto_tramo_1 + newTotals.isr_calculado.monto_tramo_2, 2);
    
    setTotales(newTotals);
  }, [items, financieroSnapshot.incluye_iva]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try { const querySnapshot = await getDocs(collection(db, 'monedas')); setMonedasDisponibles(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); } catch (error) { console.error("Error al cargar monedas:", error); }
      const q = query(collection(db, 'cotizaciones'), orderBy('numero_cotizacion', 'desc'), limit(1));
      try { const querySnapshot = await getDocs(q); if (!querySnapshot.empty) { const ultimoDoc = querySnapshot.docs[0].data(); setUltimaCotizacion(ultimoDoc.numero_cotizacion); const [anio, corr] = ultimoDoc.numero_cotizacion.split('-'); const proximoCorr = (parseInt(corr, 10) + 1).toString().padStart(4, '0'); setProximaCotizacion(`${anio}-${proximoCorr}`); } } catch (error) { console.error("Error al obtener correlativo:", error); }
      if (sessionData) { 
          setFinancieroSnapshot(prev => ({ ...prev, tipocambio_id: sessionData.tipo_cambio_id, moneda_base_id: sessionData.tipo_cambio_moneda_base_id, simbolo_moneda_base: sessionData.tipo_cambio_moneda_base_simbolo, moneda_destino_id: sessionData.tipo_cambio_moneda_destino_id, simbolo_moneda_destino: sessionData.tipo_cambio_moneda_destino_simbolo, tasa_compra: sessionData.tipo_cambio_tasa_compra, tasa_venta: sessionData.tipo_cambio_tasa_venta, fecha_tipocambio: sessionData.tipo_cambio_fecha ? sessionData.tipo_cambio_fecha.toDate() : new Date() })); 
          const infoPago = `Cheques a nombre de VOICE, S.A.\nDeposito a Cta. Monetaria en Q. No. 7500030916 del Banco BI a nombre de VOICE, S.A.\n50% de anticipo al dar por aceptada esta cotización y 50% al finalizar.`; 
          const terminos = `Los precios ya incluyen el IVA.\nIncluye Timbre de Prensa.\nLa presente cotización tiene una vigencia de ${diasVigencia} días.\nCualquier servicio solicitado que no esté descrito en la cotización se cobrará extra.\nTipo de cambio es de $ 1.00 por Q. ${sessionData.tipo_cambio_tasa_venta.toFixed(4)}`; 
          setFormaPago(infoPago); setTerminosYCondiciones(terminos); 
      }
    };
    fetchInitialData();
  }, [sessionData]);

  useEffect(() => { if (fechaEmision && diasVigencia > 0) { const resultDate = new Date(fechaEmision); resultDate.setDate(resultDate.getDate() + parseInt(diasVigencia, 10)); setFechaVigencia(resultDate.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })); } else { setFechaVigencia(''); } }, [fechaEmision, diasVigencia]);
  
  const handleFinancieroChange = (event) => { const { name, value, type, checked } = event.target; const isCheckbox = type === 'checkbox'; setFinancieroSnapshot(prev => ({ ...prev, [name]: isCheckbox ? checked : value })); if (isCheckbox && name === 'incluye_iva') { setItems(currentItems => currentItems.map(item => recalculateLine(item, checked))); } };
  const handleMonedaChange = (event) => { const { name, value } = event.target; const monedaSeleccionada = monedasDisponibles.find(m => m.id === value); if (monedaSeleccionada) { if (name === 'moneda_base_id') { setFinancieroSnapshot(prev => ({ ...prev, moneda_base_id: monedaSeleccionada.id, simbolo_moneda_base: monedaSeleccionada.simbolo })); } else if (name === 'moneda_destino_id') { setFinancieroSnapshot(prev => ({ ...prev, moneda_destino_id: monedaSeleccionada.id, simbolo_moneda_destino: monedaSeleccionada.simbolo })); } } };
  const handleSelectCliente = (cliente) => { setClienteSeleccionado(cliente); setIsClienteModalOpen(false); };
  const handleSelectTipoCambio = (tipoCambio) => { setFinancieroSnapshot({ ...financieroSnapshot, tipocambio_id: tipoCambio.id, moneda_base_id: tipoCambio.moneda_base_id, simbolo_moneda_base: tipoCambio.simbolo_moneda_base, moneda_destino_id: tipoCambio.moneda_destino_id, simbolo_moneda_destino: tipoCambio.simbolo_moneda_destino, tasa_compra: tipoCambio.tasa_compra, tasa_venta: tipoCambio.tasa_venta, fecha_tipocambio: tipoCambio.fecha.toDate(), }); setIsTipoCambioModalOpen(false); };
  const handleSalir = () => navigate('/');

  const handleGrabarCotizacion = async () => {
    if (!clienteSeleccionado) { alert("Debe seleccionar un cliente."); return; }
    if (items.length === 0) { alert("Debe agregar al menos un detalle."); return; }
    setIsSaving(true);
    try {
      const itemsParaGrabar = items.map(item => {
        const { id_temporal, ...itemRest } = item;
        return {
          ...itemRest,
          cantidad: parseFloat(itemRest.cantidad) || 0,
          costo_total_linea: round(itemRest.costo_total_linea, 2),
          precio_venta_base_linea: round(itemRest.precio_venta_base_linea, 2),
          precio_venta_final_linea: round(itemRest.precio_venta_final_linea, 2),
          tasa_descuento_aplicada: round(itemRest.tasa_descuento_aplicada, 4),
          total_descuento_aplicado_linea: round(itemRest.total_descuento_aplicado_linea, 4),
          iva_tasa_linea: round(itemRest.iva_tasa_linea, 4),
          tp_tasa_linea: round(itemRest.tp_tasa_linea, 4),
          iva_total_linea: round(itemRest.iva_total_linea, 2),
          tp_total_linea: round(itemRest.tp_total_linea, 2),
          total_linea: round(itemRest.total_linea, 2),
          sub_total_sin_iva_linea: round(itemRest.sub_total_sin_iva_linea, 2),
          sub_total_base_tp_linea: round(itemRest.sub_total_base_tp_linea, 2),
        };
      });

      const totalesParaGrabar = {
        ...totales,
        total_descuento_aplicado: round(totales.total_descuento_aplicado, 2),
      };

      const cotizacionParaGrabar = {
        empresa_id: sessionData.empresa_id, cliente_id: clienteSeleccionado.id, usuario_id: currentUser.uid, 
        numero_cotizacion: proximaCotizacion, fecha_emision: Timestamp.fromDate(fechaEmision), dias_vigencia: parseInt(diasVigencia, 10) || 0,
        estado: "borrador", fecha_estado: Timestamp.now(),
        cliente_snapshot: { nombre_cliente: clienteSeleccionado.nombre_cliente, direccion_cliente: clienteSeleccionado.direccion_cliente, nit_cliente: clienteSeleccionado.nit_cliente, email_cliente: clienteSeleccionado.email_cliente, telefono_cliente: clienteSeleccionado.telefono_cliente, contacto_principal: { nombre: clienteSeleccionado.contacto || '', telefono: clienteSeleccionado.telefono_contacto || '' } },
        financiero_snapshot: { ...financieroSnapshot, fecha_tipocambio: Timestamp.fromDate(financieroSnapshot.fecha_tipocambio) },
        totales: totalesParaGrabar, forma_pago: formaPago, terminos_y_condiciones: terminosYCondiciones, items: itemsParaGrabar,
        fecha_creacion: Timestamp.now(), usuario_creo: currentUser.uid, fecha_ultima_modificacion: Timestamp.now(), usuario_ultima_modificacion: currentUser.uid
      };

      console.log('Grabando cotización:', cotizacionParaGrabar);
      await addDoc(collection(db, 'cotizaciones'), cotizacionParaGrabar);
      alert("Cotización grabada con éxito!");
      navigate('/');

    } catch (error) {
      console.error("Error al grabar la cotización: ", error);
      alert("Hubo un error al grabar la cotización. Revise la consola.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth={false} sx={{ mt: 2, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Ingreso y Modificación de Cotizaciones</Typography>
        <Paper elevation={3} sx={{ p: 2, mb: 2, backgroundColor: '#e3f2fd' }}><Typography variant="subtitle1"><strong>Última Cotización Registrada:</strong> {ultimaCotizacion}</Typography></Paper>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}><Typography variant="subtitle1">Sección de Información de la Cotización</Typography><Box sx={{ display: 'flex', gap: 2 }}><Button variant="contained" color="primary" startIcon={<SearchIcon />} size="small">Buscar Cotización</Button><Button variant="contained" color="error" startIcon={<ExitToAppIcon />} size="small" onClick={handleSalir}>Salir</Button></Box></Box><Grid container spacing={2} alignItems="center"><Grid item xs={12} md={2.4}><TextField label="No. Cotización" variant="outlined" fullWidth size="small" value={proximaCotizacion} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5', fontWeight: 'bold' } }}/></Grid><Grid item xs={12} md={2.4}><DatePicker sx={{ width: '100%' }} label="Fecha Emisión" value={fechaEmision} onChange={setFechaEmision} format="dd/MM/yyyy" slotProps={{ textField: { size: 'small' } }}/></Grid><Grid item xs={12} md={2.4}><TextField label="Días de Vigencia" variant="outlined" fullWidth size="small" type="number" value={diasVigencia} onChange={(e) => setDiasVigencia(e.target.value)}/></Grid><Grid item xs={12} md={2.4}><TextField label="Fecha Vigencia" value={fechaVigencia} variant="outlined" fullWidth size="small" InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}/></Grid><Grid item xs={12} md={2.4} sx={{ display: 'flex', justifyContent: 'center' }}><Chip label="Borrador" color="primary" sx={{fontSize: '12px', width: '100%', fontWeight: 'bold'}}/></Grid></Grid></Paper>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}><Typography variant="subtitle1">Sección de Información del Cliente</Typography><Button variant="contained" startIcon={<SearchIcon />} size="small" onClick={() => setIsClienteModalOpen(true)}>Buscar Cliente</Button></Box><Grid container spacing={2}><Grid item xs={12} md={4}><TextField label="Nombre Cliente" variant="outlined" fullWidth size="small" value={clienteSeleccionado?.nombre_cliente || ''} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }} /></Grid><Grid item xs={12} md={4}><TextField label="NIT Cliente" variant="outlined" fullWidth size="small" value={clienteSeleccionado?.nit_cliente || ''} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}/></Grid><Grid item xs={12} md={4}><TextField label="Teléfono Cliente" variant="outlined" fullWidth size="small" value={clienteSeleccionado?.telefono_cliente || ''} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}/></Grid><Grid item xs={12}><TextField label="Dirección Cliente" variant="outlined" fullWidth size="small" value={clienteSeleccionado?.direccion_cliente || ''} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}/></Grid><Grid item xs={12} md={6}><TextField label="Contacto" variant="outlined" fullWidth size="small" value={clienteSeleccionado?.contacto || ''} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}/></Grid><Grid item xs={12} md={6}><TextField label="Teléfono Contacto" variant="outlined" fullWidth size="small" value={clienteSeleccionado?.telefono_contacto || ''} InputProps={{ readOnly: true, style: { backgroundColor: '#f5f5f5' } }}/></Grid></Grid></Paper>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}><Typography variant="subtitle1">Sección de Información Financiera</Typography><Button variant="contained" startIcon={<SearchIcon />} size="small" onClick={() => setIsTipoCambioModalOpen(true)}>Buscar Tipo de Cambio</Button></Box><Grid container spacing={2} alignItems="center"><Grid item xs={12} md><DatePicker label="Fecha Tipo Cambio" value={financieroSnapshot.fecha_tipocambio} onChange={(newDate) => setFinancieroSnapshot(prev => ({...prev, fecha_tipocambio: newDate}))} format="dd/MM/yyyy" sx={{ width: '100%' }} slotProps={{ textField: { size: 'small' } }}/></Grid><Grid item xs={12} md><FormControl fullWidth size="small"><InputLabel>Moneda Base</InputLabel><Select name="moneda_base_id" label="Moneda Base" value={financieroSnapshot.moneda_base_id || ''} onChange={handleMonedaChange}>{monedasDisponibles.map((moneda) => (<MenuItem key={moneda.id} value={moneda.id}>{`${moneda.codigo} - ${moneda.simbolo}`}</MenuItem>))}</Select></FormControl></Grid><Grid item xs={12} md><FormControl fullWidth size="small"><InputLabel>Moneda Destino</InputLabel><Select name="moneda_destino_id" label="Moneda Destino" value={financieroSnapshot.moneda_destino_id || ''} onChange={handleMonedaChange}>{monedasDisponibles.map((moneda) => (<MenuItem key={moneda.id} value={moneda.id}>{`${moneda.codigo} - ${moneda.simbolo}`}</MenuItem>))}</Select></FormControl></Grid><Grid item xs={12} md><TextField name="tasa_compra" label="Tasa Compra" value={financieroSnapshot.tasa_compra} onChange={handleFinancieroChange} fullWidth size="small" type="number"/></Grid><Grid item xs={12} md><TextField name="tasa_venta" label="Tasa Venta" value={financieroSnapshot.tasa_venta} onChange={handleFinancieroChange} fullWidth size="small" type="number"/></Grid><Grid item xs={12} md><FormControlLabel control={<Checkbox name="incluye_iva" checked={financieroSnapshot.incluye_iva} onChange={handleFinancieroChange}/>} label="Incluye IVA" sx={{width: '100%', justifyContent: 'center'}}/></Grid></Grid></Paper>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}><Typography variant="subtitle1" sx={{ mb: 2 }}>Sección de Condiciones Comerciales</Typography><Box display="flex" gap={2}><Box flex="1 1 50%"><TextField label="Forma de Pago" multiline rows={4} fullWidth variant="outlined" value={formaPago} onChange={(e) => setFormaPago(e.target.value)}/></Box><Box flex="1 1 50%"><TextField label="Términos y Condiciones" multiline rows={4} fullWidth variant="outlined" value={terminosYCondiciones} onChange={(e) => setTerminosYCondiciones(e.target.value)}/></Box></Box></Paper>
        
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Sección de Detalle de la Cotización</Typography>
            <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setBuscarServicioModalOpen(true)} disabled={!clienteSeleccionado}>Agregar Detalle</Button>
          </Box>
          <ItemsTable 
            items={items} 
            handleItemChange={handleItemChange} 
            handleDeleteItem={handleDeleteItem} 
            simboloMoneda={financieroSnapshot.simbolo_moneda_base}
            formatCurrency={formatCurrency}
            totales={totales}
          />
           <TotalsDisplay 
                totales={totales} 
                formatCurrency={formatCurrency} 
                simboloMoneda={financieroSnapshot.simbolo_moneda_base}
                simboloMonedaDestino={financieroSnapshot.simbolo_moneda_destino}
                tasaCompra={financieroSnapshot.tasa_compra}
                monedasDisponibles={monedasDisponibles}
                monedaDestinoId={financieroSnapshot.moneda_destino_id}
            />
            <Box sx={{ clear: 'both' }} />
        </Paper>

        <Paper elevation={3} sx={{ p: 2, mt: 2 }}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Box sx={{ display: 'flex', gap: 2 }}><Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleGrabarCotizacion} disabled={isSaving}>{isSaving ? 'Grabando...' : 'Grabar Cotización'}</Button><Button variant="outlined" color="secondary" startIcon={<CleaningServicesIcon />}>Limpiar Formulario</Button></Box><Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={handleSalir}>Salir</Button></Box></Paper>
        
        <BuscarClienteModal open={isClienteModalOpen} onClose={() => setIsClienteModalOpen(false)} onSelect={handleSelectCliente} />
        {sessionData && <BuscarTipoCambioModal open={isTipoCambioModalOpen} onClose={() => setIsTipoCambioModalOpen(false)} onSelect={handleSelectTipoCambio} empresaId={sessionData.empresa_id} monedaBaseId={sessionData.tipo_cambio_moneda_base_id}/>}
        <BuscarServicioModal open={buscarServicioModalOpen} onClose={() => setBuscarServicioModalOpen(false)} onSelectServicio={handleSelectServicio} empresaId={sessionData?.empresa_id}/>
      </Container>
    </LocalizationProvider>
  );
};

export default CotizacionesIngresoPage;
