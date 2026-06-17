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

function svgIcon(path) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg>`;
}

const SOCIAL_ICONS = {
  Amazon:    svgIcon('M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.051-.13zm6.565-6.218c0-1.005.247-1.863.743-2.577.495-.71 1.17-1.25 2.04-1.615.796-.335 1.756-.575 2.912-.72.39-.046 1.033-.103 1.92-.174v-.37c0-.93-.105-1.558-.3-1.875-.302-.43-.78-.65-1.44-.65h-.182c-.48.046-.896.196-1.246.46-.35.27-.575.63-.675 1.096-.06.3-.206.465-.435.51l-2.52-.315c-.248-.06-.372-.18-.372-.39 0-.046.007-.09.022-.15.247-1.29.855-2.25 1.82-2.88.976-.616 2.1-.975 3.39-1.05h.54c1.65 0 2.957.434 3.888 1.29.135.15.27.3.405.48.12.165.224.314.283.45.075.134.15.33.195.57.06.254.105.42.135.51.03.104.062.3.076.615.01.313.02.493.02.553v5.28c0 .376.06.72.165 1.036.105.313.21.54.315.674l.51.674c.09.136.136.256.136.36 0 .12-.06.226-.18.314-1.2 1.05-1.86 1.62-1.963 1.71-.165.135-.375.15-.63.045a6.062 6.062 0 01-.526-.496l-.31-.347a9.391 9.391 0 01-.317-.42l-.3-.435c-.81.886-1.603 1.44-2.4 1.665-.494.15-1.093.227-1.83.227-1.11 0-2.04-.343-2.76-1.034-.72-.69-1.08-1.665-1.08-2.94l-.05-.076zm3.753-.438c0 .566.14 1.02.425 1.364.285.34.675.512 1.155.512.045 0 .106-.007.195-.02.09-.016.134-.023.166-.023.614-.16 1.08-.553 1.424-1.178.165-.28.285-.58.36-.91.09-.32.12-.59.135-.8.015-.195.015-.54.015-1.005v-.54c-.84 0-1.484.06-1.92.18-1.275.36-1.92 1.17-1.92 2.43l-.035-.02zm9.162 7.027c.03-.06.075-.11.132-.17.362-.243.714-.41 1.05-.5a8.094 8.094 0 011.612-.24c.14-.012.28 0 .41.03.65.06 1.05.168 1.172.33.063.09.099.228.099.39v.15c0 .51-.149 1.11-.424 1.8-.278.69-.664 1.248-1.156 1.68-.073.06-.14.09-.197.09-.03 0-.06 0-.09-.012-.09-.044-.107-.12-.064-.24.54-1.26.806-2.143.806-2.64 0-.15-.03-.27-.087-.344-.145-.166-.55-.257-1.224-.257-.243 0-.533.016-.87.046-.363.045-.7.09-1 .135-.09 0-.148-.014-.18-.044-.03-.03-.036-.047-.02-.077 0-.017.006-.03.02-.063v-.06z'),
  Goodreads: svgIcon('M17.346.026c.422-.083.859.037 1.179.325.346.284.55.705.557 1.153-.023.457-.247.88-.612 1.156l-2.182 1.748a.601.601 0 0 0-.255.43.52.52 0 0 0 .11.424 5.886 5.886 0 0 1 .832 6.58c-1.394 2.79-4.503 3.99-7.501 2.927a.792.792 0 0 0-.499-.01c-.224.07-.303.18-.453.383l-.014.02-.941 1.254s-.792.985.457.935c3.027-.119 3.817-.119 5.439-.01 2.641.18 3.806 1.903 3.806 3.275 0 1.623-1.036 3.383-3.809 3.383a117.46 117.46 0 0 0-5.517-.03c-.31.005-.597.013-.835.02-.228.006-.41.011-.52.011-.712 0-1.648-.186-1.66-1.068-.008-.729.624-1.12 1.11-1.172.43-.045.815.007 1.24.064.252.034.518.07.815.088.185.011.366.025.552.038.53.038 1.102.08 1.926.087.427.005.759.01 1.025.015.695.012.941.016 1.28-.015 1.248-.112 1.832-.61 1.832-1.376 0-.805-.584-1.264-1.698-1.414-1.564-.213-2.33-.163-3.72-.074a87.66 87.66 0 0 1-1.669.095c-.608.029-2.449.026-2.682-1.492-.053-.416-.073-1.116.807-2.325l.75-1.003c.36-.49.582-.898.053-1.559 0 0-.39-.468-.52-.638-1.215-1.587-1.512-4.08-.448-6.114 1.577-3.011 5.4-4.26 8.37-2.581.253.143.438.203.655.163.201-.032.27-.167.363-.344.02-.04.042-.082.067-.126.004-.01.241-.465.535-1.028l.734-1.41a1.493 1.493 0 0 1 1.041-.785ZM9.193 13.243c1.854.903 3.912.208 5.254-2.47 1.352-2.699.827-5.11-1.041-6.023C10.918 3.537 8.81 5.831 8.017 7.41c-1.355 2.698-.717 4.886 1.147 5.818Z'),
  Facebook:  svgIcon('M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z'),
  Instagram: svgIcon('M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077'),
  YouTube:   svgIcon('M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'),
  Substack:  svgIcon('M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z'),
  TikTok:    svgIcon('M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'),
  Etsy:      svgIcon('M8.559 2.445c0-.325.033-.52.59-.52h7.465c1.3 0 2.02 1.11 2.54 3.193l.42 1.666h1.27c.23-4.728.43-6.784.43-6.784s-3.196.36-5.09.36H6.635L1.521.196v1.37l1.725.326c1.21.24 1.5.496 1.6 1.606 0 0 .11 3.27.11 8.64 0 5.385-.09 8.61-.09 8.61 0 .973-.39 1.333-1.59 1.573l-1.722.33V24l5.13-.165h8.55c1.935 0 6.39.165 6.39.165.105-1.17.75-6.48.855-7.064h-1.2l-1.284 2.91c-1.005 2.28-2.476 2.445-4.11 2.445h-4.906c-1.63 0-2.415-.64-2.415-2.05V12.8s3.62 0 4.79.096c.912.064 1.463.325 1.76 1.598l.39 1.695h1.41l-.09-4.278.192-4.305h-1.391l-.45 1.89c-.283 1.244-.48 1.47-1.754 1.6-1.666.17-4.815.14-4.815.14V2.45h-.05z'),
};

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

  const assemblyHtml = contributor['Home Assembly']
    ? `<p class="contributor-assembly">${escapeHtml(contributor['Home Assembly'])}</p>`
    : '';

  return `
    <article class="contributor-card" role="listitem" data-index="${index}" tabindex="0"
             aria-label="${name}">
      ${avatarHtml}
      <div class="contributor-card-body">
        <h2 class="contributor-name">${name}</h2>
        ${assemblyHtml}
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

  const modalAssemblyHtml = contributor['Home Assembly']
    ? `<p class="modal-assembly">${escapeHtml(contributor['Home Assembly'])}</p>`
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
          `<a href="${escapeHtml(url)}" class="social-link" target="_blank" rel="noopener noreferrer">${SOCIAL_ICONS[label] ?? ''}${escapeHtml(label)}</a>`
        ).join('')}
      </div>`
    : '';

  const booksHtml = books.length
    ? `<div class="modal-contributor-books">
        <h3>Books</h3>
        <ul class="contributor-book-list">
          ${books.map(({ book, roles }) => `
            <li class="contributor-book-item">
              <a href="index.html?open=${encodeURIComponent(book['Title'] || '')}" class="modal-link contributor-book-title">${escapeHtml(book['Title'] || 'Untitled')}</a>${book['Subtitle'] ? `<span class="contributor-book-subtitle"> — ${escapeHtml(book['Subtitle'])}</span>` : ''}<span class="contributor-book-roles">${roles.map(r => `<span class="tag tag-role-${r.toLowerCase()}">${escapeHtml(r)}</span>`).join('')}</span>
            </li>`).join('')}
        </ul>
      </div>`
    : '';

  body.innerHTML = `
    <div class="modal-contributor-layout">
      ${avatarHtml}
      <div class="modal-info">
        <h2 id="modal-title" class="modal-title">${name}</h2>
        ${modalAssemblyHtml}
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

    const openParam = new URLSearchParams(location.search).get('open');
    if (openParam) {
      const match = allContributors.find(c => c['Full Name'] === openParam);
      if (match) openModal(match);
    }
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
