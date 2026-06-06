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

function amazonUrl(raw) {
  const val = raw.replace(/[-\s]/g, '').toUpperCase();
  // ASIN: 10 alphanumeric chars with a letter before the final position
  // (ISBN-10 is digits-only + optional trailing X checksum; ASINs like B0XXXXXXXX have letters earlier)
  const isAsin = val.length === 10 && /^[A-Z0-9]{10}$/.test(val) && /[A-Z]/.test(val.slice(0, 9));
  const domain = getAmazonDomain();
  return isAsin
    ? `https://www.${domain}/dp/${val}`
    : `https://www.${domain}/s?k=${val}`;
}

const AMAZON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.051-.13zm6.565-6.218c0-1.005.247-1.863.743-2.577.495-.71 1.17-1.25 2.04-1.615.796-.335 1.756-.575 2.912-.72.39-.046 1.033-.103 1.92-.174v-.37c0-.93-.105-1.558-.3-1.875-.302-.43-.78-.65-1.44-.65h-.182c-.48.046-.896.196-1.246.46-.35.27-.575.63-.675 1.096-.06.3-.206.465-.435.51l-2.52-.315c-.248-.06-.372-.18-.372-.39 0-.046.007-.09.022-.15.247-1.29.855-2.25 1.82-2.88.976-.616 2.1-.975 3.39-1.05h.54c1.65 0 2.957.434 3.888 1.29.135.15.27.3.405.48.12.165.224.314.283.45.075.134.15.33.195.57.06.254.105.42.135.51.03.104.062.3.076.615.01.313.02.493.02.553v5.28c0 .376.06.72.165 1.036.105.313.21.54.315.674l.51.674c.09.136.136.256.136.36 0 .12-.06.226-.18.314-1.2 1.05-1.86 1.62-1.963 1.71-.165.135-.375.15-.63.045a6.062 6.062 0 01-.526-.496l-.31-.347a9.391 9.391 0 01-.317-.42l-.3-.435c-.81.886-1.603 1.44-2.4 1.665-.494.15-1.093.227-1.83.227-1.11 0-2.04-.343-2.76-1.034-.72-.69-1.08-1.665-1.08-2.94l-.05-.076zm3.753-.438c0 .566.14 1.02.425 1.364.285.34.675.512 1.155.512.045 0 .106-.007.195-.02.09-.016.134-.023.166-.023.614-.16 1.08-.553 1.424-1.178.165-.28.285-.58.36-.91.09-.32.12-.59.135-.8.015-.195.015-.54.015-1.005v-.54c-.84 0-1.484.06-1.92.18-1.275.36-1.92 1.17-1.92 2.43l-.035-.02zm9.162 7.027c.03-.06.075-.11.132-.17.362-.243.714-.41 1.05-.5a8.094 8.094 0 011.612-.24c.14-.012.28 0 .41.03.65.06 1.05.168 1.172.33.063.09.099.228.099.39v.15c0 .51-.149 1.11-.424 1.8-.278.69-.664 1.248-1.156 1.68-.073.06-.14.09-.197.09-.03 0-.06 0-.09-.012-.09-.044-.107-.12-.064-.24.54-1.26.806-2.143.806-2.64 0-.15-.03-.27-.087-.344-.145-.166-.55-.257-1.224-.257-.243 0-.533.016-.87.046-.363.045-.7.09-1 .135-.09 0-.148-.014-.18-.044-.03-.03-.036-.047-.02-.077 0-.017.006-.03.02-.063v-.06z"/></svg>`;

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
    ['Paperback', book['Paperback ISBN (or ASIN)']],
    ['Hardback', book['Hardback ISBN (or ASIN)']],
    ['eBook', book['eBook ISBN (or ASIN)']],
  ]
    .filter(([, isbn]) => isbn)
    .map(([label, isbn]) =>
      `<a href="${amazonUrl(isbn)}" class="buy-link" target="_blank" rel="noopener noreferrer">${AMAZON_SVG}${label} on Amazon</a>`)
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
        ${meta('Paperback ISBN', book['Paperback ISBN (or ASIN)'])}
        ${meta('Hardback ISBN', book['Hardback ISBN (or ASIN)'])}
        ${meta('eBook ISBN', book['eBook ISBN (or ASIN)'])}
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

  if (sort === 'random') {
    filtered = [...filtered].sort((a, b) => a._rand - b._rand);
  } else if (sort === 'oldest') {
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

    allBooks.forEach(b => { b._rand = Math.random(); });
    populateFilters(allBooks);
    renderBooks([...allBooks].sort((a, b) => a._rand - b._rand));

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
