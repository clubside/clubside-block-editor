// server.js — CSBE Playwright Test Server (ESM)

import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Serve the entire project directory statically
app.use(express.static(__dirname))

// Configurable port (default 5173)
const PORT = process.env.PORT || 5173

app.listen(PORT, () => {
	console.log(`CSBE test server running at http://localhost:${PORT}`)
})
