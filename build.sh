#!/bin/bash

# Set default environment
ENV="prod"

if [ "$1" != "" ]; then
    ENV=$1
fi

# Culori pentru terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear
echo ""
echo ""
echo -e "${WHITE}                ████████████████████████████████████████████${NC}"
echo -e "${WHITE}                ████████████████████████████████████████████${NC}"
echo -e "${WHITE}                ████████████████████████████████████████████${NC}"
echo -e "${WHITE}                ███████████ ITRACK GPS ROMANIA ████████████${NC}"
echo -e "${WHITE}                ████████████████████████████████████████████${NC}"
echo -e "${WHITE}                ████████████████████████████████████████████${NC}"
echo -e "${WHITE}                ████████████████████████████████████████████${NC}"
echo ""
echo -e "${CYAN}                ████████ STEAGUL ROMANIEI ████████${NC}"
echo -e "${WHITE}                ██████                            ██████${NC}"
echo -e "${BLUE}                ████   ■■■■■■${NC}  ${YELLOW}■■■■■■${NC}  ${RED}■■■■■■${NC}   ${WHITE}████${NC}"
echo -e "${BLUE}                ██     ■ BLU ■${NC} ${YELLOW}■GALB■${NC} ${RED}■ROSU■${NC}     ${WHITE}██${NC}"
echo -e "${BLUE}                ████   ■■■■■■${NC}  ${YELLOW}■■■■■■${NC}  ${RED}■■■■■■${NC}   ${WHITE}████${NC}"
echo -e "${WHITE}                ██████                            ██████${NC}"
echo -e "${WHITE}                ████████████████████████████████████████${NC}"
echo ""
echo -e "${MAGENTA}                ═══════════════════════════════════════════${NC}"
echo -e "${BOLD}                   🇷🇴 SISTEM BUILD PROFESIONAL 🇷🇴${NC}"
echo -e "${MAGENTA}                ═══════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}                ░░░░ Environment-uri disponibile: ░░░░${NC}"
echo -e "${WHITE}                ▶ PRODUCTION (etsm_prod) - [DEFAULT]${NC}"
echo -e "${WHITE}                ▶ DEVELOPMENT (etsm3) - ./build.sh dev${NC}"
echo ""

if [ "$ENV" = "dev" ]; then
    echo -e "${YELLOW}                ╔═══════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}                ║     🔧 DEVELOPMENT ENVIRONMENT      ║${NC}"
    echo -e "${YELLOW}                ║      API: www.euscagency.com/etsm3/   ║${NC}"
    echo -e "${YELLOW}                ╚═══════════════════════════════════════╝${NC}"
    export VITE_API_BASE_URL="https://www.euscagency.com/etsm3/platforme/transport/apk/"
    export NODE_ENV="development"
elif [ "$ENV" = "prod" ]; then
    echo -e "${GREEN}                ╔═══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}                ║      🚀 PRODUCTION ENVIRONMENT      ║${NC}"
    echo -e "${GREEN}                ║   API: www.euscagency.com/etsm_prod/  ║${NC}"
    echo -e "${GREEN}                ╚═══════════════════════════════════════╝${NC}"
    export VITE_API_BASE_URL="https://www.euscagency.com/etsm_prod/platforme/transport/apk/"
    export NODE_ENV="production"
else
    echo -e "${RED}                ╔═══════════════════════════════════════╗${NC}"
    echo -e "${RED}                ║           ❌ EROARE FATALA ❌         ║${NC}"
    echo -e "${RED}                ║      Environment invalid '$ENV'        ║${NC}"
    echo -e "${RED}                ║        Foloseste: dev sau prod        ║${NC}"
    echo -e "${RED}                ╚═══════════════════════════════════════╝${NC}"
    echo ""
    read -p "Apasă Enter pentru a ieși..."
    exit 1
fi

echo ""
echo -e "${CYAN}                ┌─────────────────────────────────────────┐${NC}"
echo -e "${CYAN}                │          🔄 PROCES DE BUILD            │${NC}"
echo -e "${CYAN}                └─────────────────────────────────────────┘${NC}"
echo ""

echo -e "${WHITE}░░░ [ETAPA 1/4] Instalare dependințe Node.js...${NC}"
echo -e "${CYAN}╠══ Verificând package.json și npm...${NC}"
if ! npm install >/dev/null 2>&1; then
    echo -e "${RED}╠══ ❌ EROARE: npm install eșuat${NC}"
    echo -e "${RED}╚══ Verificați conexiunea internet și package.json${NC}"
    echo ""
    read -p "Apasă Enter pentru a ieși..."
    exit 1
fi
echo -e "${GREEN}╠══ ✅ Dependințe instalate cu succes${NC}"
echo ""

echo -e "${WHITE}░░░ [ETAPA 2/4] Build aplicație pentru $ENV...${NC}"
echo -e "${CYAN}╠══ Compilând cu Vite bundler...${NC}"
if ! npx vite build >/dev/null 2>&1; then
    echo -e "${RED}╠══ ❌ EROARE: vite build eșuat${NC}"
    echo -e "${RED}╚══ Verificați codul TypeScript și dependințele${NC}"
    echo ""
    read -p "Apasă Enter pentru a ieși..."
    exit 1
fi
echo -e "${GREEN}╠══ ✅ Aplicație compilată pentru environment $ENV${NC}"
echo ""

echo -e "${WHITE}░░░ [ETAPA 3/4] Sincronizare cu Android...${NC}"
echo -e "${CYAN}╠══ Copiind assets în proiectul Android...${NC}"
if ! npx cap sync android >/dev/null 2>&1; then
    echo -e "${RED}╠══ ❌ EROARE: capacitor sync eșuat${NC}"
    echo -e "${RED}╚══ Verificați configurația Capacitor${NC}"
    echo ""
    read -p "Apasă Enter pentru a ieși..."
    exit 1
fi
echo -e "${GREEN}╠══ ✅ Proiect Android sincronizat${NC}"
echo ""

echo -e "${WHITE}░░░ [ETAPA 4/4] Lansare Android Studio...${NC}"
echo -e "${CYAN}╠══ Deschizând IDE-ul pentru development...${NC}"
if ! npx cap open android >/dev/null 2>&1; then
    echo -e "${RED}╠══ ❌ EROARE: deschiderea Android Studio eșuată${NC}"
    echo -e "${RED}╚══ Instalați Android Studio și configurați PATH${NC}"
    echo ""
    read -p "Apasă Enter pentru a ieși..."
    exit 1
fi
echo -e "${GREEN}╠══ ✅ Android Studio lansat cu succes${NC}"
echo ""

# Afișare finală de succes
clear
echo ""
echo ""
echo -e "${GREEN}                ████████████████████████████████████████████${NC}"
echo -e "${GREEN}                ████████████████████████████████████████████${NC}"
echo -e "${GREEN}                ████████████████████████████████████████████${NC}"
echo -e "${GREEN}                ███████████ BUILD FINALIZAT! ███████████████${NC}"
echo -e "${GREEN}                ████████████████████████████████████████████${NC}"
echo -e "${GREEN}                ████████████████████████████████████████████${NC}"
echo -e "${GREEN}                ████████████████████████████████████████████${NC}"
echo ""
echo -e "${BOLD}                ██████ STEAGUL ROMANIEI - SUCCES ██████${NC}"
echo -e "${WHITE}                ████                                ████${NC}"
echo -e "${BLUE}                ██   🟦🟦🟦${NC}  ${YELLOW}🟨🟨🟨${NC}  ${RED}🟥🟥🟥${NC}   ${WHITE}██${NC}"
echo -e "${BLUE}                ██   🟦🟦🟦${NC}  ${YELLOW}🟨🟨🟨${NC}  ${RED}🟥🟥🟥${NC}   ${WHITE}██${NC}"
echo -e "${BLUE}                ██   🟦🟦🟦${NC}  ${YELLOW}🟨🟨🟨${NC}  ${RED}🟥🟥🟥${NC}   ${WHITE}██${NC}"
echo -e "${WHITE}                ████                                ████${NC}"
echo -e "${WHITE}                ████████████████████████████████████████${NC}"
echo ""
echo -e "${GREEN}                ╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}                ║        🇷🇴 BUILD $ENV REUȘIT! 🇷🇴        ║${NC}"
echo -e "${GREEN}                ║                                           ║${NC}"
echo -e "${GREEN}                ║  ✅ Toate etapele finalizate cu succes   ║${NC}"
echo -e "${GREEN}                ║  📱 Proiect gata în Android Studio       ║${NC}"
echo -e "${GREEN}                ║  🌐 Environment: $ENV                     ║${NC}"
echo -e "${GREEN}                ║  🚀 Gata pentru deployment!              ║${NC}"
echo -e "${GREEN}                ╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}                ████ INSTRUCTIUNI URMATOARE ████${NC}"
echo -e "${WHITE}                ▶ Android Studio este deschis${NC}"
echo -e "${WHITE}                ▶ Selectați device/emulator${NC}"
echo -e "${WHITE}                ▶ Apăsați 'Run' pentru testare${NC}"
echo -e "${WHITE}                ▶ Pentru APK: Build → Generate Signed Bundle/APK${NC}"
echo ""
echo -e "${MAGENTA}                ┌─────────────────────────────────────────┐${NC}"
echo -e "${MAGENTA}                │    🔧 iTrack GPS Romania - Build Tool   │${NC}"
echo -e "${MAGENTA}                │       Dezvoltat pentru excelență       │${NC}"
echo -e "${MAGENTA}                └─────────────────────────────────────────┘${NC}"
echo ""