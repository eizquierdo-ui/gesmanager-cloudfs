import React from 'react';
import { Link } from 'react-router-dom';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: '72px',
    fontWeight: 'bold',
    color: '#343a40',
    margin: '0',
  },
  subtitle: {
    fontSize: '24px',
    color: '#6c757d',
    marginBottom: '30px',
  },
  link: {
    textDecoration: 'none',
    color: '#007bff',
    fontSize: '18px',
  },
};

function NotFound() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>404</h1>
      <p style={styles.subtitle}>Página No Encontrada</p>
      <Link to="/" style={styles.link}>Volver al Inicio</Link>
    </div>
  );
}

export default NotFound;
