import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const W = 1080, H = 1440;
const root = 'public/assets/harry-styles';
const out = 'output/harry-styles';
await mkdir(out, { recursive: true });

const svg = body => Buffer.from(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><style>
  .sans{font-family:Arial,sans-serif}.narrow{font-family:'Arial Narrow',Arial,sans-serif}.caps{letter-spacing:4px}.ink{fill:#1b1a29}
</style>${body}</svg>`);

const torn = 'M0 0H620L612 50 627 96 614 141 625 187 608 232 623 278 611 323 626 369 614 414 629 459 610 505 624 550 613 596 628 642 609 688 625 733 612 779 627 824 610 870 624 916 613 961 628 1007 609 1052 624 1098 611 1143 627 1189 612 1234 625 1280 608 1326 620 1371 612 1440H0Z';
const coverOverlay = svg(`
  <path d="${torn}" fill="#c4c3f3"/>
  <path d="${torn}" fill="none" stroke="#f4f3ff" stroke-width="10" opacity=".75"/>
  <text x="60" y="82" class="sans ink" font-size="52" font-weight="700" letter-spacing="-2">FLIKX</text>
  <text x="61" y="111" class="sans ink caps" font-size="12">CUSTOM TEMPORARY TATTOOS</text>
  <line x1="60" y1="190" x2="520" y2="190" stroke="#29273c" opacity=".55"/>
  <text x="60" y="229" class="sans ink caps" font-size="14">THE CONCERT EDIT</text>
  <text x="512" y="229" class="sans ink" font-size="22">↗</text>
  <line x1="60" y1="252" x2="520" y2="252" stroke="#29273c" opacity=".55"/>
  <text x="56" y="395" class="narrow ink" font-size="102" font-weight="800" letter-spacing="-3">TOGETHER,</text>
  <text x="56" y="490" class="narrow ink" font-size="102" font-weight="800" letter-spacing="-3">TOGETHER.</text>
  <text x="62" y="588" class="sans ink caps" font-size="15">FOR THE FANS.</text>
  <text x="62" y="620" class="sans ink caps" font-size="15">FOR THE MOMENT.</text>
  <g transform="rotate(-2 540 1080)">
    <rect x="42" y="922" width="996" height="320" fill="#fafaf5" stroke="#b7b6c3" stroke-width="2"/>
    <circle cx="996" cy="922" r="15" fill="#7775a4"/><circle cx="996" cy="1242" r="15" fill="#7775a4"/>
    <line x1="970" y1="922" x2="970" y2="1242" stroke="#858390" stroke-width="2" stroke-dasharray="8 8"/>
    <text x="86" y="972" class="sans ink caps" font-size="13">YOUR NEXT ENCORE</text>
    <text x="82" y="1070" class="narrow ink" font-size="94" font-weight="800">HARRY STYLES</text>
    <line x1="84" y1="1102" x2="926" y2="1102" stroke="#b9b8c2" stroke-width="2"/>
    <text x="86" y="1144" class="narrow ink" font-size="28" font-weight="700" letter-spacing="2">HARRYWEEN · TOGETHER, TOGETHER</text>
    <text x="86" y="1196" class="sans ink" font-size="15" letter-spacing="2">NEW YORK, NY · MADISON SQUARE GARDEN   /   OCT 30, 2026</text>
    <g stroke="#282735" stroke-width="3">${Array.from({length:16},(_,i)=>`<line x1="${985+i%4*6}" y1="${958+i*15}" x2="${985+(i%4)*6}" y2="${965+i*15}"/>`).join('')}</g>
  </g>
  <rect x="60" y="1304" width="316" height="58" fill="#29263e"/>
  <text x="88" y="1341" class="sans caps" font-size="14" fill="#f2f1ff">EXPLORE THE DESIGNS →</text>
  <text x="1010" y="1390" class="sans caps" font-size="12" fill="#ffffff" opacity=".75">01 / 02</text>
`);

await sharp('public/assets/concert-arm.png')
  .resize(W, H, { fit: 'cover' })
  .composite([{ input: coverOverlay }])
  .png().toFile(`${out}/01-cover.png`);

const placements = [
  [166, 430, 230, -7], [520, 410, 270, 3], [886, 435, 220, 7],
  [224, 715, 250, -4], [600, 690, 220, 5], [908, 740, 238, -6],
  [168, 1010, 230, 5], [520, 990, 260, -4], [874, 1010, 235, 6],
];
const names = ['HEART SHADES','DISCO BALL','WATERMELON','SUNFLOWER','LITTLE HOUSE','CHERRIES','BUTTERFLY','TEACUP','RIBBON HEART'];
const composites = [];
for (let i = 0; i < placements.length; i++) {
  const [cx, cy, size, angle] = placements[i];
  const input = await sharp(`${root}/${i + 1}.png`).resize(size, size, { fit: 'contain' }).rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const meta = await sharp(input).metadata();
  composites.push({ input, left: Math.round(cx - meta.width / 2), top: Math.round(cy - meta.height / 2) });
}

const labels = placements.map(([x,y,size], i) => {
  const n = String(i + 1).padStart(2, '0');
  return `<g><circle cx="${x - size/2 + 24}" cy="${y + size/2 - 5}" r="24" fill="#cbc7ef" stroke="#756baf"/><text x="${x - size/2 + 24}" y="${y + size/2 + 2}" text-anchor="middle" class="sans ink" font-size="15" font-weight="700">${n}</text><text x="${x}" y="${y + size/2 + 12}" text-anchor="middle" class="sans ink caps" font-size="11">${names[i]}</text></g>`;
}).join('');

const sheetBase = svg(`
  <defs><filter id="grain"><feTurbulence baseFrequency=".8" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .05 0"/></filter></defs>
  <rect width="1080" height="1440" fill="#efeffb"/><rect width="1080" height="1440" filter="url(#grain)" opacity=".5"/>
  <text x="58" y="72" class="sans ink" font-size="42" font-weight="700" letter-spacing="-2">FLIKX</text>
  <text x="540" y="66" text-anchor="middle" class="sans ink caps" font-size="13">THE CONCERT COLLECTION</text>
  <text x="1022" y="66" text-anchor="end" class="sans ink caps" font-size="13">02 / 02</text>
  <line x1="58" y1="98" x2="1022" y2="98" stroke="#aaa5c8" stroke-width="2"/>
  <text x="540" y="150" text-anchor="middle" class="sans caps" font-size="13" fill="#7368ad">THE HARRYWEEN EDIT</text>
  <text x="540" y="228" text-anchor="middle" class="narrow ink" font-size="72" font-weight="800" letter-spacing="2">HARRY STYLES</text>
  <text x="540" y="265" text-anchor="middle" class="sans" font-size="16" fill="#746f89">Little drawings. One unforgettable night.</text>
  <line x1="58" y1="305" x2="1022" y2="305" stroke="#aaa5c8"/>
  <text x="58" y="336" class="sans caps" font-size="12" fill="#746f89">09 HAND-DRAWN DESIGNS TO MAKE YOURS</text>
  <text x="1022" y="339" text-anchor="end" class="sans" font-size="25" fill="#766bb0">✦</text>
  <line x1="58" y1="1245" x2="1022" y2="1245" stroke="#aaa5c8" stroke-width="2"/>
  <text x="540" y="1307" text-anchor="middle" class="narrow ink" font-size="40" font-weight="800" letter-spacing="2">WHICH ONE IS YOUR VIBE?</text>
  <text x="540" y="1345" text-anchor="middle" class="sans" font-size="16" fill="#746f89">Pick a number. We’ll make it yours.</text>
  <text x="540" y="1390" text-anchor="middle" class="sans caps" font-size="11" fill="#837d9a">CUSTOM TEMPORARY TATTOOS · FLIKX</text>
`);
const labelOverlay = svg(labels);
await sharp(sheetBase).composite([...composites, { input: labelOverlay }]).png().toFile(`${out}/02-designs.png`);

console.log(`Rendered ${out}/01-cover.png and ${out}/02-designs.png`);
