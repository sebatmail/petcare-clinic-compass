# Registro de Evidencia de Apoyo de Inteligencia Artificial (prompts_ia.md)
**Asignatura:** Desarrollo Backend & Bases de Datos  
**Evaluación Parcial N°3:** Aplicación Web Fullstack con DRF, PostgreSQL y Despliegue en AWS EC2  
**Estudiante:** Sebastián Ignacio Torres Zamorano  
**Docente Evaluador:** Marcelo Alvarado Aravena  
**Institución:** Instituto Profesional INACAP — Área Informática y Ciberseguridad  
**Proyecto Asignado:** Proyecto 1 — Sistema de Gestión de Citas y Fichas Médicas para Veterinaria (PetCare)  

---

## 1. Declaración de Uso y Propósito de la Inteligencia Artificial

En conformidad con las pautas de la **Evaluación Parcial N°3**, este documento certifica y documenta el empleo estratégico de herramientas de Inteligencia Artificial (IA Generativa de Código y Modelos de Lenguaje Avanzado) como acelerador de desarrollo de software, optimizador de arquitectura y apoyo técnico en el cumplimiento de los estándares de la industria (OWASP, 4+1 View Model y Clean Code).

---

## 2. Matriz de Prompts y Soluciones Técnicas Obtenidas

| N° | Módulo / Fase | Prompt Técnico Suministrado a la IA | Solución Técnica Implementada y Optimización Obtenida |
|:---|:---|:---|:---|
| **01** | **Modelo y Lógica de Negocio (Anti-Solapamiento)** | *"Diseña en Django ORM un modelo `CitaMedica` que prevenga estrictamente el solapamiento de horas para un mismo médico veterinario en base al rango [fecha_hora, fecha_hora + duracion]. Incluye validación tanto en `clean()` como en el serializer de Django REST Framework."* | Generación de la regla de intersección temporal: `inicio_nueva < c_fin AND fin_nueva > c_inicio`. Se implementó la validación a doble capa (nivel ORM Django y nivel Serializer DRF), garantizando consistencia transaccional y prevención de carreras temporales. |
| **02** | **Ciberseguridad y Validación de RUT** | *"Crea una función de validación de RUT chileno en Python bajo el algoritmo oficial Módulo 11 que verifique formato y dígito verificador ('0'-'9', 'K'), arrojando `ValidationError` nativo de Django."* | Implementación de la función `validar_rut_chileno` con ciclo de factores `[2, 3, 4, 5, 6, 7, 2, 3...]` y normalización de cadenas, evitando inyecciones de datos no verificados en el registro de tutores y profesionales. |
| **03** | **Administrador Django Customizado (Rúbrica Criterio 2)** | *"Personaliza el `admin.py` de Django para una clínica veterinaria con inlines para `Mascota` en `Tutor`, `RecetaMedica` en `FichaClinica`, y badges HTML con `format_html` para estados de citas, carnet de vacunación y comprobantes de pago."* | Implementación de `MascotaInline`, `RecetaMedicaInline`, `ExamenClinicoInline`, filtros avanzados por rango de fechas (`date_hierarchy`), buscadores por RUT/Chip y badges visuales con semáforo de colores para estados clínicos y pagos. |
| **04** | **Integración de Pasarelas de Pago en Sandbox** | *"Genera la arquitectura de un módulo de cobro para servicios veterinarios que soporte Transbank Webpay Plus (código de integración oficial 597055555532), Mercado Pago Sandbox (QR), PayPal y Cripto Testnet, emitiendo vouchers electrónicos imprimibles."* | Aplicación del patrón de diseño **Strategy** para pasarelas de pago, creación del modelo `PagoServicio` con almacenamiento de tokens de transacción, código de autorización simulado y plantilla electrónica de comprobante legal de prueba. |
| **05** | **Interfaz de Usuario y Dashboard Sidebar** | *"Diseña una interfaz web moderna en Bootstrap 5 con barra lateral izquierda fija (Sidebar), tarjetas KPI ejecutivas, integración de gráficos de distribución por especie con Chart.js y sistema de semáforo preventivo de vacunas."* | Estructuración del layout base (`base.html`), dashboard con gradientes y métricas en tiempo real, catálogo de pacientes con tarjetas interactivas y modales de agendamiento con validación asíncrona (`fetch` a la API). |
| **06** | **Despliegue e Infraestructura Cloud AWS EC2** | *"Escribe un script en Bash para el aprovisionamiento automatizado en Ubuntu 22.04 LTS en AWS EC2: PostgreSQL 14+, Gunicorn con socket Unix, Nginx como proxy inverso y demonio systemd con reinicio automático."* | Creación del script `deploy/scripts/deploy_aws.sh` y configuración de Nginx con compresión gzip, enrutamiento de archivos estáticos (`/static/`) y canalización segura mediante sockets IPC. |

---

## 3. Aplicación del Paradigma Arquitectónico 4+1

El sistema **PetCare** fue estructurado siguiendo las 5 vistas del modelo de Kruchten:

```
                      ┌───────────────────────────┐
                      │    Vista de Escenarios    │
                      │       (Casos de Uso)      │
                      └─────────────┬─────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│  Vista Lógica   │        │ Vista de Proceso│        │Vista Desarrollo │
│(Modelos/DRF API)│        │(Anti-Solape/Cron)│       │(Capas/Templates)│
└─────────────────┘        └─────────────────┘        └─────────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │       Vista Física        │
                      │  (AWS EC2 / Nginx / WSGI) │
                      └───────────────────────────┘
```

1. **Vista de Escenarios (Casos de Uso):**
   * Agendamiento de cita sin conflicto horario por tutor.
   * Registro y evolución de Ficha Clínica con constantes vitales y prescripción.
   * Disparo automatizado de recordatorio preventivo vía WhatsApp/Email por vacuna por vencer.
   * Cobro de consulta médica con emisión de Voucher electrónico de Transbank Webpay.

2. **Vista Lógica (Modelos del Dominio):**
   * Patrón Modelo-Serializador-ViewSet-Router provisto por Django REST Framework.
   * Relaciones 1:1, 1:N y N:M con integridad referencial estricta.

3. **Vista de Procesos:**
   * Hilos concurrentes de Gunicorn (3 workers sincronizados con el kernel de Linux).
   * Verificación temporal de no solapamiento mediante queries atómicas sobre PostgreSQL/SQLite.

4. **Vista de Desarrollo (Componentes):**
   * Separación desacoplada en: `petcare_core` (configuración del sistema), `petcare_app` (lógica de negocio y modelos), `templates` (presentación web) y `deploy` (infraestructura como código).

5. **Vista Física (Despliegue en AWS EC2):**
   * Instancia EC2 Ubuntu 22.04 LTS con IP Elástica fija.
   * Nginx en puerto 80 $\rightarrow$ Socket Unix $\rightarrow$ Gunicorn WSGI $\rightarrow$ Django Backend $\rightarrow$ PostgreSQL.

---

## 4. Conclusiones sobre la Asistencia de Inteligencia Artificial

* **Reducción de Tiempo de Desarrollo:** La IA permitió acelerar la escritura de código repetitivo (*boilerplate*), permitiendo focalizar el esfuerzo en la robustez de las reglas de negocio (solapamiento horario, validación de RUT y cálculos posológicos).
* **Calidad de Código y Pruebas:** Se implementaron pruebas unitarias automatizadas (`tests.py`) que validaron el 100% de los escenarios críticos antes de la puesta en marcha.
* **Seguridad Garantizada:** Todas las sugerencias de la IA fueron auditadas para evitar vulnerabilidades de inyección SQL (uso estricto del ORM de Django), ataques CSRF (tokens integrados) y exposición de credenciales secretas (uso de variables de entorno).
