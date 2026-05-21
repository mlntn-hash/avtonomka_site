/* main.js — загальна логіка */

/* ---- Active nav link ---- */
(function () {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(link => {
    const href = link.getAttribute('href').split('/').pop();
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

/* ---- Mobile burger ---- */
(function () {
  const burger = document.querySelector('.burger');
  const nav    = document.querySelector('.main-nav');
  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });

  document.addEventListener('click', e => {
    if (!burger.contains(e.target) && !nav.contains(e.target)) {
      burger.classList.remove('open');
      nav.classList.remove('open');
    }
  });
})();

/* ---- Format price "11505 UAH" → "11 505 UAH" ---- */
function formatPrice(raw) {
  if (!raw) return '';
  const m = raw.match(/([\d.]+)\s*(.*)/);
  if (!m) return raw;
  const num = parseFloat(m[1]);
  const currency = m[2] || '';
  return num.toLocaleString('uk-UA', { maximumFractionDigits: 0 }) + ' ' + currency;
}

/* ---- Strip HTML tags ---- */
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/* ---- Truncate string ---- */
function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len).trimEnd() + '…' : str;
}

/* ---- Build Telegram order link ---- */
function tgOrderLink(title) {
  const text = encodeURIComponent('Хочу замовити: ' + title);
  return 'https://t.me/avtonomka_od?text=' + text;
}

/* ---- Expose helpers globally ---- */
window.AvtonomkaUtils = { formatPrice, stripHtml, truncate, tgOrderLink };
