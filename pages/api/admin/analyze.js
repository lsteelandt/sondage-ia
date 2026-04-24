import path from 'path'
import { readJsonFile, writeJsonFile, readFileSync } from '../../../lib/utils'

const SESSIONS_PATH = path.join(process.cwd(), 'data', 'sessions.json')
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
  // Remove Markdown formatting (bold, italic) and surrounding quotes, then trim
  var cleaned = term
    .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove **bold**
    .replace(/__(.+?)__/g, '$1')       // Remove __bold__
    .replace(/\*(.+?)\*/g, '$1')        // Remove *italic*
    .replace(/_(.+?)_/g, '$1')          // Remove _italic_
    .replace(/^["']|["']$/g, '').trim()
  return cleaned
}

function parseNormalizedOutput(content, termList) {
  var results = []
  var lines = content.split('\n')

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim()
    if (!line) continue

    // Pattern: "Term" | originals | count
    var pipeMatch = line.match(/^(.+?)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*$/)
    if (pipeMatch) {
      var rawTerm = pipeMatch[1].trim()
      var term = cleanTerm(rawTerm)
      var originalsStr = pipeMatch[2].trim()

      var originals = originalsStr.split(',').map(function(s) { return s.trim() }).filter(function(s) { return s && s.length > 2 })

      // Use IA-provided count as fallback, but trust the originals.length
      var iaCount = parseInt(pipeMatch[3], 10) || 1
      var count = originals.length > 0 ? originals.length : iaCount

      if (term && term.length > 0 && !isSeparatorTerm(term)) {
        results.push({
          term: term,
          occurrences: count,
          originals: originals
        })
      }
      continue
    }

    // Pattern: Term | originals (no count)
    var pipeNoCount = line.match(/^(.+?)\s*\|\s*(.+?)\s*$/)
    if (pipeNoCount) {
      var rawTerm = pipeNoCount[1].trim()
      var term = cleanTerm(rawTerm)
      var originalsStr = pipeNoCount[2].trim()

      var originals = originalsStr.split(',').map(function(s) { return s.trim() }).filter(function(s) { return s && s.length > 2 })

      if (term && term.length > 0 && !isSeparatorTerm(term)) {
        results.push({
          term: term,
          occurrences: originals.length > 0 ? originals.length : 1,
          originals: originals
        })
      }
    }
  }

  return results
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    var settings = await readJsonFile(SETTINGS_PATH)
    var sessions = await readJsonFile(SESSIONS_PATH)

    var body = req.body
    var sessionId = body.sessionId

    if (!sessionId || !sessions[sessionId]) {
      return res.status(404).json({ error: 'Session non trouvée' })
    }

    var sessionData = sessions[sessionId]
    var responses = sessionData.responses || []

    if (responses.length === 0) {
      return res.status(400).json({ error: 'Aucune réponse à analyser' })
    }

    var rawNeeds = {}
    var rawFears = {}

    responses.forEach(function (response) {
      ;(response.needs || []).forEach(function (word) {
        rawNeeds[word] = (rawNeeds[word] || 0) + 1
      })
      ;(response.fears || []).forEach(function (word) {
        rawFears[word] = (rawFears[word] || 0) + 1
      })
    })

    var needsList = Object.keys(rawNeeds)
    var fearsList = Object.keys(rawFears)

    if (needsList.length === 0 && fearsList.length === 0) {
      return res.status(400).json({ error: 'Aucun mot-clé à analyser' })
    }

    var iaConfig = settings.ia || {}
    var provider = iaConfig.provider || 'mistral'
    var model = iaConfig.model || 'mistral-medium'
    var apiKey = process.env.IA_API_KEY || ''
    var apiUrl = provider === 'ollama'
      ? ((iaConfig.ollama_url || 'http://localhost:11434').replace(/\/$/, '') + '/api/chat')
      : PROVIDER_URLS[provider] || PROVIDER_URLS.mistral

    if (!apiKey && provider !== 'ollama') {
      return res.status(500).json({ error: 'Clé API IA non configurée' })
    }

    var needsPromptTemplate = readPromptFile(PROMPT_ATTENTES_PATH, 'Liste:\n{terms}')
    var fearsPromptTemplate = readPromptFile(PROMPT_CRAINTES_PATH, 'Liste:\n{terms}')

    var needsPrompt = needsPromptTemplate.replace('{terms}', needsList.join('\n'))
    var fearsPrompt = fearsPromptTemplate.replace('{terms}', fearsList.join('\n'))

    var needsResult = await callIa(apiUrl, provider, model, apiKey, needsPrompt, needsList, 'ATTENTES')
    var fearsResult = await callIa(apiUrl, provider, model, apiKey, fearsPrompt, fearsList, 'CRAINTES')

    sessions[sessionId].normalizedKeywords = {
      attentes: needsResult,
      craintes: fearsResult,
    }

    await writeJsonFile(SESSIONS_PATH, sessions)

    return res.status(200).json({
      success: true,
      normalizedKeywords: sessions[sessionId].normalizedKeywords,
    })
  } catch (error) {
    console.error('Analyze API error:', error)
    return res.status(500).json({ error: 'Erreur serveur: ' + error.message })
  }
}

async function callIa(apiUrl, provider, model, apiKey, prompt, termList, label) {
  var headers = { 'Content-Type': 'application/json' }
  var body

  if (provider === 'ollama') {
    body = { model: model, messages: [{ role: 'user', content: prompt }], stream: false }
  } else {
    headers['Authorization'] = 'Bearer ' + apiKey
    body = { model: model, messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }
  }

  console.error('=== IA REQUEST [' + label + '] ===')
  console.error('URL:', apiUrl)
  console.error('Model:', model)
  console.error('Prompt:', prompt)
  console.error('=============================')

  var response = await fetch(apiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  })

  var data
  try {
    data = await response.json()
  } catch (e) {
    var errorText = await response.text()
    console.error('IA API response parsing error:', e.message, 'Body:', errorText)
    throw new Error('IA API response parsing error: ' + e.message + ' - ' + errorText)
  }

  if (!response.ok) {
    var errorMessage = data?.error?.message || data?.error || JSON.stringify(data)
    throw new Error('IA API error: ' + response.status + ' - ' + errorMessage)
  }

  var content
  if (provider === 'ollama') {
    content = data.message?.content || ''
  } else {
    content = data.choices?.[0]?.message?.content || ''
  }

  console.error('=== IA RESPONSE [' + label + '] ===')
  console.error(content)
  console.error('=============================')

  try {
    return parseNormalizedOutput(content, termList)
  } catch (e) {
    console.error('parseNormalizedOutput error:', e.message)
    throw new Error('Parse error: ' + e.message)
  }
}
