/* 粉碎词汇 · 学习台
 * 计划：四类词条轮转交错，每 10 词为一天，共 7 天。
 * 进度存 localStorage，纯前端，无请求。
 */
(function () {
  'use strict';

  const CATS = [
    { key: 'material', label: '物料', prompt: '说出英文名与主要成分' },
    { key: 'component', label: '部件', prompt: '说出英文名与它在机器里的位置' },
    { key: 'chemical', label: '化学品', prompt: '说出英文名与化学式' },
    { key: 'metric', label: '物性', prompt: '说出英文名与它的工程用途' }
  ];
  const CAT_LABEL = Object.fromEntries(CATS.map(c => [c.key, c.label]));
  const PER_DAY = 10;
  const STORE_KEY = 'comminution-vocab/v1';

  /* ── 排课：类目轮流取词，保证每天都是混合词表 ───────────── */
  function buildPlan(terms) {
    const buckets = CATS.map(c => terms.filter(t => t.cat === c.key));
    const order = [];
    for (let i = 0; i < Math.max(...buckets.map(b => b.length)); i++) {
      for (const b of buckets) if (b[i]) order.push(b[i]);
    }
    return order.map((t, i) => Object.assign({}, t, {
      seq: i,
      day: Math.floor(i / PER_DAY) + 1,
      slot: (i % PER_DAY) + 1
    }));
  }

  const PLAN = buildPlan(window.TERMS || []);
  const DAYS = Math.ceil(PLAN.length / PER_DAY);

  /* ── state ──────────────────────────────────────────────── */
  const load = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return { day: raw.day || 1, idx: raw.idx || 0, mastered: raw.mastered || {} };
    } catch (e) {
      return { day: 1, idx: 0, mastered: {} };
    }
  };
  const state = load();
  const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(state));

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const dayTerms = d => PLAN.filter(t => t.day === d);
  const currentDeck = () => dayTerms(state.day);
  const current = () => currentDeck()[state.idx] || currentDeck()[0];

  /* ── rail / strip ───────────────────────────────────────── */
  function renderRail() {
    $('rail').innerHTML = Array.from({ length: DAYS }, (_, i) => {
      const d = i + 1;
      const deck = dayTerms(d);
      const done = deck.length > 0 && deck.every(t => state.mastered[t.id]);
      return `<button class="day" data-day="${d}" aria-current="${d === state.day}"
        data-done="${done}" title="第 ${d} 天 · ${deck.length} 词">${d}</button>`;
    }).join('');
  }

  function renderStrip() {
    const deck = currentDeck();
    $('strip').innerHTML = deck.map((t, i) => {
      const st = state.mastered[t.id] ? 'mastered' : (i === state.idx ? 'current' : 'new');
      return `<button class="ap" data-i="${i}" data-state="${st}"
        title="${esc(t.cn)}" aria-label="第 ${i + 1} 个：${esc(t.cn)}">${i + 1}</button>`;
    }).join('');
  }

  /* ── card ───────────────────────────────────────────────── */
  function faceFront(t) {
    const cat = CATS.find(c => c.key === t.cat);
    const long = t.cn.length >= 6 ? ' headword-cn--long' : '';
    return `
      <div class="face face--front">
        <div class="face-head">
          <span class="cat" data-cat="${t.cat}">${cat.label}</span>
          <span>第 ${t.slot} / ${PER_DAY}</span>
        </div>
        <div class="front-mid">
          <h1 class="headword-cn${long}">${esc(t.cn)}</h1>
          <p class="front-note">${cat.prompt}，看完再翻面。</p>
        </div>
        <div class="front-foot">
          <span>轻触卡片或按空格翻面</span>
          <span>${state.mastered[t.id] ? '已掌握' : '未掌握'}</span>
        </div>
      </div>`;
  }

  function faceBack(t) {
    const facts = [];
    if (t.formula) {
      facts.push(`<div class="fact"><dt>化学式</dt><dd><span class="formula">${esc(t.formula)}</span></dd></div>`);
    }
    facts.push(`<div class="fact"><dt>词根</dt><dd>
        <div class="root-line">
          <span class="chip">${esc(t.lang)}</span>
          <span class="root-term">${esc(t.term)}</span>
          <span class="root-gloss">${esc(t.gloss)}</span>
        </div>
        <p class="muted" style="margin:8px 0 0">${esc(t.note)}</p>
      </dd></div>`);
    t.props.forEach(([k, v]) => {
      facts.push(`<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`);
    });
    facts.push(`<div class="fact"><dt>标签</dt><dd class="tags">${t.tags.map(esc).join(' / ')}</dd></div>`);

    return `
      <div class="face face--back">
        <div class="face-head">
          <span class="cat" data-cat="${t.cat}">${CAT_LABEL[t.cat]}</span>
          <span>${state.mastered[t.id] ? '已掌握' : '未掌握'}</span>
        </div>
        <div class="back-body">
          <h1 class="headword-en" lang="en">${esc(t.en)}</h1>
          <div class="facts">${facts.join('')}</div>
        </div>
      </div>`;
  }

  function renderCard(keepFlip) {
    const t = current();
    const card = $('card');
    card.innerHTML = faceFront(t) + faceBack(t);
    setFlip(keepFlip === true);
    $('progress').textContent = `今日已掌握 ${currentDeck().filter(x => state.mastered[x.id]).length} / ${currentDeck().length}`;
    $('mark').dataset.on = String(!!state.mastered[t.id]);
    $('mark').textContent = state.mastered[t.id] ? '已掌握，撤销标记' : '标记已掌握';
  }

  function setFlip(on) {
    const card = $('card');
    card.dataset.flipped = String(on);
    card.setAttribute('aria-pressed', String(on));
    card.setAttribute('aria-label', on
      ? `${current().cn}，英文 ${current().en}`
      : `${current().cn}，${CAT_LABEL[current().cat]}。按空格翻面看英文与词根`);
  }

  const isFlipped = () => $('card').dataset.flipped === 'true';
  const toggleFlip = () => setFlip(!isFlipped());

  function go(idx, keepFlip) {
    const deck = currentDeck();
    state.idx = (idx + deck.length) % deck.length;
    save();
    renderStrip();
    renderCard(keepFlip);
  }

  function goDay(d) {
    state.day = Math.min(Math.max(d, 1), DAYS);
    state.idx = 0;
    save();
    renderRail();
    renderStrip();
    renderCard(false);
  }

  /* ── events ─────────────────────────────────────────────── */
  $('card').addEventListener('click', toggleFlip);
  $('card').addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleFlip(); }
  });
  $('flip').addEventListener('click', toggleFlip);
  $('prev').addEventListener('click', () => go(state.idx - 1, false));
  $('next').addEventListener('click', () => go(state.idx + 1, false));

  $('mark').addEventListener('click', () => {
    const t = current();
    if (state.mastered[t.id]) delete state.mastered[t.id];
    else state.mastered[t.id] = Date.now();
    save();
    renderRail();
    renderStrip();
    renderCard(isFlipped());
    if (!state.mastered[t.id]) return;
    const deck = currentDeck();
    if (deck.every(x => state.mastered[x.id])) return;
    const nextIdx = deck.findIndex((x, i) => i > state.idx && !state.mastered[x.id]);
    go(nextIdx === -1 ? deck.findIndex(x => !state.mastered[x.id]) : nextIdx, false);
  });

  $('reset').addEventListener('click', () => {
    currentDeck().forEach(t => delete state.mastered[t.id]);
    save();
    renderRail();
    renderStrip();
    renderCard(false);
  });

  $('rail').addEventListener('click', e => {
    const b = e.target.closest('.day');
    if (b) goDay(Number(b.dataset.day));
  });

  $('strip').addEventListener('click', e => {
    const b = e.target.closest('.ap');
    if (b) go(Number(b.dataset.i), false);
  });

  document.addEventListener('keydown', e => {
    if ($('viewIndex').hidden === false) return;
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(state.idx - 1, false); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(state.idx + 1, false); }
    if (e.key === 'm' || e.key === 'M') $('mark').click();
  });

  /* ── index view ─────────────────────────────────────────── */
  let filter = 'all';
  let query = '';

  function renderFilters() {
    const counts = CATS.map(c => ({ ...c, n: PLAN.filter(t => t.cat === c.key).length }));
    const all = `<button class="pill" data-f="all" aria-pressed="${filter === 'all'}">全部 ${PLAN.length}</button>`;
    $('filters').innerHTML = all + counts.map(c =>
      `<button class="pill" data-f="${c.key}" aria-pressed="${filter === c.key}">${c.label} ${c.n}</button>`
    ).join('');
  }

  function matches(t) {
    if (filter !== 'all' && t.cat !== filter) return false;
    if (!query) return true;
    const hay = [t.cn, t.en, t.term, t.gloss, t.note, t.formula, t.tags.join(' ')].join(' ').toLowerCase();
    return hay.includes(query);
  }

  function renderRows() {
    const list = PLAN.filter(matches);
    $('empty').hidden = list.length > 0;
    $('rows').innerHTML = list.map(t => `
      <li class="row" data-id="${t.id}">
        <button class="row-btn" aria-expanded="false">
          <span class="row-cn">${esc(t.cn)}</span>
          <span class="row-en" lang="en">${esc(t.en)}</span>
          <span class="row-cat">第 ${t.day} 天</span>
        </button>
        <div class="row-body">
          <div class="facts">
            ${t.formula ? `<div class="fact"><dt>化学式</dt><dd><span class="formula">${esc(t.formula)}</span></dd></div>` : ''}
            <div class="fact"><dt>词根</dt><dd>
              <div class="root-line"><span class="chip">${esc(t.lang)}</span>
              <span class="root-term">${esc(t.term)}</span>
              <span class="root-gloss">${esc(t.gloss)}</span></div>
              <p class="muted" style="margin:8px 0 0">${esc(t.note)}</p>
            </dd></div>
            ${t.props.map(([k, v]) => `<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
            <div class="fact"><dt>标签</dt><dd class="tags">${t.tags.map(esc).join(' / ')}</dd></div>
          </div>
        </div>
      </li>`).join('');
  }

  $('filters').addEventListener('click', e => {
    const b = e.target.closest('.pill');
    if (!b) return;
    filter = b.dataset.f;
    renderFilters();
    renderRows();
  });

  $('search').addEventListener('input', e => {
    query = e.target.value.trim().toLowerCase();
    renderRows();
  });

  $('rows').addEventListener('click', e => {
    const btn = e.target.closest('.row-btn');
    if (!btn) return;
    const row = btn.parentElement;
    const open = row.dataset.open === 'true';
    row.dataset.open = String(!open);
    btn.setAttribute('aria-expanded', String(!open));
  });

  /* ── view switch ────────────────────────────────────────── */
  function setView(which) {
    const study = which === 'study';
    $('viewStudy').hidden = !study;
    $('viewIndex').hidden = study;
    $('tabStudy').setAttribute('aria-selected', String(study));
    $('tabIndex').setAttribute('aria-selected', String(!study));
    if (!study) { renderFilters(); renderRows(); }
  }
  $('tabStudy').addEventListener('click', () => setView('study'));
  $('tabIndex').addEventListener('click', () => setView('index'));

  /* ── boot ───────────────────────────────────────────────── */
  renderRail();
  renderStrip();
  renderCard(false);
})();
