
import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Alert,
  Backdrop,
  CircularProgress,
  Toolbar,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import RolesAccesosForm from '../../components/forms/RolesAccesosForm';
import {
  getRoles,
  getAndSyncPermissionsForRole,
  updatePermission,
} from '../../services/firestore/rolesAccesosService';

const RolesAccesosPage = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]); // Ahora es un Array
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [error, setError] = useState(null);

  // Carga inicial de roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const rolesData = await getRoles();
        setRoles(rolesData);
        if (rolesData.length > 0) {
          // Opcional: seleccionar el primer rol por defecto
          // handleRoleChange(rolesData[0].id);
        }
      } catch (err) {
        setError(`Error al cargar roles: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  // Función que se dispara al cambiar de rol en el selector
  const handleRoleChange = useCallback(async (roleId) => {
    if (!roleId) {
      setSelectedRole('');
      setPermissions([]);
      return;
    }
    setSelectedRole(roleId);
    try {
      setLoadingPermissions(true);
      setError(null);
      // ¡La magia sucede aquí! Llamamos a la nueva función del servicio.
      const syncedPermissions = await getAndSyncPermissionsForRole(roleId);
      setPermissions(syncedPermissions);
    } catch (err) {
      setError(`Error al sincronizar permisos: ${err.message}`);
      setPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  // Función para cambiar el estado de un permiso (on/off)
  const handlePermissionChange = async (docId, newStatus) => {
    if (!selectedRole) return;

    // Actualización optimista de la UI
    const originalPermissions = [...permissions];
    setPermissions(prev => 
      prev.map(p => p.doc_id === docId ? { ...p, on_off: newStatus } : p)
    );

    try {
      // Llamada a la función de servicio simplificada
      await updatePermission(docId, newStatus);
    } catch (err) {
      setError(`Error al actualizar el permiso. ${err.message}`);
      // Si falla, revertimos al estado original
      setPermissions(originalPermissions);
    }
  };

  if (loading && roles.length === 0) {
    return (
      <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, bgcolor: 'transparent' }}>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Toolbar>
          <LockOpenIcon sx={{ mr: 1, fontSize: '2.2rem' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Gestión de Permisos por Rol
          </Typography>
          <Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={() => navigate('/')}>
            Salir
          </Button>
        </Toolbar>

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        )}

        <Box sx={{ p: { xs: 1, sm: 2 } }}>
          <RolesAccesosForm
            roles={roles}
            permissions={permissions} // Pasamos el array de permisos sincronizados
            onRoleChange={handleRoleChange}
            onPermissionChange={handlePermissionChange}
            loadingPermissions={loadingPermissions}
            selectedRole={selectedRole}
          />
        </Box>
      </Paper>
    </Paper>
  );
};

export default RolesAccesosPage;
