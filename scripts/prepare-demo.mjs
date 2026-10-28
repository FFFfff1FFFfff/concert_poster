import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

// Split a transparent 3 x 3 source sheet while retaining the untouched source.
const input = process.argv[2] || 'public/assets/source-sheet.png';
const output = process.argv[3] || 'public/assets/demo';
const { width, height } = await sharp(input).metadata();
const xs = [0, Math.round(width / 3), Math.round(width * 2 / 3), width];
const ys = [0, Math.round(height / 3), Math.round(height * 2 / 3), height];
await mkdir(output, { recursive: true });
for (let index = 0; index < 9; index++) {
  const col = index % 3, row = Math.floor(index / 3);
  await sharp(input).extract({ left: xs[col], top: ys[row], width: xs[col + 1] - xs[col], height: ys[row + 1] - ys[row] }).png().toFile(`${output}/${index + 1}.png`);
}
console.log(`Saved 9 independent PNGs to ${output}; original source sheet retained.`);
