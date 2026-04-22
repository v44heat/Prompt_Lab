
const state = {
  prompts: [],          // array of prompt objects
  searchQuery: '',      // what the user typed in the search box
  categoryFilter: 'All',// active category dropdown value
  tagFilter: '',        // tag the user clicked on, if any
  editingId: null,      // the ID of the prompt being edited (null = new)
  deleteTargetId: null, // the ID of the prompt staged for deletion
  pendingImport: null,  // the parsed JSON waiting for user to confirm import
};


const TEMPLATES = [
  {
    title: "Explain Like I'm 5",
    category: "Coding",
    tags: "beginners, fun",
    content: `Explain the following concept as if you're talking to a 5-year-old child. Use simple words, analogies with toys or everyday objects, and avoid technical jargon. Make it fun and memorable.\n\nConcept to explain: [YOUR TOPIC HERE]`,
  },
  {
    title: "Code Debugger",
    category: "Debugging",
    tags: "technical, advanced",
    content: `You are an expert debugger. I'll share a code snippet that isn't working as expected. Please:\n1. Identify what's going wrong and why\n2. Explain the root cause in plain English\n3. Provide a corrected version of the code\n4. Suggest how to prevent this bug in the future\n\nCode snippet:\n\`\`\`\n[PASTE YOUR CODE HERE]\n\`\`\`\nExpected behavior: [DESCRIBE WHAT IT SHOULD DO]\nActual behavior: [DESCRIBE WHAT IT'S DOING INSTEAD]`,
  },
  {
    title: "Brainstorm 10 Ideas",
    category: "Brainstorming",
    tags: "creative, beginners",
    content: `Generate 10 creative and distinct ideas for the following topic. For each idea:\n- Give it a catchy name\n- Describe it in 1-2 sentences\n- Rate its feasibility (Easy / Medium / Hard)\n- Note one potential challenge\n\nBe bold, think outside the box, and don't repeat similar ideas.\n\nTopic: [YOUR TOPIC HERE]`,
  },
  {
    title: "Write a Tweet Thread",
    category: "Writing",
    tags: "creative, fun",
    content: `Write a compelling Twitter/X thread about the following topic. The thread should:\n- Start with a hook tweet that makes people stop scrolling\n- Have 6-10 tweets total\n- Each tweet max 280 characters\n- End with a strong call-to-action\n- Number each tweet (1/, 2/, etc.)\n- Use line breaks for readability\n\nTopic: [YOUR TOPIC HERE]\nTarget audience: [WHO ARE YOU WRITING FOR?]`,
  },
  {
    title: "Generate Image Prompt",
    category: "Image Generation",
    tags: "creative, technical",
    content: `Generate a detailed image prompt for an AI image generator (like Midjourney or DALL-E 3) based on this concept:\n\nConcept: [YOUR IDEA HERE]\n\nInclude in the prompt:\n- Subject/scene description\n- Art style (e.g., photorealistic, oil painting, anime, pixel art)\n- Lighting (e.g., golden hour, studio lighting, dramatic shadows)\n- Camera/perspective (e.g., wide angle, close-up, bird's eye)\n- Color palette\n- Mood/atmosphere\n- Quality tags (e.g., 8k, highly detailed, award-winning)\n\nFormat: Output only the ready-to-use prompt, nothing else.`,
  },
];

// ─── STORAGE HELPERS ────────────────────────────────────────
// Simple wrappers so we don't repeat ourselves every time
// we read or write to localStorage.

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('promptlab_prompts');
    state.prompts = raw ? JSON.parse(raw) : [];
  } catch {
    state.prompts = [];
  }

  // Also load theme preference
  const theme = localStorage.getItem('promptlab_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeToggleIcon(theme);
}

function saveToStorage() {
  localStorage.setItem('promptlab_prompts', JSON.stringify(state.prompts));
}

function saveTheme(theme) {
  localStorage.setItem('promptlab_theme', theme);
}

// ─── UNIQUE ID GENERATOR ─────────────────────────────────────
// Nothing fancy — just a timestamp + random suffix. Good enough
// for local-only data where collisions are basically impossible.
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── FILTERING LOGIC ────────────────────────────────────────
// Returns only the prompts that match the current search,
// category dropdown, and tag filter. Called before every render.
function getFilteredPrompts() {
  const q = state.searchQuery.toLowerCase().trim();
  const cat = state.categoryFilter;
  const tag = state.tagFilter.toLowerCase();

  return state.prompts.filter(p => {
    // Text search: check title and content
    const matchesText =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q));

    // Category dropdown
    const matchesCat = cat === 'All' || p.category === cat;

    // Clicked tag filter
    const matchesTag =
      !tag || p.tags.some(t => t.toLowerCase() === tag);

    return matchesText && matchesCat && matchesTag;
  });
}

// ─── TAG COLOR MAPPING ───────────────────────────────────────
// Maps known tag names to their CSS class. Custom tags fall
// back to the grey "default" color.
function getTagClass(tagName) {
  const known = ['beginners', 'advanced', 'creative', 'technical', 'fun'];
  const clean = tagName.toLowerCase().trim();
  return known.includes(clean) ? `tag-${clean}` : 'tag-default';
}

// Renders a single tag pill as HTML. Clicking it sets the tag filter.
function tagHTML(tagName) {
  const escaped = tagName.replace(/"/g, '&quot;');
  return `<span class="tag-pill ${getTagClass(tagName)}" data-tag="${escaped}" role="button" tabindex="0">${tagName}</span>`;
}

// ─── CATEGORY BADGE HTML ─────────────────────────────────────
function categoryBadgeHTML(category) {
  // CSS class uses the category name with spaces replaced by hyphens
  const cls = category.replace(/\s+/g, '-');
  return `<span class="category-badge cat-${cls}">${category}</span>`;
}

// ─── FORMAT DATE ─────────────────────────────────────────────
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── RENDER CARDS ───────────────────────────────────────────
// This is the main render function. It reads the filtered list
// and builds the card grid from scratch. DOM diffing would be
// more efficient, but for a local app this is totally fine.
function renderCards() {
  const filtered = getFilteredPrompts();
  const grid = document.getElementById('cards-grid');
  const emptyState = document.getElementById('empty-state');
  const noResults = document.getElementById('no-results');
  const countEl = document.getElementById('result-count');

  // Update the result counter
  countEl.textContent = `${filtered.length} prompt${filtered.length !== 1 ? 's' : ''}`;

  // Clear everything first
  grid.innerHTML = '';
  emptyState.classList.add('hidden');
  noResults.classList.add('hidden');

  // No prompts at all — show the welcoming empty state
  if (state.prompts.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  // Prompts exist but none match the filters
  if (filtered.length === 0) {
    noResults.classList.remove('hidden');
    return;
  }

  // Build each card and inject it into the grid
  filtered.forEach((prompt, idx) => {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.style.animationDelay = `${idx * 0.04}s`;

    // Give the card a top-accent color based on category
    const accentMap = {
      'Coding': 'var(--cat-coding)',
      'Writing': 'var(--cat-writing)',
      'Brainstorming': 'var(--cat-brainstorm)',
      'Debugging': 'var(--cat-debugging)',
      'Image Generation': 'var(--cat-image)',
    };
    card.style.setProperty('--card-accent', accentMap[prompt.category] || 'var(--accent)');

    const tagsHTML = prompt.tags.length
      ? `<div class="tag-list">${prompt.tags.map(tagHTML).join('')}</div>`
      : '';

    // Trim the content preview to ~150 chars to keep cards tidy
    const preview = prompt.content.length > 150
      ? prompt.content.slice(0, 147) + '…'
      : prompt.content;

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${escapeHTML(prompt.title)}</div>
        <div class="card-actions">
          <button class="card-action-btn copy-btn" data-id="${prompt.id}" title="Copy prompt">
            <i class="fa-regular fa-clipboard"></i>
          </button>
          <button class="card-action-btn edit-btn" data-id="${prompt.id}" title="Edit prompt">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="card-action-btn delete-btn" data-id="${prompt.id}" title="Delete prompt">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="card-meta">
        ${categoryBadgeHTML(prompt.category)}
        ${tagsHTML}
      </div>
      <div class="card-content">${escapeHTML(preview)}</div>
      <div class="card-date"><i class="fa-regular fa-calendar" style="margin-right:5px;"></i>${formatDate(prompt.dateAdded)}</div>
    `;

    grid.appendChild(card);
  });

  // Attach click listeners for the card action buttons + tag pills.
  // I'm using event delegation here — one listener on the grid
  // catches all clicks instead of attaching per-card.
  attachCardListeners();
}

// ─── CARD EVENT DELEGATION ───────────────────────────────────
function attachCardListeners() {
  const grid = document.getElementById('cards-grid');

  // Remove any old listener to avoid stacking them on re-renders
  grid.replaceWith(grid.cloneNode(true));
  const freshGrid = document.getElementById('cards-grid');

  freshGrid.addEventListener('click', e => {
    const copyBtn   = e.target.closest('.copy-btn');
    const editBtn   = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');
    const tagPill   = e.target.closest('.tag-pill');

    if (copyBtn)   handleCopy(copyBtn.dataset.id);
    if (editBtn)   openEditModal(editBtn.dataset.id);
    if (deleteBtn) openDeleteModal(deleteBtn.dataset.id);
    if (tagPill)   setTagFilter(tagPill.dataset.tag);
  });
}

// ─── COPY PROMPT ────────────────────────────────────────────
function handleCopy(id, content = null) {
  // content param lets us copy directly from the random modal too
  const text = content ?? state.prompts.find(p => p.id === id)?.content;
  if (!text) return;

  navigator.clipboard.writeText(text)
    .then(() => showToast('Copied to clipboard!'))
    .catch(() => {
      // Fallback for older browsers / blocked clipboard API
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Copied!');
    });
}

// ─── TOAST NOTIFICATION ─────────────────────────────────────
// Shows a little "Copied!" message at the bottom-right.
// Auto-hides after 2.2 seconds.
let toastTimer;
function showToast(msg = 'Done!') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  toastMsg.textContent = msg;

  // Clear any ongoing timer so rapid clicks feel clean
  clearTimeout(toastTimer);
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ─── SEARCH / FILTER EVENT BINDING ──────────────────────────
function bindSearchAndFilters() {
  const searchInput = document.getElementById('search-input');
  const clearBtn    = document.getElementById('search-clear');
  const catFilter   = document.getElementById('category-filter');
  const clearTagBtn = document.getElementById('clear-tag-btn');

  // Real-time search — no button needed
  searchInput.addEventListener('input', () => {
    state.searchQuery = searchInput.value;
    renderCards();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    renderCards();
  });

  catFilter.addEventListener('change', () => {
    state.categoryFilter = catFilter.value;
    renderCards();
  });

  clearTagBtn.addEventListener('click', () => {
    state.tagFilter = '';
    document.getElementById('tag-filter-wrap').classList.add('hidden');
    renderCards();
  });
}

// Sets the tag filter and shows the active-tag pill in the filter bar
function setTagFilter(tag) {
  state.tagFilter = tag;
  const wrap = document.getElementById('tag-filter-wrap');
  const label = document.getElementById('active-tag-label');
  label.textContent = tag;
  wrap.classList.remove('hidden');
  renderCards();
}

// ─── ADD / EDIT MODAL ────────────────────────────────────────
function openAddModal() {
  state.editingId = null;
  document.getElementById('modal-title').textContent = 'New Prompt';
  document.getElementById('prompt-form').reset();
  document.getElementById('edit-id').value = '';
  clearFormErrors();
  document.getElementById('prompt-modal').classList.remove('hidden');
  document.getElementById('p-title').focus();
}

function openEditModal(id) {
  const p = state.prompts.find(x => x.id === id);
  if (!p) return;

  state.editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Prompt';
  document.getElementById('edit-id').value = id;
  document.getElementById('p-title').value    = p.title;
  document.getElementById('p-category').value = p.category;
  document.getElementById('p-tags').value     = p.tags.join(', ');
  document.getElementById('p-content').value  = p.content;
  clearFormErrors();
  document.getElementById('prompt-modal').classList.remove('hidden');
  document.getElementById('p-title').focus();
}

function closePromptModal() {
  document.getElementById('prompt-modal').classList.add('hidden');
  state.editingId = null;
}

// Fills the form from a template object — user can edit before saving
function fillFormFromTemplate(tpl) {
  openAddModal();
  document.getElementById('p-title').value    = tpl.title;
  document.getElementById('p-category').value = tpl.category;
  document.getElementById('p-tags').value     = tpl.tags;
  document.getElementById('p-content').value  = tpl.content;
  closeDropdown('templates-wrap');
}

// ─── FORM VALIDATION ─────────────────────────────────────────
function validateForm() {
  let valid = true;
  clearFormErrors();

  const title    = document.getElementById('p-title').value.trim();
  const category = document.getElementById('p-category').value;
  const content  = document.getElementById('p-content').value.trim();

  if (!title) {
    showFieldError('p-title', 'title-err', 'Title is required');
    valid = false;
  }
  if (!category) {
    showFieldError('p-category', 'cat-err', 'Please select a category');
    valid = false;
  }
  if (!content) {
    showFieldError('p-content', 'content-err', 'Prompt content is required');
    valid = false;
  }

  return valid;
}

function showFieldError(inputId, errId, msg) {
  document.getElementById(inputId).classList.add('error');
  document.getElementById(errId).textContent = msg;
}

function clearFormErrors() {
  ['p-title', 'p-category', 'p-content'].forEach(id => {
    document.getElementById(id).classList.remove('error');
  });
  ['title-err', 'cat-err', 'content-err'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
}

// ─── FORM SUBMISSION ─────────────────────────────────────────
function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const title    = document.getElementById('p-title').value.trim();
  const category = document.getElementById('p-category').value;
  const content  = document.getElementById('p-content').value.trim();
  const rawTags  = document.getElementById('p-tags').value;
  const tags     = rawTags
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  if (state.editingId) {
    // Update existing prompt — preserve original date
    const idx = state.prompts.findIndex(p => p.id === state.editingId);
    if (idx > -1) {
      state.prompts[idx] = {
        ...state.prompts[idx],
        title, category, content, tags,
      };
    }
    showToast('Prompt updated!');
  } else {
    // Brand new prompt — give it a fresh ID and today's date
    const newPrompt = {
      id: generateId(),
      title, category, content, tags,
      dateAdded: new Date().toISOString(),
    };
    state.prompts.unshift(newPrompt); // newest first
    showToast('Prompt saved!');
  }

  saveToStorage();
  renderCards();
  closePromptModal();
}

// ─── DELETE MODAL ────────────────────────────────────────────
function openDeleteModal(id) {
  const p = state.prompts.find(x => x.id === id);
  if (!p) return;

  state.deleteTargetId = id;
  document.getElementById('delete-prompt-name').textContent = `"${p.title}"`;
  document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
  document.getElementById('delete-modal').classList.add('hidden');
  state.deleteTargetId = null;
}

function handleDeleteConfirm() {
  state.prompts = state.prompts.filter(p => p.id !== state.deleteTargetId);
  saveToStorage();
  renderCards();
  closeDeleteModal();
  showToast('Prompt deleted.');
}

// ─── RANDOM PROMPT ───────────────────────────────────────────
// Picks a random prompt and shows it in the dedicated modal.
function showRandomPrompt() {
  if (state.prompts.length === 0) {
    showToast('Add some prompts first!');
    return;
  }

  const idx = Math.floor(Math.random() * state.prompts.length);
  const p   = state.prompts[idx];

  document.getElementById('rand-category').className = `category-badge cat-${p.category.replace(/\s+/g, '-')}`;
  document.getElementById('rand-category').textContent = p.category;
  document.getElementById('rand-tags').innerHTML       = p.tags.map(tagHTML).join('');
  document.getElementById('rand-title-text').textContent = p.title;
  document.getElementById('rand-content').textContent    = p.content;
  document.getElementById('rand-date').textContent       = `Added ${formatDate(p.dateAdded)}`;

  // Store current ID so the copy button in this modal works
  document.getElementById('random-copy-btn').dataset.id = p.id;

  document.getElementById('random-modal').classList.remove('hidden');
}

function closeRandomModal() {
  document.getElementById('random-modal').classList.add('hidden');
}

// ─── EXPORT JSON ─────────────────────────────────────────────
// Downloads the full prompt library as a prettified JSON file.
// Super handy for backups.
function exportPrompts() {
  if (state.prompts.length === 0) {
    showToast('Nothing to export yet!');
    return;
  }

  const data = JSON.stringify(state.prompts, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href     = url;
  a.download = 'ai-prompts-backup.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Export downloaded!');
}

// ─── IMPORT JSON ─────────────────────────────────────────────
function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const parsed = JSON.parse(evt.target.result);

      // Basic structure validation — needs to be an array
      // with objects that have at least title + content
      if (!Array.isArray(parsed)) throw new Error('Expected an array of prompts');
      const valid = parsed.every(p => p.title && p.content);
      if (!valid) throw new Error('Some prompts are missing required fields');

      // Normalize the data — ensure each imported prompt has all fields
      const normalized = parsed.map(p => ({
        id:        p.id        || generateId(),
        title:     p.title     || 'Untitled',
        category:  p.category  || 'Coding',
        content:   p.content   || '',
        tags:      Array.isArray(p.tags) ? p.tags : [],
        dateAdded: p.dateAdded || new Date().toISOString(),
      }));

      state.pendingImport = normalized;

      // Show the confirmation modal before touching anything
      const bodyEl = document.getElementById('import-modal-body');
      bodyEl.innerHTML = `
        <i class="fa-solid fa-file-import" style="font-size:28px;color:var(--accent);flex-shrink:0;margin-top:2px;"></i>
        <div>
          <p>Found <strong>${normalized.length}</strong> prompts in the file.</p>
          <p style="margin-top:6px;color:var(--text-muted);">
            <strong>Merge</strong> adds them to your existing ${state.prompts.length} prompts.<br/>
            <strong>Replace All</strong> deletes your current library first.
          </p>
        </div>
      `;
      document.getElementById('import-modal').classList.remove('hidden');

    } catch (err) {
      showToast(`Import failed: ${err.message}`);
    }

    // Reset the input so the same file can be re-imported if needed
    e.target.value = '';
  };
  reader.readAsText(file);
}

function handleImportMerge() {
  if (!state.pendingImport) return;

  // Merge: add imported prompts, skip any whose ID already exists
  const existingIds = new Set(state.prompts.map(p => p.id));
  const toAdd = state.pendingImport.filter(p => !existingIds.has(p.id));
  // Any with duplicate IDs get a fresh ID so they're treated as new
  const withNewIds = state.pendingImport
    .filter(p => existingIds.has(p.id))
    .map(p => ({ ...p, id: generateId() }));

  state.prompts = [...toAdd, ...withNewIds, ...state.prompts];
  finalizeImport(`Imported ${state.pendingImport.length} prompts (merged)!`);
}

function handleImportReplace() {
  if (!state.pendingImport) return;
  state.prompts = state.pendingImport;
  finalizeImport(`Replaced library with ${state.pendingImport.length} prompts!`);
}

function finalizeImport(msg) {
  saveToStorage();
  renderCards();
  document.getElementById('import-modal').classList.add('hidden');
  state.pendingImport = null;
  showToast(msg);
}

// ─── DARK / LIGHT THEME ──────────────────────────────────────
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  saveTheme(next);
  updateThemeToggleIcon(next);
}

function updateThemeToggleIcon(theme) {
  document.getElementById('toggle-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ─── TEMPLATES DROPDOWN ──────────────────────────────────────
function buildTemplatesMenu() {
  const menu = document.getElementById('templates-menu');
  menu.innerHTML = TEMPLATES.map((tpl, i) => `
    <li role="menuitem">
      <button data-tpl-index="${i}">
        ${escapeHTML(tpl.title)}
        <span class="tpl-cat">${tpl.category}</span>
      </button>
    </li>
  `).join('');

  menu.addEventListener('click', e => {
    const btn = e.target.closest('button[data-tpl-index]');
    if (!btn) return;
    fillFormFromTemplate(TEMPLATES[parseInt(btn.dataset.tplIndex)]);
  });
}

function toggleDropdown(wrapId) {
  const wrap = document.getElementById(wrapId);
  const menu = wrap.querySelector('.dropdown-menu');
  const isOpen = menu.classList.contains('open');
  closeAllDropdowns();
  if (!isOpen) {
    wrap.classList.add('open');
    menu.classList.add('open');
  }
}

function closeDropdown(wrapId) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  wrap.classList.remove('open');
  wrap.querySelector('.dropdown-menu')?.classList.remove('open');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-wrap.open').forEach(w => {
    w.classList.remove('open');
    w.querySelector('.dropdown-menu')?.classList.remove('open');
  });
}

// ─── ESCAPE HTML ─────────────────────────────────────────────
// Prevents any stored prompt text from being treated as HTML.
// Simple but important for safety.
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── MODAL CLOSE ON OVERLAY CLICK ───────────────────────────
// If you click the dark backdrop outside a modal, it closes.
function bindModalOverlayClicks() {
  ['prompt-modal', 'random-modal', 'delete-modal', 'import-modal'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target.id === id) {
        document.getElementById(id).classList.add('hidden');
      }
    });
  });
}

// ─── KEYBOARD SHORTCUTS ──────────────────────────────────────
// Small QoL touches: Escape closes open modals/dropdowns,
// Cmd/Ctrl+K focuses the search bar.
function bindKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      ['prompt-modal', 'random-modal', 'delete-modal', 'import-modal'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
      });
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('search-input').focus();
    }
  });
}

// ─── WIRE UP ALL EVENT LISTENERS ────────────────────────────
// Kept in one place so it's easy to see every interactive element.
function bindAllEvents() {
  // Navbar buttons
  document.getElementById('add-prompt-btn').addEventListener('click', openAddModal);
  document.getElementById('empty-add-btn').addEventListener('click', openAddModal);
  document.getElementById('export-btn').addEventListener('click', exportPrompts);
  document.getElementById('import-file').addEventListener('change', handleImportFile);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('templates-btn').addEventListener('click', () => toggleDropdown('templates-wrap'));
  document.getElementById('random-btn').addEventListener('click', showRandomPrompt);

  // Prompt form
  document.getElementById('prompt-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('modal-close').addEventListener('click', closePromptModal);
  document.getElementById('form-cancel').addEventListener('click', closePromptModal);

  // Delete modal
  document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);
  document.getElementById('delete-confirm').addEventListener('click', handleDeleteConfirm);

  // Random modal
  document.getElementById('random-modal-close').addEventListener('click', closeRandomModal);
  document.getElementById('random-another-btn').addEventListener('click', showRandomPrompt);
  document.getElementById('random-copy-btn').addEventListener('click', () => {
    const content = document.getElementById('rand-content').textContent;
    handleCopy(null, content);
  });

  // Import modal
  document.getElementById('import-cancel').addEventListener('click', () => {
    document.getElementById('import-modal').classList.add('hidden');
    state.pendingImport = null;
  });
  document.getElementById('import-merge').addEventListener('click', handleImportMerge);
  document.getElementById('import-replace').addEventListener('click', handleImportReplace);

  // Close dropdowns when clicking outside of them
  document.addEventListener('click', e => {
    if (!e.target.closest('.dropdown-wrap')) {
      closeAllDropdowns();
    }
  });
}

// ─── SEED EXAMPLE PROMPTS ────────────────────────────────────
// If this is the very first time someone opens the app,
// pre-populate the library with a few example prompts so
// it doesn't look empty and lonely.
function seedIfEmpty() {
  if (state.prompts.length > 0) return;

  const seeds = [
    {
      id: generateId(),
      title: "Summarize Like a Pro",
      category: "Writing",
      tags: ["beginners", "technical"],
      content: "Please summarize the following text in 3 bullet points. Each point should be one sentence. Focus on the key insights only, and avoid fluff.\n\nText: [PASTE YOUR TEXT HERE]",
      dateAdded: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: generateId(),
      title: "Refactor This Code",
      category: "Coding",
      tags: ["technical", "advanced"],
      content: "Refactor the following code to improve readability, performance, and maintainability. Add helpful comments and follow best practices for [LANGUAGE]. Explain the changes you made and why.\n\n```\n[PASTE CODE HERE]\n```",
      dateAdded: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: generateId(),
      title: "Cinematic Fantasy Scene",
      category: "Image Generation",
      tags: ["creative", "fun"],
      content: "A breathtaking fantasy landscape at twilight, ancient ruined temples overgrown with glowing bioluminescent vines, a lone wanderer silhouetted against a double moon sky, mist rolling through valleys, dramatic volumetric lighting, epic scale, cinematic composition, 8k ultra-detailed, award-winning digital art, by Greg Rutkowski and Moebius.",
      dateAdded: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  state.prompts = seeds;
  saveToStorage();
}

// ─── INIT ────────────────────────────────────────────────────
// Everything kicks off here. Called once when the page loads.
function init() {
  loadFromStorage();
  seedIfEmpty();
  buildTemplatesMenu();
  bindSearchAndFilters();
  bindAllEvents();
  bindModalOverlayClicks();
  bindKeyboard();
  renderCards();

  console.log('%c⚡ PromptLab loaded!', 'color:#7c6cfc;font-weight:bold;font-size:14px;');
  console.log('%cTip: Press Ctrl+K (or ⌘K) to focus the search bar.', 'color:#8888aa;font-size:12px;');
}

document.addEventListener('DOMContentLoaded', init);
