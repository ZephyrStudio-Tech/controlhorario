#!/bin/sh
set -e

echo "Ejecutando migraciones de base de datos..."
alembic upgrade head

echo "Iniciando Gunicorn..."
exec "$@"