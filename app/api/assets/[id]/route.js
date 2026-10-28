import { readFile } from 'node:fs/promises';
import { filePath } from '../../../../lib/storage.mjs';
export const runtime = 'nodejs';
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const bytes = await readFile(filePath('assets', id, 'png'));
    return new Response(bytes, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=31536000, immutable', 'Content-Disposition': `inline; filename="${id}.png"` } });
  } catch { return Response.json({ error: 'Asset not found.' }, { status: 404 }); }
}
