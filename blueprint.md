# Blueprint S33: Módulo de Gestión de Cotizaciones (Kanban Flow)

*Última Actualización: 27/02/2026*

## 1. Visión General

Se abandona la idea de una tabla de registros tradicional en favor de una **herramienta de gestión de flujo de trabajo (Kanban)**, que permitirá visualizar y gestionar el ciclo de vida completo de las cotizaciones de una forma moderna, interactiva y visualmente intuitiva.

---

## 2. Requisitos Funcionales y de Diseño

*   **[x] Vista de Tablero (Board):** La pantalla principal será un contenedor horizontal con scroll que albergará múltiples columnas. Sobre el tablero, se mantendrá un panel de filtros de búsqueda.

*   **[x] Columnas (Estados):**
    *   El tablero se dividirá en 5 columnas verticales: `Borrador`, `Rechazada`, `Aceptada`, `Venta`, `Anulada`.
    *   Cada columna tendrá un **color representativo** en su encabezado.
    *   El encabezado mostrará información agregada en **dos líneas** para optimizar espacio:
        *   Línea 1: `[Nombre del Estado]`
        *   Línea 2: `(X) - Q. Y,YYY.YY` (Cantidad de cotizaciones y Suma del total de venta).

*   **[x] Tarjetas (Cotizaciones):**
    *   Cada cotización se representará como una tarjeta dentro de la columna de su estado.
    *   La tarjeta mostrará la siguiente información: `Numero_cotizacion` (título), `Nombre cliente`, `Contacto`, `Telefono Contacto`, y `Total Cotizacion`.

*   **[x] Funcionalidad de Arrastrar y Soltar (Drag-and-Drop):**
    *   El usuario podrá arrastrar tarjetas entre columnas.
    *   Al soltar una tarjeta en una nueva columna, se actualizará el campo `estado` en el documento de Firestore correspondiente.
    *   Se utilizará la librería `@dnd-kit` para esta funcionalidad.

*   **[x] Modal de Detalle (Doble Clic):**
    *   Al hacer doble clic en una tarjeta, se abrirá un modal.
    *   El contenido del modal mostrará la información completa de la cotización, maquetada de forma visual **simulando el diseño de la impresión PDF**.

*   **[x] Acciones Dentro del Modal:**
    *   **Botón "Imprimir Cotizacion":** Reutilizará el componente `ImprimirCotizacionModal.jsx` existente.
    *   **Botón "Copiar Cotización":** Creará una nueva cotización con el siguiente correlativo, estado "Borrador", y toda la información de la cotización actual.

---

## 3. Checklist del Plan de Acción por Fases

### Fase 1: Preparación del Entorno
- [x] **1.1.** Instalar la librería para Drag-and-Drop (`@dnd-kit/core`, `@dnd-kit/sortable`).
- [x] **1.2.** Crear y validar este archivo `blueprint.md`.

### Fase 2: Construcción del Layout Estático del Tablero
- [x] **2.1.** Crear el componente `GestionReportesPage.jsx`.
- [x] **2.2.** Añadir la nueva ruta `/cotizaciones/gestion` en `src/App.jsx`.
- [x] **2.3.** Renderizar el panel de filtros y las 5 columnas de estado (vacías) aplicando los estilos de encabezado (color y dos líneas).

### Fase 3: Carga y Renderizado de Datos
- [x] **3.1.** Implementar la lógica para obtener las cotizaciones de Firestore según los filtros.
- [x] **3.2.** Procesar los datos en el frontend para agruparlos por estado.
- [x] **3.3.** Calcular los totales por columna (cantidad y suma de montos).
- [x] **3.4.** Renderizar las tarjetas (aún sin D&D) en sus columnas correspondientes.

### Fase 4: Implementación de Drag-and-Drop
- [x] **4.1.** Envolver las columnas y tarjetas con los componentes de la librería `@dnd-kit`.
- [x] **4.2.** Implementar la función `onDragEnd` que se activará al soltar una tarjeta.
- [x] **4.3.** Dentro de `onDragEnd`, escribir la lógica para actualizar el estado de la cotización en Firestore.

### Fase 5: Implementación del Modal de Detalle
- [x] **5.1.** Crear el componente del modal de detalle.
- [x] **5.2.** Añadir el evento `onDoubleClick` a las tarjetas para abrir el modal.
- [x] **5.3.** Maquetar el contenido del modal para que simule la vista de impresión.

### Fase 6: Implementación de Acciones del Modal
- [x] **6.1.** Conectar el botón "Imprimir" para que reutilice el modal existente.
- [x] **6.2.** Implementar la lógica completa del botón "Copiar Cotización".