# Plan : Analyse IA des réponses du sondage

## Objectif
Ajouter un bouton "Analyser" dans la vue résultats admin qui déclenche un appel à une IA (Mistral, OpenRouter ou Ollama) pour normaliser les termes bruts (attentes/craintes) en termes standardisés pour le nuage de mots.

---

## Étape 1 — Étendre settings.json

**Fichier** : `data/config/settings.json`

Ajouter une section `ia` :
```json
{
  "ia": {
    "provider": "mistral",       // "mistral" | "openrouter" | "ollama"
    "apiUrl": "",                // URL de l'API (optionnel, peut être déduit du provider)
    "model": "mistral-medium"    // Modèle par défaut
  }
}
```

**Décision** : `provider` suffit à déduire l'URL de base — pas besoin de champ `apiUrl` supplémentaire pour Mistral et OpenRouter. Ollama peut nécessiter une URL locale (储 dans settings si besoin).

---

## Étape 2 — Ajouter la clé API dans .env.local

**Fichier** : `.env.local` (déjà présent, ne pas commiter)

```env
IA_API_KEY=votre_cle_api_ici
```

Pas de changement dans `.env.local.example` (la clé ne doit pas être partagée).

---

## Étape 3 — Créer l'endpoint POST /api/analyze

**Fichier** : `pages/api/analyze.js`

**Rôle** :
1. Lire `sessions.json` pour extraire toutes les réponses brutes d'une session
2. Appeler l'IA (via le provider configuré dans settings) avec le prompt de normalisation
3. Parser la réponse IA (tableau Markdown → JSON)
4. Écrire les résultats normalisés dans `sessions.json`
5. Retourner le résultat au client

**Schema stocké dans sessions.json** :
```json
{
  "id": "5fbd5366",
  "normalizedKeywords": {
    "attentes": [
      { "term": "Productivité", "occurrences": 5, "originals": ["gain de temps", "gestion du temps", ...] },
      { "term": "Automatisation", "occurrences": 3, "originals": ["automatisation", "- automatisation", ...] }
    ],
    "craintes": [
      { "term": "Perte de compétences", "occurrences": 4, "originals": ["perte de compétences", ...] }
    ]
  }
}
```

**Fallback** : si l'IA échoue, retourner les termes bruts tels quels avec un flag `fallback: true`.

**Sécurité** : admin only (vérification de session).

---

## Étape 4 — Bouton "Analyser" dans la vue résultats

**Fichier** : `pages/admin/resultats.js`

- Ajouter un bouton "Analyser" dans le header (à côté de "Exporter")
- État `analyzing` avec spinner pendant l'appel API
- Message de succès/erreur après traitement
- Le bouton est désactivé si aucune réponse disponible

---

## Étape 5 — Tooltip au survol des mots du cloud

**Fichier** : `components/Survey/SimpleWordCloud.js`

- Modifier le composant pour accepter une props `normalized` (booléan)
- Si `normalized: true` : chaque entrée est un objet `{ term, occurrences, originals }`
- Sur hover d'un mot : afficher une bulle avec la liste des expressions originales
- Si `normalized: false` : comportement actuel (affichage simple avec count)

---

## Étape 6 — Supprimer trace MongoDB (nettoyage)

**Recherche** : `grep -r "mongo\|mongoose\|mongodb" --include="*.js" --include="*.json"` pour trouver toute référence.

**Résultat attendu** : aucune référence à MongoDB dans le code (apparemment déjà le cas, mais vérifier).

---

## Décisions d'implémentation

| Sujet | Décision |
|------|----------|
| Provider IA | Lecture du provider dans settings.json |
| Clé API | `.env.local` → `process.env.IA_API_KEY` |
| Appels IA | Un seul appel par analyse (envoyer toutes les réponses en une fois) |
| Stockage | Écriture directe dans `sessions.json` après analyse |
| Gestion erreur IA | Fallback : termes bruts avec flag `fallback: true` |

---

## Fichiers à modifier

| Fichier | Action |
|---------|--------|
| `data/config/settings.json` | Ajouter section `ia` |
| `.env.local` | Ajouter `IA_API_KEY` |
| `pages/api/analyze.js` | Créer (nouveau) |
| `pages/admin/resultats.js` | Ajouter bouton + état analyzing |
| `components/Survey/SimpleWordCloud.js` | Ajouter tooltip + support normalized |
| `pages/api/session/[sessionId].js` | Optionnel : ajouter les normalisés dans la réponse GET |

---

## Ordre d'implémentation

1. `settings.json` + `.env.local`
2. `pages/api/analyze.js` (logique IA)
3. `resultats.js` (bouton + call API)
4. `SimpleWordCloud.js` (tooltip)
5. Test de bout en bout
