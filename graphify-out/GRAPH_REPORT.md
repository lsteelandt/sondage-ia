# Graph Report - .  (2026-04-21)

## Corpus Check
- Corpus is ~11,011 words - fits in a single context window. You may not need a graph.

## Summary
- 66 nodes · 68 edges · 22 communities detected
- Extraction: 74% EXTRACTED · 26% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Session Management|API Session Management]]
- [[_COMMUNITY_Design Principles & Data Architecture|Design Principles & Data Architecture]]
- [[_COMMUNITY_Technical Stack Configuration|Technical Stack Configuration]]
- [[_COMMUNITY_Admin Authentication System|Admin Authentication System]]
- [[_COMMUNITY_Results Visualization|Results Visualization]]
- [[_COMMUNITY_Authentication Handler|Authentication Handler]]
- [[_COMMUNITY_Survey Flow Design|Survey Flow Design]]
- [[_COMMUNITY_Admin Layout Component|Admin Layout Component]]
- [[_COMMUNITY_Auth Form Component|Auth Form Component]]
- [[_COMMUNITY_Word Cloud Component|Word Cloud Component]]
- [[_COMMUNITY_Phonetic Code Generator|Phonetic Code Generator]]
- [[_COMMUNITY_Main Application|Main Application]]
- [[_COMMUNITY_Survey Page Component|Survey Page Component]]
- [[_COMMUNITY_Home Page|Home Page]]
- [[_COMMUNITY_Admin Sessions Page|Admin Sessions Page]]
- [[_COMMUNITY_Admin Dashboard|Admin Dashboard]]
- [[_COMMUNITY_Logout Handler|Logout Handler]]
- [[_COMMUNITY_Setup Check API|Setup Check API]]
- [[_COMMUNITY_Tailwind Configuration|Tailwind Configuration]]
- [[_COMMUNITY_Next.js Configuration|Next.js Configuration]]
- [[_COMMUNITY_PostCSS Configuration|PostCSS Configuration]]
- [[_COMMUNITY_Application Configuration|Application Configuration]]

## God Nodes (most connected - your core abstractions)
1. `Sondage IA Application` - 8 edges
2. `readJsonFile()` - 6 edges
3. `ensureDir()` - 5 edges
4. `handler()` - 5 edges
5. `handler()` - 5 edges
6. `loadReponses()` - 5 edges
7. `Data Management System` - 5 edges
8. `writeJsonFile()` - 4 edges
9. `handler()` - 4 edges
10. `Public Survey Interface` - 4 edges

## Surprising Connections (you probably didn't know these)
- `handler()` --calls--> `generatePhoneticCode()`  [INFERRED]
  pages/api/session/[sessionId]/stagiaire.js → lib/generateCode.js
- `handler()` --calls--> `readJsonFile()`  [INFERRED]
  pages/api/craintes.js → lib/utils.js
- `handler()` --calls--> `generateHexId()`  [INFERRED]
  pages/api/sessions.js → lib/utils.js
- `Think Before Coding Principle` --rationale_for--> `Sondage IA Application`  [INFERRED]
  CLAUDE.md → docs/superpowers/specs/2026-04-20-sondage-ia-design.md
- `Surgical Changes Principle` --rationale_for--> `Data Management System`  [INFERRED]
  CLAUDE.md → docs/superpowers/plans/2026-04-20-sondage-ia-implementation.md

## Hyperedges (group relationships)
- **Survey Application Core Components** — impl_plan_auth_system, impl_plan_data_management, impl_plan_survey_interface, impl_plan_admin_interface, impl_plan_wordcloud [INFERRED 0.80]
- **Claude Coding Principles** — claude_think_before_coding, claude_simplicity_first, claude_surgical_changes, claude_goal_driven_execution [EXTRACTED 1.00]
- **Specification Document Sections** — spec_survey_application, spec_architecture, spec_flux_admin, spec_flux_stagiaire, spec_storage_formations, spec_storage_stagiaires, spec_security, spec_dependencies [EXTRACTED 1.00]

## Communities

### Community 0 - "API Session Management"
Cohesion: 0.22
Nodes (11): handler(), handler(), normalizeKeyword(), handler(), getReponsesPath(), handler(), loadReponses(), ensureDir() (+3 more)

### Community 1 - "Design Principles & Data Architecture"
Cohesion: 0.4
Nodes (6): Surgical Changes Principle, Think Before Coding Principle, Data Management System, Formations Data Structure, Stagiaires Data Structure, Sondage IA Application

### Community 2 - "Technical Stack Configuration"
Cohesion: 0.4
Nodes (5): Simplicity First Principle, Next.js Tech Stack, Word Cloud Visualization, System Architecture, Project Dependencies

### Community 3 - "Admin Authentication System"
Cohesion: 0.5
Nodes (4): Admin Interface, Authentication System, Admin User Flow, Security Requirements

### Community 4 - "Results Visualization"
Cohesion: 1.0
Nodes (2): ResultatsPage(), totalKeywords()

### Community 5 - "Authentication Handler"
Cohesion: 1.0
Nodes (2): handler(), hasValidHash()

### Community 6 - "Survey Flow Design"
Cohesion: 0.67
Nodes (3): Goal-Driven Execution Principle, Public Survey Interface, Stagiaire User Flow

### Community 7 - "Admin Layout Component"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "Auth Form Component"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Word Cloud Component"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Phonetic Code Generator"
Cohesion: 1.0
Nodes (1): generatePhoneticCode()

### Community 11 - "Main Application"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Survey Page Component"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Home Page"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Admin Sessions Page"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Admin Dashboard"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Logout Handler"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Setup Check API"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Tailwind Configuration"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Next.js Configuration"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "PostCSS Configuration"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Application Configuration"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **4 isolated node(s):** `Think Before Coding Principle`, `Simplicity First Principle`, `Surgical Changes Principle`, `Goal-Driven Execution Principle`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Admin Layout Component`** (2 nodes): `AdminLayout()`, `AdminLayout.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Form Component`** (2 nodes): `AuthForm()`, `AuthForm.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Word Cloud Component`** (2 nodes): `SimpleWordCloud.js`, `SimpleWordCloud()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Phonetic Code Generator`** (2 nodes): `generatePhoneticCode()`, `generateCode.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Application`** (2 nodes): `MyApp()`, `_app.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Survey Page Component`** (2 nodes): `survey.js`, `SurveyPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Home Page`** (2 nodes): `Home()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Sessions Page`** (2 nodes): `sessions.js`, `SessionsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Dashboard`** (2 nodes): `AdminPage()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Logout Handler`** (2 nodes): `handler()`, `logout.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Setup Check API`** (2 nodes): `setup-check.js`, `handler()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Configuration`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Configuration`** (1 nodes): `next.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Configuration`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Application Configuration`** (1 nodes): `app.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Sondage IA Application` connect `Design Principles & Data Architecture` to `Technical Stack Configuration`, `Admin Authentication System`, `Survey Flow Design`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `handler()` connect `API Session Management` to `Phonetic Code Generator`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `readJsonFile()` (e.g. with `handler()` and `handler()`) actually correct?**
  _`readJsonFile()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `ensureDir()` (e.g. with `handler()` and `handler()`) actually correct?**
  _`ensureDir()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `handler()` (e.g. with `readJsonFile()` and `generateHexId()`) actually correct?**
  _`handler()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `handler()` (e.g. with `readJsonFile()` and `ensureDir()`) actually correct?**
  _`handler()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Think Before Coding Principle`, `Simplicity First Principle`, `Surgical Changes Principle` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._