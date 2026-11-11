@echo off
title PetCare - Sistema Completo Fullstack
color 0E
echo =========================================================
echo   PETCARE CLINIC COMPASS - SISTEMA COMPLETO FULLSTACK
echo   Estudiante: Sebastian Torres
echo   Docente: Marcelo Alvarado
echo =========================================================
echo.
echo 1. Iniciando Backend Django (Admin & API REST) en http://localhost:8000 ...
start "PetCare - Backend Django" "%~dp0INICIAR_BACKEND_DJANGO.bat"

echo 2. Iniciando Frontend React (TanStack Start) en http://localhost:3000 ...
start "PetCare - Frontend Web" "%~dp0INICIAR_FRONTEND.bat"

echo.
echo Servidores lanzados en ventanas independientes.
echo - Frontend: http://localhost:3000
echo - Django Admin: http://localhost:8000/admin/
echo - Django REST API: http://localhost:8000/api/
echo.
pause
