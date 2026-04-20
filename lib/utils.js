const fs = require('fs/promises')
const path = require('path')

async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

async function readJsonFile(filePath) {
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

async function writeJsonFile(filePath, data) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function generateHexId(length = 8) {
  return Array.from({ length }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

module.exports = { ensureDir, readJsonFile, writeJsonFile, generateHexId }
