#!/bin/bash
set -e

echo "=== 1. Deteniendo contenedores previos (si existen) ==="
sudo docker compose down

echo "=== 2. Compilando imágenes de PurezaCRM ==="
sudo docker compose build

echo "=== 3. Iniciando servicios de PurezaCRM ==="
sudo docker compose up -d

echo "=== 4. Estado de los contenedores ==="
sudo docker compose ps

echo "=== ¡Todo listo! ==="
echo "Frontend activo en: http://localhost:3000"
echo "Backend activo en: http://localhost:3001"
