/* 校验词条库并生成 db/seed.sql
 * 用法：node scripts/build-seed.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dataUrl = pathToFileURL(resolve(root, 'data/terms.js')).href;

await import(dataUrl);
const TERMS = globalThis.TERMS;

const CATS = ['material', 'component', 'chemical', 'metric'];
const PER_DAY = 10;
const errors = [];

const seen = new Set();
for (const t of TERMS) {
  if (seen.has(t.id)) errors.push(`重复 id: ${t.id}`);
  seen.add(t.id);
  for (const f of ['id', 'cn', 'en', 'cat', 'lang', 'term', 'gloss', 'note']) {
    if (!t[f]) errors.push(`${t.id}: 字段 ${f} 为空`);
  }
  if (!CATS.includes(t.cat)) errors.push(`${t.id}: 未知分类 ${t.cat}`);
  if (!Array.isArray(t.props) || t.props.length === 0) errors.push(`${t.id}: 缺少性质`);
  if (!Array.isArray(t.tags) || t.tags.length === 0) errors.push(`${t.id}: 缺少标签`);
  if (t.cat === 'chemical' && !t.formula) errors.push(`${t.id}: 化学品必须带化学式`);
}

// 排课：类目轮流取词，每 10 词一天
const buckets = CATS.map(c => TERMS.filter(t => t.cat === c));
const order = [];
for (let i = 0; i < Math.max(...buckets.map(b => b.length)); i++) {
  for (const b of buckets) if (b[i]) order.push(b[i]);
}
const planned = order.map((t, i) => ({ ...t, seq: i, day: Math.floor(i / PER_DAY) + 1, slot: (i % PER_DAY) + 1 }));
const days = Math.ceil(planned.length / PER_DAY);

const q = s => `'${String(s).replace(/'/g, "''")}'`;
const json = v => q(JSON.stringify(v));

if (errors.length) {
  console.error('校验失败：\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}

const byCat = CATS.map(c => `${c} ${TERMS.filter(t => t.cat === c).length}`).join(' / ');
console.log(`词条 ${TERMS.length}（${byCat}）→ ${days} 天 × 每天最多 ${PER_DAY} 词`);

const rows = planned.map(t => `  (${q(t.id)}, ${q(t.cn)}, ${q(t.en)}, ${q(t.cat)}, ${q(t.formula)}, ${json(t.props)}, ${q(t.lang)}, ${q(t.term)}, ${q(t.gloss)}, ${q(t.note)}, ${json(t.tags)}, ${t.day}, ${t.slot}, ${t.seq})`).join(',\n');

const seed = `-- 生成文件，勿手改。源：data/terms.js（node scripts/build-seed.mjs）
BEGIN;

DELETE FROM review_log;
DELETE FROM term;

INSERT INTO term
  (id, cn, en, cat, formula, props, root_lang, root_term, root_gloss, root_note, tags, day, slot, seq)
VALUES
${rows};

COMMIT;
`;

writeFileSync(resolve(root, 'db/seed.sql'), seed, 'utf8');
console.log('已写出 db/seed.sql');
