#!/bin/bash
set -e

# Vérifier les arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <domaine> [email]"
    echo "Exemple: $0 boldlabels.example.com admin@example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-admin@$DOMAIN}

echo "🔒 Configuration SSL pour $DOMAIN"

# Créer les dossiers nécessaires
mkdir -p nginx/www
mkdir -p nginx/ssl

# Démarrer nginx temporairement pour le challenge
echo "▶️  Démarrage temporaire de nginx..."
docker-compose -f docker-compose.prod.yml up -d nginx

sleep 2

# Obtenir le certificat
echo "📜 Obtention du certificat Let's Encrypt..."
docker run -it --rm \
    -v boldlabels_certbot-data:/etc/letsencrypt \
    -v $(pwd)/nginx/www:/var/www/certbot \
    -p 80:80 \
    certbot/certbot certonly \
    --standalone \
    --preferred-challenges http \
    -d "$DOMAIN" \
    --agree-tos \
    --email "$EMAIL" \
    --non-interactive || {
        echo "❌ Échec de l'obtention du certificat"
        echo "Vérifiez que:"
        echo "  - Le domaine $DOMAIN pointe vers ce serveur"
        echo "  - Le port 80 est ouvert"
        docker-compose -f docker-compose.prod.yml down
        exit 1
    }

# Arrêter nginx
echo "🛑 Arrêt de nginx..."
docker-compose -f docker-compose.prod.yml down

# Modifier la config nginx pour utiliser le bon domaine
echo "📝 Mise à jour de la configuration nginx..."
sed -i "s/server_name _;/server_name $DOMAIN;/g" nginx/nginx.conf
sed -i "s/boldlabels/$DOMAIN/g" nginx/nginx.conf

echo ""
echo "✅ SSL configuré pour $DOMAIN!"
echo ""
echo "🚀 Vous pouvez maintenant démarrer l'application:"
echo "  ./deploy.sh"
echo ""
echo "📝 Renouvellement automatique:"
echo "  Le conteneur certbot renouvellera automatiquement le certificat"
echo ""
