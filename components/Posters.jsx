import { formatDate } from '../lib/project.mjs';

const tornEdge = 'polygon(0 0, 97% 0, 98% 3%, 96% 6%, 99% 9%, 97% 12%, 98% 15%, 96% 19%, 99% 22%, 97% 25%, 98% 28%, 96% 31%, 99% 34%, 97% 38%, 98% 42%, 96% 46%, 99% 49%, 97% 52%, 98% 56%, 96% 60%, 99% 63%, 97% 67%, 98% 71%, 96% 75%, 99% 78%, 97% 82%, 98% 86%, 96% 90%, 99% 94%, 97% 97%, 98% 100%, 0 100%)';

export function Cover({ project, assets }) {
  const photo = assets.find(asset => asset.id === project.coverAssetId)?.url || '/assets/concert-arm.png';
  const artistSize = project.artist.length > 42 ? 31 : project.artist.length > 26 ? 38 : project.artist.length > 16 ? 47 : 61;
  return <div className={`poster cover ${project.coverStyle}`}>
    <img className="cover-photo" src={photo} alt="Concert crowd and a raised arm wearing temporary tattoos" draggable={false} />
    <div className="paper-edge" style={{ clipPath: tornEdge }} />
    <div className="paper-panel" style={{ clipPath: tornEdge }} />
    <div className="cover-brand"><strong>FLIKX</strong><span>CUSTOM TEMPORARY TATTOOS</span></div>
    <div className="edition-label"><span>THE CONCERT EDIT</span><span>↗</span></div>
    <div className="cover-headline" style={{ fontSize: project.headline.length > 30 ? 49 : 76 }}>{project.headline || 'WEAR THE\nNIGHT.'}</div>
    <div className="cover-note">FOR THE FANS.<br />FOR THE MOMENT.</div>
    <div className="tour-ticket">
      <div className="ticket-hole top" /><div className="ticket-hole bottom" />
      <small>YOUR NEXT ENCORE</small>
      <div className="artist-name" style={{ fontSize: artistSize }}>{project.artist || 'ARTIST NAME'}</div>
      <div className="ticket-tour">{project.tour || 'TOUR NAME'}</div>
      <div className="ticket-details">{project.city || 'USA'}<i />{formatDate(project.date)}</div>
      <div className="barcode" />
    </div>
    <div className="cover-footer"><span>MAKE IT PERSONAL.</span><b>EXPLORE THE DESIGNS →</b></div>
    <span className="poster-page">01 / 02</span>
  </div>;
}

export function Designs({ project, assets, selected, onSelect, onMove }) {
  const visible = project.designs.filter(slot => slot.visible);
  const drag = (event, slot) => {
    if (!onMove) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(slot.id);
    const rect = event.currentTarget.closest('.poster').getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY, left: slot.x, top: slot.y, scale: rect.width / 540 };
    const move = e => onMove(slot.id, {
      x: Math.max(slot.size / 2 + 12, Math.min(528 - slot.size / 2, start.left + (e.clientX - start.x) / start.scale)),
      y: Math.max(145 + slot.size / 2, Math.min(633 - slot.size / 2, start.top + (e.clientY - start.y) / start.scale)),
    });
    const end = () => { event.currentTarget?.removeEventListener('pointermove', move); };
    const target = event.currentTarget;
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', () => { target.removeEventListener('pointermove', move); }, { once: true });
    target.addEventListener('pointercancel', () => { target.removeEventListener('pointermove', move); }, { once: true });
  };
  return <div className={`poster design-poster ${project.layout}`}>
    <header className="design-brand"><strong>FLIKX</strong><span>THE CONCERT COLLECTION</span><span>02 / 02</span></header>
    <div className="design-heading"><div>{project.designTitle || 'THE FAN EDIT'}</div><h2 style={{ fontSize: project.artist.length > 28 ? 28 : 38 }}>{project.artist || 'ARTIST NAME'}</h2><p>Little designs. A night to remember.</p></div>
    <div className="design-rule"><span>{String(visible.length).padStart(2, '0')} DESIGNS TO MAKE YOURS</span><span>✦</span></div>
    {visible.map(slot => {
      const asset = assets.find(item => item.id === slot.assetId);
      if (!asset) return null;
      const index = project.designs.indexOf(slot);
      return <div key={slot.id} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined}
        aria-label={`Select design ${String(index + 1).padStart(2, '0')}: ${asset.name}`}
        className={`design-item ${selected === slot.id ? 'selected' : ''}`}
        style={{ left: slot.x, top: slot.y, width: slot.size, height: slot.size, transform: `translate(-50%, -50%) rotate(${slot.rotation}deg)` }}
        onPointerDown={event => drag(event, slot)} onClick={() => onSelect?.(slot.id)} onKeyDown={event => { if (event.key === 'Enter') onSelect?.(slot.id); }}>
        <img src={asset.url} alt={asset.name} draggable={false} /><span className="design-number">{String(index + 1).padStart(2, '0')}</span>
      </div>;
    })}
    <footer className="design-footer"><b>WHICH ONE IS YOUR VIBE?</b><span>Pick a number. Make it your own.</span><small>CUSTOM TEMPORARY TATTOOS · FLIKX</small></footer>
  </div>;
}
