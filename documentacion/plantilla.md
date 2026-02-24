# Plantilla de Desarrollo para Módulos CRUD en GESManager-CloudFS

Este documento es la guía definitiva para construir módulos de mantenimiento (CRUD) de forma consistente, escalable y mantenible dentro del proyecto.

**Propósito:** Estandarizar el desarrollo para que cualquier programador pueda entender, mantener y ampliar cualquier módulo CRUD de la aplicación, minimizando el tiempo de revisión y corrección.

---

## Fase 0: Preparación y Migración de Datos con Scripts

Antes de construir cualquier interfaz de usuario, a menudo es necesario preparar la base de datos. Esto incluye crear colecciones con datos iniciales (seeding) o modificar colecciones existentes (migración). Estas operaciones se realizan con privilegios de administrador a través de scripts de Node.js, no desde la aplicación React.

### 0.1. Ubicación y Nomenclatura de Scripts

- **Ubicación:** Todos los scripts de manipulación de datos deben residir en la carpeta `/scripts/` en la raíz del proyecto.
- **Nomenclatura:** Debido a que el proyecto está configurado como un Módulo ES (`"type": "module"` en `package.json`), los scripts que necesiten usar la sintaxis CommonJS (como `require()`, necesaria para `firebase-admin`) **deben obligatoriamente tener la extensión `.cjs`**.
  - Ejemplo: `scripts/migrar-usuarios.cjs`

### 0.2. Estructura de un Script de Migración (`.cjs`)

Un script típico para interactuar con Firestore tendrá la siguiente estructura.

**Ruta del Archivo:** `scripts/ejemplo-migracion.cjs`

```javascript
// 1. Importar los módulos de Firebase Admin usando require()
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// 2. Inicializar la App de Firebase Admin
// Esta sección es crucial y depende del entorno de ejecución.
let app;
try {
  // Intenta inicializar la app. El SDK buscará automáticamente las credenciales
  // en la variable de entorno GOOGLE_APPLICATION_CREDENTIALS.
  app = initializeApp();
  console.log('SDK de Firebase Admin inicializado correctamente.');
} catch (error) {
  // Si la app ya está inicializada por otro proceso, este error es esperado.
  // En un entorno de script único, este bloque puede no ser necesario.
  console.warn('Advertencia: El SDK de Firebase Admin ya parece estar inicializado.');
}

// 3. Obtener la instancia de la base de datos
const db = getFirestore();

// 4. Definir las funciones de trabajo (siempre asíncronas)

/**
 * Ejemplo: Crea una nueva colección o añade un documento.
 */
async function crearDocumentoNuevo() {
  console.log('Iniciando creación de documento...');
  const coleccionRef = db.collection('<nombre-coleccion>');
  const datosDocumento = {
    nombre: "Dato de ejemplo",
    activo: true,
    // Campos de auditoría (controlados por el script)
    fecha_creacion: new Date(),
    usuario_creo: 'script-admin'
  };

  try {
    // Usar .set() con un ID específico o .add() para un ID automático
    await coleccionRef.doc('id-predecible').set(datosDocumento);
    console.log('¡Éxito al crear el documento!');
  } catch (err) {
    console.error('Error al crear el documento:', err);
  }
}

/**
 * Ejemplo: Actualiza documentos existentes para añadir un nuevo campo.
 */
async function agregarCampoANuevosDocumentos() {
  console.log('Iniciando actualización de documentos...');
  const coleccionRef = db.collection('<nombre-coleccion>');

  try {
    const snapshot = await coleccionRef.where('nuevo_campo', '==', null).get();
    if (snapshot.empty) {
      console.log('No hay documentos que necesiten ser actualizados.');
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      console.log(`Actualizando doc: ${doc.id}`);
      const docRef = coleccionRef.doc(doc.id);
      // El método .update() agrega el campo si no existe.
      batch.update(docRef, {
        nuevo_campo: 'valor_por_defecto',
        fecha_ultima_actualizacion: new Date(),
        usuario_ultima_modificacion: 'script-migracion'
       });
    });

    await batch.commit();
    console.log(`¡Éxito! ${snapshot.size} documentos han sido actualizados.`);

  } catch (err) {
    console.error('Error durante la migración de datos:', err);
  }
}

// 5. Función principal para orquestar la ejecución
async function main() {
  console.log('--- Iniciando Script de Migración ---');
  await crearDocumentoNuevo();
  await agregarCampoANuevosDocumentos();
  console.log('--- Script de Migración Completado ---');
}

// 6. Ejecutar la función principal
main();
```

### 0.3. Ejecución del Script

La ejecución se realiza a través de la terminal, con la interacción del desarrollador.

1.  **Abrir la Terminal:** Abre una nueva terminal en el IDE.
2.  **Autenticación (Rol del Desarrollador):** El script necesita credenciales de administrador. El desarrollador debe asegurarse de que el entorno de ejecución esté autenticado. La forma más común es configurar una variable de entorno que apunte al archivo JSON de la cuenta de servicio de Firebase.
    ```bash
    # Comando de ejemplo para Linux/macOS
    export GOOGLE_APPLICATION_CREDENTIALS="/ruta/a/tu/archivo-de-servicio.json"
    ```
3.  **Ejecutar el Script con Node.js:**
    ```bash
    node scripts/ejemplo-migracion.cjs
    ```
4.  **Verificar el Resultado:** El desarrollador debe revisar la salida en la consola para confirmar el éxito o diagnosticar errores y, posteriormente, verificar los datos directamente en la Consola de Firebase.

---

## Fase 1: Creación de la Estructura de Archivos

Para una nueva entidad (ej. "Productos"), la estructura de archivos será la siguiente:

1.  **Página Principal del CRUD:**
    -   **Ruta:** `src/pages/Productos.jsx`

2.  **Formulario de la Entidad:**
    -   **Ruta:** `src/components/forms/ProductoForm.jsx`

3.  **Capa de Servicio de Datos:**
    -   **Ruta:** `src/services/firestore/productosService.js`

---

## Fase 2: Implementación de la Capa de Servicio

**Archivo:** `src/services/firestore/productosService.js`

- **Propósito:** Abstraer toda la lógica de interacción con Firestore. El resto de la aplicación no debe saber cómo se obtienen o guardan los datos, solo debe llamar a estas funciones.
- **Estructura:** Debe exportar funciones para cada operación CRUD (Create, Read, Update, Delete).

```javascript
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase'; // Ajustar ruta según sea necesario

const COL_NAME = 'productos';

// READ (Obtener todos)
export const getAllProductos = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COL_NAME));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw error;
  }
};

// CREATE
export const createProducto = async (data, userId) => {
  try {
    const docData = {
      ...data,
      fecha_creacion: serverTimestamp(),
      usuario_creo: userId,
      fecha_ultima_actualizacion: serverTimestamp(),
      usuario_ultima_modificacion: userId,
    };
    const docRef = await addDoc(collection(db, COL_NAME), docData);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear el producto:", error);
    throw error;
  }
};

// UPDATE
export const updateProducto = async (id, data, userId) => {
  try {
    const docRef = doc(db, COL_NAME, id);
    const docData = {
      ...data,
      fecha_ultima_actualizacion: serverTimestamp(),
      usuario_ultima_modificacion: userId,
    };
    await updateDoc(docRef, docData);
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    throw error;
  }
};

// DELETE
export const deleteProducto = async (id) => {
  try {
    await deleteDoc(doc(db, COL_NAME, id));
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    throw error;
  }
};
```

---

## Fase 3: Implementación de la Página Principal (CRUD)

**Archivo:** `src/pages/<Entidad>Page.jsx`

- **Responsabilidad:** Mostrar la lista de datos, permitir la búsqueda y gestionar las acciones del usuario (abrir modal para crear/editar, eliminar).
- **Componentes (MUI):** `Box`, `Paper`, `TableContainer`, `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`, `Button`, `IconButton`, `Tooltip`, `Chip`, `TextField`.
- **Lógica:**
    -   Usa `useState` para almacenar la lista de entidades, el estado de carga y el término de búsqueda.
    -   Usa `useEffect` para llamar a la función `getAll<Entidad>` del servicio al montar el componente.
    -   Define las funciones `handleDelete`, `handleOpenModal`, etc., que llaman a las funciones correspondientes del servicio y actualizan el estado local.

### 3.1. Estructura y Layout de la Cabecera

El diseño de la cabecera es **estricto y no debe variar**.

- **Contenedor Principal:** Un componente `Paper` para encerrar toda la cabecera.
- **Disposición:** Un `Box` con `display: 'flex'`, `justifyContent: 'space-between'`, y `alignItems: 'center'`.
- **Lado Izquierdo:**
    -   El **Título del Mantenimiento** (ej. "Mantenimiento de Usuarios") en un `Typography` `variant="h5"` y `fontWeight="bold"`.
- **Lado Derecho:**
    -   Un `Box` contenedor con `display: 'flex'` y `alignItems: 'center'`.
    -   **Búsqueda Inteligente:** Un `TextField` con un icono de `Search` como `InputAdornment`. Debe estar primero.
    -   **Botón Nuevo:** Un `Button` `variant="contained"`, `color="primary"`, con el texto "Nuevo" y el icono `Add`.
    -   **Botón Salir:** Un `Button` `variant="contained"`, `color="error"`, con el texto "Salir" y el icono `ExitToApp`.

### 3.2. Tabla de Datos y Columna de Acciones

- **Estado:** El campo de estado debe mostrarse usando un componente `Chip` de MUI, con `color="success"` para "activo" y `color="error"` para "inactivo".
- **Acciones:** La última columna de la tabla (`<TableCell align="right">`) debe contener **exactamente tres botones de icono**, en el siguiente orden:

    1.  **Activar/Inactivar:**
        -   **Icono:** `<PowerSettingsNew />`
        -   **Color:** `color="error"` si el estado es "activo", `color="success"` si es "inactivo".
        -   **Tooltip:** "Inactivar" o "Activar", dependiendo del estado actual.

    2.  **Editar:**
        -   **Icono:** `<Edit />`
        -   **Color:** `color="primary"`.
        -   **Tooltip:** "Editar".

    3.  **Eliminar:**
        -   **Icono:** `<Delete />`
        -   **Color:** `color="error"`.
        -   **Tooltip:** "Eliminar".

- **Confirmaciones:** Todas las acciones destructivas (cambio de estado, eliminar) deben pedir confirmación al usuario usando `window.confirm()`.

---

## Fase 4: Implementación del Formulario

**Archivo:** `src/components/forms/ProductoForm.jsx`

- **Responsabilidad:** Gestionar la entrada de datos del usuario y las validaciones.
- **Librerías recomendadas:** `react-hook-form` para la gestión del formulario y `zod` para los esquemas de validación.
- **Implementación:**
    -   Título dinámico: "Crear Nuevo Producto" o "Editar Producto".
    -   **Regla Obligatoria:** Cualquier campo que represente una selección de una lista finita de valores (ej. Rol, Tipo de Cliente, **Estado**) **debe** ser implementado usando un componente `Select` de MUI.
    -   **Visibilidad del Estado:** El campo `Select` para el estado solo debe ser visible en el **modo de edición**.
    -   **Estado por Defecto:** Al crear una nueva entidad, el estado debe ser "activo" por defecto y no debe mostrarse en el formulario de creación.
    -   Secciones con títulos y divisores, alineados a la izquierda.
    -   Máximo **3 campos por fila** en la grilla.
    -   **Acciones (al pie del modal):**
        -   **Cancelar:** Variante `outlined`, color `error`, icono `Close`.
        -   **Grabar/Actualizar:** Variante `contained`, color `success`, icono `Save`.

---

## Fase 5: Enrutamiento y Menú de Navegación

1.  **Configurar la Ruta:**
    -   **Archivo:** `src/App.jsx`
    -   Añadir una nueva ruta (`<Route>`) dentro del componente `Routes` que apunte a la nueva página creada.
    ```jsx
    <Route path="/mantenimientos/productos" element={<Productos />} />
    ```

2.  **Añadir al Menú Principal:**
    -   **Colección en Firestore:** `menu`
    -   **Acción:** Añadir un nuevo documento a la colección `menu` para que aparezca en la navegación lateral.
    -   **Configuración del Documento de Menú:**
            -   El campo `ruta` **debe contener la ruta de la URL** que se definió en el enrutador (ej. `/mantenimientos/productos`).
            -   Si el elemento del menú es un título de sección (no navegable), el campo `ruta` debe dejarse vacío.
