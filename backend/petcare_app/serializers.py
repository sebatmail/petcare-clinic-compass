from rest_framework import serializers
from .models import (
    Tutor, Mascota, Veterinario, CitaMedica,
    FichaClinica, RecetaMedica, ExamenClinico,
    VacunaRegistro, RecordatorioPreventivo, PagoServicio
)
from datetime import timedelta

class RecetaMedicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecetaMedica
        fields = '__all__'

class ExamenClinicoSerializer(serializers.ModelSerializer):
    tipo_examen_nombre = serializers.CharField(source='get_tipo_examen_display', read_only=True)
    class Meta:
        model = ExamenClinico
        fields = '__all__'

class FichaClinicaSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.CharField(source='mascota.nombre', read_only=True)
    veterinario_nombre = serializers.CharField(source='veterinario.nombre_completo', read_only=True)
    recetas = RecetaMedicaSerializer(many=True, read_only=True)
    examenes = ExamenClinicoSerializer(many=True, read_only=True)

    class Meta:
        model = FichaClinica
        fields = '__all__'

class MascotaSerializer(serializers.ModelSerializer):
    tutor_nombre = serializers.CharField(source='tutor.nombre_completo', read_only=True)
    tutor_rut = serializers.CharField(source='tutor.rut', read_only=True)
    tutor_telefono = serializers.CharField(source='tutor.telefono', read_only=True)
    especie_nombre = serializers.CharField(source='get_especie_display', read_only=True)
    edad = serializers.CharField(source='edad_calculada', read_only=True)

    class Meta:
        model = Mascota
        fields = '__all__'

class TutorSerializer(serializers.ModelSerializer):
    mascotas = MascotaSerializer(many=True, read_only=True)
    total_mascotas = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tutor
        fields = '__all__'

class VeterinarioSerializer(serializers.ModelSerializer):
    especialidad_nombre = serializers.CharField(source='get_especialidad_display', read_only=True)

    class Meta:
        model = Veterinario
        fields = '__all__'

class CitaMedicaSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.CharField(source='mascota.nombre', read_only=True)
    tutor_nombre = serializers.CharField(source='mascota.tutor.nombre_completo', read_only=True)
    tutor_telefono = serializers.CharField(source='mascota.tutor.telefono', read_only=True)
    veterinario_nombre = serializers.CharField(source='veterinario.nombre_completo', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = CitaMedica
        fields = '__all__'

    def validate(self, data):
        """
        Validación de NO SOLAPAMIENTO en la API REST
        """
        fecha_hora = data.get('fecha_hora') or (self.instance.fecha_hora if self.instance else None)
        veterinario = data.get('veterinario') or (self.instance.veterinario if self.instance else None)
        duracion = data.get('duracion_minutos', 30)

        if fecha_hora and veterinario:
            inicio_nueva = fecha_hora
            fin_nueva = inicio_nueva + timedelta(minutes=duracion)

            qs = CitaMedica.objects.filter(
                veterinario=veterinario,
                estado__in=['PROGRAMADA', 'CONFIRMADA', 'EN_ESPERA', 'EN_ATENCION']
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)

            for c in qs:
                c_inicio = c.fecha_hora
                c_fin = c.fecha_hora + timedelta(minutes=c.duracion_minutos)
                if inicio_nueva < c_fin and fin_nueva > c_inicio:
                    raise serializers.ValidationError({
                        "fecha_hora": f"Solapamiento detectado: El Dr(a). {veterinario.nombre_completo} ya tiene agendada una cita de {c_inicio.strftime('%H:%M')} a {c_fin.strftime('%H:%M')} hrs."
                    })
        return data

class VacunaRegistroSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.CharField(source='mascota.nombre', read_only=True)
    veterinario_nombre = serializers.CharField(source='veterinario.nombre_completo', read_only=True)
    estado_calculado = serializers.CharField(source='estado_actual', read_only=True)

    class Meta:
        model = VacunaRegistro
        fields = '__all__'

class RecordatorioPreventivoSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.CharField(source='mascota.nombre', read_only=True)
    tutor_nombre = serializers.CharField(source='tutor.nombre_completo', read_only=True)
    tipo_nombre = serializers.CharField(source='get_tipo_display', read_only=True)
    canal_nombre = serializers.CharField(source='get_canal_display', read_only=True)

    class Meta:
        model = RecordatorioPreventivo
        fields = '__all__'

class PagoServicioSerializer(serializers.ModelSerializer):
    tutor_nombre = serializers.CharField(source='tutor.nombre_completo', read_only=True)
    metodo_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = PagoServicio
        fields = '__all__'
