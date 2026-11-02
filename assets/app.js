/* 粉碎词汇 · 学习台
 * 1000 词分四类，不设每日上限：进来自动接着上次的位置，想背多少背多少。
 * 范围胶囊只收窄视野，不限制使用；进度存 localStorage，纯前端，无请求。
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
  const STORE_KEY = 'comminution-vocab/v2';
  const LEGACY_KEY = 'comminution-vocab/v1';

  /* ── 词序：类目轮流取词，相邻两张必属不同类 ───────────────── */
  function interleave(terms) {
    const buckets = CATS.map(c => terms.filter(t => t.cat === c.key));
    const order = [];
    for (let i = 0; i < Math.max(...buckets.map(b => b.length)); i++) {
      for (const b of buckets) if (b[i]) order.push(b[i]);
    }
    return order.map((t, i) => Object.assign({}, t, { seq: i }));
  }

  const PLAN = interleave(window.TERMS || []);
  const TOTAL = PLAN.length;

  /* ── state ──────────────────────────────────────────────── */
  const read = key => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  };

  function load() {
    const raw = read(STORE_KEY) || (() => {
      const old = read(LEGACY_KEY);               // v1 的「已掌握」直接带过来
      return old ? { scope: 'all', mastered: old.mastered || {} } : {};
    })();
    const scope = raw.scope === 'all' || CAT_LABEL[raw.scope] ? raw.scope : 'all';
    return {
      scope,
      idx: Math.max(0, raw.idx | 0),
      mastered: raw.mastered && typeof raw.mastered === 'object' ? raw.mastered : {}
    };
  }

  const state = load();
  const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(state));

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const scoped = () => (state.scope === 'all' ? PLAN : PLAN.filter(t => t.cat === state.scope));
  const deck = () => scoped();
  const current = () => { const d = deck(); return d[Math.min(state.idx, d.length - 1)] || d[0]; };
  const masteredIn = list => list.filter(t => state.mastered[t.id]).length;

  /* ── scope ──────────────────────────────────────────────── */
  function renderScopes() {
    const chip = (key, label, n) => `<button class="pill" data-s="${key}"
      aria-pressed="${state.scope === key}">${label} ${n}</button>`;
    $('scopes').innerHTML =
      chip('all', '全部', TOTAL) +
      CATS.map(c => chip(c.key, c.label, PLAN.filter(t => t.cat === c.key).length)).join('');
  }

  function setScope(scope) {
    if (scope !== 'all' && !CAT_LABEL[scope]) return;
    state.scope = scope;
    state.idx = 0;
    save();
    renderScopes();
    renderCard(false);
    if (!$('viewIndex').hidden) renderRows();
  }

  /* ── card ───────────────────────────────────────────────── */
  function faceFront(t, pos, size) {
    const cat = CATS.find(c => c.key === t.cat);
    const long = t.cn.length >= 6 ? ' headword-cn--long' : '';
    return `
      <div class="face face--front">
        <div class="face-head">
          <span class="cat" data-cat="${t.cat}">${cat.label}</span>
          <span class="pos">${pos} <span class="muted">/ ${size}</span></span>
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
    const d = deck();
    $('card').innerHTML = faceFront(t, state.idx + 1, d.length) + faceBack(t);
    setFlip(keepFlip === true);

    $('progress').textContent = `已掌握 ${masteredIn(d)} / ${d.length}`;
    $('library').textContent = state.scope === 'all' ? '' : `全库 ${masteredIn(PLAN)} / ${TOTAL}`;

    const on = !!state.mastered[t.id];
    $('mark').dataset.on = String(on);
    $('mark').textContent = on ? '已掌握，撤销标记' : '标记已掌握';
    $('reset').textContent = state.scope === 'all' ? '清空进度' : `清空${CAT_LABEL[state.scope]}进度`;
  }

  function setFlip(on) {
    const card = $('card');
    const t = current();
    card.dataset.flipped = String(on);
    card.setAttribute('aria-pressed', String(on));
    card.setAttribute('aria-label', on
      ? `${t.cn}，英文 ${t.en}。按空格翻回中文`
      : `${t.cn}，${CAT_LABEL[t.cat]}。按空格翻面看英文与词根`);
  }

  const isFlipped = () => $('card').dataset.flipped === 'true';
  const toggleFlip = () => setFlip(!isFlipped());

  /* ── 换卡：到末尾直接回到开头，不拦人 ─────────────────────── */
  function go(idx) {
    const d = deck();
    state.idx = ((idx % d.length) + d.length) % d.length;
    save();
    renderCard(false);
  }

  function goToMasteredOrNext() {
    const d = deck();
    if (d.every(x => state.mastered[x.id])) return;             // 全组掌握，停在原地
    const after = d.findIndex((x, i) => i > state.idx && !state.mastered[x.id]);
    go(after === -1 ? d.findIndex(x => !state.mastered[x.id]) : after);
  }

  /* ── events ─────────────────────────────────────────────── */
  $('card').addEventListener('click', toggleFlip);
  $('card').addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleFlip(); }
  });
  $('prev').addEventListener('click', () => go(state.idx - 1));
  $('next').addEventListener('click', () => go(state.idx + 1));

  $('mark').addEventListener('click', () => {
    const t = current();
    const wasMastered = !!state.mastered[t.id];
    if (wasMastered) delete state.mastered[t.id];
    else state.mastered[t.id] = Date.now();
    save();
    renderCard(isFlipped());
    if (!wasMastered) goToMasteredOrNext();
    if (!$('viewIndex').hidden) renderRows();
  });

  $('reset').addEventListener('click', () => {
    deck().forEach(t => delete state.mastered[t.id]);
    save();
    renderCard(false);
    if (!$('viewIndex').hidden) renderRows();
  });

  $('scopes').addEventListener('click', e => {
    const b = e.target.closest('.pill');
    if (b) setScope(b.dataset.s);
  });

  document.addEventListener('keydown', e => {
    if (!$('viewIndex').hidden) return;
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(state.idx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(state.idx + 1); }
    if (e.key === 'm' || e.key === 'M') $('mark').click();
  });

  /* ── index view ─────────────────────────────────────────── */
  let query = '';

  // 词表搜索只认中文与英文两列：全库检索，不受范围胶囊收窄
  function matches(t) {
    if (!query) return true;
    return (t.cn + ' ' + t.en).toLowerCase().includes(query);
  }

  // 防抖：输入停顿 200ms 再重排，1000 行不必每敲一键重建
  // 注意：事件对象在派发结束后会失效，值必须先取出再交给定时器
  function debounce(fn, ms) {
    let timer;
    return function (e) {
      const val = e.target.value;
      clearTimeout(timer);
      timer = setTimeout(() => fn(val), ms);
    };
  }

  // 命中高亮：先切分原文，再逐段转义，避免正则注入
  function markKw(text, words) {
    if (!query || !words.some(w => String(w).toLowerCase().includes(query))) return esc(text);
    return String(text).split(query).map(part => esc(part)).join(`<mark>${esc(query)}</mark>`);
  }

  // 点击词表某行：切到背词视图并定位到该词
  function goToTerm(id) {
    const d = deck();
    const i = d.findIndex(t => t.id === id);
    if (i < 0) return;
    state.idx = i;
    save();
    setView('study');
    renderCard(false);
  }

  function renderRows() {
    const list = PLAN.filter(matches);
    const hit = !!query;
    $('empty').hidden = list.length > 0;
    $('count').hidden = !hit;
    $('count').textContent = hit ? `找到 ${list.length} 个词` : '';
    $('rows').innerHTML = list.map(t => `
      <li class="row" data-id="${t.id}" data-mastered="${!!state.mastered[t.id]}">
        <button class="row-btn">
          <span class="row-cn">${markKw(t.cn, [t.cn])}</span>
          <span class="row-en" lang="en">${markKw(t.en, [t.en])}</span>
          <span class="row-cat">${CAT_LABEL[t.cat]}</span>
        </button>
      </li>`).join('');
  }

  $('search').addEventListener('input', debounce(val => {
    query = val.trim().toLowerCase();
    renderRows();
  }, 200));

  $('rows').addEventListener('click', e => {
    const btn = e.target.closest('.row-btn');
    if (!btn) return;
    goToTerm(btn.parentElement.dataset.id);
  });

  /* ── view switch ────────────────────────────────────────── */
  function setView(which) {
    const study = which === 'study';
    $('viewStudy').hidden = !study;
    $('viewIndex').hidden = study;
    $('tabStudy').setAttribute('aria-selected', String(study));
    $('tabIndex').setAttribute('aria-selected', String(!study));
    if (!study) renderRows();
  }
  $('tabStudy').addEventListener('click', () => setView('study'));
  $('tabIndex').addEventListener('click', () => setView('index'));

  /* ── boot ───────────────────────────────────────────────── */
  renderScopes();
  renderCard(false);
})();
