import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import PlaceholderPage from './pages/PlaceholderPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:pageName" element={<PlaceholderPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
