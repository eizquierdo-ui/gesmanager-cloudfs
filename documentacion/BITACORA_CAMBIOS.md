# Bitácora de Cambios - GESManager

Este documento tiene como propósito llevar un registro histórico, estructurado y consolidado de todos los mantenimientos, mejoras y correcciones que se implementen en la aplicación **GESManager**. Toda la historia del proyecto se consolida aquí.

---

## Historial Base de Desarrollo (Sesiones S1 a S33)

*Resumen migrado desde los documentos originales del proyecto (`informe-consolidado.md`, `plan-de-ejecucion-GESManager-ClourFS.md` y `plan_mejoras_cotizaciones.md`).*

* **S1-S29 (Cimientos y Mantenimientos):** 
  Migración estratégica de monolito Laravel a arquitectura Serverless NoSQL (Firebase + React). Se construyeron módulos de Autenticación, Sesiones, Accesos, Monedas, Clientes, Categorías y el primer acercamiento a Servicios. 
* **S30-S32 (Módulo de Cotizaciones - Ingreso):** 
  Reconstrucción del módulo central tras un incidente de control de versiones. Se implementó el motor de cálculos de línea, impuestos (IVA, ITP) y el algoritmo de ISR escalonado, culminando con éxito la opción de Ingreso de Cotizaciones y Generación de PDF.
* **S33 (Módulo Kanban y Reportes):** 
  Implementación de la vista "Gestión y Reportes" con diseño Kanban drag-and-drop. Se agregó la lógica de grabar fechas específicas de cambio de estado de las cotizaciones (retroactivas mediante modal) y un reporte analítico de rentabilidad exportable a CSV.

---

## Nueva Funcionalidad: Ordenamiento A-Z y Búsqueda Inteligente de Servicios

- **Fecha:** 14 de Septiembre de 2026 - 16:08 hrs
- **Módulos/Componentes:** `BuscarServicioModal.jsx`, `ServiciosPage.jsx`, `CotizacionesIngresoPage.jsx`
- **Commit:** `feat: Ordenamiento A-Z de servicios, busqueda inteligente en modal de cotizaciones y mantenimiento de servicios con respaldos .1er.bak`
- **Tipo de Cambio:** ✨ Nueva Funcionalidad / 🔍 Búsqueda e Interfaz UI / 🛡️ Respaldos Codebase

### Resumen de la Implementación
Se implementó el ordenamiento alfabético estricto (A-Z) para la selección de servicios por categoría y la funcionalidad de filtrado en tiempo real mediante un campo inteligente de búsqueda, aplicándolo tanto al modal de selección de detalles en Cotizaciones (`+ Agregar Detalle`) como a la pantalla de Mantenimiento de Servicios. Adicionalmente, se instituyó el protocolo de respaldos locales `.1er.bak`.

### Detalles de los Cambios:

1. **Búsqueda Inteligente y Ordenamiento A-Z en Cotizaciones (`BuscarServicioModal.jsx`):**
   - **Buscador Reactivo:** Se agregó un campo `TextField` de búsqueda inteligente con icono de lupa (`SearchIcon`) junto al selector de categoría. Permite al usuario filtrar dinámicamente por cualquier coincidencia en el nombre o detalle del servicio a medida que escribe.
   - **Ordenamiento Alfabético Estricto (A-Z):** Se incorporó una función memoizada (`filteredAndSortedServicios`) utilizando `localeCompare` en español con sensibilidad base para garantizar que, tanto al cargar los servicios de una categoría como al filtrar mediante el buscador, los resultados siempre se mantengan ordenados de la A a la Z.
   - **Indicador Visual de Registros:** Se inyectó un mensaje informativo que notifica el total de servicios visualizados en pantalla (*"Mostrando X de Y servicio(s) cargados (ordenados A-Z)"*).

2. **Ordenamiento A-Z en Mantenimiento de Servicios (`ServiciosPage.jsx`):**
   - **Listado y Filtros A-Z:** Se ajustaron las funciones `fetchCategorias`, `fetchServicios` y el `useMemo` de `filteredServicios` para forzar que la vista principal y las búsquedas por texto estén ordenadas por el nombre del servicio de forma alfabética.
   - **Encabezado Clarificado:** Se renombró el encabezado de la columna principal a **Nombre (A-Z)**.

3. **Protocolo de Respaldos de Código (`.1er.bak`):**
   - Se crearon e integraron al repositorio las copias de seguridad locales `BuscarServicioModal.jsx.1er.bak`, `ServiciosPage.jsx.1er.bak` y `CotizacionesIngresoPage.jsx.1er.bak` como política de resguardo ante modificaciones de código.

---

## Estabilización: Despliegue y Automatización de Backups

- **Fecha:** 25 de Agosto de 2026
- **Módulos/Componentes:** `.github/workflows/backup-db.yml`, `despliegue.ps1`
- **Tipo de Cambio:** 🐛 Corrección de Bugs / 🚀 Despliegue

### Resumen de la Implementación
Se estabilizó y corrigió el proceso automatizado de respaldos diarios de la base de datos y se optimizó el script de despliegue a producción en Firebase, garantizando su correcta ejecución.

### Detalles de los Cambios:

1. **Corrección de Permisos en GitHub Actions (`backup-db.yml`):**
   - Se añadió la directiva explícita `permissions: contents: write` al flujo de trabajo. Esto resolvió definitivamente el error de *Forbidden* que le impedía al bot de automatización subir (push) el archivo JSON del backup de regreso al repositorio.
   - Se simplificó el paso de instalación de dependencias cambiando `npm install firebase-admin` por un `npm install` estándar. Esto previene que el sistema modifique involuntariamente el archivo `package.json` durante el pipeline.

2. **Optimización del Script de Despliegue (`despliegue.ps1`):**
   - Se corrigió el comando de Firebase CLI, reemplazando `npx -y firebase-tools deploy` por `npx firebase deploy` para evitar que el sistema operativo lo ejecutara en un entorno temporal que provocaba el error *"Directory 'dist' for Hosting does not exist"*.
   - Se instaló de forma local y permanente la dependencia `firebase-tools` (`npm install -D firebase-tools`) para garantizar que el entorno siempre encuentre el binario correcto en la ruta del proyecto.

3. **Validación de Arquitectura de Lectura (Backups):**
   - Se documentó y comprobó que la pantalla `BackupPage.jsx` extrae la lista de JSONs conectándose directamente a la API oficial de GitHub en tiempo real, lo que exime al sistema de requerir descargas manuales (`git pull`) o re-despliegues para ver los respaldos generados durante la madrugada.

---

## Nueva Funcionalidad: Módulo de Backups Automatizados

- **Fecha:** 28 de Julio de 2026
- **Módulos/Componentes:** `BackupPage.jsx`, `.github/workflows/backup-db.yml`, `scripts/backup-firestore.js`
- **Tipo de Cambio:** ✨ Nueva Funcionalidad / 🛡️ Seguridad y Respaldo

### Resumen de la Implementación
Se construyó e integró un sistema "serverless" 100% automatizado y gratuito para el respaldo de la base de datos Firestore, emparejado con una interfaz visual administrativa en React para acceder a los archivos generados.

### Detalles de los Cambios:

1. **Automatización Serverless (GitHub Actions):**
   - Se configuró un robot (`backup-db.yml`) programado mediante `cron` para ejecutarse todos los días a las 04:00 AM (hora de Guatemala) o de forma manual bajo demanda.
   - Utiliza las capacidades de cómputo de GitHub para ejecutar un script seguro de Node.js sin necesidad de alquilar servidores adicionales.

2. **Lógica de Extracción e Históricos (`backup-firestore.js`):**
   - El script extrae el 100% de los documentos de todas las colecciones utilizando las credenciales administrativas de Firebase.
   - **Retención Dinámica (Rotativa de 7 días):** Guarda el archivo con el nombre del día (`lunes.json`, `martes.json`, etc.) y lo sobreescribe cada semana.
   - **Histórico Inmutable:** Si el script detecta que es el último día del mes, genera un backup permanente en la subcarpeta `/mensuales` nombrado con el formato `Año_Mes_fin_de_mes.json` (ej. `2026_07_fin_de_mes.json`).

3. **Interfaz de Gestión React (`BackupPage.jsx`):**
   - Se creó una pantalla limpia alineada al diseño de los catálogos del sistema, con tablas independientes para Backups Diarios y Mensuales.
   - Se conecta **en tiempo real** con la API de GitHub para listar los archivos disponibles.
   - Permite la descarga del JSON directo a la computadora local del administrador (botón azul).
   - Se incorporó en el diseño un botón de "Restauración" (naranja), preparado y visualmente bloqueado con un mensaje de alerta, reservado metodológicamente para una Fase 2 de procesos por lotes (Batch).

---

## Nueva Funcionalidad: Fechas Específicas Kanban y Exportación a Excel

- **Fecha:** 28 de Julio de 2026
- **Módulos/Componentes:** `GestionReportesPage.jsx`, `ConfirmarFechaEstadoModal.jsx`, `cotizacionesService.js`
- **Tipo de Cambio:** ✨ Nueva Funcionalidad / 📊 Reportes

### Resumen de la Implementación
Se completaron las funcionalidades pendientes del módulo Kanban, permitiendo establecer fechas retroactivas precisas al cambiar el estado de las cotizaciones y se introdujo la exportación tabular nativa a Excel con un cálculo automatizado de ganancias.

### Detalles de los Cambios:

1. **Fechas Retroactivas en Kanban (`ConfirmarFechaEstadoModal`):**
   - Se interceptó el evento de arrastrar y soltar (Drag & Drop) del Kanban.
   - Al soltar una tarjeta en una nueva columna, el sistema ya no guarda automáticamente. En su lugar, despliega un modal solicitando confirmar la fecha exacta del cambio.
   - Si se confirma, se actualiza en Firebase tanto el campo global `fecha_estado` como el campo de trazabilidad específico correspondiente (`fecha_aceptacion`, `fecha_rechazo`, `fecha_venta_facturacion`, o `fecha_anulacion`). Si se cancela, la tarjeta retorna a su origen visual.

2. **Exportación Nativa a Excel (`xlsx`):**
   - Se reemplazó la idea original de CSV por la librería `xlsx` para soporte robusto de archivos Excel.
   - Se añadió el botón **"Excel"** en la barra superior junto a los filtros (Cliente y Fechas).
   - El reporte extrae las cotizaciones cargadas en pantalla (según los filtros), presentándolas en formato tabular con las mismas columnas de la tarjeta, y añadiendo el `Año` y `Mes` (numérico, ej. `07`) explícitamente para agrupación.
   - **Métricas Financieras:** Se incluyeron las columnas de `% Fee` (tomado de `total_tasa_feeglobal_aplicada`) y el cálculo absoluto del `Monto Fee (Q)` (diferencia entre el total final y el costo base), extrayéndolos directamente de Firebase.

3. **Mantenimiento y Correcciones (Filtros e Índices):**
   - **Orden Alfabético:** La lista desplegable de clientes en la barra de filtros del Kanban ahora se ordena estrictamente de la A a la Z.
   - **Evasión de Índices Compuestos:** Se migró el filtrado de fechas desde la consulta de Firestore hacia la memoria de la aplicación (JavaScript). Esto resolvió el bloqueo en Firebase al intentar cruzar una búsqueda por "Cliente" más un rango de "Fechas", evitando la obligación de crear índices compuestos manuales por cada combinación posible.

---

## Refactorización: Módulo de Precios de Servicios

- **Fecha:** 08 de Junio de 2026
- **Módulo/Componente:** `PrecioServicioModal.jsx` y `serviciosService.js` (Mantenimiento de Servicios)
- **Tipo de Cambio:** 🚀 Mejora (Refactorización) / 🐛 Corrección de Bugs

### Resumen de la Implementación
Se rediseñó por completo la lógica de cálculos y experiencia de usuario en la ventana de asignación de precios a servicios, integrando precisión fiscal guatemalteca y un motor de cálculo bidireccional.

### Detalles de los Cambios:

1. **Corrección Fiscal y Manejo de ITP:**
   - Se ajustó el divisor para el desglose de impuestos dependiendo de si el servicio incluye o no ITP.
   - **Fórmula sin ITP:** Precio de Venta ÷ `1.12` (para aislar el 12% de IVA).
   - **Fórmula con ITP:** Precio de Venta ÷ `1.125` (para aislar el 12% de IVA y el 0.5% de ITP).

2. **Cálculo Bidireccional (Override de Precio Venta):**
   - El `% de Impuestos` (ej. 21%) ahora es un valor estable que no se recalcula solo, sino que sirve como ancla.
   - Si el usuario **ingresa un Precio de Venta de forma manual**, el sistema calcula hacia atrás el `Costo+Fee Global` (dividiendo entre `1.21`) y ajusta dinámicamente el `% Fee Global` para que la matemática coincida con los costos base (que se mantienen intactos).
   - Si el usuario modifica los costos base, el sistema calcula hacia adelante el Precio de Venta Automático.

3. **Mejora en la Entrada de Datos (Decimales Fluidos):**
   - Se eliminó el problema nativo de React con los `input type="number"` que bloqueaba el ingreso de puntos decimales.
   - Todos los campos numéricos (Costos, % Fee, % Impuestos, % IVA, % ISR, % ITP, Precio Venta) ahora se manejan como cadenas de texto en el estado, permitiendo una escritura fluida (ej. `4600.50`, `7.25`) sin perder precisión, y transformándose en números reales únicamente al calcular o al guardar en base de datos.

4. **Detección Inteligente para Guardar (`hasChanges`):**
   - El botón de **Grabar** ahora escucha cualquier alteración en el modal:
     - Cambios en las descripciones de los rubros.
     - Cambios en los valores numéricos de los costos o sus % Fee.
     - Cambios en cualquiera de las tasas de impuestos (% IVA, % ISR, % ITP, % Impuestos).
     - Entradas de precios manuales.

5. **Mantenimiento y Estabilidad del Código:**
   - Se corrigió un typo histórico en la base de datos de Firestore (`valor_impuetos` → `valor_impuestos`).
   - El sistema de UI se simplificó, eliminando condicionales redundantes al cargar el servicio.

---

## Nueva Funcionalidad y Mantenimiento: Copiar Cotizaciones y Empresas

- **Fecha:** 17 de Junio de 2026
- **Módulos/Componentes:** `CotizacionesIngresoPage.jsx`, `CopiarCotizacionModal.jsx`, `Empresas.jsx`
- **Tipo de Cambio:** ✨ Nueva Funcionalidad / 🐛 Corrección de Bugs

### Resumen de la Implementación
Se introdujo la capacidad de duplicar cotizaciones existentes hacia clientes nuevos para agilizar los procesos de venta, además de resolver problemas de usabilidad en el módulo de mantenimiento de empresas.

### Detalles de los Cambios:

1. **Funcionalidad "Copiar Cotización":**
   - **Nuevo Botón y Modal:** Se incorporó un botón en la interfaz principal que despliega un modal dedicado para el proceso de clonación.
   - **Selección de Cliente Destino:** El modal permite buscar y asignar un nuevo cliente a la cotización clonada, pre-cargando los datos del cliente original por defecto.
   - **Diseño Inflexible (Grid UI):** Se ajustó estrictamente la interfaz del modal usando fracciones absolutas (`xs={3}`, `xs={3}`, `xs={6}`) para forzar que la información del cliente (Número, NIT, Nombre) siempre se mantenga en una sola línea horizontal, independientemente del tamaño de la pantalla, suprimiendo además el campo "Código Cliente".
   - **Preservación y Reinicio de Estado:** El proceso retiene todos los ítems de servicio, las condiciones de pago y los montos. Simultáneamente, limpia el número de cotización (asignando el correlativo siguiente disponible de forma temporal), actualiza la fecha de emisión al día actual y coloca el registro en estado de **"borrador"**.
   - **Protección de Hooks:** Se sustituyó la dependencia de `cotizacionCargada` en el `useEffect` inicial por una referencia mutada (`hasInitialized.current`) para evitar el borrado automático de la tabla al reiniciar el estado de la cotización original.

2. **Mantenimiento de Empresas:**
   - **Corrección de Interfaz (Z-Index/Flexbox):** Se reparó un defecto visual en el que el título del módulo (`Typography` con `flex: '1 1 100%'`) se sobreponía de manera invisible al botón de **+ Nuevo**, interceptando los clics y haciéndolo inoperante. Se reemplazó por la propiedad correcta `flexGrow: 1`.
   - **Inicialización de Entorno de Pruebas:** Se implementó una lógica de autocompletado en la función de consulta; si el sistema detecta que la base de datos de empresas está vacía, genera e inserta automáticamente una "Empresa de Pruebas S.A." con parámetros fiscales válidos preconfigurados para facilitar la experimentación inmediata.
