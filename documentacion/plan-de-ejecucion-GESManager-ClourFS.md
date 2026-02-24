# Plan Maestro de Ejecución: GESManager-CloudFS

Este documento consolida la visión técnica y la hoja de ruta para la creación de GESManager-CloudFS. Sirve como la fuente única de verdad para la arquitectura, la estructura de datos y las fases de desarrollo del proyecto.

---

## 1. El Fundamento: La Arquitectura Serverless NoSQL

Se migra de un monolito (Laravel) a una arquitectura serverless, donde React asume la lógica de negocio, interactuando directamente con una base de datos NoSQL nativa en la nube.

| Característica | GESManager Original (Laravel) | GESManager-CloudFS (Firebase + React) |
| :--- | :--- | :--- |
| **Naturaleza** | Monolito altamente estructurado. | Arquitectura de Documentos Atómicos. |
| **Base de Datos** | Relacional (MySQL). | NoSQL Nativa (Cloud Firestore). |
| **Lógica de Negocio** | Centralizada en Backend (PHP). | Descentralizada: React es el cerebro. |
| **Paradigma** | Lógica de `Eloquent` y ORM. | Consistencia Eventual y "Costo Cero". |

---

## FASE 1: Cimentación (Infraestructura y Control de Versiones)

**Objetivo:** Preparar el entorno de desarrollo y producción.

1.  **Creación del Proyecto en Firebase (Consola):**
    *   Crear el proyecto `gesmanager-cloudfs` (o el nombre definitivo).
2.  **Activación de Servicios Críticos:**
    *   **Authentication:** Habilitar el proveedor "Correo electrónico y contraseña".
    *   **Cloud Firestore:** Crear la base de datos en "Modo Producción" (se recomienda `nam5` o `us-east1` por latencia).
    *   **Hosting:** Habilitar para el futuro despliegue de la aplicación React.
3.  **Configuración del Repositorio (Control de Versiones):**
    *   Crear un repositorio privado en GitHub llamado `gesmanager-cloudfs`.
    *   Inicializar localmente un proyecto de React con Vite.
    *   Conectar el repositorio local con el `origin` de GitHub.
    *   Vincular el proyecto local a Firebase usando la Firebase CLI (`firebase init`).

---

## FASE 2: Estructura Genética de Colecciones (Firestore)

**Objetivo:** Definir el ADN de la aplicación creando las colecciones en Firestore con una estructura consistente.

**Regla Universal de Auditoría:** Todas las colecciones y sus documentos deben incluir los siguientes campos de auditoría.

```json
{
  "fecha_creacion": "Timestamp",
  "usuario_creo": "UID del usuario",
  "fecha_ultima_actualizacion": "Timestamp",
  "usuario_ultima_modificacion": "UID del usuario"
}
```

### 2.1. Seguridad y Acceso

*   **`menu_gesmanager`**:
    *   `id`: (string) - Identificador único
    *   `label`: (string) - Texto visible en el menú
    *   `padre_id`: (string) - ID del menú padre para jerarquía
    *   `es_fija`: (boolean) - Si la opción es permanente
    *   `orden`: (number) - Para ordenar los ítems del menú
    *   `icono`: (string) - Nombre o clase del ícono
*   **`roles_access`**:
    *   `id`: (string) - Slug del rol (ej: "administrador")
    *   `nombre_rol`: (string) - Nombre descriptivo (ej: "Administrador")
    *   `permisos`: (map) - Mapa de booleanos con `id` de `menu_gesmanager` como llaves.
*   **`usuarios`**:
    *   `id`: (string) - UID de Firebase Authentication
    *   `usuario_email`: (string) - Email del usuario
    *   `usuario_nombre`: (string) - Nombre para mostrar
    *   `role`: (string) - `id` del rol asignado desde `roles_access`
    *   `estado`: (string) - "activo" o "inactivo"
*   **`usuarios_x_empresas`**:
    *   `id`: (string) - ID autogenerado
    *   `usuario_id`: (string) - UID del usuario
    *   `empresa_id`: (string) - ID de la empresa

### 2.2. Inicialización y Maestros

*   **`empresas`**:
    *   `id`: (string) - ID autogenerado
    *   `nombre`: (string)
    *   `nit`: (string)
    *   `direccion`: (string)
    *   `moneda_base_id`: (string) - ISO de la moneda (ej: "GTQ")
    *   `config_fiscal`: (map) - `{ "tasa_iva": 0.12, "tasa_itp": 0.005, "isr_limite": 30000, "isr_bajo": 0.05, "isr_alto": 0.07 }`
*   **`monedas`**:
    *   `id`: (string) - Código ISO (ej: "GTQ", "USD")
    *   `moneda`: (string) - Nombre (ej: "Quetzal")
    *   `simbolo`: (string) - (ej: "Q", "$")
    *   `estado`: (string) - "activa" o "inactiva"
*   **`tipos_cambio`**:
    *   `id`: (string) - Compuesto `YYYYMMDD_empresaID`
    *   `empresa_id`: (string)
    *   `moneda_base_id`: (string)
    *   `moneda_destino_id`: (string)
    *   `fecha`: (timestamp)
    *   `tasa_compra`: (number)
    *   `tasa_venta`: (number)

### 2.3. Mantenimientos (con Arrays)

*   **`categorias`**:
    *   `id`: (string)
    *   `empresa_id`: (string)
    *   `nombre_categoria`: (string)
    *   `descripcion`: (string)
    *   `estado`: (string)
*   **`clientes`**:
    *   `id`: (string)
    *   `empresa_id`: (string)
    *   `nombre_cliente`: (string)
    *   `nombre_comercial`: (string)
    *   `nit`: (string)
    *   `direccion`: (string)
    *   `email_facturacion`: (string)
    *   `estado`: (string)
    *   `contactos`: (array) `[{ "id_contacto": "UUID", "nombre": "", "puesto": "", "telefono": "", "email": "", "es_principal": false }]`
*   **`servicios`**:
    *   `id`: (string)
    *   `empresa_id`: (string)
    *   `categoria_id`: (string)
    *   `nombre`: (string)
    *   `itp`: (boolean) - Si aplica ITP
    *   `precios_calculados`: (map) - `{ "costo_total_base": 0, "subtotal_base_impuestos": 0, "precio_venta_base": 0, "tasa_ganancia": 0 }`
    *   `rubros_detalle`: (array) `[{ "nombre": "", "costo": 0, "porcentaje_fee": 0, "total_venta_rubro": 0 }]`
    *   **Sub-colección:** `historial_precios` (para registro infinito de cambios de precio)

### 2.4. Operaciones

*   **`cotizaciones`**:
    *   `id`: (string)
    *   `numero_cotizacion`: (string)
    *   `empresa_id`: (string)
    *   `usuario_id`: (string)
    *   `fecha_emision`: (timestamp)
    *   `estado`: (string) - "borrador", "enviada", "aprobada", "rechazada"
    *   `cliente_snapshot`: (map) - `{ "cliente_id": "", "nombre": "", "nit": "", "contacto_seleccionado": {} }`
    *   `financiero_snapshot`: (map) - `{ "moneda_base_id": "", "moneda_destino_id": "", "tasa_compra": 0, "tasa_venta": 0, "aplica_iva": true }`
    *   `items`: (array) de mapas con la estructura detallada.
    *   `totales_consolidadores`: (map) de totales.

---

## FASE 3: Desarrollo del "Cerebro" (Lógica en React)

**Objetivo:** Programar los motores de cálculo que son el alma del sistema.

1.  **Motor de Servicios (Cálculo de Gross Margin):**
    *   **Función:** `calcularPrecioVenta(costo, fee)`
    *   **Lógica:** `total_venta_rubro = costo / (1 - (fee / 100))`
    *   **Proceso:** Iterar el array `rubros_detalle`, calcular `total_venta_rubro` para cada uno, y luego consolidar los totales (`costo_total_base`, `subtotal_base_impuestos`) en el objeto `precios_calculados`.
2.  **Motor de Cotizaciones (Cálculos de Línea y Totales):**
    *   **Función por línea:** `calcularLinea(total_linea, aplica_itp)`
    *   **Lógica:**
        *   `subtotal_neto = total_linea / 1.12`
        *   `monto_iva = total_linea - subtotal_neto`
        *   Si `aplica_itp`, `total_tp = subtotal_neto * 0.005`
    *   **Proceso:** Por cada cambio en el array `items`, se recalculan todas las líneas.
3.  **Algoritmo de ISR Escalonado (Cálculo de Encabezado):**
    *   **Función:** `calcularISR(total_subtotal_neto)`
    *   **Lógica (Guatemala):**
        *   Si `total_subtotal_neto <= 30000`, `ISR = total_subtotal_neto * 0.05`
        *   Si `total_subtotal_neto > 30000`, `ISR = 1500 + ((total_subtotal_neto - 30000) * 0.07)`
    *   **Proceso:** Se dispara después de que el motor de cotizaciones consolida el `total_subtotal_neto` de todas las líneas.

---

## FASE 4: Blindaje y Reglas de Seguridad

**Objetivo:** Configurar las `Security Rules` en Firestore para proteger los datos.

1.  **Validación Multiempresa:**
    *   La regla debe verificar que el `request.auth.uid` del usuario esté en la colección `usuarios_x_empresas` y que la `empresa_id` del documento al que intenta acceder coincida con una de sus empresas autorizadas.
2.  **Validación de Roles:**
    *   La regla debe leer el rol del usuario desde `usuarios` y luego consultar los `permisos` en `roles_access` para permitir o denegar la operación (`read`, `write`, `create`, `delete`) sobre la colección/documento solicitado.

---

## FASE 5: Pruebas de Inmutabilidad y Cierre

**Objetivo:** Validar los conceptos clave de la arquitectura.

1.  **Prueba de Grabación Atómica:**
    *   **Escenario:** Cambiar el precio de un servicio.
    *   **Resultado Esperado:** Se debe crear un nuevo documento en la sub-colección `historial_precios` y, simultáneamente, actualizarse el documento principal del servicio. La operación debe ser atómica (o todo o nada).
2.  **Prueba de Snapshot:**
    *   **Escenario:** Crear una cotización. Luego, modificar el precio de uno de los servicios incluidos en el catálogo.
    *   **Resultado Esperado:** La cotización ya creada debe mantener los precios y descripciones originales (el `snapshot`) y no verse afectada por el cambio en el catálogo.

---
## Anexo: Estructura de Menú base puede sufrir modificacion en el tiempo del proyecto

| Nivel Raíz | Sub-opción (Módulo) | Acción / Vista Relacionada |
| :--- | :--- | :--- |
| **Inicializar** | Empresa | Selección de entidad legal para trabajar. |
| | Tipo de Cambio | CRUD de tasas del día y selección de tasa de trabajo. |
| **Crear Menu** | Menu | Opciones y sub opciones (CRUD del menú). |
| | Roles/Acceso | CRUD de roles con switches On/Off por opción de menú. |
| **Accesos** | Empresas | Gestión global de entidades legales. |
| | Usuarios | Gestión de cuentas de acceso. |
| | Usuarios x Empresa | Asignación de usuarios a empresas. |
| **Monedas** | | Definición de divisas (universal, sin `empresa_id`). |
| **Mantenimientos**| Clientes | Catálogo de clientes. |
| | Categorías | Clasificación de servicios. |
| | Servicios | Calculadora de Precios/Costos/Historial. |
| **Cotizaciones** | Ingreso | Generador de cotizaciones GESManager-CloudFS. |
| | Gestión y Reportes | Seguimiento de estados de cotizaciones. |
| **Utilidades** | Backups | Herramientas de soporte técnico. |
