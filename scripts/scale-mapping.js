// Usage: node scripts/scale-mapping.js <input-json> <newWidth> <newHeight>
// Scales zones and background size from current bgWidth/bgHeight to the new size.

const fs = require('fs');

function round(value) {
  return Math.round(Number(value));
}

function scaleMapping(filePath, newWidth, newHeight) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const mapping = JSON.parse(raw);

  if (!mapping || typeof mapping !== 'object') {
    throw new Error('Invalid mapping JSON');
  }
  if (!Array.isArray(mapping.zones)) {
    throw new Error('Mapping has no zones array');
  }
  const oldWidth = Number(mapping.bgWidth || 0);
  const oldHeight = Number(mapping.bgHeight || 0);
  if (!oldWidth || !oldHeight) {
    throw new Error('Mapping missing bgWidth/bgHeight');
  }

  const scaleX = Number(newWidth) / oldWidth;
  const scaleY = Number(newHeight) / oldHeight;

  mapping.zones = mapping.zones.map((zone) => {
    const z = { ...zone };
    if (typeof z.x === 'number') z.x = round(z.x * scaleX);
    if (typeof z.y === 'number') z.y = round(z.y * scaleY);
    if (typeof z.width === 'number') z.width = round(z.width * scaleX);
    if (typeof z.height === 'number') z.height = round(z.height * scaleY);
    return z;
  });

  mapping.bgWidth = round(Number(newWidth));
  mapping.bgHeight = round(Number(newHeight));

  fs.writeFileSync(filePath, JSON.stringify(mapping, null, 2), 'utf8');
}

function main() {
  const [,, filePath, w, h] = process.argv;
  if (!filePath || !w || !h) {
    console.error('Usage: node scripts/scale-mapping.js <input-json> <newWidth> <newHeight>');
    process.exit(1);
  }
  scaleMapping(filePath, Number(w), Number(h));
  console.log(`Scaled ${filePath} to ${w}x${h}`);
}

main();



