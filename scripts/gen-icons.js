/*
 * Generates the PWA icons from scratch so the repo carries no binary blobs and
 * has no image-library dependency. Run with: npm run icons
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BRAND = [0x0b, 0x6b, 0x4f];
const WHITE = [0xff, 0xff, 0xff];

// 5x7 bitmap glyphs — enough for the wordmark, nothing more.
const GLYPHS = {
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  Z: ['11111', '00010', '00010', '00100', '01000', '10000', '11111'],
};

/* ------------------------------------------------------------ PNG encoding */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  // 10-12: compression, filter, interlace — all zero.

  // Each scanline is prefixed with filter type 0 (none).
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0;
    rgb.copy(raw, rowStart + 1, y * width * 3, (y + 1) * width * 3);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------- the drawing */

function drawIcon(size, contentScale) {
  const pixels = Buffer.alloc(size * size * 3);
  const put = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 3;
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
  };

  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) put(x, y, BRAND);

  // "EZ" — two 5x7 glyphs with a one-cell gap between them.
  const cols = 5 + 1 + 5;
  const rows = 7;
  const cell = Math.floor((size * contentScale) / cols);
  const originX = Math.floor((size - cell * cols) / 2);
  const originY = Math.floor((size - cell * rows) / 2);

  ['E', 'Z'].forEach((letter, index) => {
    const offsetX = originX + index * 6 * cell;
    GLYPHS[letter].forEach((row, ry) => {
      [...row].forEach((bit, rx) => {
        if (bit !== '1') return;
        for (let dy = 0; dy < cell; dy += 1) {
          for (let dx = 0; dx < cell; dx += 1) {
            put(offsetX + rx * cell + dx, originY + ry * cell + dy, WHITE);
          }
        }
      });
    });
  });

  return encodePng(size, size, pixels);
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  ['icon-192.png', 192, 0.72],
  ['icon-512.png', 512, 0.72],
  // Maskable icons get cropped to a circle by Android, so the mark sits smaller.
  ['icon-maskable-512.png', 512, 0.5],
];

for (const [name, size, scale] of targets) {
  fs.writeFileSync(path.join(outDir, name), drawIcon(size, scale));
  console.log(`wrote public/icons/${name}`);
}
