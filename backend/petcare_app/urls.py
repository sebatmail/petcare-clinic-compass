from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tutores', views.TutorViewSet, basename='api-tutor')
router.register(r'mascotas', views.MascotaViewSet, basename='api-mascota')
router.register(r'veterinarios', views.VeterinarioViewSet, basename='api-veterinario')
router.register(r'citas', views.CitaMedicaViewSet, basename='api-cita')
router.register(r'fichas', views.FichaClinicaViewSet, basename='api-ficha')
router.register(r'vacunas', views.VacunaRegistroViewSet, basename='api-vacuna')
router.register(r'recordatorios', views.RecordatorioPreventivoViewSet, basename='api-recordatorio')
router.register(r'pagos', views.PagoServicioViewSet, basename='api-pago')

urlpatterns = [
    # API RESTful DRF
    path('api/', include(router.urls)),

    # Vistas Web y Dashboard con Panel Lateral
    path('', views.dashboard_view, name='home'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('tutores/', views.tutores_view, name='tutores'),
    path('mascotas/', views.mascotas_view, name='mascotas'),
    path('citas/', views.citas_calendario_view, name='citas'),
    path('fichas/', views.fichas_clinicas_view, name='fichas'),
    path('fichas/<int:pk>/imprimir/', views.ficha_detalle_imprimible, name='ficha_imprimible'),
    path('vacunacion/', views.vacunacion_view, name='vacunacion'),
    path('pagos/', views.pagos_sandbox_view, name='pagos'),
    path('pagos/<int:pk>/voucher/', views.voucher_pago_detalle, name='voucher_pago'),
    path('asistente-ia/', views.asistente_ia_view, name='asistente_ia'),

    # Autenticación y Sesiones
    path('login/', views.login_usuario, name='login'),
    path('logout/', views.logout_usuario, name='logout'),
]
