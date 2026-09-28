// Checks the redirect stubs written by `.vitepress/config.mts` against the built
// site: every old URL still resolves, every destination and anchor exists, the
// stubs stay out of the sitemap and the search index, and no old route is still
// linked from the sources.
//
// Usage: node scripts/check-redirects.mjs [dist] [--allow-missing-anchors]
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const args = process.argv.slice(2)
const allowMissingAnchors = args.includes('--allow-missing-anchors')
const root = resolve(args.find((arg) => !arg.startsWith('--')) ?? '.vitepress/dist')
const repo = resolve(import.meta.dirname, '..')

const errors = []
const warnings = []
const notes = []

if (!existsSync(root)) {
  console.error(`No build found at ${relative(repo, root)}. Run \`pnpm docs:build\` first.`)
  process.exit(1)
}

let redirects
try {
  ;({ redirects } = await import(pathToFileURL(join(repo, '.vitepress/redirects.mts')).href))
} catch (error) {
  console.error('Could not load .vitepress/redirects.mts.')
  console.error('Reading TypeScript directly needs Node 22.18 or newer.')
  console.error(error.message)
  process.exit(1)
}

// Returns the built HTML for an extensionless path, or null when there is none.
function readPage(path) {
  for (const file of [join(root, `${path}.html`), join(root, path, 'index.html')]) {
    if (existsSync(file)) return readFileSync(file, 'utf8')
  }
  return null
}

const pageCache = new Map()
function page(path) {
  if (!pageCache.has(path)) pageCache.set(path, readPage(path))
  return pageCache.get(path)
}

function hasId(html, id) {
  return new RegExp(`\\sid=["']${id.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}["']`).test(html)
}

let anchorCount = 0

for (const { from, to, anchors = {} } of redirects) {
  const stub = page(from)
  if (stub === null) {
    errors.push(`${from}: no stub was written`)
    continue
  }

  if (!stub.includes('<meta name="sprocket-redirect"')) errors.push(`${from}: the stub is missing its sprocket-redirect marker`)
  if (!stub.includes('<meta name="robots" content="noindex">')) errors.push(`${from}: the stub is missing its noindex marker`)
  if (!stub.includes(`<link rel="canonical" href="https://sprocket.bio${to}">`)) {
    errors.push(`${from}: the stub's canonical URL does not point at ${to}`)
  }
  if (!stub.includes(`<a href="${to}">`)) errors.push(`${from}: the stub has no visible link to ${to}`)

  if (page(to) === null) {
    errors.push(`${from}: the destination ${to} is not in the build`)
    continue
  }

  for (const [id, dest] of Object.entries(anchors)) {
    anchorCount += 1
    const [path, fragment] = dest.split('#')
    const html = page(path)
    if (html === null) {
      errors.push(`${from}#${id}: the destination page ${path} is not in the build`)
      continue
    }
    if (fragment && !hasId(html, fragment)) {
      const message = `${from}#${id}: no element with id="${fragment}" on ${path}`
      ;(allowMissingAnchors ? warnings : errors).push(message)
    }
  }
}

// The stubs are not content, so they must not be advertised for indexing.
const sitemap = join(root, 'sitemap.xml')
if (existsSync(sitemap)) {
  const listed = new Set(
    [...readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
      const path = new URL(m[1]).pathname.replace(/\.html$/, '').replace(/(.)\/$/, '$1')
      return path || '/'
    }),
  )
  for (const { from } of redirects) {
    if (listed.has(from)) errors.push(`${from}: the stub is listed in sitemap.xml`)
  }
} else {
  notes.push('no sitemap.xml in the build, skipped the sitemap check')
}

// Old URLs must not surface as results in the local search index either.
function findSearchIndex(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return findSearchIndex(path)
    return entry.name.includes('localSearchIndex') ? [path] : []
  })
}
const indexChunks = findSearchIndex(join(root, 'assets'))
if (indexChunks.length) {
  const index = indexChunks.map((file) => readFileSync(file, 'utf8')).join('\n')
  for (const { from } of redirects) {
    if (index.includes(`${from.slice(1)}.html`)) errors.push(`${from}: the stub appears in the local search index`)
  }
} else {
  notes.push('no local search index in the build, skipped the search index check')
}

// Nothing in the sources should still link to a route that has moved.
const oldRoutes = [
  /(?<![\w./-])\/(subcommands|configuration|vscode)\//,
  /(?<![\w./-])\/(overview|installation|quickstart-checklist|project-status|python-bindings)(?![\w-])/,
  /(?<![\w./-])\/guided-tour(?!\/example\.wdl)(?![\w-])/,
]
const sourceExtensions = new Set(['.md', '.vue', '.mts', '.ts'])
const skipDirectories = new Set(['node_modules', '.git', 'dist', 'cache'])
const skipFiles = new Set([join(repo, '.vitepress/redirects.mts')])

function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skipDirectories.has(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      scan(path)
      continue
    }
    if (!sourceExtensions.has(extname(entry.name)) || skipFiles.has(path)) continue
    readFileSync(path, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (oldRoutes.some((pattern) => pattern.test(line))) {
          errors.push(`${relative(repo, path).split(sep).join('/')}:${i + 1}: still links to a route that moved`)
        }
      })
  }
}
scan(repo)

for (const note of notes) console.log(`note: ${note}`)
for (const warning of warnings) console.warn(`warning: ${warning}`)
if (warnings.length) {
  console.warn(`\n${warnings.length} anchor destinations do not exist yet (pages still being written). Drop --allow-missing-anchors once they are.`)
}

if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? '' : 's'} with the redirects:`)
  for (const error of errors) console.error(`  ${error}`)
  process.exit(1)
}

console.log(`\nChecked ${redirects.length} redirects and ${anchorCount} anchors against ${relative(repo, root).split(sep).join('/')}.`)
