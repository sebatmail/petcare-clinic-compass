import os
import django
from datetime import datetime, date, timedelta
from django.utils import timezone
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'petcare_core.settings')
django.setup()

from django.contrib.auth.models import User
from petcare_app.models import (
    Tutor, Mascota, Veterinario, CitaMedica,
    FichaClinica, RecetaMedica, ExamenClinico,
    VacunaRegistro, RecordatorioPreventivo, PagoServicio
)

print("Iniciando poblado de base de datos PetCare...")

# 1. Superusuarios para evaluación
users_data = [
    ("admin", "admin@petcare.cl", "admin123", "Sebastián", "Torres"),
    ("profe", "marcelo.alvarado@inacap.cl", "123456", "Marcelo", "Alvarado"),
    ("vet_patricia", "patricia.soto@petcare.cl", "vet123", "Patricia", "Soto"),
    ("vet_carlos", "carlos.mendoza@petcare.cl", "vet123", "Carlos", "Mendoza"),
]

for uname, email, pwd, fname, lname in users_data:
    u, created = User.objects.get_or_create(username=uname, defaults={"email": email, "first_name": fname, "last_name": lname})
    u.set_password(pwd)
    u.is_staff = True
    u.is_superuser = (uname in ["admin", "profe"])
    u.save()

u_profe = User.objects.get(username="profe")
u_patricia = User.objects.get(username="vet_patricia")
u_carlos = User.objects.get(username="vet_carlos")

# 2. Veterinarios
vets = [
    {
        "user": u_profe,
        "rut": "12.345.678-5",
        "nombre_completo": "Marcelo Alvarado Aravena",
        "especialidad": "MEDICINA_GENERAL",
        "numero_colegiado": "COLMEVET-7890",
        "telefono": "+56987654321",
        "email": "marcelo.alvarado@petcare.cl",
        "foto": "/static/images/avatars/vet_1.svg"
    },
    {
        "user": u_patricia,
        "rut": "14.567.890-2",
        "nombre_completo": "Patricia Soto Mardones",
        "especialidad": "CIRUGIA",
        "numero_colegiado": "COLMEVET-8912",
        "telefono": "+56976543210",
        "email": "patricia.soto@petcare.cl",
        "foto": "/static/images/avatars/vet_2.svg"
    },
    {
        "user": u_carlos,
        "rut": "15.678.901-3",
        "nombre_completo": "Carlos Mendoza Villalobos",
        "especialidad": "DERMATOLOGIA",
        "numero_colegiado": "COLMEVET-9023",
        "telefono": "+56965432109",
        "email": "carlos.mendoza@petcare.cl",
        "foto": "/static/images/avatars/vet_default.svg"
    }
]

vet_objs = []
for v in vets:
    obj, _ = Veterinario.objects.update_or_create(
        user=v["user"],
        defaults=v
    )
    vet_objs.append(obj)

# 3. Tutores
tutores_data = [
    {
        "rut": "19.876.543-0",
        "nombre_completo": "Sebastián Torres Zamorano",
        "email": "sebastian.torres33@inacapmail.cl",
        "telefono": "+56991234567",
        "direccion": "Av. Libertador B. O'Higgins 450",
        "comuna": "Santiago Centro",
        "foto": "/static/images/avatars/tutor_1.svg"
    },
    {
        "rut": "18.765.432-1",
        "nombre_completo": "Camila Alarcón Silva",
        "email": "camila.alarcon@gmail.com",
        "telefono": "+56982345678",
        "direccion": "Av. Las Condes 1020",
        "comuna": "Las Condes",
        "foto": "/static/images/avatars/tutor_2.svg"
    },
    {
        "rut": "17.654.321-K",
        "nombre_completo": "María Rodríguez Pérez",
        "email": "maria.rodriguez@hotmail.com",
        "telefono": "+56973456789",
        "direccion": "Av. Providencia 2340",
        "comuna": "Providencia",
        "foto": "/static/images/avatars/tutor_3.svg"
    },
    {
        "rut": "16.543.210-9",
        "nombre_completo": "Juan Pablo Valenzuela",
        "email": "jp.valenzuela@outlook.com",
        "telefono": "+56964567890",
        "direccion": "Gran Avenida 5600",
        "comuna": "San Miguel",
        "foto": "/static/images/avatars/tutor_4.svg"
    }
]

tutor_objs = []
for t in tutores_data:
    obj, _ = Tutor.objects.update_or_create(rut=t["rut"], defaults=t)
    tutor_objs.append(obj)

# 4. Mascotas
mascotas_data = [
    {
        "tutor": tutor_objs[0],
        "nombre": "Rocky",
        "especie": "CANINO",
        "raza": "Golden Retriever",
        "sexo": "MACHO",
        "fecha_nacimiento": date(2021, 4, 10),
        "peso_actual_kg": 28.5,
        "numero_chip": "990000001001",
        "color": "Dorado Claro",
        "alergias_condiciones": "Sensibilidad digestiva a cereales",
        "foto": "/static/images/pets/pet_dog1.svg"
    },
    {
        "tutor": tutor_objs[0],
        "nombre": "Luna",
        "especie": "FELINO",
        "raza": "Siamés",
        "sexo": "HEMBRA",
        "fecha_nacimiento": date(2022, 8, 20),
        "peso_actual_kg": 3.8,
        "numero_chip": "990000001002",
        "color": "Seal Point",
        "alergias_condiciones": "Ninguna",
        "foto": "/static/images/pets/pet_cat1.svg"
    },
    {
        "tutor": tutor_objs[1],
        "nombre": "Thor",
        "especie": "CANINO",
        "raza": "Pastor Alemán",
        "sexo": "MACHO",
        "fecha_nacimiento": date(2020, 11, 5),
        "peso_actual_kg": 34.0,
        "numero_chip": "990000001003",
        "color": "Negro Fuego",
        "alergias_condiciones": "Displasia de cadera grado I",
        "foto": "/static/images/pets/pet_dog2.svg"
    },
    {
        "tutor": tutor_objs[2],
        "nombre": "Misi",
        "especie": "FELINO",
        "raza": "Persa Angora",
        "sexo": "HEMBRA",
        "fecha_nacimiento": date(2023, 1, 15),
        "peso_actual_kg": 4.1,
        "numero_chip": "990000001004",
        "color": "Blanco Puro",
        "alergias_condiciones": "Lagrimeo ocular crónico",
        "foto": "/static/images/pets/pet_cat2.svg"
    },
    {
        "tutor": tutor_objs[3],
        "nombre": "Copito",
        "especie": "ROEDOR",
        "raza": "Conejo Belier Enano",
        "sexo": "MACHO",
        "fecha_nacimiento": date(2023, 6, 1),
        "peso_actual_kg": 1.6,
        "numero_chip": "990000001005",
        "color": "Gris Jaspeado",
        "alergias_condiciones": "Ninguna",
        "foto": "/static/images/pets/pet_rabbit.svg"
    }
]

mascota_objs = []
for m in mascotas_data:
    obj, _ = Mascota.objects.update_or_create(
        nombre=m["nombre"],
        tutor=m["tutor"],
        defaults=m
    )
    mascota_objs.append(obj)

# 5. Citas Médicas (Con horarios bien delimitados para validar NO SOLAPAMIENTO)
hoy = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0)
citas_data = [
    {
        "mascota": mascota_objs[0],
        "veterinario": vet_objs[0],
        "fecha_hora": hoy - timedelta(days=2, hours=1),
        "duracion_minutos": 30,
        "motivo": "Consulta general por decaimiento e inapetencia",
        "estado": "COMPLETADA",
        "costo_estimado": 25000
    },
    {
        "mascota": mascota_objs[1],
        "veterinario": vet_objs[0],
        "fecha_hora": hoy - timedelta(days=1),
        "duracion_minutos": 30,
        "motivo": "Control anual de vacunas y desparasitación",
        "estado": "COMPLETADA",
        "costo_estimado": 30000
    },
    {
        "mascota": mascota_objs[2],
        "veterinario": vet_objs[1],
        "fecha_hora": hoy,
        "duracion_minutos": 45,
        "motivo": "Evaluación radiológica por cojera en extremidad posterior",
        "estado": "EN_ATENCION",
        "costo_estimado": 45000
    },
    {
        "mascota": mascota_objs[3],
        "veterinario": vet_objs[2],
        "fecha_hora": hoy + timedelta(hours=2),
        "duracion_minutos": 30,
        "motivo": "Prurito intenso y alopecia en lomo y orejas",
        "estado": "CONFIRMADA",
        "costo_estimado": 28000
    },
    {
        "mascota": mascota_objs[4],
        "veterinario": vet_objs[0],
        "fecha_hora": hoy + timedelta(days=1, hours=1),
        "duracion_minutos": 30,
        "motivo": "Control odontológico y corte de uñas preventivo",
        "estado": "PROGRAMADA",
        "costo_estimado": 20000
    }
]

cita_objs = []
for c in citas_data:
    obj, _ = CitaMedica.objects.get_or_create(
        mascota=c["mascota"],
        veterinario=c["veterinario"],
        fecha_hora=c["fecha_hora"],
        defaults=c
    )
    cita_objs.append(obj)

# 6. Fichas Clínicas con Triaje, Recetas y Exámenes
ficha1, _ = FichaClinica.objects.get_or_create(
    mascota=mascota_objs[0],
    veterinario=vet_objs[0],
    cita=cita_objs[0],
    defaults={
        "temperatura_c": 38.6,
        "frecuencia_cardiaca_lpm": 115,
        "frecuencia_respiratoria_rpm": 24,
        "peso_kg": 28.5,
        "anamnesis": "Tutor refiere que el paciente ingirió restos de asado hace 48 horas. Presenta vómitos biliares e hiporexia.",
        "hallazgos_examen_fisico": "Abdomen blando pero depresible con leve dolor a la palpación en epigastrio. Mucosas normocoloreadas.",
        "diagnostico_principal": "Gastroenteritis aguda alimentaria de curso favorable",
        "diagnostico_diferencial": "Pancreatitis leve, indiscreción alimentaria",
        "indicaciones_generales": "Dieta blanda gastrointestinal fraccionada en 4 tomas diarias por 5 días. Reposo y abundante hidratación."
    }
)

RecetaMedica.objects.get_or_create(
    ficha_clinica=ficha1,
    medicamento="Omeprazol 20 mg Comprimidos",
    defaults={
        "principio_activo": "Omeprazol",
        "dosis": "1 comprimido cada 24 horas en ayunas",
        "via_administracion": "Oral",
        "duracion_dias": 7,
        "instrucciones": "Administrar 30 minutos antes del primer alimento del día."
    }
)

RecetaMedica.objects.get_or_create(
    ficha_clinica=ficha1,
    medicamento="Probióticos Caninos FortiFlora",
    defaults={
        "principio_activo": "Enterococcus faecium",
        "dosis": "1 sobre diario mezclado con el alimento",
        "via_administracion": "Oral",
        "duracion_dias": 10,
        "instrucciones": "Favorece la reconstitución de la microbiota intestinal."
    }
)

ExamenClinico.objects.get_or_create(
    ficha_clinica=ficha1,
    tipo_examen="SANGRE",
    nombre_especifico="Hemograma Completo y Perfil Bioquímico",
    defaults={
        "resultado": "Leucocitos: 11.200/uL (Normal), Hematocrito: 44%, ALT: 38 U/L, Creatinina: 1.1 mg/dL. Parámetros dentro de rangos basales normales.",
        "laboratorio": "Laboratorio Central PetCare",
        "archivo_adjunto": "https://petcare.cl/examenes/hemograma_rocky_2026.pdf"
    }
)

# 7. Registros de Vacunas (Con estados Al Día, Por Vencer y Vencida para probar el Semáforo)
vac_hoy = date.today()
vacunas_seed = [
    {
        "mascota": mascota_objs[0],
        "veterinario": vet_objs[0],
        "nombre_vacuna": "Antirrábica",
        "lote": "RAB-2025-09",
        "fecha_aplicacion": vac_hoy - timedelta(days=200),
        "fecha_proxima_dosis": vac_hoy + timedelta(days=165), # AL DÍA
    },
    {
        "mascota": mascota_objs[0],
        "veterinario": vet_objs[0],
        "nombre_vacuna": "Séxtuple Canina",
        "lote": "SEX-2025-11",
        "fecha_aplicacion": vac_hoy - timedelta(days=355),
        "fecha_proxima_dosis": vac_hoy + timedelta(days=10), # POR VENCER (<15 días)
    },
    {
        "mascota": mascota_objs[1],
        "veterinario": vet_objs[0],
        "nombre_vacuna": "Triple Felina",
        "lote": "TF-2024-05",
        "fecha_aplicacion": vac_hoy - timedelta(days=390),
        "fecha_proxima_dosis": vac_hoy - timedelta(days=25), # VENCIDA
    },
    {
        "mascota": mascota_objs[2],
        "veterinario": vet_objs[1],
        "nombre_vacuna": "Óctuple Canina",
        "lote": "OCT-2025-01",
        "fecha_aplicacion": vac_hoy - timedelta(days=100),
        "fecha_proxima_dosis": vac_hoy + timedelta(days=265), # AL DÍA
    }
]

for v in vacunas_seed:
    VacunaRegistro.objects.get_or_create(
        mascota=v["mascota"],
        nombre_vacuna=v["nombre_vacuna"],
        defaults=v
    )

# 8. Recordatorios Preventivos
rec1, _ = RecordatorioPreventivo.objects.get_or_create(
    mascota=mascota_objs[0],
    tutor=mascota_objs[0].tutor,
    tipo="VACUNACION",
    fecha_programada=vac_hoy + timedelta(days=3),
    defaults={
        "mensaje": f"Estimado(a) {mascota_objs[0].tutor.nombre_completo}, le recordamos que la vacuna Séxtuple de su paciente Rocky vence en los próximos días. Agende su cita en PetCare.",
        "canal": "WHATSAPP",
        "estado": "PENDIENTE",
        "disparado_por": "Motor Predictivo PetCare"
    }
)

rec2, _ = RecordatorioPreventivo.objects.get_or_create(
    mascota=mascota_objs[1],
    tutor=mascota_objs[1].tutor,
    tipo="VACUNACION",
    fecha_programada=vac_hoy - timedelta(days=5),
    defaults={
        "mensaje": f"URGENTE: La vacuna Triple Felina de Luna está vencida. Proteja a su mascota agendando hoy mismo en PetCare.",
        "canal": "EMAIL",
        "estado": "ENVIADO",
        "fecha_envio_real": timezone.now() - timedelta(days=5),
        "disparado_por": "Cron Job Alertas"
    }
)

# 9. Pagos y Pasarelas de Prueba
pago1, _ = PagoServicio.objects.get_or_create(
    transaccion_id="TBK-20261110-884210",
    defaults={
        "tutor": tutor_objs[0],
        "cita": cita_objs[0],
        "concepto": "Consulta Médica General y Hemograma",
        "monto_clp": 35000,
        "metodo_pago": "TRANSBANK_WEBPAY",
        "estado": "APROBADO",
        "codigo_autorizacion": "128472",
        "tarjeta_ultimos_digitos": "6623",
        "tipo_cuotas": "Venta Débito (Redcompra)",
        "voucher_data": json.dumps({
            "gateway": "TRANSBANK_WEBPAY",
            "commerce_code": "597055555532",
            "auth_code": "128472",
            "card": "XXXX-XXXX-XXXX-6623",
            "amount": 35000,
            "status": "AUTHORIZED"
        })
    }
)

pago2, _ = PagoServicio.objects.get_or_create(
    transaccion_id="MP-20261111-993821",
    defaults={
        "tutor": tutor_objs[1],
        "cita": cita_objs[1],
        "concepto": "Inmunización Séxtuple y Desparasitación",
        "monto_clp": 30000,
        "metodo_pago": "MERCADO_PAGO",
        "estado": "APROBADO",
        "codigo_autorizacion": "MP-94812",
        "tarjeta_ultimos_digitos": "9941",
        "tipo_cuotas": "Mercado Pago QR Dinámico",
        "voucher_data": json.dumps({
            "gateway": "MERCADO_PAGO",
            "auth_code": "MP-94812",
            "amount": 30000,
            "status": "APPROVED"
        })
    }
)

print("¡Poblado de base de datos PetCare completado exitosamente!")
print(f"Tutores: {Tutor.objects.count()} | Mascotas: {Mascota.objects.count()} | Citas: {CitaMedica.objects.count()}")
print(f"Fichas Clínicas: {FichaClinica.objects.count()} | Vacunas: {VacunaRegistro.objects.count()} | Pagos: {PagoServicio.objects.count()}")
