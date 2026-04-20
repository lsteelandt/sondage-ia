# Spécification technique - Sondage IA Stagiaires

## Date
20 avril 2026

## Objectif
Application web mobile pour collecter les attentes et craintes des stagiaires sur l'IA, avec interface d'administration pour visualiser les résultats.

## Architecture

### Tech Stack
- **Framework** : Next.js 14+ (React 18+)
- **Styling** : Tailwind CSS
- **Stockage** : Fichiers JSON
- **Authentification** : Hash bcrypt + cookies sécurisés
- **Nuage de mots** : react-wordcloud ou d3-cloud

### Structure du projet
```
sondage-ia/
├── pages/
│   ├── api/
│   │   ├── session/[sessionId].js  # Gestion sessions et réponses
│   │   ├── sessions.js             # Liste formations admin
│   │   └── admin/auth.js          # Auth admin
│   ├── admin/
│   │   ├── index.js                # Dashboard
│   │   ├── sessions.js            # Gestion formations
│   │   └── resultats.js            # Voir résultats
│   └── index.js                    # Sondage
├── data/
│   ├── formations/                 # Codes formation hexa
│   │   ├── formations.json         # Liste formations
│   │   └── [sessionId]/           # Dossier par formation
│   │       ├── stagiaires.json     # Réponses stagiaires
│   │       └── keywords.json       # Aggrégats stats
│   ├── admin.json                  # Hash mdp admin
│   └── config/
│       ├── craintes.json          # Liste craintes
│       └── app.config.js          # Config générale
├── components/
└── lib/
```

## Flux utilisateur

### Admin
1. Accès à `/admin`
2. Si 1er accès : création mot de passe
3. Dashboard : stats + liens
4. Gestion des formations :
   - Création : label → ID hexa aléatoire
   - Liste avec stat stagiaires
   - Suppression possible
5. Résultats : nuage de mots par session

### Stagiaire
1. Accès via `/?session=CODE_HEX`
2. Vérification code formation
3. Étape 1 : code stagiaire ou nouveau (phonétique)
4. Étape 2 : attentes en texte libre
5. Étape 3 : craintes (cases + texte)
6. Merci → fin

## Stockage des données

### formations.json
```json
{
  "formations": {
    "a3f7b2e9": {
      "label": "Formation IA Q2 2026",
      "createdAt": "2026-04-20T10:00:00Z",
      "stagiaireCount": 0
    }
  }
}
```

### stagiaires.json (par formation)
```json
{
  "stagiaires": {
    "BATEAU": {
      "sessionCode": "a3f7b2e9",
      "attentes": ["aide", "automatisation"],
      "craintes": ["remplacement", "sécurité"],
      "createdAt": "2026-04-20T10:15:00Z"
    }
  }
}
```

## Sécurité

- Hash bcrypt des mots de passe
- Cookies sécurisés (HttpOnly, Secure, SameSite)
- Validation des entrées
- Protection XSS
- Git ignore sur data/
- Permissions 600 sur admin.json

## Dépendances

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "bcrypt": "^5.1.0",
    "react-wordcloud": "^2.0.0",
    "nanoid": "^3.0.0",
    "tailwindcss": "^3.0.0"
  }
}
```

## Configuration

### Variables d'environnement
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_NAME`

### Commandes
```bash
npm install && npm run dev
```

## Design des écrans

### Admin
- Dashboard : stats globales
- Gestion formations CRUD
- Résultats : nuages de mots côte à côte

### Sondage
- 3 étapes claires avec progression
- UI mobile-first
- Feedback utilisateur immédiat