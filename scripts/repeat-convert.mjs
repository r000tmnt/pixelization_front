import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(scriptDir, '..')

function getOption(name, fallback) {
  const index = process.argv.indexOf(name)
  return index === -1 ? fallback : process.argv[index + 1]
}

const apiBase = (getOption('--api', process.env.VITE_API || 'http://localhost:3030')).replace(/\/$/, '')
const imagePath = path.resolve(projectDir, getOption('--image', 'public/test/test.jpg'))
const runs = Number.parseInt(getOption('--runs', '96'), 10)

if (!Number.isInteger(runs) || runs < 1) {
  throw new Error('--runs must be a positive integer')
}

const image = await readFile(imagePath)
const imageName = path.basename(imagePath)
const imageType = imageName.toLowerCase().endsWith('.png') ? 'image/png'
  : imageName.toLowerCase().endsWith('.webp') ? 'image/webp'
    : 'image/jpeg'

const cmykishRgb = [
  [0, 173, 238],
  [235, 0, 139],
  [255, 241, 0],
  [35, 31, 32],
  [0, 0, 130],
  [235, 0, 0],
  [0, 164, 0],
  [0, 0, 0],
  [255, 255, 255],
]

const toHex = ([r, g, b]) => `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
const customColors = cmykishRgb.map(toHex).join(';')
const palettes = [
  { name: 'gameboy', custom: false },
  { name: 'nes', custom: false },
  { name: 'snes', custom: false },
  { name: '1bit', custom: false },
  { name: 'monochrome', custom: false },
  { name: 'custom', custom: true },
]
const erodeValues = [0, 1, 2, 4]
const contrastValues = [-30, 0, 2, 8]

console.log(`API: ${apiBase}/pixel/convert`)
console.log(`Image: ${imagePath} (${image.length} bytes)`)
console.log(`Sequential runs: ${runs}`)

let failures = 0
let totalDurationMs = 0

for (let index = 0; index < runs; index++) {
  const palette = palettes[index % palettes.length]
  const erode = erodeValues[Math.floor(index / palettes.length) % erodeValues.length]
  const contrast = contrastValues[Math.floor(index / (palettes.length * erodeValues.length)) % contrastValues.length]
  const settings = { palette: palette.name, erode, contrast }
  const form = new FormData()
  form.append('pixelSize', '4')
  form.append('palette', palette.name)
  form.append('ditherStrength', '0.35')
  form.append('erodeStrength', String(erode))
  form.append('contrastStrength', String(contrast))
  form.append('ditherStyle', 'default')
  form.append('file', new Blob([image], { type: imageType }), imageName)
  if (palette.custom) form.append('customColors', customColors)

  const startedAt = Date.now()
  let durationCounted = false
  try {
    const response = await fetch(`${apiBase}/pixel/convert`, { method: 'POST', body: form })
    const body = await response.text()
    const durationMs = Date.now() - startedAt
    totalDurationMs += durationMs
    durationCounted = true

    if (!response.ok) {
      failures++
      console.error(`[${index + 1}/${runs}] FAIL ${response.status} ${durationMs}ms ${JSON.stringify(settings)}: ${body.slice(0, 500)}`)
      continue
    }

    let result
    try {
      result = JSON.parse(body)
    } catch {
      throw new Error(`Response was not JSON: ${body.slice(0, 200)}`)
    }
    if (!result.data?.startsWith('data:image/png;base64,') || !result.width || !result.height) {
      throw new Error('Response is missing PNG data or image dimensions')
    }
    console.log(`[${index + 1}/${runs}] OK ${durationMs}ms ${JSON.stringify(settings)} ${result.width}x${result.height}`)
  } catch (error) {
    failures++
    if (!durationCounted) totalDurationMs += Date.now() - startedAt
    console.error(`[${index + 1}/${runs}] FAIL ${JSON.stringify(settings)}: ${error.message}`)
  }
}

console.log(`\nFinished: ${runs - failures}/${runs} passed; ${failures} failed; average ${Math.round(totalDurationMs / runs)}ms`)
if (failures > 0) process.exitCode = 1
