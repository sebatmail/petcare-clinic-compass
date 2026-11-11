from django.test import TestCase, Client
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, date, timedelta
from django.contrib.auth.models import User

from .models import (
    Tutor, Mascota, Veterinario, CitaMedica,
    FichaClinica, VacunaRegistro, RecordatorioPreventivo, PagoServicio,
    validar_rut_chileno
)

class PetCareComprehensiveTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        # Usuario y Veterinario
        self.user_vet1 = User.objects.create_user(username='vet1', password='password123')
        self.user_vet2 = User.objects.create_user(username='vet2', password='password123')

        self.vet1 = Veterinario.objects.create(
            user=self.user_vet1,
            rut='12.345.678-5',
            nombre_completo='Dr. Marcelo Alvarado',
            especialidad='MEDICINA_GENERAL',
            numero_colegiado='COLMEVET-001',
            telefono='+56911111111',
            email='vet1@petcare.cl'
        )

        self.vet2 = Veterinario.objects.create(
            user=self.user_vet2,
            rut='14.567.890-2',
            nombre_completo='Dra. Patricia Soto',
            especialidad='CIRUGIA',
            numero_colegiado='COLMEVET-002',
            telefono='+56922222222',
            email='vet2@petcare.cl'
        )

        # Tutor
        self.tutor = Tutor.objects.create(
            rut='19.876.543-0',
            nombre_completo='Sebastián Torres',
            email='seba@correo.cl',
            telefono='+56933333333',
            comuna='Santiago'
        )

        # Mascota
        self.mascota = Mascota.objects.create(
            tutor=self.tutor,
            nombre='Rocky',
            especie='CANINO',
            raza='Golden Retriever',
            sexo='MACHO',
            fecha_nacimiento=date(2021, 1, 1),
            peso_actual_kg=25.0
        )

    def test_01_rut_chileno_valido_e_invalido(self):
        """Prueba que el validador Módulo 11 acepte RUTs válidos y rechace inválidos"""
        # Válido
        validar_rut_chileno('19.876.543-0')
        validar_rut_chileno('12.345.678-5')
        # Inválido
        with self.assertRaises(ValidationError):
            validar_rut_chileno('19.876.543-9') # DV erróneo

    def test_02_prevencion_solapamiento_citas(self):
        """Regla de Negocio Crítica: Bloquear solapamiento de horarios para el mismo médico"""
        base_time = timezone.now().replace(minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        # Cita 1: 10:00 - 10:30 con Vet 1
        CitaMedica.objects.create(
            mascota=self.mascota,
            veterinario=self.vet1,
            fecha_hora=base_time,
            duracion_minutos=30,
            motivo='Control general'
        )

        # Intento de Cita 2: 10:15 - 10:45 con el MISMO Vet 1 (Debe fallar por solapamiento)
        cita_solapada = CitaMedica(
            mascota=self.mascota,
            veterinario=self.vet1,
            fecha_hora=base_time + timedelta(minutes=15),
            duracion_minutos=30,
            motivo='Vacunación'
        )
        with self.assertRaises(ValidationError):
            cita_solapada.clean()

    def test_03_cita_mismo_horario_distinto_veterinario(self):
        """Permite citas simultáneas si son con médicos veterinarios distintos"""
        base_time = timezone.now().replace(minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        # Cita con Vet 1
        c1 = CitaMedica.objects.create(
            mascota=self.mascota,
            veterinario=self.vet1,
            fecha_hora=base_time,
            duracion_minutos=30,
            motivo='Consulta general'
        )
        self.assertIsNotNone(c1.id)

        # Cita al MISMO tiempo pero con Vet 2 (Debe ser permitida)
        c2 = CitaMedica.objects.create(
            mascota=self.mascota,
            veterinario=self.vet2,
            fecha_hora=base_time,
            duracion_minutos=30,
            motivo='Cirugía'
        )
        self.assertIsNotNone(c2.id)

    def test_04_semaforo_vacunacion(self):
        """Prueba que el estado dinámico del carnet de vacunación calcule Al Día, Por Vencer y Vencida"""
        hoy = date.today()

        v_ok = VacunaRegistro.objects.create(
            mascota=self.mascota,
            veterinario=self.vet1,
            nombre_vacuna='Antirrábica',
            lote='L1',
            fecha_aplicacion=hoy,
            fecha_proxima_dosis=hoy + timedelta(days=60)
        )
        self.assertEqual(v_ok.estado_actual, 'AL_DIA')

        v_warning = VacunaRegistro.objects.create(
            mascota=self.mascota,
            veterinario=self.vet1,
            nombre_vacuna='Séxtuple',
            lote='L2',
            fecha_aplicacion=hoy - timedelta(days=355),
            fecha_proxima_dosis=hoy + timedelta(days=5) # <15 días
        )
        self.assertEqual(v_warning.estado_actual, 'POR_VENCER')

        v_expired = VacunaRegistro.objects.create(
            mascota=self.mascota,
            veterinario=self.vet1,
            nombre_vacuna='KC',
            lote='L3',
            fecha_aplicacion=hoy - timedelta(days=400),
            fecha_proxima_dosis=hoy - timedelta(days=10) # Pasada
        )
        self.assertEqual(v_expired.estado_actual, 'VENCIDA')

    def test_05_recordatorio_preventivo_disparo(self):
        """Prueba el despacho del recordatorio automatizado"""
        rec = RecordatorioPreventivo.objects.create(
            mascota=self.mascota,
            tutor=self.tutor,
            tipo='VACUNACION',
            fecha_programada=date.today(),
            mensaje='Recordatorio de prueba',
            canal='WHATSAPP',
            estado='PENDIENTE'
        )
        self.assertEqual(rec.estado, 'PENDIENTE')
        self.assertIsNone(rec.fecha_envio_real)

        rec.disparar_envio()
        self.assertEqual(rec.estado, 'ENVIADO')
        self.assertIsNotNone(rec.fecha_envio_real)

    def test_06_simulacion_pago_pasarela(self):
        """Prueba creación y comprobante de pasarela de pago Transbank/MercadoPago"""
        pago = PagoServicio.objects.create(
            tutor=self.tutor,
            concepto='Consulta y Vacuna',
            monto_clp=28000,
            metodo_pago='TRANSBANK_WEBPAY',
            estado='APROBADO',
            transaccion_id='TBK-TEST-999',
            codigo_autorizacion='123456'
        )
        self.assertEqual(pago.estado, 'APROBADO')
        self.assertEqual(pago.monto_clp, 28000)

    def test_07_endpoints_api_drf(self):
        """Prueba la disponibilidad de los endpoints de la API REST de DRF"""
        # GET /api/tutores/
        resp_tutores = self.client.get('/api/tutores/')
        self.assertEqual(resp_tutores.status_code, 200)

        # GET /api/mascotas/
        resp_mascotas = self.client.get('/api/mascotas/')
        self.assertEqual(resp_mascotas.status_code, 200)

        # GET /api/citas/verificar_disponibilidad/
        fecha_str = (timezone.now() + timedelta(days=2)).isoformat()
        resp_disp = self.client.get(f'/api/citas/verificar_disponibilidad/?veterinario_id={self.vet1.id}&fecha_hora={fecha_str}&duracion=30')
        self.assertEqual(resp_disp.status_code, 200)
        self.assertTrue(resp_disp.json().get('disponible'))
