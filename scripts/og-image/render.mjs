// Renders scripts/og-image/template.html to public/og-image.png (1200x630).
// Uses a local Chrome; set CHROME_PATH to override the default location.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const template = pathToFileURL(resolve(here, 'template.html')).href
const output = resolve(here, '../../public/og-image.png')

const candidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)

const chrome = candidates.find((path) => existsSync(path))
if (!chrome) {
  console.error('Chrome not found. Set CHROME_PATH to a Chrome or Chromium binary.')
  process.exit(1)
}

execFileSync(chrome, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--allow-file-access-from-files',
  '--force-device-scale-factor=1',
  '--window-size=1200,630',
  '--virtual-time-budget=2000',
  `--screenshot=${output}`,
  template,
], { stdio: 'inherit' })

console.log(`Wrote ${output}`)
