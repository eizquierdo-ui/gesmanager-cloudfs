# Plantilla Maestra para Módulos CRUD en GESManager-CloudFS

**Última Actualización:** 15 de Febrero de 2026 (Refactorización Mayor)

Este documento es el **manual de operaciones definitivo** para construir módulos de mantenimiento (CRUD). Es el resultado de un análisis exhaustivo de los patrones funcionales del proyecto y establece el protocolo estricto a seguir.

**Propósito:** Estandarizar el desarrollo para que sea predecible, eficiente y colaborativo, eliminando la ambigüedad y los errores desde la concepción de un nuevo módulo.

---
Revisar imperativamente package.json para entender todo lo que ya tienes configurado.

## Fase 0: Definición y Análisis de Datos (Diálogo Inicial)

Esta es la fase más crítica y es el punto de partida **obligatorio** para cualquier nuevo requerimiento. El objetivo es tener una comprensión total de los datos antes de escribir una sola línea de código de interfaz.

### 0.1. Diálogo sobre la Colección Principal

Como IA, mi primera acción será siempre preguntarte:

> **"Para el nuevo módulo de [nombre del módulo], ¿la colección principal de datos ya existe en Firestore?"**

#### **Caso A: La colección SÍ existe.**

1.  **Mi Acción:** "Entendido. Procederé a consultar la colección y te presentaré la estructura de un documento de ejemplo para que la validemos juntos."
2.  **Ejecución:** Usaré las herramientas de Firestore para leer un documento de la colección que me indiques.
3.  **Análisis y Validación:** Te presentaré un desglose de los campos y sus tipos de datos.
4.  **Tu Acción:** Deberás confirmar si esa es la estructura correcta sobre la que debemos trabajar.

#### **Caso B: La colección NO existe.**

1.  **Mi Acción:** "Perfecto. Definamos juntos la estructura de esta nueva colección. Para un documento en la colección `[nombre_de_la_coleccion]`, ¿qué campos debemos crear?"
2.  **Diálogo de Diseño:** Discutiremos los campos, sus tipos (`string`, `number`, `boolean`, `timestamp`, `map`, etc.).
3.  **Análisis de Relaciones (CRÍTICO):** Te preguntaré específicamente:
    > **"Importante: ¿Alguno de estos campos es un ID que se relaciona con otra colección (ej. `empresa_id`, `usuario_id`, `rol_id`)?"**
4.  **Esquema Final:** Una vez definidos, te presentaré un esquema final para tu aprobación. Ejemplo:
    *   `label`: `string`
    *   `ruta`: `string`
    *   `padre_id`: `string` (relacionado con la misma colección `menu`)
    *   `orden`: `number`
    *   `estado`: `string` ('activo'/'inactivo')
5.  **Creación:** Solo con tu validación final, procederé a crear la colección con un documento inicial si es necesario.

---

## Fase 1: Análisis del Patrón de UI Existente (Ingeniería Inversa)

Una vez definidos los datos, el siguiente paso es entender CÓMO se debe construir la interfaz. **Principio fundamental: No inventamos nuevos diseños. Replicamos los patrones exitosos que ya existen.**

Nuestro modelo maestro es el modelol CRUD de **Clientes** (`src/pages/mantenimientos/ClientesPage.jsx` , `src/components/forms/ClienteForm.jsx` y `src/services/firestore/clienteService.js`).

### 1.1. Anatomía de la Página Principal

La pantalla que muestra la lista de registros debe seguir esta estructura:

*   **Contenedor:** Un `<Paper>` de MUI que envuelve todo.
*   **Barra de Herramientas (`<Toolbar>`):**
    *   **Izquierda:** Título (`<Typography variant="h6">`). Ej: "Mantenimiento de Menú".
    *   **Derecha:** En este orden: `<TextField>` de búsqueda, `<Button>` "+ Nuevo", `<Button>` "Salir".
*   **Tabla de Datos (`<Table>`):**
    *   **Cabeceras (`<TableHead>`):** En negrita (`fontWeight: 'bold'`).
    *   **Estado Visual:** Los campos de estado ('activo'/'inactivo') deben usar un `<Chip>` de MUI con color `success` o `error`.
    *   **Columna de Acciones:** La última columna, alineada a la derecha. Debe contener **exactamente tres** `<IconButton>`, cada uno dentro de un `<Tooltip>`:
        1.  **Activar/Inactivar:** Un `ToggleOnIcon` o `ToggleOffIcon`.
        2.  **Editar:** Un `EditTwoToneIcon`. Abre el modal en modo edición.
        3.  **Eliminar:** Un `DeleteForeverTwoToneIcon`.

### 1.2. Anatomía del Formulario Modal

El formulario para crear/editar es la pieza más compleja y debe replicar este patrón:

*   **Tecnología:** **Formik** para la gestión del estado y **Yup** para la validación.
*   **Estructura y Secciones:**
    *   El formulario debe estar organizado en secciones lógicas usando `<Divider textAlign="left">` con una `<Typography variant="h6">` como título. Ej: "Información Principal", "Jerarquía y Estilo".
    *   Los campos se organizan con un sistema de `<Grid container>` con un máximo de **3 campos por fila** (`<Grid item xs={12} sm={4}>`).
*   **Comportamiento Condicional y Campos Clave:**
    *   **Título:** Dinámico (`currentData ? 'Editar Registro' : 'Crear Nuevo Registro'`).
    *   **Inicialización:** Los `initialValues` de Formik deben usar `initialData?.campo || 'valor_por_defecto'` para manejar ambos modos (creación y edición).
    *   **Campo `ID` / Clave:** Cualquier campo que actúe como ID único debe estar **deshabilitado (`disabled`) en modo edición**.
    *   **Campo `Estado`:** Debe implementarse con el componente personalizado `EstadoSwitch`, que traduce el `true/false` del switch a los strings `'activo'/'inactivo'` usando `setFieldValue`.
    *   **Campos de Selección (`<Select>`):** Para campos que son IDs de otras colecciones (ej. `padre_id`), se debe usar un `<TextField select>`.
*   **Botones de Acción (Pie del Modal):**
    *   Alineados a la derecha, separados por un `borderTop`.
    *   **"Cancelar":** `variant="outlined"`, color `error`.
    *   **"Guardar/Actualizar":** `variant="contained"`, color `success`. El texto es dinámico (`isEditing ? 'Actualizar' : 'Grabar'`) y muestra un `<CircularProgress>` cuando `isSubmitting` es `true`.
*   **Sección de Auditoría:** Si el registro tiene campos de `fecha_creacion` o `fecha_ultima_actualizacion`, se deben mostrar en la parte inferior del modal (solo en modo edición), formateados con una función de ayuda.

---

## Fase 2: Habilitación del Módulo en el Menú

Si en la `Fase 0` determinamos que la opción de menú para nuestro nuevo CRUD no existe, este es el momento de crearla de forma segura.

*   **Acción:** Utilizar un script de Node.js en la carpeta `/scripts` para crear atómicamente los documentos necesarios en las colecciones `menu` y `roles-accesos`.
*   **Justificación:** Esto garantiza la integridad de la base de datos. Un script previene errores manuales, como olvidar asignar el permiso o vincular incorrectamente un menú hijo a su padre.
*   **Post-Ejecución:** Una vez que el script se ejecuta y se verifica el resultado, se añade la `<Route>` correspondiente en `src/App.jsx`.

---

## Fase 3: Construcción del Módulo (Ejecución)

Con los datos definidos, el patrón de UI analizado y el menú listo, procedemos a la implementación.

1.  **Crear Estructura de Archivos:**
    *   Servicio: `src/services/firestore/[nombreModulo]Service.js`
    *   Página: `src/pages/[categoria]/[NombreModulo]Page.jsx`
    *   Formulario: `src/components/forms/[NombreModulo]Form.jsx`
2.  **Implementar:** Escribir el código, siguiendo fielmente los patrones y la anatomía descritos en la `Fase 1`. El proceso es de **copia y adaptación**, no de reinvención.

