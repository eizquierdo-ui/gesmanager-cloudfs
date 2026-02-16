
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

import * as FaIcons from 'react-icons/fa';
import * as Io5Icons from 'react-icons/io5';
import * as MdIcons from 'react-icons/md';

import './Sidebar.css';

const DynamicIcon = ({ name }) => {
  const fallbackIcon = <FaIcons.FaQuestionCircle />;
  if (!name) return fallbackIcon;
  const iconSets = { FaIcons, Io5Icons, MdIcons };
  const [prefix, iconName] = name.startsWith('Fa') || name.startsWith('Io') || name.startsWith('Md') 
    ? [name.substring(0, 2) + 'Icons', name]
    : ['MdIcons', 'Md' + name.split(/[_-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')];
  const Icon = iconSets[prefix]?.[iconName];
  return Icon ? <Icon /> : fallbackIcon;
};

const MenuItem = ({ item, allItems, openMenus, toggleMenu }) => {
  const children = allItems.filter(child => child.id_padre === item.id).sort((a, b) => a.Orden - b.Orden);
  const isMenuOpen = openMenus[item.id] || false;
  const content = (
    <div className="menu-item-content">
      <DynamicIcon name={item.Icon} />
      <span className="menu-label">{item.Label}</span>
    </div>
  );

  if (children.length === 0) {
    const path = item.Ruta ? `${item.Ruta.replace(/^\//, '')}` : `/#`;
    return <li><NavLink to={path} className={({ isActive }) => isActive ? 'active' : ''}>{content}</NavLink></li>;
  }

  return (
    <li>
      <div onClick={() => toggleMenu(item.id)} className="menu-item-parent">{content}<span className={`arrow ${isMenuOpen ? 'down' : 'right'}`}></span></div>
      {isMenuOpen && <ul className="submenu">{children.map(child => <MenuItem key={child.id} item={child} allItems={allItems} openMenus={openMenus} toggleMenu={toggleMenu} />)}</ul>}
    </li>
  );
};

const Sidebar = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenus, setOpenMenus] = useState({});
  const { userData, logout } = useAuth();

  const handleLogout = async () => {
    try { await logout(); } catch (error) { console.error("Error al cerrar sesión:", error); }
  };

  useEffect(() => {
    if (!userData || !userData.role) {
      setLoading(false);
      setMenuItems([]);
      return;
    }

    setLoading(true);

    const menuQuery = query(collection(db, 'menu2'), orderBy('Orden'));
    const roleDocRef = doc(db, 'roles', userData.role);
    const permissionsQuery = query(collection(db, 'roles-accesos2'), where('role_id', '==', userData.role));

    const unsubscribeMenu = onSnapshot(menuQuery, (menuSnapshot) => {
      const unsubscribeRole = onSnapshot(roleDocRef, (roleDoc) => {
        const unsubscribePermissions = onSnapshot(permissionsQuery, (permissionsSnapshot) => {
          setError(null);
          try {
            const fullMenuList = menuSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const allMenusById = Object.fromEntries(fullMenuList.map(item => [item.id, item]));

            const inactiveIds = new Set();
            const disableChildrenOf = (parentId) => {
              fullMenuList.forEach(item => {
                if (item.id_padre === parentId) {
                  inactiveIds.add(item.id);
                  disableChildrenOf(item.id);
                }
              });
            };
            fullMenuList.forEach(item => {
              if (item.estado === 'inactivo') {
                inactiveIds.add(item.id);
                disableChildrenOf(item.id);
              }
            });
            const activeMenuList = fullMenuList.filter(item => !inactiveIds.has(item.id));

            if (!roleDoc.exists() || roleDoc.data().estado !== 'activo') {
              throw new Error(`Tu rol "${userData.role}" está inactivo o no existe.`);
            }
            
            const allowedMenuIds = new Set(permissionsSnapshot.docs
              .filter(doc => doc.data().on_off === true)
              .map(doc => String(doc.data().menu_id))
            );

            if (allowedMenuIds.size === 0) throw new Error(`No tienes permisos de acceso definidos.`);

            const userMenu = new Set();
            activeMenuList.forEach(item => {
              if (allowedMenuIds.has(String(item.id))) {
                userMenu.add(item);
                let parentId = item.id_padre;
                while (parentId) {
                  const parent = allMenusById[String(parentId)];
                  if (parent && !inactiveIds.has(parent.id)) {
                    userMenu.add(parent);
                    parentId = parent.id_padre;
                  } else {
                    break;
                  }
                }
              }
            });
            
            setMenuItems(Array.from(userMenu));

          } catch (e) {
            setError(e.message);
            setMenuItems([]);
          } finally {
            setLoading(false);
          }
        }, (err) => { setError("Error de permisos: " + err.message); setLoading(false); });

        return () => unsubscribePermissions();
      }, (err) => { setError("Error de rol: " + err.message); setLoading(false); });

      return () => unsubscribeRole();
    }, (err) => { setError("Error de menú: " + err.message); setLoading(false); });

    return () => {
      unsubscribeMenu();
    };
  }, [userData]);

  // *** FUNCIÓN MODIFICADA PARA COMPORTAMIENTO DE ACORDEÓN ***
  const toggleMenu = (id) => {
    setOpenMenus(prevOpenMenus => {
      // Comprueba si el menú que se está clickeando ya está abierto.
      const isCurrentlyOpen = prevOpenMenus[id];
      
      // Devuelve un objeto vacío si ya está abierto (para cerrarlo),
      // o un objeto con solo este ID si estaba cerrado (para abrirlo y cerrar los demás).
      return isCurrentlyOpen ? {} : { [id]: true };
    });
  };

  const topLevelItems = menuItems.filter(item => !item.id_padre).sort((a, b) => a.Orden - b.Orden);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>GESManager</h3>
        {userData && <span className="sidebar-role">{userData.role}</span>}
      </div>
      <nav className="sidebar-nav">
        <ul>
          {loading ? <li className="menu-feedback">Cargando menú...</li>
           : error ? <li className="menu-feedback error">{error}</li>
           : topLevelItems.length > 0 ? topLevelItems.map(item => <MenuItem key={item.id} item={item} allItems={menuItems} openMenus={openMenus} toggleMenu={toggleMenu} />)
           : <li className="menu-feedback">Sin opciones de menú.</li>}
        </ul>
        <ul className="sidebar-footer">
           <li onClick={handleLogout} className="logout-item">
             <div className="menu-item-content">
               <DynamicIcon name="IoLogOutOutline" />
               <span className="menu-label">Cerrar Sesión</span>
             </div>
           </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
