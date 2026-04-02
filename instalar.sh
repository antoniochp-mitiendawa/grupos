#!/bin/bash

echo "===================================="
echo "🚀 INSTALADOR WHATSAPP BOT - GRUPOS"
echo "===================================="
echo ""

# PASO 1: Instalar lo básico
echo "📦 PASO 1: Instalando programas necesarios..."
pkg update -y
pkg install git -y
pkg install nodejs-lts -y
pkg install yarn -y
pkg install cronie termux-services -y
pkg install wget -y

# PASO 2: Clonar el repositorio
echo "📦 PASO 2: Descargando el bot..."
rm -rf grupos 2>/dev/null
git clone https://github.com/antoniochp-mitiendawa/grupos.git
cd grupos

# PASO 3: Guardar la URL
echo ""
echo "===================================="
echo "🔗 URL DE GOOGLE SHEETS"
echo "===================================="
echo "1. Abre Google Sheets"
echo "2. Copia la URL del script"
echo "===================================="
echo ""
echo "📝 Escribe la URL y presiona Enter:"
read USER_URL
echo $USER_URL > url_sheets.txt
mkdir -p whatsapp-bot
echo $USER_URL > whatsapp-bot/url_sheets.txt

# PASO 4: Instalar dependencias
echo ""
echo "📦 PASO 3: Instalando librerías..."
cd whatsapp-bot
npm init -y
npm install @whiskeysockets/baileys
npm install @hapi/boom
npm install qrcode-terminal
npm install node-cron
npm install axios
npm install pino
npm install link-preview-js
npm install @rodrigogs/baileys-store

# PASO 5: Crear carpeta de logs
mkdir -p /storage/emulated/0/WhatsAppBot/logs

echo ""
echo "===================================="
echo "✅ INSTALACIÓN COMPLETA"
echo "===================================="
echo ""

# PASO 6: Preguntar si quiere iniciar
echo "🤖 El bot ya está instalado"
echo ""
echo "¿Quieres iniciar el bot AHORA?"
echo "Escribe 1 y presiona Enter para INICIAR"
echo "Escribe 2 y presiona Enter para SALIR"
echo ""
read OPCION

if [ "$OPCION" == "1" ]; then
    echo ""
    echo "🚀 INICIANDO BOT..."
    echo "======================"
    echo ""
    node bot.js
else
    echo ""
    echo "📝 Para iniciar el bot después:"
    echo "cd grupos/whatsapp-bot"
    echo "node bot.js"
    echo ""
fi
