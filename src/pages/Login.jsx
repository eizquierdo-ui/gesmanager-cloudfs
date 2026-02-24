import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiEye, FiEyeOff } from 'react-icons/fi'; // Importamos iconos para el campo de contraseña

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#e9eef2', // Un fondo gris claro, más suave
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  loginBox: {
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'white',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#007bff',
    margin: '0 0 5px 0',
  },
  subTitle: {
    fontSize: '18px',
    color: '#555',
    marginBottom: '35px',
  },
  inputGroup: {
    textAlign: 'left',
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#333',
    fontWeight: '500',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box', // Asegura que el padding no afecte el ancho total
  },
  eyeIcon: {
    position: 'absolute',
    top: '50%',
    right: '15px',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    color: '#888',
  },
  button: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginTop: '10px',
  },
  forgotPassword: {
    display: 'block',
    marginTop: '20px',
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '14px',
  },
  version: {
    marginTop: '30px',
    color: '#aaa',
    fontSize: '14px',
    fontWeight: '500',
  },
  error: {
    color: 'red',
    marginTop: '16px',
    fontWeight: '500',
  },
};

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Correo electrónico o contraseña incorrectos.');
          break;
        case 'auth/invalid-email':
          setError('El formato del correo electrónico no es válido.');
          break;
        default:
          setError('Ocurrió un error al iniciar sesión. Inténtalo de nuevo.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.mainTitle}>GESManager</h1>
        <h2 style={styles.subTitle}>Gestor de Cotizaciones</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Ingrese su correo electrónico</label>
            <input 
              id="email"
              type="email" 
              placeholder="[ Correo ]" 
              style={styles.input} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Ingrese su contraseña</label>
            <div style={styles.inputWrapper}>
              <input 
                id="password"
                type={showPassword ? 'text' : 'password'} 
                placeholder="[ Contraseña ]" 
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span onClick={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Iniciando Sesión...' : 'Iniciar sesión'}
          </button>
          
          {error && <p style={styles.error}>{error}</p>}
        </form>
        
        <a href="#" style={styles.forgotPassword}>¿Se te olvidó la contraseña?</a>

        <p style={styles.version}>GM-CloudFS 2.0</p>
      </div>
    </div>
  );
}

export default Login;
