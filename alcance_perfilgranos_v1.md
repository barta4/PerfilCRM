# Alcance del Proyecto — Perfilgranos CRM
## Sistema de Gestión de Clientes, Visitas y Órdenes de Venta con Agente IA

| Campo | Valor |
|---|---|
| **Versión** | 1.0 |
| **Fecha** | 2 de agosto de 2026 |
| **Estado** | Borrador para revisión |
| **Base** | Adaptado de PERFIL CRM v2.0 (sin módulo Naviera) |
| **Cambio principal** | Se elimina integración operativa externa. Se agrega Módulo de Órdenes de Venta y Agente IA de Automatización. |

---

## 1. Resumen Ejecutivo

Perfilgranos CRM es una plataforma web para el equipo comercial que centraliza la ficha de cliente, el registro de visitas (entendidas como comunicación con el cliente), el seguimiento post-visita mediante tareas, y la gestión de órdenes de venta.

**Diferenciador clave:** Un **Agente IA de Automatización** que, sin intervención manual, convierte visitas en tareas y dispara correos automáticos (avisos de tarea, envío de orden al cliente, copia a la empresa). No es un chatbot conversacional en esta v1 — es un motor de reglas que actúa en segundo plano.

---

## 2. Objetivos

- Tener una ficha de cliente única con teléfono, email y contactos de la empresa.
- Registrar visitas como forma de comunicación con el cliente, con historial completo.
- Que cada visita pueda generar automáticamente una tarea, y que esa tarea avise por correo sin que el usuario lo haga manualmente.
- Permitir enviar la orden del cliente por email directamente desde su ficha, copiando también al correo general de la empresa.
- Mostrar un listado de órdenes de venta en el dashboard, donde cada usuario vea solo las suyas.
- Poder exportar el listado de clientes a Excel.

---

## 3. Stakeholders

| Rol | Responsabilidad |
|---|---|
| **Ejecutivo de Ventas** | Usuario principal. Gestiona clientes, registra visitas, recibe tareas automáticas, gestiona sus propias órdenes de venta. |
| **Administrador** | Configura reglas del Agente IA, gestiona usuarios, importa/exporta clientes. |
| **Cliente final** | Recibe la orden de compra por correo, con copia a la empresa. |

---

## 4. Funcionalidades Incluidas (In-Scope)

### 4.1 Ficha de Cliente

- Datos de la empresa: razón social, teléfono y **email de la empresa** (para copia de órdenes de compra).
- Contactos asociados a la ficha.
- Historial de comunicaciones (visitas, correos, tareas) en una sola línea de tiempo. *(Punto marcado como "revisar" en las notas originales — queda pendiente definir con el cliente qué tan detallado debe ser este historial.)*

### 4.2 Módulo de Visitas = Comunicación

- Registro de visita como evento de comunicación con el cliente (no requiere GPS ni check-in/out en esta versión, a diferencia de PERFIL CRM).
- Cada visita registrada queda en el historial del cliente.

### 4.3 Agente IA de Automatización (núcleo de esta versión)

Motor de reglas que actúa automáticamente ante eventos del sistema, sin que el usuario tenga que disparar nada a mano.

| Evento disparador | Acción automática del Agente IA |
|---|---|
| Se registra una visita | Crea una tarea asociada a esa visita |
| Se crea una tarea | Envía correo al responsable avisando de la nueva tarea |
| Se genera una cotización dentro de la ficha del cliente | Envía la cotización por email al cliente, con copia automática al **correo de la empresa** registrado en la ficha |

**Nota:** en esta v1 el agente es determinístico (reglas fijas evento → acción), no conversacional. Un agente que responda preguntas o sugiera acciones queda para una v2.

### 4.4 Módulo de Cotizaciones

- Listado de cotizaciones visible en el dashboard.
- **Regla de visibilidad:** un usuario solo ve las cotizaciones que él mismo envió al cliente. No ve cotizaciones enviadas por otros ejecutivos, aunque sean del mismo cliente.
- Envío de la cotización por email desde la ficha del cliente (ver 4.3).

### 4.5 Dashboard

- Listado de cotizaciones (filtrado por usuario, según 4.4).

### 4.6 Gestión de Clientes vía Excel

- Exportación del listado de clientes a Excel. *(Las notas originales dicen "exportar clientes desde excel" — queda ambiguo si también se requiere importar clientes desde un Excel. Se recomienda confirmar con el cliente si hace falta la importación además de la exportación.)*

---

## 5. Funcionalidades Fuera de Alcance (Out-of-Scope)

| # | Funcionalidad | Razón |
|---|---|---|
| 1 | Integración con sistema operativo externo (tipo Naviera/ERP) | No aplica al negocio de Perfilgranos en esta versión. |
| 2 | Check-in/check-out GPS de visitas | No solicitado en las notas del cliente. |
| 3 | Agente IA conversacional | Se define como solo automatización en esta v1. Se evalúa para v2. |
| 4 | Facturación y contabilidad | Fuera del alcance del CRM. |
| 5 | Firma digital de actas | No mencionado en requerimientos. |
| 6 | App nativa iOS/Android | Se desarrolla como web/PWA responsive. |

---

## 6. Requisitos No Funcionales

- **Notificaciones por correo:** deben salir en un tiempo razonable tras el evento disparador (visita → tarea → correo), objetivo ≤ 5 minutos.
- **Seguridad:** RBAC — un usuario solo accede a las cotizaciones que él mismo envió al cliente, no a las de otros ejecutivos.
- **Disponibilidad:** el envío de correos no debe bloquear el registro de la visita/tarea; si el correo falla, debe reintentarse (cola).
- **Paleta de marca (Perfilgranos):** Amarillo/dorado `#FFBE00`, Verde `#98D500`, Gris `#748080`, sobre fondo blanco `#FFFFFF`. Tomados del logo oficial.

---

## 7. Preguntas Abiertas (a resolver antes de desarrollo)

1. Historial de comunicaciones: ¿qué nivel de detalle necesita el cliente? (marcado "revisar" en notas).
2. Exportar clientes desde Excel: ¿es solo exportación, o también importación/carga masiva?
3. ¿El Agente IA debe avisar solo al ejecutivo dueño del cliente, o también a un supervisor?

---

## 8. Historial de Cambios

| Versión | Fecha | Descripción |
|---|---|---|
| 1.0 | 2026-08-02 | Creación inicial, adaptado de PERFIL CRM v2.0 (sin Naviera), foco en Agente IA de automatización. |

---

*Documento preparado para revisión. Las preguntas abiertas (sección 7) deben cerrarse antes de pasar a diseño.*
