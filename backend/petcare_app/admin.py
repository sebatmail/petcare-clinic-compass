from django.contrib import admin
from django.utils.html import format_html, mark_safe
from .models import (
    Tutor, Mascota, Veterinario, CitaMedica,
    FichaClinica, RecetaMedica, ExamenClinico,
    VacunaRegistro, RecordatorioPreventivo, PagoServicio
)

# Inlines para vista anidada optimizada
class MascotaInline(admin.TabularInline):
    model = Mascota
    extra = 1
    fields = ('nombre', 'especie', 'raza', 'sexo', 'fecha_nacimiento', 'peso_actual_kg', 'activo')
    show_change_link = True

class RecetaMedicaInline(admin.StackedInline):
    model = RecetaMedica
    extra = 1
    fields = (('medicamento', 'principio_activo'), ('dosis', 'via_administracion', 'duracion_dias'), 'instrucciones')

class ExamenClinicoInline(admin.TabularInline):
    model = ExamenClinico
    extra = 1
    fields = ('tipo_examen', 'nombre_especifico', 'fecha_examen', 'laboratorio', 'resultado')

class VacunaRegistroInline(admin.TabularInline):
    model = VacunaRegistro
    extra = 1
    fields = ('nombre_vacuna', 'lote', 'fecha_aplicacion', 'fecha_proxima_dosis', 'veterinario')

class CitaMedicaInline(admin.TabularInline):
    model = CitaMedica
    extra = 0
    fields = ('fecha_hora', 'veterinario', 'motivo', 'estado', 'costo_estimado')
    readonly_fields = ('fecha_hora', 'veterinario', 'motivo', 'estado')
    can_delete = False
    show_change_link = True


@admin.register(Tutor)
class TutorAdmin(admin.ModelAdmin):
    list_display = ('id', 'avatar_preview', 'rut', 'nombre_completo', 'email', 'telefono', 'comuna', 'total_mascotas_badge', 'activo')
    list_filter = ('activo', 'comuna', 'fecha_registro')
    search_fields = ('rut', 'nombre_completo', 'email', 'telefono')
    list_per_page = 20
    inlines = [MascotaInline]
    fieldsets = (
        ('Identificación y Contacto', {
            'fields': (('rut', 'nombre_completo'), ('email', 'telefono'), ('direccion', 'comuna'), 'foto')
        }),
        ('Cuenta y Acceso al Portal', {
            'fields': ('user', 'activo')
        }),
    )

    def avatar_preview(self, obj):
        foto = obj.foto or '/static/images/avatars/tutor_default.png'
        return format_html('<img src="{}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid #0d9488;" />', foto)
    avatar_preview.short_description = 'Avatar'

    def total_mascotas_badge(self, obj):
        count = obj.total_mascotas
        return format_html('<span style="background:#0d9488; color:white; padding:3px 8px; border-radius:12px; font-weight:bold;">{}</span>', count)
    total_mascotas_badge.short_description = 'Mascotas'


@admin.register(Mascota)
class MascotaAdmin(admin.ModelAdmin):
    list_display = ('id', 'pet_preview', 'nombre', 'especie_badge', 'raza', 'sexo', 'edad_calculada', 'peso_kg_display', 'tutor_link', 'chip_display', 'activo')
    list_filter = ('especie', 'sexo', 'activo')
    search_fields = ('nombre', 'numero_chip', 'tutor__nombre_completo', 'tutor__rut')
    inlines = [VacunaRegistroInline, CitaMedicaInline]
    list_per_page = 20

    def pet_preview(self, obj):
        foto = obj.foto or '/static/images/pets/pet_default.png'
        return format_html('<img src="{}" style="width:36px; height:36px; border-radius:8px; object-fit:cover; border:1px solid #cbd5e1;" />', foto)
    pet_preview.short_description = 'Foto'

    def especie_badge(self, obj):
        colors = {
            'CANINO': '#2563eb',
            'FELINO': '#7c3aed',
            'AVE': '#059669',
            'ROEDOR': '#d97706',
            'EXOTICO': '#dc2626',
        }
        color = colors.get(obj.especie, '#475569')
        return format_html('<span style="background:{}; color:white; padding:3px 8px; border-radius:6px; font-size:11px;">{}</span>', color, obj.get_especie_display())
    especie_badge.short_description = 'Especie'

    def tutor_link(self, obj):
        return format_html('<b>{}</b><br><small style="color:#64748b;">RUT: {}</small>', obj.tutor.nombre_completo, obj.tutor.rut)
    tutor_link.short_description = 'Tutor'

    def peso_kg_display(self, obj):
        return f"{obj.peso_actual_kg} Kg"
    peso_kg_display.short_description = 'Peso'

    def chip_display(self, obj):
        return obj.numero_chip or mark_safe('<i style="color:#94a3b8;">Sin Chip</i>')
    chip_display.short_description = 'N° Microchip'


@admin.register(Veterinario)
class VeterinarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre_completo', 'especialidad_display', 'numero_colegiado', 'telefono', 'email', 'activo')
    list_filter = ('especialidad', 'activo')
    search_fields = ('nombre_completo', 'rut', 'numero_colegiado')

    def especialidad_display(self, obj):
        return format_html('<span style="background:#0f766e; color:white; padding:3px 8px; border-radius:6px; font-size:11px;">{}</span>', obj.get_especialidad_display())
    especialidad_display.short_description = 'Especialidad'


@admin.register(CitaMedica)
class CitaMedicaAdmin(admin.ModelAdmin):
    list_display = ('id', 'fecha_hora', 'mascota_display', 'veterinario', 'motivo', 'duracion_minutos', 'estado_badge', 'costo_formateado')
    list_filter = ('estado', 'veterinario', 'fecha_hora')
    search_fields = ('mascota__nombre', 'mascota__tutor__nombre_completo', 'motivo')
    date_hierarchy = 'fecha_hora'
    list_per_page = 20

    def mascota_display(self, obj):
        return format_html('<b>{}</b> ({})<br><small style="color:#64748b;">Tutor: {}</small>', obj.mascota.nombre, obj.mascota.get_especie_display(), obj.mascota.tutor.nombre_completo)
    mascota_display.short_description = 'Paciente'

    def estado_badge(self, obj):
        colores = {
            'PROGRAMADA': '#2563eb',
            'CONFIRMADA': '#0284c7',
            'EN_ESPERA': '#f59e0b',
            'EN_ATENCION': '#7c3aed',
            'COMPLETADA': '#10b981',
            'CANCELADA': '#ef4444',
        }
        c = colores.get(obj.estado, '#64748b')
        return format_html('<span style="background:{}; color:white; padding:4px 10px; border-radius:12px; font-weight:bold; font-size:11px;">{}</span>', c, obj.get_estado_display())
    estado_badge.short_description = 'Estado Cita'

    def costo_formateado(self, obj):
        return f"${obj.costo_estimado:,} CLP"
    costo_formateado.short_description = 'Costo'


@admin.register(FichaClinica)
class FichaClinicaAdmin(admin.ModelAdmin):
    list_display = ('id', 'fecha_atencion', 'mascota_display', 'veterinario', 'diagnostico_principal', 'constantes_display', 'recetas_count')
    list_filter = ('veterinario', 'fecha_atencion')
    search_fields = ('mascota__nombre', 'diagnostico_principal', 'anamnesis')
    date_hierarchy = 'fecha_atencion'
    inlines = [RecetaMedicaInline, ExamenClinicoInline]

    def mascota_display(self, obj):
        return format_html('<b>{}</b> ({})', obj.mascota.nombre, obj.mascota.get_especie_display())
    mascota_display.short_description = 'Paciente'

    def constantes_display(self, obj):
        return format_html('<small>T: <b>{}°C</b> | FC: <b>{} lpm</b> | Peso: <b>{} kg</b></small>', obj.temperatura_c, obj.frecuencia_cardiaca_lpm, obj.peso_kg)
    constantes_display.short_description = 'Triaje / Constantes'

    def recetas_count(self, obj):
        count = obj.recetas.count()
        return format_html('<span style="background:#4338ca; color:white; padding:2px 8px; border-radius:10px;">{} receta(s)</span>', count)
    recetas_count.short_description = 'Recetas'


@admin.register(VacunaRegistro)
class VacunaRegistroAdmin(admin.ModelAdmin):
    list_display = ('id', 'mascota', 'nombre_vacuna', 'lote', 'fecha_aplicacion', 'fecha_proxima_dosis', 'estado_badge', 'veterinario')
    list_filter = ('nombre_vacuna', 'fecha_proxima_dosis')
    search_fields = ('mascota__nombre', 'nombre_vacuna', 'lote')

    def estado_badge(self, obj):
        st = obj.estado_actual
        if st == 'AL_DIA':
            return format_html('<span style="background:#10b981; color:white; padding:3px 8px; border-radius:10px; font-weight:bold;">AL DÍA</span>')
        elif st == 'POR_VENCER':
            return format_html('<span style="background:#f59e0b; color:white; padding:3px 8px; border-radius:10px; font-weight:bold;">POR VENCER</span>')
        return format_html('<span style="background:#ef4444; color:white; padding:3px 8px; border-radius:10px; font-weight:bold;">VENCIDA</span>')
    estado_badge.short_description = 'Estado Semáforo'


@admin.register(RecordatorioPreventivo)
class RecordatorioPreventivoAdmin(admin.ModelAdmin):
    list_display = ('id', 'fecha_programada', 'tutor', 'mascota', 'tipo_display', 'canal_badge', 'estado_badge', 'disparado_por')
    list_filter = ('estado', 'tipo', 'canal', 'fecha_programada')
    search_fields = ('tutor__nombre_completo', 'mascota__nombre', 'mensaje')
    actions = ['enviar_recordatorios_inmediatos']

    def tipo_display(self, obj):
        return obj.get_tipo_display()
    tipo_display.short_description = 'Tipo Recordatorio'

    def canal_badge(self, obj):
        icon = '📱' if obj.canal == 'WHATSAPP' else ('✉️' if obj.canal == 'EMAIL' else '💬')
        return f"{icon} {obj.get_canal_display()}"
    canal_badge.short_description = 'Canal'

    def estado_badge(self, obj):
        colores = {'PENDIENTE': '#f59e0b', 'ENVIADO': '#10b981', 'CANCELADO': '#ef4444'}
        c = colores.get(obj.estado, '#64748b')
        return format_html('<span style="background:{}; color:white; padding:3px 8px; border-radius:10px; font-weight:bold;">{}</span>', c, obj.get_estado_display())
    estado_badge.short_description = 'Estado'

    @admin.action(description="Disparar recordatorios seleccionados inmediatamente")
    def enviar_recordatorios_inmediatos(self, request, queryset):
        for rec in queryset:
            rec.disparar_envio()
        self.message_user(request, f"{queryset.count()} recordatorio(s) despachado(s) exitosamente.")


@admin.register(PagoServicio)
class PagoServicioAdmin(admin.ModelAdmin):
    list_display = ('id', 'fecha_pago', 'tutor', 'concepto', 'monto_clp_display', 'metodo_badge', 'estado_badge', 'transaccion_id')
    list_filter = ('metodo_pago', 'estado', 'fecha_pago')
    search_fields = ('transaccion_id', 'codigo_autorizacion', 'tutor__nombre_completo')
    date_hierarchy = 'fecha_pago'

    def monto_clp_display(self, obj):
        return f"${obj.monto_clp:,} CLP"
    monto_clp_display.short_description = 'Monto'

    def metodo_badge(self, obj):
        return format_html('<span style="background:#0f172a; color:#38bdf8; padding:3px 8px; border-radius:6px; font-weight:bold; font-size:11px;">{}</span>', obj.get_metodo_pago_display())
    metodo_badge.short_description = 'Pasarela'

    def estado_badge(self, obj):
        colores = {'APROBADO': '#10b981', 'PENDIENTE': '#f59e0b', 'RECHAZADO': '#ef4444', 'REEMBOLSADO': '#64748b'}
        c = colores.get(obj.estado, '#64748b')
        return format_html('<span style="background:{}; color:white; padding:3px 8px; border-radius:10px; font-weight:bold;">{}</span>', c, obj.get_estado_display())
    estado_badge.short_description = 'Estado'
