'use strict';

// ----------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------
const IMAGES_JSON_URL = 'https://raw.githubusercontent.com/reeserocks/portfolio-website/refs/heads/main/images.json';
const ABOUT_ME_AFTER = 6;
const EAGER_COUNT    = getColumnCount();
const SPEEDPAINT_DELAY = 500;
const SPEEDPAINT_DIR = 'images/speedpaints/';

// ----------------------------------------------------------------
// PROJECT CARDS & SOFTWARE DATA
// ----------------------------------------------------------------
const PROJECTS = [
  { date: '2026 – Ongoing', category: 'Game Art', name: 'SPIRAL', tags: ['3d', 'games'], href: '#', image: 'images/projectCards/spiral.png' },
  { date: 'Spring 2026', category: 'Concept Art', name: 'deepwinter vein', tags: ['2d'], href: '#', image: 'images/projectCards/deepwintervein.png' },
  { date: 'Spring 2026', category: 'UI/UX Design', name: 'Deep Sea Luminosity', tags: ['design'], href: 'deepSeaLuminosity/', image: 'images/projectCards/deepsealuminosity.png' },
  { date: 'Spring 2026', category: 'UX Research', name: 'Wayfair Team', tags: ['design'], href: 'uxResearch/', image: 'images/projectCards/uxresearch.png' },
  { date: 'Fall 2024', category: 'Worldbuilding', name: 'Heartlines', tags: ['games', '2d', '3d', 'animation'], href: 'https://reese-rocks.notion.site/heartlines-203d94b076a880318f36d498a62c2e41', image: 'images/projectCards/heartlines.png' },
  { date: 'May 2025', category: '3D Art', name: 'Military Crab Character', tags: ['3d'], href: 'https://www.instructables.com/3D-Character-Design-/', image: 'images/projectCards/crabchar.jpg' }
];

const CATEGORY_LABELS = {
  '2d': '2D Art', '3d': '3D Art', 'animation': 'Animation', 'games': 'Games', 'design': 'UI/X Design',
};

const SOFTWARE_ICONS = {
  'procreate': 'images/SoftwareIcons/procreate.png', 'maya': 'images/SoftwareIcons/maya.png', 'mudbox': 'images/SoftwareIcons/mudbox.png',
  'zbrush': 'images/SoftwareIcons/zbrush.png', 'substance painter': 'images/SoftwareIcons/substancepainter.png', 'marmoset': 'images/SoftwareIcons/marmoset.png',
  'unreal': 'images/SoftwareIcons/unreal.png', 'unity': 'images/SoftwareIcons/unity.png', 'photoshop': 'images/SoftwareIcons/photoshop.png',
  'adobe photoshop': 'images/SoftwareIcons/photoshop.png', 'illustrator': 'images/SoftwareIcons/illustrator.png', 'adobe illustrator': 'images/SoftwareIcons/illustrator.png',
  'godot': 'images/SoftwareIcons/godot.png', 'rpg maker': 'images/SoftwareIcons/rpgmaker.png', 'gimp': 'images/SoftwareIcons/gimp.png',
  'mixamo': 'images/SoftwareIcons/mixamo.png', 'html': 'images/SoftwareIcons/html.png', 'css': 'images/SoftwareIcons/css.png',
  'javascript': 'images/SoftwareIcons/javascript.png', 'firebase': 'images/SoftwareIcons/firebase.png',
};

// ----------------------------------------------------------------
// STATE
// ----------------------------------------------------------------
let allItems   = [];
let activeFilter = 'all';
let currentCols = 3;
let scrollObserver = null;

// ----------------------------------------------------------------
// BOOT & RESIZE LISTENERS
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  renderProjectCards('all');
  setupFilterButtons();
  setupHamburger();
  setupLightbox();
  fetchImages();
  setupMobileHeaderScroll();
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const newCols = getColumnCount();
    if (newCols !== currentCols && allItems.length > 0) {
      currentCols = newCols;
      renderGrid(allItems, activeFilter);
    }
  }, 150);
});

function getColumnCount() {
  if (window.innerWidth <= 599) return 1;
  if (window.innerWidth <= 1099) return 2;
  return 3;
}

// ----------------------------------------------------------------
// FETCH
// ----------------------------------------------------------------
async function fetchImages() {
  try {
    const res  = await fetch(IMAGES_JSON_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allItems = await res.json();
    allItems.forEach(item => {
      item.categories = item.class
        ? item.class.split(/\s+/).filter(cat => cat !== 'filterDiv')
        : [];
    });
    currentCols = getColumnCount();
    renderGrid(allItems, 'all');
    await waitForEagerImages(document.body);
    hideLoader();
  } catch (err) {
    console.error('[Portfolio] Could not load images.json:', err);
    hideLoader();
  }
}

function parseParagraph(raw) {
  if (!raw || !raw.trim()) return { date: '', description: '', software: '' };
  const parts = raw.split('|').map(s => s.trim());
  return { date: parts[0] || '', description: parts[1] || '', software: (parts[2] || '').replace(/^Programs?:\s*/i, '').trim() };
}

function getSpeedpaintUrl(imageUrl) {
  if (!imageUrl) return null;
  const filename = imageUrl.split('/').pop();
  const dot      = filename.lastIndexOf('.');
  const base     = dot !== -1 ? filename.slice(0, dot) : filename;
  return `${SPEEDPAINT_DIR}${base}_speedpaint.gif`;
}

function buildSoftwareTags(softwareStr) {
  if (!softwareStr) return null;
  const frag = document.createDocumentFragment();
  softwareStr.split(/,\s*/).forEach(name => {
    const key  = name.toLowerCase().trim();
    const icon = SOFTWARE_ICONS[key];
    const tag  = document.createElement('div');
    tag.className = 'software-tag';
    if (icon) {
      const img = document.createElement('img');
      img.src = icon; img.alt = name; img.className = 'software-icon';
      tag.appendChild(img);
    }
    const label = document.createElement('span');
    label.className = 'software-name'; label.textContent = name;
    tag.appendChild(label);
    frag.appendChild(tag);
  });
  return frag;
}

// ----------------------------------------------------------------
// JS MASONRY RENDERING
// ----------------------------------------------------------------
function renderGrid(items, filter) {
  const grid = document.getElementById('masonry-grid');
  const catHeader = document.getElementById('category-header');
  const catTitle  = document.getElementById('category-page-title');
  grid.innerHTML  = '';

  if (filter === 'all') {
    grid.classList.add('homepage');
    grid.classList.remove('filter-active');
    catHeader.classList.add('hidden');

    const topItems = items.slice(0, ABOUT_ME_AFTER);
    const bottomItems = items.slice(ABOUT_ME_AFTER);

    const group1 = createMasonryGroup(topItems, currentCols, 0);
    grid.appendChild(group1);

    if (items.length >= ABOUT_ME_AFTER) {
      grid.appendChild(createAboutMeBlock());
      if (bottomItems.length > 0) {
        const group2 = createMasonryGroup(bottomItems, currentCols, ABOUT_ME_AFTER);
        grid.appendChild(group2);
      }
    }
  } else {
    grid.classList.remove('homepage');
    grid.classList.add('filter-active');
    catHeader.classList.remove('hidden');
    catTitle.textContent = `${CATEGORY_LABELS[filter] || filter}`;

    const filtered = items.filter(item =>
      item.categories.includes(filter)
    );
    
    const group = createMasonryGroup(filtered, currentCols, 0);
    grid.appendChild(group);
  }
  if (document.getElementById('loader').classList.contains('hidden')) {
    setupScrollAnimations();
  }
}

function createMasonryGroup(items, numCols, offsetIndex) {
  const group = document.createElement('div');
  group.className = 'masonry-group';
  
  const columns = [];
  for(let i = 0; i < numCols; i++) {
    const col = document.createElement('div');
    col.className = 'masonry-column';
    columns.push(col);
    group.appendChild(col);
  }

  items.forEach((item, i) => {
    const globalIndex = offsetIndex + i;
    const el = createGridItem(item, globalIndex, globalIndex < EAGER_COUNT);
    el.dataset.col = (i % numCols) + 1;
    columns[i % numCols].appendChild(el);
  });

  return group;
}

// ----------------------------------------------------------------
// CREATE GRID ITEM
// ----------------------------------------------------------------
function createGridItem(item, index, eager = false) {
  const categories = item.categories || [];
  const { date, description, software } = parseParagraph(item.paragraph || '');

  const el = document.createElement('div');
  el.className = 'grid-item scroll-fade';
  el.dataset.cats = categories.join(' ');
  el.dataset.index = index;

  if (item.image) {
    el.appendChild(buildImageMedia(item, description, eager));
  } else if (item.video) {
    el.appendChild(buildLocalVideoMedia(item));
  }

  const caption = document.createElement('div');
  caption.className = 'item-caption';
  
  const captionInner = document.createElement('div');
  captionInner.className = 'caption-inner';
  
  const captionContent = document.createElement('div');
  captionContent.className = 'caption-content';

  if (date) {
    const d = document.createElement('p'); d.className = 'caption-date'; d.textContent = date;
    captionContent.appendChild(d);
  }
  if (description) {
    const desc = document.createElement('p'); desc.className = 'caption-desc'; desc.innerHTML = description;
    captionContent.appendChild(desc);
  }
  if (software) {
    const row = document.createElement('div'); row.className = 'caption-software-row';
    const tags = buildSoftwareTags(software);
    if (tags) row.appendChild(tags);
    captionContent.appendChild(row);
  }

  captionInner.appendChild(captionContent);
  caption.appendChild(captionInner);
  el.appendChild(caption);

  return el;
}

// ----------------------------------------------------------------
// BUILD IMAGE MEDIA 
// ----------------------------------------------------------------
function buildImageMedia(item, altText, eager = false) {
  const wrapper = document.createElement('div');
  wrapper.className = 'item-media';

  const img = document.createElement('img');
  img.src = item.image;
  img.alt = altText || '';
  img.className = 'visible-img';
  img.loading = eager ? 'eager' : 'lazy';
  img.dataset.original = item.image;

  wrapper.appendChild(img);

  const spVideo = document.createElement('img');
  spVideo.className = 'speedpaint';

  if (item.alignSpeedpaint) {
    spVideo.style.objectPosition = item.alignSpeedpaint;
  }
  
  let spTimer = null;
  let hovering = false;

  wrapper.addEventListener('mouseenter', () => {
    hovering = true;
    spTimer = setTimeout(() => {
      if (!hovering) return;
      if (!spVideo.src) spVideo.src = getSpeedpaintUrl(item.image);
      wrapper.classList.add('show-speedpaint');
    }, SPEEDPAINT_DELAY);
  });

  wrapper.addEventListener('mouseleave', () => {
    hovering = false;
    clearTimeout(spTimer);
    wrapper.classList.remove('show-speedpaint');
  });
  
  wrapper.appendChild(spVideo);

  if (item.href) {
    const a = document.createElement('a');
    a.href = item.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.className = 'media-link-wrapper';
    wrapper.appendChild(a);
  } else {
    wrapper.style.cursor = 'pointer';
    wrapper.addEventListener('click', () => openLightbox(item.image, item.paragraph));
  }

  return wrapper;
}

// ----------------------------------------------------------------
// FUNCTIONS TO BUILD OTHER MEDIA TYPES
// ----------------------------------------------------------------
function buildLocalVideoMedia(item) {
  const wrapper = document.createElement('div');
  wrapper.className = 'item-media item-video-wrapper';
  const video = document.createElement('video');
  video.controls = true; video.playsInline = true; video.preload = 'metadata'; video.loop = true; video.autoplay = true; video.muted = true;
  const src = document.createElement('source'); src.src = item.video;
  const ext = item.video.split('.').pop().toLowerCase();
  const typeMap = { mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg' };
  if (typeMap[ext]) src.type = typeMap[ext];
  video.appendChild(src); wrapper.appendChild(video);
  return wrapper;
}
function createAboutMeBlock() {
  const el = document.createElement('div');
  el.className = 'about-me-block';
  el.id = 'about-me';
  el.innerHTML = `<div class="about-headshot"><img src="headshot.jpg" alt="Reese Hausman" class="headshot-img"></div><div class="about-text"><p class="about-headline"><span class="about-name">REESE HAUSMAN</span><span class="about-subtitle"> is a designer whose passions revolve around all things art&nbsp;+&nbsp;technology.</span></p><p>Reese works to create, package, and sell immersive narrative experiences such as video games ("SPIRAL") or websites ("ground zero"). She loves the challenge of learning a new program from scratch with a tight one-month or even two-week deadline ("Heartlines," Godot).</p><p>On teams of one, four, or seven, her role often centers around 2D concepting, animation, 3D modeling/texturing, scheduling deadlines, upkeeping Trello boards, and helping to problem-solve stubborn code.</p><p>Outside of the classroom, she takes advantage of opportunities that will develop her leadership skills and strengthen her connections within her local community. She has led personal development sessions as Vice President of Alpha Lambda Delta, facilitated community service events as a Scholar Leader, marketed a vertical development growth workshop as part of the Eli Lilly Leadership Institute, and more.</p><a href="mailto:reesehausmanm@gmail.com" class="contact-btn"><i class="fa-regular fa-envelope"></i> Contact Me</a></div>`;
  return el;
}
function renderProjectCards(filter) {
  const row = document.getElementById('projects-row'); const heading = document.getElementById('section-title'); row.innerHTML = ''; row.classList.remove('projects-loaded');
  const list = filter === 'all' ? PROJECTS : PROJECTS.filter(p => p.tags.includes(filter));
  heading.textContent = filter === 'all' ? 'Project Case Studies' : `${CATEGORY_LABELS[filter] || filter} Project Case Studies`;
  list.forEach((project, index) => {
    const a = document.createElement('a'); a.className = 'project-card'; a.style.setProperty('--card-index', index);
    if (project.href !== '#') { a.href = project.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; } else { a.classList.add('coming-soon'); }
    a.innerHTML = `<div class="project-card-img"><img src="${escHtml(project.image)}" alt="${escHtml(project.name)}" loading="eager"></div><div class="project-card-text"><p class="project-card-date">${escHtml(project.date)}</p><p class="project-card-category">${escHtml(project.category)}</p><p class="project-card-name">${escHtml(project.name)}</p></div>`;
    row.appendChild(a);
  });
  if (document.getElementById('loader').classList.contains('hidden')) { requestAnimationFrame(() => { row.classList.add('projects-loaded'); }); }
  setupComingSoonCursor();
}
function escHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function setupFilterButtons() { const buttons = document.querySelectorAll('.filter-btn'); buttons.forEach(btn => { btn.addEventListener('click', () => { buttons.forEach(b => b.classList.remove('active')); btn.classList.add('active'); activeFilter = btn.dataset.filter; renderProjectCards(activeFilter); renderGrid(allItems, activeFilter); closeSidebar(); document.getElementById('main').scrollIntoView({ behavior: 'smooth' }); }); }); }
function setupHamburger() { const hamburger = document.getElementById('hamburger'); const sidebar = document.getElementById('sidebar'); const backdrop = document.getElementById('sidebar-backdrop'); hamburger.addEventListener('click', () => { sidebar.classList.contains('open') ? closeSidebar() : openSidebar(); }); backdrop.addEventListener('click', closeSidebar); document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); }); }
function setupLightbox() { document.getElementById('lightbox-close').addEventListener('click', closeLightbox); document.getElementById('lightbox-overlay').addEventListener('click', closeLightbox); document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); }); }
function openLightbox(src, paragraphRaw) { const lb = document.getElementById('lightbox'); const img = document.getElementById('lightbox-img'); const cap = document.getElementById('lightbox-caption'); img.src = src; cap.innerHTML = ''; if (paragraphRaw) { const { date, description, software } = parseParagraph(paragraphRaw); if (date) { const d = document.createElement('p'); d.className = 'caption-date'; d.textContent = date; cap.appendChild(d); } if (description) { const desc = document.createElement('p'); desc.className = 'caption-desc'; desc.innerHTML = description; cap.appendChild(desc); } if (software) { const row = document.createElement('div'); row.className = 'caption-software-row'; const tags = buildSoftwareTags(software); if (tags) row.appendChild(tags); cap.appendChild(row); } } lb.classList.remove('hidden'); document.body.style.overflow = 'hidden'; lb.getBoundingClientRect(); lb.classList.add('open'); }
function closeLightbox() { const lb = document.getElementById('lightbox'); lb.classList.remove('open'); document.body.style.overflow = ''; lb.addEventListener('transitionend', () => lb.classList.add('hidden'), { once: true }); }
function openSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-backdrop').classList.add('visible'); document.getElementById('hamburger').classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-backdrop').classList.remove('visible'); document.getElementById('hamburger').classList.remove('open'); document.body.style.overflow = ''; }
function setupMobileHeaderScroll() { const target = document.querySelector('.mobile-left'); if (!target) return; target.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); }); }

function setupScrollAnimations() {
  if (scrollObserver) scrollObserver.disconnect(); // Safely remove old listeners when regenerating columns
  const items = document.querySelectorAll('.scroll-fade');
  scrollObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); scrollObserver.unobserve(entry.target); } }); }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
  items.forEach(item => { item.classList.remove('visible'); scrollObserver.observe(item); });
}

async function waitForEagerImages(container) { const imgs = [...container.querySelectorAll('img:not([loading="lazy"])')]; await Promise.all(imgs.map(async img => { try { if (!img.complete) { await new Promise(resolve => { img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }); }); } if (img.decode) { await img.decode(); } } catch {} })); }
// ----------------------------------------------------------------
// HIDE LOADER
// ----------------------------------------------------------------
function hideLoader() {
  const loader = document.getElementById('loader');
  
  setTimeout(() => {
    loader.classList.add('hidden'); 
    
    const row = document.getElementById('projects-row');
    row.classList.add('projects-loaded');

    setTimeout(() => {
      setupScrollAnimations();
    }, 300);

  }, 150);
}
function setupComingSoonCursor() { const cursor = document.getElementById('coming-soon-cursor'); const cards = document.querySelectorAll('.project-card.coming-soon'); cards.forEach(card => { card.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; }); card.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; }); card.addEventListener('mousemove', e => { cursor.style.transform = `translate(${e.clientX + 8}px, ${e.clientY + 8}px)`; }); }); }