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
2. Vérification code formation (session)
3. Étape 1 : code stagiaire ou nouveau (phonétique)
4. Étape 2 : attentes en texte libre
5. Étape 3 : craintes (cases + texte). Choix de 3 cases maximum + complément par texte
6. Étape 4 : Merci ! avec rappel des réponses fournies + code stagiaire + saisie optionnelle adresse email pour envoi des infos récapitulatives 
7. fin (avec retour possible à l'écran d'accueil de la session (/?session=CODE_HEX))

## Stockage des données

### sessions.json
```json
{
    "id": "<code hex 32bits>", //exemple "5fbd5366"
    "label": "<nom session>, //exemple "Besse""
    "createdAt": "<date time>", //exemple "2026-04-22T14:55:33.038Z"
    "participantCount": <nb participants>, //exemple 1
    "responses": [
      {
        "id": "<unique 5 Letters code>" // exemple "BUDAP",
        "submittedAt": "<date time>", // exemple "2026-04-22T15:09:45.258Z"
        "needs": [<liste d'attentes>],   // exemple ["redaction, automatisation, "recherche juridique"]
        "fears": [<liste de craintes>]   // exemple ["remplacement, dependance, "cout"]
      },
      {
        "id": "<unique 5 Letters code>" // exemple "TISAM",
        "submittedAt": "<date time>", // exemple "2026-04-22T15:09:45.258Z"
        "needs": [<liste d'attentes>],   // exemple ["brainstroming", "vérifications"]
        "fears": [<liste de craintes>]   // exemple ["complexite", "biais", ""sécurité"]
      }
    ]
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

### par fichier settings.json dans data/config/

Exemple de configuration
```json
{
  "app": {
    "name": "Sondage IA",
    "url": "http://localhost:3100"
  },
  "session": {
    "cookieName": "survey_admin_session",
    "maxAgeMs": 1800000
  },
  "smtp": {
    "host": "mail.transilio.fr",
    "port": 587,
    "secure": false
  },
  "emailFrom": "formation@transilio.fr",
  "emailSubject": "Vos réponses au sondage IA",
  "craintes": [
    { "id": "remplacement", "label": "Remplacement de mon métier" },
    { "id": "securite", "label": "Sécurité des données" },
    { "id": "dependance", "label": "Dépendance excessive" },
    { "id": "complexite", "label": "Complexité d'utilisation" },
    { "id": "erreurs", "label": "Erreurs de décision" },
    { "id": "biaisbiais", "label": "Biais discriminatoires" },
    { "id": "competences", "label": "Perte de compétences" },
    { "id": "cout", "label": "Coût d'implémentation" }
  ]
}
```


### Commandes
```bash
npm install && npm run dev
```

## Design des écrans

### Admin

-Liste de sessions avec résumé (id Session, nb participants, nb mots) + boutons : "allé à la session" + copier l'url session + résultats (grissé si aucune réponse) + supprimer

#### Page résultat d'une session 
- Dashboard : stats globales
- Résultats : nuages de mots côte à côte. Gauche en bleu = needs. Droite en orange = Craintes

### Sondage
- 4 étapes claires avec progression
- UI mobile-first
- Feedback utilisateur immédiat


## Chartes Graphique
Respecter la chartes graphiques Transilio

### COULEURS PRINCIPALES
#### Bleu Transilio
#0F1459

#### Rouge Transilio
#FF5340

#### Blanc
#FFFFFF

### COULEURS SECONDAIRES
#### Noir
#000000

#### Bleu Electrique
 #2F3CED

#### Bleu pastel
#F0F1FF

#### Rouge foncé
#730B00

#### Rouge pastel
#FFEDEB

### Polices de caractères 
Titres : Google font "Space Grotesk"
Texte : Google font "Inter"

Polices importées plutot que téléchargées. 





