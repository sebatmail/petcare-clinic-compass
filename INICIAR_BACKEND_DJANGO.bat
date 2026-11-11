@echo off
title PetCare - Backend Django API & Admin
color 0A
echo =========================================================
echo   PETCARE CLINIC COMPASS - BACKEND DJANGO REST & ADMIN
echo   Estudiante: Sebastian Torres
echo   Docente: Marcelo Alvarado
echo =========================================================
echo.
cd /d "%~dp0backend"

where python >nul 2>&1
if %errorlevel% equ 0 (
    echo Iniciando Django Server con python en http://localhost:8000 ...
    python manage.py runserver 8000
) else (
    where py >nul 2>&1
    if %errorlevel% equ 0 (
        echo Iniciando Django Server con py launcher en http://localhost:8000 ...
        py manage.py runserver 8000
    ) else (
        echo Usando Python WindowsApps...
        "C:\Program Files\WindowsApps\PythonSoftwareFoundation.Python.3.13_3.13.3824.0_x64__qbz5n2kfra8p0\python3.13.exe" manage.py runserver 8000
    )
)

pause
