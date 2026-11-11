from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from django.http import JsonResponse, HttpResponse
from django.db.models import Count, Sum, Q
from datetime import datetime, date, timedelta
import uuid
import json

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Tutor, Mascota, Veterinario, CitaMedica,
    FichaClinica, RecetaMedica, ExamenClinico,
    VacunaRegistro, RecordatorioPreventivo, PagoServicio
)
from .serializers import (
    TutorSerializer, MascotaSerializer, VeterinarioSerializer,
    CitaMedicaSerializer, FichaClinicaSerializer, RecetaMedicaSerializer,
    ExamenClinicoSerializer, VacunaRegistroSerializer,
    RecordatorioPreventivoSerializer, PagoServicioSerializer
)

# ==============================================================================
# VIEWSETS PARA DJANGO REST FRAMEWORK (DRF)
# ==============================================================================

class TutorViewSet(viewsets.ModelViewSet):
    queryset = Tutor.objects.all()
    serializer_class = TutorSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        query = self.request.query_params.get('search', None)
        if query:
            qs = qs.filter(Q(nombre_completo__icontains=query) | Q(rut__icontains=query) | Q(email__icontains=query))
        return qs


class MascotaViewSet(viewsets.ModelViewSet):
    queryset = Mascota.objects.all()
    serializer_class = MascotaSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        especie = self.request.query_params.get('especie', None)
        tutor_id = self.request.query_params.get('tutor', None)
        if especie:
            qs = qs.filter(especie=especie)
        if tutor_id:
            qs = qs.filter(tutor_id=tutor_id)
        return qs


class VeterinarioViewSet(viewsets.ModelViewSet):
    queryset = Veterinario.objects.all()
    serializer_class = VeterinarioSerializer
    permission_classes = [permissions.AllowAny]


class CitaMedicaViewSet(viewsets.ModelViewSet):
    queryset = CitaMedica.objects.all()
    serializer_class = CitaMedicaSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'])
    def verificar_disponibilidad(self, request):
        """
        API endpoint para verificar si un veterinario tiene conflicto horario antes de agendar.
        """
        vet_id = request.query_params.get('veterinario_id')
        fecha_hora_str = request.query_params.get('fecha_hora')
        duracion = int(request.query_params.get('duracion', 30))

        if not vet_id or not fecha_hora_str:
            return Response({"error": "veterinario_id y fecha_hora son requeridos"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            clean_str = fecha_hora_str.strip().replace(' ', '+').replace('Z', '+00:00')
            inicio = datetime.fromisoformat(clean_str)
        except Exception as e:
            return Response({"error": f"Formato de fecha_hora inválido: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        fin = inicio + timedelta(minutes=duracion)

        citas = CitaMedica.objects.filter(
            veterinario_id=vet_id,
            estado__in=['PROGRAMADA', 'CONFIRMADA', 'EN_ESPERA', 'EN_ATENCION']
        )
        conflicto = False
        cita_conflicto = None

        for c in citas:
            c_inicio = c.fecha_hora
            c_fin = c.fecha_hora + timedelta(minutes=c.duracion_minutos)
            if inicio < c_fin and fin > c_inicio:
                conflicto = True
                cita_conflicto = {
                    "id": c.id,
                    "paciente": c.mascota.nombre,
                    "motivo": c.motivo,
                    "rango": f"{c_inicio.strftime('%H:%M')} - {c_fin.strftime('%H:%M')}"
                }
                break

        return Response({
            "disponible": not conflicto,
            "conflicto_detectado": conflicto,
            "detalle_conflicto": cita_conflicto
        })

    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        cita = self.get_object()
        nuevo_estado = request.data.get('estado')
        if nuevo_estado in dict(CitaMedica.ESTADO_CHOICES):
            cita.estado = nuevo_estado
            cita.save()
            return Response({"status": "Estado actualizado", "estado": cita.get_estado_display()})
        return Response({"error": "Estado inválido"}, status=status.HTTP_400_BAD_REQUEST)


class FichaClinicaViewSet(viewsets.ModelViewSet):
    queryset = FichaClinica.objects.all()
    serializer_class = FichaClinicaSerializer
    permission_classes = [permissions.AllowAny]


class VacunaRegistroViewSet(viewsets.ModelViewSet):
    queryset = VacunaRegistro.objects.all()
    serializer_class = VacunaRegistroSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'])
    def alertas_vencimiento(self, request):
        hoy = date.today()
        limite = hoy + timedelta(days=15)
        vencidas = VacunaRegistro.objects.filter(fecha_proxima_dosis__lt=hoy)
        por_vencer = VacunaRegistro.objects.filter(fecha_proxima_dosis__gte=hoy, fecha_proxima_dosis__lte=limite)
        return Response({
            "total_vencidas": vencidas.count(),
            "total_por_vencer": por_vencer.count(),
            "vencidas": VacunaRegistroSerializer(vencidas, many=True).data,
            "por_vencer": VacunaRegistroSerializer(por_vencer, many=True).data
        })


class RecordatorioPreventivoViewSet(viewsets.ModelViewSet):
    queryset = RecordatorioPreventivo.objects.all()
    serializer_class = RecordatorioPreventivoSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=True, methods=['post'])
    def disparar(self, request, pk=None):
        recordatorio = self.get_object()
        recordatorio.disparar_envio()
        return Response({
            "status": "Recordatorio disparado exitosamente",
            "canal": recordatorio.get_canal_display(),
            "fecha_envio": recordatorio.fecha_envio_real
        })


class PagoServicioViewSet(viewsets.ModelViewSet):
    queryset = PagoServicio.objects.all()
    serializer_class = PagoServicioSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def simular_pago_pasarela(self, request):
        """
        Simula una transacción real con Transbank Webpay, Mercado Pago, PayPal o Cripto.
        """
        metodo = request.data.get('metodo_pago', 'TRANSBANK_WEBPAY')
        monto = int(request.data.get('monto_clp', 25000))
        tutor_id = request.data.get('tutor_id')
        cita_id = request.data.get('cita_id')
        concepto = request.data.get('concepto', 'Atención Médica Veterinaria')

        tutor = get_object_or_404(Tutor, pk=tutor_id)
        cita = CitaMedica.objects.filter(pk=cita_id).first() if cita_id else None

        auth_code = str(uuid.uuid4())[:6].upper()
        trans_id = f"PAY-{datetime.now().strftime('%Y%m%d%H%M%S')}-{auth_code}"

        voucher_payload = {
            "gateway": metodo,
            "commerce_code": "597055555532" if "TRANSBANK" in metodo else "MP-SANDBOX-101",
            "amount": monto,
            "currency": "CLP",
            "authorization_code": auth_code,
            "transaction_date": timezone.now().isoformat(),
            "status": "AUTHORIZED",
            "card_detail": {
                "card_number": "XXXX-XXXX-XXXX-6623",
                "brand": "VISA Redcompra Débito" if "TRANSBANK" in metodo else "Mercado Pago Card"
            }
        }

        pago = PagoServicio.objects.create(
            tutor=tutor,
            cita=cita,
            concepto=concepto,
            monto_clp=monto,
            metodo_pago=metodo,
            estado='APROBADO',
            transaccion_id=trans_id,
            codigo_autorizacion=auth_code,
            tarjeta_ultimos_digitos='6623',
            voucher_data=json.dumps(voucher_payload)
        )

        if cita:
            cita.estado = 'COMPLETADA'
            cita.save()

        return Response({
            "success": True,
            "pago_id": pago.id,
            "transaccion_id": trans_id,
            "codigo_autorizacion": auth_code,
            "monto": monto,
            "metodo": pago.get_metodo_pago_display(),
            "estado": pago.get_estado_display(),
            "voucher": voucher_payload
        })


# ==============================================================================
# VISTAS FULLSTACK CON PANEL LATERAL (SIDEBAR) & TEMPLATES
# ==============================================================================

def dashboard_view(request):
    """
    Vista principal del Dashboard Ejecutivo PetCare.
    """
    hoy = date.today()
    inicio_mes = hoy.replace(day=1)

    # Métricas clave
    citas_hoy = CitaMedica.objects.filter(fecha_hora__date=hoy)
    total_mascotas = Mascota.objects.filter(activo=True).count()
    total_tutores = Tutor.objects.filter(activo=True).count()
    
    # Vacunas
    vacunas_vencidas = VacunaRegistro.objects.filter(fecha_proxima_dosis__lt=hoy).count()
    vacunas_por_vencer = VacunaRegistro.objects.filter(
        fecha_proxima_dosis__gte=hoy,
        fecha_proxima_dosis__lte=hoy + timedelta(days=15)
    ).count()

    # Facturación del mes
    ingresos_mes = PagoServicio.objects.filter(
        estado='APROBADO',
        fecha_pago__gte=inicio_mes
    ).aggregate(total=Sum('monto_clp'))['total'] or 0

    # Próximas citas y atenciones recientes
    proximas_citas = CitaMedica.objects.filter(fecha_hora__gte=timezone.now()).order_by('fecha_hora')[:6]
    fichas_recientes = FichaClinica.objects.select_related('mascota', 'veterinario').order_by('-fecha_atencion')[:5]

    # Distribución por especies para gráfico
    especies_chart = Mascota.objects.values('especie').annotate(count=Count('id')).order_by('-count')

    context = {
        'citas_hoy_count': citas_hoy.count(),
        'citas_hoy': citas_hoy,
        'total_mascotas': total_mascotas,
        'total_tutores': total_tutores,
        'vacunas_alertas': vacunas_vencidas + vacunas_por_vencer,
        'vacunas_vencidas': vacunas_vencidas,
        'vacunas_por_vencer': vacunas_por_vencer,
        'ingresos_mes': ingresos_mes,
        'proximas_citas': proximas_citas,
        'fichas_recientes': fichas_recientes,
        'especies_chart': json.dumps(list(especies_chart)),
        'active_menu': 'dashboard'
    }
    return render(request, 'petcare/dashboard.html', context)


def tutores_view(request):
    """Gestión y listado de Tutores con modal de creación"""
    query = request.GET.get('q', '')
    if query:
        tutores = Tutor.objects.filter(
            Q(nombre_completo__icontains=query) | Q(rut__icontains=query) | Q(telefono__icontains=query)
        )
    else:
        tutores = Tutor.objects.all().order_by('nombre_completo')

    if request.method == 'POST':
        rut = request.POST.get('rut', '').strip()
        nombre = request.POST.get('nombre_completo', '').strip()
        email = request.POST.get('email', '').strip()
        telefono = request.POST.get('telefono', '').strip()
        direccion = request.POST.get('direccion', '').strip()
        comuna = request.POST.get('comuna', 'Santiago')
        foto = request.POST.get('foto', '/static/images/avatars/tutor_default.png')

        try:
            tutor = Tutor(
                rut=rut,
                nombre_completo=nombre,
                email=email,
                telefono=telefono,
                direccion=direccion,
                comuna=comuna,
                foto=foto
            )
            tutor.full_clean()
            tutor.save()
            messages.success(request, f"Tutor {nombre} registrado exitosamente.")
            return redirect('tutores')
        except Exception as e:
            messages.error(request, f"Error al registrar tutor: {e}")

    context = {
        'tutores': tutores,
        'query': query,
        'active_menu': 'tutores'
    }
    return render(request, 'petcare/tutores.html', context)


def mascotas_view(request):
    """Gestión y catálogo de Mascotas Pacientes"""
    query = request.GET.get('q', '')
    filtro_especie = request.GET.get('especie', '')

    mascotas = Mascota.objects.select_related('tutor').all()
    if query:
        mascotas = mascotas.filter(Q(nombre__icontains=query) | Q(tutor__nombre_completo__icontains=query) | Q(numero_chip__icontains=query))
    if filtro_especie:
        mascotas = mascotas.filter(especie=filtro_especie)

    tutores = Tutor.objects.filter(activo=True).order_by('nombre_completo')

    if request.method == 'POST':
        tutor_id = request.POST.get('tutor_id')
        nombre = request.POST.get('nombre')
        especie = request.POST.get('especie')
        raza = request.POST.get('raza', 'Mestizo')
        sexo = request.POST.get('sexo', 'MACHO')
        fecha_nacimiento = request.POST.get('fecha_nacimiento')
        peso = request.POST.get('peso_actual_kg', 5.0)
        chip = request.POST.get('numero_chip') or None
        foto = request.POST.get('foto', '/static/images/pets/pet_default.png')

        try:
            tutor = get_object_or_404(Tutor, pk=tutor_id)
            mascota = Mascota(
                tutor=tutor,
                nombre=nombre,
                especie=especie,
                raza=raza,
                sexo=sexo,
                fecha_nacimiento=fecha_nacimiento,
                peso_actual_kg=peso,
                numero_chip=chip,
                foto=foto
            )
            mascota.full_clean()
            mascota.save()
            messages.success(request, f"Paciente {nombre} ingresado correctamente.")
            return redirect('mascotas')
        except Exception as e:
            messages.error(request, f"Error al ingresar mascota: {e}")

    context = {
        'mascotas': mascotas,
        'tutores': tutores,
        'filtro_especie': filtro_especie,
        'active_menu': 'mascotas'
    }
    return render(request, 'petcare/mascotas.html', context)


def citas_calendario_view(request):
    """
    Calendario Dinámico con Detección y Prevención de Solapamientos
    """
    citas = CitaMedica.objects.select_related('mascota', 'veterinario', 'mascota__tutor').all().order_by('-fecha_hora')
    veterinarios = Veterinario.objects.filter(activo=True)
    mascotas = Mascota.objects.filter(activo=True).select_related('tutor')

    if request.method == 'POST':
        mascota_id = request.POST.get('mascota_id')
        vet_id = request.POST.get('veterinario_id')
        fecha_hora_raw = request.POST.get('fecha_hora')
        duracion = int(request.POST.get('duracion_minutos', 30))
        motivo = request.POST.get('motivo')
        costo = int(request.POST.get('costo_estimado', 25000))
        notas = request.POST.get('notas', '')

        try:
            mascota = get_object_or_404(Mascota, pk=mascota_id)
            vet = get_object_or_404(Veterinario, pk=vet_id)
            fecha_hora = datetime.strptime(fecha_hora_raw, '%Y-%m-%dT%H:%M')
            fecha_hora = timezone.make_aware(fecha_hora, timezone.get_current_timezone())

            cita = CitaMedica(
                mascota=mascota,
                veterinario=vet,
                fecha_hora=fecha_hora,
                duracion_minutos=duracion,
                motivo=motivo,
                costo_estimado=costo,
                notas=notas,
                estado='PROGRAMADA'
            )
            cita.full_clean() # Ejecuta clean() para evitar solapamiento
            cita.save()
            messages.success(request, f"Cita programada con éxito para {mascota.nombre} con Dr(a). {vet.nombre_completo}.")
            return redirect('citas')
        except Exception as e:
            messages.error(request, f"Conflicto de Horario o Error: {e}")

    # Eventos formateados para visualizador de agenda
    eventos_json = []
    for c in citas:
        fin = c.fecha_hora + timedelta(minutes=c.duracion_minutos)
        eventos_json.append({
            'id': c.id,
            'title': f"{c.mascota.nombre} ({c.motivo})",
            'start': c.fecha_hora.isoformat(),
            'end': fin.isoformat(),
            'veterinario': c.veterinario.nombre_completo,
            'estado': c.estado,
            'color': '#0d9488' if c.estado == 'COMPLETADA' else ('#f59e0b' if c.estado == 'EN_ESPERA' else '#2563eb')
        })

    context = {
        'citas': citas,
        'veterinarios': veterinarios,
        'mascotas': mascotas,
        'eventos_json': json.dumps(eventos_json),
        'active_menu': 'citas'
    }
    return render(request, 'petcare/citas.html', context)


def fichas_clinicas_view(request):
    """
    Fichas Clínicas Digitales, Exámenes y Recetas Médicas
    """
    fichas = FichaClinica.objects.select_related('mascota', 'veterinario', 'mascota__tutor').prefetch_related('recetas', 'examenes').all()
    mascotas = Mascota.objects.filter(activo=True)
    veterinarios = Veterinario.objects.filter(activo=True)

    if request.method == 'POST':
        mascota_id = request.POST.get('mascota_id')
        vet_id = request.POST.get('veterinario_id')
        temperatura = request.POST.get('temperatura_c', 38.5)
        fc = request.POST.get('frecuencia_cardiaca_lpm', 120)
        fr = request.POST.get('frecuencia_respiratoria_rpm', 25)
        peso = request.POST.get('peso_kg', 5.0)
        anamnesis = request.POST.get('anamnesis')
        hallazgos = request.POST.get('hallazgos_examen_fisico')
        diagnostico = request.POST.get('diagnostico_principal')
        indicaciones = request.POST.get('indicaciones_generales')
        medicamento = request.POST.get('receta_medicamento', '')
        dosis = request.POST.get('receta_dosis', '')
        duracion = request.POST.get('receta_duracion', 7)

        try:
            mascota = get_object_or_404(Mascota, pk=mascota_id)
            vet = get_object_or_404(Veterinario, pk=vet_id)
            ficha = FichaClinica.objects.create(
                mascota=mascota,
                veterinario=vet,
                temperatura_c=temperatura,
                frecuencia_cardiaca_lpm=fc,
                frecuencia_respiratoria_rpm=fr,
                peso_kg=peso,
                anamnesis=anamnesis,
                hallazgos_examen_fisico=hallazgos,
                diagnostico_principal=diagnostico,
                indicaciones_generales=indicaciones
            )

            # Si se indicó medicamento, generar receta médica inmediata
            if medicamento:
                RecetaMedica.objects.create(
                    ficha_clinica=ficha,
                    medicamento=medicamento,
                    dosis=dosis,
                    duracion_dias=int(duracion or 7)
                )

            messages.success(request, f"Ficha Clínica #{ficha.id} creada para {mascota.nombre}.")
            return redirect('fichas')
        except Exception as e:
            messages.error(request, f"Error al emitir ficha clínica: {e}")

    context = {
        'fichas': fichas,
        'mascotas': mascotas,
        'veterinarios': veterinarios,
        'active_menu': 'fichas'
    }
    return render(request, 'petcare/fichas.html', context)


def ficha_detalle_imprimible(request, pk):
    """
    Vista de Ficha Clínica con diseño formal para impresión o descarga.
    """
    ficha = get_object_or_404(
        FichaClinica.objects.select_related('mascota', 'veterinario', 'mascota__tutor').prefetch_related('recetas', 'examenes'),
        pk=pk
    )
    return render(request, 'petcare/ficha_imprimible.html', {'ficha': ficha})


def vacunacion_view(request):
    """
    Módulo de Esquema de Vacunación y Disparo Automatizado de Recordatorios
    """
    hoy = date.today()
    vacunas = VacunaRegistro.objects.select_related('mascota', 'veterinario', 'mascota__tutor').all()
    recordatorios = RecordatorioPreventivo.objects.select_related('mascota', 'tutor').all().order_by('-fecha_programada')
    mascotas = Mascota.objects.filter(activo=True)
    veterinarios = Veterinario.objects.filter(activo=True)

    if request.method == 'POST':
        action = request.POST.get('action')
        
        if action == 'crear_vacuna':
            mascota_id = request.POST.get('mascota_id')
            vet_id = request.POST.get('veterinario_id')
            nombre_vacuna = request.POST.get('nombre_vacuna')
            lote = request.POST.get('lote', 'LT-2026')
            fecha_aplicacion = request.POST.get('fecha_aplicacion', str(hoy))
            fecha_proxima = request.POST.get('fecha_proxima_dosis')
            
            try:
                mascota = get_object_or_404(Mascota, pk=mascota_id)
                vet = get_object_or_404(Veterinario, pk=vet_id)
                VacunaRegistro.objects.create(
                    mascota=mascota,
                    veterinario=vet,
                    nombre_vacuna=nombre_vacuna,
                    lote=lote,
                    fecha_aplicacion=fecha_aplicacion,
                    fecha_proxima_dosis=fecha_proxima
                )
                
                # Crear recordatorio preventivo automático 7 días antes
                proxima_dt = datetime.strptime(fecha_proxima, '%Y-%m-%d').date()
                RecordatorioPreventivo.objects.create(
                    mascota=mascota,
                    tutor=mascota.tutor,
                    tipo='VACUNACION',
                    fecha_programada=proxima_dt - timedelta(days=7),
                    mensaje=f"Estimado(a) {mascota.tutor.nombre_completo}, le recordamos que la vacuna {nombre_vacuna} de su mascota {mascota.nombre} vence el {fecha_proxima}. Reserve su cita en PetCare.",
                    canal='WHATSAPP',
                    estado='PENDIENTE'
                )
                messages.success(request, f"Vacunación registrada y recordatorio preventivo programado.")
                return redirect('vacunacion')
            except Exception as e:
                messages.error(request, f"Error al registrar vacuna: {e}")

        elif action == 'disparar_recordatorio':
            rec_id = request.POST.get('recordatorio_id')
            rec = get_object_or_404(RecordatorioPreventivo, pk=rec_id)
            rec.disparar_envio()
            messages.success(request, f"Recordatorio enviado a {rec.tutor.nombre_completo} vía {rec.get_canal_display()} con éxito.")
            return redirect('vacunacion')

    context = {
        'vacunas': vacunas,
        'recordatorios': recordatorios,
        'mascotas': mascotas,
        'veterinarios': veterinarios,
        'hoy': hoy,
        'active_menu': 'vacunacion'
    }
    return render(request, 'petcare/vacunacion.html', context)


def pagos_sandbox_view(request):
    """
    Pasarela de Pagos Multicanal: Transbank Webpay, Mercado Pago, PayPal y Cripto Testnet
    """
    pagos = PagoServicio.objects.select_related('tutor', 'cita', 'cita__mascota').all().order_by('-fecha_pago')
    tutores = Tutor.objects.filter(activo=True)
    citas_pendientes = CitaMedica.objects.filter(estado__in=['PROGRAMADA', 'CONFIRMADA', 'EN_ATENCION'])

    if request.method == 'POST':
        tutor_id = request.POST.get('tutor_id')
        cita_id = request.POST.get('cita_id') or None
        concepto = request.POST.get('concepto', 'Atención Médica Veterinaria')
        monto = int(request.POST.get('monto_clp', 25000))
        metodo = request.POST.get('metodo_pago', 'TRANSBANK_WEBPAY')

        try:
            tutor = get_object_or_404(Tutor, pk=tutor_id)
            cita = CitaMedica.objects.filter(pk=cita_id).first() if cita_id else None
            auth_code = str(uuid.uuid4())[:6].upper()
            trans_id = f"TBK-{datetime.now().strftime('%Y%m%d%H%M%S')}-{auth_code}"

            pago = PagoServicio.objects.create(
                tutor=tutor,
                cita=cita,
                concepto=concepto,
                monto_clp=monto,
                metodo_pago=metodo,
                estado='APROBADO',
                transaccion_id=trans_id,
                codigo_autorizacion=auth_code,
                tarjeta_ultimos_digitos='6623' if 'TRANSBANK' in metodo else '9941',
                voucher_data=json.dumps({
                    "gateway": metodo,
                    "auth_code": auth_code,
                    "date": timezone.now().strftime('%d/%m/%Y %H:%M:%S'),
                    "amount_clp": monto,
                    "tutor": tutor.nombre_completo,
                    "concept": concepto
                })
            )
            if cita:
                cita.estado = 'COMPLETADA'
                cita.save()

            messages.success(request, f"¡Pago #{pago.id} Aprobado! Transacción {trans_id} autorizada por {pago.get_metodo_pago_display()}.")
            return redirect('pagos')
        except Exception as e:
            messages.error(request, f"Error al procesar el pago: {e}")

    total_recaudado = pagos.filter(estado='APROBADO').aggregate(total=Sum('monto_clp'))['total'] or 0

    context = {
        'pagos': pagos,
        'tutores': tutores,
        'citas_pendientes': citas_pendientes,
        'total_recaudado': total_recaudado,
        'active_menu': 'pagos'
    }
    return render(request, 'petcare/pagos.html', context)


def voucher_pago_detalle(request, pk):
    """Comprobante legal / Voucher electrónico de prueba"""
    pago = get_object_or_404(PagoServicio.objects.select_related('tutor', 'cita'), pk=pk)
    return render(request, 'petcare/voucher_detalle.html', {'pago': pago})


def asistente_ia_view(request):
    """
    Módulo Clínico de Inteligencia Artificial para Asistencia Veterinaria
    Calcula dosis por kg y sugiere diagnósticos preliminares basados en signos clínicos.
    """
    resultado = None
    if request.method == 'POST':
        especie = request.POST.get('especie', 'CANINO')
        peso_kg = float(request.POST.get('peso_kg', 10.0))
        sintomas = request.POST.get('sintomas', '').lower()

        # Motor de reglas y farmacocinética clínica
        dosis_sugeridas = [
            {
                'farmaco': 'Amoxicilina + Ácido Clavulánico',
                'indicacion': 'Infecciones bacterianas respiratorias, urinarias y dérmicas',
                'dosis_mg_kg': 15.0,
                'total_mg_dosis': round(15.0 * peso_kg, 1),
                'frecuencia': 'Cada 12 horas por vía oral con alimento (7 a 10 días)'
            },
            {
                'farmaco': 'Meloxicam (AINE Antiinflamatorio)',
                'indicacion': 'Dolor agudo / crónico articular o post-operatorio',
                'dosis_mg_kg': 0.1,
                'total_mg_dosis': round(0.1 * peso_kg, 2),
                'frecuencia': 'Cada 24 horas por vía oral con comida (máximo 5 días)'
            },
            {
                'farmaco': 'Omeprazol (Gastroprotector)',
                'indicacion': 'Protección de mucosa gástrica',
                'dosis_mg_kg': 1.0,
                'total_mg_dosis': round(1.0 * peso_kg, 1),
                'frecuencia': 'Cada 24 horas en ayunas (7 a 14 días)'
            }
        ]

        diagnosticos_diferenciales = []
        if 'vomito' in sintomas or 'vómito' in sintomas or 'diarrea' in sintomas:
            diagnosticos_diferenciales.append("Gastroenteritis aguda (posible origen dietario, parasitario o viral)")
            diagnosticos_diferenciales.append("Cuerpo extraño digestivo / Obstrucción intestinal parcial")
        if 'tos' in sintomas or 'respir' in sintomas:
            diagnosticos_diferenciales.append("Traqueobronquitis infecciosa (Tos de las perreras / Complejo respiratorio)")
            diagnosticos_diferenciales.append("Edema pulmonar cardiogénico / Neumonía")
        if 'rasca' in sintomas or 'piel' in sintomas or 'alopecia' in sintomas:
            diagnosticos_diferenciales.append("Dermatitis alérgica a la picadura de pulga (DAPP) o atópica")
            diagnosticos_diferenciales.append("Pioderma bacteriano superficial / Malassezia")
        if not diagnosticos_diferenciales:
            diagnosticos_diferenciales.append("Síndrome febril de origen indeterminado / Chequeo general requerido")

        resultado = {
            'especie': especie,
            'peso_kg': peso_kg,
            'sintomas': sintomas,
            'dosis': dosis_sugeridas,
            'diagnosticos': diagnosticos_diferenciales
        }

    return render(request, 'petcare/asistente_ia.html', {'resultado': resultado, 'active_menu': 'asistente_ia'})


def login_usuario(request):
    """Inicio de Sesión y Autenticación"""
    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        usr = request.POST.get('username')
        pwd = request.POST.get('password')
        user = authenticate(request, username=usr, password=pwd)
        if user:
            login(request, user)
            messages.success(request, f"Bienvenido(a) al sistema PetCare, {user.first_name or user.username}.")
            return redirect('dashboard')
        else:
            messages.error(request, "Credenciales incorrectas. Verifique usuario y contraseña.")

    return render(request, 'petcare/login.html')


def logout_usuario(request):
    """Cierre de Sesión"""
    logout(request)
    messages.info(request, "Ha cerrado sesión de forma segura.")
    return redirect('login')
