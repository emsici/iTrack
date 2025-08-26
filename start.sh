#!/bin/bash
# Set default environment  
ENV="prod"

if [ "$1" != "" ]; then
    ENV=$1
fi

echo "================================"
echo "      iTrack - Start Server"
echo "================================"
echo ""
echo "DEFAULT: Production environment (etsm_prod)"
echo "Pentru development foloseste: ./start.sh dev"
echo ""

echo "================================"
echo "      iTrack - Start $ENV"
echo "================================"
echo ""

if [ "$ENV" = "dev" ]; then
    echo "Starting DEVELOPMENT environment..."
    echo "API: www.euscagency.com/etsm3/"
    export VITE_API_BASE_URL=https://www.euscagency.com/etsm3/platforme/transport/apk/
    export NODE_ENV=development
elif [ "$ENV" = "prod" ]; then
    echo "Starting PRODUCTION environment..."
    echo "API: www.euscagency.com/etsm_prod/"
    export VITE_API_BASE_URL=https://www.euscagency.com/etsm_prod/platforme/transport/apk/
    export NODE_ENV=production
else
    echo "EROARE: Environment invalid '$ENV'"
    echo "Foloseste: dev sau prod"
    exit 1
fi

echo ""
echo "Starting Vite development server on port 5000..."
npm run dev

if [ $? -ne 0 ]; then
    echo "EROARE: Server failed to start!"
    exit 1
fi