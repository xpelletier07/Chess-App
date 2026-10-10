# Chess-App

## Démarrer l'application en développement

1. Démarrez les services avec `docker compose up --build`.
2. Ouvrez le client à `http://localhost:5173`. L'API est disponible sur le port `3000`.

Compose fournit au serveur l'URL PostgreSQL et la clé JWT (valeur locale de développement) utilisées par l'inscription et la connexion. Le schéma `app/Serveur/db/db.sql` crée la table `users` lors de la première initialisation du volume PostgreSQL.

Les routes d'authentification sont `POST /auth/signup`, `POST /auth/login` et `POST /auth/check-email`. Elles utilisent la table `users` (`username`, `email`, `password`, `created_at`) via le dossier `app/Serveur/repository`.