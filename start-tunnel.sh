#!/bin/bash

# Verificar si cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "Error: cloudflared no está instalado. Por favor instálalo primero."
    exit 1
fi

echo "Iniciando Cloudflare Tunnel para el puerto 4200..."
echo "Tu aplicación será accesible públicamente en la URL que aparecerá abajo."
echo "Para detener el túnel, presiona Ctrl+C."
echo ""

# Iniciar el túnel
cloudflared tunnel --url http://localhost:4200
