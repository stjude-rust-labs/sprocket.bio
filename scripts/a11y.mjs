// Serves the built site and runs pa11y-ci against every page in dark and light mode.
import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdtemp, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join, relative, resolve, sep } from 'node:path'

const root = resolve(process.argv[2] ?? '.vitepress/dist')

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon',
}

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return htmlFiles(path)
      return entry.name.endsWith('.html') ? [path] : []
    }),
  )
  return nested.flat()
}

// Redirect stubs are not pages; they carry this marker so the crawl can skip them.
async function isRedirectStub(file) {
  return (await readFile(file, 'utf8')).includes('<meta name="sprocket-redirect"')
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const pathname = decodeURIComponent(url.pathname)
  let file = resolve(root, `.${pathname}`)
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403).end()
    return
  }
  const requested = file
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
    await stat(file)
  } catch {
    // GitHub Pages serves `/foo` from `foo.html`, which is how the site's clean
    // URLs resolve in production.
    try {
      const fallback = `${requested.replace(/\/$/, '')}.html`
      await stat(fallback)
      file = fallback
    } catch {
      res.writeHead(404, { 'content-type': types['.html'] })
      createReadStream(join(root, '404.html')).pipe(res)
      return
    }
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
  const theme = url.searchParams.get('theme')
  if (extname(file) === '.html' && theme) {
    // The browser is shared between pages, so pin the stored appearance on every load.
    const html = await readFile(file, 'utf8')
    const pin = `<script>localStorage.setItem('vitepress-theme-appearance', ${JSON.stringify(theme)})</script>`
    res.end(html.replace('<head>', `<head>${pin}`))
    return
  }
  createReadStream(file).pipe(res)
})

await new Promise((done) => server.listen(0, '127.0.0.1', done))
const origin = `http://127.0.0.1:${server.address().port}`

const files = await htmlFiles(root)
const crawlable = []
for (const file of files) {
  if (!(await isRedirectStub(file))) crawlable.push(file)
}
const pages = crawlable
  .map((file) => `/${relative(root, file).split(sep).join('/')}`.replace(/(^|\/)index\.html$/, '$1'))
  .sort()

const config = {
  defaults: {
    standard: 'WCAG2AA',
    runners: ['axe', 'htmlcs'],
    // The homepage demo video is always muted and has no unmute control, so it needs no captions.
    ignore: ['video-caption'],
    // axe marks text over gradients and translucent layers as "needs review"; report those as warnings.
    levelCapWhenNeedsReview: 'warning',
    timeout: 60000,
    wait: 500,
    concurrency: 1,
    chromeLaunchConfig: { args: ['--no-sandbox', '--force-prefers-reduced-motion'] },
  },
  urls: pages.flatMap((page) => [`${origin}${page}?theme=dark`, `${origin}${page}?theme=light`]),
}

const dir = await mkdtemp(join(tmpdir(), 'pa11y-'))
const configPath = join(dir, 'pa11yci.json')
await writeFile(configPath, JSON.stringify(config, null, 2))

console.log(`Checking ${pages.length} pages in dark and light mode from ${root}`)
console.log(`Skipped ${files.length - crawlable.length} redirect stubs\n`)

const code = await new Promise((done) => {
  const child = spawn('pa11y-ci', ['--config', configPath], { stdio: 'inherit', shell: process.platform === 'win32' })
  child.on('exit', (status) => done(status ?? 1))
})

server.close()
process.exit(code)
