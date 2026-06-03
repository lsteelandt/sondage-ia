# Sondage IA Stagiaires Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-friendly survey application for collecting AI expectations and concerns from trainees, with admin interface for viewing results as word clouds.

**Architecture:** Next.js full-stack application with API routes, JSON file storage, bcrypt authentication, and responsive UI components.

**Tech Stack:** Next.js 14+, React 18, Tailwind CSS, bcrypt, react-wordcloud, nanoid, JSON file storage

---

## Project Setup

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.js`
- Create: `tailwind.config.js`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Initialize package.json**

```bash
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install next@14.1.0 react@18.2.0 react-dom@18.2.0
npm install bcrypt@5.1.1 nanoid@3.3.6
npm install react-wordcloud@2.0.0
npm install -D tailwindcss@3.4.1 postcss@8.4.31 autoprefixer@10.4.16
```

- [ ] **Step 3: Create Next.js config**

```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
```

- [ ] **Step 4: Initialize Tailwind CSS**

```bash
npx tailwindcss init -p
```

- [ ] **Step 5: Configure Tailwind**

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 6: Create .gitignore**

```
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js build
.next/
out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Data directory (sensitive)
data/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 7: Create basic README**

```markdown
# Sondage IA Stagiaires

Application web mobile pour collecter les attentes et craintes des stagiaires sur l'IA.

## Développement

```bash
npm install
npm run dev
```

## Structure

- `pages/` : Pages Next.js
- `components/` : Composants React
- `lib/` : Fonctions utilitaires
- `data/` : Stockage JSON
```

- [ ] **Step 8: Create directory structure**

```bash
mkdir -p pages/api pages/admin components lib data/formations data/config
```

- [ ] **Step 9: Commit initial setup**

```bash
git add .
git commit -m "feat: setup Next.js project with dependencies"
```

## Core Infrastructure

### Task 2: Configuration and Environment Setup

**Files:**
- Create: `.env.local`
- Create: `data/config/app.config.js`
- Modify: `pages/_app.js`

- [ ] **Step 1: Create environment file**

```bash
touch .env.local
```

Content:
```
NEXT_PUBLIC_APP_URL=http://localhost:3100
NEXT_PUBLIC_APP_NAME=Sondage IA
```

- [ ] **Step 2: Create app config**

```javascript
// data/config/app.config.js
export const APP_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Sondage IA',
  URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3100',
  SESSION_COOKIE_NAME: 'survey_admin_session',
  SESSION_MAX_AGE: 30 * 60 * 1000, // 30 minutes
}
```

- [ ] **Step 3: Create basic _app.js**

```javascript
// pages/_app.js
import '../styles/globals.css'
import { APP_CONFIG } from '../data/config/app.config.js'

function MyApp({ Component, pageProps }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp
```

- [ ] **Step 4: Create basic globals.css**

```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

- [ ] **Step 5: Commit configuration**

```bash
git add .
git commit -m "feat: add configuration and environment setup"
```

### Task 3: Utility Functions

**Files:**
- Create: `lib/utils.js`
- Create: `lib/generateCode.js`
- Create: `lib/hashPassword.js`

- [ ] **Step 1: Create utils.js**

```javascript
// lib/utils.js
import fs from 'fs/promises'
import path from 'path'

// Ensure directory exists
export async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

// Read JSON file
export async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {}
    }
    throw error
  }
}

// Write JSON file
export async function writeJsonFile(filePath, data) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// Generate random hex ID
export function generateHexId(length = 8) {
  return Math.floor(Math.random() * 0xffffffff).toString(16).padStart(length, '0')
}
```

- [ ] **Step 2: Create generateCode.js**

```javascript
// lib/generateCode.js
import { nanoid } from 'nanoid'

// Code phonétique facile à mémoriser
const PHONETIC_SETS = [
  ['B', 'P', 'V'],
  ['C', 'K', 'Q'],
  ['D', 'T'],
  ['F', 'V'],
  ['G', 'J'],
  ['L', 'R'],
  ['M', 'N'],
  ['S', 'Z'],
  ['CH', 'SH'],
  ['AN', 'ON', 'IN'],
  ['OU', 'EU'],
  ['AI', 'EI'],
  ['O', 'AU'],
  ['È', 'É', 'Ê'],
  ['À', 'Â'],
]

// Génère un code phonétique facile à retenir
export function generatePhoneticCode(length = 5) {
  const code = []
  for (let i = 0; i < length; i++) {
    const set = PHONETIC_SETS[Math.floor(Math.random() * PHONETIC_SETS.length)]
    code.push(set[Math.floor(Math.random() * set.length)])
  }
  return code.join('').toUpperCase()
}

// Vérifie si un code est facile à prononcer
export function isPhoneticEasy(code) {
  // Logique simple : éviter trop de consonnes consécutives
  const vowels = ['A', 'E', 'I', 'O', 'U', 'Y']
  let consecutiveConsonants = 0
  
  for (let char of code) {
    if (!vowels.includes(char)) {
      consecutiveConsonants++
      if (consecutiveConsonants > 2) return false
    } else {
      consecutiveConsonants = 0
    }
  }
  return true
}
```

- [ ] **Step 3: Create hashPassword.js**

```javascript
// lib/hashPassword.js
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash)
}

// Générer un hash de test pour initialisation
export async function createInitialAdminPassword() {
  const defaultPassword = 'admin123'
  return await hashPassword(defaultPassword)
}
```

- [ ] **Step 4: Commit utilities**

```bash
git add lib/
git commit -m "feat: add utility functions for code generation and password hashing"
```

## Authentication System

### Task 4: Admin Authentication

**Files:**
- Create: `pages/api/admin/auth.js`
- Create: `pages/admin/middleware.js`
- Create: `components/Admin/AuthForm.js`
- Modify: `data/config/app.config.js`

- [ ] **Step 1: Create admin auth API**

```javascript
// pages/api/admin/auth.js
import fs from 'fs/promises'
import path from 'path'
import { hashPassword, verifyPassword } from '../../../lib/hashPassword.js'
import { APP_CONFIG } from '../../../data/config/app.config.js'

export default async function handler(req, res) {
  const { method } = req
  
  if (method === 'POST') {
    try {
      const { password } = req.body
      
      if (!password) {
        return res.status(400).json({ error: 'Password required' })
      }
      
      const adminPath = path.join(process.cwd(), 'data', 'admin.json')
      let adminData = {}
      
      try {
        const data = await fs.readFile(adminPath, 'utf-8')
        adminData = JSON.parse(data)
      } catch (error) {
        // First time setup - create admin password
        const hashedPassword = await hashPassword(password)
        adminData = { password: hashedPassword }
        await fs.writeFile(adminPath, JSON.stringify(adminData, null, 2))
        
        res.setHeader('Set-Cookie', [
          `${APP_CONFIG.SESSION_COOKIE_NAME}=setup; Path=/; Max-Age=${APP_CONFIG.SESSION_MAX_AGE}; HttpOnly; Secure; SameSite=Strict`
        ])
        
        return res.status(201).json({ 
          message: 'Admin account created successfully',
          firstTime: true 
        })
      }
      
      // Verify existing password
      const isValid = await verifyPassword(password, adminData.password)
      
      if (isValid) {
        res.setHeader('Set-Cookie', [
          `${APP_CONFIG.SESSION_COOKIE_NAME}=true; Path=/; Max-Age=${APP_CONFIG.SESSION_MAX_AGE}; HttpOnly; Secure; SameSite=Strict`
        ])
        
        return res.status(200).json({ 
          message: 'Authenticated successfully',
          firstTime: false 
        })
      } else {
        return res.status(401).json({ error: 'Invalid password' })
      }
    } catch (error) {
      console.error('Auth error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}
```

- [ ] **Step 2: Create middleware for admin routes**

```javascript
// pages/admin/middleware.js
import { NextResponse } from 'next/server'
import { APP_CONFIG } from '../../data/config/app.config.js'

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get(APP_CONFIG.SESSION_COOKIE_NAME)?.value
    
    if (!session || session !== 'true' && session !== 'setup') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}
```

- [ ] **Step 3: Create auth form component**

```javascript
// components/Admin/AuthForm.js
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function AuthForm({ firstTime = false }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        router.push('/admin')
      } else {
        setError(data.error || 'Authentication failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {firstTime ? 'Première configuration' : 'Authentification Admin'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {firstTime 
              ? 'Créez votre mot de passe administrateur' 
              : 'Entrez votre mot de passe pour accéder à l\'administration'
            }
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Mot de passe"
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Connexion...' : firstTime ? 'Créer le mot de passe' : 'Se connecter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create admin pages layout**

```javascript
// pages/admin/layout.js
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { APP_CONFIG } from '../../data/config/app.config.js'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    checkAuth()
  }, [])
  
  const checkAuth = async () => {
    const session = document.cookie.includes(`${APP_CONFIG.SESSION_COOKIE_NAME}=true`)
    
    if (!session) {
      router.push('/admin')
    }
  }
  
  if (!mounted) return null
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  {APP_CONFIG.NAME} - Admin
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => {
                  document.cookie = `${APP_CONFIG.SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`
                  router.push('/')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 5: Create admin index page**

```javascript
// pages/admin/index.js
import { useState, useEffect } from 'react'
import AdminLayout from './layout.js'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    formations: 0,
    stagiaires: 0
  })
  
  useEffect(() => {
    loadStats()
  }, [])
  
  const loadStats = async () => {
    try {
      const [formationsRes, stagiairesRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/sessions/stats')
      ])
      
      if (formationsRes.ok) {
        const formations = await formationsRes.json()
        setStats(prev => ({ ...prev, formations: Object.keys(formations).length }))
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }
  
  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500">Formations actives</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.formations}</dd>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500">Stagiaires total</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.stagiaires}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <nav className="-mb-px flex space-x-8">
            <a
              href="/admin/sessions"
              className="border-primary-500 text-primary-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              Gestion des formations
            </a>
            <a
              href="/admin/resultats"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              Voir les résultats
            </a>
          </nav>
        </div>
      </div>
    </AdminLayout>
  )
}
```

- [ ] **Step 6: Create admin page for auth**

```javascript
// pages/admin/index.js (replace with auth check)
import { useState, useEffect } from 'react'
import AuthForm from '../components/Admin/AuthForm'

export default function AdminPage() {
  const [firstTime, setFirstTime] = useState(false)
  const [checking, setChecking] = useState(true)
  
  useEffect(() => {
    checkAdminSetup()
  }, [])
  
  const checkAdminSetup = async () => {
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '' }) // Empty to check if exists
      })
      
      if (response.status === 500) {
        setFirstTime(true)
      } else {
        const data = await response.json()
        if (data.firstTime) {
          setFirstTime(true)
        } else {
          window.location.href = '/admin'
        }
      }
    } catch (error) {
      // File likely doesn't exist
      setFirstTime(true)
    } finally {
      setChecking(false)
    }
  }
  
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Chargement...</div>
      </div>
    )
  }
  
  return <AuthForm firstTime={firstTime} />
}
```

- [ ] **Step 7: Commit authentication system**

```bash
git add pages/admin/ pages/api/admin/ components/Admin/
git commit -m "feat: add admin authentication system with middleware"
```

## Data Management

### Task 5: Formation Management API

**Files:**
- Create: `pages/api/sessions.js`
- Create: `pages/api/session/[sessionId].js`

- [ ] **Step 1: Create sessions API**

```javascript
// pages/api/sessions.js
import fs from 'fs/promises'
import path from 'path'
import { readJsonFile, writeJsonFile } from '../../../lib/utils.js'

export default async function handler(req, res) {
  const { method } = req
  
  const formationsPath = path.join(process.cwd(), 'data', 'formations', 'formations.json')
  
  if (method === 'GET') {
    try {
      const formations = await readJsonFile(formationsPath)
      res.status(200).json(formations.formations || {})
    } catch (error) {
      res.status(200).json({})
    }
  }
  
  if (method === 'POST') {
    try {
      const { label } = req.body
      
      if (!label) {
        return res.status(400).json({ error: 'Label required' })
      }
      
      const formations = await readJsonFile(formationsPath)
      const sessionId = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')
      
      formations.formations = formations.formations || {}
      formations.formations[sessionId] = {
        label,
        createdAt: new Date().toISOString(),
        stagiaireCount: 0
      }
      
      await writeJsonFile(formationsPath, formations)
      
      // Create formation directory
      const formationDir = path.join(process.cwd(), 'data', 'formations', sessionId)
      await fs.mkdir(formationDir, { recursive: true })
      
      // Create empty files
      await writeJsonFile(path.join(formationDir, 'stagiaires.json'), { stagiaires: {} })
      await writeJsonFile(path.join(formationDir, 'keywords.json'), { keywords: {} })
      
      res.status(201).json({ sessionId, label })
    } catch (error) {
      console.error('Error creating session:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}
```

- [ ] **Step 2: Create individual session API**

```javascript
// pages/api/session/[sessionId].js
import fs from 'fs/promises'
import path from 'path'
import { readJsonFile, writeJsonFile, generateHexId } from '../../../lib/utils.js'
import { generatePhoneticCode } from '../../../lib/generateCode.js'

export default async function handler(req, res) {
  const { method } = req
  const { sessionId } = req.query
  
  const formationsPath = path.join(process.cwd(), 'data', 'formations', 'formations.json')
  const sessionPath = path.join(process.cwd(), 'data', 'formations', sessionId)
  
  // Check if session exists
  try {
    const formations = await readJsonFile(formationsPath)
    if (!formations.formations[sessionId]) {
      return res.status(404).json({ error: 'Session not found' })
    }
  } catch (error) {
    return res.status(404).json({ error: 'Session not found' })
  }
  
  if (method === 'GET') {
    try {
      const stagiairesFile = path.join(sessionPath, 'stagiaires.json')
      const keywordsFile = path.join(sessionPath, 'keywords.json')
      
      const [stagiaires, keywords] = await Promise.all([
        readJsonFile(stagiairesFile),
        readJsonFile(keywordsFile)
      ])
      
      res.status(200).json({
        stagiaires: stagiaires.stagiaires || {},
        keywords: keywords.keywords || {}
      })
    } catch (error) {
      res.status(200).json({ stagiaires: {}, keywords: {} })
    }
  }
  
  if (method === 'POST') {
    try {
      const { stagiaireId, responses } = req.body
      
      if (!stagiaireId || !responses) {
        return res.status(400).json({ error: 'Stagiaire ID and responses required' })
      }
      
      // Load existing data
      const stagiairesFile = path.join(sessionPath, 'stagiaires.json')
      const keywordsFile = path.join(sessionPath, 'keywords.json')
      
      const stagiairesData = await readJsonFile(stagiairesFile)
      const keywordsData = await readJsonFile(keywordsFile)
      
      stagiairesData.stagiaires = stagiairesData.stagiaires || {}
      keywordsData.keywords = keywordsData.keywords || {}
      
      // Store responses
      stagiairesData.stagiaires[stagiaireId] = {
        sessionCode: sessionId,
        ...responses,
        createdAt: new Date().toISOString()
      }
      
      // Update keywords
      if (responses.attentes) {
        responses.attentes.forEach(keyword => {
          keywordsData.keywords.attentes = keywordsData.keywords.attentes || {}
          keywordsData.keywords.attentes[keyword] = (keywordsData.keywords.attentes[keyword] || 0) + 1
        })
      }
      
      if (responses.craintes) {
        responses.craintes.forEach(keyword => {
          keywordsData.keywords.craintes = keywordsData.keywords.craintes || {}
          keywordsData.keywords.craintes[keyword] = (keywordsData.keywords.craintes[keyword] || 0) + 1
        })
      }
      
      // Save
      await Promise.all([
        writeJsonFile(stagiairesFile, stagiairesData),
        writeJsonFile(keywordsFile, keywordsData)
      ])
      
      // Update formation count
      const formations = await readJsonFile(formationsPath)
      formations.formations[sessionId].stagiaireCount = Object.keys(stagiairesData.stagiaires).length
      await writeJsonFile(formationsPath, formations)
      
      res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error saving responses:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}
```

- [ ] **Step 3: Commit data management API**

```bash
git add pages/api/session/ pages/api/sessions.js
git commit -m "feat: add formation management and response storage APIs"
```

### Task 6: Initial Configuration and Sample Data

**Files:**
- Create: `data/config/craintes.json`
- Create: `data/formations/formations.json` (initial)

- [ ] **Step 1: Create craintes configuration**

```json
// data/config/craintes.json
{
  "craintes": [
    {
      "id": "remplacement_metier",
      "label": "Remplacement de mon métier",
      "description": "L'IA va prendre ma place"
    },
    {
      "id": "securite_donnees",
      "label": "Sécurité des données",
      "description": "Mes données ne seront pas protégées"
    },
    {
      "id": "dependance",
      "label": "Dépendance excessive",
      "description": "Je deviendrai dépendant de l'IA"
    },
    {
      "id": "complexite",
      "label": "Complexité d'utilisation",
      "description": "L'IA sera trop difficile à maîtriser"
    },
    {
      "id": "erreur_decisions",
      "label": "Erreurs de décision",
      "description": "L'IA fera des erreurs graves"
    },
    {
      "id": "biais",
      "label": "Biais discriminatoires",
      "description": "L'IA sera biaisée"
    },
    {
      "id": "perte_competences",
      "label": "Perte de compétences",
      "description": "Je perdrai mes compétences naturelles"
    },
    {
      "id": "cout",
      "label": "Coût d'implémentation",
      "description": "Trop cher pour l'entreprise"
    }
  ]
}
```

- [ ] **Step 2: Create initial formations file**

```json
// data/formations/formations.json
{
  "formations": {}
}
```

- [ ] **Step 3: Commit configuration files**

```bash
git add data/config/craintes.json data/formations/formations.json
git commit -m "feat: add initial configuration and sample data structure"
```

## Public Survey Interface

### Task 7: Main Survey Page

**Files:**
- Create: `pages/index.js`
- Create: `components/Survey/AuthStep.js`
- Create: `components/Survey/SurveyStep.js`
- Create: `components/Survey/WordCloud.js`

- [ ] **Step 1: Create main survey page**

```javascript
// pages/index.js
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import AuthStep from '../components/Survey/AuthStep.js'
import SurveyStep from '../components/Survey/SurveyStep.js'

export default function Home() {
  const router = useRouter()
  const { session } = router.query
  const [currentStep, setCurrentStep] = useState(1)
  const [sessionId, setSessionId] = useState(session || '')
  const [stagiaireId, setStagiaireId] = useState('')
  const [responses, setResponses] = useState({
    attentes: [],
    craintes: []
  })
  
  // Check session validity
  useEffect(() => {
    if (session) {
      validateSession(session)
    }
  }, [session])
  
  const validateSession = async (id) => {
    try {
      const response = await fetch(`/api/sessions`)
      const sessions = await response.json()
      
      if (!sessions.formations || !sessions.formations[id]) {
        alert('Code de session invalide')
        router.push('/')
      }
    } catch (error) {
      console.error('Session validation error:', error)
      alert('Erreur lors de la validation de la session')
      router.push('/')
    }
  }
  
  const handleStagiaireAuth = (id) => {
    setStagiaireId(id)
    setCurrentStep(2)
  }
  
  const handleResponse = (step, data) => {
    if (step === 2) {
      setResponses(prev => ({ ...prev, attentes: data }))
    } else if (step === 3) {
      setResponses(prev => ({ ...prev, craintes: data }))
      saveResponses()
    }
  }
  
  const saveResponses = async () => {
    try {
      await fetch(`/api/session/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stagiaireId,
          responses
        })
      })
      
      // Show thank you page
      setCurrentStep(4)
    } catch (error) {
      console.error('Save error:', error)
      alert('Erreur lors de la sauvegarde')
      setCurrentStep(3)
    }
  }
  
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sondage IA Stagiaires
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Veuillez entrer votre code de session
            </p>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault()
            const code = e.target.code.value.trim()
            if (code) {
              router.push(`/?session=${code}`)
            }
          }}>
            <div>
              <label htmlFor="code" className="sr-only">
                Code de session
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Code de session (ex: a3f7b2e9)"
              />
            </div>
            <button
              type="submit"
              className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Continuer
            </button>
          </form>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sondage sur l'Intelligence Artificielle
          </h1>
          <p className="text-gray-600">
            Formation : {session}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          {currentStep === 1 && (
            <AuthStep onNext={handleStagiaireAuth} />
          )}
          {currentStep === 2 && (
            <SurveyStep
              step={2}
              title="Qu'attendez-vous comme aide de l'IA ?"
              description="Exprimez vos attentes en quelques mots."
              type="text"
              onNext={(data) => handleResponse(2, data)}
            />
          )}
          {currentStep === 3 && (
            <SurveyStep
              step={3}
              title="Quelles craintes vous génère l'IA ?"
              description="Cochez les cases qui vous concernent et ajoutez si besoin."
              type="checkboxes"
              onNext={(data) => handleResponse(3, data)}
            />
          )}
          {currentStep === 4 && (
            <div className="text-center py-12">
              <div className="text-green-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Merci !</h2>
              <p className="text-gray-600">
                Vos réponses ont bien été enregistrées.
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-6 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Retour à l'accueil
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create authentication step component**

```javascript
// components/Survey/AuthStep.js
import { useState } from 'react'
import { generatePhoneticCode } from '../../lib/generateCode.js'

export default function AuthStep({ onNext }) {
  const [hasCode, setHasCode] = useState(false)
  const [code, setCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  
  const generateNewCode = () => {
    const newCode = generatePhoneticCode()
    setGeneratedCode(newCode)
    setCode(newCode)
    setHasCode(true)
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (hasCode && code) {
      onNext(code)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenue au sondage
        </h2>
        <p className="text-gray-600">
          Avez-vous déjà un code stagiaire ?
        </p>
      </div>
      
      {!hasCode ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={generateNewCode}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Je suis un nouveau stagiaire
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OU</span>
            </div>
          </div>
          
          <div>
            <label className="sr-only">Code stagiaire</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Entrez votre code"
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {generatedCode && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">
                Votre code est : <strong>{generatedCode}</strong>
              </p>
            </div>
          )}
          
          <div>
            <label className="sr-only">Code stagiaire</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Entrez votre code"
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            />
          </div>
        </div>
      )}
      
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Continuer
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Create survey step component**

```javascript
// components/Survey/SurveyStep.js
import { useState, useEffect } from 'react'
import fs from 'fs/promises'
import path from 'path'

export default function SurveyStep({ step, title, description, type, onNext }) {
  const [input, setInput] = useState('')
  const [checkboxes, setCheckboxes] = useState([])
  const [other, setOther] = useState('')
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadConfig()
  }, [])
  
  const loadConfig = async () => {
    try {
      const data = await fs.readFile(
        path.join(process.cwd(), 'data', 'config', 'craintes.json'),
        'utf-8'
      )
      const config = JSON.parse(data)
      setCheckboxes(config.craintes || [])
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleTextSubmit = () => {
    const keywords = extractKeywords(input)
    onNext(keywords)
  }
  
  const handleCheckboxSubmit = () => {
    const selected = checkboxes
      .filter(c => c.checked)
      .map(c => c.id)
    
    if (other.trim()) {
      selected.push(other.trim())
    }
    
    onNext(selected)
  }
  
  const extractKeywords = (text) => {
    // Simple keyword extraction
    return text
      .toLowerCase()
      .split(/[\s,;]+/)
      .filter(word => word.length > 2)
      .filter(word => !['pour', 'avec', 'dans', 'sur', 'les', 'des', 'une', 'un'].includes(word))
  }
  
  const toggleCheckbox = (id) => {
    setCheckboxes(prev => 
      prev.map(cb => 
        cb.id === id ? { ...cb, checked: !cb.checked } : cb
      )
    )
  }
  
  if (loading) {
    return <div>Chargement...</div>
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      
      {type === 'text' ? (
        <div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
            placeholder="Exprimez-vous en quelques mots..."
          />
          <p className="mt-2 text-xs text-gray-500">
            Exemples : automatisation, productivité, simplification, innovation
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {checkboxes.map((item) => (
            <div key={item.id} className="flex items-start">
              <input
                id={item.id}
                name={item.id}
                type="checkbox"
                checked={item.checked || false}
                onChange={() => toggleCheckbox(item.id)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor={item.id} className="ml-3 text-sm font-medium text-gray-700">
                {item.label}
                {item.description && (
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                )}
              </label>
            </div>
          ))}
          
          <div className="pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Autre crainte ?
            </label>
            <input
              type="text"
              value={other}
              onChange={(e) => setOther(e.target.value)}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              placeholder="Si autre, précisez..."
            />
          </div>
        </div>
      )}
      
      <button
        onClick={type === 'text' ? handleTextSubmit : handleCheckboxSubmit}
        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Suivant
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Create word cloud component**

```javascript
// components/Survey/WordCloud.js
import WordCloud from 'react-wordcloud'

export default function WordCloudComponent({ data, title }) {
  const words = Object.entries(data).map(([text, value]) => ({
    text,
    value: typeof value === 'number' ? value : 1
  }))
  
  const options = {
    rotations: 0,
    rotationAngles: [0, 0],
    fontSizes: [16, 60],
    padding: 10,
    deterministic: true,
    spiral: 'archimedean'
  }
  
  const callbacks = {
    onWordClick: (word) => {
      console.log('Word clicked:', word)
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="w-full h-96">
        <WordCloud words={words} options={options} callbacks={callbacks} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit survey interface**

```bash
git add pages/index.js components/Survey/
git commit -m "feat: add public survey interface with multi-step flow"
```

## Admin Interface

### Task 8: Admin Session Management

**Files:**
- Create: `pages/admin/sessions.js`
- Create: `pages/admin/resultats.js`
- Modify: `components/Admin/Dashboard.js`

- [ ] **Step 1: Create session management page**

```javascript
// pages/admin/sessions.js
import AdminLayout from './layout.js'
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function SessionManagement() {
  const [sessions, setSessions] = useState({})
  const [newLabel, setNewLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const router = useRouter()
  
  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      const data = await response.json()
      setSessions(data.formations || {})
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }
  
  const createSession = async () => {
    if (!newLabel.trim()) return
    
    setCreating(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSessions(prev => ({
          ...prev,
          [data.sessionId]: {
            label: data.label,
            createdAt: new Date().toISOString(),
            stagiaireCount: 0
          }
        }))
        setNewLabel('')
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    } finally {
      setCreating(false)
    }
  }
  
  const deleteSession = async (sessionId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) return
    
    try {
      // In a real app, you'd have a DELETE endpoint
      // For now, just remove from UI
      const newSessions = { ...sessions }
      delete newSessions[sessionId]
      setSessions(newSessions)
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }
  
  useEffect(() => {
    loadSessions()
  }, [])
  
  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestion des formations</h2>
        
        <div className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Nom de la nouvelle formation"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
            />
            <button
              onClick={createSession}
              disabled={creating || !newLabel.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {creating ? 'Création...' : 'Créer'}
            </button>
          </div>
        </div>
        
        {Object.keys(sessions).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucune formation créée
          </div>
        ) : (
          <div className="grid gap-4">
            {Object.entries(sessions).map(([sessionId, session]) => (
              <div key={sessionId} className="bg-white shadow rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{session.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Code : {sessionId} • {session.stagiaireCount} stagiaires
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Créé le : {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/admin/resultats?session=${sessionId}`)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-800"
                    >
                      Voir résultats
                    </button>
                    <button
                      onClick={() => deleteSession(sessionId)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
```

- [ ] **Step 2: Create results page**

```javascript
// pages/admin/resultats.js
import AdminLayout from './layout.js'
import { useState, useEffect } from 'react'
import WordCloudComponent from '../../components/Survey/WordCloud.js'
import { useRouter } from 'next/router'

export default function ResultsPage() {
  const router = useRouter()
  const { session } = router.query
  const [data, setData] = useState({ attentes: {}, craintes: {} })
  const [loading, setLoading] = useState(true)
  const [sessionInfo, setSessionInfo] = useState(null)
  
  useEffect(() => {
    if (session) {
      loadResults(session)
    }
  }, [session])
  
  const loadResults = async (sessionId) => {
    try {
      const response = await fetch(`/api/session/${sessionId}`)
      const result = await response.json()
      
      setData({
        attentes: result.keywords.attentes || {},
        craintes: result.keywords.craintes || {}
      })
      
      // Get session info
      const sessionsResponse = await fetch('/api/sessions')
      const sessions = await sessionsResponse.json()
      setSessionInfo(sessions.formations[sessionId])
    } catch (error) {
      console.error('Failed to load results:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `resultats-${session}-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div>Chargement des résultats...</div>
        </div>
      </AdminLayout>
    )
  }
  
  if (!sessionInfo) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div>Formation non trouvée</div>
        </div>
      </AdminLayout>
    )
  }
  
  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Résultats - {sessionInfo.label}</h2>
            <p className="text-sm text-gray-500">
              Code : {session} • {Object.keys(data.attentes).length + Object.keys(data.craintes).length} mots-clés
            </p>
          </div>
          <button
            onClick={exportData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Exporter les données
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <WordCloudComponent 
            data={data.attentes} 
            title="Attentes des stagiaires"
          />
          <WordCloudComponent 
            data={data.craintes} 
            title="Craintes des stagiaires"
          />
        </div>
        
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {Object.keys(data.attentes).length}
              </div>
              <div className="text-sm text-gray-500">Attentes uniques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {Object.keys(data.craintes).length}
              </div>
              <div className="text-sm text-gray-500">Craintes uniques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {Object.values(data.attentes).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-gray-500">Total attentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {Object.values(data.craintes).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-gray-500">Total craintes</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
```

- [ ] **Step 3: Commit admin interface**

```bash
git add pages/admin/sessions.js pages/admin/resultats.js
git commit -m "feat: add admin interface for session management and results"
```

### Task 9: Final Configuration and Testing

**Files:**
- Modify: `package.json` (add scripts)
- Create: `styles/globals.css` (complete)
- Create: `.env.local.example`

- [ ] **Step 1: Update package.json**

```json
{
  "name": "sondage-ia",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "bcrypt": "^5.1.1",
    "nanoid": "^3.3.6",
    "react-wordcloud": "^2.0.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.16"
  }
}
```

- [ ] **Step 2: Update globals.css**

```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-sans text-gray-900 bg-gray-50;
  }
}

@layer components {
  .btn-primary {
    @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500;
  }
  
  .btn-secondary {
    @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500;
  }
}
```

- [ ] **Step 3: Create environment example**

```env
# Example environment variables
NEXT_PUBLIC_APP_URL=http://localhost:3100
NEXT_PUBLIC_APP_NAME=Sondage IA
```

- [ ] **Step 4: Create postcss config**

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Test the application**

```bash
npm run build
npm start
```

- [ ] **Step 6: Commit final configuration**

```bash
git add package.json styles/globals.css .env.local.example postcss.config.js
git commit -m "feat: add final configuration and testing setup"
```

## Deployment Notes

### Task 10: Deployment Preparation

**Files:**
- Create: `README.md` (updated)
- Create: `DEPLOYMENT.md`

- [ ] **Step 1: Update README**

```markdown
# Sondage IA Stagiaires

Application web mobile pour collecter les attentes et craintes des stagiaires sur l'IA.

## Fonctionnalités

- Interface admin sécurisée avec authentification
- Gestion des codes de formation
- Sondage en 3 étapes pour les stagiaires
- Nuage de mots pour visualiser les résultats
- Export des données

## Technologies

- Next.js 14+
- React 18
- Tailwind CSS
- Authentification bcrypt
- Stockage JSON

## Développement

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```

## Structure

```
├── pages/          # Pages Next.js
├── components/    # Composants React
├── lib/          # Fonctions utilitaires
├── data/         # Données JSON
└── styles/       # Styles CSS
```

## Configuration

Variables d'environnement :

- `NEXT_PUBLIC_APP_URL`: URL de l'application
- `NEXT_PUBLIC_APP_NAME`: Nom de l'application
```

- [ ] **Step 2: Create deployment guide**

```markdown
# Déployment

## Prérequis

- Node.js 18+
- npm ou yarn

## Déployment local

```bash
npm install
npm run build
npm start
```

## Déployment sur Vercel

1. Push le code sur GitHub
2. Connectez votre repo à Vercel
3. Ajoutez les variables d'environnement
4. Déployez

## Déployment manuel

```bash
# Build
npm run build

# Démarrer le serveur
npm start
```

## Notes importantes

- Le dossier `data/` ne doit pas être versionné
- Assurez-vous de bien configurer les permissions sur `admin.json`
- Les données sont sauvegardées localement, faites des sauvegardes régulières
```

- [ ] **Step 3: Commit documentation**

```bash
git add README.md DEPLOYMENT.md
git commit -m "docs: add documentation and deployment guide"
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-20-sondage-ia-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**