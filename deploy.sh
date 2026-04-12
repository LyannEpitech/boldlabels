#!/bin/bash

# BoldLabels Deployment Script

set -e

echo "🚀 Deploying BoldLabels..."

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed"
    exit 1
fi

# Create .env files if they don't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env from example..."
    cp backend/.env.example backend/.env
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend/.env from example..."
    cp frontend/.env.example frontend/.env
fi

# Build and start services
echo "🏗️ Building services..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for database
echo "⏳ Waiting for database..."
sleep 5

# Run migrations
echo "🔄 Running database migrations..."
docker-compose exec backend npx prisma migrate deploy

echo "✅ Deployment complete!"
echo ""
echo "📊 Services:"
echo "  Frontend: http://localhost"
echo "  Backend API: http://localhost:3000"
echo "  Database: localhost:5432"
echo ""
echo "📝 Logs: docker-compose logs -f"
