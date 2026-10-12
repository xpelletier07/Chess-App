# Chess-App

## Démarrer avec les images publiées

Cette méthode est destinée à l'installation sans le code source. Elle nécessite uniquement Docker Desktop avec Docker Compose v2 et un accès Internet.

Dans PowerShell, exécutez une seule commande :

```powershell
powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/xpelletier07/Chess-App/dev/set-up/Docker-Install/setup-docker-images-windows.ps1 | iex"
```

Le script télécharge le fichier Compose, récupère les images publiées les plus récentes et démarre automatiquement :

- le client web;
- l'API serveur;
- PostgreSQL;
- l'initialisation du schéma et des comptes de démonstration.

Ouvrez ensuite `http://localhost:5173`.

L'API est disponible sur `http://localhost:3000`. Les images utilisent actuellement le tag `dev`, qui est mis à jour par la CI après les publications sur cette branche.

Commandes utiles :

```powershell
$compose = "$env:LOCALAPPDATA\Chess-App\images-stack\docker-compose.images.yaml"

# Voir l'état des conteneurs
docker compose --project-name chess-app-images -f $compose ps

# Voir les logs
docker compose --project-name chess-app-images -f $compose logs -f

# Arrêter la stack
docker compose --project-name chess-app-images -f $compose down
```

Si les images GHCR sont privées, connectez-vous d'abord avec `docker login ghcr.io`.

## Démarrer l'application en développement

1. Démarrez les services avec `docker compose up --build`.
2. Ouvrez le client à `http://localhost:5173`. L'API est disponible sur le port `3000`.

Compose fournit au serveur l'URL PostgreSQL et la clé JWT (valeur locale de développement) utilisées par l'inscription et la connexion. Le schéma `app/Serveur/db/db.sql` crée la table `users` lors de la première initialisation du volume PostgreSQL.

Les routes d'authentification sont `POST /auth/signup`, `POST /auth/login` et `POST /auth/check-email`. Elles utilisent la table `users` (`username`, `email`, `password`, `created_at`) via le dossier `app/Serveur/repository`.

## Comptes de démo

| Nom d'utilisateur | Courriel | Mot de passe |
| ----------------- | ---------| ------------ |
| Joueur1 | joueur1@chessapp.com | chessapp1 |
| Joueur2 | joueur2@chessapp.com | chessapp2 |