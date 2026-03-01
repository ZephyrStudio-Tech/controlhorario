#!/bin/sh
set -e

# Ejecutar migraciones de base de datos
echo "Ejecutando migraciones de base de datos..."
alembic upgrade head

# Cambiar permisos de la carpeta de almacenamiento por si acaso (soluciona el Problema 3)
chown -R app:app /storage/documents

# Arrancar la aplicación
echo "Iniciando Gunicorn..."
exec "$@"