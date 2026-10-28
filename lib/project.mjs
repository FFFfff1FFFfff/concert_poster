export const ID = /^[a-zA-Z0-9_-]{1,80}$/;
export const DEMO_NAMES = ['Orbit star', 'Butterfly', 'Cherries', 'Disco ball', 'Crescent moon', 'Rose', 'Microphone', 'Ribbon', 'Flaming heart'];
export const demoAssets = DEMO_NAMES.map((name, i) => ({
  id: `demo-${i + 1}`, name, url: `/assets/demo/${i + 1}.png`, kind: 'design', source: 'starter',
}));

export function makeSlot(assetId, index) {
  return { id: `slot-${index + 1}`, assetId, x: 90 + (index % 3) * 180, y: 212 + Math.floor(index / 3) * 149, size: 124, rotation: 0, visible: true };
}

export function newProject() {
  return {
    id: '', artist: 'ARTIST NAME', tour: 'YOUR NEXT CONCERT', city: 'NEW YORK, NY', date: '',
    headline: 'WEAR THE\nNIGHT.', designTitle: 'THE FAN EDIT', sourceUrl: '',
    coverStyle: 'lavender', coverAssetId: '', layout: 'collage',
    designs: demoAssets.map((asset, index) => makeSlot(asset.id, index)),
  };
}

const number = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
export function validateProject(input) {
  if (!input || typeof input !== 'object') throw new Error('Invalid project.');
  const output = {};
  const limits = { id: 80, artist: 70, tour: 100, city: 80, date: 10, headline: 60, designTitle: 50, sourceUrl: 500, coverAssetId: 80 };
  for (const [key, limit] of Object.entries(limits)) {
    if (typeof input[key] !== 'string' || input[key].length > limit) throw new Error(`Invalid ${key}.`);
    output[key] = input[key].trim();
  }
  if (output.id && !ID.test(output.id)) throw new Error('Invalid project ID.');
  if (output.coverAssetId && !ID.test(output.coverAssetId)) throw new Error('Invalid cover asset.');
  if (output.date && (!/^\d{4}-\d{2}-\d{2}$/.test(output.date) || new Date(output.date + 'T12:00:00Z').toISOString().slice(0, 10) !== output.date)) throw new Error('Invalid date.');
  if (output.sourceUrl && !/^https?:\/\//i.test(output.sourceUrl)) throw new Error('Use an http or https source URL.');
  if (!['lavender', 'paper'].includes(input.coverStyle) || !['collage', 'grid'].includes(input.layout)) throw new Error('Invalid layout.');
  if (!Array.isArray(input.designs) || input.designs.length > 12) throw new Error('Use up to 12 designs.');
  const seen = new Set();
  output.designs = input.designs.map(slot => {
    if (!slot || !ID.test(slot.id) || seen.has(slot.id) || !ID.test(slot.assetId) || !number(slot.x, 20, 520) || !number(slot.y, 145, 620) || !number(slot.size, 45, 200) || !number(slot.rotation, -45, 45) || typeof slot.visible !== 'boolean') throw new Error('Invalid design placement.');
    seen.add(slot.id);
    return { id: slot.id, assetId: slot.assetId, x: slot.x, y: slot.y, size: slot.size, rotation: slot.rotation, visible: slot.visible };
  });
  return { ...output, coverStyle: input.coverStyle, layout: input.layout };
}

export function formatDate(date) {
  if (!date) return 'DATE TBA';
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

export function slug(text) { return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'concert'; }

export function buildPrompt(artist, concept) {
  return `Create ONE original temporary tattoo design. Theme context: ${artist || 'a US concert night'}. Design concept: ${concept}. Black ink only, consistent clean medium-fine linework, simple readable silhouette at small printed sizes. Center one complete isolated motif with generous empty margins on a genuine transparent background. No sheet, collage, typography, numbering, logo, border, skin, mockup, shadow or watermark. Do not reproduce album art or official branding. Output a transparent PNG.`;
}
