"""
URL configuration for petcare_project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Personalización del Administrador de Django (Criterio 2 de la Rúbrica)
admin.site.site_header = 'PetCare Clínica Veterinaria • Panel Maestro'
admin.site.site_title = 'PetCare Admin'
admin.site.index_title = 'Administración Integral de Fichas Médicas, Citas y Facturación'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('petcare_app.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
