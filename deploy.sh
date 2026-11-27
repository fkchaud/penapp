#!/usr/bin/env bash

set -Eeuo pipefail

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 26

APP_DIR="/opt/penapp/frontend"

echo "=================================="
echo "Iniciando despliegue de PenApp"
echo "=================================="

cd "$APP_DIR"

# Recuperar una versión anterior si un despliegue quedó interrumpido
if [ ! -d dist ] && [ -d dist-old ]; then
    mv dist-old dist
fi

rm -rf dist-old dist-new

echo "1. Actualizando código..."
git pull --ff-only origin master

echo "2. Instalando dependencias..."
npm ci --omit=dev

echo "3. Generando build web de Expo..."
npx expo export --platform web --output-dir dist-new

if [ ! -s dist-new/index.html ]; then
    echo "ERROR: No se generó dist-new/index.html"
    exit 1
fi

echo "4. Publicando nueva versión..."

if [ -d dist ]; then
    mv dist dist-old
fi

if mv dist-new dist; then
    rm -rf dist-old
else
    echo "ERROR: No se pudo publicar el nuevo build."
    if [ -d dist-old ]; then
        mv dist-old dist
    fi
    exit 1
fi

echo "5. Verificando publicación..."
test -s dist/index.html

echo "=================================="
echo "Despliegue finalizado"
echo "Commit desplegado:"
git rev-parse --short HEAD
echo "=================================="
