import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const srcDir = join(process.cwd(), 'src')
const offenders = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      walk(path)
      continue
    }

    if (!/\.(js|vue)$/.test(entry)) continue
    if (relative(srcDir, path).replaceAll('\\', '/') === 'api/index.js') continue

    const text = readFileSync(path, 'utf8')
    const lines = text.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (/\bapi\.(get|post|put|delete)\s*\(/.test(line)) {
        offenders.push(`${relative(process.cwd(), path)}:${index + 1}: ${line.trim()}`)
      }
    })
  }
}

walk(srcDir)

if (offenders.length > 0) {
  console.error('Use named API helpers outside src/api/index.js:')
  offenders.forEach(line => console.error(`- ${line}`))
  process.exit(1)
}

console.log('API usage check passed')
