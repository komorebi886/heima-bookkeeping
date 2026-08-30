// 生成应用图标：512x512 PNG（无第三方依赖，纯 Node 实现）
// 设计：蓝色圆角方块 + 白色 ¥ 符号（线条用有符号距离场做抗锯齿）
const zlib = require('node:zlib')
const fs = require('node:fs')
const path = require('node:path')

const SIZE = 512
const CORNER = 108 // 圆角半径
const BG_TOP = [64, 158, 255] // 顶部蓝色
const BG_BOTTOM = [37, 99, 235] // 底部深蓝

// ---------- 图形工具 ----------
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

// 点到线段的最短距离
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  let t = len2 === 0 ? 0 : clamp(((px - x1) * dx + (py - y1) * dy) / len2, 0, 1)
  const cx = x1 + t * dx
  const cy = y1 + t * dy
  return Math.hypot(px - cx, py - cy)
}

// 圆角矩形的有符号距离（负值=内部）
function roundedRectSDF(px, py, cx, cy, half, r) {
  const dx = Math.abs(px - cx) - (half - r)
  const dy = Math.abs(py - cy) - (half - r)
  const ox = Math.max(dx, 0)
  const oy = Math.max(dy, 0)
  return Math.hypot(ox, oy) + Math.min(Math.max(dx, dy), 0) - r
}

// ¥ 符号的线段集合（中心坐标 256,256 附近）
const STROKE = 30 // 线条粗细
const YEN_SEGMENTS = [
  // 上端两条斜线（∧）
  [256, 130, 168, 288],
  [256, 130, 344, 288],
  // 竖线
  [256, 176, 256, 382],
  // 两条横线
  [182, 240, 330, 240],
  [182, 284, 330, 284]
]

// ---------- 像素绘制 ----------
const buf = Buffer.alloc(SIZE * SIZE * 4)
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4
    // 1. 圆角方块背景（带圆角外抗锯齿 + 垂直渐变）
    const sdf = roundedRectSDF(x + 0.5, y + 0.5, SIZE / 2, SIZE / 2, SIZE / 2 - 2, CORNER)
    const cover = clamp(0.5 - sdf, 0, 1)
    const t = y / SIZE
    const r = Math.round(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
    const g = Math.round(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
    const b = Math.round(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)

    // 2. ¥ 符号：到所有线段的最小距离
    let minD = Infinity
    for (const [x1, y1, x2, y2] of YEN_SEGMENTS) {
      minD = Math.min(minD, distToSegment(x + 0.5, y + 0.5, x1, y1, x2, y2))
    }
    const glyph = clamp(0.5 - (minD - STROKE / 2), 0, 1)

    // 混合：白色 ¥ 覆盖在渐变背景上
    buf[i] = Math.round(r + (255 - r) * glyph)
    buf[i + 1] = Math.round(g + (255 - g) * glyph)
    buf[i + 2] = Math.round(b + (255 - b) * glyph)
    buf[i + 3] = Math.round(255 * cover)
  }
}

// ---------- PNG 编码 ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // 位深
ihdr[9] = 6 // 颜色类型 RGBA
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

// 每行前加过滤字节 0
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1))
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0
  buf.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4)
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
])

const outDir = path.join(__dirname, '..', 'resources')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'icon.png'), png)
console.log(`✅ 图标已生成: resources/icon.png (${png.length} bytes, ${SIZE}x${SIZE})`)
