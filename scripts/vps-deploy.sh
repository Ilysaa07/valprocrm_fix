#!/bin/bash

# VPS Deployment Script for Valpro CRM
# Run this script on your VPS to deploy the application

echo "🚀 Valpro CRM - VPS Deployment Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🏗️ Building the application..."
npm run build

echo "✅ Build completed successfully!"
echo ""
echo "🚀 To start the application:"
echo "   npm start"
echo ""
echo "🔧 To start with PM2:"
echo "   pm2 start ecosystem.production.config.js"
echo ""
echo "📊 To monitor with PM2:"
echo "   pm2 status"
echo "   pm2 logs"
