
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Container, Alert, AlertTitle, Grid, CircularProgress, 
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { doc, updateDoc, Timestamp, runTransaction, collection } from 'firebase/firestore';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import es from 'date-fns/locale/es';
import * as XLSX from 'xlsx';

import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { getCotizacionesKanban } from '../../services/firestore/cotizacionesService';
import { getClientes } from '../../services/firestore/clientesService';
import CotizacionDetalleModal from '../../components/modals/CotizacionDetalleModal';
import ImprimirCotizacionModal from '../../components/modals/ImprimirCotizacionModal';
import ConfirmarFechaEstadoModal from '../../components/modals/ConfirmarFechaEstadoModal';

// --- FUNCIONES DE UTILIDAD (SIN CAMBIOS) ---
const formatCurrency = (value) => {
  const number = parseFloat(value) || 0;
  return `Q. ${number.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (timestamp) => {
    if (!timestamp) return '';
    let date;
    if (typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else if (timestamp._seconds !== undefined && timestamp._nanoseconds !== undefined) {
        date = new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
    } else {
        date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const kanbanColumnsData = {
  borrador: { title: 'Borrador', color: '#ffc107' },
  rechazada: { title: 'Rechazada', color: '#f44336' },
  aceptada: { title: 'Aceptada', color: '#4caf50' },
  venta: { title: 'Venta', color: '#2196f3' },
  anulada: { title: 'Anulada', color: '#9e9e9e' },
};

// --- COMPONENTES DEL KANBAN (SIN CAMBIOS) ---
const KanbanCard = ({ cotizacion, onDoubleClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: cotizacion.id, data: { cotizacion } });
  const style = { transform: CSS.Translate.toString(transform), cursor: 'grab', opacity: isDragging ? 0.5 : 1 };
  
  const clienteNombre = cotizacion.cliente_snapshot?.nombre_cliente || 'N/A';
  const contactoNombre = cotizacion.cliente_snapshot?.contacto_principal?.nombre || 'N/A';
  const telefonosCombinados = `${cotizacion.cliente_snapshot?.telefono_cliente || 'N/A'} - ${cotizacion.cliente_snapshot?.contacto_principal?.telefono || 'N/A'}`;

  return (
    <div onDoubleClick={() => onDoubleClick(cotizacion)} style={{ touchAction: 'none' }}>
      <Paper ref={setNodeRef} style={style} {...listeners} {...attributes} elevation={3} sx={{ p: 1.5, mb: 1, borderRadius: '8px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{cotizacion.numero_cotizacion}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatDate(cotizacion.fecha_emision)}</Typography>
        </Box>
        <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2, mb: 0.5 }}>
            {clienteNombre}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Box>
                <Typography variant="body1" display="block" sx={{lineHeight: 1.2, fontWeight: 500}}>{contactoNombre}</Typography>
                <Typography variant="body1" display="block" sx={{lineHeight: 1.2, fontWeight: 500}}>{telefonosCombinados}</Typography>
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{formatCurrency(cotizacion.totales?.total_cotizacion_final)}</Typography>
        </Box>
      </Paper>
    </div>
  );
};

const KanbanColumn = ({ status, cotizaciones, onCardDoubleClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const columnData = kanbanColumnsData[status];
  const count = cotizaciones.length;
  const total = cotizaciones.reduce((acc, curr) => acc + (curr.totales?.total_cotizacion_final || 0), 0);
  return (
    <Box ref={setNodeRef} sx={{ flex: '1 1 280px', minWidth: 280, maxWidth: 320, display: 'flex', flexDirection: 'column', bgcolor: isOver ? 'grey.300' : 'grey.100', borderRadius: '8px', transition: 'background-color 0.2s ease-in-out' }}>
      <Box sx={{ p: 1.5, backgroundColor: columnData.color, color: '#fff', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>{columnData.title}</Typography>
        <Typography variant="body2" sx={{ fontWeight: '500' }}>{`(${count}) - ${formatCurrency(total)}`}</Typography>
      </Box>
      <Box sx={{ p: 1, flexGrow: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 420px)' }}>
        {cotizaciones.map(cot => <KanbanCard key={cot.id} cotizacion={cot} onDoubleClick={onCardDoubleClick} />)}
      </Box>
    </Box>
  );
};

// --- PÁGINA PRINCIPAL ---
const GestionReportesPage = () => {
  const navigate = useNavigate();
  const { sessionData: app, loadingSession } = useAppContext();
  const { currentUser } = useAuth(); 
  
  // ESTADOS GENERALES
  const [loading, setLoading] = useState(true);
  const [allCotizaciones, setAllCotizaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filters, setFilters] = useState({ clienteId: 'todos', fechaDesde: null, fechaHasta: null });

  // ESTADOS PARA MODALES
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const [printData, setPrintData] = useState(null); // <<< ESTADO CORRECTO PARA DATOS DE IMPRESIÓN
  
  // ESTADOS PARA DRAG AND DROP MODAL
  const [dragModalOpen, setDragModalOpen] = useState(false);
  const [pendingDrag, setPendingDrag] = useState(null);

  const fetchData = useCallback(async (currentFilters) => {
    if (!app?.empresa_id) return;
    setLoading(true);
    try {
      const data = await getCotizacionesKanban(app.empresa_id, currentFilters);
      setAllCotizaciones(data);
    } catch(error) {
      console.error("Error al buscar cotizaciones:", error);
    } finally {
      setLoading(false);
    }
  }, [app?.empresa_id]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (app?.empresa_id) {
        try {
          const clientesSnapshot = await getClientes(app.empresa_id);
          const clientesData = clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          clientesData.sort((a, b) => a.nombre_cliente.localeCompare(b.nombre_cliente));
          setClientes(clientesData);
        } catch (error) {
          console.error("Error al cargar clientes:", error);
        }
        fetchData(filters);
      }
    };
    if (!loadingSession) fetchInitialData();
  }, [loadingSession, app?.empresa_id, fetchData]);

  const cotizacionesByStatus = useMemo(() => {
    const grouped = { borrador: [], rechazada: [], aceptada: [], venta: [], anulada: [] };
    allCotizaciones.forEach(cot => {
      if (grouped[cot.estado]) grouped[cot.estado].push(cot);
    });
    return grouped;
  }, [allCotizaciones]);

  const handleDragEnd = ({ active, over }) => {
    if (!over || !active.data.current) return;
    const cotizacionArrastrada = active.data.current.cotizacion;
    const nuevoEstado = over.id;

    if (cotizacionArrastrada && cotizacionArrastrada.estado !== nuevoEstado) {
      const originalState = cotizacionArrastrada.estado;
      // Actualizamos visualmente primero
      setAllCotizaciones(prev => prev.map(c => c.id === active.id ? { ...c, estado: nuevoEstado } : c));
      // Guardamos la info del drag y abrimos el modal
      setPendingDrag({ id: active.id, nuevoEstado, originalState });
      setDragModalOpen(true);
    }
  };

  const handleConfirmDragDate = async (fechaSeleccionada) => {
    if (!pendingDrag) return;
    setDragModalOpen(false);
    
    try {
      const cotizacionRef = doc(db, 'cotizaciones', pendingDrag.id);
      const dataToUpdate = {
        estado: pendingDrag.nuevoEstado, 
        fecha_estado: fechaSeleccionada, 
        usuario_ultima_modificacion: currentUser.uid,
        fecha_ultima_modificacion: Timestamp.now(),
      };
      
      if (pendingDrag.nuevoEstado === 'aceptada') dataToUpdate.fecha_aceptacion = fechaSeleccionada;
      if (pendingDrag.nuevoEstado === 'rechazada') dataToUpdate.fecha_rechazo = fechaSeleccionada;
      if (pendingDrag.nuevoEstado === 'venta') dataToUpdate.fecha_venta_facturacion = fechaSeleccionada;
      if (pendingDrag.nuevoEstado === 'anulada') dataToUpdate.fecha_anulacion = fechaSeleccionada;

      await updateDoc(cotizacionRef, dataToUpdate);
      
      setAllCotizaciones(prev => prev.map(c => c.id === pendingDrag.id ? { ...c, fecha_estado: fechaSeleccionada } : c));
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      // Revertimos visualmente si falla
      setAllCotizaciones(prev => prev.map(c => c.id === pendingDrag.id ? { ...c, estado: pendingDrag.originalState } : c));
    } finally {
      setPendingDrag(null);
    }
  };

  const handleCancelDrag = () => {
    if (pendingDrag) {
      // Revertimos el cambio visual
      setAllCotizaciones(prev => prev.map(c => c.id === pendingDrag.id ? { ...c, estado: pendingDrag.originalState } : c));
    }
    setDragModalOpen(false);
    setPendingDrag(null);
  };

  const handleOpenDetailModal = (cot) => { setSelectedCotizacion(cot); setDetailModalOpen(true); };
  const handleCloseDetailModal = () => { setDetailModalOpen(false); setSelectedCotizacion(null); };

  const handleCopyCotizacion = async () => {
    if (!selectedCotizacion || !app?.empresa_id || !currentUser) {
        alert("No se puede copiar la cotización. Faltan datos de sesión o no hay cotización seleccionada.");
        return;
    }
    try {
        const nuevoNumeroFormateado = await runTransaction(db, async (transaction) => {
            const correlativoRef = doc(db, "correlativos", app.empresa_id);
            const correlativoDoc = await transaction.get(correlativoRef);
            if (!correlativoDoc.exists()) throw new Error("No se encontró el documento de correlativos");

            const { anio, ultimo_numero } = correlativoDoc.data().correlativo_cotizaciones;
            const proximoNumero = ultimo_numero + 1;
            const numeroFormateado = `${anio}-${String(proximoNumero).padStart(5, '0')}`;
            
            const { id, numero_cotizacion, ...cotizacionOriginal } = selectedCotizacion;
            const ahora = Timestamp.now();
            const nuevaCotizacionData = {
                ...cotizacionOriginal, numero_cotizacion: numeroFormateado, estado: 'borrador', fecha_estado: ahora,
                fecha_creacion: ahora, usuario_creo: currentUser.uid, usuario_id: currentUser.uid, 
                fecha_ultima_modificacion: ahora, usuario_ultima_modificacion: currentUser.uid,
            };
            const nuevaCotizacionRef = doc(collection(db, "cotizaciones"));
            transaction.set(nuevaCotizacionRef, nuevaCotizacionData);
            transaction.update(correlativoRef, { "correlativo_cotizaciones.ultimo_numero": proximoNumero });
            return numeroFormateado;
        });
        alert(`Cotización copiada con éxito. Nuevo número: ${nuevoNumeroFormateado}`);
        handleCloseDetailModal();
        fetchData(filters);
    } catch (error) {
        console.error("Error al copiar la cotización:", error);
        alert(`Error al copiar la cotización: ${error.message}`);
    }
  };
  const handleExportExcel = () => {
    if (allCotizaciones.length === 0) {
      alert("No hay cotizaciones para exportar con los filtros actuales.");
      return;
    }

    const getSafeDate = (timestamp) => {
      if (!timestamp) return null;
      if (typeof timestamp.toDate === 'function') return timestamp.toDate();
      if (timestamp._seconds !== undefined) return new Date(timestamp._seconds * 1000);
      const d = new Date(timestamp);
      return isNaN(d.getTime()) ? null : d;
    };

    const dataReporte = allCotizaciones.map(cot => {
      const dateObj = getSafeDate(cot.fecha_emision);
      const telefonosCombinados = `${cot.cliente_snapshot?.telefono_cliente || 'N/A'} - ${cot.cliente_snapshot?.contacto_principal?.telefono || 'N/A'}`;
      
      let año = '', mes = '', fechaEmision = '';
      if (dateObj) {
        año = dateObj.getFullYear();
        mes = String(dateObj.getMonth() + 1).padStart(2, '0');
        fechaEmision = new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj);
      }

      const totalCotizacion = cot.totales?.total_cotizacion_final || 0;
      const costoBase = cot.totales?.total_costo_base || 0;
      const montoFee = totalCotizacion - costoBase;
      const porcentajeFee = cot.totales?.total_tasa_feeglobal_aplicada || 0;

      return {
        'Año': año,
        'Mes': mes,
        'No. Cotización': cot.numero_cotizacion,
        'Fecha Emisión': fechaEmision,
        'Estado': cot.estado ? cot.estado.toUpperCase() : 'N/A',
        'Cliente': cot.cliente_snapshot?.nombre_cliente || 'N/A',
        'Contacto': cot.cliente_snapshot?.contacto_principal?.nombre || 'N/A',
        'Teléfonos': telefonosCombinados,
        'Monto Total (Q)': totalCotizacion,
        '% Fee': porcentajeFee,
        'Monto Fee (Q)': montoFee
      };
    });

    // Ordenamiento por número de cotización (que implícitamente ordena por año y mes)
    dataReporte.sort((a, b) => b['No. Cotización'].localeCompare(a['No. Cotización']));

    const worksheet = XLSX.utils.json_to_sheet(dataReporte);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cotizaciones");

    XLSX.writeFile(workbook, "Reporte_Cotizaciones.xlsx");
  };

  // >>>>> LA SOLUCIÓN DEFINITIVA Y CORRECTA <<<<<
  const handlePrintCotizacion = () => { 
    if (selectedCotizacion && app?.monedas && app?.datosEmpresa) {
        // 1. Construir el objeto con la ESTRUCTURA PLANA correcta
        const dataForPdf = {
            cotizacion: selectedCotizacion,
            cliente: { id: selectedCotizacion.cliente_id, ...selectedCotizacion.cliente_snapshot },
            items: selectedCotizacion.items,
            totales: selectedCotizacion.totales,
            financiero: selectedCotizacion.financiero_snapshot,
            monedas: app.monedas, // <<< DATO CRÍTICO DEL CONTEXTO
            formaPago: selectedCotizacion.forma_pago,
            terminosCondiciones: selectedCotizacion.terminos_y_condiciones,
            // datosEmpresa se puede pasar aquí si el PDF lo necesita directamente
        };
        
        // 2. Guardar los datos y abrir el modal
        setPrintData(dataForPdf);
        setDetailModalOpen(false); 
        setPrintModalOpen(true); 
    } else {
        alert("Faltan datos para la impresión. Asegúrese de que la sesión esté cargada y la cotización seleccionada sea válida.");
    }
  };

  const handleClosePrintModal = () => {
    setPrintModalOpen(false);
    setPrintData(null); // Limpiar datos al cerrar
  }

  const handleFilterChange = e => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleDateChange = (name, date) => setFilters(prev => ({ ...prev, [name]: date }));
  const handleSearch = () => fetchData(filters);

  if (loadingSession || loading) return <Container sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Container>;
  if (!app?.empresa_id) return <Container sx={{ p: 3 }}><Alert severity="error" variant="outlined"><AlertTitle sx={{ fontWeight: 'bold' }}>Acceso Bloqueado</AlertTitle>Para gestionar cotizaciones, debe seleccionar una empresa.<Button variant="contained" color="primary" onClick={() => navigate('/inicializar/empresa')} startIcon={<BusinessIcon />} sx={{ mt: 2 }}>Ir a Inicializar Empresa</Button></Alert></Container>;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <DndContext onDragEnd={handleDragEnd}>
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <Paper sx={{ p: 2, mb: 2, zIndex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
              <Typography variant="h6" fontWeight="bold">Gestión de Cotizaciones (Kanban)</Typography>
              <Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={() => navigate('/')}>Salir</Button>
            </Box>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Cliente</InputLabel>
                  <Select name="clienteId" value={filters.clienteId} onChange={handleFilterChange} label="Cliente">
                    <MenuItem value="todos">Todos los Clientes</MenuItem>
                    {clientes.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre_cliente}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}><DatePicker label="Fecha Desde" value={filters.fechaDesde} onChange={d => handleDateChange('fechaDesde', d)} slotProps={{ textField: { fullWidth: true, size: 'small' } }} /></Grid>
              <Grid item xs={12} sm={6} md={2.5}><DatePicker label="Fecha Hasta" value={filters.fechaHasta} onChange={d => handleDateChange('fechaHasta', d)} slotProps={{ textField: { fullWidth: true, size: 'small' } }} /></Grid>
              <Grid item xs={12} sm={4} md={1.5}><Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch} fullWidth sx={{height: '40px'}}>Buscar</Button></Grid>
              <Grid item xs={12} sm={4} md={1.5}><Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchData(filters)} fullWidth sx={{height: '40px'}}>Refrescar</Button></Grid>
              <Grid item xs={12} sm={4} md={1}><Button variant="contained" color="success" onClick={handleExportExcel} fullWidth sx={{height: '40px', fontSize: '0.75rem', px: 1}}>Excel</Button></Grid>
            </Grid>
          </Paper>
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, overflowX: 'auto', p: 1, bgcolor: 'grey.200', borderRadius: '4px' }}>
            {Object.keys(kanbanColumnsData).map(status => <KanbanColumn key={status} status={status} cotizaciones={cotizacionesByStatus[status] || []} onCardDoubleClick={handleOpenDetailModal} />)}
          </Box>
        </Box>
      </DndContext>
      
      <CotizacionDetalleModal open={isDetailModalOpen} onClose={handleCloseDetailModal} cotizacion={selectedCotizacion} onCopy={handleCopyCotizacion} onPrint={handlePrintCotizacion} />
      
      <ConfirmarFechaEstadoModal 
        open={dragModalOpen} 
        onClose={handleCancelDrag} 
        onConfirm={handleConfirmDragDate} 
        estadoDestino={pendingDrag?.nuevoEstado} 
      />
      
      {/* El modal de impresión ahora usa 'printData' que tiene la estructura CORRECTA */}
      {printData && (
        <ImprimirCotizacionModal 
          open={isPrintModalOpen} 
          onClose={handleClosePrintModal} 
          cotizacionData={printData}
        />
      )}
    </LocalizationProvider>
  );
};

export default GestionReportesPage;
