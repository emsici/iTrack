#!/bin/bash
echo "================================"
echo "      iTrack - Development Server"
echo "================================"
echo ""
echo "Starting DEVELOPMENT environment..."
echo "API: www.euscagency.com/etsm3/"
echo ""

# Set development environment variables
export VITE_API_BASE_URL=https://www.euscagency.com/etsm3/platforme/transport/apk/
export NODE_ENV=development

# Start development server
echo "Starting Vite development server on port 5000..."
npm run dev

if [ $? -ne 0 ]; then
    echo "EROARE: Development server failed to start!"
    exit 1
fi