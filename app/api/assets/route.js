import path from 'node:path';
import { DATA, listJSON, saveAsset, localRequest, errorResponse } from '../../../lib/storage.mjs';
import { demoAssets } from '../../../lib/project.mjs';
import { harryAssets } from '../../../lib/harry-sample.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const assets = await listJSON(path.join(DATA, 'assets'));
  return Response.json({ assets: [...demoAssets, ...harryAssets, ...assets.sort((a, b) => a.createdAt.localeCompare(b.createdAt))], aiEnabled: Boolean(process.env.OPENAI_API_KEY), eventsEnabled: Boolean(process.env.TICKETMASTER_API_KEY) });
}

export async function POST(request) {
  try {
    localRequest(request);
    if (Number(request.headers.get('content-length')) > 16_000_000) throw new Error('Maximum upload is 15 MB.');
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function' || !file.size || file.size > 15_000_000) throw new Error('Choose an image under 15 MB.');
    const kind = form.get('kind') === 'cover' ? 'cover' : 'design';
    const asset = await saveAsset(Buffer.from(await file.arrayBuffer()), { name: file.name.replace(/\.[^.]+$/, ''), kind });
    return Response.json(asset);
  } catch (error) { return errorResponse(error); }
}
