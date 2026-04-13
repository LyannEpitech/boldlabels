#!/bin/bash

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DATE=$(date +%Y%m%d_%H%M%S)

# Créer le dossier de backup si inexistant
mkdir -p "$BACKUP_DIR"

echo "💾 Backup BoldLabels - $DATE"

# Backup de la base de données
echo "🗄️  Backup de la base de données..."
docker exec boldlabels-db pg_dump -U boldlabels boldlabels > "$BACKUP_DIR/db_$DATE.sql" 2>/dev/null || {
    echo "❌ Erreur: Impossible de backup la DB. Vérifiez que le conteneur boldlabels-db tourne."
    exit 1
}

# Compression
echo "🗜️  Compression..."
gzip -f "$BACKUP_DIR/db_$DATE.sql"

# Nettoyage des vieux backups
echo "🧹 Nettoyage des backups de plus de $RETENTION_DAYS jours..."
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Afficher les backups restants
echo ""
echo "✅ Backup terminé!"
echo "📁 Fichiers de backup:"
ls -lh "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null || echo "Aucun fichier trouvé"

echo ""
echo "💾 Espace disque utilisé:"
du -sh "$BACKUP_DIR"
