/**
 * POST /api/tenant/[tenantId]/analyze
 *
 * Body: { sessionId: string }
 *
 * Lance l'analyse IA sur une session du tenant.
 * Écrit `normalizedKeywords` dans la session, qui sert à afficher
 * le nuage de mots thématiques.
 *
 * Auth requise (cookie survey_session_${tenantId}).
 */

import path from 'path'
import { readJsonFile, writeJsonFile, readFileSync } from '../../../../lib/utils.js'
import { getTenantSessions, writeTenantSessions, withMutex, recordActivity, maybeRunPurge } from '../../../../lib/tenants.js'
import { isValidTenantId } from '../../../../lib/validate.js'
import { requireTenantApi } from '../../../../lib/auth.js'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'config', 'settings.json')
const PROMPT_ATTENTES_PATH = path.join(process.cwd(), 'data', 'config', 'prompt_attentes.md')
const PROMPT_CRAINTES_PATH = path.join(process.cwd(), 'data', 'config', 'prompt_craintes.md')

const PROVIDER_URLS = {
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  ollama: 'http://localhost:11434/api/chat',
}

function readPromptFile(filePath, fallback) {
  try {
    return readFileSync(filePath, 'utf8')
  } catch (e) {
    return fallback
  }
}

function isSeparatorTerm(term) {
  var trimmed = term.trim()
  if (trimmed.length < 3) return true
  var dashCount = (trimmed.match(/-/g) || []).length
  return dashCount / trimmed.length > 0.5 && dashCount >= 5
}

function cleanTerm(term) {
  var cleaned = term
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/^["']|["']$/g, '').trim()
  return cleaned
}

function parseNormalizedOutput(content, termList) {
  var results = []
  var lines = content.split('\n')
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim()
    if (!line) continue
    var pipeMatch = line.match(/^(.+?)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*$/)
    if (pipeMatch) {
      var term = cleanTerm(pipeMatch[1].trim())
      var originalsStr = pipeMatch[2].trim()
      var originals = originalsStr.split(',').map(function(s) { return s.trim() }).filter(function(s) { return s && s.length > 2 })
      var iaCount = parseInt(pipeMatch[3], 10) || 1
      var count = originals.length > 0 ? originals.length : iaCount
      if (term && term.length > 0 && !isSeparatorTerm(term)) {
        results.push({ term, occurrences: count, originals })
      }
      continue
    }
    var pipeNoCount = line.match(/^(.+?)\s*\|\s*(.+?)\s*$/)
    if (pipeNoCount) {
      var term2 = cleanTerm(pipeNoCount[1].trim())
      var originalsStr2 = pipeNoCount[2].trim()
      var originals2 = originalsStr2.split(',').map(function(s) { return s.trim() }).filter(function(s) { return s && s.length > 2 })
      if (term2 && term2.length > 0 && !isSeparatorTerm(term2)) {
        results.push({ term: term2, occurrences: originals2.length > 0 ? originals2.length : 1, originals: originals2 })
      }
    }
  }
  return results
}

// Filtre les résultats parsés pour ne conserver que les `originals`
// qui matchent (en normalisé) une expression de la liste source. Cela
// élimine les hallucinations du modèle (termes qu'il a inventés et
// qui ne figuraient pas dans la liste fournie).
function filterOriginalsToSource(results, termList) {
  // Index normalisé → original (on prend la première occurrence)
  var sourceNormToOrig = new Map()
  for (var i = 0; i < termList.length; i++) {
    var orig = termList[i]
    var norm = normalizeForCompare(orig)
    if (norm && !sourceNormToOrig.has(norm)) {
      sourceNormToOrig.set(norm, orig)
    }
  }
  var used = new Set()
  var out = []
  for (var i2 = 0; i2 < results.length; i2++) {
    var entry = results[i2]
    var keptOriginals = []
    for (var j = 0; j < (entry.originals || []).length; j++) {
      var o = entry.originals[j]
      var n = normalizeForCompare(o)
      if (sourceNormToOrig.has(n) && !used.has(n)) {
        keptOriginals.push(sourceNormToOrig.get(n))
        used.add(n)
      }
    }
    if (keptOriginals.length === 0) continue
    out.push({
      term: entry.term,
      occurrences: keptOriginals.length,
      originals: keptOriginals,
    })
  }
  return out
}

function normalizeForCompare(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[\s ]+/g, ' ')
    .replace(/^[«»"'\-–—\.,;:!?()\[\]{}]+|[«»"'\-–—\.,;:!?()\[\]{}]+$/g, '')
    .replace(/^(le|la|les|un|une|des|de|du|d')\s+/g, '')
    .replace(/\s+(le|la|les|un|une|des|de|du|d')$/g, '')
    .trim()
}

async function callIa(apiUrl, provider, model, apiKey, prompt, termList, label) {
  var headers = { 'Content-Type': 'application/json' }
  var body
  if (provider === 'ollama') {
    body = { model, messages: [{ role: 'user', content: prompt }], stream: false, options: { temperature: 0 } }
  } else {
    headers['Authorization'] = 'Bearer ' + apiKey
    body = { model, messages: [{ role: 'user', content: prompt }], max_tokens: 2048, temperature: 0 }
  }
  var response
  try {
    response = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify(body) })
  } catch (fetchErr) {
    // Distingue les erreurs de transport (service IA injoignable) des
    // erreurs de l'IA elle-même. Permet au caller de renvoyer 503
    // (service_unavailable) plutôt que 500 (internal_error) générique.
    var cause = fetchErr && fetchErr.cause
    var code = cause && cause.code
    var hint = ''
    if (code === 'ECONNREFUSED') hint = ' (service IA injoignable — vérifiez que le service tourne sur ' + apiUrl + ')'
    else if (code === 'ENOTFOUND') hint = ' (hôte introuvable — vérifiez l\'URL du service IA)'
    else if (code === 'ETIMEDOUT' || fetchErr.name === 'AbortError') hint = ' (timeout — service IA trop lent ou injoignable)'
    var wrapped = new Error('IA service unreachable' + hint + ': ' + (fetchErr.message || fetchErr))
    wrapped.code = 'IA_UNREACHABLE'
    wrapped.causeCode = code || null
    throw wrapped
  }
  var data
  try {
    data = await response.json()
  } catch (e) {
    var errorText = await response.text()
    throw new Error('IA API response parsing error: ' + e.message + ' - ' + errorText)
  }
  if (!response.ok) {
    var errorMessage = data?.error?.message || data?.error || JSON.stringify(data)
    throw new Error('IA API error: ' + response.status + ' - ' + errorMessage)
  }
  var content = provider === 'ollama'
    ? (data.message?.content || '')
    : (data.choices?.[0]?.message?.content || '')
  console.log('--- raw IA response ' + label + ' ---')
  console.log(content)
  console.log('--- end raw IA response ' + label + ' ---')
  return parseNormalizedOutput(content, termList)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { tenantId } = req.query
  if (!isValidTenantId(tenantId)) {
    return res.status(400).json({ error: 'invalid_tenantId' })
  }

  // Auth requise
  const ctx = await requireTenantApi(req, res, tenantId)
  if (!ctx) return

  maybeRunPurge()

  const { sessionId } = req.body || {}
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'invalid_sessionId' })
  }

  try {
    const settings = await readJsonFile(SETTINGS_PATH)
    const sessions = await getTenantSessions(tenantId)
    const sessionData = sessions[sessionId]
    if (!sessionData) {
      return res.status(404).json({ error: 'session_not_found' })
    }
    const responses = sessionData.responses || []
    if (responses.length === 0) {
      return res.status(400).json({ error: 'no_responses' })
    }

    const rawNeeds = {}
    const rawFears = {}
    responses.forEach((r) => {
      const needsArr = Array.isArray(r.needs) ? r.needs : []
      const fearsArr = Array.isArray(r.fears) ? r.fears : []
      needsArr.forEach((w) => { rawNeeds[w] = (rawNeeds[w] || 0) + 1 })
      fearsArr.forEach((w) => { rawFears[w] = (rawFears[w] || 0) + 1 })
    })
    const needsList = Object.keys(rawNeeds)
    const fearsList = Object.keys(rawFears)
    if (needsList.length === 0 && fearsList.length === 0) {
      return res.status(400).json({ error: 'no_keywords' })
    }

    const iaConfig = settings.ia || {}
    const provider = iaConfig.provider || 'mistral'
    const model = iaConfig.model || 'mistral-medium'
    const apiKey = process.env.IA_API_KEY || ''
    const apiUrl = provider === 'ollama'
      ? ((iaConfig.ollama_url || 'http://localhost:11434').replace(/\/$/, '') + '/api/chat')
      : PROVIDER_URLS[provider] || PROVIDER_URLS.mistral

    if (!apiKey && provider !== 'ollama') {
      return res.status(500).json({ error: 'ia_api_key_missing' })
    }

    const needsPromptTemplate = readPromptFile(PROMPT_ATTENTES_PATH, 'Liste:\n{terms}')
    const fearsPromptTemplate = readPromptFile(PROMPT_CRAINTES_PATH, 'Liste:\n{terms}')
    const needsPrompt = needsPromptTemplate.replace('{terms}', needsList.join('\n'))
    const fearsPrompt = fearsPromptTemplate.replace('{terms}', fearsList.join('\n'))

    console.log('--- analyze start ---')
    console.log('tenantId:', tenantId, 'sessionId:', sessionId, 'provider:', provider, 'model:', model)
    console.log('terms input:')
    console.log('  attentes:', JSON.stringify(needsList))
    console.log('  craintes:', JSON.stringify(fearsList))
    console.log('--- prompt ATTENTES ---')
    console.log(needsPrompt)
    console.log('--- end prompt ATTENTES ---')
    console.log('--- prompt CRAINTES ---')
    console.log(fearsPrompt)
    console.log('--- end prompt CRAINTES ---')

    const [needsRaw, fearsRaw] = await Promise.all([
      callIa(apiUrl, provider, model, apiKey, needsPrompt, needsList, 'ATTENTES'),
      callIa(apiUrl, provider, model, apiKey, fearsPrompt, fearsList, 'CRAINTES'),
    ])

    // Filtre anti-hallucination : on ne conserve QUE les originals qui
    // matchent (en normalisé) une expression réellement présente dans
    // la liste source. Cela élimine les termes inventés par le modèle.
    const needsResult = filterOriginalsToSource(needsRaw, needsList)
    const fearsResult = filterOriginalsToSource(fearsRaw, fearsList)

    console.log('--- IA response ATTENTES (after filter) ---')
    console.log(JSON.stringify(needsResult, null, 2))
    console.log('--- IA response CRAINTES (after filter) ---')
    console.log(JSON.stringify(fearsResult, null, 2))

    // Persist (via mutex pour sérialiser avec les autres écritures)
    await withMutex(tenantId, async () => {
      const s = await getTenantSessions(tenantId)
      if (s[sessionId]) {
        s[sessionId].normalizedKeywords = { attentes: needsResult, craintes: fearsResult }
        await writeTenantSessions(tenantId, s)
      }
    })

    recordActivity(tenantId, { kind: 'admin', email: ctx.tenant.email })

    return res.status(200).json({
      success: true,
      normalizedKeywords: { attentes: needsResult, craintes: fearsResult },
      message: `Analyse terminée : ${needsResult.length} thèmes d'attentes, ${fearsResult.length} thèmes de craintes.`,
    })
  } catch (error) {
    console.error('analyze error:', error)
    // Distingue les erreurs de transport (service IA injoignable) des
    // erreurs métier. 503 = dépendances externes HS, le client peut
    // réessayer. 500 = bug interne.
    if (error && error.code === 'IA_UNREACHABLE') {
      return res.status(503).json({ error: 'ia_unreachable', message: error.message, causeCode: error.causeCode })
    }
    return res.status(500).json({ error: 'internal_error', message: error.message })
  }
}
