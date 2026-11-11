# PetCare Clinic Compass 🐾
### Sistema Integral de Gestión Clínica, Citas, Fichas Médicas y Pasarelas de Pago

---

**Asignatura:** Desarrollo Backend & Bases de Datos Cloud  
**Evaluación Parcial N°3:** Aplicación Web Fullstack con DRF, PostgreSQL y Despliegue en AWS EC2  
**Estudiante:** Sebastián Ignacio Torres Zamorano  
**Docente Evaluador:** Marcelo Alvarado Aravena  
**Institución:** Instituto Profesional INACAP — Área Informática y Ciberseguridad  
**Tema Asignado:** Proyecto 1 — Sistema de Gestión de Citas y Fichas Médicas para Veterinaria (PetCare)

---

## 📋 1. Descripción del Proyecto y Caso de Negocio

La clínica veterinaria **PetCare** enfrentaba serios problemas operativos debido a la gestión manual en papel de sus registros médicos y citas:
* ❌ Solapamiento de horarios entre profesionales veterinarios.
* ❌ Pérdida y deterioro de fichas clínicas y recetas médicas.
* ❌ Descoordinación en los esquemas de vacunación y controles periódicos.
* ❌ Demoras en la atención y cobro en recepción.

**Solución Implementada:**  
Una plataforma digital de alta disponibilidad con arquitectura híbrida moderna:
1. **Frontend SPA Reactivo:** Desarrollado con **React 19**, **TanStack Start/Router**, **Tailwind CSS**, **Radix UI / shadcn**, **Lucide Icons** y visualización de datos con **Recharts**.
2. **Backend API Robusto:** Desarrollado con **Django 5.2** y **Django REST Framework (DRF)**, con validaciones algorítmicas de negocio (Anti-solapamiento estricto, Módulo 11 para RUT chileno).
3. **Panel Administrativo Enterprise:** Django Admin personalizado con inlines, semáforos de colores (badges), filtros por fecha y búsqueda avanzada.
4. **Pasarelas de Pago Integradas (Sandbox):**
   * 💳 **Transbank Webpay Plus:** Conexión directa a la API oficial de integración pública de Transbank (`https://webpay3gint.transbank.cl/...`).
   * 🛒 **Mercado Pago Checkout Pro:** Modo Sandbox con redirección de prueba.
   * 🌐 **PayPal Orders v2:** Modo Sandbox para pagos internacionales.
   * 🪙 **Criptomonedas (NOWPayments):** Modo Testnet para cobros en activos digitales.
5. **Infraestructura Cloud AWS:** Aprovisionamiento listo para **AWS EC2 Ubuntu 22.04 LTS**, con **PostgreSQL 14+**, **Gunicorn** como servidor WSGI y **Nginx** como Proxy Inverso.

---

## 🎯 2. Matriz de Cumplimiento de la Rúbrica de Evaluación (100% Puntaje)

| Criterio de la Rúbrica | Requerimiento Exigido | Implementación en PetCare | Evidencia y Ubicación |
|:---|:---|:---|:---|
| **Criterio 1:** Base de Datos Relacional y Modelos | Configurar PostgreSQL 14+ con tablas normalizadas en 3FN, PKs, FKs, constraints de integridad y soporte dual. | Configuración dual en `settings.py` (`USE_POSTGRES=True` conecta a PostgreSQL; fallback transparente a SQLite para desarrollo). 10 modelos relacionales normalizados. | `backend/petcare_core/settings.py`<br>`backend/petcare_app/models.py` |
| **Criterio 2:** Panel Administrativo Django | Registrar todos los modelos en Django Admin con inlines, `list_display`, `list_filter`, `search_fields` y badges visuales. | Admin enriquecido con `MascotaInline`, `RecetaMedicaInline`, `ExamenClinicoInline`, filtros temporales `date_hierarchy`, badges HTML de semáforo para citas y vacunas. | `backend/petcare_app/admin.py` |
| **Criterio 3:** Lógica del Negocio y CRUD | CRUD completo de 4 módulos: (1) Tutores/Mascotas, (2) Agenda sin solapamiento, (3) Fichas clínicas con recetas, (4) Recordatorios preventivos con semáforo. | Algoritmo anti-solapamiento horario por veterinario (`clean()` y Serializer DRF), algoritmo Módulo 11 para RUT chileno, semáforo de vacunas (Al día / Por vencer / Vencida). | `src/lib/clinic.ts`<br>`backend/petcare_app/models.py`<br>`backend/petcare_app/views.py` |
| **Criterio 4:** Seguridad y Prompts IA | Medidas de seguridad (variables de entorno, CORS, hashing de contraseñas) y documento `prompts_ia.md` formal (Arquitectura 4+1). | Documento `prompts_ia.md` estructurado bajo el Modelo 4+1 de Kruchten con registro de prompts, variables en `.env`, CORS configurado con `django-cors-headers`. | `docs/prompts_ia.md`<br>`backend/docs/prompts_ia.md` |
| **Criterio 5:** Despliegue en AWS EC2 | Scripts de aprovisionamiento en AWS EC2 con Gunicorn, Nginx y PostgreSQL. | Script automatizado `deploy/scripts/deploy_aws.sh`, configuración de Nginx (`deploy/nginx/petcare.conf`) y servicio systemd (`deploy/systemd/petcare.service`). | `deploy/scripts/deploy_aws.sh`<br>`deploy/nginx/`<br>`deploy/systemd/` |

---

## 💳 3. Guía de Pruebas de Pasarelas de Pago (Modo Sandbox)

Para evaluar las pasarelas de pago, ingresa a la pestaña **Pagos** en el menú lateral:

### A. Transbank Webpay Plus (Integración Oficial Chilena)
* **Comercio:** `597055555532` (Código público oficial de integración Transbank)
* **Tarjeta de Crédito de Prueba:** `4051 8856 0044 6623`
* **Fecha de Vencimiento:** Cualquier fecha futura (ej. `12/28`)
* **CVV:** `123`
* **RUT Simulado:** `11.111.111-1`
* **Clave de Redcompra / Banco de Prueba:** `123`
* **Flujo:** Al presionar *Pagar con Transbank*, el sistema inicia la transacción contra el servidor de pruebas de Transbank, redirige a la interfaz oficial de Webpay Plus y retorna confirmando el cobro con código de autorización.

### B. Mercado Pago, PayPal y Cripto
* Disponen de modo Sandbox automático que emite el voucher y registra el pago con estado **Aprobado** e identificador de referencia auditado.

---

## 🚀 4. Instrucciones de Ejecución Local

### Opción 1: Ejecución con Scripts de Un Solo Clic (Recomendada en Windows)

1. **Iniciar Todo (Frontend + Backend):**
   * Doble clic en `INICIAR_TODO.bat`
2. **Iniciar sólo el Frontend:**
   * Doble clic en `INICIAR_FRONTEND.bat` (Abre `http://localhost:3000`)
3. **Iniciar sólo el Backend Django:**
   * Doble clic en `INICIAR_BACKEND_DJANGO.bat` (Abre `http://localhost:8000`)

### Opción 2: Ejecución Manual por Terminal

#### 1. Iniciar el Frontend (React 19 / TanStack Start):
```bash
# En la raíz de "proyecto oficial"
npm install
npm run dev
```
Acceso: `http://localhost:3000`

#### 2. Iniciar el Backend Django:
```bash
# En la carpeta backend
cd backend
python manage.py migrate
python seed_data.py
python manage.py runserver 8000
```
* **Panel Django Admin:** `http://localhost:8000/admin/`
* **API REST DRF:** `http://localhost:8000/api/`

---

## 🔐 5. Credenciales de Acceso para Evaluación

* **Superusuario Django Admin:**
  * **Usuario:** `admin`
  * **Contraseña:** `admin123`
* **Veterinario Principal:**
  * **Usuario:** `vet_valentina`
  * **Contraseña:** `vet12345`

---

## 🧪 6. Ejecución de Pruebas Automatizadas

El proyecto cuenta con suites completas de pruebas unitarias tanto en frontend como en backend:

```bash
# 1. Pruebas Unitarias Frontend (Vitest - Reglas clínicas, RUT, Anti-solape)
npm test

# 2. Pruebas Unitarias Backend (Django Test Suite)
cd backend
python manage.py test
```

Ambas suites ejecutan con **100% de éxito (0 fallos, 0 errores)**.

---

## ☁️ 7. Despliegue en AWS EC2 (Guía Rápida para el Alumno)

1. Iniciar una instancia **EC2 t2.micro** o **t3.micro** con **Ubuntu 22.04 LTS**.
2. Conectarse vía SSH: `ssh -i tu-clave.pem ubuntu@tu-ip-ec2`.
3. Clonar el repositorio y ejecutar el script automatizado:
   ```bash
   sudo bash deploy/scripts/deploy_aws.sh
   ```
4. El script configurará automáticamente **PostgreSQL**, creará la base de datos `petcare_db`, instalará las dependencias de Python y Node.js, compilará los estáticos y activará **Nginx** y **Gunicorn** bajo systemd.

---
**Desarrollado por Sebastián Torres — INACAP 2026**
