const names = ['Heart sunglasses', 'Disco ball', 'Watermelon', 'Sunflower', 'Little house', 'Cherries', 'Butterfly', 'Teacup', 'Ribbon heart'];

export const harryAssets = names.map((name, index) => ({
  id: `harry-${index + 1}`,
  name,
  url: `/assets/harry-styles/${index + 1}.png`,
  kind: 'design',
  source: 'hand-drawn sample',
}));

const placements = [
  [92, 224, 112, -8], [268, 219, 140, 3], [449, 228, 105, 8],
  [122, 365, 135, -4], [312, 349, 116, 5], [460, 380, 130, -7],
  [91, 526, 126, 5], [272, 512, 138, -4], [445, 522, 122, 7],
];

export function harrySample() {
  return {
    id: '',
    artist: 'HARRY STYLES',
    tour: 'HARRYWEEN · TOGETHER, TOGETHER',
    city: 'NEW YORK, NY · MADISON SQUARE GARDEN',
    date: '2026-10-30',
    headline: 'TOGETHER,\nTOGETHER.',
    designTitle: 'THE HARRYWEEN EDIT',
    sourceUrl: 'https://www.livenation.com/artist/K8vZ9174XZ0/harry-styles-events',
    coverStyle: 'lavender',
    coverAssetId: '',
    layout: 'collage',
    designs: harryAssets.map((asset, index) => {
      const [x, y, size, rotation] = placements[index];
      return { id: `harry-slot-${index + 1}`, assetId: asset.id, x, y, size, rotation, visible: true };
    }),
  };
}
