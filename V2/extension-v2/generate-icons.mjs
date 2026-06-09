import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('public/icon-128.svg', 'utf-8');

const sizes = [16, 48, 128];
for (const size of sizes) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}.png`);
  console.log(`Created icon-${size}.png`);
}
