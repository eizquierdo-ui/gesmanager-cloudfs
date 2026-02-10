
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Toolbar, Typography, TextField, InputAdornment, 
  Button, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Tooltip, CircularProgress, Modal, Fade, Backdrop, Chip
} from '@mui/material';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';

// --- Importación de Íconos ---
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteForeverTwoToneIcon from '@mui/icons-material/DeleteForeverTwoTone';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

import EmpresaForm from '../components/forms/EmpresaForm';

// --- Estilo del Modal ---
const style = {
  modal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '800px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  },
};

// --- FUNCIÓN UTILITARIA PARA FORMATEAR FECHAS DE FIRESTORE ---
const formatFirestoreTimestamp = (timestamp) => {
  if (!timestamp || !timestamp.toDate) {
    return 'No disponible';
  }
  try {
    return format(timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss.SSS');
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return 'Fecha inválida';
  }
};


const Empresas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [currentEmpresa, setCurrentEmpresa] = useState(null);
  const navigate = useNavigate();

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'empresas'));
      const empresasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmpresas(empresasData);
    } catch (error) {
      console.error("Error al obtener las empresas:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const filteredEmpresas = useMemo(() => 
    empresas.filter(empresa => 
      empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (empresa.nit && empresa.nit.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [empresas, searchTerm]);
    
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta empresa? Esta acción es irreversible.')) {
      try {
        await deleteDoc(doc(db, 'empresas', id));
        fetchEmpresas();
      } catch (error) {
        console.error("Error al eliminar la empresa:", error);
      }
    }
  };
  
  const handleToggleEstado = async (empresa) => {
    const nuevoEstado = empresa.estado === 'activo' ? 'inactivo' : 'activo';
    if (window.confirm(`¿Deseas cambiar el estado a "${nuevoEstado}"?`)) {
      try {
        const empresaRef = doc(db, 'empresas', empresa.id);
        await updateDoc(empresaRef, {
          estado: nuevoEstado,
          fecha_estado: serverTimestamp()
        });
        fetchEmpresas();
      } catch (error) {
        console.error("Error al cambiar el estado:", error);
      }
    }
  };
  
  const handleOpenModal = (empresa = null) => {
    setCurrentEmpresa(empresa);
    setOpenModal(true);
  };
  
  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentEmpresa(null);
  };

  const handleFormSubmit = async (values) => {
    try {
      if (currentEmpresa) {
        const empresaRef = doc(db, 'empresas', currentEmpresa.id);
        await updateDoc(empresaRef, {
          ...values,
          fecha_ultima_actualizacion: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'empresas'), {
          ...values,
          fecha_creacion: serverTimestamp(),
          fecha_ultima_actualizacion: serverTimestamp(),
        });
      }
      fetchEmpresas();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar la empresa:", error);
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flex: '1 1 100%', fontWeight: 'bold' }}>
            Mantenimiento de Empresas
          </Typography>

          <TextField 
            variant="outlined"
            size="small"
            placeholder="Buscar por nombre o NIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
            sx={{ mr: 2, width: '350px' }}
          />
          
          {/* --- BOTONES DE ACCIÓN CORREGIDOS --- */}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ mr: 1 }}>
            Nuevo
          </Button>
          <Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={() => navigate('/')}>
            Salir
          </Button>
        </Toolbar>

        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{fontWeight: 'bold'}}>Nombre</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>NIT</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Dirección</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Email</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Teléfono</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Contacto</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Tel. Contacto</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Estado</TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold'}}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} align="center"><CircularProgress /></TableCell></TableRow>
              ) : filteredEmpresas.map((empresa) => (
                <TableRow hover key={empresa.id}>
                  <TableCell>{empresa.nombre}</TableCell>
                  <TableCell>{empresa.nit}</TableCell>
                  <TableCell>{empresa.direccion}</TableCell>
                  <TableCell>{empresa.email}</TableCell>
                  <TableCell>{empresa.telefono}</TableCell>
                  <TableCell>{empresa.contacto}</TableCell>
                  <TableCell>{empresa.telefono_contacto}</TableCell>
                  <TableCell>
                     <Chip 
                        label={empresa.estado.charAt(0).toUpperCase() + empresa.estado.slice(1)}
                        color={empresa.estado === 'activo' ? 'success' : 'error'} 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={empresa.estado === 'activo' ? 'Inactivar' : 'Activar'}>
                      <IconButton onClick={() => handleToggleEstado(empresa)} size="small">
                        {empresa.estado === 'activo' ? <ToggleOnIcon sx={{ color: '#388e3c' }} /> : <ToggleOffIcon sx={{ color: '#d32f2f' }} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenModal(empresa)} size="small">
                        <EditTwoToneIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(empresa.id)} size="small">
                        <DeleteForeverTwoToneIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openModal}>
          <Box sx={style.modal}>
            <Typography variant="h5" component="h2" sx={{mb: 3, fontWeight: 'bold'}}>
              {currentEmpresa ? 'Editar Empresa' : 'Crear Nueva Empresa'}
            </Typography>
            <EmpresaForm 
              initialData={currentEmpresa}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
            />
            {currentEmpresa && (
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'grey.300' }}>
                <Typography variant="caption" display="block" gutterBottom>
                  Fecha de Creación: {formatFirestoreTimestamp(currentEmpresa.fecha_creacion)}
                </Typography>
                <Typography variant="caption" display="block">
                  Última Actualización: {formatFirestoreTimestamp(currentEmpresa.fecha_ultima_actualizacion)}
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default Empresas;
