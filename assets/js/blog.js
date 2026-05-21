/* blog.js — завантаження та рендер постів Telegram */

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len).trimEnd() + '…' : str;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function init() {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  showLoading(grid);

  try {
    const resp = await fetch('data/telegram_posts.json');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const posts = await resp.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      showEmpty(grid);
      return;
    }

    grid.innerHTML = posts.map(renderCard).join('');
  } catch (e) {
    showError(grid);
    console.error('Помилка завантаження telegram_posts.json:', e);
  }
}

function renderCard(post) {
  const dateStr = post.date
    ? new Date(post.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const imgHtml = post.photo
    ? `<div class="blog-card__img"><img src="${escHtml(post.photo)}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`
    : '';
  const shortText = truncate(post.text || '', 200);

  return `
  <div class="blog-card">
    ${imgHtml}
    <div class="blog-card__body">
      ${dateStr ? `<div class="blog-card__date">${escHtml(dateStr)}</div>` : ''}
      <div class="blog-card__text">${escHtml(shortText)}</div>
      <a href="${escHtml(post.url || 'https://t.me/avtonomka_od')}"
         target="_blank" rel="noopener noreferrer"
         class="blog-card__link">Читати далі →</a>
    </div>
  </div>`;
}

function showLoading(grid) {
  grid.innerHTML = `
    <div class="loading-state" style="grid-column:1/-1">
      <div class="spinner"></div>
      <span>Завантаження новин…</span>
    </div>`;
}

function showEmpty(grid) {
  grid.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1">
      <img src="assets/images/1111111.webp" alt="Хом'як" loading="lazy">
      <h3>Поки що новин немає</h3>
      <p>Слідкуйте за нашим Telegram-каналом, щоб не пропустити оновлення.</p>
      <a href="https://t.me/avtonomka_od" target="_blank" rel="noopener" class="btn btn-tg">
        Підписатись на канал
      </a>
    </div>`;
}

function showError(grid) {
  grid.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1">
      <img src="assets/images/sticker.webp" alt="" loading="lazy">
      <h3>Не вдалося завантажити новини</h3>
      <p>Спробуйте пізніше або перегляньте наш Telegram-канал.</p>
      <a href="https://t.me/avtonomka_od" target="_blank" rel="noopener" class="btn btn-tg">
        Telegram-канал
      </a>
    </div>`;
}

/* ---- Home page: 3 latest posts ---- */
async function initHomePreview() {
  const grid = document.getElementById('home-blog-grid');
  if (!grid) return;

  try {
    const resp  = await fetch('data/telegram_posts.json');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const posts = await resp.json();
    const latest = (Array.isArray(posts) ? posts : []).slice(0, 3);

    if (latest.length === 0) {
      grid.innerHTML = '<p class="text-muted">Новини незабаром з\'являться.</p>';
      return;
    }
    grid.innerHTML = latest.map(renderCard).join('');
  } catch {
    grid.innerHTML = '<p class="text-muted">Не вдалося завантажити новини.</p>';
  }
}

/* ---- Start ---- */
init();
initHomePreview();
