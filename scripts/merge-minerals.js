/* 扩充段整合：77 个矿物 × 4 形态 → 每个矿物 1 条精编条目
 * 用法：node scripts/merge-minerals.js           预览
 *       node scripts/merge-minerals.js --apply   回写 data/terms.js
 * 规则：保留 expa-material-<base>-ore，删去 -concentrate/-tailings/-feedstock；
 *       id 改为 <base>，中文改为纯矿物名，props 按原 24 条规格（硬度/密度/解理/工程特性）重写。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'terms.js');
const src = fs.readFileSync(FILE, 'utf8');
const NL = String.fromCharCode(10);
const lines = src.split(NL);

const D = {
  ...require('./data/mineral-head.js'),
  ...require('./data/mineral-b.js'),
  ...require('./data/mineral-c.js')
};
delete D.montmorillonite2;

/* 数据自检：缺字段或数量不对就不要往下写文件 */
{
  const need = ['cn', 'en', 'lang', 'term', 'gloss', 'note', 'density', 'cleavage', 'tag', 'feature']; // formula 对岩石类为空，不算缺
  const bad = Object.entries(D).filter(([, d]) => need.some(k => !d[k]));
  if (bad.length) throw new Error('矿物数据缺字段：' + bad.map(([k]) => k).join(', '));
  if (Object.keys(D).length !== 77) throw new Error('矿物条数应为 77，实际 ' + Object.keys(D).length);
}

const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const arr = a => '[' + a.map(x => q(x)).join(', ') + ']';

/* 生成一条 T(...) */
function makeItem(base, h) {
  const d = D[base];
  if (!d) throw new Error('缺数据：' + base);
  const props = [
    ['莫氏硬度', String(h)],
    ['密度', d.density],
    ['解理', d.cleavage],
    ['工程特性', d.feature]
  ];
  const propsStr = '[' + props.map(([k, v]) => `[${q(k)}, ${q(v)}]`).join(', ') + ']';
  return `T(${q(base)}, ${q(d.cn)}, ${q(d.en)}, 'material', ${q(d.formula)}, ${propsStr}, ` +
    `${q(d.lang)}, ${q(d.term)}, ${q(d.gloss)}, ${q(d.note)}, ${arr(['物料', d.tag, '矿物'])}),`;
}

/* 找每条物料当前的硬度，供精编条目沿用 */
const hardOf = id => {
  const line = lines.find(l => l.includes(`"${id}"`));
  if (!line) return null;
  const m = line.match(/\[\['莫氏硬度', '([^']+)'\]/);
  return m ? m[1] : null;
};

const bases = [...new Set(lines
  .filter(l => /"expanded-material-[a-z-]+-(ore|concentrate|tailings|feedstock)"/.test(l))
  .map(l => l.match(/"expanded-material-([a-z-]+)-(ore|concentrate|tailings|feedstock)"/)[1]))];

const out = [];
let dropped = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(/^(\s*)T\("expanded-material-([a-z-]+)-(ore|concentrate|tailings|feedstock)"/);
  if (!m) { out.push(line); continue; }
  if (m[3] !== 'ore') { dropped++; continue; }              // 精矿/尾矿/原料直接删
  const base = m[2];
  const oldH = hardOf(`expanded-material-${base}-ore`);
  const h = hardOf(base) || oldH;
  out.push(m[1] + makeItem(base, h));
}

/* 删掉因合并产生的连续空行与孤立分类注释 */
const cleaned0 = out.map(l => (/^\s*\/\* ── (部件|化学品|物性)/.test(l) ? '    ' + l.trim() : l));
const cleaned = [];
for (let i = 0; i < cleaned0.length; i++) {
  const cur = cleaned0[i];
  const prev = cleaned[cleaned.length - 1];
  if (/^\s*$/.test(cur) && prev !== undefined && /^\s*$/.test(prev)) continue;
  cleaned.push(cur);
}

const result = cleaned.join(NL);
if (process.argv.includes('--apply')) {
  fs.writeFileSync(FILE, result);
  console.log('已回写，删除', dropped, '条，生成', bases.length, '条矿物条目');
} else {
  console.log('将删除', dropped, '条，生成', bases.length, '条矿物条目');
}
