
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { FaQuestionCircle } from 'react-icons/fa';

import './Sidebar.css';

// --- COMPONENTE DE ICONO DINÁMICO Y EFICIENTE ---
const IconLoader = ({ name }) => {
  const Icon = lazy(() => {
    if (!name) return Promise.resolve({ default: FaQuestionCircle });

    const lib = name.substring(0, 2).toLowerCase(); // 'fa', 'md', 'io', etc.
    
    return import(`react-icons/${lib}/index.js`)
      .then(module => ({ default: module[name] || FaQuestionCircle }))
      .catch(() => ({ default: FaQuestionCircle }));
  });

  return (
    <Suspense fallback={<span style={{ width: '1em', height: '1em' }} />}>
      <Icon />
    </Suspense>
  );
};


// --- COMPONENTE MenuItem ---
const MenuItem = ({ item, allItems, openMenus, toggleMenu }) => {
  const children = allItems.filter(child => child.padre_id === item.id).sort((a,b) => a.orden - b.orden);
  const isMenuOpen = openMenus[item.id] || false;

  const content = (
    <div className="menu-item-content">
      <IconLoader name={item.icon} />
      <span className="menu-label">{item.label}</span>
    </div>
  );

  if (children.length === 0) {
    const path = item.ruta ? `/${item.ruta.replace(/^\//, '')}` : `/${item.id}`;
    return (
      <li>
        <NavLink to={path} className={({ isActive }) => isActive ? 'active' : ''}>{content}</NavLink>
      </li>
    );
  }

  return (
    <li>
      <div onClick={() => toggleMenu(item.id)} className="menu-item-parent">
        {content}
        <span className={`arrow ${isMenuOpen ? 'down' : 'right'}`}></span>
      </div>
      {isMenuOpen && (
        <ul className="submenu">
          {children.map(child => (
            <MenuItem key={child.id} item={child} allItems={allItems} openMenus={openMenus} toggleMenu={toggleMenu} />
          ))}
        </ul>
      )}
    </li>
  );
};

// --- COMPONENTE PRINCIPAL DEL SIDEBAR ---
const Sidebar = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenus, setOpenMenus] = useState({});
  
  const location = useLocation();
  const { userData, logout } = useAuth(); 

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  useEffect(() => {
    if (!userData || !userData.role || userData.roleStatus !== 'activo') {
      setLoading(false);
      setMenuItems([]);
      return;
    }

    const fetchMenuAndPermissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const permissionsQuery = query(
          collection(db, 'roles-accesos'), 
          where('role_id', '==', userData.role),
          where('on_off', '==', true)
        );
        const permissionsSnapshot = await getDocs(permissionsQuery);
        const allowedMenuIds = permissionsSnapshot.docs.map(doc => doc.data().menu_id);

        if (allowedMenuIds.length === 0) {
          throw new Error(`No hay accesos definidos para el rol "${userData.role}".`);
        }

        const menuCollection = collection(db, 'menu');
        const q = query(menuCollection, orderBy('orden'));
        const menuSnapshot = await getDocs(q);
        const fullMenuList = menuSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const userMenu = new Set();
        fullMenuList.forEach(item => {
          if (allowedMenuIds.includes(item.id)) {
            userMenu.add(item);
            let parentId = item.padre_id;
            while(parentId) {
              const parent = fullMenuList.find(p => p.id === parentId);
              if (parent) {
                userMenu.add(parent);
                parentId = parent.padre_id;
              } else {
                break;
              }
            }
          }
        });

        const finalMenu = Array.from(userMenu);
        setMenuItems(finalMenu);

        const currentPath = location.pathname.substring(1);
        const activeItem = finalMenu.find(item => item.ruta === currentPath || item.id === currentPath );
        if (activeItem && activeItem.padre_id) {
          setOpenMenus({ [activeItem.padre_id]: true });
        }

      } catch (e) {
        console.error("Error al cargar menú y permisos:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuAndPermissions();
  }, [userData, location.pathname]);

  const toggleMenu = (id) => {
    setOpenMenus(prevOpenMenus => {
      const isCurrentlyOpen = !!prevOpenMenus[id];
      return { [id]: !isCurrentlyOpen };
    });
  };

  const topLevelItems = menuItems.filter(item => !item.padre_id || item.padre_id === "").sort((a,b) => a.orden - b.orden);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>GESManager</h3>
        {userData && <span className="sidebar-role">{userData.role}</span>}
      </div>
      <nav className="sidebar-nav">
        <ul>
          {loading ? (
            <li className="menu-feedback">Cargando menú...</li>
          ) : error ? (
            <li className="menu-feedback error">{error}</li>
          ) : topLevelItems.length > 0 ? (
            topLevelItems.map(item => (
              <MenuItem key={item.id} item={item} allItems={menuItems} openMenus={openMenus} toggleMenu={toggleMenu} />
            ))
          ) : (
            <li className="menu-feedback">No tienes acceso a ninguna opción.</li>
          )}
        </ul>
        <ul className="sidebar-footer">
           <li onClick={handleLogout} className="logout-item">
              <div className="menu-item-content">
                <IconLoader name="IoLogOutOutline" />
                <span className="menu-label">Cerrar Sesión</span>
              </div>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
