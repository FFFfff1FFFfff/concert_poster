'use client';

import { useEffect, useRef, useState } from 'react';
import { Cover, Designs } from '../components/Posters';
import { buildPrompt, demoAssets, makeSlot, newProject, slug, validateProject } from '../lib/project.mjs';
import { harryAssets, harrySample } from '../lib/harry-sample.mjs';

const DRAFT_KEY = 'flikx-concert-draft-v1';
async function api(url, options) {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed.');
  return result;
}
function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function Icon({ name, size = 18 }) {
  const paths = { download: 'M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5', save: 'M5 3h12l4 4v14H3V3h2m2 0v6h10V3M7 21v-8h10v8', plus: 'M12 5v14M5 12h14', spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z', copy: 'M9 9h12v12H9V9ZM15 9V3H3v12h6', upload: 'M12 16V3m-4 4 4-4 4 4M4 16v5h16v-5', search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', arrow: 'M4 12h16m-6-6 6 6-6 6' };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.plus} /></svg>;
}
function Preview({ children, label, title, posterRef, onDownload, busy }) {
  const container = useRef(null);
  const [scale, setScale] = useState(0.65);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / 540)));
    observer.observe(container.current); return () => observer.disconnect();
  }, []);
  return <section className="preview-card"><div className="preview-caption"><div><span>{label}</span><h3>{title}</h3></div><button className="icon-button" aria-label={`Download ${title}`} onClick={onDownload} disabled={busy}><Icon name="download" /></button></div>
    <div className="preview-container" ref={container}><div className="preview-window" style={{ height: scale * 720, width: scale * 540 }}><div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}><div ref={posterRef}>{children}</div></div></div></div>
    <div className="preview-meta"><span>1080 × 1440 PX</span><span>PNG · 3:4</span></div>
  </section>;
}

export default function Studio() {
  const [project, setProject] = useState(newProject);
  const [assets, setAssets] = useState([...demoAssets, ...harryAssets]);
  const [projects, setProjects] = useState([]);
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState('details');
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [eventsEnabled, setEventsEnabled] = useState(false);
  const [concept, setConcept] = useState('A delicate crescent moon with two small stars');
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState(null);
  const [assetFilter, setAssetFilter] = useState('');
  const coverRef = useRef(null), designsRef = useRef(null), projectRef = useRef(project);
  projectRef.current = project;

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('sample') === 'harry') { setProject(harrySample()); setDirty(true); }
      else { const saved = localStorage.getItem(DRAFT_KEY); if (saved) { setProject(validateProject(JSON.parse(saved))); setDirty(true); } }
    } catch { setError('The previous draft could not be restored. Saved projects are still available.'); }
    Promise.all([api('/api/assets'), api('/api/projects')]).then(([library, saved]) => {
      setAssets(library.assets); setAiEnabled(library.aiEnabled); setEventsEnabled(library.eventsEnabled); setProjects(saved);
    }).catch(error => setError(error.message)).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(project)); } catch { setError('Browser draft storage is full. Use Save project.'); }
  }, [project, ready]);
  useEffect(() => {
    const handler = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  function update(patch) { setProject(current => ({ ...current, ...patch })); setDirty(true); }
  function updateSlot(id, patch) { setProject(current => ({ ...current, designs: current.designs.map(slot => slot.id === id ? { ...slot, ...patch } : slot) })); setDirty(true); }
  async function run(name, action) {
    setBusy(name); setError(''); setStatus('');
    try { await action(); } catch (error) { setError(error.message || 'Something went wrong.'); } finally { setBusy(''); }
  }
  function addAsset(asset) {
    setAssets(current => current.some(item => item.id === asset.id) ? current : [...current, asset]);
    if (asset.kind === 'cover') { update({ coverAssetId: asset.id }); return; }
    setProject(current => {
      if (current.designs.length >= 12) return current;
      const slot = { ...makeSlot(asset.id, current.designs.length), id: crypto.randomUUID(), size: current.designs.length >= 9 ? 95 : 124, y: current.designs.length >= 9 ? 605 : makeSlot(asset.id, current.designs.length).y };
      setSelected(slot.id);
      return { ...current, designs: [...current.designs, slot] };
    });
    setDirty(true);
  }
  async function upload(event, kind) {
    const files = Array.from(event.target.files || []); event.target.value = '';
    if (!files.length) return;
    await run('Uploading', async () => {
      for (const file of files) { const form = new FormData(); form.append('file', file); form.append('kind', kind); addAsset(await api('/api/assets', { method: 'POST', body: form })); }
      setStatus(`${files.length} ${files.length === 1 ? 'image' : 'images'} saved to the library. A sheet holds up to 12 designs.`);
    });
  }
  async function save() {
    await run('Saving', async () => {
      const snapshot = projectRef.current;
      const saved = await api('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot) });
      const unchanged = JSON.stringify(projectRef.current) === JSON.stringify(snapshot);
      setProject(current => ({ ...current, id: saved.id }));
      setProjects(current => [saved, ...current.filter(item => item.id !== saved.id)]);
      setDirty(!unchanged); setStatus(unchanged ? 'Project saved. Original PNGs are retained in your library.' : 'Project saved. Newer edits are still in your draft.');
    });
  }
  function openProject(value) {
    if (dirty && !window.confirm('Open another project? Save first to keep this draft as a project.')) return;
    const next = value === 'new' ? newProject() : value === 'harry' ? harrySample() : projects.find(item => item.id === value);
    if (next) { setProject(next); setDirty(value === 'new' || value === 'harry'); setSelected(''); setStatus(value === 'harry' ? 'Harry Styles sample loaded. Every motif remains downloadable as an original PNG.' : ''); }
  }
  async function posterBlob(ref) {
    await document.fonts.ready;
    await Promise.all(Array.from(ref.current.querySelectorAll('img')).map(img => img.decode()));
    const { toBlob } = await import('html-to-image');
    const result = await toBlob(ref.current, { pixelRatio: 2, width: 540, height: 720, backgroundColor: '#f7f7f2', filter: node => !node.classList?.contains('export-exclude'), style: { margin: '0' } });
    if (!result) throw new Error('Could not export this poster. Please try again.');
    return result;
  }
  async function exportPoster(which) {
    setSelected('');
    await run('Exporting', async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      download(await posterBlob(which === 'cover' ? coverRef : designsRef), `${slug(project.artist)}-${which === 'cover' ? '01-cover' : '02-designs'}.png`);
      setStatus('PNG exported at 1080 × 1440.');
    });
  }
  async function exportKit() {
    setSelected('');
    await run('Exporting', async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const { default: JSZip } = await import('jszip'); const zip = new JSZip();
      zip.file('01-cover.png', await posterBlob(coverRef));
      zip.file('02-designs.png', await posterBlob(designsRef));
      const usedIds = new Set(project.designs.map(slot => slot.assetId));
      if (project.coverAssetId) usedIds.add(project.coverAssetId);
      const manifest = [];
      for (const id of usedIds) {
        const asset = assets.find(item => item.id === id);
        if (!asset) throw new Error(`Missing original asset: ${id}`);
        const response = await fetch(asset.url); if (!response.ok) throw new Error(`Could not export ${asset.name}.`);
        const file = `originals/${id}-${slug(asset.name)}.png`;
        zip.file(file, await response.blob()); manifest.push({ ...asset, file });
      }
      if (!project.coverAssetId) { const response = await fetch('/assets/concert-arm.png'); if (!response.ok) throw new Error('Cover image could not be exported.'); zip.file('originals/cover-background.png', await response.blob()); }
      zip.file('project.json', JSON.stringify({ version: 1, project, assets: manifest, designNumbers: project.designs.map((slot, i) => ({ number: String(i + 1).padStart(2, '0'), assetId: slot.assetId, visible: slot.visible })) }, null, 2));
      zip.file('README.txt', 'FLIKX Concert Studio\n\n01-cover.png and 02-designs.png: 1080 x 1440 social images.\noriginals/: full-resolution PNG assets without poster numbering or backgrounds.\nproject.json: text, placements, number-to-asset mapping, and source metadata.\n\nKeep this folder for future custom orders. AI designs need artwork review before production.\n');
      download(await zip.generateAsync({ type: 'blob' }), `${slug(project.artist)}-poster-kit.zip`);
      setStatus('Kit exported: both posters, original PNGs, and project settings.');
    });
  }
  function arrange(layout) {
    const count = project.designs.length; const rows = Math.ceil(count / 3); const gap = rows > 3 ? 119 : 149;
    const mix = [[92,224,112,-8],[268,219,140,3],[449,228,105,8],[122,365,135,-4],[312,349,116,5],[460,380,130,-7],[91,526,126,5],[272,512,138,-4],[445,522,122,7],[90,594,76,-5],[270,588,84,4],[450,596,74,-3]];
    update({ layout, designs: project.designs.map((slot, index) => layout === 'collage' ? { ...slot, x: mix[index][0], y: mix[index][1], size: mix[index][2], rotation: mix[index][3] } : { ...slot, x: 90 + index % 3 * 180, y: 210 + Math.floor(index / 3) * gap, size: rows > 3 ? 100 : 124, rotation: 0 }) });
  }
  const selectedSlot = project.designs.find(slot => slot.id === selected);
  const selectedAsset = assets.find(asset => asset.id === selectedSlot?.assetId);
  const field = (label, key, maxLength, multiline = false) => <label className="field"><span>{label}</span>{multiline ? <textarea value={project[key]} maxLength={maxLength} rows={2} onChange={event => update({ [key]: event.target.value })} /> : <input value={project[key]} maxLength={maxLength} onChange={event => update({ [key]: event.target.value })} />}</label>;

  return <main>
    <header className="app-header"><a className="brand" href="/">FLIKX<span>CONCERT STUDIO</span></a><div className="header-right"><span className="market"><i /> US EDITION</span><span className="version">V.01</span></div></header>
    <div className="workspace-heading"><div><div className="eyebrow">FROM THE FRONT ROW TO YOUR FEED</div><h1>Your next concert story.</h1><p>One artist. Two slides. A little more you.</p></div><div className="primary-actions"><button disabled={!!busy || !ready} onClick={save}><Icon name="save" />Save project</button><button className="primary" disabled={!!busy || !ready} onClick={exportKit}><Icon name="download" />{busy === 'Exporting' ? 'Exporting…' : 'Export poster kit'}</button></div></div>
    <div className="project-toolbar"><div><span className={`save-dot ${dirty ? 'dirty' : ''}`} />{dirty ? 'Draft · changes not saved' : project.id ? 'Saved project' : 'New project'}</div><div><select aria-label="Open saved project" value={projects.some(item => item.id === project.id) ? project.id : ''} onChange={event => openProject(event.target.value)}><option value="" disabled>Open a saved project</option>{projects.map(item => <option key={item.id} value={item.id}>{item.artist} · {item.city}</option>)}</select><button className="text-button" disabled={!!busy} onClick={() => openProject('harry')}><Icon name="spark" size={15} />Harry sample</button><button className="text-button" disabled={!!busy} onClick={() => { update({ id: '' }); setStatus('Copy created. Edit it, then save as a new project.'); }}><Icon name="copy" size={15} />Duplicate</button><button className="text-button" disabled={!!busy} onClick={() => openProject('new')}><Icon name="plus" size={15} />New</button></div></div>
    {(error || status || busy) && <div className={`notice ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}>{error || (busy ? `${busy}…` : status)}<button aria-label="Dismiss message" onClick={() => { setError(''); setStatus(''); }}>×</button></div>}
    <div className="workspace">
      <aside className="editor-panel"><div className="panel-tabs" role="tablist" aria-label="Editor sections">{[['details', '01', 'Concert'], ['designs', '02', 'Designs']].map(([id, number, label]) => <button role="tab" aria-selected={tab === id} key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><span>{number}</span>{label}</button>)}</div>
        <fieldset disabled={!!busy || !ready} className="editor-fields">
        {tab === 'details' ? <>
          <div className="section-heading"><h2>The concert</h2><span>EN / US</span></div>
          <p className="helper">Change the details once. Both slides follow.</p>
          {field('Artist / band', 'artist', 70)}{field('Tour / show name', 'tour', 100)}
          <div className="field-row">{field('City, state', 'city', 80)}<label className="field"><span>Show date</span><input type="date" value={project.date} onChange={event => update({ date: event.target.value })} /></label></div>
          {field('Event source URL', 'sourceUrl', 500)}
          <details className="fold"><summary><Icon name="search" size={16} />Find upcoming US shows</summary><div className="fold-content"><p className="helper">Music events in the next 60 days. Check the source before publishing.</p><input aria-label="Search artist or band" placeholder="Artist or band (optional)" value={query} onChange={event => setQuery(event.target.value)} />
            {eventsEnabled ? <button className="full-width" onClick={() => run('Searching', async () => { const data = await api(`/api/events?q=${encodeURIComponent(query)}`); setEvents(data.events); })}><Icon name="search" />Search US shows</button> : <><a className="link-button" href={`https://www.ticketmaster.com/search?q=${encodeURIComponent(query || project.artist)}`} target="_blank" rel="noreferrer">Search Ticketmaster ↗</a><p className="helper small">In-app search is available when a Ticketmaster key is configured.</p></>}
            {events?.length === 0 && <p className="helper">No shows found. Try another name.</p>}{events?.map(event => <div className="event-result" key={event.id}><strong>{event.artist}</strong><span>{event.date} · {event.city}</span><a href={event.url} target="_blank" rel="noreferrer">Check source ↗</a><button onClick={() => update({ artist: event.artist.slice(0, 70), tour: event.tour.slice(0, 100), city: event.city.slice(0, 80), date: event.date, sourceUrl: event.url })}>Use this show</button></div>)}
          </div></details>
          <div className="divider" /><div className="section-heading"><h2>The cover</h2><span>01</span></div>
          {field('Headline', 'headline', 60, true)}
          <label className="field"><span>Paper color</span><div className="swatches"><button className={project.coverStyle === 'lavender' ? 'chosen' : ''} onClick={() => update({ coverStyle: 'lavender' })}><i className="lavender-dot" />Cool lavender</button><button className={project.coverStyle === 'paper' ? 'chosen' : ''} onClick={() => update({ coverStyle: 'paper' })}><i className="paper-dot" />White paper</button></div></label>
          <label className="upload-button"><Icon name="upload" />Replace cover photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => upload(event, 'cover')} /></label>
          {project.coverAssetId && <button className="text-button" onClick={() => update({ coverAssetId: '' })}>Use original concert photo</button>}
          <p className="helper small">The photo is reusable. Headlines and artist details remain editable.</p>
        </> : <>
          <div className="section-heading"><h2>The design sheet</h2><span>{project.designs.length} / 12</span></div>
          {field('Collection title', 'designTitle', 50)}
          <div className="segmented"><button className={project.layout === 'collage' ? 'active' : ''} onClick={() => arrange('collage')}>Editorial mix</button><button className={project.layout === 'grid' ? 'active' : ''} onClick={() => arrange('grid')}>Clean grid</button></div>
          <p className="helper">Click a design to adjust it, or drag it on the sheet.</p>
          {selectedSlot && selectedAsset && <div className="selection-editor"><div className="selection-title"><strong>{selectedAsset.name}</strong><button className="text-button" aria-label="Deselect design" onClick={() => setSelected('')}>×</button></div><label className="range-field">Size <input type="range" min="45" max="200" value={selectedSlot.size} onChange={event => updateSlot(selected, { size: +event.target.value })} /></label><label className="range-field">Rotation <input type="range" min="-45" max="45" value={selectedSlot.rotation} onChange={event => updateSlot(selected, { rotation: +event.target.value })} /></label><div className="selection-actions"><button className="text-button" onClick={() => updateSlot(selected, { visible: !selectedSlot.visible })}>{selectedSlot.visible ? 'Hide' : 'Show'}</button><a href={selectedAsset.url} download={`${slug(selectedAsset.name)}.png`}>Original PNG ↓</a><button className="text-button danger" onClick={() => { update({ designs: project.designs.filter(slot => slot.id !== selected) }); setSelected(''); }}>Remove</button></div></div>}
          {project.designs.some(slot => !slot.visible) && <div className="hidden-designs">Hidden: {project.designs.filter(slot => !slot.visible).map(slot => <button key={slot.id} className="text-button" onClick={() => { updateSlot(slot.id, { visible: true }); setSelected(slot.id); }}>Show #{project.designs.indexOf(slot) + 1}</button>)}</div>}
          <div className="divider" /><div className="section-heading"><h2>Asset library</h2><span>PNG</span></div><p className="helper">Originals stay here, even when removed from a sheet.</p>
          <label className="upload-button"><Icon name="upload" />Upload designs<input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={event => upload(event, 'design')} /></label>
          <input className="library-search" aria-label="Search asset library" placeholder="Find a design…" value={assetFilter} onChange={event => setAssetFilter(event.target.value)} />
          <div className="asset-library">{assets.filter(asset => asset.kind === 'design' && asset.name.toLowerCase().includes(assetFilter.toLowerCase())).map(asset => <div className="asset-card" key={asset.id}><button className="asset-add" aria-label={`Add ${asset.name}`} title={`Add ${asset.name}`} disabled={project.designs.length >= 12} onClick={() => addAsset(asset)}><img src={asset.url} alt={asset.name} /><span>+</span></button><div><span title={asset.name}>{asset.name}</span><a href={asset.url} download={`${slug(asset.name)}.png`} aria-label={`Download original ${asset.name}`}><Icon name="download" size={13} /></a></div></div>)}</div>
          <details className="fold ai-fold"><summary><Icon name="spark" size={16} />Create a new design<span className="tag">AI</span></summary><div className="fold-content"><p className="helper">Generate one reusable motif. Matching requests reuse the saved PNG.</p><textarea aria-label="Design idea" rows={3} maxLength={1000} value={concept} onChange={event => setConcept(event.target.value)} /><button className="full-width" onClick={() => run('Copying', async () => { await navigator.clipboard.writeText(buildPrompt(project.artist, concept)); setStatus('Prompt copied. Generate the motif, then upload the PNG.'); })}><Icon name="copy" />Copy image prompt</button><button className="primary full-width" disabled={!aiEnabled || !concept.trim()} onClick={() => run('Generating design', async () => { const data = await api('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ artist: project.artist, concept }) }); addAsset(data.asset); setStatus(data.cached ? 'Reused the saved original. No new AI request.' : 'New PNG saved to your library.'); })}><Icon name="spark" />Generate PNG</button><p className="helper small">{aiEnabled ? 'Uses your connected API account. One design per request.' : 'Add OPENAI_API_KEY to .env.local to enable generation. Prompt + upload works now.'}</p></div></details>
        </>}
        </fieldset>
      </aside>
      <div className="preview-workspace"><div className="canvas-toolbar"><span><i /> LIVE PREVIEW</span><span>Cold purple. Warm memories.</span></div><div className="preview-grid">
        <Preview label="SLIDE 01" title="The cover" posterRef={coverRef} busy={!!busy} onDownload={() => exportPoster('cover')}><Cover project={project} assets={assets} /></Preview>
        <Preview label="SLIDE 02" title="The design edit" posterRef={designsRef} busy={!!busy} onDownload={() => exportPoster('designs')}><Designs project={project} assets={assets} selected={selected} onSelect={id => { if (!busy) { setSelected(id); setTab('designs'); } }} onMove={busy ? undefined : updateSlot} /></Preview>
      </div><div className="export-note"><Icon name="download" size={17} /><p><strong>Made to post. Saved to reuse.</strong> Your kit includes both slides and every original design PNG.</p></div></div>
    </div>
    <footer className="app-footer"><span>FLIKX CONCERT STUDIO</span><span>DESIGNED FOR THE MOMENT. BUILT TO USE AGAIN.</span></footer>
  </main>;
}
