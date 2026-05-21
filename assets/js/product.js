/* product.js — сторінка окремого товару (self-contained) */

/* ---- Local helpers ---- */
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim();
}

function formatPrice(raw) {
  if (!raw) return '';
  const num = parseFloat(raw);
  if (isNaN(num)) return raw;
  const currency = raw.replace(/[\d.\s]+/, '').trim() || 'UAH';
  return num.toLocaleString('uk-UA', { maximumFractionDigits: 0 }) + ' ' + currency;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tgOrderLink(title) {
  return 'https://t.me/avtonomka_od?text=' + encodeURIComponent('Хочу замовити: ' + title);
}

/* ---- Init ---- */
async function init() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  if (!id) { showNotFound(); return; }

  try {
    const resp = await fetch('products.json');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data     = await resp.json();
    const products = Array.isArray(data) ? data : (data.products || []);
    const product  = products.find(p => String(p.id) === String(id));
    if (!product) { showNotFound(); return; }
    render(product);
  } catch (e) {
    showError();
    console.error('product.js:', e);
  }
}

/* ---- Render product ---- */
function render(p) {
  document.title = (p.title || 'Товар') + ' — Автономка';

  /* breadcrumb */
  const bcName = document.getElementById('bc-name');
  if (bcName) bcName.textContent = p.title || '';

  /* ---- Gallery ---- */
  const images   = [p.image_link, ...(p.additional_images || [])].filter(Boolean);
  const mainImg  = document.getElementById('gallery-main-img');
  const thumbsWrap = document.getElementById('gallery-thumbs');

  if (mainImg && images.length > 0) {
    mainImg.src = images[0];
    mainImg.alt = p.title || '';
  }

  if (thumbsWrap && images.length > 1) {
    thumbsWrap.innerHTML = images.map((src, i) => `
      <div class="gallery-thumb ${i === 0 ? 'active' : ''}" data-src="${escHtml(src)}">
        <img src="${escHtml(src)}" alt="Фото ${i + 1}" loading="lazy"
             onerror="this.src='assets/images/sticker.webp'">
      </div>`).join('');

    thumbsWrap.querySelectorAll('.gallery-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        if (!mainImg) return;
        mainImg.style.opacity = '0';
        setTimeout(() => {
          mainImg.src = thumb.dataset.src;
          mainImg.style.opacity = '1';
        }, 180);
        thumbsWrap.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
  } else if (thumbsWrap) {
    thumbsWrap.style.display = 'none';
  }

  /* ---- Title ---- */
  const titleEl = document.getElementById('product-title');
  if (titleEl) titleEl.textContent = p.title || '';

  /* ---- Availability ---- */
  const availEl = document.getElementById('product-availability');
  if (availEl) {
    const inStock = p.availability === 'in_stock';
    availEl.textContent = inStock ? '✓ В наявності' : 'Немає в наявності';
    availEl.className   = 'badge ' + (inStock ? 'badge-green' : 'badge-grey');
  }

  /* ---- Price ---- */
  const priceEl = document.getElementById('product-price');
  if (priceEl) priceEl.textContent = formatPrice(p.price || '') || '—';

  /* ---- Meta ---- */
  const mpnEl = document.getElementById('product-mpn');
  const catEl = document.getElementById('product-cat');
  if (mpnEl) mpnEl.textContent = p.mpn || '—';
  if (catEl) catEl.textContent = (p.product_type || '').split('>').pop().trim() || '—';

  /* ---- Description ---- */
  const descEl = document.getElementById('product-desc');
  if (descEl) {
    const clean = stripHtml(p.description || '');
    descEl.textContent = clean || 'Опис відсутній.';
  }

  /* ---- Order button ---- */
  const orderBtn = document.getElementById('btn-order');
  if (orderBtn) orderBtn.href = tgOrderLink(p.title || '');

  /* ---- Show content ---- */
  document.getElementById('loading-state')?.classList.add('hidden');
  document.getElementById('product-content')?.classList.remove('hidden');
}

/* ---- State helpers ---- */
function showNotFound() {
  document.getElementById('loading-state')?.classList.add('hidden');
  document.getElementById('not-found-state')?.classList.remove('hidden');
}

function showError() {
  document.getElementById('loading-state')?.classList.add('hidden');
  document.getElementById('error-state')?.classList.remove('hidden');
}

/* ---- Start ---- */
init();
