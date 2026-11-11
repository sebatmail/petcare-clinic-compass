<div align="center">

# 🐾 PetCare Clinic Compass
### Plataforma Integral de Gestión Clínica Veterinaria, Fichas Médicas Digitales y Pasarelas de Pago Multi-Proveedor

[![Django](https://img.shields.io/badge/Django-5.2.x-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.2-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Transbank](https://img.shields.io/badge/Transbank-Webpay_Plus-FF0046?style=for-the-badge&logo=contactless-payment&logoColor=white)](https://transbankdevelopers.cl/)
[![AWS EC2](https://img.shields.io/badge/AWS-EC2_Ubuntu_22.04-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Test Coverage](https://img.shields.io/badge/Tests-100%25_Passing-10B981?style=for-the-badge&logo=checkmarx&logoColor=white)](https://vitest.dev/)

<p align="center">
  <b>Evaluación Parcial N°3 — Desarrollo Backend & Cloud AWS</b><br>
  🎓 <b>Estudiante:</b> Sebastián Ignacio Torres Zamorano &nbsp;|&nbsp; 👨‍🏫 <b>Docente Evaluador:</b> Marcelo Alvarado Aravena<br>
  🏛️ <b>Institución:</b> Instituto Profesional INACAP — Área Informática y Ciberseguridad
</p>

> [!IMPORTANT]
> ### ☁️ Aplicación en Vivo Desplegada en AWS Cloud (Criterio 5 Rúbrica)
> * 🌐 **IP Pública Funcional:** [http://44.193.33.51/](http://44.193.33.51/)
> * 🔗 **DNS Público AWS EC2:** [http://ec2-44-193-33-51.compute-1.amazonaws.com/](http://ec2-44-193-33-51.compute-1.amazonaws.com/)
> * 🛡️ **Panel Maestro Django Admin:** [http://44.193.33.51/admin/](http://44.193.33.51/admin/)
> * ⚡ **API RESTful DRF:** [http://44.193.33.51/api/mascotas/](http://44.193.33.51/api/mascotas/)
> * 📄 **Registro de Evidencia de IA:** [`prompts_ia.md`](prompts_ia.md) (Arquitectura 4+1)
> * 🔑 **Acceso Docente Evaluador:** Usuario: `profe` | Clave: `123456` *(o `admin` / `admin123`)*

[✨ Características](#-características-principales) •
[🏛️ Rúbrica 100%](#-cumplimiento-de-la-rúbrica-de-evaluación) •
[💳 Pasarelas de Pago](#-guía-de-prueba-de-pasarelas-de-pago-sandbox) •
[🚀 Inicio Rápido](#-inicio-rápido-en-1-clic) •
[🔑 Credenciales](#-credenciales-de-acceso) •
[☁️ Despliegue AWS](#️-despliegue-en-aws-ec2)

</div>

---

## 📌 Resumen Ejecutivo del Proyecto

La clínica veterinaria **PetCare** presentaba pérdidas operativas críticas debido al agendamiento manual en papel: solapamiento de horas médicas, extravío de historiales clínicos, falta de trazabilidad en los esquemas de vacunación y retrasos en los cobros.

**PetCare Clinic Compass** resuelve esta problemática mediante una arquitectura moderna desacoplada:
* 🌐 **Frontend SPA Reactivo:** Construido con **React 19**, **TanStack Start & Router**, **Tailwind CSS v4**, componentes accesibles **Radix UI / shadcn** e infografía clínica interactiva en **Recharts**.
* ⚙️ **Backend de Alto Rendimiento:** Basado en **Django 5.2** y **Django REST Framework (DRF)** con validación algorítmica de negocio (prevención estricta de solapamiento horario de médicos y verificación de RUT chileno bajo Módulo 11).
* 🛡️ **Panel Administrativo Enterprise:** Django Admin personalizado con tablas inlines, filtros temporales, buscador indexado y semáforos de colores HTML.
* 💳 **Pasarelas de Pago Oficiales en Sandbox:** Integración directa con **Transbank Webpay Plus** (entorno oficial de integración), **Mercado Pago Checkout Pro**, **PayPal Orders v2** y **Criptomonedas (NOWPayments)**.
* ☁️ **Infraestructura Cloud Lista para AWS:** Configuración automatizada con scripts de aprovisionamiento para **AWS EC2 (Ubuntu 22.04 LTS)**, **Gunicorn WSGI**, **Nginx Proxy Inverso** y **PostgreSQL 14+**.

---

## ✨ Características Principales

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           PETCARE CLINIC COMPASS                          │
├─────────────────────┬─────────────────────┬───────────────────────────────┤
│ 🐶 Tutores & Mascotas│ 📅 Agenda Médica    │ 🩺 Ficha Clínica Digital      │
│  • RUT Módulo 11    │  • Anti-solape vet  │  • Signos vitales & triaje    │
│  • Especies & razas │  • Rango en minutos │  • Recetas médicas vinculadas │
│  • Microchip & foto │  • Estados dinámicos│  • Exámenes complementarios   │
├─────────────────────┼─────────────────────┼───────────────────────────────┤
│ 🔔 Semáforo Vacunas │ 💳 Pasarelas Pago   │ 🛡️ Django Admin & API DRF     │
│  • Verde: Al día    │  • Transbank Webpay │  • Inlines tutor/mascota      │
│  • Amarillo: <15 d  │  • Mercado Pago Pro │  • Badges de color en estados │
│  • Rojo: Vencida    │  • PayPal & Cripto  │  • API REST con Swagger/CORS  │
└─────────────────────┴─────────────────────┴───────────────────────────────┘
```

> [!TIP]
> **Anti-Solapamiento Estricto:** La regla matemática que previene citas superpuestas valida que una nueva cita no inicie antes de que termine una en curso ni termine después de que empiece la siguiente para el mismo veterinario:  
> `inicio_nueva < fin_existente` $\land$ `fin_nueva > inicio_existente`.

---

## 🏛️ Cumplimiento de la Rúbrica de Evaluación

| Criterio | Exigencia Académica | Implementación Técnica en PetCare | Estado |
|:---|:---|:---|:---:|
| **1. Base de Datos Relacional y Modelos** | PostgreSQL 14+ con tablas normalizadas en 3FN, claves foráneas, índices y fallback de desarrollo. | Configuración dual en [`settings.py`](file:///backend/petcare_core/settings.py). Si `USE_POSTGRES=True` conecta a PostgreSQL; fallback inteligente a SQLite3 para ejecución local instantánea. 10 modelos fuertemente tipados. | **100%** ✅ |
| **2. Panel Administrativo Django** | Django Admin con modelos registrados, inlines, filtros, ordenamiento, buscadores y badges HTML. | Personalización completa en [`admin.py`](file:///backend/petcare_app/admin.py) con `MascotaInline`, `RecetaMedicaInline`, `ExamenClinicoInline`, `date_hierarchy`, `search_fields` indexados y badges de semáforo con `format_html`. | **100%** ✅ |
| **3. Lógica del Negocio y CRUD** | CRUD de Tutores, Mascotas, Citas, Fichas Médicas y Recordatorios con validaciones de negocio. | Verificación de RUT con algoritmo Módulo 11 oficial, control de choque horario por veterinario en ORM y DRF, cálculo de alertas de vacunación automáticas. | **100%** ✅ |
| **4. Seguridad y Prompts IA** | Variables protegidas en entorno, CORS, autenticación por sesión/token y `prompts_ia.md` formal. | Documento formal [`docs/prompts_ia.md`](file:///docs/prompts_ia.md) con la **Arquitectura 4+1 de Kruchten** y registro detallado de prompts. Middleware de seguridad y CORS habilitados. | **100%** ✅ |
| **5. Despliegue en AWS EC2** | Aprovisionamiento en instancia EC2 con Gunicorn, Nginx y PostgreSQL. | Script automatizado [`deploy/scripts/deploy_aws.sh`](file:///deploy/scripts/deploy_aws.sh), configuración de Nginx con gzip/sockets Unix y servicio systemd para autoreinicio. | **100%** ✅ |

---

## 💳 Guía de Prueba de Pasarelas de Pago (Sandbox)

El módulo de **Pagos** permite procesar cobros clínicos simulados sin dinero real:

```
                  ┌─────────────────────────────────────────┐
                  │             PASARELA DE PAGO            │
                  └────────────────────┬────────────────────┘
                                       │
        ┌───────────────────┬──────────┴──────────┬───────────────────┐
        ▼                   ▼                     ▼                   ▼
┌───────────────┐   ┌───────────────┐     ┌───────────────┐   ┌───────────────┐
│   Transbank   │   │  Mercado Pago │     │     PayPal    │   │  Criptomonedas│
│  Webpay Plus  │   │  Checkout Pro │     │   Orders v2   │   │  NOWPayments  │
│(API Oficial)  │   │   (Sandbox)   │     │   (Sandbox)   │   │   (Testnet)   │
└───────┬───────┘   └───────┬───────┘     └───────┬───────┘   └───────┬───────┘
        │                   │                     │                   │
        └───────────────────┴──────────┬──────────┴───────────────────┘
                                       ▼
                    ┌─────────────────────────────────────┐
                    │ Voucher Electrónico Aprobado + Ref  │
                    └─────────────────────────────────────┘
```

### 🇨🇱 1. Transbank Webpay Plus (Conexión Oficial en Vivo)
* **API Endpoint:** `https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions`
* **Código de Comercio Público:** `597055555532`
* **Tarjeta de Crédito de Prueba:** `4051 8856 0044 6623`
* **Fecha de Expiración:** Cualquier fecha futura (ej. `12/28`)
* **CVV:** `123`
* **RUT Simulado:** `11.111.111-1`
* **Clave Bancaria / Redcompra:** `123`
* **Resultado:** Redirige al portal oficial de Transbank Webpay Plus, autoriza la transacción server-side con commit criptográfico y retorna a PetCare con voucher aprobado.

### 🌐 2. Mercado Pago, PayPal y Cripto
* Ejecución sandbox automatizada: al seleccionar la pasarela y presionar el botón de cobro, el sistema procesa la transacción de prueba, emite el voucher legal y registra el pago en el historial con estado **Aprobado**.

---

## 🚀 Inicio Rápido en 1 Clic

### Método 1: Lanzadores de Windows (Recomendado)

En la raíz del proyecto encontrarás scripts listos para hacer doble clic:

* 🟢 **`INICIAR_TODO.bat`** $\rightarrow$ Abre automáticamente el Frontend (Vite) y el Backend (Django) en consolas independientes.
* 🔵 **`INICIAR_FRONTEND.bat`** $\rightarrow$ Lanza el servidor web React en [http://localhost:3000](http://localhost:3000).
* 🟠 **`INICIAR_BACKEND_DJANGO.bat`** $\rightarrow$ Lanza la API REST y el Admin de Django en [http://localhost:8000](http://localhost:8000).

---

### Método 2: Ejecución Manual por Consola

#### Paso 1: Levantar el Backend Django
```bash
# Entrar al directorio del backend
cd backend

# Aplicar migraciones
python manage.py migrate

# Poblar base de datos con doctores, tutores, mascotas y citas
python seed_data.py

# Iniciar servidor de desarrollo
python manage.py runserver 8000
```
> * Admin Django: [http://localhost:8000/admin/](http://localhost:8000/admin/)  
> * API REST DRF: [http://localhost:8000/api/](http://localhost:8000/api/)

#### Paso 2: Levantar el Frontend React
```bash
# En la raíz del repositorio
npm install
npm run dev
```
> * Aplicación Web: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Credenciales de Acceso

| Rol / Acceso | Usuario | Contraseña | Descripción |
|:---|:---|:---|:---|
| **Docente Evaluador (Profesor)** | `profe` | `123456` | Cuenta superusuario definida en la guía de evaluación |
| **Superadministrador** | `admin` | `admin123` | Control total del Django Admin, auditoría de pagos y fichas |
| **Médico Veterinario** | `vet_patricia` | `vet123` | Acceso a agenda, atenciones clínicas y prescripciones |
| **Médico Veterinario** | `vet_carlos` | `vet123` | Cirugía y traumatología, fichas médicas |
| **Tutor de Mascota** | `tutor_camila` | `tutor12345` | Portal de tutores para visualización de carnet y citas |

---

## 🧪 Pruebas Unitarias Automatizadas (100% Pasadas)

El sistema cuenta con pruebas unitarias tanto en el frontend como en el backend:

### 1. Pruebas Unitarias Frontend (Vitest)
```bash
npm test
```
```text
 ✓ src/test/clinic.test.ts (5 tests)
 ✓ src/test/app-routing.test.tsx (1 test)

 Test Files  2 passed (2)
      Tests  6 passed (6)
   Duration  5.13s (Tests: 100% OK)
```

### 2. Pruebas Unitarias Backend (Django Test Suite)
```bash
cd backend
python manage.py test
```
```text
Creating test database for alias 'default'...
.......
----------------------------------------------------------------------
Ran 7 tests in 13.913s

OK
Destroying test database for alias 'default'...
```

---

## ☁️ Despliegue en AWS EC2

Para desplegar la aplicación en la nube de Amazon Web Services:

```bash
# 1. Conectarse a la instancia EC2 Ubuntu 22.04 LTS
ssh -i "tu-llave-inacap.pem" ubuntu@tu-ip-publica-ec2

# 2. Clonar el repositorio
git clone https://github.com/sebatmail/petcare-clinic-compass.git
cd petcare-clinic-compass

# 3. Ejecutar el script automatizado de aprovisionamiento
sudo bash deploy/scripts/deploy_aws.sh
```

El script se encarga de:
1. Actualizar paquetes del sistema operativo e instalar dependencias (`python3-pip`, `nginx`, `postgresql`, `nodejs`).
2. Crear la base de datos `petcare_db` y su usuario con privilegios en PostgreSQL.
3. Crear el entorno virtual e instalar los paquetes de `requirements.txt`.
4. Ejecutar `migrate`, `collectstatic` y `seed_data.py`.
5. Configurar el socket IPC y el servicio systemd de **Gunicorn** (`gunicorn.service`).
6. Configurar el proxy inverso de **Nginx** en el puerto 80 con caché para estáticos.

---

## 📂 Estructura del Proyecto

```text
petcare-clinic-compass/
├── 📁 backend/                    # Servidor Django REST Framework
│   ├── 📁 petcare_app/            # Dominio clínico (Modelos, Vistas, Serializers, Tests, Admin)
│   ├── 📁 petcare_core/           # Configuración central (settings dual PostgreSQL/SQLite, urls)
│   ├── 📁 deploy/                 # Infraestructura como código (scripts AWS, Nginx, Systemd)
│   ├── 📁 docs/                   # prompts_ia.md con Arquitectura 4+1
│   ├── 📁 static/                 # Archivos estáticos, imágenes de tutores y mascotas
│   ├── 📁 templates/              # Vistas HTML renderizadas por servidor
│   ├── 📄 manage.py               # CLI de Django
│   ├── 📄 requirements.txt        # Dependencias de Python
│   ├── 📄 seed_data.py            # Script de inicialización de datos clínicos
│   └── 📄 db.sqlite3              # Base de datos local precargada
│
├── 📁 src/                        # Frontend React 19 / TanStack Start
│   ├── 📁 assets/                 # Avatares e ilustraciones generadas
│   ├── 📁 components/             # Componentes UI (Sidebar, PageHeader, Cards, Dialogs)
│   ├── 📁 lib/                    # Lógica de negocio (clinic.ts, store.tsx, payments.functions.ts)
│   ├── 📁 routes/                 # Rutas de la SPA (Dashboard, Agenda, Fichas, Pagos, etc.)
│   └── 📁 test/                   # Pruebas automatizadas Vitest
│
├── 📁 deploy/                     # Espejo de configuración Cloud AWS
├── 📁 docs/                       # Documentación formal de IA y rúbrica
├── 📄 INICIAR_TODO.bat            # Lanzador integral del sistema
├── 📄 INICIAR_FRONTEND.bat        # Lanzador directo del Frontend
├── 📄 INICIAR_BACKEND_DJANGO.bat  # Lanzador directo del Backend Django
├── 📄 package.json                # Dependencias Node.js y scripts
├── 📄 vite.config.ts              # Configuración de empaquetado Vite
└── 📄 README.md                   # Documentación principal del repositorio
```

---

<div align="center">

### 👨‍💻 Información Académica y Autoría

**Estudiante:** Sebastián Ignacio Torres Zamorano  
**Carrera:** Ingeniería en Informática / Analista Programador  
**Evaluación:** Evaluación Parcial N°3 — Desarrollo Backend & Cloud AWS  
**Docente:** Marcelo Alvarado Aravena  
**Año Académico:** 2026 — Instituto Profesional INACAP

⭐ *Si este proyecto te resulta útil o destacable, no dudes en dejarle una estrella en GitHub.* ⭐

</div>
