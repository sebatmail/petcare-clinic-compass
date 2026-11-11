from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta, date
import re

def validar_rut_chileno(rut):
    """
    Valida formato y dígito verificador del RUT chileno (Módulo 11).
    Acepta formatos: 12345678-9, 12.345.678-K, 123456789
    """
    if not rut:
        return
    rut_limpio = rut.replace('.', '').replace('-', '').upper().strip()
    if len(rut_limpio) < 8 or len(rut_limpio) > 9:
        raise ValidationError('El RUT debe tener entre 7 u 8 dígitos más el dígito verificador.')
    
    cuerpo = rut_limpio[:-1]
    dv = rut_limpio[-1]
    
    if not cuerpo.isdigit():
        raise ValidationError('El cuerpo del RUT debe contener únicamente números.')
    
    # Cálculo Módulo 11 Oficial Chileno (Factores: 2, 3, 4, 5, 6, 7, 2, 3...)
    suma = 0
    multiplicador = 2
    for d in reversed(cuerpo):
        suma += int(d) * multiplicador
        multiplicador = 2 if multiplicador == 7 else multiplicador + 1
    
    resto = 11 - (suma % 11)
    if resto == 11:
        dv_esperado = '0'
    elif resto == 10:
        dv_esperado = 'K'
    else:
        dv_esperado = str(resto)
        
    if dv != dv_esperado:
        raise ValidationError(f'RUT inválido: el dígito verificador para {cuerpo} debe ser {dv_esperado}.')


class Tutor(models.Model):
    """
    Tutor / Propietario de la mascota.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='perfil_tutor')
    rut = models.CharField('RUT', max_length=12, unique=True, validators=[validar_rut_chileno])
    nombre_completo = models.CharField('Nombre Completo', max_length=150)
    email = models.EmailField('Correo Electrónico')
    telefono = models.CharField('Teléfono / WhatsApp', max_length=20)
    direccion = models.CharField('Dirección', max_length=200, blank=True)
    comuna = models.CharField('Comuna / Ciudad', max_length=100, default='Santiago')
    foto = models.CharField('Avatar / Imagen URL', max_length=500, blank=True, default='/static/images/avatars/tutor_default.png')
    fecha_registro = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    activo = models.BooleanField('Activo', default=True)

    class Meta:
        verbose_name = 'Tutor'
        verbose_name_plural = 'Tutores'
        ordering = ['nombre_completo']

    def __str__(self):
        return f"{self.nombre_completo} ({self.rut})"

    @property
    def total_mascotas(self):
        return self.mascotas.filter(activo=True).count()


class Mascota(models.Model):
    """
    Paciente clínico animal.
    """
    ESPECIE_CHOICES = [
        ('CANINO', 'Canino (Perro)'),
        ('FELINO', 'Felino (Gato)'),
        ('AVE', 'Ave'),
        ('ROEDOR', 'Roedor / Conejo'),
        ('EXOTICO', 'Reptil / Exótico'),
        ('OTRO', 'Otro'),
    ]

    SEXO_CHOICES = [
        ('MACHO', 'Macho'),
        ('HEMBRA', 'Hembra'),
    ]

    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name='mascotas', verbose_name='Tutor')
    nombre = models.CharField('Nombre del Paciente', max_length=80)
    especie = models.CharField('Especie', max_length=20, choices=ESPECIE_CHOICES, default='CANINO')
    raza = models.CharField('Raza', max_length=100, default='Mestizo')
    sexo = models.CharField('Sexo', max_length=10, choices=SEXO_CHOICES, default='MACHO')
    fecha_nacimiento = models.DateField('Fecha de Nacimiento')
    peso_actual_kg = models.DecimalField('Peso Actual (Kg)', max_digits=5, decimal_places=2, default=5.0)
    numero_chip = models.CharField('N° Microchip (SAG)', max_length=30, blank=True, null=True, unique=True)
    color = models.CharField('Color / Señas particulares', max_length=100, blank=True)
    alergias_condiciones = models.TextField('Alergias o Condiciones Preexistentes', blank=True)
    foto = models.CharField('Foto / Avatar URL', max_length=500, blank=True, default='/static/images/pets/pet_default.png')
    activo = models.BooleanField('Activo', default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Mascota'
        verbose_name_plural = 'Mascotas'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_especie_display()}) - Tutor: {self.tutor.nombre_completo}"

    @property
    def edad_calculada(self):
        hoy = date.today()
        anios = hoy.year - self.fecha_nacimiento.year - (
            (hoy.month, hoy.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
        )
        if anios > 0:
            return f"{anios} {'año' if anios == 1 else 'años'}"
        meses = (hoy.year - self.fecha_nacimiento.year) * 12 + hoy.month - self.fecha_nacimiento.month
        return f"{max(meses, 1)} meses"


class Veterinario(models.Model):
    """
    Profesional médico veterinario clínico.
    """
    ESPECIALIDAD_CHOICES = [
        ('MEDICINA_GENERAL', 'Medicina General y Preventiva'),
        ('CIRUGIA', 'Cirugía de Tejidos Blandos y Ortopedia'),
        ('DERMATOLOGIA', 'Dermatología Veterinaria'),
        ('CARDIOLOGIA', 'Cardiología y Ecocardiografía'),
        ('FELINA', 'Especialista en Medicina Felina'),
        ('EXOTICOS', 'Fauna Silvestre y Animales Exóticos'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil_veterinario')
    rut = models.CharField('RUT Profesional', max_length=12, unique=True, validators=[validar_rut_chileno])
    nombre_completo = models.CharField('Nombre Completo', max_length=150)
    especialidad = models.CharField('Especialidad', max_length=30, choices=ESPECIALIDAD_CHOICES, default='MEDICINA_GENERAL')
    numero_colegiado = models.CharField('N° Registro Colmevet', max_length=30, unique=True)
    telefono = models.CharField('Teléfono de Contacto', max_length=20)
    email = models.EmailField('Correo Institucional')
    horario_atencion = models.CharField('Jornada de Atención', max_length=150, default='Lunes a Viernes 09:00 - 18:00 hrs')
    foto = models.CharField('Foto Perfil URL', max_length=500, blank=True, default='/static/images/avatars/vet_default.png')
    activo = models.BooleanField('Habilitado para Citas', default=True)

    class Meta:
        verbose_name = 'Médico Veterinario'
        verbose_name_plural = 'Médicos Veterinarios'
        ordering = ['nombre_completo']

    def __str__(self):
        return f"Dr(a). {self.nombre_completo} - {self.get_especialidad_display()}"


class CitaMedica(models.Model):
    """
    Agendamiento de citas médicas con validación estricta de NO SOLAPAMIENTO.
    """
    ESTADO_CHOICES = [
        ('PROGRAMADA', 'Programada'),
        ('CONFIRMADA', 'Confirmada'),
        ('EN_ESPERA', 'En Sala de Espera'),
        ('EN_ATENCION', 'En Atención Clínica'),
        ('COMPLETADA', 'Completada / Atendida'),
        ('CANCELADA', 'Cancelada'),
    ]

    mascota = models.ForeignKey(Mascota, on_delete=models.CASCADE, related_name='citas', verbose_name='Paciente')
    veterinario = models.ForeignKey(Veterinario, on_delete=models.CASCADE, related_name='citas', verbose_name='Médico Veterinario')
    fecha_hora = models.DateTimeField('Fecha y Hora de la Cita')
    duracion_minutos = models.IntegerField('Duración estimada (minutos)', default=30)
    motivo = models.CharField('Motivo de Consulta', max_length=200)
    estado = models.CharField('Estado', max_length=20, choices=ESTADO_CHOICES, default='PROGRAMADA')
    costo_estimado = models.IntegerField('Costo Estimado (CLP)', default=25000)
    notas = models.TextField('Notas de Recepción / Instrucciones previas', blank=True)
    fecha_creacion = models.DateTimeField('Registrada el', auto_now_add=True)

    class Meta:
        verbose_name = 'Cita Médica'
        verbose_name_plural = 'Citas Médicas'
        ordering = ['-fecha_hora']

    def __str__(self):
        return f"Cita #{self.id}: {self.mascota.nombre} con {self.veterinario.nombre_completo} ({self.fecha_hora.strftime('%d/%m/%Y %H:%M')})"

    def clean(self):
        """
        Regla de negocio crítica: PREVENCIÓN DE SOLAPAMIENTO DE HORAS
        Verifica que el profesional veterinario no tenga otra cita simultánea en el mismo rango horario.
        """
        if not self.fecha_hora or not self.veterinario_id:
            return

        inicio_nueva = self.fecha_hora
        duracion = self.duracion_minutos or 30
        fin_nueva = inicio_nueva + timedelta(minutes=duracion)

        # Buscar citas activas del mismo profesional
        citas_existentes = CitaMedica.objects.filter(
            veterinario=self.veterinario,
            estado__in=['PROGRAMADA', 'CONFIRMADA', 'EN_ESPERA', 'EN_ATENCION']
        )
        if self.pk:
            citas_existentes = citas_existentes.exclude(pk=self.pk)

        for c in citas_existentes:
            c_inicio = c.fecha_hora
            c_fin = c.fecha_hora + timedelta(minutes=c.duracion_minutos)
            # Regla de intersección: inicio_nueva < c_fin AND fin_nueva > c_inicio
            if inicio_nueva < c_fin and fin_nueva > c_inicio:
                raise ValidationError(
                    f"Conflicto de horario: El Dr(a). {self.veterinario.nombre_completo} ya tiene una cita "
                    f"programada ({c.motivo} para {c.mascota.nombre}) entre {c_inicio.strftime('%H:%M')} y {c_fin.strftime('%H:%M')} hrs."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class FichaClinica(models.Model):
    """
    Ficha Médica Electrónica Integral.
    """
    mascota = models.ForeignKey(Mascota, on_delete=models.CASCADE, related_name='fichas_clinicas', verbose_name='Paciente')
    cita = models.OneToOneField(CitaMedica, on_delete=models.SET_NULL, null=True, blank=True, related_name='ficha_clinica', verbose_name='Cita Asociada')
    veterinario = models.ForeignKey(Veterinario, on_delete=models.CASCADE, related_name='fichas_emitidas', verbose_name='Médico Tratante')
    fecha_atencion = models.DateTimeField('Fecha y Hora de Atención', default=timezone.now)
    
    # Constantes Fisiológicas (Triaje)
    temperatura_c = models.DecimalField('Temperatura (°C)', max_digits=4, decimal_places=1, default=38.5)
    frecuencia_cardiaca_lpm = models.IntegerField('Frecuencia Cardíaca (LPM)', default=120)
    frecuencia_respiratoria_rpm = models.IntegerField('Frecuencia Respiratoria (RPM)', default=25)
    peso_kg = models.DecimalField('Peso en Atención (Kg)', max_digits=5, decimal_places=2, default=5.0)
    condicion_corporal = models.CharField('Condición Corporal (1-5)', max_length=20, default='3/5 Ideal')

    # Diagnóstico y Evolución
    anamnesis = models.TextField('Anamnesis / Motivo Clínico')
    hallazgos_examen_fisico = models.TextField('Examen Físico Segmentario / Hallazgos')
    diagnostico_principal = models.CharField('Diagnóstico Principal', max_length=250)
    diagnostico_diferencial = models.TextField('Diagnósticos Diferenciales', blank=True)
    indicaciones_generales = models.TextField('Indicaciones y Cuidados para el Tutor')
    proximo_control_sugerido = models.DateField('Fecha Sugerida de Próximo Control', null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Ficha Clínica'
        verbose_name_plural = 'Fichas Clínicas'
        ordering = ['-fecha_atencion']

    def __str__(self):
        return f"Ficha Médica #{self.id} - {self.mascota.nombre} ({self.fecha_atencion.strftime('%d/%m/%Y')})"


class RecetaMedica(models.Model):
    """
    Receta médica / Farmacología prescrita vinculada a la Ficha Clínica.
    """
    ficha_clinica = models.ForeignKey(FichaClinica, on_delete=models.CASCADE, related_name='recetas', verbose_name='Ficha Médica')
    medicamento = models.CharField('Medicamento / Fármaco', max_length=150)
    principio_activo = models.CharField('Principio Activo', max_length=150, blank=True)
    dosis = models.CharField('Dosis e Intervalo', max_length=150, help_text='Ej: 1 comprimido cada 12 horas')
    via_administracion = models.CharField('Vía de Administración', max_length=50, default='Oral')
    duracion_dias = models.IntegerField('Duración del Tratamiento (días)', default=7)
    instrucciones = models.TextField('Instrucciones Especiales', blank=True)

    class Meta:
        verbose_name = 'Receta Médica'
        verbose_name_plural = 'Recetas Médicas'

    def __str__(self):
        return f"{self.medicamento} ({self.dosis} x {self.duracion_dias}d) - Paciente: {self.ficha_clinica.mascota.nombre}"


class ExamenClinico(models.Model):
    """
    Exámenes de laboratorio e imagenología.
    """
    TIPO_CHOICES = [
        ('SANGRE', 'Hemograma y Perfil Bioquímico'),
        ('ORINA', 'Urianálisis / Sedimento'),
        ('RAYOS_X', 'Radiografía Digital'),
        ('ECOGRAFIA', 'Ecografía Abdominal'),
        ('COPROLOGICO', 'Examen Coproparasitario'),
        ('CITOLOGIA', 'Biopsia / Citología'),
        ('OTRO', 'Otro Examen'),
    ]

    ficha_clinica = models.ForeignKey(FichaClinica, on_delete=models.CASCADE, related_name='examenes', verbose_name='Ficha Médica')
    tipo_examen = models.CharField('Tipo de Examen', max_length=30, choices=TIPO_CHOICES, default='SANGRE')
    nombre_especifico = models.CharField('Nombre del Estudio', max_length=150)
    resultado = models.TextField('Interpretación / Resultados del Examen')
    fecha_examen = models.DateField('Fecha Realización', default=date.today)
    laboratorio = models.CharField('Laboratorio Clínico Responsable', max_length=100, default='Laboratorio PetCare Central')
    archivo_adjunto = models.CharField('Enlace de Informe Digital / PDF', max_length=500, blank=True)

    class Meta:
        verbose_name = 'Examen Clínico'
        verbose_name_plural = 'Exámenes Clínicos'

    def __str__(self):
        return f"{self.get_tipo_examen_display()} - {self.nombre_especifico} ({self.ficha_clinica.mascota.nombre})"


class VacunaRegistro(models.Model):
    """
    Carnet de Vacunación y Control Preventivo.
    """
    ESTADO_CHOICES = [
        ('AL_DIA', 'Al Día'),
        ('POR_VENCER', 'Próxima a Vencer (<15 días)'),
        ('VENCIDA', 'Vencida'),
    ]

    mascota = models.ForeignKey(Mascota, on_delete=models.CASCADE, related_name='vacunas', verbose_name='Paciente')
    veterinario = models.ForeignKey(Veterinario, on_delete=models.CASCADE, related_name='vacunas_administradas', verbose_name='Médico Responsable')
    nombre_vacuna = models.CharField('Vacuna / Inmunización', max_length=100)
    lote = models.CharField('Número de Lote', max_length=50)
    fecha_aplicacion = models.DateField('Fecha de Aplicación', default=date.today)
    fecha_proxima_dosis = models.DateField('Fecha de Próxima Dosis / Refuerzo')
    observaciones = models.CharField('Observaciones', max_length=200, blank=True)

    class Meta:
        verbose_name = 'Registro de Vacunación'
        verbose_name_plural = 'Registros de Vacunación'
        ordering = ['-fecha_aplicacion']

    def __str__(self):
        return f"Vacuna {self.nombre_vacuna} - {self.mascota.nombre} (Vence: {self.fecha_proxima_dosis})"

    @property
    def estado_actual(self):
        hoy = date.today()
        if self.fecha_proxima_dosis < hoy:
            return 'VENCIDA'
        elif self.fecha_proxima_dosis <= hoy + timedelta(days=15):
            return 'POR_VENCER'
        return 'AL_DIA'


class RecordatorioPreventivo(models.Model):
    """
    Módulo automatizado de recordatorios para vacunación, controles y antiparasitarios.
    """
    TIPO_CHOICES = [
        ('VACUNACION', 'Refuerzo de Vacuna'),
        ('DESPARASITACION', 'Desparasitación Interna / Externa'),
        ('CONTROL_MEDICO', 'Control Post-Operatorio / Evolución'),
        ('EXAMEN_RUTINA', 'Chequeo Preventivo Anual'),
    ]

    CANAL_CHOICES = [
        ('WHATSAPP', 'WhatsApp Notificación'),
        ('EMAIL', 'Correo Electrónico'),
        ('SMS', 'Mensaje SMS'),
    ]

    ESTADO_CHOICES = [
        ('PENDIENTE', 'Programado / Pendiente'),
        ('ENVIADO', 'Enviado con Éxito'),
        ('CANCELADO', 'Cancelado'),
    ]

    mascota = models.ForeignKey(Mascota, on_delete=models.CASCADE, related_name='recordatorios', verbose_name='Paciente')
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name='recordatorios', verbose_name='Tutor')
    tipo = models.CharField('Tipo de Recordatorio', max_length=30, choices=TIPO_CHOICES, default='VACUNACION')
    fecha_programada = models.DateField('Fecha Programada de Envío')
    mensaje = models.TextField('Mensaje de la Notificación')
    canal = models.CharField('Canal de Comunicación', max_length=20, choices=CANAL_CHOICES, default='WHATSAPP')
    estado = models.CharField('Estado', max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    fecha_envio_real = models.DateTimeField('Fecha y Hora Real de Despacho', null=True, blank=True)
    disparado_por = models.CharField('Origen del Envío', max_length=100, default='Módulo Inteligente PetCare Cron')

    class Meta:
        verbose_name = 'Recordatorio Preventivo'
        verbose_name_plural = 'Recordatorios Preventivos'
        ordering = ['fecha_programada', 'estado']

    def __str__(self):
        return f"Recordatorio {self.get_tipo_display()} -> {self.tutor.nombre_completo} ({self.mascota.nombre})"

    def disparar_envio(self):
        """Simula el despacho inmediato multicanal y actualiza estado"""
        self.estado = 'ENVIADO'
        self.fecha_envio_real = timezone.now()
        self.save()


class PagoServicio(models.Model):
    """
    Pasarela de Pagos Multicanal (Entornos de Prueba y Simulación Realista).
    Soporta Transbank Webpay Plus, Mercado Pago Sandbox, PayPal Sandbox y Cripto Testnet.
    """
    METODO_CHOICES = [
        ('TRANSBANK_WEBPAY', 'Transbank Webpay Plus (Redcompra / Crédito)'),
        ('MERCADO_PAGO', 'Mercado Pago (Checkout Sandbox / QR)'),
        ('PAYPAL_SANDBOX', 'PayPal (Sandbox Internacional)'),
        ('CRIPTO_TEST', 'CriptoPay Testnet (USDT / BTC Simulado)'),
        ('EFECTIVO', 'Efectivo en Caja'),
        ('TRANSFERENCIA', 'Transferencia Bancaria Directa'),
    ]

    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente de Pago'),
        ('APROBADO', 'Aprobado / Pagado'),
        ('RECHAZADO', 'Rechazado'),
        ('REEMBOLSADO', 'Reembolsado'),
    ]

    cita = models.ForeignKey(CitaMedica, on_delete=models.SET_NULL, null=True, blank=True, related_name='pagos', verbose_name='Cita Médica')
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name='pagos', verbose_name='Tutor')
    concepto = models.CharField('Concepto del Servicio', max_length=200, default='Consulta Veterinaria Especializada')
    monto_clp = models.IntegerField('Monto Total (CLP)')
    metodo_pago = models.CharField('Método / Pasarela de Pago', max_length=30, choices=METODO_CHOICES, default='TRANSBANK_WEBPAY')
    estado = models.CharField('Estado de Transacción', max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    transaccion_id = models.CharField('ID Transacción / Token', max_length=100, unique=True)
    codigo_autorizacion = models.CharField('Código de Autorización', max_length=50, blank=True)
    fecha_pago = models.DateTimeField('Fecha y Hora del Pago', default=timezone.now)
    tarjeta_ultimos_digitos = models.CharField('Últimos 4 dígitos tarjeta', max_length=4, blank=True, default='6623')
    tipo_cuotas = models.CharField('Modalidad Cuotas', max_length=50, blank=True, default='Sin Cuotas (VN)')
    voucher_data = models.TextField('Detalles Voucher / Payload Pasarela', blank=True)

    class Meta:
        verbose_name = 'Pago y Facturación'
        verbose_name_plural = 'Pagos y Facturación'
        ordering = ['-fecha_pago']

    def __str__(self):
        return f"Pago #{self.id} [{self.get_metodo_pago_display()}]: ${self.monto_clp:,} CLP - {self.get_estado_display()}"
