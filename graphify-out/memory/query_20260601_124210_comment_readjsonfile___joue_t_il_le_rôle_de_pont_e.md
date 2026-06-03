---
type: "query"
date: "2026-06-01T12:42:10.948831+00:00"
question: "Comment readJsonFile() joue-t-il le rôle de pont entre la spec, la gestion des formations et l'analyse IA?"
contributor: "graphify"
source_nodes: ["readJsonFile writeJsonFile analyze_handler sessionId_handler"]
---

# Q: Comment readJsonFile() joue-t-il le rôle de pont entre la spec, la gestion des formations et l'analyse IA?

## Answer

readJsonFile() (lib/utils.js) est le god node central (14 arêtes, centralité 0.284) qui matérialise le contrat 'fichiers JSON' de la spec. Il est appelé par 7+ handlers API: /api/craintes, /api/settings, /api/sessions, /api/admin/analyze, /api/admin/auth, /api/session/[id]. Il lit: data/config/craintes.json (cases craintes étape 3), data/config/settings.json (SMTP + cookieName pour l'email étape 4), data/formations/formations.json (catalogue admin), data/admin.json (hash bcrypt), et les prompts IA (data/config/prompt_attentes.md, prompt_craintes.md) via readFileSync/readPromptFile. Le pont 'IA Analysis' (Community 1) repose entièrement sur lui: analyze.js -> readPromptFile() -> callIa() -> parseNormalizedOutput() -> écrit keywords.json. Si on migrait vers SQLite/Postgres, ce nœud casserait toute la spec car la structure 'data/formations/[sessionId]/' est encodée en dur dans utils.js.

## Source Nodes

- readJsonFile writeJsonFile analyze_handler sessionId_handler