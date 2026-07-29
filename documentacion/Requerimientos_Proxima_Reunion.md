# Requerimientos Próxima Reunión (Fase 2)

Este documento detalla las tareas, mejoras y nuevas funcionalidades acordadas para ser desarrolladas en la próxima sesión de trabajo del proyecto GESManager.

## 1. Exportación a Excel en Módulos de Accesos
Se debe incorporar un botón verde de "Excel" en la barra de herramientas principal de todas las opciones bajo el menú de Accesos. Este botón exportará el catálogo completo visible (aplicando los filtros actuales) a un archivo `.xlsx`.

**Opciones afectadas:**
- [ ] Empresas
- [ ] Roles
- [ ] Usuarios
- [ ] Usuarios x Empresa

## 2. Exportación a Excel en Módulos de Mantenimientos
De igual forma, se debe incorporar un botón verde de "Excel" en todas las opciones bajo el menú de Mantenimientos, permitiendo generar un reporte descargable tabular.

**Opciones afectadas:**
- [ ] Clientes
- [ ] Categorías
- [ ] Servicios

## 3. Utilidades: Restauración de Base de Datos
Implementación de la **Fase 2** para la gestión de respaldos.

**Opción:** Backup / DB / Git
- [ ] **Botón Restaurar (Naranja):** Desarrollar el algoritmo de lectura de archivos JSON generados previamente.
- [ ] **Procesamiento Batch:** Crear la lógica segura (borrado y escritura por lotes en Firestore) que permita inyectar de regreso miles de registros sin exceder las cuotas de red del navegador y manteniendo la integridad de las fechas.
- [ ] **Confirmación de Seguridad:** Incorporar pantallas de doble advertencia para evitar restauraciones accidentales que puedan borrar la base de datos de producción.
