# Blueprint del Proyecto: GESManager-CloudFS

*Última Actualización: 24 de Julio de 2024 (Sesión 7)*

---

## 1. Instrucciones y Contexto

1.1. **Revisión de Documentación:** Para comprender el estado y la trayectoria del proyecto, es fundamental revisar los siguientes documentos en orden:
    *   `documentacion/analisis-arquitectura.md`
    *   `documentacion/sesiones/S3-resumen.md`
    *   `documentacion/sesiones/S4-resumen.md`
    *   `documentacion/sesiones/S5-resumen.md`
    *   `documentacion/plan-de-ejecucion-GESManager-ClourFS.md`

1.2. **Script de Despliegue:** Existe un script `despliegue.sh` que automatiza la compilación y el despliegue del frontend a Firebase Hosting.

1.3. **Metodología de Interacción:** Después de analizar la información, se debe proponer un plan de acción y preguntar explícitamente al usuario antes de proceder con los cambios.

---

## 2. Descripción General y Arquitectura

Este proyecto, **GESManager-CloudFS**, representa la evolución de un sistema monolítico (GESManager con Laravel) hacia una **arquitectura serverless moderna y desacoplada**.

*   **Frontend:** React con Vite.
*   **Backend & Base de Datos:** Cloud Firestore.
*   **Autenticación:** Firebase Authentication.
*   **Hosting:** Firebase Hosting.

---

## 3. Historial de Cambios en Datos (Firestore)

*No se han realizado cambios significativos en los datos durante esta sesión.*

---

## 4. Historial de Desarrollo y Tareas Completadas

*Registro de las tareas de desarrollo, correcciones y mejoras implementadas en la aplicación.*

### Sesión 7

1.  **Estabilización del Menú de Navegación (`Sidebar.jsx`):**
    *   Se corrigió el comportamiento de expansión de los submenús para que permanezcan abiertos al navegar.
    *   Se solucionó un problema de renderizado de iconos (`DynamicIcon`) que afectaba a varias opciones del menú.

2.  **Creación de la Guía Maestra para CRUDs:**
    *   Se creó el documento `documentacion/plantilla-crud.md`, fusionando las mejores prácticas existentes y nuevas propuestas.
    *   Esta guía define la arquitectura, el flujo de trabajo y los estándares visuales para todos los futuros módulos de mantenimiento.

---

## 5. Plan de Acción y Próximos Pasos

La siguiente fase se centra en construir las bases de la seguridad y la gestión de usuarios. Se crearán los siguientes módulos CRUD en el orden especificado, siguiendo estrictamente la nueva `plantilla-crud.md`:

1.  **CRUD de Roles:** Para gestionar los diferentes perfiles de usuario.
2.  **CRUD de Usuarios:** Para la administración de las cuentas de usuario.
3.  **CRUD de Roles-Accesos:** Para asignar permisos detallados a cada rol.

**Hito:** Al finalizar esta actualización del Blueprint, se creará un nuevo `commit` en GitHub para marcar el fin de la fase de planificación y el inicio del desarrollo de los módulos de seguridad.
