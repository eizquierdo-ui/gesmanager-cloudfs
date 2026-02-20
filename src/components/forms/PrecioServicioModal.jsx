
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
const initialRubro = { nombre: '', base: 0, fee_percent: 0 };
const MAX_BASE_VALUE = 999999990;
const MAX_FEE_PERCENT_VALUE = 990;

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

const InputField = ({ value, onChange, placeholder = '' }) => (
    <TextField 
        type="number" 
        variant="outlined" 
        size="small" 
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        fullWidth
        inputProps={{ style: { textAlign: 'right' } }}
    />
);


// --- Componente Principal ---
const PrecioServicioModal = ({ open, onClose, servicio, onSave }) => {
  const { sessionData } = useAppContext();

  // --- Estados y Memos del Contexto ---
  const tasaCompra = useMemo(() => sessionData?.tipo_cambio_tasa_compra || 1, [sessionData]);
  const monedaBaseNombre = useMemo(() => sessionData?.tipo_cambio_moneda_base || 'Quetzal', [sessionData]);
  const monedaDestinoNombre = useMemo(() => sessionData?.tipo_cambio_moneda_destino || 'Dolar', [sessionData]);
  const fechaCambio = useMemo(() => formatDate(sessionData?.tipo_cambio_fecha), [sessionData]);

  // --- Estados del Componente ---
  const [rubros, setRubros] = useState([]);
  const [tasaImpuestos, setTasaImpuestos] = useState(21);
  const [ivaPorcentaje, setIvaPorcentaje] = useState(12);
  const [isrPorcentaje, setIsrPorcentaje] = useState(7);
  const [itpPorcentaje, setItpPorcentaje] = useState(0.5);


  // --- Efecto de Inicialización ---
  useEffect(() => {
    if (servicio) {
      const initialRubros = servicio.rubros_detalle?.length > 0 ? servicio.rubros_detalle.map(r => ({...r})) : [{ ...initialRubro }];
      setRubros(initialRubros);
      setTasaImpuestos(servicio.precios_calculados?.tasa_impuestos || 21);
      setIvaPorcentaje(servicio.precios_calculados?.iva_porcentaje || 12);
      setIsrPorcentaje(servicio.precios_calculados?.isr_porcentaje_manual || 7);
      setItpPorcentaje(servicio.precios_calculados?.itp_porcentaje_manual || 0.5);
    } else {
        setRubros([{...initialRubro}]);
    }
  }, [servicio]);

  // --- Handlers ---
  const handleRubroChange = (index, field, value) => {
    const newRubros = [...rubros];
    if (field === 'nombre') {
      newRubros[index][field] = value;
    } else {
      let numericValue = parseFloat(value) || 0;
      if (numericValue < 0) numericValue = 0;
      if (field === 'base' && numericValue > MAX_BASE_VALUE) numericValue = MAX_BASE_VALUE;
      if (field === 'fee_percent' && numericValue > MAX_FEE_PERCENT_VALUE) numericValue = MAX_FEE_PERCENT_VALUE;
      newRubros[index][field] = numericValue;
    }
    setRubros(newRubros);
  };

  const handleAddRubro = () => setRubros([...rubros, { ...initialRubro }]);
  const handleRemoveRubro = (index) => setRubros(rubros.filter((_, i) => i !== index));

  // --- Cálculos ---
  const calculos = useMemo(() => {
    const toDestino = (valor) => valor / tasaCompra;

    const rubrosCalculados = rubros.map(rubro => {
        const base = rubro.base || 0;
        const feePercent = rubro.fee_percent || 0;
        const costoMasFee = feePercent >= 100 ? base : base / (1 - (feePercent / 100));
        const fee = costoMasFee - base;
        const dolar = toDestino(costoMasFee);
        return { ...rubro, base, fee, costoMasFee, dolar };
    });

    const totalesRubros = rubrosCalculados.reduce((acc, r) => {
        acc.base += r.base;
        acc.fee += r.fee;
        acc.costoMasFee += r.costoMasFee;
        acc.dolar += r.dolar;
        return acc;
    }, { base: 0, fee: 0, costoMasFee: 0, dolar: 0 });

    const feeGlobal = (totalesRubros.fee / totalesRubros.costoMasFee) * 100 || 0;
    const costoFeeGlobal = totalesRubros.costoMasFee;
    const impuestosValor = costoFeeGlobal * (tasaImpuestos / 100);
    const precioVenta = costoFeeGlobal + impuestosValor;

    const ivaValor = precioVenta - (precioVenta / (1 + ivaPorcentaje / 100));
    const subTotal = precioVenta - ivaValor;
    
    const isrValor = subTotal * (isrPorcentaje / 100);

    const itpFactor = servicio?.itp ? itpPorcentaje / 100 : 0;
    const itpValor = subTotal * itpFactor;
    const costoFeeFinal = subTotal - isrValor - itpValor;

    return {
        toDestino, rubrosCalculados, totalesRubros, feeGlobal, costoFeeGlobal, 
        impuestosValor, precioVenta, ivaValor, subTotal, isrValor, 
        itpValor, itpFactor, costoFeeFinal
    };
  }, [rubros, tasaImpuestos, ivaPorcentaje, isrPorcentaje, itpPorcentaje, servicio?.itp, tasaCompra]);

  const handleSave = () => {
    if (!onSave || !servicio) return;
    const dataToSave = {
      rubros_detalle: calculos.rubrosCalculados.map(({fee, costoMasFee, dolar, ...rest}) => rest),
      itp: servicio.itp,
      precios_calculados: {
        tasa_impuestos: tasaImpuestos,
        iva_porcentaje: ivaPorcentaje,
        isr_porcentaje_manual: isrPorcentaje,
        itp_porcentaje_manual: itpPorcentaje,
        // ... (resto de los campos)
      },
    };
    onSave(servicio.id, dataToSave);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', borderBottom: `1px solid ${grey[300]}`}}>
        Actualizar Precios del Servicio: 
        <Typography component="span" variant="h6" color="primary"> {servicio?.nombre_servicio}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Tipo Cambio: {fechaCambio} | Tasa Compra: {formatNumber(tasaCompra, 4)}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1, sm: 2 }, backgroundColor: grey[50] }}>
        
        <Typography variant="h6" gutterBottom sx={{mt: 1, fontSize: '1.1rem'}}>Costos</Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
            <Table size="small">
                <TableHead sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', backgroundColor: grey[200], padding: '6px 8px' } }}>
                    <TableRow>
                        <TableCell sx={{width: '35%'}}>Costos</TableCell>
                        <TableCell align="right">{monedaBaseNombre}</TableCell>
                        <TableCell align="right">% Fee</TableCell>
                        <TableCell align="right">Costo+Fee</TableCell>
                        <TableCell align="right">{monedaDestinoNombre}</TableCell>
                        <TableCell align="center" sx={{width: '5%'}}></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {calculos.rubrosCalculados.map((rubro, index) => (
                        <TableRow key={index} hover>
                            <TableCell sx={{p: '4px 8px'}}><TextField fullWidth variant="outlined" size="small" value={rubro.nombre} onChange={e => handleRubroChange(index, 'nombre', e.target.value)} /></TableCell>
                            <TableCell sx={{p: '4px 8px'}}><InputField value={rubro.base} onChange={e => handleRubroChange(index, 'base', e.target.value)} /></TableCell>
                            <TableCell sx={{p: '4px 8px'}}><InputField value={rubro.fee_percent} onChange={e => handleRubroChange(index, 'fee_percent', e.target.value)} /></TableCell>
                            <TableCell align="right" sx={{fontWeight: 500, minWidth: '110px', p: '4px 8px'}}>{formatNumber(rubro.costoMasFee, 4)}</TableCell>
                            <TableCell align="right" sx={{minWidth: '110px', p: '4px 8px'}}>{formatNumber(rubro.dolar, 4)}</TableCell>
                            <TableCell align="center" sx={{p: '0 8px'}}><IconButton size="small" onClick={() => handleRemoveRubro(index)}><DeleteForever sx={{color: red[500]}}/></IconButton></TableCell>
                        </TableRow>
                    ))}
                    <TableRow sx={{backgroundColor: grey[200], '& .MuiTableCell-root': {fontWeight: 'bold', borderTop: '2px solid black', padding: '8px'}}}>
                        <TableCell>TOTAL RUBROS</TableCell>
                        <TableCell align="right">{formatNumber(calculos.totalesRubros.base, 2)}</TableCell>
                        <TableCell></TableCell>
                        <HighlightedCell align="right" bold sx={{p: '8px'}}>{formatNumber(calculos.totalesRubros.costoMasFee, 2)}</HighlightedCell>
                        <TableCell align="right">{formatNumber(calculos.totalesRubros.dolar, 2)}</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
        <Button startIcon={<AddCircleOutline />} onClick={handleAddRubro} variant="text" size="small">+ Agregar Costo</Button>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom sx={{fontSize: '1.1rem'}}>Resumen de Precios</Typography>
        <TableContainer component={Paper} variant="outlined">
            <Table size="small" sx={{'& .MuiTableCell-root': { border: 'none', padding: '4px 12px'}}}>
                <TableHead sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', backgroundColor: grey[200] } }}>
                    <TableRow>
                        <TableCell sx={{width: '35%'}}>Concepto</TableCell>
                        <TableCell sx={{width: '15%'}} align="right">Tasa</TableCell>
                        <TableCell align="right">{monedaBaseNombre}</TableCell>
                        <TableCell align="right">{monedaDestinoNombre}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow hover> <TableCell>Costo Total</TableCell> <TableCell></TableCell> <TableCell align="right">{formatNumber(calculos.totalesRubros.base, 4)}</TableCell> <TableCell align="right">{formatNumber(calculos.toDestino(calculos.totalesRubros.base), 4)}</TableCell> </TableRow>
                    <TableRow hover> <TableCell>% Fee Global</TableCell> <TableCell align="right">{formatNumber(calculos.feeGlobal, 2)}%</TableCell> <TableCell align="right">{formatNumber(calculos.totalesRubros.fee, 4)}</TableCell> <TableCell align="right">{formatNumber(calculos.toDestino(calculos.totalesRubros.fee), 4)}</TableCell> </TableRow>
                    <TableRow sx={{borderTop: `1px solid ${grey[300]}`}} hover> <TableCell sx={{fontWeight: 500}}>Costo+Fee Global</TableCell> <TableCell></TableCell> <HighlightedCell bold>{formatNumber(calculos.costoFeeGlobal, 4)}</HighlightedCell> <HighlightedCell bold>{formatNumber(calculos.toDestino(calculos.costoFeeGlobal), 4)}</HighlightedCell> </TableRow>
                    <TableRow hover> <TableCell>% Impuestos</TableCell> <TableCell align="right"><InputField value={tasaImpuestos} onChange={e => setTasaImpuestos(parseFloat(e.target.value) || 0)}/></TableCell> <TableCell align="right">{formatNumber(calculos.impuestosValor, 4)}</TableCell> <TableCell align="right">{formatNumber(calculos.toDestino(calculos.impuestosValor), 4)}</TableCell> </TableRow>
                    <TableRow sx={{backgroundColor: amber[100], borderTop: `1px solid ${grey[300]}`}}> <TableCell sx={{fontWeight: 'bold'}}>Precio Venta</TableCell> <TableCell></TableCell> <TableCell align="right" sx={{fontWeight: 'bold'}}>{formatNumber(calculos.precioVenta, 4)}</TableCell> <TableCell align="right" sx={{fontWeight: 'bold'}}>{formatNumber(calculos.toDestino(calculos.precioVenta), 4)}</TableCell> </TableRow>
                    <TableRow hover> <TableCell>% IVA</TableCell> <TableCell align="right"><InputField value={ivaPorcentaje} onChange={e => setIvaPorcentaje(parseFloat(e.target.value) || 0)}/></TableCell> <TableCell align="right" sx={{color: 'red'}}>{formatNumber(-calculos.ivaValor, 4)}</TableCell> <TableCell align="right" sx={{color: 'red'}}>{formatNumber(calculos.toDestino(-calculos.ivaValor), 4)}</TableCell> </TableRow>
                    <TableRow hover> <TableCell sx={{fontWeight: 500}}>Sub Total</TableCell> <TableCell></TableCell> <HighlightedCell>{formatNumber(calculos.subTotal, 4)}</HighlightedCell> <HighlightedCell>{formatNumber(calculos.toDestino(calculos.subTotal), 4)}</HighlightedCell> </TableRow>
                    <TableRow hover> <TableCell>% ISR</TableCell> <TableCell align="right"><InputField value={isrPorcentaje} onChange={e => setIsrPorcentaje(parseFloat(e.target.value) || 0)}/></TableCell> <TableCell align="right" sx={{color: 'red'}}>{formatNumber(-calculos.isrValor, 4)}</TableCell> <TableCell align="right" sx={{color: 'red'}}>{formatNumber(calculos.toDestino(-calculos.isrValor), 4)}</TableCell> </TableRow>
                    <TableRow hover> <TableCell>% ITP</TableCell> <TableCell align="right"><InputField value={itpPorcentaje} onChange={e => setItpPorcentaje(parseFloat(e.target.value) || 0)}/></TableCell> <TableCell align="right" sx={{color: 'red'}}>{formatNumber(-calculos.itpValor, 4)}</TableCell> <TableCell align="right" sx={{color: 'red'}}>{formatNumber(calculos.toDestino(-calculos.itpValor), 4)}</TableCell> </TableRow>
                    <TableRow sx={{backgroundColor: amber[100], borderTop: `2px solid ${grey[400]}`}}> <TableCell sx={{fontWeight: 'bold'}}>Costo+Fee (Final)</TableCell> <TableCell></TableCell> <TableCell align="right" sx={{fontWeight: 'bold'}}>{formatNumber(calculos.costoFeeFinal, 4)}</TableCell> <TableCell align="right" sx={{fontWeight: 'bold'}}>{formatNumber(calculos.toDestino(calculos.costoFeeFinal), 4)}</TableCell> </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, borderTop: `1px solid ${grey[300]}`}}>
        <Button onClick={onClose} variant="outlined" color="secondary">Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary" size="large">Grabar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrecioServicioModal;
