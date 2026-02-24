import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, TextField, Button, Grid, Chip,
  FormControlLabel, Checkbox, Select, MenuItem, InputLabel, FormControl
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

const initialTotals = { total_costo_base: 0, total_cotizacion_base: 0, total_cotizacion_final: 0, total_tasa_descuento_aplicada: 0, total_tasa_feeglobal_aplicada: 0, tasa_iva_aplicada: 0.12, monto_iva_total: 0, sub_total_sin_iva: 0, sub_total_base_tp: 0, tasa_tp_aplicada: 0.005, monto_tp_total: 0, isr_calculado: { monto_tramo_1: 0, monto_tramo_2: 0, monto_isr_total: 0, }, };

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
  const [financieroSnapshot, setFinancieroSnapshot] = useState({ tipocambio_id: '', moneda_base_id: '', simbolo_moneda_base: '', moneda_destino_id: '', simbolo_moneda_destino: '', tasa_compra: 0, tasa_venta: 0, fecha_tipocambio: new Date(), incluye_iva: true, });

  const recalculateLine = useCallback((item, incluyeIva) => {
    const newItem = { ...item };
    const cantidad = parseFloat(newItem.cantidad) || 0;
    const precioVentaFinal = parseFloat(newItem.precio_venta_final_linea) || 0;
    const ivaTasa = parseFloat(newItem.iva_tasa_linea) || 0;
    const tpTasa = parseFloat(newItem.tp_tasa_linea) || 0;
    newItem.total_linea = cantidad * precioVentaFinal;
    newItem.iva_total_linea = incluyeIva ? newItem.total_linea - (newItem.total_linea / (1 + ivaTasa)) : 0;
    newItem.sub_total_sin_iva_linea = newItem.total_linea - newItem.iva_total_linea;
    newItem.sub_total_base_tp_linea = newItem.itp_servicio ? newItem.sub_total_sin_iva_linea : 0;
    newItem.tp_total_linea = newItem.sub_total_base_tp_linea * tpTasa;
    return newItem;
  }, []);

  const handleItemChange = useCallback((index, field, value) => {
    setItems(prevItems => {
        const updatedItems = [...prevItems];
        const itemToUpdate = { ...updatedItems[index] };
        itemToUpdate[field] = value;
        if ([ 'cantidad', 'itp_servicio'].includes(field)) {
            updatedItems[index] = recalculateLine(itemToUpdate, financieroSnapshot.incluye_iva);
        } else if (field === 'tasa_descuento_aplicada') {
            const numericValue = parseFloat(value) || 0;
            const basePrice = itemToUpdate.precio_venta_base_linea;
            itemToUpdate.precio_venta_final_linea = basePrice * (1 - (numericValue / 100));
            updatedItems[index] = recalculateLine(itemToUpdate, financieroSnapshot.incluye_iva);
        } else if (field === 'precio_venta_final_linea') {
            const numericValue = parseFloat(value) || 0;
            const basePrice = itemToUpdate.precio_venta_base_linea;
            itemToUpdate.tasa_descuento_aplicada = basePrice > 0 ? 100 - (100 * (numericValue / basePrice)) : 0;
            updatedItems[index] = recalculateLine(itemToUpdate, financieroSnapshot.incluye_iva);
        } else {
          updatedItems[index] = itemToUpdate;
        }
        return updatedItems;
    });
  }, [recalculateLine, financieroSnapshot.incluye_iva]);

  const handleSelectServicio = useCallback((servicio) => {
    const precioBase = servicio.precios_calculados?.precio_venta_base || 0;
    let newItem = { id_temporal: Date.now(), categoria_id: servicio.categoria_id, servicio_id: servicio.id, cantidad: 1, nombre_servicio: servicio.nombre_servicio, detalle_queincluyeservicio: servicio.detalle_queincluyeservicio, itp_servicio: servicio.itp, costo_total_linea: servicio.precios_calculados?.costo_total_base || 0, precio_venta_base_linea: precioBase, precio_venta_final_linea: precioBase, tasa_descuento_aplicada: 0, iva_tasa_linea: 0.12, tp_tasa_linea: 0.005, };
    const calculatedItem = recalculateLine(newItem, financieroSnapshot.incluye_iva);
    setItems(prev => [...prev, calculatedItem]);
    setBuscarServicioModalOpen(false);
  }, [recalculateLine, financieroSnapshot.incluye_iva]);

  const handleDeleteItem = useCallback((index) => { setItems(prev => prev.filter((_, i) => i !== index)); }, []);

  useEffect(() => {
    const newTotals = items.reduce((acc, item) => { acc.total_costo_base += item.costo_total_linea || 0; acc.total_cotizacion_base += (item.precio_venta_base_linea || 0) * (item.cantidad || 0); acc.total_cotizacion_final += item.total_linea || 0; acc.monto_iva_total += item.iva_total_linea || 0; acc.sub_total_sin_iva += item.sub_total_sin_iva_linea || 0; acc.sub_total_base_tp += item.sub_total_base_tp_linea || 0; acc.monto_tp_total += item.tp_total_linea || 0; return acc; }, { ...initialTotals });
    newTotals.total_tasa_descuento_aplicada = newTotals.total_cotizacion_base > 0 ? 100 - (100 * newTotals.total_cotizacion_final / newTotals.total_cotizacion_base) : 0;
    setTotales(newTotals);
  }, [items, financieroSnapshot.incluye_iva]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try { const querySnapshot = await getDocs(collection(db, 'monedas')); setMonedasDisponibles(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); } catch (error) { console.error("Error al cargar monedas:", error); }
      const q = query(collection(db, 'cotizaciones'), orderBy('numero_cotizacion', 'desc'), limit(1));
      try { const querySnapshot = await getDocs(q); if (!querySnapshot.empty) { const ultimoDoc = querySnapshot.docs[0].data(); setUltimaCotizacion(ultimoDoc.numero_cotizacion); const [anio, corr] = ultimoDoc.numero_cotizacion.split('-'); const proximoCorr = (parseInt(corr, 10) + 1).toString().padStart(4, '0'); setProximaCotizacion(`${anio}-${proximoCorr}`); } } catch (error) { console.error("Error al obtener correlativo:", error); }
      if (sessionData && sessionData.tipo_cambio_id) { setFinancieroSnapshot(prev => ({ ...prev, tipocambio_id: sessionData.tipo_cambio_id, moneda_base_id: sessionData.tipo_cambio_moneda_base_id, simbolo_moneda_base: sessionData.tipo_cambio_moneda_base_simbolo, moneda_destino_id: sessionData.tipo_cambio_moneda_destino_id, simbolo_moneda_destino: sessionData.tipo_cambio_moneda_destino_simbolo, tasa_compra: sessionData.tipo_cambio_tasa_compra, tasa_venta: sessionData.tipo_cambio_tasa_venta, fecha_tipocambio: sessionData.tipo_cambio_fecha ? sessionData.tipo_cambio_fecha.toDate() : new Date() })); }
    };
    fetchInitialData();
  }, [sessionData]);

  useEffect(() => { if (fechaEmision && diasVigencia > 0) { const resultDate = new Date(fechaEmision); resultDate.setDate(resultDate.getDate() + parseInt(diasVigencia, 10)); setFechaVigencia(resultDate.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })); } else { setFechaVigencia(''); } }, [fechaEmision, diasVigencia]);
  useEffect(() => { if (sessionData) { const infoPago = `Cheques a nombre de VOICE, S.A.\nDeposito a Cta. Monetaria en Q. No. 7500030916 del Banco BI a nombre de VOICE, S.A.\n50% de anticipo al dar por aceptada esta cotización y 50% al finalizar.`; const terminos = `Los precios ya incluyen el IVA.\nIncluye Timbre de Prensa.\nLa presente cotización tiene una vigencia de ${diasVigencia} días.\nCualquier servicio solicitado que no esté descrito en la cotización se cobrará extra.\nTipo de cambio es de $ 1.00 por Q. ${sessionData.tipo_cambio_tasa_venta.toFixed(4)}`; setFormaPago(infoPago); setTerminosYCondiciones(terminos); } }, [sessionData, diasVigencia]);

  const handleFinancieroChange = (event) => { const { name, value, type, checked } = event.target; const isCheckbox = type === 'checkbox'; setFinancieroSnapshot(prev => ({ ...prev, [name]: isCheckbox ? checked : value })); if (isCheckbox && name === 'incluye_iva') { setItems(currentItems => currentItems.map(item => recalculateLine(item, checked))); } };
  const handleMonedaChange = (event) => { const { name, value } = event.target; const monedaSeleccionada = monedasDisponibles.find(m => m.id === value); if (monedaSeleccionada) { if (name === 'moneda_base_id') { setFinancieroSnapshot(prev => ({ ...prev, moneda_base_id: monedaSeleccionada.id, simbolo_moneda_base: monedaSeleccionada.simbolo })); } else if (name === 'moneda_destino_id') { setFinancieroSnapshot(prev => ({ ...prev, moneda_destino_id: monedaSeleccionada.id, simbolo_moneda_destino: monedaSeleccionada.simbolo })); } } };
  const handleSelectCliente = (cliente) => { setClienteSeleccionado(cliente); setIsClienteModalOpen(false); };
  const handleSelectTipoCambio = (tipoCambio) => { setFinancieroSnapshot({ ...financieroSnapshot, tipocambio_id: tipoCambio.id, moneda_base_id: tipoCambio.moneda_base_id, simbolo_moneda_base: tipoCambio.simbolo_moneda_base, moneda_destino_id: tipoCambio.moneda_destino_id, simbolo_moneda_destino: tipoCambio.simbolo_moneda_destino, tasa_compra: tipoCambio.tasa_compra, tasa_venta: tipoCambio.tasa_venta, fecha_tipocambio: tipoCambio.fecha.toDate(), }); setIsTipoCambioModalOpen(false); };
  const handleSalir = () => navigate('/');

  // --- CORRECCIÓN DEFINITIVA DE GUARDADO ---
  const handleGrabarCotizacion = async () => {
    if (!clienteSeleccionado) { alert("Debe seleccionar un cliente."); return; }
    if (items.length === 0) { alert("Debe agregar al menos un detalle."); return; }

    setIsSaving(true);
    try {
      const itemsParaGrabar = items.map(item => {
        const { id_temporal, ...itemRest } = item;
        const finalItem = recalculateLine(itemRest, financieroSnapshot.incluye_iva);
        
        // Asegurar que todos los valores son números antes de usar toFixed
        const safeNumber = (value) => parseFloat(value) || 0;

        return {
            categoria_id: finalItem.categoria_id, servicio_id: finalItem.servicio_id, nombre_servicio: finalItem.nombre_servicio,
            detalle_queincluyeservicio: finalItem.detalle_queincluyeservicio, itp_servicio: finalItem.itp_servicio,
            cantidad: safeNumber(finalItem.cantidad),
            costo_total_linea: parseFloat(safeNumber(finalItem.costo_total_linea).toFixed(4)),
            precio_venta_base_linea: parseFloat(safeNumber(finalItem.precio_venta_base_linea).toFixed(4)),
            precio_venta_final_linea: parseFloat(safeNumber(finalItem.precio_venta_final_linea).toFixed(4)),
            tasa_descuento_aplicada: parseFloat(safeNumber(finalItem.tasa_descuento_aplicada).toFixed(4)),
            iva_tasa_linea: parseFloat(safeNumber(finalItem.iva_tasa_linea).toFixed(4)),
            tp_tasa_linea: parseFloat(safeNumber(finalItem.tp_tasa_linea).toFixed(4)),
            iva_total_linea: parseFloat(safeNumber(finalItem.iva_total_linea).toFixed(4)),
            tp_total_linea: parseFloat(safeNumber(finalItem.tp_total_linea).toFixed(4)),
            total_linea: parseFloat(safeNumber(finalItem.total_linea).toFixed(2)),
            sub_total_sin_iva_linea: parseFloat(safeNumber(finalItem.sub_total_sin_iva_linea).toFixed(2)),
            sub_total_base_tp_linea: parseFloat(safeNumber(finalItem.sub_total_base_tp_linea).toFixed(2)),
        };
      });

      const totalesParaGrabar = {
        total_costo_base: parseFloat((totales.total_costo_base || 0).toFixed(2)),
        total_cotizacion_base: parseFloat((totales.total_cotizacion_base || 0).toFixed(2)),
        total_cotizacion_final: parseFloat((totales.total_cotizacion_final || 0).toFixed(2)),
        sub_total_sin_iva: parseFloat((totales.sub_total_sin_iva || 0).toFixed(2)),
        sub_total_base_tp: parseFloat((totales.sub_total_base_tp || 0).toFixed(2)),
        total_tasa_descuento_aplicada: parseFloat((totales.total_tasa_descuento_aplicada || 0).toFixed(4)),
        total_tasa_feeglobal_aplicada: parseFloat((totales.total_tasa_feeglobal_aplicada || 0).toFixed(4)),
        tasa_iva_aplicada: parseFloat((totales.tasa_iva_aplicada || 0).toFixed(4)),
        monto_iva_total: parseFloat((totales.monto_iva_total || 0).toFixed(4)),
        tasa_tp_aplicada: parseFloat((totales.tasa_tp_aplicada || 0).toFixed(4)),
        monto_tp_total: parseFloat((totales.monto_tp_total || 0).toFixed(4)),
        isr_calculado: { ...totales.isr_calculado }
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
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}><Typography variant="subtitle1">Sección de Detalle de la Cotización</Typography><Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setBuscarServicioModalOpen(true)} disabled={!clienteSeleccionado}>Agregar Detalle</Button></Box><ItemsTable items={items} handleItemChange={handleItemChange} handleDeleteItem={handleDeleteItem} simboloMoneda={financieroSnapshot.simbolo_moneda_base}/></Paper>
        <Paper elevation={3} sx={{ p: 2, mt: 2 }}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Box sx={{ display: 'flex', gap: 2 }}><Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleGrabarCotizacion} disabled={isSaving}>{isSaving ? 'Grabando...' : 'Grabar Cotización'}</Button><Button variant="outlined" color="secondary" startIcon={<CleaningServicesIcon />}>Limpiar Formulario</Button></Box><Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={handleSalir}>Salir</Button></Box></Paper>
        <BuscarClienteModal open={isClienteModalOpen} onClose={() => setIsClienteModalOpen(false)} onSelect={handleSelectCliente} />
        {sessionData && <BuscarTipoCambioModal open={isTipoCambioModalOpen} onClose={() => setIsTipoCambioModalOpen(false)} onSelect={handleSelectTipoCambio} empresaId={sessionData.empresa_id} monedaBaseId={sessionData.tipo_cambio_moneda_base_id}/>}
        <BuscarServicioModal open={buscarServicioModalOpen} onClose={() => setBuscarServicioModalOpen(false)} onSelectServicio={handleSelectServicio} empresaId={sessionData?.empresa_id}/>
      </Container>
    </LocalizationProvider>
  );
};

export default CotizacionesIngresoPage;
