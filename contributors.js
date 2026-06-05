const CONTRIBUTORS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8WkNpvc7I0CAXmT9N6jalYrYKNiEMLmXZ5W_Ua3POxU5M4lcjetfYinLPahvx4P05hs6jKqzFgxIZ/pub?output=csv';
const BOOKS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTVk42c6df0NKKJo6mOV9IZ-lpOLHVst5A4wz31zkzl1KG8gq36R_i1p76Pn3FMYDredKihnclM76M-/pub?output=csv';

let allContributors = [];
let allBooks = [];

function parseCSV(text) {
  const rows = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    const row = [];
    while (true) {
      let field = '';
      if (i < n && text[i] === '"') {
        i++;
        while (i < n) {
          if (text[i] === '"') {
            if (i + 1 < n && text[i + 1] === '"') { field += '"'; i += 2; }
            else { i++; break; }
          } else { field += text[i++]; }
        }
      } else {
        while (i < n && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') {
          field += text[i++];
        }
      }
      row.push(field);
      if (i < n && text[i] === ',') { i++; } else { break; }
    }
    if (i < n && text[i] === '\r') i++;
    if (i < n && text[i] === '\n') i++;
    rows.push(row);
  }
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(row => row.some(cell => cell.trim()))
    .map(row => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (row[idx] || '').trim(); });
      return obj;
    });
}

function driveThumbUrl(url) {
  if (!url) return '';
  const byId = url.match(/[?&]id=([^&]+)/);
  if (byId) return `https://drive.google.com/thumbnail?id=${byId[1]}&sz=w400`;
  const byPath = url.match(/\/d\/([^/]+)/);
  if (byPath) return `https://drive.google.com/thumbnail?id=${byPath[1]}&sz=w400`;
  return url;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getContributorData(contributor) {
  const names = [contributor['Full Name'], contributor['Alternative Name 1'], contributor['Alternative Name 2']]
    .filter(Boolean).map(n => n.trim());
  const namesLower = new Set(names.map(n => n.toLowerCase()));

  const books = [];
  allBooks.forEach(book => {
    const authorLower = (book['Author'] || '').trim().toLowerCase();
    const illustratorLower = (book['Illustrator'] || '').trim().toLowerCase();
    const isAuthor = namesLower.has(authorLower);
    const isIllustrator = namesLower.has(illustratorLower);
    if (isAuthor || isIllustrator) {
      const roles = [];
      if (isAuthor) roles.push('Author');
      if (isIllustrator) roles.push('Illustrator');
      books.push({ book, roles });
    }
  });

  const usedNamesLower = new Set();
  books.forEach(({ book }) => {
    if (book['Author']) usedNamesLower.add(book['Author'].trim().toLowerCase());
    if (book['Illustrator']) usedNamesLower.add(book['Illustrator'].trim().toLowerCase());
  });

  const altNames = [contributor['Alternative Name 1'], contributor['Alternative Name 2']]
    .filter(n => n && usedNamesLower.has(n.trim().toLowerCase()));

  const allRoles = [...new Set(books.flatMap(({ roles }) => roles))];

  return { books, altNames, allRoles };
}

function applyContributorPlaceholder(img) {
  const avatar = img.closest('.contributor-avatar');
  if (!avatar || avatar.classList.contains('contributor-avatar--placeholder')) return;
  const nameEl = avatar.closest('.contributor-card')?.querySelector('.contributor-name');
  const letter = nameEl ? nameEl.textContent.trim().charAt(0).toUpperCase() : '?';
  avatar.classList.add('contributor-avatar--placeholder');
  avatar.innerHTML = `<span>${letter}</span>`;
}

function renderContributorCard(contributor, index) {
  const { altNames, allRoles } = getContributorData(contributor);
  const imgUrl = driveThumbUrl(contributor['Profile Photo']);
  const name = escapeHtml(contributor['Full Name'] || 'Unknown');
  const bio = contributor['Bio'] || '';
  const bioExcerpt = bio.length > 130 ? escapeHtml(bio.slice(0, 130)) + '…' : escapeHtml(bio);

  const avatarHtml = imgUrl
    ? `<div class="contributor-avatar"><img src="${escapeHtml(imgUrl)}" alt="Photo of ${name}" loading="lazy"></div>`
    : `<div class="contributor-avatar contributor-avatar--placeholder"><span>${escapeHtml((contributor['Full Name'] || '?').charAt(0).toUpperCase())}</span></div>`;

  const roleTags = allRoles.map(r =>
    `<span class="tag tag-role-${r.toLowerCase()}">${escapeHtml(r)}</span>`
  ).join('');

  const altNamesHtml = altNames.length
    ? `<p class="contributor-alt-names">Also known as: ${altNames.map(n => `<em>${escapeHtml(n)}</em>`).join(', ')}</p>`
    : '';

  return `
    <article class="contributor-card" role="listitem" data-index="${index}" tabindex="0"
             aria-label="${name}">
      ${avatarHtml}
      <div class="contributor-card-body">
        <h2 class="contributor-name">${name}</h2>
        ${altNamesHtml}
        <div class="card-tags">${roleTags}</div>
        ${bioExcerpt ? `<p class="contributor-bio-excerpt">${bioExcerpt}</p>` : ''}
      </div>
    </article>`;
}

function renderContributors(contributors) {
  const grid = document.getElementById('contributors-grid');
  const status = document.getElementById('status-bar');

  if (contributors.length === 0) {
    grid.innerHTML = '<p class="no-results">No contributors match your search.</p>';
    status.textContent = '';
    return;
  }

  status.textContent = `Showing ${contributors.length} contributor${contributors.length !== 1 ? 's' : ''}`;
  grid.innerHTML = contributors.map((c, i) => renderContributorCard(c, i)).join('');

  grid.querySelectorAll('.contributor-card').forEach(card => {
    const open = () => openModal(contributors[+card.dataset.index]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  grid.querySelectorAll('.contributor-avatar img').forEach(img => {
    img.addEventListener('error', () => applyContributorPlaceholder(img));
  });
}

function openModal(contributor) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  const { books, altNames } = getContributorData(contributor);

  const imgUrl = driveThumbUrl(contributor['Profile Photo']);
  const name = escapeHtml(contributor['Full Name'] || 'Unknown');
  const initial = escapeHtml((contributor['Full Name'] || '?').charAt(0).toUpperCase());

  const avatarHtml = imgUrl
    ? `<div class="modal-contributor-avatar"><img src="${escapeHtml(imgUrl)}" alt="Photo of ${name}" class="modal-avatar-img" id="modal-avatar-img"></div>`
    : `<div class="modal-contributor-avatar modal-contributor-avatar--placeholder"><span>${initial}</span></div>`;

  const altNamesHtml = altNames.length
    ? `<p class="modal-meta"><strong>Also known as:</strong> ${altNames.map(n => escapeHtml(n)).join(', ')}</p>`
    : '';

  const bioHtml = contributor['Bio']
    ? `<div class="modal-blurb">${escapeHtml(contributor['Bio']).replace(/\n/g, '<br>')}</div>`
    : '';

  const socialLinks = [
    ['Amazon', contributor['Amazon Author Central Profile']],
    ['Goodreads', contributor['Goodreads Profile']],
    ['Facebook', contributor['Facebook Profile']],
    ['Instagram', contributor['Instagram Profile']],
    ['YouTube', contributor['YouTube Channel']],
    ['Substack', contributor['Substack']],
    ['TikTok', contributor['Tiktok Profile']],
    ['Etsy', contributor['Etsy Store']],
  ].filter(([, url]) => url);

  const socialHtml = socialLinks.length
    ? `<div class="modal-social">
        <h3>Links</h3>
        ${socialLinks.map(([label, url]) =>
          `<a href="${escapeHtml(url)}" class="social-link" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
        ).join('')}
      </div>`
    : '';

  const booksHtml = books.length
    ? `<div class="modal-contributor-books">
        <h3>Books</h3>
        <ul class="contributor-book-list">
          ${books.map(({ book, roles }) => `
            <li class="contributor-book-item">
              <span class="contributor-book-title">${escapeHtml(book['Title'] || 'Untitled')}</span>${book['Subtitle'] ? `<span class="contributor-book-subtitle"> — ${escapeHtml(book['Subtitle'])}</span>` : ''}<span class="contributor-book-roles">${roles.map(r => `<span class="tag tag-role-${r.toLowerCase()}">${escapeHtml(r)}</span>`).join('')}</span>
            </li>`).join('')}
        </ul>
      </div>`
    : '';

  body.innerHTML = `
    <div class="modal-contributor-layout">
      ${avatarHtml}
      <div class="modal-info">
        <h2 id="modal-title" class="modal-title">${name}</h2>
        ${altNamesHtml}
        ${bioHtml}
        ${socialHtml}
        ${booksHtml}
      </div>
    </div>`;

  const modalImg = document.getElementById('modal-avatar-img');
  if (modalImg) {
    modalImg.addEventListener('error', () => {
      const avatar = modalImg.closest('.modal-contributor-avatar');
      if (avatar) {
        avatar.classList.add('modal-contributor-avatar--placeholder');
        avatar.innerHTML = `<span>${initial}</span>`;
      }
    });
  }

  overlay.hidden = false;
  document.getElementById('modal-close').focus();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').hidden = true;
  document.body.style.overflow = '';
}

function applyFilters() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  const sort = document.getElementById('sort-order').value;

  let filtered = allContributors.filter(c => {
    if (!query) return true;
    return [c['Full Name'], c['Alternative Name 1'], c['Alternative Name 2']]
      .filter(Boolean)
      .some(n => n.toLowerCase().includes(query));
  });

  if (sort === 'newest') {
    filtered = [...filtered].reverse();
  } else {
    filtered = [...filtered].sort((a, b) => (a['Full Name'] || '').localeCompare(b['Full Name'] || ''));
  }

  renderContributors(filtered);
}

async function init() {
  document.getElementById('contributors-grid').innerHTML = '<p class="loading">Loading contributors…</p>';

  try {
    const [contribRes, booksRes] = await Promise.all([
      fetch(CONTRIBUTORS_CSV_URL),
      fetch(BOOKS_CSV_URL),
    ]);
    if (!contribRes.ok) throw new Error(`HTTP ${contribRes.status}`);
    if (!booksRes.ok) throw new Error(`HTTP ${booksRes.status}`);

    allContributors = parseCSV(await contribRes.text());
    allBooks = parseCSV(await booksRes.text());

    if (allContributors.length === 0) {
      document.getElementById('contributors-grid').innerHTML =
        '<p class="no-results">No contributors found yet. Check back soon.</p>';
      return;
    }

    renderContributors(allContributors);
  } catch (err) {
    console.error('Failed to load contributors:', err);
    document.getElementById('contributors-grid').innerHTML =
      '<p class="error">Could not load contributors. Please try again later.</p>';
  }

  document.getElementById('search-input').addEventListener('input', applyFilters);
  document.getElementById('sort-order').addEventListener('change', applyFilters);

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  document.getElementById('footer-year').textContent = new Date().getFullYear();
}

init();
