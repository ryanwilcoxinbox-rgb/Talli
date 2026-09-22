// Renders the PWA icons from inline SVG. Run with `npm run icons`.
import sharp from 'sharp';

const marks = (s) => `
  <g stroke-linecap="round" stroke-width="${6 * s}" transform="scale(${s})">
    <path d="M17 16v32" stroke="#8DBB8B"/><path d="M27 16v32" stroke="#F4C94F"/>
    <path d="M37 16v32" stroke="#A8B3EE"/><path d="M47 16v32" stroke="#3A2A56"/>
    <path d="M11 40 53 22" stroke="#EC7A5C"/>
  </g>`;

const icon = (size, maskable) => {
  const inset = maskable ? size * 0.2 : size * 0.12;
  const s = (size - inset * 2) / 64;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${maskable ? 0 : size * 0.22}" fill="#FBF6EE"/>
    <g transform="translate(${inset} ${inset})">${marks(s).replace(/stroke-width="[^"]+"/, 'stroke-width="6"')}</g>
  </svg>`);
};

const out = [
  ['public/icon-192.png', 192, false],
  ['public/icon-512.png', 512, false],
  ['public/icon-maskable-512.png', 512, true],
  ['public/apple-touch-icon.png', 180, true],
];
for (const [file, size, maskable] of out) {
  await sharp(icon(size, maskable)).png().toFile(file);
  console.log('wrote', file);
}
