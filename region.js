const AMAZON_REGIONS = [
  { code: 'us', label: 'United States',  flagCode: 'us', domain: 'amazon.com' },
  { code: 'uk', label: 'United Kingdom', flagCode: 'gb', domain: 'amazon.co.uk' },
  { code: 'ca', label: 'Canada',         flagCode: 'ca', domain: 'amazon.ca' },
  { code: 'au', label: 'Australia',      flagCode: 'au', domain: 'amazon.com.au' },
  { code: 'de', label: 'Germany',        flagCode: 'de', domain: 'amazon.de' },
  { code: 'fr', label: 'France',         flagCode: 'fr', domain: 'amazon.fr' },
  { code: 'it', label: 'Italy',          flagCode: 'it', domain: 'amazon.it' },
  { code: 'es', label: 'Spain',          flagCode: 'es', domain: 'amazon.es' },
  { code: 'nl', label: 'Netherlands',    flagCode: 'nl', domain: 'amazon.nl' },
  { code: 'se', label: 'Sweden',         flagCode: 'se', domain: 'amazon.se' },
  { code: 'pl', label: 'Poland',         flagCode: 'pl', domain: 'amazon.pl' },
  { code: 'jp', label: 'Japan',          flagCode: 'jp', domain: 'amazon.co.jp' },
  { code: 'in', label: 'India',          flagCode: 'in', domain: 'amazon.in' },
  { code: 'sg', label: 'Singapore',      flagCode: 'sg', domain: 'amazon.sg' },
  { code: 'ae', label: 'UAE',            flagCode: 'ae', domain: 'amazon.ae' },
  { code: 'sa', label: 'Saudi Arabia',   flagCode: 'sa', domain: 'amazon.sa' },
  { code: 'br', label: 'Brazil',         flagCode: 'br', domain: 'amazon.com.br' },
  { code: 'mx', label: 'Mexico',         flagCode: 'mx', domain: 'amazon.com.mx' },
];

const REGION_KEY = 'twm_amazon_region';

function detectAmazonRegion() {
  const lang = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
  if (lang.startsWith('de'))                return 'de';
  if (lang.startsWith('fr'))                return 'fr';
  if (lang.startsWith('it'))                return 'it';
  if (lang.startsWith('nl'))                return 'nl';
  if (lang.startsWith('sv'))                return 'se';
  if (lang.startsWith('pl'))                return 'pl';
  if (lang.startsWith('ja'))                return 'jp';
  if (lang.startsWith('pt'))                return 'br';
  if (lang === 'es-mx')                     return 'mx';
  if (lang.startsWith('es'))                return 'es';
  if (lang.startsWith('ar'))                return 'ae';
  if (lang === 'en-gb' || lang === 'en-ie') return 'uk';
  if (lang === 'en-ca')                     return 'ca';
  if (lang === 'en-au' || lang === 'en-nz') return 'au';
  if (lang === 'en-in')                     return 'in';
  if (lang === 'en-sg')                     return 'sg';
  return 'us';
}

function getAmazonRegion() {
  const saved = localStorage.getItem(REGION_KEY);
  if (saved && AMAZON_REGIONS.some(r => r.code === saved)) return saved;
  return detectAmazonRegion();
}

function setAmazonRegion(code) {
  localStorage.setItem(REGION_KEY, code);
}

function getAmazonDomain() {
  const code = getAmazonRegion();
  return (AMAZON_REGIONS.find(r => r.code === code) ?? AMAZON_REGIONS[0]).domain;
}

function initRegionSelector() {
  const picker  = document.getElementById('region-picker');
  const btn     = document.getElementById('region-btn');
  const dropdown = document.getElementById('region-dropdown');
  if (!picker || !btn || !dropdown) return;

  const current = getAmazonRegion();
  const currentRegion = AMAZON_REGIONS.find(r => r.code === current) ?? AMAZON_REGIONS[0];

  btn.innerHTML = `<span class="fi fis fi-${currentRegion.flagCode}"></span>`;
  btn.setAttribute('aria-label', `Amazon store: ${currentRegion.label}. Click to change.`);

  dropdown.innerHTML = AMAZON_REGIONS.map(r =>
    `<button class="region-option${r.code === current ? ' region-option--active' : ''}"
             data-code="${r.code}"
             title="${r.label}"
             aria-label="${r.label}"
             role="option"
             aria-selected="${r.code === current}"><span class="fi fis fi-${r.flagCode}"></span></button>`
  ).join('');

  function openDropdown() {
    dropdown.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    dropdown.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.hidden ? openDropdown() : closeDropdown();
  });

  dropdown.addEventListener('click', e => {
    const option = e.target.closest('.region-option');
    if (!option) return;
    const code = option.dataset.code;
    setAmazonRegion(code);
    const region = AMAZON_REGIONS.find(r => r.code === code) ?? AMAZON_REGIONS[0];
    btn.innerHTML = `<span class="fi fis fi-${region.flagCode}"></span>`;
    btn.setAttribute('aria-label', `Amazon store: ${region.label}. Click to change.`);
    dropdown.querySelectorAll('.region-option').forEach(el => {
      el.classList.toggle('region-option--active', el.dataset.code === code);
      el.setAttribute('aria-selected', String(el.dataset.code === code));
    });
    closeDropdown();
  });

  document.addEventListener('click', closeDropdown);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDropdown(); });
}

document.addEventListener('DOMContentLoaded', initRegionSelector);
