import { access, copyFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const KEY = [128, 128, 128]

const file = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
if (!file) {
  console.error('Uso: node tools/quitar-gris.mjs <imagen.png> [--tolerance 16] [--softness 24] [--chroma 18]')
  process.exit(1)
}

const tolerance = flag('--tolerance', 16)
const softness = flag('--softness', 24)
const chromaMax = flag('--chroma', 18)

const resolved = path.resolve(file)
const backup = resolved.replace(/\.png$/i, '.orig.png')
if (!backup.endsWith('.orig.png')) {
  console.error('La imagen tiene que ser un PNG')
  process.exit(1)
}

if (!(await exists(backup))) await copyFile(resolved, backup)

const { data, info } = await sharp(backup).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height } = info
const count = width * height
const alpha = new Uint8Array(count)
const seen = new Uint8Array(count)
const queue = []

for (let x = 0; x < width; x += 1) {
  consider(x, 0)
  consider(x, height - 1)
}
for (let y = 1; y < height - 1; y += 1) {
  consider(0, y)
  consider(width - 1, y)
}

for (let head = 0; head < queue.length; head += 1) {
  const p = queue[head]
  const x = p % width
  const y = (p - x) / width
  if (x > 0) consider(x - 1, y)
  if (x + 1 < width) consider(x + 1, y)
  if (y > 0) consider(x, y - 1)
  if (y + 1 < height) consider(x, y + 1)
}

for (let p = 0; p < count; p += 1) if (!seen[p]) alpha[p] = 255

const edge = blurInward(alpha, width, height)
let fringe = 0

for (let p = 0; p < count; p += 1) {
  const i = p * 4
  const cover = edge[p] / 255
  if (cover <= 0) {
    data[i] = 0
    data[i + 1] = 0
    data[i + 2] = 0
    data[i + 3] = 0
    continue
  }
  if (cover < 1 && isGray(data[i], data[i + 1], data[i + 2], tolerance + softness)) {
    data[i] = unmix(data[i], cover)
    data[i + 1] = unmix(data[i + 1], cover)
    data[i + 2] = unmix(data[i + 2], cover)
    const distance = Math.hypot(data[i] - KEY[0], data[i + 1] - KEY[1], data[i + 2] - KEY[2])
    const chroma = spread(data[i], data[i + 1], data[i + 2])
    if (distance < tolerance && chroma <= chromaMax) fringe += 1
  }
  data[i + 3] = edge[p]
}

const trimmed = trim(data, width, height)
await sharp(trimmed.buffer, {
  raw: { width: trimmed.width, height: trimmed.height, channels: 4 },
}).png().toFile(resolved)

console.log(`Respaldo: ${backup}`)
console.log(`PNG: ${trimmed.width}x${trimmed.height}`)
console.log(`Borde todavía gris: ${fringe} px`)

function flag(name, fallback) {
  const index = process.argv.indexOf(name)
  if (index === -1) return fallback
  const value = Number(process.argv[index + 1])
  if (!Number.isFinite(value) || value < 0) {
    console.error(`${name} tiene que ser un número >= 0`)
    process.exit(1)
  }
  return value
}

async function exists(target) {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

function consider(x, y) {
  const p = y * width + x
  if (seen[p]) return
  const i = p * 4
  if (!isGray(data[i], data[i + 1], data[i + 2], tolerance + softness)) return
  seen[p] = 1
  alpha[p] = edgeAlpha(data[i], data[i + 1], data[i + 2])
  queue.push(p)
}

function isGray(r, g, b, limit) {
  const distance = Math.hypot(r - KEY[0], g - KEY[1], b - KEY[2])
  return distance <= tolerance || (distance <= limit && spread(r, g, b) <= chromaMax)
}

function edgeAlpha(r, g, b) {
  const distance = Math.hypot(r - KEY[0], g - KEY[1], b - KEY[2])
  if (distance <= tolerance) return 0
  return Math.round(((distance - tolerance) / softness) * 255)
}

function spread(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b)
}

function unmix(channel, cover) {
  const color = (channel - KEY[0] * (1 - cover)) / cover
  return Math.max(0, Math.min(255, Math.round(color)))
}

function blurInward(source, w, h) {
  const out = new Uint8Array(source.length)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const p = y * w + x
      if (source[p] === 0) continue
      let sum = 0
      let count = 0
      for (let dy = -1; dy <= 1; dy += 1) {
        const yy = y + dy
        if (yy < 0 || yy >= h) continue
        for (let dx = -1; dx <= 1; dx += 1) {
          const xx = x + dx
          if (xx < 0 || xx >= w) continue
          sum += source[yy * w + xx]
          count += 1
        }
      }
      out[p] = Math.round(sum / count)
    }
  }
  return out
}

function trim(pixels, w, h) {
  let top = 0
  let bottom = h - 1
  let left = 0
  let right = w - 1
  const emptyRow = (y) => {
    for (let x = 0; x < w; x += 1) if (pixels[(y * w + x) * 4 + 3] > 0) return false
    return true
  }
  const emptyCol = (x, y0, y1) => {
    for (let y = y0; y <= y1; y += 1) if (pixels[(y * w + x) * 4 + 3] > 0) return false
    return true
  }
  while (top < bottom && emptyRow(top)) top += 1
  while (bottom > top && emptyRow(bottom)) bottom -= 1
  while (left < right && emptyCol(left, top, bottom)) left += 1
  while (right > left && emptyCol(right, top, bottom)) right -= 1
  const nextWidth = right - left + 1
  const nextHeight = bottom - top + 1
  const next = Buffer.alloc(nextWidth * nextHeight * 4)
  for (let y = 0; y < nextHeight; y += 1) {
    const from = ((top + y) * w + left) * 4
    pixels.copy(next, y * nextWidth * 4, from, from + nextWidth * 4)
  }
  return { buffer: next, width: nextWidth, height: nextHeight }
}
