#!/bin/bash
# ==============================================================================
# SCRIPT DE APROVISIONAMIENTO Y DESPLIEGUE AUTOMATIZADO EN AWS EC2 (UBUNTU 22.04 LTS)
# Sistema: PetCare • Clínica Veterinaria Integral
# Estudiante: Sebastián Torres | Docente: Marcelo Alvarado
# ==============================================================================

set -e

echo "=== [1/6] Actualizando repositorios e instalando paquetes base ==="
sudo apt update && sudo apt upgrade -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    python3-pip python3-venv nginx git postgresql postgresql-contrib libpq-dev curl

echo "=== [2/6] Configurando Base de Datos PostgreSQL (Criterio 1 Rúbrica) ==="
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear Base de Datos y Usuario de PostgreSQL si no existen
sudo -u postgres psql -c "DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'petcare_user') THEN
        CREATE ROLE petcare_user WITH LOGIN PASSWORD 'petcare_pass_2026';
    END IF;
END
\$\$;"

sudo -u postgres psql -c "SELECT 'CREATE DATABASE petcare_db OWNER petcare_user' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'petcare_db')\gexec"

echo "=== [3/6] Preparando Entorno Virtual Python y Dependencias ==="
cd /home/ubuntu/petcare_project
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "=== [4/6] Configurando Variables de Entorno y Migraciones PostgreSQL ==="
export USE_POSTGRES=True
export DB_NAME=petcare_db
export DB_USER=petcare_user
export DB_PASSWORD=petcare_pass_2026
export DB_HOST=localhost
export DB_PORT=5432

python manage.py makemigrations petcare_app
python manage.py migrate
python manage.py collectstatic --noinput
python seed_data.py

echo "=== [5/6] Configurando Permisos, Grupos y Servicio Systemd Gunicorn ==="
sudo usermod -aG www-data ubuntu
sudo usermod -aG ubuntu www-data
sudo chmod 750 /home/ubuntu
sudo chmod 770 /home/ubuntu/petcare_project

sudo cp deploy/systemd/gunicorn.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn

echo "=== [6/6] Configurando Nginx Reverse Proxy ==="
sudo cp deploy/nginx/petcare.conf /etc/nginx/sites-available/petcare
sudo ln -sf /etc/nginx/sites-available/petcare /etc/nginx/sites-enabled/petcare
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Permisos para el socket Unix
if [ -S /home/ubuntu/petcare_project/petcare.sock ]; then
    sudo chown ubuntu:www-data /home/ubuntu/petcare_project/petcare.sock
    sudo chmod 660 /home/ubuntu/petcare_project/petcare.sock
fi

echo "=============================================================================="
echo "¡DESPLIEGUE COMPLETADO CON ÉXITO!"
echo "Servicio Nginx: $(systemctl is-active nginx)"
echo "Servicio Gunicorn: $(systemctl is-active gunicorn)"
echo "Base de Datos: PostgreSQL 14+ activa y migrada con seed_data.py"
echo "=============================================================================="
