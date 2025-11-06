#!/bin/bash

# FitGoose - Quick Start Script
echo "🦢 Starting FitGoose - Voice & Motion Fitness Trainer..."

# Navigate to app directory
cd "$(dirname "$0")/app" || exit 1

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start development server
echo "🚀 Starting development server..."
echo "🎯 Open your browser to: http://localhost:5173/"
echo "📷 Make sure to allow camera permissions!"
echo "🔊 Test voice commands: 'Start workout', 'Squat', 'Push up'"
echo ""
echo "Press Ctrl+C to stop the server"

npm run dev
