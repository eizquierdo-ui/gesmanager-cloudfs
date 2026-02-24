
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, TextField, Button, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Box, Divider, IconButton, Switch, FormControlLabel
} from '@mui/material';
import { AddCircleOutline, DeleteForever, Refresh, ExitToApp } from '@mui/icons-material';
import { amber, grey, red } from '@mui/material/colors';
import { useAppContext } from '../contexts/AppContext';

// --- Constantes & Helpers ---
const initialRubro = { descripcion_costo: '', valor: 0, tasa_fee: 0 };
const MAX_BASE_VALUE = 999999990;
const MAX_FEE_PERCENT_VALUE = 990;

const formatNumber = (value, digits = 4) => {
  if (isNaN(value) || value === null) return (0).toFixed(digits);
  const numberValue = Number(value);
  const result = numberValue.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return result === '-0.0000' ? '0.0000' : result;
};

const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return 'N/A';
  return timestamp.toDate().toLocaleDateString('es-GT');
};

// --- Componentes Reutilizables ---
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

// --- Componente Principal de la Página ---
const ModelarPreciosPage = () => {
  const { sessionData } = useAppContext();
  const navigate = useNavigate();

  // --- Estados y Memos del Contexto ---
  const tasaCompra = useMemo(() => sessionData?.tipo_cambio_tasa_compra || 1, [sessionData]);
  const monedaBaseNombre = useMemo(() => sessionData?.tipo_cambio_moneda_base || 'Quetzal', [sessionData]);
  const monedaDestinoNombre = useMemo(() => sessionData?.tipo_cambio_moneda_destino || 'Dolar', [sessionData]);
  const fechaCambio = useMemo(() => formatDate(sessionData?.tipo_cambio_fecha), [sessionData]);

  // --- Estados Locales ---
  const [rubros, setRubros] = useState([{...initialRubro}]);
  const [tasaImpuestos, setTasaImpuestos] = useState(21);
  const [ivaPorcentaje, setIvaPorcentaje] = useState(12);
  const [isrPorcentaje, setIsrPorcentaje] = useState(7);
  const [itpPorcentaje, setItpPorcentaje] = useState(0.5);
  const [aplicaITP, setAplicaITP] = useState(false);

  // --- Handlers ---
  const handleRubroChange = (index, field, value) => {
    const newRubros = [...rubros];
    if (field === 'descripcion_costo') {
      newRubros[index][field] = value;
    } else {
      let numericValue = parseFloat(value) || 0;
      if (numericValue < 0) numericValue = 0;
      if (field === 'valor' && numericValue > MAX_BASE_VALUE) numericValue = MAX_BASE_VALUE;
      if (field === 'tasa_fee' && numericValue > MAX_FEE_PERCENT_VALUE) numericValue = MAX_FEE_PERCENT_VALUE;
      newRubros[index][field] = numericValue;
    }
    setRubros(newRubros);
  };

  const handleAddRubro = () => setRubros([...rubros, { ...initialRubro }]);
  const handleRemoveRubro = (index) => setRubros(rubros.filter((_, i) => i !== index));

  const handleReset = () => {
    setRubros([{...initialRubro}]);
    setTasaImpuestos(21);
    setIvaPorcentaje(12);
    setIsrPorcentaje(7);
    setItpPorcentaje(0.5);
    setAplicaITP(false);
  };

  // --- Cálculos ---
  const calculos = useMemo(() => {
    const toDestino = (valor) => valor / tasaCompra;

    const rubrosCalculados = rubros.map(rubro => {
        const base = rubro.valor || 0;
        const feePercent = rubro.tasa_fee || 0;
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
    const itpFactor = aplicaITP ? itpPorcentaje / 100 : 0;
    const itpValor = subTotal * itpFactor;
    const costoFeeFinal = subTotal - isrValor - itpValor;

    return {
        toDestino, rubrosCalculados, totalesRubros, feeGlobal, costoFeeGlobal, 
        impuestosValor, precioVenta, ivaValor, subTotal, isrValor, 
        itpValor, itpFactor, costoFeeFinal
    };
  }, [rubros, tasaImpuestos, ivaPorcentaje, isrPorcentaje, itpPorcentaje, aplicaITP, tasaCompra]);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${grey[300]}`}}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                Modelador de Precios
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Tipo Cambio: {fechaCambio} | Tasa Compra: {formatNumber(tasaCompra, 4)}
            </Typography>
        </Box>

        <Box sx={{ p: { xs: 1.5, sm: 2 }, backgroundColor: grey[50] }}>
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
                                <TableCell sx={{p: '4px 8px'}}><TextField fullWidth variant="outlined" placeholder="Descripción del costo" size="small" value={rubro.descripcion_costo} onChange={e => handleRubroChange(index, 'descripcion_costo', e.target.value)} /></TableCell>
                                <TableCell sx={{p: '4px 8px'}}><InputField value={rubro.valor} onChange={e => handleRubroChange(index, 'valor', e.target.value)} /></TableCell>
                                <TableCell sx={{p: '4px 8px'}}><InputField value={rubro.tasa_fee} onChange={e => handleRubroChange(index, 'tasa_fee', e.target.value)} /></TableCell>
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
                <Table size="small" sx={{'& .MuiTableCell-root': { border: 'none', padding: '2px 12px'}}}>
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
                        <TableRow sx={{backgroundColor: amber[100], borderTop: `1px solid ${grey[300]}`}}> <TableCell sx={{fontWeight: 'bold'}}>Precio Venta</TableCell> <TableCell></TableCell> <TableCell align="right" sx={{fontWeight: 'bold'}}>{formatNumber(calculos.precioVenta, 2)}</TableCell> <TableCell align="right" sx={{fontWeight: 'bold'}}>{formatNumber(calculos.toDestino(calculos.precioVenta), 2)}</TableCell> </TableRow>
                        <TableRow hover> <TableCell>% IVA</TableCell> <TableCell align="right"><InputField value={ivaPorcentaje} onChange={e => setIvaPorcentaje(parseFloat(e.target.value) || 0)}/></TableCell> <TableCell align="right" sx={{color: 'red'}}>{formatNumber(-calculos.ivaValor, 4)}</TableCell> <TableCell align="right" sx={{color: 'red'}}>{formatNumber(calculos.toDestino(-calculos.ivaValor), 4)}</TableCell> </TableRow>
                        <TableRow hover> <TableCell sx={{fontWeight: 500}}>Sub Total</TableCell> <TableCell></TableCell> <HighlightedCell>{formatNumber(calculos.subTotal, 4)}</HighlightedCell> <HighlightedCell>{formatNumber(calculos.toDestino(calculos.subTotal), 4)}</HighlightedCell> </TableRow>
                        <TableRow hover> <TableCell>% ISR</TableCell> <TableCell align="right"><InputField value={isrPorcentaje} onChange={e => setIsrPorcentaje(parseFloat(e.target.value) || 0)}/></TableCell> <TableCell align="right" sx={{color: 'red'}}>{formatNumber(-calculos.isrValor, 4)}</TableCell> <TableCell align="right" sx={{color: 'red'}}>{formatNumber(calculos.toDestino(-calculos.isrValor), 4)}</TableCell> </TableRow>
                        <TableRow hover> 
                            <TableCell>
                                <FormControlLabel control={<Switch checked={aplicaITP} onChange={(e) => setAplicaITP(e.target.checked)} size="small" />} label="% ITP" sx={{mr: 0}}/>
                            </TableCell> 
                            <TableCell align="right"><InputField value={itpPorcentaje} onChange={e => setItpPorcentaje(parseFloat(e.target.value) || 0)}/></TableCell> 
                            <TableCell align="right" sx={{color: 'red'}}>{formatNumber(-calculos.itpValor, 4)}</TableCell> 
                            <TableCell align="right" sx={{color: 'red'}}>{formatNumber(calculos.toDestino(-calculos.itpValor), 4)}</TableCell> 
                        </TableRow>
                        <TableRow sx={{backgroundColor: amber[100], borderTop: `2px solid ${grey[400]}`}}> <TableCell sx={{fontWeight: 'bold'}}>Costo+Fee (Final)</TableCell> <TableCell></TableCell> <TableCell align="right" sx={{fontWeight: 'bold'}}>{formatNumber(calculos.costoFeeFinal, 4)}</TableCell> <TableCell align="right" sx={{fontWeight: 'bold'}}>{formatNumber(calculos.toDestino(calculos.costoFeeFinal), 4)}</TableCell> </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2, borderTop: `1px solid ${grey[300]}`}}>
            <Button onClick={() => navigate('/')} variant="outlined" color="secondary" startIcon={<ExitToApp />}>Salir</Button>
            <Button onClick={handleReset} variant="contained" color="primary" startIcon={<Refresh />}>Limpiar</Button>
      </Box>
      </Paper>
    </Container>
  );
};

export default ModelarPreciosPage;
