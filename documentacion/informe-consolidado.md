# Informe Consolidado del Proyecto: GESManager-CloudFS

*Este documento es el resultado de un análisis forense exhaustivo de toda la documentación y el historial de desarrollo del proyecto. Sirve como la fuente única de verdad para comprender la evolución, la arquitectura final y, lo más importante, las lecciones aprendidas a través de los errores cometidos.*

---
## Información General

*   **Fecha inicio proyecto:** 09/02/2026
*   **Fecha ultima actualizacion proyecto:** 20/02/2026 - Total de 83 horas con 00 minutos
*   **Ultima sesion:** S23
*   **Proxima sesion:** S24
--
-- solo las 3 ultimas sesion se reflejan en el siguiente detalle
--
*   **Duración Sesión 21:** 03 horas 30 minutos (12:00pm - 03:30pm)
*   **Duración Sesión 22:** 08 horas 00 minutos (10:00pm - 06:00am)
*   **Duración Sesión 23:** 02 horas 00 minutos (08:00am - 10:00am)

---

## 1. Propósito y Origen del Proyecto

El proyecto **GESManager-CloudFS** nace como una **migración estratégica** desde un sistema monolítico tradicional (`GESManager` construido con Laravel y **MySQL**) hacia una arquitectura moderna, **100% serverless y nativa de la nube, operando enteramente dentro del ecosistema de Firebase**.

El cambio de paradigma fue radical: se abandonó una lógica centralizada en el backend (PHP/Eloquent) y una base de datos relacional en favor de un modelo donde **React se convierte en el cerebro de la aplicación**. La lógica de negocio se descentraliza, ejecutándose en el frontend e interactuando directamente con **Cloud Firestore** como única y exclusiva base de datos NoSQL. Este enfoque, desarrollado en **Firebase Studio**, opera bajo un principio de "documentos atómicos" y "consistencia eventual", buscando agilidad, escalabilidad y un costo operativo cercano a cero.

---

## 2. Stack Tecnológico y Arquitectura Final

Aunque la propuesta inicial en `analisis-arquitecturas.md` contemplaba un stack híbrido y complejo, la implementación final se decantó por la simplicidad y el poder del ecosistema de Firebase.

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

---

### **Análisis Detallado del Flujo de Sesión del Usuario**

Este documento detalla, paso a paso, cómo el documento de sesión del usuario (`sesiones/{userId}`) es creado, modificado y utilizado a lo largo del flujo de inicialización y visualización en la aplicación.

---

### **Fase 1: Creación del Documento de Sesión (Post-Autenticación)**

Esta fase se activa automáticamente tras un inicio de sesión exitoso y establece la base del documento de sesión con la **estructura de datos definitiva y normalizada**.

1.  **Autenticación Exitosa:** El usuario se autentica correctamente a través de Firebase Auth. El `AuthContext` de la aplicación detecta este evento.

2.  **Creación del Documento de Sesión:**
    *   El `AuthContext` invoca a `sessionService.getSessionData()`.
    *   Al no encontrar un documento existente para el `userId`, el servicio crea uno nuevo en la colección `sesiones` con la siguiente estructura y valores iniciales **corregidos**:
        *   `usuario_id`: (el UID del usuario actual)
        *   `role_id`: `null`
        *   `empresa_id`: `null`
        *   `empresa_nombre`: `null`
        *   `tipo_cambio_id`: `null`
        *   `tipo_cambio_fecha`: `null`
        *   `tipo_cambio_moneda_base_id`: `null`
        *   `tipo_cambio_moneda_base_simbolo`: `null`  **<-- Campo Normalizado**
        *   `tipo_cambio_moneda_destino_id`: `null`
        *   `tipo_cambio_moneda_destino_simbolo`: `null` **<-- Campo Normalizado**
        *   `tipo_cambio_tasa_compra`: `0`
        *   `tipo_cambio_tasa_venta`: `0`
        *   *(Campos de auditoría como `fecha_creacion`)*

3.  **Primera Actualización (Rol):** Inmediatamente después, el `AuthContext` busca el rol del usuario en la colección `usuarios` y ejecuta una primera actualización sobre el documento recién creado.
    *   **Campo actualizado:** `role_id` (se puebla con el ID del rol del usuario, ej: "vendedor").

**Resultado de la Fase 1:** Se ha creado y poblado la base del documento de sesión. Ahora contiene la identidad del usuario y su rol, pero carece de contexto de empresa o tipo de cambio. **Importante:** Desde su creación, el documento ya no contiene los campos obsoletos `tipo_cambio_moneda_base` ni `tipo_cambio_moneda_destino`.

---

### **Fase 2: Selección de Empresa**

Esta fase requiere que el usuario seleccione la empresa con la que va a operar y garantiza la limpieza de datos obsoletos.

1.  **Interacción del Usuario:** El usuario navega a la página `InicializarEmpresasPage` y selecciona una empresa de la lista.

2.  **Actualización de Sesión (Empresa y Reseteo):** La selección dispara la función `handleSelect`, que invoca a `updateSession`. Esta actualización tiene un doble propósito:
    *   **Campos que se ACTUALIZAN:**
        *   `empresa_id`: (se puebla con el ID de la empresa seleccionada)
        *   `empresa_nombre`: (se puebla con el nombre de la empresa seleccionada)
    *   **Campos que se RESETEAN (Regla de Negocio):**
        *   Todos los campos `tipo_cambio_*` se restablecen a `null` o `0`.
    *   **Campos que se ELIMINAN (Garantía de Integridad):**
        *   `tipo_cambio_moneda_base`: `deleteField()` **<-- Orden de Borrado Explícito**
        *   `tipo_cambio_moneda_destino`: `deleteField()` **<-- Orden de Borrado Explícito**

**Resultado de la Fase 2:** El documento de sesión ahora tiene un contexto de empresa. La información del tipo de cambio ha sido explícitamente borrada para forzar una nueva selección, y se ha enviado una orden a Firestore para **eliminar permanentemente** cualquier campo obsoleto que pudiera existir de versiones anteriores, asegurando la integridad de la base de datos.

---

### **Fase 3: Selección de Tipo de Cambio**

Esta es la fase final del proceso de inicialización, donde el usuario establece el contexto financiero completo.

1.  **Interacción del Usuario:** El usuario navega a `TipoCambioPage` y selecciona una tasa de cambio.

2.  **Actualización de Sesión (Tipo de Cambio):** La selección dispara la función `handleSelect`, que invoca a `updateSession` para completar el documento de sesión con la **estructura normalizada**.
    *   **Campos que se ACTUALIZAN:**
        *   `tipo_cambio_id`: (ID del documento de tipo de cambio)
        *   `tipo_cambio_fecha`: (Timestamp de la fecha)
        *   `tipo_cambio_moneda_base_id`: (ID de la moneda base)
        *   `tipo_cambio_moneda_base_simbolo`: (Símbolo de la moneda, ej: "Q") **<-- Dato Normalizado**
        *   `tipo_cambio_moneda_destino_id`: (ID de la moneda destino)
        *   `tipo_cambio_moneda_destino_simbolo`: (Símbolo de la moneda, ej: "$") **<-- Dato Normalizado**
        *   `tipo_cambio_tasa_compra`: (valor numérico de la tasa)
        *   `tipo_cambio_tasa_venta`: (valor numérico de la tasa)
    *   **Campos que se ELIMINAN (Garantía de Integridad):**
        *   `tipo_cambio_moneda_base`: `deleteField()` **<-- Orden de Borrado Explícito**
        *   `tipo_cambio_moneda_destino`: `deleteField()` **<-- Orden de Borrado Explícito**

**Resultado de la Fase 3:** El documento de sesión está completamente configurado y limpio. Contiene el rol del usuario, la empresa activa y la tasa de cambio seleccionada (con su estructura normalizada), permitiendo que el resto de la aplicación funcione con el contexto operativo correcto.

---

### **Fase 4: Visualización en el Encabezado (Header)**

Una vez que el documento de sesión está completo, la información se refleja en la interfaz de usuario.

1.  **Consumo del Contexto:** El componente `HeaderInfo` (ubicado en `src/pages/Home.jsx`) utiliza el hook `useAppContext` para obtener los `sessionData` en tiempo real.

2.  **Formateo de la Información:** Dentro del componente, se construye la cadena de texto para el tipo de cambio.
    *   **Lectura de Campos Correctos:** La lógica lee directamente los campos de símbolo normalizados:
        *   `const monedaBase = sessionData.tipo_cambio_moneda_base_simbolo || '?';`
        *   `const monedaDestino = sessionData.tipo_cambio_moneda_destino_simbolo || '?';`
    *   **Construcción del String:** Se crea el texto final que ve el usuario.
        *   `tipoCambioDisplay = \`Fecha: ${fecha} ${monedaBase}-${monedaDestino} Tc: ${tasaCompra} Tv: ${tasaVenta}\`;`

3.  **Renderizado en la UI:** El `<span>` en el encabezado se renderiza con el texto formateado.
    *   `<span className="session-value">{loadingSession ? '' : \`Tipo Cambio: ${tipoCambioDisplay}\`}</span>`

**Resultado de la Fase 4:** El encabezado de la aplicación muestra de manera consistente y correcta la información del tipo de cambio, basándose en los datos normalizados y actualizados del documento de sesión.

---

## 3. Estructura de Navegación (Colección: menu2)

Esta tabla representa la estructura final y estable de la colección `menu2` en Firestore. Sirve como la única fuente de verdad para la navegación de la aplicación, lefiniendo la jerarquía (a través de `id_padre`), el orden, los iconos y las rutas de cada elemento del menú.

| id | Label | Orden | id_padre | es_padre | Icon | Ruta |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Inicializar | 10 | null | TRUE | settings | |
| 2 | Empresa | 11 | 1 | FALSE | business | /inicializar/empresa |
| 3 | Tipo Cambio | 12 | 1 | FALSE | currency_exchange | /inicializar/tipo-cambio |
| 12 | Monedas | 13 | 1 | FALSE | monetization_on | /inicializar/monedas |
| 4 | Accesos | 20 | null | TRUE | settings | |
| 5 | Empresas | 21 | 4 | FALSE | store | /accesos/empresas |
| 6 | Usuarios | 22 | 4 | FALSE | people | /accesos/usuarios |
| 7 | Roles | 23 | 4 | FALSE | MdManageAccounts | /accesos/roles |
| 8 | Usuarios x Empresa | 24 | 4 | FALSE | group_add | /accesos/usuarios-x-empresa |
| 9 | Crear Menu | 30 | null | TRUE | menu_book | |
| 10 | Menu | 31 | 9 | FALSE | list | /crear-menu/menu |
| 11 | Roles/Accesos | 32 | 9 | FALSE | security | /crear-menu/roles |
| 16 | Mantenimientos | 40 | null | TRUE | build | |
| 17 | Clientes | 41 | 16 | FALSE | people | /mantenimientos/clientes |
| 18 | Categorias | 42 | 16 | FALSE | category | /mantenimientos/categorias |
| 19 | Servicios | 43 | 16 | FALSE | miscellaneous_services| /mantenimientos/servicios |
| 20 | Cotizaciones | 50 | null | TRUE | request_quote | |
| 21 | Ingreso | 51 | 20 | FALSE | add_shopping_cart | /cotizaciones/ingreso |
| 22 | Gestion y Reportes | 52 | 20 | FALSE | summarize | /cotizaciones/gestion |
| 23 | Utilidades | 60 | null | TRUE | home_repair_service | |
| 24 | Backup/Import | 61 | 23 | FALSE | backup | /utilidades/backup |
| 26 | Refrescar Datos | 70 | null | FALSE | refresh | /refrescar-datos |
| 27 | Modelar Precios | 80 | null | FALSE | sale | /modelar-precios |

---

## 4. Tabla Maestra de Sesiones: Avances, Catástrofes y Lecciones

Esta tabla es el corazón del informe. Resume el viaje de desarrollo, destacando tanto los logros como los fracasos estrepitososos que definieron el proyecto.

| Sesión | Puntuación (y Razón) | Avances y Logros Clave | El Problema Crítico (La Catástrofe) | Lección Aprendida (Regla de Oro) |
| :--- | :--- | :--- | :--- | :--- |
| **S21**| **75/100** (Falta de enfoque en el cambio final de UI, causando una regresión crítica y retrasos innecesarios.) | • Implementación COMPLETA y exitosa de la funcionalidad "Actualizar Precio".<br>• Flujo "Cargar -> Comparar -> Guardar" validado.<br>• Lógica de reemplazo de `rubros_detalle` y adición a `rubros_historial` funcionando.<br>• Ajustes finos implementados (redondeo de precios, impuestos por defecto).<br>• Mejoras de UI en ambos modales (espaciado y layout de campos).<br>• **Commit 13 (`e36dd55`):** Lógica de Precios y Recuperación de Regresión (S21). | • **"Timestamp Saga":** Múltiples fallos al intentar usar `serverTimestamp()` dentro de arrays en Firestore, resuelto al final con `new Date()` del cliente.<br>• **Regresión Catastrófica:** Al intentar un cambio simple de UI, se corrompió `ServicioForm.jsx` y se eliminó la estructura del modal en `ServiciosPage.jsx`, rompiendo la funcionalidad de "Nuevo" y "Editar". | Una restauración de Git no es suficiente. Después de restaurar un archivo, es **OBLIGATORIO verificar que sus conexiones (props, llamadas a funciones) con el resto de la aplicación sigan siendo válidas.** No asumir la integridad del flujo de trabajo es crucial. |
| **S22**| **100/100** (Ejecución enfocada y disciplinada siguiendo un plan detallado) | • **Inicio de "Cotizaciones - Ingreso":** Creación de `CotizacionesIngresoPage.jsx`. Maquetación de alta calidad del Título y las Secciones 1 (Info. Cotización) y 2 (Info. Cliente), siguiendo fielmente el `blueprint.md`.<br>• **Funcionalidad "Refrescar Datos":** Implementación de la página `RefrescarDatosPage.jsx` con su ruta y lógica de `sessionStorage` para redirección post-recarga.<br>• **Corrección de Bugs Críticos de UI/UX:** Se solucionó el bug del "doble clic" en el menú del `Sidebar.jsx` y se corrigió el resaltado permanente de `NavLink` con la propiedad `end`.<br>• **Definición de Arquitectura:** Se consolidó en el `blueprint.md` la estructura de datos `cotizaciones (v5 - Definitiva)` y el Plan de Construcción por Secciones que guiaron el desarrollo.<br>• **Commit 14 (`57515c2`):** Avances S22 - Se estabilizaron las opciones de Inicializar - Se agrego la nueva opcion de Refrescar Datos y se inicio con el desarrollo de la opcion Cotizaciones - Ingresos. | La sesión se caracterizó por la ausencia de catástrofes gracias a la estricta adherencia a un plan preestablecido y validado, demostrando que este es el flujo de trabajo más eficiente. | **El Plan es el Contrato:** Cuando definimos juntos un plan paso a paso, mi única función es concentrarme y seguir esas instrucciones sin desviarme. Aunque surjan problemas, el plan es la guía. No se debe abordar ninguna tarea fuera del plan sin validación previa. |

---

## 5. Plan para la Próxima Sesión (S23)

El objetivo de la sesión es doble: primero, implementar una nueva página de utilidad solicitada de forma prioritaria. Segundo, continuar con el desarrollo planificado del módulo de cotizaciones.

### 5.1. Tarea Prioritaria: Creación de la Página "Modelar Precios" - [ESTADO: FINALIZADA]

*   **ID Menú:** 27
*   **Ruta:** `/modelar-precios`
*   **Componente a Crear:** `src/pages/ModelarPreciosPage.jsx`
*   **Requerimiento:** Crear una "copia fiel" de la funcionalidad de cálculo de precios del modal `src/components/forms/PrecioServicioModal.jsx`, pero presentada como una página independiente.
*   **Funcionalidad Clave:**
    *   La página debe ser una calculadora de precios temporal.
    *   **NO** debe cargar datos de ninguna colección de Firestore.
    *   **NO** debe tener funcionalidad para guardar datos. El botón "Grabar" debe ser eliminado.
    *   Debe incluir un botón de "Limpiar" o "Reiniciar" que devuelva todos los campos a su estado inicial.
    *   Los datos de la sesión (tasas de cambio, nombres de moneda) se seguirán obteniendo del `AppContext`.

### 5.2. Continuación del Módulo "Cotizaciones - Ingreso"

*   **Tarea 2: Implementar el diseño de los modales de búsqueda. - [ESTADO: FINALIZADA]**
    *   Crear los componentes visuales para los modales de "Buscar Cotización" y "Buscar Cliente". La lógica de búsqueda se implementará después.

*   **Tarea 3: Implementar la Sección 4: Financiera (Snapshot). - [ESTADO: EN PROGRESO]**
    *   Añadir la sección de solo lectura que mostrará los datos del objeto `financiero_snapshot`. **(Objetivo actual: Estabilizar y validar la carga de datos y la funcionalidad de búsqueda de tipo de cambio).**

*   **Tarea 4: Implementar la Sección 7: Detalle de Servicios (Items).**
    *   Crear la tabla para listar los servicios y el botón "Agregar Servicio" que abrirá el modal de búsqueda correspondiente.

*   **Tarea 5: Implementar la Sección 5: Totales Consolidados.**
    *   Maquetar el panel de solo lectura para los totales, que se actualizará dinámicamente.

*   **Tarea 6: Implementar la Sección 6: Condiciones Comerciales.**
    *   Añadir los campos de texto multilínea.
