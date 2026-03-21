# Blueprint del Proyecto: GESManager-CloudFS

*Este documento es la bitácora de vida y la fuente única de verdad del proyecto. Condensa la historia, las lecciones aprendidas y define las acciones para la sesión actual.*

## Información General

*   **Fecha inicio proyecto:** 09/02/2026
*   **Fecha ultima actualizacion proyecto:** 25/02/2026
*   **Total horas acumuladas proyecto:** 140 hrs  15 min
*   **Ultima sesion:** S32
*   **Proxima sesion:** S33 
---

## I. Propósito y Origen del Proyecto

El proyecto **GESManager-CloudFS** nace como una **migración estratégica** desde un sistema monolítico tradicional (`GESManager` con Laravel/MySQL) hacia una arquitectura moderna, **100% serverless y nativa de la nube**, operando enteramente dentro del ecosistema de Firebase. El paradigma cambia radicalmente: se abandona una lógica de backend centralizada en favor de un modelo donde **React se convierte en el cerebro de la aplicación**, interactuando directamente con **Cloud Firestore**.

---
## II. Stack Tecnológico y Arquitectura Final

*   **Core Frontend:** React `^19.2.0` con Vite `^7.2.4`.
*   **Backend y Base de Datos:** Firebase `^12.9.0` (utilizando Cloud Firestore como base de datos NoSQL).
*   **Autenticación:** Firebase Authentication.
*   **Librería de Componentes UI:** Material-UI (MUI) con `@mui/material` `^7.3.7`.
*   **Estilos:** `@emotion/react` y `@emotion/styled`.
*   **Iconografía:** `@mui/icons-material` y `react-icons`.
*   **Gestión de Formularios:** Formik `^2.4.9` con validación de esquemas mediante Yup `^1.7.1`.
*   **Routing:** `react-router-dom` `^7.13.0`.
*   **Utilidades de Fechas:** `date-fns` `^4.1.0`.
*   **Hosting:** Firebase Hosting.

### **Sintaxis Correcta para la Introspección de Datos en Firestore**

Tras una dolorosa y prolongada serie de fallos, se ha establecido el método canónico y **único** para que el asistente de IA consulte la estructura de las colecciones de Firestore directamente desde el entorno de Firebase Studio. Cualquier desviación de este método es un error.

El método **NO** consiste en modificar el código de la aplicación cliente (React). Consiste en ejecutar un comando de Node.js de una sola línea directamente en la terminal del IDE, utilizando el SDK de **`firebase-admin`**. Las credenciales se infieren automáticamente del entorno.

**Comando de Ejemplo:**

Este comando consulta un único documento de las colecciones `cotizaciones`, `sesiones` y `correlativos` para revelar su estructura sin crear archivos temporales ni modificar el código fuente.

```bash
node -e "const admin = require('firebase-admin'); try { admin.initializeApp({ projectId: 'gesmanager-cloundfs' }); } catch (e) {} const db = admin.firestore(); async function getStructures() { console.log('--- ESTRUCTURA DE COLECCIONES ---'); const cotizaciones = await db.collection('cotizaciones').limit(1).get(); if (!cotizaciones.empty) { console.log('COTIZACION:', cotizaciones.docs[0].data()); } else { console.log('COTIZACION: No se encontraron documentos.'); } const sesiones = await db.collection('sesiones').limit(1).get(); if (!sesiones.empty) { console.log('SESION:', sesiones.docs[0].data()); } else { console.log('SESION: No se encontraron documentos.'); } const correlativos = await db.collection('correlativos').limit(1).get(); if (!correlativos.empty) { console.log('CORRELATIVO:', correlativos.docs[0].data()); } else { console.log('CORRELATIVO: No se encontraron documentos.'); } } getStructures();"
```

Esta es la lección aprendida y la forma correcta de proceder en el futuro.

---
## III. Estructura de Navegación (Colección: `menu2`)

| id | Label | Orden | id_padre | es_padre | Icon | Ruta |
|:---|:---|:---|:---|:---|:---|:---|
| 1 | Inicializar | 10 | null | TRUE | settings | |
| 2 | Empresa | 11 | 1 | FALSE | business | /inicializar/empresa |
| 3 | Tipo Cambio | 12 | 1 | FALSE | currency_exchange | /inicializar/tipo-cambio |
| 12| Monedas | 13 | 1 | FALSE | monetization_on | /inicializar/monedas |
| 4 | Accesos | 20 | null | TRUE | settings | |
| 5 | Empresas | 21 | 4 | FALSE | store | /accesos/empresas |
| 6 | Usuarios | 22 | 4 | FALSE | people | /accesos/usuarios |
| 7 | Roles | 23 | 4 | FALSE | MdManageAccounts | /accesos/roles |
| 8 | Usuarios x Empresa| 24 | 4 | FALSE | group_add | /accesos/usuarios-x-empresa |
| 9 | Crear Menu | 30 | null | TRUE | menu_book | |
| 10| Menu | 31 | 9 | FALSE | list | /crear-menu/menu |
| 11| Roles/Accesos | 32 | 9 | FALSE | security | /crear-menu/roles |
| 16| Mantenimientos | 40 | null | TRUE | build | |
| 17| Clientes | 41 | 16 | FALSE | people | /mantenimientos/clientes |
| 18| Categorias | 42 | 16 | FALSE | category | /mantenimientos/categorias |
| 19| Servicios | 43 | 16 | FALSE | miscellaneous_services| /mantenimientos/servicios |
| 20| Cotizaciones | 50 | null | TRUE | request_quote | |
| 21| Ingreso | 51 | 20 | FALSE | add_shopping_cart | /cotizaciones/ingreso |
| 22| Gestion y Reportes| 52 | 20 | FALSE | summarize | /cotizaciones/gestion |
| 23| Utilidades | 60 | null | TRUE | home_repair_service | |
| 24| Backup/Import | 61 | 23 | FALSE | backup | /utilidades/backup |
| 26| Refrescar Datos | 70 | null | FALSE | refresh | /refrescar-datos |
| 27| Modelar Precios | 80 | null | FALSE | sale | /modelar-precios |

---
## IV. Flujo Crítico: Lógica de Inicialización Forzada

*Esta sección describe la lógica de negocio que garantiza que ningún usuario pueda operar sin haber configurado los parámetros mínimos del sistema.*

**Análisis de Implementación (Hallazgo Clave):**
> La revisión del código (`Home.jsx` y relacionados) ha determinado que **la lógica de redirección forzada NO ESTÁ IMPLEMENTADA**. Aunque los datos se cargan, el sistema no bloquea activamente al usuario. La siguiente descripción detalla el flujo **requerido**, sirviendo como especificación para una futura corrección.

**Lógica Requerida:**
1.  **Autenticación y Carga de Sesión:** Tras el login, el usuario es redirigido a `Home.jsx`, donde el `AppContext` carga el documento de sesión desde Firestore (`/sesiones/{uid}`).
2.  **Punto de Control en `Home.jsx`:** Un `useEffect` debe vigilar `sessionData`:
    *   **Si `!sessionData.empresa_id`:** Redirección forzada a `/inicializar/empresa`.
    *   **Si `sessionData.empresa_id && !sessionData.tipo_cambio_id`:** Redirección forzada a `/inicializar/tipo-cambio`.
3.  **Acceso Concedido:** Solo si ambas IDs existen, se permite la renderización de la ruta solicitada.

---
## V. Línea de Tiempo Real de Versiones (Commits y Restauraciones)

*   **S9:** **RESTAURACIÓN.** Se revierte un commit para recuperar el componente `Sidebar` destruido.
*   **S13:** **RESTAURACIÓN.** Se realizan múltiples restauraciones del repositorio por la "catástrofe" en el Módulo de Accesos.
*   **S29:** **HITO (SQUASH).** Se consolida el historial (S1-S29) en un único commit base: `089d631 feat: Consolidación de Arquitectura Base y Módulos Funcionales (S01-S29)`.
*   **S30:** **DESASTRE Y REGRESIÓN.** Tras una alerta de seguridad, se intenta purgar un archivo con `git-filter-repo`. Por no hacer commit del trabajo funcional, un `git push --force` destruye horas de avance. El repositorio es forzado a un estado anterior e incompleto. Se pierde toda la UI de totales de cotización.
*   **S30 (Post-desastre):** Se crean dos commits para la reconstrucción:
    *   `213186c feat (Commit 3): Hacer de nuevo todas la funcionalidades...`
    *   `e552a67 feat (Commit 4): Se termina con normalizar la visualizacion...`
*   **S31:** Se añade el commit de la implementación del detalle de cotización: `248ab45 feat(commit 2): Cotizaciones Implementación de todo el preceso de ingreso de servicios...`
*   **S32:** Se finaliza el módulo de ingreso de cotizaciones con el commit: `7e2842e feat (commit 3): Finaliza todas la funcionalides y proceso de la Opcion: Cotizaciones - Ingreso QUEDA AL 100% - (S32).`

---
## VI. Historia de Desarrollo (Resumen Narrativo por Módulo)

*   **Módulo 1: Cimientos (Navegación, Sesión, Autenticación)**
    *   **Puntuación:** 81/100 (Sesiones S3-S24)
    *   **Resumen:** Inicio turbulento con la destrucción y recuperación del `Sidebar` (S6, S9). El mayor desafío fue estabilizar el **documento de sesión**, plagado de errores de creación, inconsistencias y corrupción de datos. Su resolución fue costosa pero fundamental.
*   **Módulo 2: Accesos (CRUDs de Baja Calidad)**
    *   **Puntuación:** 41/100 (Sesiones S5-S13)
    *   **Resumen:** El punto más bajo del proyecto. Caracterizado por la ineficiencia, el desprecio por las plantillas y una **catástrofe total (S13)** que necesitó múltiples restauraciones. Lección crítica sobre disciplina.
*   **Módulo 3: Mantenimientos (Renacimiento de la Calidad)**
    *   **Puntuación:** 95/100 (Sesiones S16-S20)
    *   **Resumen:** Un giro de 180 grados. Con bases estables, los CRUDs se implementaron de forma **fluida, rápida y con alta calidad**, demostrando el valor de cimientos sólidos.
*   **Módulo 4: Cotizaciones - Ingreso (Creación, Destrucción, Reconstrucción)**
    *   **Puntuación:** 30/100 (S30), 70/100 (S32)
    *   **Resumen:** El corazón de la aplicación. Se construyó una UI de calidad (S22-S29), pero fue **destruida en la S30** por un `git push --force` negligente. Las sesiones S30-S32 se dedicaron a una dolorosa pero **exitosa reconstrucción**, estabilizando la funcionalidad por completo.

---
## VII. Lecciones de Oro (Principios Rectores)

1.  **La Integridad de la Sesión No es Negociable:** Ante un error inexplicable, la primera acción es **validar el documento de sesión en Firestore**.
2.  **No perder funcionalidades existentes:** Al agregar o modificar algun archivo o componente no se pueden perder la funcionalidades ya existenes.
3.  **La Disciplina Supera a la Creatividad:** Seguir patrones en tareas repetitivas es un requisito para la eficiencia.
4.  **Verificación Post-Operación es la Red de Seguridad:** **NUNCA** asumir que una operación crítica tuvo éxito sin verificarla en la fuente de datos.
5.  **`git push --force` es el Botón Nuclear:** Solo usarlo como último recurso y después de haber **guardado y verificado el trabajo local al 100%**.

---
## VIII. Plan de Acción: Módulo "Gestión y Reportes de Cotizaciones" (S33)

*   **Objetivo:** Desarrollar la nueva opción de menú "Gestion y Reportes" (`id: 22`, `ruta: /cotizaciones/gestion`).
*   **Análisis Funcional:** Basado en el estudio de las imágenes de la Sesión 33, la pantalla se compondrá de dos vistas intercambiables.

### **Vista 1: Gestión y Reportes de Cotizaciones (Default)**

Esta es la interfaz principal para interactuar con las cotizaciones existentes.

1.  **Componentes de la Cabecera:**
    *   **Título Principal:** "Gestión y Reportes de Cotizaciones".
    *   **Botón `Generar Estadística`:** Un botón púrpura que, al ser presionado, ocultará la tabla de gestión y mostrará la "Vista de Reporte Analítico".
    *   **Botón `Salir`:** Un botón rojo estándar para abandonar la pantalla.

2.  **Panel de Filtros de Búsqueda:**
    *   **Cliente:** Un menú desplegable (`Select`) poblado con la lista de clientes, con la opción "Todos los Clientes".
    *   **Estado:** Un `Select` con los estados posibles (Borrador, Aceptada, Anulada, etc.), con la opción "Todos los Estados".
    *   **Rango de Fechas:** Dos campos de fecha (`Fecha del` y `Fecha al`) con formato `dd/mm/aaaa`.
    *   **Rango de Cotizaciones:** Dos campos de texto (`Cotización del` y `Cotización al`).
    *   **Botón `Buscar Cotizaciones`:** Un botón azul que ejecutará la consulta a Firestore aplicando los filtros y actualizará la tabla.

3.  **Tabla de diseño Kanban flow:**
    *   **Columnas Visibles:** ACCIONES, Nº COTIZACIÓN, FECHA (DD/MM/YYYY), CLIENTE, NIT, TOTAL (formato moneda local), ESTADO (con `Chip` visual), ESTADO (API, valor crudo).
    *   **Funcionalidad de la Columna `ACCIONES` (Iconos por fila):**
        *   **Icono PDF (Rojo):** Reutilizar el componente `ImprimirCotizacionModal.jsx` para generar el PDF de la cotización de esa fila.
        *   **Icono Reloj (Celeste):** Desplegará un modal para gestionar el ciclo de vida de la cotización, permitiendo cambiar su estado (ej: de "Borrador" a "Aceptada").
        *   **Icono Copiar (Amarillo):** Clonará la cotización. Creará una nueva con el siguiente correlativo, estado "Borrador" y los mismos detalles.
        *   **Icono Anular (X Roja):** Cambiará el estado a "Anulada". Esta acción estará deshabilitada si la cotización ya está "En Venta".
    *   **Paginación:** Controles de "Previous" y "Next" e indicador de resultados.

### **Vista 2: Reporte Analítico (Al hacer clic en `Generar Estadística`)**

1.  **Componentes de la Cabecera:**
    *   **Botón `Generar a PDF` (Rojo):** Descarga la tabla analítica en formato PDF.
    *   **Botón `Exportar a CSV` (Verde):** Genera y descarga un archivo CSV con los datos del reporte.
    *   **Botón `Volver al Listado` (Gris):** Oculta esta vista y regresa a la "Vista de Gestión".

2.  **Panel de Filtros de Búsqueda:**
    *   El mismo panel de la vista anterior permanece visible y funcional, permitiendo refinar el reporte en tiempo real.

3.  **Tabla del Reporte Analítico de Rentabilidad:**
    *   **Estructura de Agrupación:** La tabla presentará los datos de forma jerárquica: `CLIENTE -> AÑO -> MES`.
    *   **Filas de Subtotales:** Se insertarán filas con fondo de color para mostrar los subtotales por MES, AÑO y un Total Acumulado por CLIENTE.
    *   **Columnas del Reporte:** CLIENTE, AÑO, MES, ESTADO, CANTIDAD (Nº cotizaciones), TOTAL COSTO, TOTAL VENTA, TOTAL IMPUESTOS, LÍQUIDO (`VENTA - IMPUESTOS`), UTILIDAD NETA (`LÍQUIDO - COSTO`), %RENTABILIDAD (`(UTILIDAD NETA / LÍQUIDO) * 100`).
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


Resultado de revision del desarrollo:

0. (finalizado) al cambiar indices para hacer esta opcion, dañaste la funcionalidad del boton buscar dentro de la opcion src/pages/cotizaciones/GestionReportesPage.jsx, pedir la imgagen de error - URGENTE


2. (finalizado) Al precionar doble click y que muestre la cotizacion, no muestra la informacion como deberia, solicitar una imagen de mas o menos como deberia mostrarla.

3. (finalizado) No copia correctamente un catizacion hacia otro numero de cotizacion nuevo, estas creando un numero de corralativo equivocado, te pido que entiendas el proceso de grabancion al presionar Grabar Cotizacion en el archivo src/pages/cotizaciones/CotizacionesIngresoPage.jsx para utilizar la forma que va traer el siguiente numero de cotizacion en la coleccion correlativos, usa el empresa_id de la coleccion sesiones para acceder a la coleccion de correlativos y no estas inventando campos que no existen en la estructura de la coleccion cotizaciones y correlativos.
Seguimiento: (finalizado)
Te pedi como 20 veces el dia ayer y hoy llevamos 3 hora hora con este tema y no lo pudiste resolver, 
la solicitud fue clara que desde firebase-studio entres a revisar la estructura de la coleccion cotizaciones, coleccion correlativos y coleccion sesiones, para entedner que campos debes leer.


4. (finalizado despues de 6 horas con 30 minutos)
error al darle doble click y mostrar la cotizacion y si el usuario presiona el boton imprimir no genera ninguno de los tres posibles PDF a generar.

Para este punto entender claramente el flujo del numeral ## IV. Flujo Crítico: Lógica de Inicialización Forzada de este documento y ### **Sintaxis Correcta para la Introspección de Datos en Firestore** de este documento.

Seguimiento: fue inaceptable tu desempeño para intentar resolver este problema - mas de 30 intentos y jamas lograste estabilizarlo.
Accion: se tuvo que eliminar el boton para quitar la funcionalidad y evitar que el usuario lo pruebe.

El problema mas grande que que la funcionalidad existe en la pantalla src/pages/cotizaciones/CotizacionesIngresoPage.jsx en el boton Imprimir y luego se abre la pantalla src/components/modals/CotizacionDetalleModal.jsx y se presiona el boton Generar PDF y todo funciona al 100% y fuiste incapaz de replicarla dentro del GestionReportesPage.jsx agregando el boton Imprimir ( la idea era tratar de usar la misma logica, te esta dando problema el ir buscar los datos de moneda, y esos campos estan en la coleccion que abres para generar la pantalla donde muestra la cotizacion en:
cotizaciones
empresa_id = "F1bVL9YITjtNm3H4rKsS"
financiero_snapshot
  moneda_base_id = "DZcypXh2KQ4BtaietTgN"
  simbolo_moneda_base = "Q."
  moneda_destino_id = "gdTGjaaUwZE9Bzr6LPzD"
  simbolo_moneda_destino "$."

  jamas lograste revisar correctamente cuales eran los props que se enviar a la hora de presionar Genera PDF.