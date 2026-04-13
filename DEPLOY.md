# 🚀 Guide de Déploiement BoldLabels

Déployez BoldLabels sur votre propre VPS en quelques minutes.

## 📋 Prérequis

- Un VPS (DigitalOcean, Hetzner, OVH...) avec Ubuntu 22.04
- Un nom de domaine pointant vers votre VPS
- Docker et Docker Compose installés

## ⚡ Déploiement Rapide

### 1. Connectez-vous à votre VPS

```bash
ssh root@<IP_DU_VPS>
```

### 2. Installez Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 3. Clonez le repo

```bash
cd /opt
git clone https://github.com/LyannEpitech/boldlabels.git
cd boldlabels
```

### 4. Déployez

```bash
# Déploiement initial
./deploy.sh

# Configuration SSL (remplacez par votre domaine)
./setup-ssl.sh boldlabels.votredomaine.com

# Redémarrage avec SSL
./deploy.sh
```

### 5. Configurez les backups

```bash
# Backup manuel
./backup.sh

# Backup automatique (tous les jours à 2h)
crontab -e
# Ajoutez:
0 2 * * * cd /opt/boldlabels && ./backup.sh
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env`:

```env
DB_PASSWORD=votre_mot_de_passe_securise
```

### Ports

- `80` : HTTP (redirige vers HTTPS)
- `443` : HTTPS
- `3001` : API backend (interne)

## 📊 Commandes Utiles

```bash
# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f

# Voir les logs d'un service spécifique
docker-compose -f docker-compose.prod.yml logs -f backend

# Redémarrer un service
docker-compose -f docker-compose.prod.yml restart backend

# Mettre à jour l'application
git pull
./deploy.sh

# Backup manuel
./backup.sh

# Entrer dans un conteneur
docker exec -it boldlabels-backend sh
docker exec -it boldlabels-db psql -U boldlabels
```

## 🔒 SSL / HTTPS

Le SSL est géré automatiquement par Let's Encrypt:

- Certificat obtenu via `setup-ssl.sh`
- Renouvellement automatique tous les 12h
- Redirection HTTP → HTTPS automatique

## 💾 Backups

Les backups sont stockés dans `./backups/`:

- `db_YYYYMMDD_HHMMSS.sql.gz` : Backup de la base de données
- Conservation : 7 jours par défaut

Pour restaurer un backup:

```bash
gunzip -c backups/db_20240115_120000.sql.gz | docker exec -i boldlabels-db psql -U boldlabels
```

## 🐛 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs

# Vérifier l'espace disque
df -h

# Rebuild complet
./deploy.sh
```

### Erreur de connexion à la DB

```bash
# Vérifier que la DB est healthy
docker-compose -f docker-compose.prod.yml ps

# Redémarrer la DB
docker-compose -f docker-compose.prod.yml restart postgres

# Exécuter les migrations manuellement
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### SSL ne fonctionne pas

```bash
# Vérifier que le domaine pointe bien vers le serveur
nslookup boldlabels.votredomaine.com

# Réinstaller SSL
./setup-ssl.sh boldlabels.votredomaine.com
```

## 💰 Coûts

| Service | Coût Mensuel |
|---------|--------------|
| VPS (2CPU/4GB/50GB) | 5-10€ |
| Nom de domaine | 1-10€/an |
| **Total** | **~6-12€/mois** |

## 📚 Ressources

- [Documentation Docker](https://docs.docker.com/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Nginx Documentation](https://nginx.org/en/docs/)

## 🆘 Support

En cas de problème:
1. Consultez les logs: `docker-compose -f docker-compose.prod.yml logs`
2. Vérifiez les issues GitHub
3. Créez une nouvelle issue avec les logs d'erreur
