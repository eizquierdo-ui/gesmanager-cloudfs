
// src/pages/accesos/UsuariosXEmpresaPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { getAllAsignaciones, createAsignacion, updateAsignacion, deleteAsignacion } from '../../services/firestore/asignacionesService';
import { getAllEmpresas } from '../../services/firestore/empresasService';
import { getUsuarios } from '../../services/usuariosService';
import AsignacionForm from '../../components/forms/AsignacionForm';

import { 
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, IconButton, Tooltip, Chip, Typography, TextField, InputAdornment 
} from '@mui/material';
import { Add, ExitToApp, Search, Edit, Delete, PowerSettingsNew } from '@mui/icons-material';

const UsuariosXEmpresaPage = () => {
  const navigate = useNavigate(); 
  const [asignaciones, setAsignaciones] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  // 1. AÑADIR ESTADO PARA EL FILTRO DE BÚSQUEDA
  const [filtro, setFiltro] = useState('');

  const currentUser = { uid: 'test-user-id' };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [asignacionesData, empresasData, usuariosData] = await Promise.all([
        getAllAsignaciones(),
        getAllEmpresas(),
        getUsuarios(),
      ]);
      setAsignaciones(asignacionesData);
      setEmpresas(empresasData);
      setUsuarios(usuariosData);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos. Por favor, intente de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 3. MODIFICAR useMemo PARA INCLUIR LA LÓGICA DE FILTRADO
  const asignacionesFiltradas = useMemo(() => {
    if (loading) return [];
    
    const enriquecidas = asignaciones.map(asig => {
      const empresa = empresas.find(e => e.id === asig.empresa_id);
      const usuario = usuarios.find(u => u.id === asig.usuario_id);
      return {
        ...asig,
        nombre_empresa: empresa ? empresa.nombre : 'Empresa no encontrada',
        nombre_usuario: usuario ? (usuario.nombre_usuario || usuario.email_usuario) : 'Usuario no encontrado',
      };
    });

    if (!filtro) {
      return enriquecidas;
    }

    const filtroMinusculas = filtro.toLowerCase();
    return enriquecidas.filter(item => 
      item.nombre_usuario.toLowerCase().includes(filtroMinusculas) ||
      item.nombre_empresa.toLowerCase().includes(filtroMinusculas)
    );

  }, [asignaciones, empresas, usuarios, loading, filtro]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleSave = async (formData) => {
    try {
      if (editingItem) {
        await updateAsignacion(editingItem.id, formData, currentUser.uid);
      } else {
        await createAsignacion(formData, currentUser.uid);
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      setError('Error al guardar la asignación.');
    }
  };

  const handleToggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    if (window.confirm(`¿Está seguro de que desea cambiar el estado a "${nuevoEstado}"?`)) {
      try {
        await updateAsignacion(id, { estado: nuevoEstado }, currentUser.uid);
        fetchData();
      } catch (err) {
        setError('Error al actualizar el estado.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta asignación permanentemente?')) {
      try {
        await deleteAsignacion(id);
        fetchData();
      } catch (err) {
        setError('Error al eliminar la asignación.');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            Mantenimiento de Asignaciones (Usuarios x Empresa)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* 2. CONECTAR EL TEXTFIELD AL ESTADO */}
            <TextField 
              variant="outlined" 
              size="small" 
              placeholder="Buscar..." 
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
            <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => handleOpenModal()}>
              Nuevo
            </Button>
            <Button variant="contained" color="error" startIcon={<ExitToApp />} onClick={() => navigate('/')}>
              Salir
            </Button>
          </Box>
        </Box>
      </Paper>

      {loading && <Typography>Cargando datos...</Typography>}
      {error && <Typography color="error">{error}</Typography>}

      {!loading && !error && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Empresa</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* USAR LA LISTA FILTRADA PARA RENDERIZAR */}
              {asignacionesFiltradas.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nombre_usuario}</TableCell>
                  <TableCell>{item.nombre_empresa}</TableCell>
                  <TableCell>
                    <Chip label={item.estado} color={item.estado === 'activo' ? 'success' : 'error'} size="small" />
                  </TableCell>
                  <TableCell align="right">
                     <Tooltip title={item.estado === 'activo' ? 'Inactivar' : 'Activar'}>
                        <IconButton 
                          onClick={() => handleToggleEstado(item.id, item.estado)}
                          color={item.estado === 'activo' ? 'error' : 'success'}
                        >
                            <PowerSettingsNew />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                        <IconButton color="primary" onClick={() => handleOpenModal(item)}>
                            <Edit />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                        <IconButton color="error" onClick={() => handleDelete(item.id)}>
                            <Delete />
                        </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AsignacionForm 
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialData={editingItem}
        empresas={empresas}
        usuarios={usuarios}
      />
    </Box>
  );
};

export default UsuariosXEmpresaPage;
