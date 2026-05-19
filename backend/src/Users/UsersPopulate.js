const path = require('path')
const fs = require('fs')
const pool = require('../config/db')
const logger = require('../utils/logger')

async function populateUsers() {
  const tsvPath = path.join(__dirname, 'Users.tsv')
  const lines = fs.readFileSync(tsvPath, 'utf8').split('\n').map(l => l.trim())

  const users = []
  let currentGroup = null

  for (const line of lines) {
    if (!line) continue
    if (/^\d{2}$/.test(line)) {
      currentGroup = line
    } else if (currentGroup) {
      users.push({ carnet: line, grupo: currentGroup })
    }
  }

  for (const { carnet, grupo } of users) {
    await pool.query(
      `INSERT INTO users (carnet, nombre_completo, grupo)
       VALUES ($1, NULL, $2)
       ON CONFLICT (carnet) DO NOTHING`,
      [carnet, grupo]
    )
  }

  logger.info(`Users populated: ${users.length} records processed`)
}

module.exports = populateUsers
