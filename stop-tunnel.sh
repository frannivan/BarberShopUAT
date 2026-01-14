#!/bin/bash
echo "Deteniendo Cloudflare Tunnel..."
pkill -f cloudflared
echo "Tunnel detenido."
