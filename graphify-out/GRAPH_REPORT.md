# Graph Report - .  (2026-06-03)

## Corpus Check
- Corpus is ~49,758 words - fits in a single context window. You may not need a graph.

## Summary
- 333 nodes · 541 edges · 46 communities detected
- Extraction: 61% EXTRACTED · 39% INFERRED · 0% AMBIGUOUS · INFERRED: 213 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Tenant Admin UI & API|Tenant Admin UI & API]]
- [[_COMMUNITY_Tenant Lifecycle & Session Handlers|Tenant Lifecycle & Session Handlers]]
- [[_COMMUNITY_IA Analysis Pipeline & Prompts|IA Analysis Pipeline & Prompts]]
- [[_COMMUNITY_RGPD Analytics & Stats|RGPD Analytics & Stats]]
- [[_COMMUNITY_Super-Admin & Tenant Deletion|Super-Admin & Tenant Deletion]]
- [[_COMMUNITY_Magic Link & Tenant Onboarding|Magic Link & Tenant Onboarding]]
- [[_COMMUNITY_Admin Results & Sessions UI|Admin Results & Sessions UI]]
- [[_COMMUNITY_Email Transport & Settings|Email Transport & Settings]]
- [[_COMMUNITY_Webhooks (JSON + Pushover)|Webhooks (JSON + Pushover)]]
- [[_COMMUNITY_Super-Admin Dashboard|Super-Admin Dashboard]]
- [[_COMMUNITY_Analytics Tracker|Analytics Tracker]]
- [[_COMMUNITY_Migration Scripts|Migration Scripts]]
- [[_COMMUNITY_Survey Public Flow|Survey Public Flow]]
- [[_COMMUNITY_Rate Limiting & Auth Libs|Rate Limiting & Auth Libs]]
- [[_COMMUNITY_Auth Cookie Validation|Auth Cookie Validation]]
- [[_COMMUNITY_Email Recap Endpoint|Email Recap Endpoint]]
- [[_COMMUNITY_Word Cloud Component|Word Cloud Component]]
- [[_COMMUNITY_Tenant Public Lookup|Tenant Public Lookup]]
- [[_COMMUNITY_Tenant Formations API|Tenant Formations API]]
- [[_COMMUNITY_Setup Check Endpoint|Setup Check Endpoint]]
- [[_COMMUNITY_Public Survey Page|Public Survey Page]]
- [[_COMMUNITY_Pinia|Pinia]]
- [[_COMMUNITY_Cluster 22|Cluster 22]]
- [[_COMMUNITY_Cluster 23|Cluster 23]]
- [[_COMMUNITY_Cluster 24|Cluster 24]]
- [[_COMMUNITY_Cluster 25|Cluster 25]]
- [[_COMMUNITY_Cluster 26|Cluster 26]]
- [[_COMMUNITY_Cluster 27|Cluster 27]]
- [[_COMMUNITY_Cluster 28|Cluster 28]]
- [[_COMMUNITY_Cluster 29|Cluster 29]]
- [[_COMMUNITY_Cluster 30|Cluster 30]]
- [[_COMMUNITY_Cluster 31|Cluster 31]]
- [[_COMMUNITY_Cluster 32|Cluster 32]]
- [[_COMMUNITY_Cluster 33|Cluster 33]]
- [[_COMMUNITY_Cluster 34|Cluster 34]]
- [[_COMMUNITY_Cluster 35|Cluster 35]]
- [[_COMMUNITY_Cluster 36|Cluster 36]]
- [[_COMMUNITY_Cluster 37|Cluster 37]]
- [[_COMMUNITY_Cluster 38|Cluster 38]]
- [[_COMMUNITY_Cluster 39|Cluster 39]]
- [[_COMMUNITY_Cluster 40|Cluster 40]]
- [[_COMMUNITY_Cluster 41|Cluster 41]]
- [[_COMMUNITY_Cluster 42|Cluster 42]]
- [[_COMMUNITY_Cluster 43|Cluster 43]]
- [[_COMMUNITY_Cluster 44|Cluster 44]]
- [[_COMMUNITY_Cluster 45|Cluster 45]]

## God Nodes (most connected - your core abstractions)
1. `handler()` - 19 edges
2. `isValidTenantId()` - 18 edges
3. `createTenant()` - 16 edges
4. `getTenant()` - 13 edges
5. `SurveyPage()` - 13 edges
6. `getTenantSessions()` - 12 edges
7. `handler()` - 12 edges
8. `handler()` - 11 edges
9. `withMutex()` - 10 edges
10. `purgeStaleTenants()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Survey objective (collect AI expectations + fears)` --rationale_for--> `handler()`  [INFERRED]
  docs/superpowers/specs/2026-04-20-sondage-ia-design.md → pages/api/admin/analyze.js
- `hardReload()` --conceptually_related_to--> `handler()`  [INFERRED]
  public/hard-reload.html → pages/api/session/[sessionId].js
- `Survey objective (collect AI expectations + fears)` --rationale_for--> `handler()`  [INFERRED]
  docs/superpowers/specs/2026-04-20-sondage-ia-design.md → pages/api/session/[sessionId]/email.js
- `Transilio Brand Guidelines (colors + typography)` --rationale_for--> `handler()`  [INFERRED]
  docs/superpowers/specs/2026-04-20-sondage-ia-design.md → pages/api/session/[sessionId]/email.js
- `sendBeacon/keepalive tracker transport (no external SDK)` --feeds_into--> `recordEvent()`  [INFERRED]
  components/Analytics/Tracker.js → lib/analytics.js

## Hyperedges (group relationships)
- **Admin authentication flow** — authform_authform, authform_handlesubmit, admin_index_adminpage, adminlayout_handlelogout, adminlayout_adminlayout [INFERRED 0.90]
- **Formation management lifecycle (CRUD + share link)** — admin_sessions_sessionspage, admin_sessions_loadformations, admin_sessions_handlecreate, admin_sessions_handledelete, admin_sessions_handlecopy, api_sessions_handler, utils_readjsonfile, utils_writejsonfile, utils_generatehexid [INFERRED 0.90]
- **Claude Coding Principles** — claude_think_before_coding, claude_simplicity_first, claude_surgical_changes, claude_goal_driven_execution [EXTRACTED 1.00]
- **Tenant lifecycle: create → magic-link → consume → session → activity → purge** — tenants_createtenant, tenants_createmagiclink, tenants_consumemagiclink, auth_registersessiontoken, tenants_recordactivity, tenants_purgestaletenant [INFERRED 0.90]
- **Magic-link delivery: validate → API → create → email** — accessappmodal_default, accessappmodal_api_endpoint, tenants_createmagiclink, email_sendemail [INFERRED 0.80]
- **Webhook fire-and-forget on tenant.created and tenant.deleted** — tenants_createtenant, tenants_deletetenant, webhook_firewebhook, webhook_sendwebhook, webhook_supported_events [INFERRED 0.90]
- **Two cookie-based auth schemes: tenant session + super-admin** — auth_magic_link_design, auth_cookienamefor, superadmin_2fa_design, superadmin_setsuperadmincookie [INFERRED 0.85]
- **Analytics pipeline: Tracker → /api/track → recordEvent → JSONL → readAggregates** — app_myapp, tracker_default, tracker_sendbeacon_usage, analytics_recordevent, analytics_readevents, analytics_readaggregates [INFERRED 0.85]
- **Shared data layout: data/tenants/[tenantId]/{tenant.json,sessions.json}** — tenants_data_layout, tenants_gettenant, tenants_createtenant, tenants_recordactivity, tenants_purgestaletenant, migrate_script [INFERRED 0.95]
- **data/config/settings.json shared by super-admin, email, webhooks** — superadmin_getsuperadminemail, email_sendemail, webhook_sendwebhook [INFERRED 0.80]
- **Rate-limiting used to protect tenant access-link API and request-link flows** — rate_limit_ratelimit, rate_limit_checkratelimit, accessappmodal_default [INFERRED 0.70]
- **Magic link auth chain** — index_home, api_tenant_request_link_handler, api_tenant_consume_magic_link_handler, admin_tenantid_index_adminredirect, admin_tenantid_sondages_tenantsondagespage [EXTRACTED 0.90]
- **Respondent survey submission chain** — survey_surveypage, api_tenant_tenantid_session_sessionid_lookup_handler, api_tenant_tenantid_session_sessionid_handler, api_tenant_tenantid_session_sessionid_email_handler [EXTRACTED 0.95]
- **Admin results view + IA analysis chain** — admin_tenantid_resultats_resultatspage, api_tenant_tenantid_me_handler, api_tenant_tenantid_sondages_handler, api_tenant_tenantid_session_sessionid_handler, api_tenant_tenantid_analyze_handler [EXTRACTED 0.95]
- **Super-admin dashboard + purge chain** — super_admin_dashboard_superadmindashboard, super_admin_activity_superadminactivity, super_admin_login_superadminlogin [INFERRED 0.80]
- **Tenant isolation endpoints group** — api_tenant_tenantid_sondages_handler, api_tenant_tenantid_session_sessionid_handler, api_tenant_tenantid_session_sessionid_lookup_handler, api_tenant_tenantid_session_sessionid_email_handler, api_tenant_tenantid_analyze_handler, api_tenant_tenantid_me_handler [EXTRACTED 0.95]
- **Deprecated 410-Gone endpoint migration set** — logout_handler, auth_handler, analyze_handler, setup_check_handler, session_sessionid_handler, session_sessionid_email_handler, deprecated_endpoint_pattern [EXTRACTED 1.00]
- **Super-admin API surface (auth, tenants, activity, stats, export)** — super_admin_login_handler, super_admin_logout_handler, super_admin_tenants_handler, super_admin_activity_handler, super_admin_activity_export_handler, super_admin_stats_daily_handler, super_admin_tenantid_delete_handler, purge_handler [INFERRED 0.90]
- **IA normalization prompt pair (craintes + attentes)** — prompt_craintes_md, prompt_attentes_md, fears_prompt_structure, benefits_prompt_structure [INFERRED 0.90]
- **Graphify output artifacts (graph.html, report, prior query)** — graph_html_visualization, graph_report_md, readjsonfile_bridge_query, graphify_god_node_readjsonfile, graphify_ia_normalization_hyperedge [INFERRED 0.85]

## Communities

### Community 0 - "Tenant Admin UI & API"
Cohesion: 0.08
Nodes (40): AdminIndex, AdminRedirect, ResultatsPage, TenantSondagesPage, AdminLayout, POST /api/tenant/logout, Anti-Exfiltration Responses Design, Anti-Hallucination Originals Filter (+32 more)

### Community 1 - "Tenant Lifecycle & Session Handlers"
Cohesion: 0.1
Nodes (34): handler(), handler(), hardReload(), Task 5: Formation Management API (plan), 30-day auto-delete retention claim, handler(), handler(), migrate-to-tenants idempotent migration script (+26 more)

### Community 2 - "IA Analysis Pipeline & Prompts"
Cohesion: 0.08
Nodes (30): callIa(), cleanTerm(), filterOriginalsToSource(), handler(), isSeparatorTerm(), normalizeForCompare(), parseNormalizedOutput(), readPromptFile() (+22 more)

### Community 3 - "RGPD Analytics & Stats"
Cohesion: 0.12
Nodes (20): getCountry(), getDeviceType(), hashVisitor(), JSON-Lines Append-Only Analytics Storage, normalizeTenantIdFilter(), readAggregates(), readEvents(), recordEvent() (+12 more)

### Community 4 - "Super-Admin & Tenant Deletion"
Cohesion: 0.15
Nodes (21): handler(), parseTenantIds(), handler(), Manual tenant delete with optional archive-to-data/archive flow, handler(), purgeStaleTenants (30-day threshold, dryRun support), POST /api/super-admin/tenants/[tenantId]/delete handler, Super-Admin 2FA: settings.json email + env password, HMAC-SHA256 signed cookie (+13 more)

### Community 5 - "Magic Link & Tenant Onboarding"
Cohesion: 0.15
Nodes (19): POST /api/tenant/request-link (magic link issuance), AccessAppModal (multi-phase: input/confirmCreate/success), Phase state machine: input → confirmCreate → success, Hero (landing CTA opener), escapeHtml(), handler(), MAGIC_LINK_TEMPLATE(), generateSessionId() (+11 more)

### Community 6 - "Admin Results & Sessions UI"
Cohesion: 0.11
Nodes (17): ResultatsPage getStats (aggregates keywords), ResultatsPage (admin results + word cloud), SessionsPage countWords (iterates responses.needs/fears), SessionsPage handleCopy (clipboard for survey URL), SessionsPage handleCreate (POST /api/sessions), SessionsPage handleDelete (DELETE /api/sessions), SessionsPage loadFormations (GET /api/sessions), SessionsPage (formation CRUD admin) (+9 more)

### Community 7 - "Email Transport & Settings"
Cohesion: 0.2
Nodes (11): API handler /api/craintes (GET fears options), API handler /api/settings (GET settings.json), Session email recap, escapeHtml(), getSettings(), handler(), sendEmail(), SMTP Transport (Nodemailer, shared credentials) (+3 more)

### Community 8 - "Webhooks (JSON + Pushover)"
Cohesion: 0.29
Nodes (9): readFileSync(), buildMessage(), fireWebhook(), getWebhookConfig(), HMAC-SHA256 webhook signing (X-Webhook-Signature), Pushover mode (form-urlencoded, env creds priority), readSettings(), sendWebhook() (+1 more)

### Community 9 - "Super-Admin Dashboard"
Cohesion: 0.27
Nodes (4): formatRelative(), PurgeReportPanel(), statusBadge(), SuperAdminDashboard()

### Community 10 - "Analytics Tracker"
Cohesion: 0.29
Nodes (4): MyApp(), Tracker (pageview/pageview_duration), extractTenantId(), sendBeacon/keepalive tracker transport (no external SDK)

### Community 11 - "Migration Scripts"
Cohesion: 0.6
Nodes (5): chmod600(), exists(), logHeader(), main(), readJson()

### Community 12 - "Survey Public Flow"
Cohesion: 0.53
Nodes (4): buildExportUrl(), deviceEmoji(), formatTs(), SuperAdminActivity()

### Community 13 - "Rate Limiting & Auth Libs"
Cohesion: 0.4
Nodes (5): CSV export with UTF-8 BOM (Excel-compatible), Daily stats stacked by tenant (multi-tenant byDay decomposition), GET /api/super-admin/activity/export handler, GET /api/super-admin/activity handler, GET /api/super-admin/stats/daily handler

### Community 14 - "Auth Cookie Validation"
Cohesion: 0.67
Nodes (4): checkRateLimit, clientIp, In-Memory Sliding-Window Rate Limiter, rateLimit

### Community 15 - "Email Recap Endpoint"
Cohesion: 0.67
Nodes (0): 

### Community 16 - "Word Cloud Component"
Cohesion: 0.67
Nodes (3): HowItWorks (3-step explainer), STEPS list (Create / Share / Analyze), SimpleWordCloud

### Community 17 - "Tenant Public Lookup"
Cohesion: 0.67
Nodes (3): Super-admin dual-factor auth (email + password, HMAC-signed cookie), POST /api/super-admin/login handler, POST /api/super-admin/logout handler

### Community 18 - "Tenant Formations API"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Setup Check Endpoint"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Public Survey Page"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Pinia"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Cluster 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Cluster 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Cluster 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Cluster 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Cluster 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Cluster 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Cluster 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Cluster 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Cluster 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Cluster 31"
Cohesion: 1.0
Nodes (2): Public tenant endpoint design (id+name only, no email/tokens), GET /api/tenant/public/[tenantId] handler

### Community 32 - "Cluster 32"
Cohesion: 1.0
Nodes (2): Transilio brand logo (public/logo-transilio.png), Transilio brand concept (multi-tenant lead magnet)

### Community 33 - "Cluster 33"
Cohesion: 1.0
Nodes (2): GET /api/super-admin/tenants handler, Tenant wordclouds aggregation (needs+fears across all sessions)

### Community 34 - "Cluster 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Cluster 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Cluster 36"
Cohesion: 1.0
Nodes (1): AuthForm handleSubmit (POSTs to /api/admin/auth)

### Community 37 - "Cluster 37"
Cohesion: 1.0
Nodes (1): ResultatsPage handleAnalyze (POSTs to /api/admin/analyze)

### Community 38 - "Cluster 38"
Cohesion: 1.0
Nodes (1): ResultatsPage handleExport (JSON download)

### Community 39 - "Cluster 39"
Cohesion: 1.0
Nodes (1): Think Before Coding Principle

### Community 40 - "Cluster 40"
Cohesion: 1.0
Nodes (1): Simplicity First Principle

### Community 41 - "Cluster 41"
Cohesion: 1.0
Nodes (1): Surgical Changes Principle

### Community 42 - "Cluster 42"
Cohesion: 1.0
Nodes (1): Goal-Driven Execution Principle

### Community 43 - "Cluster 43"
Cohesion: 1.0
Nodes (1): Task 10: Deployment Preparation (plan)

### Community 44 - "Cluster 44"
Cohesion: 1.0
Nodes (1): Step 4: Thank you + email recap

### Community 45 - "Cluster 45"
Cohesion: 1.0
Nodes (1): Ping healthcheck

## Knowledge Gaps
- **56 isolated node(s):** `AuthForm component (admin password setup/login)`, `AuthForm handleSubmit (POSTs to /api/admin/auth)`, `ResultatsPage handleAnalyze (POSTs to /api/admin/analyze)`, `ResultatsPage handleExport (JSON download)`, `SessionsPage loadFormations (GET /api/sessions)` (+51 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Tenant Formations API`** (2 nodes): `HowItWorks.js`, `HowItWorks()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Setup Check Endpoint`** (2 nodes): `Hero.js`, `Hero()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Public Survey Page`** (2 nodes): `AccessAppModal()`, `AccessAppModal.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pinia`** (2 nodes): `SuperAdminLayout.js`, `SuperAdminLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 22`** (2 nodes): `LegalFooter.js`, `LegalFooter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 23`** (2 nodes): `printReport()`, `purge-stale-tenants.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 24`** (2 nodes): `generatePhoneticCode()`, `generateCode.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 25`** (2 nodes): `AdminIndex()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 26`** (2 nodes): `resultats.js`, `ResultatsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 27`** (2 nodes): `AdminRedirect()`, `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 28`** (2 nodes): `SuperAdminLogin()`, `login.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 29`** (2 nodes): `sessions.js`, `handler()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 30`** (2 nodes): `ping.js`, `handler()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 31`** (2 nodes): `Public tenant endpoint design (id+name only, no email/tokens)`, `GET /api/tenant/public/[tenantId] handler`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 32`** (2 nodes): `Transilio brand logo (public/logo-transilio.png)`, `Transilio brand concept (multi-tenant lead magnet)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 33`** (2 nodes): `GET /api/super-admin/tenants handler`, `Tenant wordclouds aggregation (needs+fears across all sessions)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 34`** (1 nodes): `next.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 35`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 36`** (1 nodes): `AuthForm handleSubmit (POSTs to /api/admin/auth)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 37`** (1 nodes): `ResultatsPage handleAnalyze (POSTs to /api/admin/analyze)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 38`** (1 nodes): `ResultatsPage handleExport (JSON download)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 39`** (1 nodes): `Think Before Coding Principle`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 40`** (1 nodes): `Simplicity First Principle`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 41`** (1 nodes): `Surgical Changes Principle`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 42`** (1 nodes): `Goal-Driven Execution Principle`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 43`** (1 nodes): `Task 10: Deployment Preparation (plan)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 44`** (1 nodes): `Step 4: Thank you + email recap`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cluster 45`** (1 nodes): `Ping healthcheck`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `handler()` connect `IA Analysis Pipeline & Prompts` to `Tenant Admin UI & API`, `Tenant Lifecycle & Session Handlers`, `Email Transport & Settings`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `isValidTenantId()` connect `Tenant Lifecycle & Session Handlers` to `Tenant Admin UI & API`, `IA Analysis Pipeline & Prompts`, `Magic Link & Tenant Onboarding`, `Email Transport & Settings`, `Analytics Tracker`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `requireSuperAdminApi()` connect `Super-Admin & Tenant Deletion` to `Tenant Lifecycle & Session Handlers`, `RGPD Analytics & Stats`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `handler()` (e.g. with `isValidTenantId()` and `requireTenantApi()`) actually correct?**
  _`handler()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `isValidTenantId()` (e.g. with `getTenant()` and `getTenantSessions()`) actually correct?**
  _`isValidTenantId()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `createTenant()` (e.g. with `handler()` and `SMTP Transport (Nodemailer, shared credentials)`) actually correct?**
  _`createTenant()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `getTenant()` (e.g. with `isValidTenantId()` and `handler()`) actually correct?**
  _`getTenant()` has 5 INFERRED edges - model-reasoned connections that need verification._