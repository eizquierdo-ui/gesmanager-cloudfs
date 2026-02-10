import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import './Sidebar.css';

const Sidebar = () => {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const fetchMenu = async () => {
      const menuCollection = collection(db, 'menu');
      const menuSnapshot = await getDocs(menuCollection);
      const menuList = menuSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMenuItems(menuList);
    };

    fetchMenu();
  }, []);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>GESManager</h3>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map(item => (
            <li key={item.id}>
              <NavLink to={`/${item.id}`} className={({ isActive }) => isActive ? 'active' : ''}>
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
