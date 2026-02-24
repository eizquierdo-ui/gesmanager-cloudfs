
import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Grid,
  Paper,
  Switch,
  FormControlLabel,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';

const RolesAccesosForm = ({
  roles,
  permissions, // Ahora es un array
  onRoleChange,
  onPermissionChange,
  loadingPermissions,
  selectedRole,
}) => {

  // El renderizado se simplifica enormemente. No más recursividad.
  const renderPermissionItems = (items) => {
    if (!items || items.length === 0) {
        return (
            <ListItem>
                <ListItemText primary="Seleccione un rol para ver sus permisos." />
            </ListItem>
        );
    }

    // Simplemente mapeamos el array de permisos que ya viene sincronizado y ordenado.
    return items.map((perm, index) => (
      <React.Fragment key={perm.doc_id}>
        <ListItem sx={{ pl: perm.id_padre ? 4 : 2, display: 'flex', alignItems: 'center' }}>
            <ListItemText 
                primary={perm.Label} 
                secondary={`Orden: ${perm.Orden}`}
                sx={{ flexGrow: 1, color: perm.es_padre ? 'primary.main' : 'text.primary', '& .MuiListItemText-primary': { fontWeight: perm.es_padre ? 'bold' : 'normal' } }}
            />
            <FormControlLabel
                control={
                <Switch
                    checked={perm.on_off}
                    onChange={(e) => onPermissionChange(perm.doc_id, e.target.checked)}
                    color="primary"
                    disabled={loadingPermissions}
                    size="small"
                />
                }
                label={perm.on_off ? 'On' : 'Off'}
                sx={{ mr: 0 }}
            />
        </ListItem>
        {index < items.length - 1 && <Divider component="li" light sx={{ml: perm.id_padre ? 4 : 2}} />}
      </React.Fragment>
    ));
  };

  return (
    <Paper elevation={0} sx={{ p: 0 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={4}>
          <TextField
            select
            label="Seleccione un Rol"
            value={selectedRole || ''}
            fullWidth
            onChange={(e) => onRoleChange(e.target.value)}
            helperText="Elija el rol para gestionar sus permisos"
            disabled={loadingPermissions}
            variant="outlined"
          >
            {roles.map((rol) => (
              <MenuItem key={rol.id} value={rol.id}>
                {rol.id}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {selectedRole && (
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{fontWeight: 'bold'}}>
              Permisos para el Rol: {selectedRole}
            </Typography>
            {loadingPermissions ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ml: 2}}>Sincronizando permisos...</Typography>
              </Box>
            ) : (
              <Paper variant="outlined" sx={{ mt: 1 }}>
                <List dense disablePadding>
                  {renderPermissionItems(permissions)}
                </List>
              </Paper>
            )}
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

RolesAccesosForm.propTypes = {
  roles: PropTypes.array.isRequired,
  permissions: PropTypes.array.isRequired, // Ya no es un Map
  onRoleChange: PropTypes.func.isRequired,
  onPermissionChange: PropTypes.func.isRequired,
  loadingPermissions: PropTypes.bool.isRequired,
  selectedRole: PropTypes.string,
};

export default RolesAccesosForm;
