import path from 'node:path';
import { createHash } from 'node:crypto';
import { DATA, listJSON, saveAsset, localRequest, errorResponse } from '../../../lib/storage.mjs';
import { buildPrompt } from '../../../lib/project.mjs';
export const runtime = 'nodejs';
export const maxDuration = 300;
let running = false;

export async function POST(request) {
  try { localRequest(request); } catch (error) { return errorResponse(error, 403); }
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: 'AI is not connected. Set OPENAI_API_KEY in .env.local, or copy the prompt and upload your PNG.' }, { status: 503 });
  if (running) return Response.json({ error: 'A design is already generating. Please wait.' }, { status: 409 });
  running = true;
  try {
    const { artist, concept } = await request.json();
    if (typeof concept !== 'string' || !concept.trim() || concept.length > 1000 || typeof artist !== 'string' || artist.length > 70) throw new Error('Enter a design idea (up to 1,000 characters).');
    const prompt = buildPrompt(artist, concept.trim());
    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
    const cacheKey = createHash('sha256').update(JSON.stringify({ model, prompt, size: '1024x1024', background: 'transparent', quality: 'medium' })).digest('hex');
    const existing = (await listJSON(path.join(DATA, 'assets'))).find(asset => asset.cacheKey === cacheKey);
    if (existing) return Response.json({ asset: existing, cached: true });
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, n: 1, size: '1024x1024', quality: 'medium', background: 'transparent', output_format: 'png' }),
      signal: AbortSignal.timeout(240_000),
    });
    const data = await response.json();
    if (!response.ok) return Response.json({ error: response.status === 429 ? 'AI rate limit reached. Your saved work is safe. Try later or upload a PNG.' : `AI request failed (${response.status}). Check your API key and model access.` }, { status: response.status === 429 ? 429 : 502 });
    if (!data.data?.[0]?.b64_json) throw new Error('AI returned no image.');
    const asset = await saveAsset(Buffer.from(data.data[0].b64_json, 'base64'), { name: concept.trim().slice(0, 80), source: 'ai', prompt, cacheKey });
    return Response.json({ asset, cached: false });
  } catch (error) { return errorResponse(error, 500); }
  finally { running = false; }
}
