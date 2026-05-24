const path = require('path')
const fs = require('fs')
const logger = require('../utils/logger')

// Map<carnet, Set<grupo>>
const usersByCarnet = new Map()

function loadUsers() {
  const tsvPath = path.join(__dirname, 'Users.tsv')
  const text = fs.readFileSync(tsvPath, 'utf8')
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const dataLines = lines[0].toLowerCase().startsWith('carnet') ? lines.slice(1) : lines

  usersByCarnet.clear()
  for (const line of dataLines) {
    const [carnetRaw, grupoRaw] = line.split('\t').map(s => s && s.trim())
    if (!carnetRaw || !grupoRaw) continue
    const carnet = carnetRaw.toUpperCase()
    if (!usersByCarnet.has(carnet)) usersByCarnet.set(carnet, new Set())
    usersByCarnet.get(carnet).add(grupoRaw)
  }

  logger.info(`Users loaded into memory: ${usersByCarnet.size} carnets`)
}

function carnetBelongsToGroup(carnet, grupo) {
  if (!carnet || !grupo) return false
  const groups = usersByCarnet.get(carnet.toUpperCase())
  return !!(groups && groups.has(grupo))
}

function getGroupsForCarnet(carnet) {
  if (!carnet) return new Set()
  return usersByCarnet.get(carnet.toUpperCase()) || new Set()
}

loadUsers()

module.exports = { loadUsers, carnetBelongsToGroup, getGroupsForCarnet }
