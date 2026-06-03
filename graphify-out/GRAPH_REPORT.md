# Graph Report - .  (2026-06-01)

## Corpus Check
- Corpus is ~22,309 words - fits in a single context window. You may not need a graph.

## Summary
- 100 nodes · 124 edges · 25 communities detected
- Extraction: 61% EXTRACTED · 39% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Sessions & Settings API|Sessions & Settings API]]
- [[_COMMUNITY_IA Analysis & Email|IA Analysis & Email]]
- [[_COMMUNITY_IA Provider Adapters|IA Provider Adapters]]
- [[_COMMUNITY_Admin Auth|Admin Auth]]
- [[_COMMUNITY_Survey UI & Theming|Survey UI & Theming]]
- [[_COMMUNITY_Admin Components|Admin Components]]
- [[_COMMUNITY_Phonetic Code Generator|Phonetic Code Generator]]
- [[_COMMUNITY_App Shell|App Shell]]
- [[_COMMUNITY_Results Page|Results Page]]
- [[_COMMUNITY_Sessions Admin Page|Sessions Admin Page]]
- [[_COMMUNITY_Admin Home Page|Admin Home Page]]
- [[_COMMUNITY_Graph Artifacts|Graph Artifacts]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Think Before Coding|Think Before Coding]]
- [[_COMMUNITY_Simplicity First|Simplicity First]]
- [[_COMMUNITY_Surgical Changes|Surgical Changes]]
- [[_COMMUNITY_Goal-Driven Execution|Goal-Driven Execution]]
- [[_COMMUNITY_Admin Logout Handler|Admin Logout Handler]]
- [[_COMMUNITY_Auth Form Submit|Auth Form Submit]]
- [[_COMMUNITY_Survey Submit|Survey Submit]]
- [[_COMMUNITY_Code Generation Handler|Code Generation Handler]]
- [[_COMMUNITY_Results Analyze Handler|Results Analyze Handler]]
- [[_COMMUNITY_Results Export Handler|Results Export Handler]]

## God Nodes (most connected - your core abstractions)
1. `readJsonFile()` - 14 edges
2. `handler()` - 12 edges
3. `SurveyPage()` - 10 edges
4. `API handler /api/sessions (GET/POST/DELETE formations)` - 10 edges
5. `handler()` - 8 edges
6. `handler()` - 8 edges
7. `writeJsonFile()` - 7 edges
8. `handler()` - 7 edges
9. `callIa()` - 7 edges
10. `readFileSync()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `settings.json configuration schema` --rationale_for--> `handler()`  [INFERRED]
  docs/superpowers/specs/2026-04-20-sondage-ia-design.md → pages/api/admin/logout.js
- `settings.json configuration schema` --rationale_for--> `handler()`  [INFERRED]
  docs/superpowers/specs/2026-04-20-sondage-ia-design.md → pages/api/admin/auth.js
- `handler()` --implements--> `Task 5: Formation Management API (plan)`  [INFERRED]
  pages/api/admin/analyze.js → docs/superpowers/plans/2026-04-20-sondage-ia-implementation.md
- `hardReload()` --conceptually_related_to--> `handler()`  [INFERRED]
  public/hard-reload.html → pages/api/session/[sessionId].js
- `handler()` --implements--> `Step 4: Thank you + email recap`  [INFERRED]
  pages/api/session/[sessionId]/email.js → docs/superpowers/specs/2026-04-20-sondage-ia-design.md

## Hyperedges (group relationships)
- **Claude Coding Principles** — claude_think_before_coding, claude_simplicity_first, claude_surgical_changes, claude_goal_driven_execution [EXTRACTED 1.00]
- **Admin authentication flow** — authform_authform, authform_handlesubmit, admin_index_adminpage, adminlayout_handlelogout, adminlayout_adminlayout [INFERRED 0.90]
- **Formation management lifecycle (CRUD + share link)** — admin_sessions_sessionspage, admin_sessions_loadformations, admin_sessions_handlecreate, admin_sessions_handledelete, admin_sessions_handlecopy, api_sessions_handler, utils_readjsonfile, utils_writejsonfile, utils_generatehexid [INFERRED 0.90]
- **Survey response data lifecycle (collect -> store -> visualize)** — survey_surveypage, survey_handlesubmit, api_sessions_handler, admin_resultats_resultatspage, admin_resultats_getstats, simplewordcloud_simplewordcloud, admin_sessions_countwords [INFERRED 0.85]
- **IA semantic-normalization pipeline** — analyze_handler, analyze_callia, analyze_parsnormalizedoutput, data_config_prompt_attentes_md, data_config_prompt_craintes_md [INFERRED 0.92]
- **Admin authentication flow** — auth_handler, auth_hasvalidhash, logout_handler, spec_settings_json_schema [INFERRED 0.88]
- **Participant email recap flow** — email_handler, sessionid_handler, spec_transilio_brand, spec_flux_thankyou_step, spec_settings_json_schema [INFERRED 0.85]

## Communities

### Community 0 - "Sessions & Settings API"
Cohesion: 0.16
Nodes (14): SessionsPage handleCreate (POST /api/sessions), SessionsPage handleDelete (DELETE /api/sessions), SessionsPage loadFormations (GET /api/sessions), API handler /api/craintes (GET fears options), API handler /api/sessions (GET/POST/DELETE formations), API handler /api/settings (GET settings.json), handler(), handler() (+6 more)

### Community 1 - "IA Analysis & Email"
Cohesion: 0.15
Nodes (16): handler(), prompt_attentes.md (Benefits IA normalization prompt), prompt_craintes.md (Fears IA normalization prompt), Efficience (umbrella term: gain de temps, productivite, automatisation), handler(), hardReload(), Task 5: Formation Management API (plan), Task 10: Deployment Preparation (plan) (+8 more)

### Community 2 - "IA Provider Adapters"
Cohesion: 0.29
Nodes (10): callIa(), cleanTerm(), cleanTerm(), isSeparatorTerm(), parseNormalizedOutput(), parseNormalizedOutput(), PROVIDER_URLS, IA Provider: Mistral API (+2 more)

### Community 3 - "Admin Auth"
Cohesion: 0.24
Nodes (7): readPromptFile(), handler(), hasValidHash(), Task 4: Admin Authentication (plan), handler(), handler(), readFileSync()

### Community 4 - "Survey UI & Theming"
Cohesion: 0.28
Nodes (7): ResultatsPage getStats (aggregates keywords), SessionsPage countWords (iterates responses.needs/fears), SessionsPage handleCopy (clipboard for survey URL), Home handleJoinWithCode (redirects to /survey), Home(), SurveyPage(), Transilio design tokens (tailwind theme)

### Community 5 - "Admin Components"
Cohesion: 0.25
Nodes (6): AdminPage (setup-check, renders AuthForm), ResultatsPage (admin results + word cloud), SessionsPage (formation CRUD admin), AdminLayout(), AuthForm(), SimpleWordCloud()

### Community 6 - "Phonetic Code Generator"
Cohesion: 1.0
Nodes (0): 

### Community 7 - "App Shell"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "Results Page"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Sessions Admin Page"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Admin Home Page"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Graph Artifacts"
Cohesion: 1.0
Nodes (2): graphify visualization (graph.html), Graph extraction report (GRAPH_REPORT.md)

### Community 12 - "Tailwind Config"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "PostCSS Config"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Think Before Coding"
Cohesion: 1.0
Nodes (1): Think Before Coding Principle

### Community 16 - "Simplicity First"
Cohesion: 1.0
Nodes (1): Simplicity First Principle

### Community 17 - "Surgical Changes"
Cohesion: 1.0
Nodes (1): Surgical Changes Principle

### Community 18 - "Goal-Driven Execution"
Cohesion: 1.0
Nodes (1): Goal-Driven Execution Principle

### Community 19 - "Admin Logout Handler"
Cohesion: 1.0
Nodes (1): AdminLayout handleLogout (calls /api/admin/logout)

### Community 20 - "Auth Form Submit"
Cohesion: 1.0
Nodes (1): AuthForm handleSubmit (POSTs to /api/admin/auth)

### Community 21 - "Survey Submit"
Cohesion: 1.0
Nodes (1): SurveyPage handleSubmit (POSTs to /api/session/[id])

### Community 22 - "Code Generation Handler"
Cohesion: 1.0
Nodes (1): SurveyPage handleGenerateCode (phonetic participant code)

### Community 23 - "Results Analyze Handler"
Cohesion: 1.0
Nodes (1): ResultatsPage handleAnalyze (POSTs to /api/admin/analyze)

### Community 24 - "Results Export Handler"
Cohesion: 1.0
Nodes (1): ResultatsPage handleExport (JSON download)

## Knowledge Gaps
- **28 isolated node(s):** `Think Before Coding Principle`, `Simplicity First Principle`, `Surgical Changes Principle`, `Goal-Driven Execution Principle`, `AdminLayout handleLogout (calls /api/admin/logout)` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Phonetic Code Generator`** (2 nodes): `generatePhoneticCode()`, `generateCode.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Shell`** (2 nodes): `MyApp()`, `_app.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Results Page`** (2 nodes): `resultats.js`, `ResultatsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sessions Admin Page`** (2 nodes): `sessions.js`, `SessionsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Home Page`** (2 nodes): `AdminPage()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Graph Artifacts`** (2 nodes): `graphify visualization (graph.html)`, `Graph extraction report (GRAPH_REPORT.md)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Config`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Think Before Coding`** (1 nodes): `Think Before Coding Principle`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Simplicity First`** (1 nodes): `Simplicity First Principle`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Surgical Changes`** (1 nodes): `Surgical Changes Principle`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Goal-Driven Execution`** (1 nodes): `Goal-Driven Execution Principle`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Logout Handler`** (1 nodes): `AdminLayout handleLogout (calls /api/admin/logout)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Form Submit`** (1 nodes): `AuthForm handleSubmit (POSTs to /api/admin/auth)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Survey Submit`** (1 nodes): `SurveyPage handleSubmit (POSTs to /api/session/[id])`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Code Generation Handler`** (1 nodes): `SurveyPage handleGenerateCode (phonetic participant code)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Results Analyze Handler`** (1 nodes): `ResultatsPage handleAnalyze (POSTs to /api/admin/analyze)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Results Export Handler`** (1 nodes): `ResultatsPage handleExport (JSON download)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `readJsonFile()` connect `Sessions & Settings API` to `IA Analysis & Email`, `Admin Auth`?**
  _High betweenness centrality (0.284) - this node is a cross-community bridge._
- **Why does `handler()` connect `IA Analysis & Email` to `Sessions & Settings API`, `IA Provider Adapters`, `Admin Auth`?**
  _High betweenness centrality (0.206) - this node is a cross-community bridge._
- **Why does `API handler /api/sessions (GET/POST/DELETE formations)` connect `Sessions & Settings API` to `Survey UI & Theming`, `Admin Components`?**
  _High betweenness centrality (0.206) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `readJsonFile()` (e.g. with `handler()` and `handler()`) actually correct?**
  _`readJsonFile()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `handler()` (e.g. with `readJsonFile()` and `writeJsonFile()`) actually correct?**
  _`handler()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `SurveyPage()` (e.g. with `SessionsPage countWords (iterates responses.needs/fears)` and `ResultatsPage (admin results + word cloud)`) actually correct?**
  _`SurveyPage()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `API handler /api/sessions (GET/POST/DELETE formations)` (e.g. with `ensureDir()` and `SessionsPage (formation CRUD admin)`) actually correct?**
  _`API handler /api/sessions (GET/POST/DELETE formations)` has 2 INFERRED edges - model-reasoned connections that need verification._