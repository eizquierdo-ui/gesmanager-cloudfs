import React from 'react';
import { useParams } from 'react-router-dom';

const PlaceholderPage = () => {
  const { pageName } = useParams();

  return (
    <div className="page-content">
      <h2>{pageName}</h2>
      <p>Página en construcción.</p>
    </div>
  );
};

export default PlaceholderPage;
