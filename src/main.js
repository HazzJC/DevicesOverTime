import { devices } from './data.js';
import { artStyle, categories } from './art.js';

const icons = {
  all: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/>',
  phones: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 5h4m-3 14h2"/>',
  laptops: '<path d="M5 4h14v12H5zM3 16h18l2 4H1l2-4Zm6 4h6"/>',
  desktops: '<rect x="5" y="2" width="14" height="20" rx="1.5"/><path d="M8 6h8M8 10h8m-8 7h1m3 0h4"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  left: '<path d="m14 5-7 7 7 7"/>', right: '<path d="m10 5 7 7-7 7"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  hand: '<path d="M8 13V5a1.5 1.5 0 0 1 3 0v7-9a1.5 1.5 0 0 1 3 0v9-7a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v8c0 4-3 6-6 6h-1c-2 0-3-1-4-3l-5-6a1.5 1.5 0 0 1 2-2l2 2Z"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/><path d="M10 10h4v4h-4z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
  upgrade: '<path d="M12 21V3m-6 6 6-6 6 6M5 17H3v4h18v-4h-2"/>',
};
const icon = (name) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.chip}</svg>`;
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL = (value) => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? escape(url.href) : '#'; } catch { return '#'; } };
const byId = new Map(devices.map(device => [device.id, device]));
const sorted = [...devices].sort((a, b) => a.year - b.year || devices.indexOf(a) - devices.indexOf(b));
const timeline = document.querySelector('#timeline');
const track = document.querySelector('#timeline-track');
const quick = document.querySelector('#quick-card');
const details = document.querySelector('#details-dialog');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let category = 'all';
let selected = byId.has(location.hash.slice(1)) ? location.hash.slice(1) : 'nokia-e71';
let visible = sorted;
let positions = new Map();
let spacing = 360;
let scrollTimer;
let quickTimer;
let pointer = null;
let suppressClick = false;
let detailTab = 'overview';

function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
}
function art(device, className = '') {
  return `<span class="device-art ${className}" style="${artStyle(device)}" role="img" aria-label="Illustration of ${escape(device.name)}"></span>`;
}
function announce(text) { document.querySelector('#announcement').textContent = text; }
function renderCollection() {
  document.querySelector('#collection').innerHTML = categories.map(group => `<section class="collection-group"><div class="collection-heading"><h2>${group.title}</h2><span>${group.count}</span><button class="collection-filter" data-filter="${group.id}" aria-label="Show ${group.title.toLowerCase()} on timeline">${icon('arrow')}</button></div><div class="thumbnail-strip" aria-label="${group.title}">${devices.filter(d => d.category === group.id && !d.upgradeOf).map(d => `<button class="thumbnail ${d.id === selected ? 'selected' : ''}" data-id="${d.id}" title="${escape(d.name)} · ${escape(d.acquired)}" aria-label="Select ${escape(d.name)}, acquired ${escape(d.acquired)}" aria-pressed="${d.id === selected}">${art(d)}<span class="thumbnail-year">${d.year}</span></button>`).join('')}</div></section>`).join('');
}
function renderTimeline() {
  visible = category === 'all' ? sorted : sorted.filter(d => d.category === category);
  spacing = innerWidth <= 600 ? 285 : innerWidth <= 1100 ? 335 : 375;
  const padding = timeline.clientWidth / 2;
  const extraGap = 28;
  let cursor = padding;
  positions = new Map();
  for (let i = 0; i < visible.length; i++) {
    if (i && visible[i].year !== visible[i - 1].year) cursor += extraGap;
    positions.set(visible[i].id, cursor);
    cursor += spacing;
  }
  track.style.width = `${Math.max(timeline.clientWidth, cursor - spacing + padding)}px`;
  track.innerHTML = `<div class="axis" style="left:${padding}px;right:${padding}px"></div>` + visible.map((d, index) => `<article class="device-node ${d.category} ${d.id === selected ? 'selected' : ''} ${d.upgradeOf ? 'upgrade-node' : ''}" data-id="${d.id}" style="left:${positions.get(d.id)}px"><button class="device-object" data-open="${d.id}" aria-label="Explore ${escape(d.name)}, acquired ${escape(d.acquired)}">${art(d)}<span class="device-platform" aria-hidden="true"></span></button><div class="device-caption">${d.upgradeOf ? `<span class="upgrade-label">${icon('upgrade')} CPU UPGRADE</span>` : ''}<h2><button data-open="${d.id}">${escape(d.name)}</button></h2><p>${escape(d.subtitle || d.acquired)}</p></div><span class="connector" aria-hidden="true"></span><button class="timeline-dot" data-select="${d.id}" aria-label="Select ${escape(d.name)}" aria-pressed="${d.id === selected}"></button><span class="node-year">${escape(d.acquired)}</span>${index === 0 || visible[index - 1].year !== d.year ? '' : '<span class="same-year" aria-hidden="true"></span>'}</article>`).join('');
  document.querySelector('#view-label').textContent = category === 'all' ? 'THE COLLECTION' : `THE ${category.toUpperCase()}`;
  const baseCount = visible.filter(d => !d.upgradeOf).length;
  document.querySelector('#view-count').textContent = `${baseCount} ${category === 'desktops' ? 'builds' : 'devices'}${visible.some(d => d.upgradeOf) ? ' · 1 upgrade' : ''}`;
  document.querySelectorAll('.filter').forEach(button => { const active = button.dataset.category === category; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active); });
  renderOverview();
  updateSelected();
}
function renderOverview() {
  const years = [...new Set(visible.map(d => d.year))];
  document.querySelector('#year-overview').innerHTML = `<span class="overview-line" aria-hidden="true"></span>${years.map(year => `<button class="year-marker" data-year="${year}" style="--year-position:${(year - 2006) / 20 * 100}%" aria-label="Jump to ${year}" title="${year}"><span></span><small>${year}</small></button>`).join('')}`;
}
function updateSelected() {
  const current = byId.get(selected);
  document.querySelectorAll('.device-node').forEach(node => node.classList.toggle('selected', node.dataset.id === selected));
  document.querySelectorAll('.thumbnail').forEach(button => { const on = button.dataset.id === selected || current?.upgradeOf === button.dataset.id; button.classList.toggle('selected', on); button.setAttribute('aria-pressed', on); });
  document.querySelectorAll('.timeline-dot').forEach(button => button.setAttribute('aria-pressed', button.dataset.select === selected));
  document.querySelectorAll('.year-marker').forEach(button => { const on = Number(button.dataset.year) === current?.year; button.classList.toggle('active', on); button.setAttribute('aria-current', on ? 'date' : 'false'); });
  const index = visible.findIndex(d => d.id === selected);
  document.querySelector('.previous').disabled = index <= 0;
  document.querySelector('.next').disabled = index >= visible.length - 1;
}
function centerSelected(instant = false) {
  const position = positions.get(selected);
  if (position !== undefined) timeline.scrollTo({ left: position - timeline.clientWidth / 2, behavior: instant || reducedMotion.matches ? 'instant' : 'smooth' });
}
function selectDevice(id, { center = true, instant = false, updateHash = true } = {}) {
  const device = byId.get(id);
  if (!device) return;
  hideQuick();
  selected = id;
  if (category !== 'all' && category !== device.category) { category = device.category; renderTimeline(); }
  updateSelected();
  if (center) centerSelected(instant);
  if (updateHash) history.replaceState(null, '', `#${id}`);
  announce(`${device.name}, acquired ${device.acquired}${device.upgradeOf ? ', CPU upgrade' : ''}`);
}
function filterCategory(next) {
  hideQuick();
  const year = byId.get(selected)?.year || 2009;
  category = next;
  const candidates = category === 'all' ? sorted : sorted.filter(d => d.category === category);
  if (!candidates.some(d => d.id === selected)) selected = [...candidates].sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year))[0].id;
  renderTimeline();
  selectDevice(selected, { instant: true });
  announce(`${category === 'all' ? 'All devices' : category} timeline, ${visible.length} milestones`);
}
function step(direction) {
  const index = visible.findIndex(d => d.id === selected);
  const next = visible[Math.max(0, Math.min(visible.length - 1, index + direction))];
  if (next) selectDevice(next.id);
}
function hideQuick() { clearTimeout(quickTimer); quick.classList.remove('visible'); quick.setAttribute('aria-hidden', 'true'); quick.inert = true; }
function showQuick(id) {
  if (innerWidth < 900 || pointer || details.open) return;
  const device = byId.get(id);
  if (!device) return;
  const node = track.querySelector(`[data-id="${id}"]`);
  if (!node) return;
  const rect = node.getBoundingClientRect();
  const sectionRect = document.querySelector('.timeline-section').getBoundingClientRect();
  const desiredLeft = rect.left - sectionRect.left + rect.width / 2 + 108;
  const left = Math.min(sectionRect.width - 294, Math.max(30, desiredLeft));
  quick.style.left = `${left}px`;
  const specs = [...(device.ownedSpecs || []), ...(device.productSpecs || [])].filter(([, value]) => !/not recorded|not separately recorded/i.test(value));
  const unique = specs.filter(([label], i) => specs.findIndex(([other]) => other === label) === i).slice(0, 3);
  quick.innerHTML = `<span class="quick-kicker">${escape(device.acquired)} · ${device.upgradeOf ? 'UPGRADE' : 'ACQUIRED'}</span><h3>${escape(device.name)}</h3><p class="quick-release">${device.category === 'desktops' ? (device.upgradeOf ? 'Upgrade to the 2021 build' : 'Custom PC build') : device.release ? `Released ${escape(device.release)}` : 'Release date not recorded'}</p><ul>${unique.map(([label, value]) => `<li>${icon('chip')}<span><small>${escape(label)}</small>${escape(value)}</span></li>`).join('')}</ul><p class="quick-story">${escape((device.facts || [])[0] || device.story || '')}</p><button class="quick-more" data-open="${id}">Explore device ${icon('arrow')}</button>`;
  quick.classList.add('visible'); quick.setAttribute('aria-hidden', 'false'); quick.inert = false;
}
function sourceLink(source, label) { return `<a href="${safeURL(typeof source === 'object' ? source.url : source)}" target="_blank" rel="noopener noreferrer">${escape(label || source.label || 'Source')}${icon('external')}</a>`; }
function specTable(rows) { return `<dl class="spec-table">${rows.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`; }
function detailBody(device) {
  if (detailTab === 'specifications') return `<section><span class="section-label">PERSONAL RECORD</span><h3>Recorded configuration</h3>${device.ownedSpecs?.length ? specTable(device.ownedSpecs) : '<p class="muted">The exact configuration was not recorded.</p>'}${device.productSpecs?.length ? `<span class="section-label">MODEL REFERENCE</span><h3>Product specifications</h3><p class="small-note">Model information, separate from the configuration recorded above.</p>${specTable(device.productSpecs)}` : ''}</section>`;
  if (detailTab === 'benchmarks') return `<section><span class="section-label">PUBLISHED TEST RESULTS</span><h3>Performance, in context</h3><p class="small-note">Reference results from published tests. These are not measurements of Harry’s device. Compare only matching test versions and configurations.</p>${device.benchmarks?.length ? device.benchmarks.map(b => `<article class="benchmark"><div><span>${escape(b.label)}</span><strong>${escape(b.value)}</strong></div><p>${escape(b.context)}</p>${sourceLink(b.source, 'View benchmark source')}</article>`).join('') : '<div class="no-benchmark">'+icon('chip')+'<p>No sourced benchmark is included for this model.</p><span>Its specifications and place in the timeline still tell part of the story.</span></div>'}</section>`;
  const base = device.upgradeOf ? byId.get(device.upgradeOf) : null;
  const upgrades = devices.filter(d => d.upgradeOf === device.id);
  return `<p class="device-story">${escape(device.story || device.subtitle || '')}</p><div class="date-grid"><div><span>JOINED THE COLLECTION</span><strong>${escape(device.acquired)}</strong></div><div><span>${device.category === 'desktops' ? 'TYPE' : 'PRODUCT RELEASE'}</span><strong>${escape(device.category === 'desktops' ? (device.upgradeOf ? 'CPU upgrade' : 'Custom build') : device.release || 'Not recorded')}</strong></div></div>${device.price ? `<div class="price-card"><div><span>${escape(device.price.label || 'Original launch price')}</span><strong>${escape(device.price.value)}</strong></div>${sourceLink(device.price.source, 'Price source')}<p>Reference price · not the price paid</p></div>` : ''}${device.facts?.length ? `<h3>Little details. Big differences.</h3><ul class="fun-facts">${device.facts.map(f => `<li>${icon('spark')}<span>${escape(f)}</span></li>`).join('')}</ul>` : ''}${base ? `<button class="upgrade-link" data-related="${base.id}">${icon('upgrade')}<span><small>PART OF THE SAME BUILD</small>${escape(base.name)} · ${escape(base.acquired)}</span>${icon('arrow')}</button>` : ''}${upgrades.map(d => `<button class="upgrade-link" data-related="${d.id}">${icon('upgrade')}<span><small>THE NEXT CHAPTER · ${d.year}</small>${escape(d.name)}</span>${icon('arrow')}</button>`).join('')}`;
}
function renderDetails() {
  const device = byId.get(selected);
  document.querySelector('#detail-content').innerHTML = `<div class="detail-visual ${device.category}"><span class="eyebrow">${device.upgradeOf ? 'THE UPGRADE' : device.category.toUpperCase()}</span>${art(device)}<div class="detail-platform"></div><span class="detail-year">${escape(device.acquired)}</span><span class="illustration-note">Reference illustration</span></div><div class="detail-copy"><div class="detail-heading"><span class="eyebrow">${escape(device.acquired)} · ${device.upgradeOf ? 'UPGRADED' : 'ACQUIRED'}</span><h2 id="detail-title">${escape(device.name)}</h2><p>${escape(device.subtitle || '')}</p></div><div class="detail-tabs" role="tablist" aria-label="Device information">${[['overview','Overview'],['specifications','Specifications'],['benchmarks','Benchmarks']].map(([id,label]) => `<button role="tab" id="tab-${id}" aria-selected="${detailTab === id}" aria-controls="detail-panel" tabindex="${detailTab === id ? '0' : '-1'}" data-tab="${id}">${label}${id === 'benchmarks' && device.benchmarks?.length ? '<span class="tab-indicator"></span>' : ''}</button>`).join('')}</div><div id="detail-panel" class="detail-panel" role="tabpanel" aria-labelledby="tab-${detailTab}" tabindex="0">${detailBody(device)}${device.sources?.length ? `<details class="sources"><summary>Sources & further reading <span>${device.sources.length}</span></summary><ul>${device.sources.map(s => `<li>${sourceLink(s)}</li>`).join('')}</ul></details>` : ''}</div></div><div class="detail-navigation"><button class="text-button" data-detail-step="-1" ${visible[0]?.id === selected ? 'disabled' : ''}>${icon('left')} Previous device</button><span>${visible.findIndex(d => d.id === selected) + 1} / ${visible.length}</span><button class="text-button" data-detail-step="1" ${visible.at(-1)?.id === selected ? 'disabled' : ''}>Next device ${icon('right')}</button></div>`;
}
function openDetails(id) { selectDevice(id); detailTab = 'overview'; renderDetails(); if (!details.open) details.showModal(); hideQuick(); }
function renderSearch() {
  const query = document.querySelector('#search-input').value.trim().toLowerCase();
  const matches = sorted.filter(d => `${d.name} ${d.year} ${d.acquired} ${d.subtitle} ${d.story} ${(d.ownedSpecs || []).flat().join(' ')}`.toLowerCase().includes(query));
  document.querySelector('#search-results').innerHTML = matches.length ? `<p class="search-count">${matches.length} ${matches.length === 1 ? 'match' : 'matches'}</p>${matches.map(d => `<button class="search-result" data-result="${d.id}">${art(d)}<span><strong>${escape(d.name)}</strong><small>${escape(d.acquired)} · ${d.upgradeOf ? 'Desktop upgrade' : categories.find(c => c.id === d.category).title}</small></span>${icon('arrow')}</button>`).join('')}` : '<p class="search-empty">No devices found. Try a different name, year or component.</p>';
}
function openSearch() { hideQuick(); renderSearch(); document.querySelector('#search-dialog').showModal(); document.querySelector('#search-input').focus(); }

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (suppressClick && timeline.contains(button)) { event.preventDefault(); return; }
  if (button.dataset.category) filterCategory(button.dataset.category);
  if (button.dataset.filter) filterCategory(button.dataset.filter);
  if (button.dataset.id) selectDevice(button.dataset.id);
  if (button.dataset.select) selectDevice(button.dataset.select);
  if (button.dataset.open) openDetails(button.dataset.open);
  if (button.dataset.year) { const match = visible.find(d => d.year === Number(button.dataset.year)); if (match) selectDevice(match.id); }
  if (button.dataset.close) document.getElementById(button.dataset.close).close();
  if (button.dataset.related) openDetails(button.dataset.related);
  if (button.dataset.tab) { detailTab = button.dataset.tab; renderDetails(); document.getElementById(`tab-${detailTab}`).focus(); }
  if (button.dataset.detailStep) { step(Number(button.dataset.detailStep)); detailTab = 'overview'; renderDetails(); }
  if (button.dataset.result) { document.querySelector('#search-dialog').close(); openDetails(button.dataset.result); }
});
document.querySelector('.previous').addEventListener('click', () => step(-1));
document.querySelector('.next').addEventListener('click', () => step(1));
document.querySelector('#jump-start').addEventListener('click', () => selectDevice(visible[0].id));
document.querySelector('#jump-end').addEventListener('click', () => selectDevice(visible.at(-1).id));
document.querySelector('.search-toggle').addEventListener('click', openSearch);
document.querySelector('#search-input').addEventListener('input', renderSearch);
document.querySelector('#search-input').addEventListener('keydown', event => { if (event.key === 'Enter') { const first = document.querySelector('[data-result]'); if (first) { event.preventDefault(); first.click(); } } });
document.querySelector('#about-button').addEventListener('click', () => { hideQuick(); document.querySelector('#about-dialog').showModal(); });
details.querySelector('.close-dialog').addEventListener('click', () => details.close());
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); }));
timeline.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1); }
  if (event.key === 'Home') { event.preventDefault(); selectDevice(visible[0].id); }
  if (event.key === 'End') { event.preventDefault(); selectDevice(visible.at(-1).id); }
  if (event.key === 'Enter' && event.target === timeline) openDetails(selected);
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !document.querySelector('dialog[open]') && !['INPUT','TEXTAREA'].includes(event.target.tagName)) { event.preventDefault(); openSearch(); }
  if (event.target.matches('[role="tab"]') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
    event.preventDefault(); const tabs = ['overview','specifications','benchmarks']; const index = tabs.indexOf(detailTab); detailTab = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[2] : tabs[(index + (event.key === 'ArrowRight' ? 1 : 2)) % 3]; renderDetails(); document.getElementById(`tab-${detailTab}`).focus();
  }
});
track.addEventListener('pointerover', event => { const node = event.target.closest('.device-node'); if (node && event.pointerType === 'mouse' && !pointer) { clearTimeout(quickTimer); quickTimer = setTimeout(() => showQuick(node.dataset.id), 420); } });
track.addEventListener('pointerout', event => { if (!event.relatedTarget?.closest('.device-node') && !quick.contains(event.relatedTarget)) { clearTimeout(quickTimer); quickTimer = setTimeout(hideQuick, 220); } });
quick.addEventListener('pointerenter', () => clearTimeout(quickTimer));
quick.addEventListener('pointerleave', hideQuick);
track.addEventListener('focusin', event => { const node = event.target.closest('.device-node'); if (node) showQuick(node.dataset.id); });
timeline.addEventListener('pointerdown', event => {
  if (event.button !== 0 || event.pointerType === 'touch') return;
  pointer = { id: event.pointerId, start: event.clientX, scroll: timeline.scrollLeft, moved: false };
  suppressClick = false; hideQuick();
});
window.addEventListener('pointermove', event => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const delta = event.clientX - pointer.start;
  if (Math.abs(delta) > 6) { pointer.moved = true; timeline.classList.add('dragging'); timeline.scrollLeft = pointer.scroll - delta; }
});
function endDrag(event) {
  if (!pointer || pointer.id !== event.pointerId) return;
  suppressClick = pointer.moved; pointer = null; timeline.classList.remove('dragging');
  setTimeout(() => { suppressClick = false; }, 0);
  updateFromScroll();
}
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);
function updateFromScroll() {
  const center = timeline.scrollLeft + timeline.clientWidth / 2;
  const nearest = [...visible].sort((a,b) => Math.abs(positions.get(a.id) - center) - Math.abs(positions.get(b.id) - center))[0];
  if (nearest && nearest.id !== selected) selectDevice(nearest.id, { center: false });
}
timeline.addEventListener('scroll', () => { hideQuick(); clearTimeout(scrollTimer); scrollTimer = setTimeout(() => { if (!pointer) updateFromScroll(); }, 130); }, { passive: true });
timeline.addEventListener('wheel', event => { if (Math.abs(event.deltaX) < Math.abs(event.deltaY) && !event.ctrlKey && !event.metaKey) { const next = timeline.scrollLeft + event.deltaY; if (next > 0 && next < timeline.scrollWidth - timeline.clientWidth) { event.preventDefault(); timeline.scrollLeft = next; } } }, { passive: false });
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { renderTimeline(); centerSelected(true); hideQuick(); }, 120); });
window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (byId.has(id)) selectDevice(id, { updateHash: false }); });

hydrateIcons();
renderCollection();
renderTimeline();
centerSelected(true);
window.setTimeout(() => { if (!document.querySelector('dialog[open]') && selected === 'nokia-e71') showQuick(selected); }, 1100);
