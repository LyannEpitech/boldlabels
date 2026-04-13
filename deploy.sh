#!/bin/bash
set -e

echo "🚀 Déploiement BoldLabels..."

# Vérifier les variables d'environnement
if [ -z "$DB_PASSWORD" ]; then
    echo "⚠️  Attention: DB_PASSWORD non défini, utilisation de la valeur par défaut"
fi

# Pull latest code (si sur une branche git)
if [ -d ".git" ]; then
    echo "📥 Mise à jour du code..."
    git pull origin main || echo "⚠️  Impossible de pull, continuation..."
fi

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose -f docker-compose.prod.yml down

# Build et démarrage
echo "🔨 Build des images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "▶️  Démarrage des services..."
docker-compose -f docker-compose.prod.yml up -d

# Attendre que la DB soit prête
echo "⏳ Attente de la base de données..."
sleep 5

# Run migrations
echo "🗄️  Exécution des migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy || echo "⚠️  Migration peut-être déjà à jour"

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📊 Status des services:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📝 Logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
