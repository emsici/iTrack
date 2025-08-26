#!/bin/bash
echo "================================"
echo "      iTrack - Quick Dev Mode"
echo "================================"
echo ""
echo "Starting DEVELOPMENT server..."
echo "API: etsm3"
echo ""

# Set development environment
export VITE_API_BASE_URL=https://www.euscagency.com/etsm3/platforme/transport/apk/
export NODE_ENV=development

# Start development server without build
npx vite --host 0.0.0.0 --port 5000