#!/bin/bash
set -e

echo "=== 1. Deteniendo contenedores previos (si existen) ==="
docker compose down

echo "=== 2. Compilando imágenes de PerfilCRM ==="
docker compose build

echo "=== 3. Iniciando servicios de PerfilCRM ==="
docker compose up -d

echo "=== 4. Estado de los contenedores ==="
docker compose ps

echo "=== ¡Todo listo! ==="
echo "Frontend activo en: http://localhost:3000"
echo "Backend activo en: http://localhost:3001"
echo "Base de datos PostgreSQL activa en puerto: 5433 (interno 5432)"
