const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTVk42c6df0NKKJo6mOV9IZ-lpOLHVst5A4wz31zkzl1KG8gq36R_i1p76Pn3FMYDredKihnclM76M-/pub?output=csv';
const CONTRIBUTORS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8WkNpvc7I0CAXmT9N6jalYrYKNiEMLmXZ5W_Ua3POxU5M4lcjetfYinLPahvx4P05hs6jKqzFgxIZ/pub?output=csv';

let allBooks = [];
let allContributors = [];

// RFC 4180-compliant CSV parser (handles quoted fields, embedded commas, newlines, escaped quotes)
function parseCSV(text) {
  const rows = [];
  let i = 0;
  const n = text.length;

  while (i < n) {
    const row = [];
    while (true) {
      let field = '';
      if (i < n && text[i] === '"') {
        i++; // skip opening quote
        while (i < n) {
          if (text[i] === '"') {
            if (i + 1 < n && text[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++; // skip closing quote
              break;
            }
          } else {
            field += text[i++];
          }
        }
      } else {
        while (i < n && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') {
          field += text[i++];
        }
      }
      row.push(field);
      if (i < n && text[i] === ',') {
        i++;
      } else {
        break;
      }
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

// Convert a Google Drive share URL to an embeddable thumbnail URL.
// drive.google.com/thumbnail resolves to lh3.googleusercontent.com which
// has no cross-origin restrictions (access-control-allow-origin: *).
// Requires the file to be publicly shared in Google Drive.
function driveThumbUrl(url) {
  if (!url) return '';
  const byId = url.match(/[?&]id=([^&]+)/);
  if (byId) return `https://drive.google.com/thumbnail?id=${byId[1]}&sz=w400`;
  const byPath = url.match(/\/d\/([^/]+)/);
  if (byPath) return `https://drive.google.com/thumbnail?id=${byPath[1]}&sz=w400`;
  // if the URL is already a direct image link, use it as-is
  return url;
}

function applyPlaceholder(img) {
  const cover = img.closest('.card-cover');
  if (!cover || cover.classList.contains('card-cover--placeholder')) return;
  const titleEl = cover.closest('.book-card')?.querySelector('.card-title');
  const letter = titleEl ? titleEl.textContent.trim().charAt(0).toUpperCase() : '?';
  cover.classList.add('card-cover--placeholder');
  cover.innerHTML = `<span>${letter}</span>`;
  cover.style.width = '200px';
}

function amazonUrl(isbn) {
  return `https://www.amazon.com/s?k=${isbn.replace(/[-\s]/g, '')}`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function categoryTags(categoriesStr, cls = 'tag') {
  if (!categoriesStr) return '';
  return categoriesStr
    .split(',')
    .map(c => c.trim())
    .filter(Boolean)
    .map(c => `<span class="${cls}">${escapeHtml(c)}</span>`)
    .join('');
}

function renderCard(book, index) {
  const imgUrl = driveThumbUrl(book['Book Cover Image']);
  const title = escapeHtml(book['Title'] || 'Untitled');
  const author = escapeHtml(book['Author'] || 'Unknown Author');

  const coverHtml = imgUrl
    ? `<div class="card-cover"><img src="${escapeHtml(imgUrl)}" alt="Cover of ${title}" loading="lazy"></div>`
    : `<div class="card-cover card-cover--placeholder"><span>${escapeHtml((book['Title'] || '?').charAt(0).toUpperCase())}</span></div>`;

  const subtitle = book['Subtitle']
    ? `<p class="card-subtitle">${escapeHtml(book['Subtitle'])}</p>`
    : '';

  const tags = [
    categoryTags(book['Categories']),
    book['Age Range'] ? `<span class="tag tag-age">Ages ${escapeHtml(book['Age Range'])}</span>` : '',
  ].join('');

  return `
    <article class="book-card" role="listitem" data-index="${index}" tabindex="0"
             aria-label="${title} by ${author}">
      ${coverHtml}
      <div class="card-body">
        <h2 class="card-title">${title}</h2>
        ${subtitle}
        <p class="card-author">by ${author}</p>
        <div class="card-tags">${tags}</div>
      </div>
    </article>`;
}

function renderBooks(books) {
  const grid = document.getElementById('books-grid');
  const status = document.getElementById('status-bar');

  if (books.length === 0) {
    grid.innerHTML = '<p class="no-results">No books match your search. Try different filters.</p>';
    status.textContent = '';
    return;
  }

  status.textContent = `Showing ${books.length} book${books.length !== 1 ? 's' : ''}`;
  grid.innerHTML = books.map((b, i) => renderCard(b, i)).join('');

  grid.querySelectorAll('.book-card').forEach(card => {
    const open = () => openModal(books[+card.dataset.index]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  grid.querySelectorAll('.card-cover img').forEach(img => {
    img.addEventListener('error', () => applyPlaceholder(img));
  });
}

function openModal(book) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');

  const imgUrl = driveThumbUrl(book['Book Cover Image']);
  const title = escapeHtml(book['Title'] || 'Untitled');

  const meta = (label, value) =>
    value ? `<p class="modal-meta"><strong>${label}:</strong> ${escapeHtml(value)}</p>` : '';

  // Build a map from any contributor name (including alt names) → their Full Name
  const nameToFullName = new Map();
  allContributors.forEach(c => {
    const full = (c['Full Name'] || '').trim();
    if (!full) return;
    [c['Full Name'], c['Alternative Name 1'], c['Alternative Name 2']]
      .filter(Boolean)
      .forEach(n => nameToFullName.set(n.trim().toLowerCase(), full));
  });

  const metaOrLink = (label, value) => {
    if (!value) return '';
    const contribFull = nameToFullName.get(value.trim().toLowerCase());
    const content = contribFull
      ? `<a href="contributors.html?open=${encodeURIComponent(contribFull)}" class="modal-link">${escapeHtml(value)}</a>`
      : escapeHtml(value);
    return `<p class="modal-meta"><strong>${label}:</strong> ${content}</p>`;
  };

  const blurb = book['Blurb']
    ? `<div class="modal-blurb">${escapeHtml(book['Blurb']).replace(/\n/g, '<br>')}</div>`
    : '';

  const buyLinks = [
    ['Paperback', book['Paperback ISBN']],
    ['Hardback', book['Hardback ISBN']],
    ['eBook', book['eBook ISBN']],
  ]
    .filter(([, isbn]) => isbn)
    .map(([label, isbn]) =>
      `<a href="${amazonUrl(isbn)}" class="buy-link" target="_blank" rel="noopener noreferrer">${label} — ISBN ${escapeHtml(isbn)}</a>`)
    .join('');

  const coverHtml = imgUrl
    ? `<div class="modal-cover"><img src="${escapeHtml(imgUrl)}" alt="Cover of ${title}" class="modal-cover-img"></div>`
    : '';

  body.innerHTML = `
    <div class="modal-layout">
      ${coverHtml}
      <div class="modal-info">
        <h2 id="modal-title" class="modal-title">${title}</h2>
        ${book['Subtitle'] ? `<p class="modal-subtitle">${escapeHtml(book['Subtitle'])}</p>` : ''}
        ${metaOrLink('Author', book['Author'])}
        ${metaOrLink('Illustrator', book['Illustrator'])}
        ${meta('Age Range', book['Age Range'])}
        ${meta('Categories', book['Categories'])}
        ${meta('LCCN', book['LCCN'])}
        ${blurb}
        ${buyLinks ? `<div class="modal-buy"><h3>Buy this book</h3>${buyLinks}</div>` : ''}
      </div>
    </div>`;

  overlay.hidden = false;
  document.getElementById('modal-close').focus();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').hidden = true;
  document.body.style.overflow = '';
}

function populateFilters(books) {
  const categories = [...new Set(
    books.flatMap(b => b['Categories'] ? b['Categories'].split(',').map(c => c.trim()) : [])
  )].filter(Boolean).sort();

  const ages = [...new Set(books.map(b => b['Age Range']).filter(Boolean))].sort();

  const catSelect = document.getElementById('category-filter');
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    catSelect.appendChild(opt);
  });

  const ageSelect = document.getElementById('age-filter');
  const noneOpt = document.createElement('option');
  noneOpt.value = '__none__';
  noneOpt.textContent = 'No Age Range (Adult)';
  ageSelect.appendChild(noneOpt);
  ages.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = `Ages ${a}`;
    ageSelect.appendChild(opt);
  });
}

function applyFilters() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  const category = document.getElementById('category-filter').value;
  const age = document.getElementById('age-filter').value;
  const sort = document.getElementById('sort-order').value;

  let filtered = allBooks.filter(book => {
    const matchesSearch = !query
      || (book['Title'] || '').toLowerCase().includes(query)
      || (book['Author'] || '').toLowerCase().includes(query);
    const matchesCategory = !category
      || (book['Categories'] || '').split(',').map(c => c.trim()).includes(category);
    const matchesAge = !age
      ? true
      : age === '__none__'
        ? !(book['Age Range'] || '').trim()
        : book['Age Range'] === age;
    return matchesSearch && matchesCategory && matchesAge;
  });

  if (sort === 'oldest') {
    // already in CSV order
  } else if (sort === 'title') {
    filtered = [...filtered].sort((a, b) => (a['Title'] || '').localeCompare(b['Title'] || ''));
  } else if (sort === 'author') {
    filtered = [...filtered].sort((a, b) => (a['Author'] || '').localeCompare(b['Author'] || ''));
  } else {
    // newest: reverse CSV order
    filtered = [...filtered].reverse();
  }

  renderBooks(filtered);
}

async function init() {
  document.getElementById('books-grid').innerHTML = '<p class="loading">Loading books…</p>';

  try {
    const [booksRes, contribRes] = await Promise.all([
      fetch(CSV_URL),
      fetch(CONTRIBUTORS_CSV_URL),
    ]);
    if (!booksRes.ok) throw new Error(`HTTP ${booksRes.status}`);
    allBooks = parseCSV(await booksRes.text());
    if (contribRes.ok) allContributors = parseCSV(await contribRes.text());

    if (allBooks.length === 0) {
      document.getElementById('books-grid').innerHTML = '<p class="no-results">No books found yet. Check back soon.</p>';
      return;
    }

    populateFilters(allBooks);
    renderBooks([...allBooks].reverse());

    const openParam = new URLSearchParams(location.search).get('open');
    if (openParam) {
      const match = allBooks.find(b => b['Title'] === openParam);
      if (match) openModal(match);
    }
  } catch (err) {
    console.error('Failed to load books:', err);
    document.getElementById('books-grid').innerHTML =
      '<p class="error">Could not load books. Please try again later.</p>';
  }

  document.getElementById('search-input').addEventListener('input', applyFilters);
  document.getElementById('category-filter').addEventListener('change', applyFilters);
  document.getElementById('age-filter').addEventListener('change', applyFilters);
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
