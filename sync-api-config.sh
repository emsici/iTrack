#!/bin/bash

# 🎯 API Configuration Synchronization Script
# This script ensures both TypeScript and Java use the same API environment
# Usage: ./sync-api-config.sh PROD|TEST|DEV

ENVIRONMENT=${1:-"PROD"}

echo "🚀 Synchronizing API configuration to: $ENVIRONMENT"

# Update TypeScript configuration
echo "📝 Updating src/services/api.ts..."
sed -i "s/export const API_BASE_URL = API_CONFIG\.[A-Z]*/export const API_BASE_URL = API_CONFIG.$ENVIRONMENT/" src/services/api.ts
sed -i "s/export const CURRENT_ENVIRONMENT = '[A-Z]*'/export const CURRENT_ENVIRONMENT = '$ENVIRONMENT'/" src/services/api.ts

# Update Java configuration  
echo "📝 Updating OptimalGPSService.java..."
sed -i "s/private static final String API_BASE_URL = API_BASE_URL_[A-Z]*/private static final String API_BASE_URL = API_BASE_URL_$ENVIRONMENT/" android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java

# Update JSON config
echo "📝 Updating api-config.json..."
sed -i "s/\"environment\": \"[A-Z]*\"/\"environment\": \"$ENVIRONMENT\"/" android/app/src/main/assets/api-config.json

echo "✅ API configuration synchronized to $ENVIRONMENT environment!"
echo "📋 Updated files:"
echo "  - src/services/api.ts"
echo "  - android/app/src/main/java/com/euscagency/itrack/OptimalGPSService.java"
echo "  - android/app/src/main/assets/api-config.json"