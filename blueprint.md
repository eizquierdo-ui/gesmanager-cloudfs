# Blueprint del Proyecto: GESManager-CloudFS

*Última Actualización: 14 de Mayo de 2024*

## 1. Instrucciones y Contexto General

- **Revisar Documentación Inicial:** Antes de comenzar, revisa los siguientes documentos para entender la arquitectura y el historial del proyecto:
    - `documentacion/analisis-arquitectura.md`
    - `documentacion/sesiones/S3-resumen.md` a `S6-resumen.md`
    - `documentacion/plan-de-ejecucion-GESManager-CloudFS.md`
- **Proceso de Despliegue:** Recuerda que existe un script `despliegue.sh` para automatizar la compilación y el despliegue a Firebase Hosting.

---

## 2. Historial de Cambios y Evolución

*Esta sección sirve como un registro cronológico de las funcionalidades implementadas y las decisiones de diseño tomadas.*

### 2.1. Refactorización y Estandarización de Módulos CRUD (Mantenimiento de Usuarios)

- **Objetivo:** Corregir inconsistencias visuales y de comportamiento en el módulo de "Mantenimiento de Usuarios" para alinearlo con otros módulos como "Roles" y "Empresas".
- **Cambios Realizados:**
    1.  **Layout de Cabecera:** Se unificó el layout para que el título, el campo de búsqueda inteligente y los botones "+ Nuevo" y "Salir" aparezcan en una sola línea, mejorando la consistencia visual.
    2.  **Iconos de Acción Estandarizados:** Se definieron y aplicaron los tres iconos de acción estándar para las filas de la tabla:
        -   **Activar/Inactivar:** Se usa el icono `PowerSettingsNew` con colores dinámicos (rojo/verde) y un `Tooltip` descriptivo.
        -   **Editar:** Se usa el icono `Edit` (color azul).
        -   **Eliminar:** Se añadió el icono `Delete` (color rojo) con su respectiva lógica de borrado en Firestore.
    3.  **Formulario Modal Mejorado:** En el formulario de edición, el campo "Estado" se convirtió en una lista desplegable (`Select`) para evitar errores de entrada manual.
- **Resultado:** Se creó una experiencia de usuario consistente a través de los diferentes mantenimientos. Las lecciones aprendidas se consolidaron en el documento `documentacion/plantilla-crud.md` para guiar el desarrollo futuro.

---

## 3. Próximos Pasos: Módulo "Usuarios x Empresa"

- **Objetivo:** Crear un nuevo módulo CRUD para gestionar la asignación de usuarios a una o más empresas. Esto permitirá un control de acceso granular.
- **Requerimientos:**
    - **Nombre del Menú:** Usuarios x Empresa
    - **ID del Menú (Firestore):** `accesos-usuarios-x-empresa`
    - **Ruta de la URL:** `/accesos/usuarios-x-empresa`
    - **Icono del Menú:** `group_add`
    - **Padre del Menú:** `accesos`

### 3.1. Plan de Implementación para "Usuarios x Empresa"

1.  **Crear la entrada en el menú de Firestore:** Añadir un nuevo documento a la colección `menu` con la configuración especificada para que la nueva página sea accesible.
2.  **Crear la estructura de archivos:** Siguiendo `plantilla-crud.md`:
    -   Página: `src/pages/accesos/UsuariosXEmpresaPage.jsx`
    -   Formulario: `src/pages/accesos/UsuariosXEmpresaForm.jsx`
    -   Servicio: `src/services/usuariosXEmpresaService.js`
3.  **Diseñar la Interfaz:**
    -   **Vista Principal:** Una tabla que muestre las asignaciones existentes. Las columnas tentativas son: `Usuario (email)`, `Empresa (nombre)`, `Fecha de Asignación`, `Estado` y `Acciones`.
    -   **Formulario (Modal):**
        -   Un `Select` para elegir un **Usuario** (cargado desde la colección `usuarios`).
        -   Un `Select` o `MultiSelect` para elegir una o varias **Empresas** (cargadas desde la colección `empresas`).
        -   Campo de estado (`activo`/`inactivo`).
4.  **Desarrollar la Lógica:** Implementar las funciones CRUD en el servicio para crear, leer, actualizar y eliminar las relaciones en una nueva colección de Firestore, probablemente llamada `usuarios_x_empresa`.

---

### SECCIÓN AÑADIDA: Implementación y Corrección del CRUD "Usuarios x Empresa"

- **Objetivo Cumplido:** Se completó el plan de implementación definido en la sección 3.1, creando un módulo funcional para gestionar la asignación de usuarios a empresas.
- **Proceso y Evolución:** La implementación fue un proceso iterativo que requirió múltiples correcciones para alcanzar la calidad y consistencia deseadas.

#### Fase 1: Creación y Despliegue Inicial
- Se creó la estructura base del CRUD, incluyendo la página (`UsuariosXEmpresaPage.jsx`), el formulario (`AsignacionForm.jsx`) y el servicio de Firestore (`asignacionesService.js`).

#### Fase 2: Correcciones de Diseño y Comportamiento del Formulario Modal
- **Problema:** El formulario para "Editar" no era idéntico al de "Crear" y deshabilitaba campos incorrectamente.
- **Solución:** Se reescribió el formulario para garantizar que los modales fueran **100% idénticos**, que **todos los campos fueran siempre editables**, y se ajustaron los anchos de los campos (`Usuario` 5/12, `Empresa` 5/12, `Estado` 2/12) para una mejor distribución.

#### Fase 3: Corrección de Inconsistencia en la Navegación
- **Problema:** El botón "Salir" usaba `history.back()`, causando una navegación impredecible.
- **Solución:** Se reemplazó con `navigate('/')` para asegurar una redirección consistente a la página de inicio.

#### Fase 4: Implementación de Funcionalidad de Búsqueda
- **Problema:** El campo de búsqueda no funcionaba.
- **Solución:** Se implementó la lógica de filtrado en tiempo real para que la tabla reaccione al texto introducido, buscando por nombre de usuario y empresa.

- **Resultado Final:** El plan de la sección 3 se considera **completado**. El CRUD "Usuarios x Empresa" es ahora un módulo robusto, consistente y funcional.
