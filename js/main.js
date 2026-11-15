/* ==========================================================================
   THE PALAK EFFECT : main logic.
   You should not need to edit this file. Compliments, categories and the
   birthday messages live in js/compliments.js.
   ========================================================================== */
(() => {
  'use strict';

  const SETTINGS = window.PALAK_SETTINGS || {};
  const RAW = Array.isArray(window.COMPLIMENT_CATEGORIES) ? window.COMPLIMENT_CATEGORIES : [];
  const KEY_STATE = 'palakEffect.state.v1';
  const KEY_THEME = 'palakEffect.theme';

  const $ = (sel, root = document) => root.querySelector(sel);
  const root = document.documentElement;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- storage (fails quietly if unavailable) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  /* ======================================================================
     1. COLLECTION  (read from compliments.js, tolerant of mistakes)
     ====================================================================== */
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function buildCollection() {
    const byName = new Map();   // category name -> { name, items }
    const byId = new Map();
    const used = new Set();

    RAW.forEach((cat) => {
      if (!cat || typeof cat !== 'object') return;
      const name = String(cat.name == null ? 'UNSORTED' : cat.name).trim() || 'UNSORTED';
      const list = Array.isArray(cat.compliments) ? cat.compliments : [];
      list.forEach((entry) => {
        let text = '';
        let id = '';
        if (typeof entry === 'string') text = entry;
        else if (entry && typeof entry === 'object') { text = entry.text; id = entry.id; }
        text = text == null ? '' : String(text).trim();
        if (!text) return;                       // blank lines are ignored

        let uid = id ? String(id) : 'c-' + hash(text);
        let n = 2;
        while (used.has(uid)) uid = (id ? String(id) : 'c-' + hash(text)) + '-' + n++;
        used.add(uid);

        const item = { id: uid, text, category: name };
        byId.set(uid, item);
        if (!byName.has(name)) byName.set(name, { name, items: [] });
        byName.get(name).items.push(item);
      });
    });

    return { cats: [...byName.values()], byId, all: [...byId.keys()] };
  }

  const DATA = buildCollection();

  /* ======================================================================
     2. STATE  (current compliment, no-repeat deck, discovered set, filter)
     ====================================================================== */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const uniq = (arr) => [...new Set(arr)];

  function loadState() {
    let s = {};
    try { s = JSON.parse(store.get(KEY_STATE)) || {}; } catch (e) { s = {}; }
    const valid = new Set(DATA.all);
    const clean = (a) => uniq((Array.isArray(a) ? a : []).filter((id) => valid.has(id)));

    const st = {
      seen: clean(s.seen),
      shown: clean(s.shown),
      remaining: clean(s.remaining),
      current: valid.has(s.current) ? s.current : null,
      filter: typeof s.filter === 'string' ? s.filter : 'all',
    };
    st.remaining = st.remaining.filter((id) => !st.shown.includes(id));

    // compliments added since last visit join the deck at random positions
    const known = new Set([...st.remaining, ...st.shown]);
    DATA.all.filter((id) => !known.has(id)).forEach((id) => {
      st.remaining.splice(Math.floor(Math.random() * (st.remaining.length + 1)), 0, id);
    });

    if (st.filter !== 'all' && !DATA.cats.some((c) => c.name === st.filter)) st.filter = 'all';
    return st;
  }

  const state = loadState();
  const saveState = () => store.set(KEY_STATE, JSON.stringify(state));

  const poolFor = (filter) => (filter === 'all'
    ? DATA.all
    : (DATA.cats.find((c) => c.name === filter) || { items: [] }).items.map((i) => i.id));

  /* Draw the next compliment. Never repeats until the whole pool has been
     shown; then reshuffles and starts a new cycle. */
  function draw() {
    if (!DATA.all.length) return null;
    let pool = poolFor(state.filter);
    if (!pool.length) { state.filter = 'all'; pool = DATA.all; }
    const poolSet = new Set(pool);

    let idx = state.remaining.findIndex((id) => poolSet.has(id));
    if (idx === -1) {                                  // pool exhausted -> new cycle
      if (state.filter === 'all') {
        state.remaining = shuffle(DATA.all.slice());
        state.shown = [];
      } else {
        state.shown = state.shown.filter((id) => !poolSet.has(id));
        state.remaining = shuffle(pool.slice()).concat(state.remaining);
      }
      if (pool.length > 1 && state.remaining[0] === state.current) {
        [state.remaining[0], state.remaining[1]] = [state.remaining[1], state.remaining[0]];
      }
      idx = state.remaining.findIndex((id) => poolSet.has(id));
    }

    const id = state.remaining.splice(idx, 1)[0];
    state.shown.push(id);
    if (!state.seen.includes(id)) state.seen.push(id);
    state.current = id;
    saveState();
    return DATA.byId.get(id);
  }

  /* ======================================================================
     3. RENDERING THE GENERATOR
     ====================================================================== */
  const el = {
    display: $('#display'),
    text: $('#complimentText'),
    cat: $('#catLabel'),
    btn: $('#genBtn'),
    ctNum: $('#ctNum'),
    ctOf: $('#ctOf'),
    ctDigits: $('#ctDigits'),
    ctSr: $('#ctSr'),
    live: $('#srLive'),
    allFound: $('#allFound'),
    chips: $('#filterChips'),
    chipToggle: $('#filterToggle'),
  };

  let typingTimer = null;
  let currentText = '';

  function stopTyping() {
    if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
    el.text.classList.remove('typing');
    if (currentText) el.text.textContent = currentText;
  }

  function typeText(text) {
    el.text.textContent = '';
    const typed = document.createElement('span');
    typed.className = 'typed';
    const ghost = document.createElement('span');
    ghost.className = 'ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.textContent = text;
    el.text.append(typed, ghost);
    el.text.classList.add('typing');

    const chars = [...text];
    const step = Math.max(9, Math.min(26, 1500 / chars.length));
    let i = 0;
    typingTimer = setInterval(() => {
      i += 1;
      typed.textContent = chars.slice(0, i).join('');
      ghost.textContent = chars.slice(i).join('');
      if (i >= chars.length) stopTyping();
    }, step);
  }

  function isDark() { return root.getAttribute('data-theme') === 'dark'; }

  function showText(text, animate) {
    stopTyping();
    currentText = text;
    el.text.classList.remove('reveal');
    if (animate && !reduced()) {
      if (isDark()) typeText(text);
      else { el.text.textContent = text; void el.text.offsetWidth; el.text.classList.add('reveal'); }
    } else {
      el.text.textContent = text;
    }
  }

  function react() {
    el.display.classList.remove('react');
    void el.display.offsetWidth;
    el.display.classList.add('react');
  }

  function renderCounter() {
    const n = state.seen.length;
    const total = DATA.all.length;
    el.ctNum.textContent = String(n);
    el.ctOf.textContent = 'of ' + total + ' found';
    const width = Math.max(2, String(total).length);
    el.ctDigits.innerHTML = '';
    String(n).padStart(width, '0').split('').forEach((d) => {
      const i = document.createElement('i');
      i.textContent = d;
      el.ctDigits.appendChild(i);
    });
    $('#ctOfDark').textContent = 'of ' + total + ' found';
    el.ctSr.textContent = n + ' of ' + total + ' compliments discovered';
    el.allFound.hidden = !(total > 0 && n >= total);
  }

  function renderEmpty() {
    stopTyping();
    currentText = '';
    el.text.textContent = 'The machine is empty. Add compliments in js/compliments.js and refresh.';
    el.cat.textContent = '';
    el.btn.disabled = true;
    el.chipToggle.hidden = true;
    renderCounter();
  }

  function renderCompliment(item, animate) {
    el.cat.textContent = item.category;
    showText(item.text, animate);
    el.live.textContent = item.category + '. ' + item.text;
    renderCounter();
  }

  function generate(animate = true) {
    const item = draw();
    if (!item) { renderEmpty(); return; }
    renderCompliment(item, animate);
    renderChips();
    if (animate) {
      react();
      if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* ignore */ } }
    }
  }

  /* optional category filter */
  function renderChips() {
    el.chips.innerHTML = '';
    if (DATA.cats.length < 2) { el.chipToggle.hidden = true; el.chips.hidden = true; return; }
    el.chipToggle.hidden = false;
    const make = (label, value) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = label;
      b.setAttribute('aria-pressed', String(state.filter === value));
      b.addEventListener('click', () => { state.filter = value; saveState(); renderChips(); });
      el.chips.appendChild(b);
    };
    make('everything', 'all');
    DATA.cats.forEach((c) => make(c.name.toLowerCase(), c.name));
  }

  el.chipToggle.addEventListener('click', () => {
    const open = el.chips.hidden;
    el.chips.hidden = !open;
    el.chipToggle.setAttribute('aria-expanded', String(open));
  });
  el.btn.addEventListener('click', () => generate(true));

  /* ======================================================================
     4. THEME  (shared state, so nothing resets when it changes)
     ====================================================================== */
  const toggle = $('#themeToggle');
  const metaTheme = $('meta[name="theme-color"]');
  let switching = false;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    store.set(KEY_THEME, theme);
    toggle.setAttribute('aria-checked', String(theme === 'dark'));
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Dark theme on. Switch to light' : 'Light theme on. Switch to dark');
    if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#15100D' : '#F5F0E7');
    stopTyping();               // finish any typewriter instantly, keep the same text
    renderCountdown();
  }

  toggle.addEventListener('click', () => {
    if (switching) return;
    const next = isDark() ? 'light' : 'dark';
    if (reduced()) { applyTheme(next); return; }
    switching = true;
    root.classList.add('theme-dip');
    setTimeout(() => {
      applyTheme(next);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        root.classList.remove('theme-dip');
        switching = false;
      }));
    }, 210);
  });

  /* ======================================================================
     5. COUNTDOWN + BIRTHDAY MODE  (always Asia/Kolkata, never local time)
     ====================================================================== */
  const B = Object.assign({ month: 11, day: 20, timezone: 'Asia/Kolkata' }, SETTINGS.birthday || {});
  const params = new URLSearchParams(location.search);

  // Testing helpers (see README):  ?preview=birthday   or   ?now=2026-11-19T23:59:50+05:30
  const loadedAt = Date.now();
  const fakeBase = params.get('now') ? Date.parse(params.get('now').replace(' ', '+')) : NaN;  // a raw + in a URL arrives as a space
  function nowMs() {
    if (params.get('preview') === 'birthday') return instantOf(new Date().getUTCFullYear(), B.month, B.day) + 6 * 3600e3;
    return Number.isNaN(fakeBase) ? Date.now() : fakeBase + (Date.now() - loadedAt);
  }

  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: B.timezone, hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
  });
  function zoned(ms) {
    const o = {};
    fmt.formatToParts(new Date(ms)).forEach((p) => { if (p.type !== 'literal') o[p.type] = parseInt(p.value, 10); });
    return o;
  }
  function offsetMs(ms) {
    const p = zoned(ms);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
  }
  function instantOf(year, month, day) {        // midnight of that date in the birthday timezone
    const guess = Date.UTC(year, month - 1, day);
    return guess - offsetMs(guess);
  }

  function birthdayInfo() {
    const ms = nowMs();
    const p = zoned(ms);
    if (p.month === B.month && p.day === B.day) return { isBirthday: true };
    const beforeThisYear = p.month < B.month || (p.month === B.month && p.day < B.day);
    const year = beforeThisYear ? p.year : p.year + 1;
    return { isBirthday: false, left: instantOf(year, B.month, B.day) - ms };
  }

  const pad = (n) => String(n).padStart(2, '0');
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const cdEl = $('#countdown');

  function renderCountdown() {
    const info = birthdayInfo();
    root.setAttribute('data-birthday', info.isBirthday ? 'true' : 'false');
    if (info.isBirthday) {
      cdEl.textContent = isDark() ? 'tonight. today. now.' : "it's today!";
      return;
    }
    const s = Math.max(0, Math.floor(info.left / 1000));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (isDark()) {
      cdEl.textContent = 'T-' + (d ? d + 'd ' : '') + pad(h) + 'h ' + pad(m) + 'm ' + pad(sec) + 's';
    } else if (d > 0) {
      cdEl.textContent = plural(d, 'day') + ', ' + plural(h, 'hr') + ', ' + m + ' min until the main event';
    } else {
      cdEl.textContent = plural(h, 'hr') + ', ' + m + ' min, ' + sec + ' sec to go';
    }
  }

  // birthday text
  $('#introGreeting').textContent = SETTINGS.birthdayGreeting || '';
  $('#bdayMessage').textContent = SETTINGS.birthdayMessage || '';
  $('#surpriseText').textContent = SETTINGS.birthdaySurprise || '';

  /* birthday-only surprise */
  const surprise = $('#surprise');
  const giftBtn = $('#giftBtn');
  function openSurprise() {
    surprise.hidden = false;
    $('#surpriseClose').focus();
    confetti();
  }
  function closeSurprise() { surprise.hidden = true; giftBtn.focus(); }
  giftBtn.addEventListener('click', openSurprise);
  $('#surpriseClose').addEventListener('click', closeSurprise);
  surprise.addEventListener('click', (e) => { if (e.target === surprise) closeSurprise(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !surprise.hidden) closeSurprise(); });

  function confetti() {
    if (reduced()) return;
    const box = $('#confetti');
    const colours = isDark()
      ? ['#C4A76D', '#C77B4D', '#F0E7D3', '#5E2431', '#7E7F62']
      : ['#B86F52', '#C77B4D', '#85866B', '#B69A68', '#302A24'];
    for (let i = 0; i < 46; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colours[i % colours.length];
      p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      p.style.animationDelay = (Math.random() * .5) + 's';
      p.style.borderRadius = Math.random() > .6 ? '50%' : '1px';
      box.appendChild(p);
      setTimeout(() => p.remove(), 4600);
    }
  }

  /* ======================================================================
     6. NAVIGATION  (#generator = page two, anything else = page one)
     ====================================================================== */
  const pages = { intro: $('#page-intro'), generator: $('#page-gen') };
  let currentPage = null;
  let started = false;

  function enter(name) {
    const page = pages[name];
    page.hidden = false;
    page.classList.remove('leaving');
    page.classList.add('entering');
    setTimeout(() => page.classList.remove('entering'), 600);
    document.body.setAttribute('data-page', name);
    window.scrollTo(0, 0);
    page.focus({ preventScroll: true });

    if (name === 'generator' && !started) {
      started = true;
      if (!DATA.all.length) renderEmpty();
      else if (state.current && DATA.byId.has(state.current)) renderCompliment(DATA.byId.get(state.current), false);
      else generate(true);
      renderChips();
      renderCounter();
    }
  }

  function show(name) {
    if (name === currentPage) return;
    const leaving = currentPage && pages[currentPage];
    currentPage = name;
    if (leaving && !reduced()) {
      leaving.classList.add('leaving');
      setTimeout(() => { leaving.hidden = true; leaving.classList.remove('leaving'); if (currentPage === name) enter(name); }, 180);
    } else {
      if (leaving) leaving.hidden = true;
      enter(name);
    }
  }

  function route() { show(location.hash === '#generator' ? 'generator' : 'intro'); }
  window.addEventListener('hashchange', route);
  $('#startBtn').addEventListener('click', () => { location.hash = 'generator'; });
  $('#backLink').addEventListener('click', (e) => { e.preventDefault(); location.hash = ''; history.replaceState(null, '', location.pathname + location.search); route(); });

  /* ======================================================================
     7. SMALL THINGS
     ====================================================================== */
  // Hide the Shinchan stickers cleanly if the image file hasn't been added yet.
  document.querySelectorAll('img.shinchan').forEach((img) => {
    const hide = () => { img.hidden = true; };
    img.addEventListener('error', hide);
    if (img.complete && img.naturalWidth === 0) hide();
  });

  /* ======================================================================
     START
     ====================================================================== */
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  renderCounter();
  renderChips();
  route();
  setInterval(renderCountdown, 1000);
})();
