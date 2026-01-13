#!/bin/bash

# Forge - Close Development Server
# Kill all Forge-related processes

echo "[Forge] Stopping all Forge processes..."

# Kill Electron processes
pkill -f "Forge/node_modules/electron" 2>/dev/null

# Kill Vite dev server
pkill -f "Forge.*vite" 2>/dev/null

# Kill esbuild
pkill -f "Forge.*esbuild" 2>/dev/null

# Kill any node processes running from Forge directory
pkill -f "node.*Forge" 2>/dev/null

sleep 0.5

# Check if any remain
remaining=$(ps aux | grep -E "Forge.*(electron|vite|esbuild)" | grep -v grep | wc -l)

if [ "$remaining" -gt 0 ]; then
    echo "[Forge] Warning: $remaining process(es) still running (may be zombie processes)"
    echo "[Forge] Use 'ps aux | grep Forge' to inspect, or restart computer to clear"
else
    echo "[Forge] All processes stopped successfully"
fi
