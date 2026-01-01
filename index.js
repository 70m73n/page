
// UI DOM Elements
const header = document.querySelector('header');
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const navButtons = document.querySelectorAll('[data-scroll]');
const portfolioGrid = document.getElementById('portfolio-grid');
const boardContainer = document.getElementById('project-board');
const galleryModal = document.getElementById('gallery-modal');
const galleryImage = document.getElementById('gallery-image');
const galleryTitle = document.getElementById('gallery-title');
const galleryCaption = document.getElementById('gallery-caption');
const galleryCounter = document.getElementById('gallery-counter');
const galleryClose = document.getElementById('gallery-close');
const galleryPrev = document.getElementById('gallery-prev');
const galleryNext = document.getElementById('gallery-next');
const galleryFallback = document.getElementById('gallery-fallback');
const galleryOverlay = galleryModal?.querySelector('.absolute.inset-0');

// State Management
let galleryState = { images: [], index: 0, title: '' };

// Mobile Navigation Logic
const menuIcon = menuToggle?.querySelector('.material-symbols-outlined');
const setMenuOpen = (open) => {
    if (!mobileMenu || !menuToggle) return;
    if (open) {
        mobileMenu.classList.remove('hidden');
    } else {
        mobileMenu.classList.add('hidden');
    }
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (menuIcon) menuIcon.textContent = open ? 'close' : 'menu';
};

menuToggle?.addEventListener('click', () => {
    const isOpen = mobileMenu && !mobileMenu.classList.contains('hidden');
    setMenuOpen(!isOpen);
});

document.addEventListener('click', (event) => {
    if (!mobileMenu || mobileMenu.classList.contains('hidden')) return;
    if (menuToggle?.contains(event.target) || mobileMenu.contains(event.target)) return;
    setMenuOpen(false);
});

// Navigation Logic
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-scroll');
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setMenuOpen(false);
    });
});

// Project Data & Rendering
const assetPath = (path) => new URL(path, import.meta.url).toString();
const coverPath = (slug) => assetPath(`./projects/${slug}/cover.png`);
const galleryPath = (slug, index) => index === 0 ? coverPath(slug) : assetPath(`./projects/${slug}/${index}.png`);

const attachImageFallback = (imgEl, fallbackEl) => {
    if (!imgEl || !fallbackEl) return;
    imgEl.addEventListener('error', () => {
        imgEl.classList.add('hidden');
        fallbackEl.classList.remove('hidden');
    });
    imgEl.addEventListener('load', () => {
        fallbackEl.classList.add('hidden');
        imgEl.classList.remove('hidden');
    });
};

const imageExists = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = `${src}?cb=${Date.now()}`;
});

const buildImageList = async (slug, maxCount) => {
    const count = Math.max(0, maxCount || 0);
    const paths = [];
    for (let i = 0; i < count; i += 1) {
        const candidate = galleryPath(slug, i);
        // eslint-disable-next-line no-await-in-loop
        const exists = await imageExists(candidate);
        if (exists) paths.push(candidate);
    }
    return paths;
};

const updateGalleryImage = () => {
    if (!galleryModal || !galleryImage) return;
    const { images, index, title } = galleryState;

    if (!images.length) {
        galleryImage.src = '';
        galleryFallback?.classList.remove('hidden');
        if (galleryCounter) galleryCounter.textContent = '0/0';
        if (galleryCaption) galleryCaption.textContent = 'Keine Bilder gefunden.';
        if (galleryTitle) galleryTitle.textContent = title || 'Projekt';
        return;
    }

    galleryFallback?.classList.add('hidden');
    const src = images[index];
    galleryImage.src = src;
    galleryImage.alt = `Bild ${index + 1} – ${title || 'Projekt'}`;
    galleryImage.onload = () => galleryFallback?.classList.add('hidden');
    galleryImage.onerror = () => galleryFallback?.classList.remove('hidden');

    if (galleryTitle) galleryTitle.textContent = title || 'Projekt';
    if (galleryCaption) galleryCaption.textContent = index === 0 ? 'Cover' : `Ansicht ${index}`;
    if (galleryCounter) galleryCounter.textContent = `${index + 1}/${images.length}`;
};

const openGallery = async (project) => {
    if (!galleryModal || !(project?.galleryCount > 0)) return;
    galleryState = { images: [], index: 0, title: project.title || 'Projekt' };
    galleryModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (galleryTitle) galleryTitle.textContent = project.title || 'Projekt';
    if (galleryCaption) galleryCaption.textContent = 'Galerie wird geladen …';
    if (galleryCounter) galleryCounter.textContent = '';
    galleryFallback?.classList.remove('hidden');

    const images = await buildImageList(project.slug, project.galleryCount || 0);
    galleryState = { images, index: 0, title: project.title || 'Projekt' };
    updateGalleryImage();
};

const closeGallery = () => {
    if (!galleryModal) return;
    galleryModal.classList.add('hidden');
    document.body.style.overflow = '';
    galleryState = { images: [], index: 0, title: '' };
};

const shiftGallery = (delta) => {
    if (!galleryState.images.length) return;
    galleryState = {
        ...galleryState,
        index: (galleryState.index + delta + galleryState.images.length) % galleryState.images.length,
    };
    updateGalleryImage();
};

const createProjectCard = (project) => {
    const article = document.createElement('article');
    article.className = "grid lg:grid-cols-[1.1fr_0.9fr] gap-10 bg-white border border-line rounded-3xl p-6 md:p-10 shadow-soft";

    const left = document.createElement('div');
    left.className = "space-y-6";

    const header = document.createElement('div');
    header.className = "flex items-start gap-4";

    const iconWrap = document.createElement('span');
    iconWrap.className = "h-12 w-12 rounded-2xl bg-sand text-ink flex items-center justify-center border border-line";
    iconWrap.innerHTML = `<span class="material-symbols-outlined">${project.icon || 'rocket_launch'}</span>`;

    const titleWrap = document.createElement('div');
    const titleEl = document.createElement('h3');
    titleEl.className = "font-display text-2xl";
    titleEl.textContent = project.title || 'Projekt';
    const tagline = document.createElement('p');
    tagline.className = "text-sm text-ink-soft";
    tagline.textContent = project.tagline || '';
    titleWrap.append(titleEl, tagline);
    header.append(iconWrap, titleWrap);

    const summary = document.createElement('p');
    summary.className = "text-ink-soft";
    summary.textContent = project.summary || '';

    const featureList = document.createElement('ul');
    featureList.className = "space-y-3 text-sm text-ink-soft";
    (project.features || []).forEach((feature) => {
        const li = document.createElement('li');
        li.className = "flex items-start gap-3";
        li.innerHTML = `<span class="mt-2 h-2 w-2 rounded-full bg-coral"></span><span>${feature}</span>`;
        featureList.appendChild(li);
    });

    const badgeRow = document.createElement('div');
    badgeRow.className = "flex flex-wrap items-center gap-3";
    (project.pills || []).forEach((pill) => {
        const span = document.createElement('span');
        span.className = "px-3 py-1 rounded-full text-[11px] font-semibold bg-sand text-ink border border-line";
        span.textContent = pill;
        badgeRow.appendChild(span);
    });
    if (project.link && project.link.label) {
        if (project.link.href) {
            const link = document.createElement('a');
            link.className = "text-sm font-semibold text-ink underline underline-offset-4 decoration-coral/50 hover:text-coral transition";
            link.href = project.link.href;
            link.target = "_blank";
            link.rel = "noreferrer";
            link.textContent = project.link.label;
            badgeRow.appendChild(link);
        } else {
            const note = document.createElement('span');
            note.className = "text-sm text-ink-soft";
            note.textContent = project.link.label;
            badgeRow.appendChild(note);
        }
    }

    left.append(header, summary, featureList, badgeRow);

    const right = document.createElement('div');
    right.className = "space-y-4";

    const galleryWrapper = document.createElement('div');
    galleryWrapper.className = "relative aspect-[4/3] rounded-2xl border border-line overflow-hidden bg-sand";

    const hasGallery = (project.galleryCount || 0) > 0;

    if (hasGallery) {
        const button = document.createElement('button');
        button.type = "button";
        button.className = "group block h-full w-full";
        button.addEventListener('click', () => openGallery(project));
        button.setAttribute('aria-label', `Galerie öffnen für ${project.title}`);

        const img = document.createElement('img');
        img.src = coverPath(project.slug);
        img.alt = `Screenshot ${project.title}`;
        img.className = "w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]";

        const fallback = document.createElement('div');
        fallback.className = "absolute inset-0 hidden bg-sand text-ink-soft text-sm flex items-center justify-center text-center px-4";
        fallback.innerHTML = `Screenshot wird angezeigt, sobald <span class="font-semibold text-ink px-1">cover.png</span> im Projektordner liegt.`;

        attachImageFallback(img, fallback);
        button.append(img, fallback);
        galleryWrapper.appendChild(button);
    } else {
        const placeholder = document.createElement('div');
        placeholder.className = "relative h-full w-full flex items-center justify-center text-ink-soft text-sm";
        placeholder.innerHTML = `
            <div class="flex flex-col items-center gap-2 text-center">
                <span class="material-symbols-outlined text-4xl text-ink-soft">image</span>
                <p class="font-semibold">Screenshot folgt</p>
                <span class="text-xs text-ink-soft">Board-Ansicht in Arbeit</span>
            </div>
        `;
        galleryWrapper.appendChild(placeholder);
    }

    const labelsRow = document.createElement('div');
    labelsRow.className = "flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-ink-soft";
    (project.labels || []).forEach((label) => {
        const span = document.createElement('span');
        span.textContent = label;
        labelsRow.appendChild(span);
    });

    right.append(galleryWrapper, labelsRow);
    article.append(left, right);
    return article;
};

const renderProjects = (projects) => {
    if (!portfolioGrid) return;
    portfolioGrid.innerHTML = '';
    if (!projects || projects.length === 0) {
        portfolioGrid.innerHTML = '<p class="text-sm text-ink-soft">Keine Projekte hinterlegt.</p>';
        return;
    }
    projects.forEach((project) => {
        portfolioGrid.appendChild(createProjectCard(project));
    });
};

const renderBoard = (projects) => {
    if (!boardContainer) return;
    boardContainer.innerHTML = '';

    const items = (projects || [])
        .filter((project) => project.board)
        .map((project) => ({ ...project.board, title: project.title }));

    if (!items.length) {
        boardContainer.innerHTML = '<p class="text-sm text-ink-soft">Keine Projekte im Board.</p>';
        return;
    }

    const backgrounds = ['bg-sand/70', 'bg-white shadow-soft', 'bg-white'];

    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `p-4 rounded-2xl border border-line ${backgrounds[index % backgrounds.length]}`;

        const top = document.createElement('div');
        top.className = "flex items-center justify-between";

        const titleEl = document.createElement('p');
        titleEl.className = "font-semibold text-sm";
        titleEl.textContent = item.title || 'Projekt';

        const stage = document.createElement('span');
        stage.className = "text-[10px] uppercase text-ink-soft";
        stage.textContent = item.stage || '';

        top.append(titleEl, stage);
        card.appendChild(top);

        if (typeof item.progress === 'number') {
            const barWrap = document.createElement('div');
            barWrap.className = "mt-3 h-2 w-full rounded-full bg-sand";

            const clamped = Math.min(1, Math.max(0, item.progress));
            const bar = document.createElement('div');
            bar.className = "h-full rounded-full bg-teal";
            bar.style.width = `${Math.round(clamped * 100)}%`;

            barWrap.appendChild(bar);
            card.appendChild(barWrap);
        } else if (item.highlight) {
            const highlight = document.createElement('p');
            highlight.className = "text-xs text-ink-soft mt-2";
            highlight.textContent = item.highlight;
            card.appendChild(highlight);
        }

        boardContainer.appendChild(card);
    });
};

const loadProjectData = async () => {
    if (!portfolioGrid && !boardContainer) return;
    try {
        const response = await fetch(assetPath('./projects.json'));
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        renderProjects(data.projects || []);
        renderBoard(data.projects || []);
    } catch (error) {
        console.error('Projektladefehler:', error);
        if (portfolioGrid) portfolioGrid.innerHTML = '<p class="text-sm text-ink-soft">Konnte Projekte nicht laden.</p>';
        if (boardContainer) boardContainer.innerHTML = '<p class="text-sm text-ink-soft">Board konnte nicht geladen werden.</p>';
    }
};

// Init projects & board
loadProjectData();

// Galerie Controls
galleryClose?.addEventListener('click', closeGallery);
galleryOverlay?.addEventListener('click', closeGallery);
galleryPrev?.addEventListener('click', () => shiftGallery(-1));
galleryNext?.addEventListener('click', () => shiftGallery(1));
document.addEventListener('keydown', (e) => {
    if (!galleryModal || galleryModal.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowRight') shiftGallery(1);
    if (e.key === 'ArrowLeft') shiftGallery(-1);
});
