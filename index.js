
import { GoogleGenAI } from "@google/genai";

// UI DOM Elements
const openAiBtn = document.getElementById('open-ai');
const closeAiBtn = document.getElementById('close-ai');
const aiModal = document.getElementById('ai-modal');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
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
let messageHistory = [];
let galleryState = { slug: null, index: 0, total: 0, title: '' };

// Navigation Logic
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-scroll');
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Project Data & Rendering
const coverPath = (slug) => `projects/${slug}/cover.png`;
const galleryPath = (slug, index) => index === 0 ? coverPath(slug) : `projects/${slug}/${index}.png`;

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

const updateGalleryImage = () => {
    if (!galleryModal || !galleryImage) return;
    const { slug, index, total, title } = galleryState;
    if (!slug || total < 1) return;

    const src = galleryPath(slug, index);
    galleryImage.src = src;
    galleryImage.alt = `Bild ${index + 1} – ${title || 'Projekt'}`;
    galleryImage.onload = () => galleryFallback?.classList.add('hidden');
    galleryImage.onerror = () => galleryFallback?.classList.remove('hidden');

    if (galleryTitle) galleryTitle.textContent = title || 'Projekt';
    if (galleryCaption) galleryCaption.textContent = index === 0 ? 'Cover' : `Ansicht ${index}`;
    if (galleryCounter) galleryCounter.textContent = `${index + 1}/${total}`;
};

const openGallery = (slug, total, title) => {
    if (!galleryModal || total < 1) return;
    galleryState = { slug, index: 0, total, title };
    galleryModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    updateGalleryImage();
};

const closeGallery = () => {
    if (!galleryModal) return;
    galleryModal.classList.add('hidden');
    document.body.style.overflow = '';
    galleryState = { slug: null, index: 0, total: 0, title: '' };
};

const shiftGallery = (delta) => {
    if (!galleryState.total) return;
    galleryState = {
        ...galleryState,
        index: (galleryState.index + delta + galleryState.total) % galleryState.total,
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
        button.addEventListener('click', () => openGallery(project.slug, project.galleryCount || 0, project.title));
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

const renderBoard = (projects, boardExtras) => {
    if (!boardContainer) return;
    boardContainer.innerHTML = '';

    const items = [];
    if (Array.isArray(boardExtras)) items.push(...boardExtras);
    (projects || []).forEach((project) => {
        if (project.board) {
            items.push({ ...project.board, title: project.title });
        }
    });

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
        const response = await fetch('projects.json');
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        renderProjects(data.projects || []);
        renderBoard(data.projects || [], data.board || []);
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

// Modal Control
const toggleModal = (show) => {
    if (show) {
        aiModal.classList.remove('hidden');
        chatInput.focus();
    } else {
        aiModal.classList.add('hidden');
    }
};

openAiBtn.addEventListener('click', () => toggleModal(true));
closeAiBtn.addEventListener('click', () => toggleModal(false));

// Chat Helper Functions
const appendMessage = (role, text) => {
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;
    
    const bubble = document.createElement('div');
    bubble.className = `max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
        role === 'user'
        ? 'bg-primary text-white rounded-tr-none shadow-soft'
        : 'bg-white text-ink rounded-tl-none border border-line shadow-soft'
    }`;
    bubble.textContent = text;
    
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

const showLoading = () => {
    const loader = document.createElement('div');
    loader.id = 'chat-loader';
    loader.className = 'flex justify-start';
    loader.innerHTML = `
        <div class="bg-white p-3 rounded-2xl rounded-tl-none border border-line flex gap-1 shadow-soft">
            <div class="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
            <div class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div class="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        </div>
    `;
    chatMessages.appendChild(loader);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loader;
};

// Main AI Integration
const handleSendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';
    
    const loader = showLoading();

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                ...messageHistory.map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                })),
                { role: 'user', parts: [{ text: text }] }
            ],
            config: {
                systemInstruction: "Du bist der KI-Berater von 'TomTen - Digitale Lösungen'. Repräsentiere Thomas, einen Entwickler für NGOs und soziale Einrichtungen. Antworte kurz, ruhig und professionell auf Deutsch. Fokus: IT-Wartung, Automatisierung, Barrierefreiheit.",
                temperature: 0.7,
            }
        });

        loader.remove();
        const aiResponse = response.text || 'Entschuldigung, ich konnte keine Antwort generieren.';
        appendMessage('assistant', aiResponse);
        
        // Update History
        messageHistory.push({ role: 'user', content: text });
        messageHistory.push({ role: 'assistant', content: aiResponse });
        
    } catch (error) {
        console.error("AI Error:", error);
        loader.remove();
        appendMessage('assistant', 'Verbindungsfehler. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns per E-Mail.');
    }
};

// Event Listeners for Chat
sendBtn.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendMessage();
});
