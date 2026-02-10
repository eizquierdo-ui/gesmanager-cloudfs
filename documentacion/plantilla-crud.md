# Guía Maestra para Módulos CRUD en GESManager-CloudFS

*Última Actualización: 24 de Julio de 2024*

Este documento establece el estándar, la arquitectura y la metodología a seguir para la creación de cualquier módulo de Mantenimiento (CRUD), asegurando consistencia, mantenibilidad y rapidez en el desarrollo.

**El CRUD de "Mantenimiento de Empresas" es la implementación de referencia.**

---

## 1. Fase 1: Análisis y Preparación (Antes de Escribir Código)

1.  **Validar Modelo de Datos:**
    *   Consultar la colección correspondiente en el documento `plan-de-ejecucion-GESManager-CloudFS.md`.
    *   Verificar con el usuario que todos los campos necesarios están definidos. La estructura de datos debe estar **completa y validada** antes de continuar.

2.  **Definir Requisitos de Interfaz:**
    *   Especificar qué campos se mostrarán en la tabla principal.
    *   Definir todos los campos que se incluirán en el formulario de creación/edición.

---

## 2. Fase 2: Arquitectura y Estructura de Archivos

Para un nuevo módulo (ej. "Clientes"), la estructura de carpetas será la siguiente:

/src/
|-- /pages/
|   |-- /Clientes/
|       |-- ClientesPage.jsx      # Componente principal: Orquesta la vista.
|-- /components/
|   |-- /clientes/
|       |-- ClienteForm.jsx       # Formulario para crear y editar.
|-- /services/
|   |-- firestore/
|       |-- clientesService.js  # Lógica de negocio y acceso a datos.

---

## 3. Fase 3: Implementación de la Lógica (Capa de Servicios)

Se debe crear un archivo `[modulo]Service.js` que centralice toda la comunicación con Firestore. Los componentes de React **nunca deben interactuar directamente con la base de datos**.

*   **Responsabilidad:** Abstraer las operaciones CRUD.
*   **Funciones a exportar:**
    *   `getAll[Entidades](queryParams)`: Obtiene la colección (con filtros, paginación).
    *   `get[Entidad]ById(id)`: Obtiene un único documento.
    *   `create[Entidad](data)`: Crea un nuevo documento.
    *   `update[Entidad](id, data)`: Actualiza un documento.
    *   `delete[Entidad](id)`: Elimina un documento.
    *   `set[Entidad]Status(id, newStatus)`: Cambia el estado (activo/inactivo).
*   **Manejo de Errores:** Todas las funciones de este servicio deben estar envueltas en bloques `try...catch` para capturar y registrar errores en la consola, evitando que la aplicación se bloquee.

---

## 4. Fase 4: Implementación Visual (Componentes de React)

### 4.1. Pantalla Principal (`...Page.jsx`)

*   **Responsabilidad:** Orquestar la obtención y visualización de datos usando la capa de servicios. Manejar estados de carga y error.
*   **Barra de Herramientas:**
    *   Título: "Mantenimiento de [Entidad]".
    *   Campo de búsqueda a la derecha.
    *   Botón `+ Nuevo` (icono `Add`, variante `contained`, color `primary`).
    *   Botón `Salir` (icono `ExitToApp`, variante `contained`, color `error`).
*   **Tabla de Datos:**
    *   Mostrar un indicador de carga (`<CircularProgress />`).
    *   **Acciones por Fila:**
        *   **Activar/Inactivar:** `Switch` o `IconButton` (`ToggleOn` / `ToggleOff`).
        *   **Editar:** `IconButton` con `EditTwoTone` (color `primary`).
        *   **Eliminar:** `IconButton` con `DeleteForeverTwoTone` (color `error`).

### 4.2. Formulario Modal (`...Form.jsx`)

*   **Responsabilidad:** Gestionar la entrada de datos del usuario y las validaciones.
*   **Librerías recomendadas:** `react-hook-form` para la gestión del formulario y `zod` para los esquemas de validación.
*   **Implementación:**
    *   Título dinámico: "Crear Nueva [Entidad]" o "Editar [Entidad]".
    *   Secciones con títulos y divisores, alineados a la izquierda.
    *   Máximo **3 campos por fila** en la grilla.
    *   **Acciones (al pie del modal):**
        *   **Cancelar:** Variante `outlined`, color `error`, icono `Close`.
        *   **Grabar/Actualizar:** Variante `contained`, color `success`, icono `Save`.

---

## 5. Fase 5: Experiencia de Usuario y Robustez

*   **Confirmaciones:** Antes de cualquier acción destructiva (eliminar, cambiar estado), solicitar confirmación explícita del usuario. Se puede usar `window.confirm()` como base.
*   **Feedback al Usuario:** Mostrar notificaciones (`toast`) de éxito o error tras realizar una operación (ej. "Cliente creado correctamente").

---

## 6. Fase 6: Integración Final

1.  **Añadir Ruta:** Integrar la nueva página en el sistema de enrutamiento principal de la aplicación (`/src/App.jsx`).

2.  **Añadir al Menú:** Crear o actualizar el documento correspondiente en la colección `menu` de Firestore.

    *   **Configuración del Documento de Menú:**
        *   El campo `ruta` **debe contener la ruta de la URL** que se definió en el enrutador (ej. `/mantenimientos/clientes`). Este campo es el que permite que el menú redirija a la pantalla correcta.
        *   Si el elemento del menú es un **título de sección o un contenedor de sub-menús que no es navegable por sí mismo**, el campo `ruta` **debe dejarse vacío**. Estos elementos suelen corresponder a los que tienen el campo `es_fija` establecido en `true`.
