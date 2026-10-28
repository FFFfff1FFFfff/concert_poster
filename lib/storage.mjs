import { mkdir, readFile, writeFile, rename, readdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { ID } from './project.mjs';

export const DATA = path.join(process.cwd(), 'data');
export async function writeJSON(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2));
  await rename(temp, file);
}
export async function readJSON(file) { return JSON.parse(await readFile(file, 'utf8')); }
export async function listJSON(folder) {
  await mkdir(folder, { recursive: true });
  const files = (await readdir(folder)).filter(file => file.endsWith('.json'));
  return Promise.all(files.map(file => readJSON(path.join(folder, file))));
}
export function filePath(folder, id, extension = 'json') {
  if (!ID.test(id)) throw new Error('Invalid ID.');
  return path.join(DATA, folder, `${id}.${extension}`);
}
export async function saveAsset(buffer, { name, kind = 'design', source = 'upload', prompt = '', cacheKey = '' }) {
  const image = sharp(buffer, { limitInputPixels: 36_000_000 });
  const metadata = await image.metadata();
  if (!['png', 'jpeg', 'webp'].includes(metadata.format)) throw new Error('Use a PNG, JPEG or WebP image.');
  // PNG input is retained byte-for-byte; other supported formats are normalized to PNG.
  const png = metadata.format === 'png' ? buffer : await image.rotate().png().toBuffer();
  const id = randomUUID();
  const folder = path.join(DATA, 'assets');
  await mkdir(folder, { recursive: true });
  await writeFile(filePath('assets', id, 'png'), png, { flag: 'wx' });
  const asset = { id, name: name.slice(0, 100), kind, source, prompt, cacheKey, createdAt: new Date().toISOString(), url: `/api/assets/${id}`, width: metadata.width, height: metadata.height };
  await writeJSON(filePath('assets', id), asset);
  return asset;
}

export function localRequest(request) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== request.headers.get('host')) throw new Error('Cross-origin writes are not allowed.');
}
export function errorResponse(error, status = 400) {
  return Response.json({ error: error.message || 'Something went wrong.' }, { status });
}
