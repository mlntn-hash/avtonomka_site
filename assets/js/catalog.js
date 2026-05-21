/* catalog.js — завантаження та рендер товарів */

const { formatPrice, stripHtml, truncate, tgOrderLink } = window.AvtonomkaUtils;

const ITEMS_PER_PAGE = 24;

let allProducts = [];
let filtered    = [];
let currentPage = 1;

/* ---- DOM refs ---- */
const grid        = document.getElementById('products-grid');
const counter     = document.getElementById('catalog-counter');
const pagination  = document.getElementById('pagination');
const searchInput = document.getElementById('filter-search');
const catSelect   = document.getElementById('filter-category');
const sortSelect  = document.getElementById('filter-sort');
const radios      = document.querySelectorAll('input[name="availability"]');

/* ---- Init ---- */
async function init() {
  showLoading();
  try {
    const resp = await fetch('products.json');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    allProducts = Array.isArray(data) ? data : (data.products || []);
    populateCategories();
    applyFilters();
  } catch (e) {
    showError();
    console.error('Помилка завантаження products.json:', e);
  }
}

/* ---- Populate category dropdown ---- */
function populateCategories() {
  const types = [...new Set(allProducts.map(p => p.product_type).filter(Boolean))].sort();
  types.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    catSelect.appendChild(opt);
  });
}

/* ---- Filter + sort ---- */
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const cat   = catSelect.value;
  const avail = document.querySelector('input[name="availability"]:checked')?.value || 'all';
  const sort  = sortSelect.value;

  filtered = allProducts.filter(p => {
    if (query && !p.title?.toLowerCase().includes(query)) return false;
    if (cat && p.product_type !== cat) return false;
    if (avail === 'in_stock' && p.availability !== 'in_stock') return false;
    return true;
  });

  filtered.sort((a, b) => {
    const pa = parseFloat(a.price) || 0;
    const pb = parseFloat(b.price) || 0;
    if (sort === 'price_asc')  return pa - pb;
    if (sort === 'price_desc') return pb - pa;
    if (sort === 'name_asc')   return (a.title || '').localeCompare(b.title || '', 'uk');
    if (sort === 'name_desc')  return (b.title || '').localeCompare(a.title || '', 'uk');
    return 0;
  });

  currentPage = 1;
  render();
}

/* ---- Render current page ---- */
function render() {
  const total = filtered.length;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end   = Math.min(start + ITEMS_PER_PAGE, total);
  const page  = filtered.slice(start, end);

  counter.textContent = `Показано ${start + 1}–${end} з ${total} товарів`;
  if (total === 0) counter.textContent = 'Товарів не знайдено';

  grid.innerHTML = '';
  if (page.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <img src="assets/images/sticker.webp" alt="Хом'як-електрик" loading="lazy">
        <h3>Нічого не знайдено</h3>
        <p>Спробуйте змінити параметри пошуку або скиньте фільтри.</p>
      </div>`;
    pagination.innerHTML = '';
    return;
  }

  page.forEach(p => grid.insertAdjacentHTML('beforeend', renderCard(p)));
  renderPagination(total);
}

/* ---- Card HTML ---- */
function renderCard(p) {
  const inStock = p.availability === 'in_stock';
  const badge   = inStock
    ? '<span class="badge badge-green">В наявності</span>'
    : '<span class="badge badge-grey">Немає</span>';
  const rawPrice = p.price || '';
  const priceNum = parseFloat(rawPrice);
  const priceStr = !isNaN(priceNum)
    ? priceNum.toLocaleString('uk-UA', { maximumFractionDigits: 0 }) + ' ' + (rawPrice.replace(/[\d.]+\s*/,'') || 'UAH')
    : rawPrice;
  const title = truncate(p.title || '', 60);
  const cat   = (p.product_type || '').split('>').pop().trim();

  return `
  <div class="product-card">
    <div class="product-card__img-wrap">
      <img src="${p.image_link || 'assets/images/sticker.webp'}"
           alt="${escapeHtml(p.title || '')}"
           loading="lazy"
           onerror="this.src='assets/images/sticker.webp'">
      <div class="product-card__availability">${badge}</div>
    </div>
    <div class="product-card__body">
      ${cat ? `<div class="product-card__category">${escapeHtml(cat)}</div>` : ''}
      <div class="product-card__title">${escapeHtml(title)}</div>
      <div class="product-card__meta">
        <span class="price-tag">${escapeHtml(priceStr)}</span>
        ${p.mpn ? `<span class="product-card__sku text-muted">Арт.: ${escapeHtml(p.mpn)}</span>` : ''}
      </div>
    </div>
    <div class="product-card__footer">
      <a href="product.html?id=${encodeURIComponent(p.id)}" class="btn btn-primary btn-block btn-sm">
        Детальніше
      </a>
    </div>
  </div>`;
}

/* ---- Pagination ---- */
function renderPagination(total) {
  const pages = Math.ceil(total / ITEMS_PER_PAGE);
  if (pages <= 1) { pagination.innerHTML = ''; return; }

  let html = '';
  html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">&#8592;</button>`;

  const range = buildPageRange(currentPage, pages);
  range.forEach(p => {
    if (p === '...') {
      html += `<span style="padding:0 6px;color:var(--color-muted)">…</span>`;
    } else {
      html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
  });

  html += `<button class="page-btn" ${currentPage === pages ? 'disabled' : ''} data-page="${currentPage + 1}">&#8594;</button>`;
  pagination.innerHTML = html;

  pagination.querySelectorAll('.page-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = +btn.dataset.page;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range = [1];
  if (current > 3) range.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) range.push(i);
  if (current < total - 2) range.push('...');
  range.push(total);
  return range;
}

/* ---- Loading / Error states ---- */
function showLoading() {
  grid.innerHTML = `
    <div class="loading-state" style="grid-column:1/-1">
      <div class="spinner"></div>
      <span>Завантаження товарів…</span>
    </div>`;
}

function showError() {
  grid.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1">
      <img src="assets/images/sticker.webp" alt="" loading="lazy">
      <h3>Не вдалося завантажити товари</h3>
      <p>Перевірте підключення до інтернету або спробуйте пізніше.</p>
    </div>`;
}

/* ---- Escape HTML ---- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---- Event listeners ---- */
searchInput?.addEventListener('input', debounce(applyFilters, 250));
catSelect?.addEventListener('change', applyFilters);
sortSelect?.addEventListener('change', applyFilters);
radios?.forEach(r => r.addEventListener('change', applyFilters));

document.getElementById('filter-reset')?.addEventListener('click', () => {
  searchInput.value = '';
  catSelect.value = '';
  sortSelect.value = 'name_asc';
  document.querySelector('input[name="availability"][value="all"]').checked = true;
  applyFilters();
});

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ---- Start ---- */
init();
