#!/bin/bash

# Forge - Start Development Server
# Clean up any stale processes before starting

echo "[Forge] Cleaning up stale processes..."
pkill -f "Forge/node_modules/electron" 2>/dev/null
pkill -f "Forge.*vite" 2>/dev/null
pkill -f "Forge.*esbuild" 2>/dev/null
sleep 0.5

echo "[Forge] Starting development server..."
npm run dev
