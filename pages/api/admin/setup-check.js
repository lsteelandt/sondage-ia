const fs = require('fs')
const path = require('path')

const ADMIN_FILE = path.join(process.cwd(), 'data', 'admin.json')

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const setup = fs.existsSync(ADMIN_FILE)
  return res.status(200).json({ setup })
}
