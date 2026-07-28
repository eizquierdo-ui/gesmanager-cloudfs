
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button,
  Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Box, Divider, IconButton
} from '@mui/material';
import { AddCircleOutline, DeleteForever } from '@mui/icons-material';
import { amber, grey, red } from '@mui/material/colors';

import { useAppContext } from '../../contexts/AppContext';

// --- Constantes & Helpers ---
const RUBRO_VACIO = { descripcion_costo: '', valor: '0', tasa_fee: '0' };

const formatNumber = (value, digits = 4) => {
  if (isNaN(value) || value === null) return (0).toFixed(digits);
  const result = value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return result === '-0.0000' ? '0.0000' : result;
};

const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return 'N/A';
  return timestamp.toDate().toLocaleDateString('es-GT');
};

// --- Componentes de Celdas ---
const HighlightedCell = ({ children, align = 'right', bold = false, sx = {} }) => (
  <TableCell align={align} sx={{ backgroundColor: amber[50], fontWeight: bold ? 'bold' : '500', ...sx }}>
    {children}
  </TableCell>
);

// InputField unificado: type="text" inputMode="decimal" para permitir decimales fluidos
const InputField = ({ value, onChange, placeholder = '', readOnly = false, sx = {} }) => (
  <TextField
    type="text"
    inputMode="decimal"
    variant="outlined"
    size="small"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    fullWidth
    disabled={readOnly}
    inputProps={{
      style: { textAlign: 'right' },
      pattern: '[0-9]*[.,]?[0-9]*',
    }}
    sx={sx}
  />
);


// --- Componente Principal ---
const PrecioServicioModal = ({ open, onClose, servicio, onSave, onUpdate }) => {
  const { sessionData } = useAppContext();

  // --- Datos del tipo de cambio desde contexto ---
  const tasaCompra          = useMemo(() => sessionData?.tipo_cambio_tasa_compra || 1, [sessionData]);
  const monedaBaseNombre    = useMemo(() => sessionData?.tipo_cambio_moneda_base_simbolo || '?', [sessionData]);
  const monedaDestinoNombre = useMemo(() => sessionData?.tipo_cambio_moneda_destino_simbolo || '?', [sessionData]);
  const fechaCambio         = useMemo(() => formatDate(sessionData?.tipo_cambio_fecha), [sessionData]);

  // --- Estados (todos los numéricos como string para permitir decimales fluidos) ---
  const [rubros,          setRubros]          = useState([{ ...RUBRO_VACIO }]);
  const [tasaImpuestos,   setTasaImpuestos]   = useState('21');
  const [ivaPorcentaje,   setIvaPorcentaje]   = useState('12');
  const [isrPorcentaje,   setIsrPorcentaje]   = useState('7');
  const [itpPorcentaje,   setItpPorcentaje]   = useState('0.5');
  const [precioVentaManual, setPrecioVentaManual] = useState(null); // null = modo automático
  const [rubrosDirty,     setRubrosDirty]     = useState(false);   // flag simple de cambios en rubros

  const [precioVentaBaseAnterior,      setPrecioVentaBaseAnterior]      = useState(0);
  const [costoTotalBaseAnterior,       setCostoTotalBaseAnterior]       = useState(0);
  const [tasaGananciaGlobalAnterior,   setTasaGananciaGlobalAnterior]   = useState(0);

  // --- Inicialización al abrir el modal con un servicio ---
  useEffect(() => {
    if (servicio) {
      const precios = servicio.precios_calculados || {};
      setPrecioVentaBaseAnterior(precios.precio_venta_base || 0);
      setCostoTotalBaseAnterior(precios.costo_total_base || 0);
      setTasaGananciaGlobalAnterior(precios.tasa_ganancia_global || 0);

      // Rubros: convertir valores numéricos de Firestore a string para edición fluida
      const initialRubros = servicio.rubros_detalle?.length > 0
        ? servicio.rubros_detalle.map(r => ({
            descripcion_costo: r.descripcion_costo || '',
            valor:    String(r.valor    ?? 0),
            tasa_fee: String(r.tasa_fee ?? 0),
          }))
        : [{ ...RUBRO_VACIO }];

      setRubros(initialRubros);

      // Porcentajes como string
      setTasaImpuestos(String(precios.tasa_impuestos       ?? 21));
      setIvaPorcentaje(String(precios.iva_porcentaje        || 12));
      setIsrPorcentaje(String(precios.isr_porcentaje_manual || 7));
      setItpPorcentaje(String(precios.itp_porcentaje_manual || 0.5));

      setPrecioVentaManual(null); // siempre inicia en modo automático
      setRubrosDirty(false);       // reiniciar flag de cambios
    } else {
      setRubros([{ ...RUBRO_VACIO }]);
      setRubrosDirty(false);
    }
  }, [servicio]);

  // --- Handlers de Rubros ---
  // Almacena string crudo — sin parseFloat inmediato — para permitir escribir decimales
  const handleRubroChange = (index, field, rawValue) => {
    const newRubros = [...rubros];
    newRubros[index] = { ...newRubros[index], [field]: rawValue };
    setRubros(newRubros);
    setRubrosDirty(true); // marcar cambio inmediatamente
  };

  const handleAddRubro = () => { setRubros([...rubros, { ...RUBRO_VACIO }]); setRubrosDirty(true); };
  const handleRemoveRubro = (index) => { setRubros(rubros.filter((_, i) => i !== index)); setRubrosDirty(true); };

  // Cambiar % Impuestos no limpia el override de precio manual,
  // simplemente recalcula los montos hacia atrás con el precio fijo
  const handleTasaImpuestosChange = (rawValue) => {
    setTasaImpuestos(rawValue);
  };

  // --- Cálculos (useMemo) ---
  const calculos = useMemo(() => {
    const toDestino = (valor) => valor / tasaCompra;

    // Parsear porcentajes desde strings
    const tImpuestos = parseFloat(tasaImpuestos) || 0;
    const tIva       = parseFloat(ivaPorcentaje) || 0;
    const tIsr       = parseFloat(isrPorcentaje) || 0;
    const tItp       = parseFloat(itpPorcentaje) || 0;

    // Calcular rubros: costo inverso (margen real sobre precio de venta)
    const rubrosCalculados = rubros.map(rubro => {
      const base       = parseFloat(rubro.valor)    || 0;
      const feePercent = parseFloat(rubro.tasa_fee) || 0;
      const costoMasFee = feePercent >= 100 ? base : base / (1 - (feePercent / 100));
      const fee  = costoMasFee - base;
      const dolar = toDestino(costoMasFee);
      return { ...rubro, base, fee, costoMasFee, dolar };
    });

    const totalesRubros = rubrosCalculados.reduce((acc, r) => {
      acc.base       += r.base;
      acc.fee        += r.fee;
      acc.costoMasFee += r.costoMasFee;
      acc.dolar      += r.dolar;
      return acc;
    }, { base: 0, fee: 0, costoMasFee: 0, dolar: 0 });

    const modoOverride = precioVentaManual !== null && precioVentaManual > 0;

    let costoFeeGlobal, feeGlobal, totalesFeeGlobal, impuestosValor, precioVentaAuto, precioVenta;

    if (modoOverride) {
      precioVenta = precioVentaManual;
      // Parte 1 (hacia arriba): Costo+Fee Global = Precio Venta / (1 + %Impuestos)
      costoFeeGlobal = precioVenta / (1 + (tImpuestos / 100));
      totalesFeeGlobal = costoFeeGlobal - totalesRubros.base;
      // % Fee Global back-calculado
      feeGlobal = costoFeeGlobal > 0 ? (totalesFeeGlobal / costoFeeGlobal) * 100 : 0;
      impuestosValor = precioVenta - costoFeeGlobal; // O costoFeeGlobal * (tImpuestos/100)
      precioVentaAuto = totalesRubros.costoMasFee + (totalesRubros.costoMasFee * (tImpuestos / 100));
    } else {
      costoFeeGlobal = totalesRubros.costoMasFee;
      totalesFeeGlobal = totalesRubros.fee;
      feeGlobal = costoFeeGlobal > 0 ? (totalesFeeGlobal / costoFeeGlobal) * 100 : 0;
      impuestosValor = costoFeeGlobal * (tImpuestos / 100);
      precioVentaAuto = costoFeeGlobal + impuestosValor;
      precioVenta = precioVentaAuto;
    }

    // --- CORRECCIÓN FISCAL GUATEMALA ---
    // Sin ITP: precio incluye IVA 12%        → divisor = 1.12
    // Con ITP: precio incluye IVA 12% + 0.5% → divisor = 1.125
    const divisor   = servicio?.itp
                        ? (1 + tIva / 100 + tItp / 100)   // 1.125
                        : (1 + tIva / 100);                 // 1.12

    const subTotal  = precioVenta / divisor;
    const ivaValor  = subTotal * (tIva / 100);
    const itpValor  = servicio?.itp ? subTotal * (tItp / 100) : 0;
    const isrValor  = subTotal * (tIsr / 100);
    const costoFeeFinal = subTotal - isrValor - itpValor;

    return {
      toDestino,
      rubrosCalculados, totalesRubros,
      feeGlobal, costoFeeGlobal, totalesFeeGlobal,
      impuestosValor, precioVentaAuto, precioVenta,
      ivaValor, subTotal, isrValor, itpValor, costoFeeFinal,
    };
  }, [rubros, tasaImpuestos, ivaPorcentaje, isrPorcentaje, itpPorcentaje,
      servicio?.itp, tasaCompra, precioVentaManual]);

  // --- Detección de cambios ---
  const hasChanges = useMemo(() => {
    // 1. ¿Rubros modificados? (flag directo, más confiable que comparación de objetos)
    if (rubrosDirty) return true;

    // 2. ¿Override de precio manual activo?
    if (precioVentaManual !== null) return true;

    // 3. ¿Cambió el precio de venta calculado vs el guardado?
    const precioActual   = parseFloat(calculos.precioVenta.toFixed(2)) || 0;
    const precioAnterior = parseFloat((precioVentaBaseAnterior || 0).toFixed(2)) || 0;
    if (precioActual !== precioAnterior) return true;

    // 4. ¿Cambió algún porcentaje de impuesto?
    const preciosOrig = servicio?.precios_calculados || {};
    if ((parseFloat(tasaImpuestos) || 0) !== (preciosOrig.tasa_impuestos       ?? 21))  return true;
    if ((parseFloat(ivaPorcentaje) || 0) !== (preciosOrig.iva_porcentaje        || 12))  return true;
    if ((parseFloat(isrPorcentaje) || 0) !== (preciosOrig.isr_porcentaje_manual || 7))   return true;
    if ((parseFloat(itpPorcentaje) || 0) !== (preciosOrig.itp_porcentaje_manual || 0.5)) return true;

    return false;
  }, [
    rubrosDirty, precioVentaManual, calculos.precioVenta,
    precioVentaBaseAnterior, servicio?.precios_calculados,
    tasaImpuestos, ivaPorcentaje, isrPorcentaje, itpPorcentaje,
  ]);

  // --- Guardar ---
  const handleSave = async () => {
    if (!hasChanges || !servicio) return;

    const precios_calculados_nuevos = {
      costo_total_base:                  calculos.totalesRubros.base,
      tasa_ganancia_global:              calculos.feeGlobal,
      valorfee_global:                   calculos.totalesRubros.fee,
      costo_mas_feeglobal:               calculos.costoFeeGlobal,
      tasa_impuestos:                    parseFloat(tasaImpuestos) || 0,
      valor_impuestos:                   calculos.impuestosValor,   // typo corregido
      precio_venta_base:                 parseFloat(calculos.precioVenta.toFixed(2)),
      iva_porcentaje:                    parseFloat(ivaPorcentaje) || 0,
      isr_porcentaje_manual:             parseFloat(isrPorcentaje) || 0,
      itp_porcentaje_manual:             parseFloat(itpPorcentaje) || 0,
      tipocambio_id:                     sessionData.tipo_cambio_id,
      tipocambio_tasa_compra:            sessionData.tipo_cambio_tasa_compra,
      tipocambios_fecha_tipocambio:      sessionData.tipo_cambio_fecha,
      tipocambio_moneda_base_id:         sessionData.tipo_cambio_moneda_base_id,
      tipocambio_moneda_base_simbolo:    sessionData.tipo_cambio_moneda_base_simbolo,
      tipocambio_moneda_destino_id:      sessionData.tipo_cambio_moneda_destino_id,
      tipocambio_moneda_destino_simbolo: sessionData.tipo_cambio_moneda_destino_simbolo,
    };

    const newHistoryEntry = {
      costo_total_base_ant:     costoTotalBaseAnterior,
      precio_venta_base_ant:    precioVentaBaseAnterior,
      tasa_ganancia_global_ant: tasaGananciaGlobalAnterior,
      costo_total_base:         precios_calculados_nuevos.costo_total_base,
      precio_venta_base:        precios_calculados_nuevos.precio_venta_base,
      tasa_ganancia_global:     precios_calculados_nuevos.tasa_ganancia_global,
    };

    const dataToSave = {
      precios_calculados: precios_calculados_nuevos,
      // Serializar strings → números antes de guardar en Firestore
      rubros_detalle: calculos.rubrosCalculados.map(({ base, fee, costoMasFee, dolar, ...rest }) => ({
        ...rest,
        valor:    parseFloat(rest.valor)    || 0,
        tasa_fee: parseFloat(rest.tasa_fee) || 0,
      })),
    };

    if (onSave) await onSave(servicio.id, dataToSave, newHistoryEntry);
    onClose();
    if (onUpdate) onUpdate();
  };

  const modoOverride = precioVentaManual !== null;

  // --- Render ---
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', borderBottom: `1px solid ${grey[300]}` }}>
        Actualizar Precios del Servicio:
        <Typography component="span" variant="h6" color="primary"> {servicio?.nombre_servicio}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Tipo Cambio: {fechaCambio} | Tasa Compra: {formatNumber(tasaCompra, 4)}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1, sm: 2 }, backgroundColor: grey[50] }}>

        {/* ── SECCIÓN COSTOS ── */}
        <Typography variant="h6" gutterBottom sx={{ mt: 1, fontSize: '1.1rem' }}>Costos</Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
          <Table size="small">
            <TableHead sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', backgroundColor: grey[200], padding: '6px 8px' } }}>
              <TableRow>
                <TableCell sx={{ width: '35%' }}>Costos</TableCell>
                <TableCell align="right">{monedaBaseNombre}</TableCell>
                <TableCell align="right">% Fee</TableCell>
                <TableCell align="right">Costo+Fee</TableCell>
                <TableCell align="right">{monedaDestinoNombre}</TableCell>
                <TableCell align="center" sx={{ width: '5%' }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calculos.rubrosCalculados.map((rubro, index) => (
                <TableRow key={index} hover>
                  <TableCell sx={{ p: '4px 8px' }}>
                    <TextField
                      fullWidth variant="outlined" size="small"
                      value={rubro.descripcion_costo}
                      onChange={e => handleRubroChange(index, 'descripcion_costo', e.target.value)}
                    />
                  </TableCell>
                  <TableCell sx={{ p: '4px 8px' }}>
                    <InputField value={rubro.valor}    onChange={e => handleRubroChange(index, 'valor',    e.target.value)} />
                  </TableCell>
                  <TableCell sx={{ p: '4px 8px' }}>
                    <InputField value={rubro.tasa_fee} onChange={e => handleRubroChange(index, 'tasa_fee', e.target.value)} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, minWidth: '110px', p: '4px 8px' }}>{formatNumber(rubro.costoMasFee, 4)}</TableCell>
                  <TableCell align="right" sx={{ minWidth: '110px', p: '4px 8px' }}>{formatNumber(rubro.dolar, 4)}</TableCell>
                  <TableCell align="center" sx={{ p: '0 8px' }}>
                    <IconButton size="small" onClick={() => handleRemoveRubro(index)}>
                      <DeleteForever sx={{ color: red[500] }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ backgroundColor: grey[200], '& .MuiTableCell-root': { fontWeight: 'bold', borderTop: '2px solid black', padding: '8px' } }}>
                <TableCell>TOTAL RUBROS</TableCell>
                <TableCell align="right">{formatNumber(calculos.totalesRubros.base, 2)}</TableCell>
                <TableCell></TableCell>
                <HighlightedCell align="right" bold sx={{ p: '8px' }}>{formatNumber(calculos.totalesRubros.costoMasFee, 2)}</HighlightedCell>
                <TableCell align="right">{formatNumber(calculos.totalesRubros.dolar, 2)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Button startIcon={<AddCircleOutline />} onClick={handleAddRubro} variant="text" size="small">+ Agregar Costo</Button>

        <Divider sx={{ my: 2 }} />

        {/* ── SECCIÓN PRECIOS ── */}
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>Resumen de Precios</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" sx={{ '& .MuiTableCell-root': { border: 'none', padding: '2px 12px' } }}>
            <TableHead sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', backgroundColor: grey[200] } }}>
              <TableRow>
                <TableCell sx={{ width: '35%' }}>Concepto</TableCell>
                <TableCell sx={{ width: '15%' }} align="right">Tasa</TableCell>
                <TableCell align="right">{monedaBaseNombre}</TableCell>
                <TableCell align="right">{monedaDestinoNombre}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>

              {/* Costo Total */}
              <TableRow hover>
                <TableCell>Costo Total</TableCell>
                <TableCell></TableCell>
                <TableCell align="right">{formatNumber(calculos.totalesRubros.base, 4)}</TableCell>
                <TableCell align="right">{formatNumber(calculos.toDestino(calculos.totalesRubros.base), 4)}</TableCell>
              </TableRow>

              {/* % Fee Global */}
              <TableRow hover>
                <TableCell>% Fee Global</TableCell>
                <TableCell align="right">{formatNumber(calculos.feeGlobal, 2)}%</TableCell>
                <TableCell align="right">{formatNumber(calculos.totalesFeeGlobal, 4)}</TableCell>
                <TableCell align="right">{formatNumber(calculos.toDestino(calculos.totalesFeeGlobal), 4)}</TableCell>
              </TableRow>

              {/* Costo+Fee Global */}
              <TableRow sx={{ borderTop: `1px solid ${grey[300]}` }} hover>
                <TableCell sx={{ fontWeight: 500 }}>Costo+Fee Global</TableCell>
                <TableCell></TableCell>
                <HighlightedCell bold>{formatNumber(calculos.costoFeeGlobal, 4)}</HighlightedCell>
                <HighlightedCell bold>{formatNumber(calculos.toDestino(calculos.costoFeeGlobal), 4)}</HighlightedCell>
              </TableRow>

              {/* % Impuestos: editable siempre, no es read-only */}
              <TableRow hover>
                <TableCell>% Impuestos</TableCell>
                <TableCell align="right">
                  <InputField
                    value={tasaImpuestos}
                    onChange={e => handleTasaImpuestosChange(e.target.value)}
                  />
                </TableCell>
                <TableCell align="right">{formatNumber(calculos.impuestosValor, 4)}</TableCell>
                <TableCell align="right">{formatNumber(calculos.toDestino(calculos.impuestosValor), 4)}</TableCell>
              </TableRow>

              {/* Precio Venta: editable directamente por el usuario */}
              <TableRow sx={{ backgroundColor: amber[100], borderTop: `1px solid ${grey[300]}` }}>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Precio Venta
                  {modoOverride && (
                    <Typography component="span" variant="caption" sx={{ ml: 1, color: 'primary.main' }}> (manual)</Typography>
                  )}
                </TableCell>
                <TableCell></TableCell>
                <TableCell sx={{ minWidth: '140px' }}>
                  {/* Siempre muestra número crudo (sin comas) para que parseFloat funcione al editar */}
                  <InputField
                    value={modoOverride
                      ? String(precioVentaManual)
                      : String(calculos.precioVentaAuto.toFixed(2))}
                    onFocus={() => {
                      // Al enfocar, cambiar a modo override con el valor actual para edición limpia
                      if (!modoOverride) setPrecioVentaManual(parseFloat(calculos.precioVentaAuto.toFixed(2)));
                    }}
                    onChange={e => {
                      const raw = e.target.value;
                      if (raw === '' || raw === '.') {
                        setPrecioVentaManual(null);
                      } else {
                        // Guardar el string crudo como número solo si es válido
                        const num = parseFloat(raw);
                        if (!isNaN(num)) setPrecioVentaManual(num);
                        else setPrecioVentaManual(precioVentaManual); // mantener valor previo
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: modoOverride ? amber[50] : 'white',
                        fontWeight: 'bold',
                      },
                    }}
                  />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {formatNumber(calculos.toDestino(calculos.precioVenta), 2)}
                </TableCell>
              </TableRow>

              {/* % IVA */}
              <TableRow hover>
                <TableCell>% IVA</TableCell>
                <TableCell align="right">
                  <InputField value={ivaPorcentaje} onChange={e => setIvaPorcentaje(e.target.value)} />
                </TableCell>
                <TableCell align="right" sx={{ color: 'red' }}>{formatNumber(-calculos.ivaValor, 4)}</TableCell>
                <TableCell align="right" sx={{ color: 'red' }}>{formatNumber(calculos.toDestino(-calculos.ivaValor), 4)}</TableCell>
              </TableRow>

              {/* Sub Total */}
              <TableRow hover>
                <TableCell sx={{ fontWeight: 500 }}>Sub Total</TableCell>
                <TableCell></TableCell>
                <HighlightedCell>{formatNumber(calculos.subTotal, 4)}</HighlightedCell>
                <HighlightedCell>{formatNumber(calculos.toDestino(calculos.subTotal), 4)}</HighlightedCell>
              </TableRow>

              {/* % ISR */}
              <TableRow hover>
                <TableCell>% ISR</TableCell>
                <TableCell align="right">
                  <InputField value={isrPorcentaje} onChange={e => setIsrPorcentaje(e.target.value)} />
                </TableCell>
                <TableCell align="right" sx={{ color: 'red' }}>{formatNumber(-calculos.isrValor, 4)}</TableCell>
                <TableCell align="right" sx={{ color: 'red' }}>{formatNumber(calculos.toDestino(-calculos.isrValor), 4)}</TableCell>
              </TableRow>

              {/* % ITP */}
              <TableRow hover>
                <TableCell>% ITP</TableCell>
                <TableCell align="right">
                  <InputField value={itpPorcentaje} onChange={e => setItpPorcentaje(e.target.value)} />
                </TableCell>
                <TableCell align="right" sx={{ color: 'red' }}>{formatNumber(-calculos.itpValor, 4)}</TableCell>
                <TableCell align="right" sx={{ color: 'red' }}>{formatNumber(calculos.toDestino(-calculos.itpValor), 4)}</TableCell>
              </TableRow>

              {/* Costo+Fee Final (neto a recibir) */}
              <TableRow sx={{ backgroundColor: amber[100], borderTop: `2px solid ${grey[400]}` }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Costo+Fee (Final)</TableCell>
                <TableCell></TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatNumber(calculos.costoFeeFinal, 4)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatNumber(calculos.toDestino(calculos.costoFeeFinal), 4)}</TableCell>
              </TableRow>

            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, borderTop: `1px solid ${grey[300]}` }}>
        <Button onClick={onClose} variant="outlined" color="secondary">Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary" size="large" disabled={!hasChanges}>
          Grabar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrecioServicioModal;
