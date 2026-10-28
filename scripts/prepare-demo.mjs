import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

// One-time split of the included AI sheet, with gutters checked visually.
// Keep source-sheet.png as the untouched source. Each crop retains its alpha.
const input = 'public/assets/source-sheet.png';
const { width, height } = await sharp(input).metadata();
const xs = [0, Math.round(width / 3), Math.round(width * 2 / 3), width];
const ys = [0, Math.round(height * 0.332), Math.round(height * 0.65), height];
await mkdir('public/assets/demo', { recursive: true });
for (let index = 0; index < 9; index++) {
  const col = index % 3, row = Math.floor(index / 3);
  await sharp(input).extract({ left: xs[col], top: ys[row], width: xs[col + 1] - xs[col], height: ys[row + 1] - ys[row] }).png().toFile(`public/assets/demo/${index + 1}.png`);
}
console.log('Saved 9 independent PNGs; original source sheet retained.');
