/* 物料补莫氏硬度并按硬度升序重排 data/terms.js
 * 用法：node scripts/sort-mohs.js           预览
 *       node scripts/sort-mohs.js --apply   回写
 * 口径：区间取中值；粉体/混合料取主要物相硬度。332 条物料全部有数值。
 * 结构：root.TERMS = [...]; 之后两段 root.TERMS.push(...);
 */
const fs = require('fs');
const { FILE, items, marks, lines, NL } = require('./parse-terms.js');

const MIN = {
  talc: 1, gypsum: 2, graphite: 1.5, kaolin: 2.25, bentonite: 1.5, mica: 2.75,
  chlorite: 2.5, sepiolite: 2.25, palygorskite: 2.5, illite: 2.5, montmorillonite: 1.5,
  pyrophyllite: 2.75, calcite: 3, limestone: 3, marble: 3, travertine: 3, aragonite: 3.5,
  brucite: 2.75, magnesite: 4.25, dolomite: 3.75, barite: 3.25, fluorite: 4, apatite: 5,
  siderite: 4, goethite: 5.25, limonite: 4.5, magnetite: 6, hematite: 5.5,
  bauxite: 2, garnierite: 2.75, feldspar: 6.25, quartz: 7, diatomite: 4.75,
  beryl: 7.75, tourmaline: 7.25, elbaite: 7.25, garnet: 7.25, pyroxene: 6, diopside: 6,
  amphibole: 5.5, olivine: 6.75, serpentine: 3.5, nepheline: 6, sodalite: 5.75,
  cordierite: 7.25, andalusite: 7.25, kyanite: 6.5, sillimanite: 6.75, mullite: 6.5,
  corundum: 9, cassiterite: 6.5, wolframite: 5, scheelite: 4.75, molybdenite: 1.25,
  cinnabar: 2.5, pyrite: 6.25, marcasite: 6.25, arsenopyrite: 5.75, chalcopyrite: 3.75,
  chalcocite: 3, bornite: 3.25, malachite: 3.75, azurite: 3.75, galena: 2.75,
  sphalerite: 3.75, pentlandite: 3.75, chromite: 5.5, ilmenite: 5.75, rutile: 6.25,
  zircon: 7.5, monazite: 5.25, spodumene: 6.75, petalite: 6.5, lepidolite: 2.75,
  periclase: 5.75, 'fire-clay': 3,
  slate: 4, shale: 3, sandstone: 6, basalt: 6, granite: 6.5, andesite: 6, diabase: 6.5,
  tuff: 4, pumice: 6, perlite: 5.5, vermiculite: 2, scoria: 5.5,
  'manufactured-sand': 7, 'glass-sand': 7, 'silica-sand': 7, 'river-sand': 6.5,
  'expanded-clay': 4, 'red-mud': 4.5, phosphogypsum: 2.5
};
const IND = { cement: 4.5, clinker: 6.5, slag: 4.5, flyash: 5.5, alumina: 9, siliconcarbide: 9.25 };
const EXIST = {
  talc: 1, graphite: 1.5, bentonite: 1.5, bauxite: 2, gypsum: 2, kaolin: 2.25, mica: 2.75,
  calcite: 3, limestone: 3, barite: 3.25, dolomite: 3.75, fluorite: 4, diatomite: 4.75,
  apatite: 5, hematite: 5.5, magnetite: 6, feldspar: 6.25, clinker: 6.5, quartz: 7,
  alumina: 9, siliconcarbide: 9.25
};

function mohsOf(id) {
  if (EXIST[id] != null) return EXIST[id];
  if (IND[id] != null) return IND[id];
  const key = id.startsWith('expanded-material-')
    ? id.replace('expanded-material-', '').replace(/-(ore|concentrate|tailings|feedstock)$/, '')
    : id;
  const v = MIN[key] != null ? MIN[key] : MIN[id];
  if (v == null) throw new Error('缺硬度：' + id);
  return v;
}

const mats = items.filter(it => it.cat === 'material');
console.log('条目', items.length, '物料', mats.length);
for (const it of mats) {
  it.h = mohsOf(it.id);
  if (!/莫氏硬度/.test(it.text)) {
    it.text = it.text.replace(/\[\[(['"])/, `[['莫氏硬度', '${it.h}'], [$1`);
  }
  // 统一以 `)` 收尾，渲染时再补逗号
  it.text = it.text.replace(/[,\s]*\)$/, ')')
    .replace(/(\]\])\s+(?=['"\[])/, '$1, ');
}

void marks; void lines;

/* 段 0 = 原有 24 条物料所在数组；段 1、2 = 两段 push 扩充词条 */
const segOf = (it, bounds) => (it.from < bounds[0] ? 0 : it.from < bounds[1] ? 1 : 2);

function renderZone(segIdx, bounds, catComment) {
  const mine = items.filter(it => segOf(it, bounds) === segIdx && it.cat === 'material').sort((a, b) => a.h - b.h);
  const rest = items.filter(it => segOf(it, bounds) === segIdx && it.cat !== 'material');
  const body = [];
  let lastV = null;
  for (const it of mine) {
    if (it.h !== lastV) {
      const label = `莫氏硬度 ${it.h}`;
      body.push('    /* ── ' + label + ' ' + '─'.repeat(Math.max(4, 56 - label.length)) + ' */');
      lastV = it.h;
    }
    body.push('    ' + it.text + ',');
  }
  if (rest.length) {
    if (body.length) body.push('');
    if (catComment) body.push('    ' + catComment);
    for (const it of rest) body.push('    ' + it.text + ',');
  }
  return body.join(NL);
}

const catComments = (marks[0] === undefined ? lines : lines).filter(l => /\/\* ── (部件|化学品|物性)[^*]+\*\//.test(l));
const bounds = [marks[1], marks[2]];
const z0 = renderZone(0, bounds, catComments[0]);
const z1 = renderZone(1, bounds, catComments[1]);
const z2 = renderZone(2, bounds, catComments[2]);

const out = [
  '/* 粉碎词汇 · 词条库',
  ' * 唯一数据源：浏览器端 <script> 载入，构建脚本 node 端 dynamic import 复用。',
  ' * 字段：id / 中文 / 英文 / 分类 / 化学式(可空) / 性质对 / 词根语言 / 词根原形 / 词根释义 / 构词注 / 标签',
  ' * 分类：material 物料 · component 部件 · chemical 化学品 · metric 物性指标',
  ' * 物料按莫氏硬度升序排列（区间取中值），由 scripts/sort-mohs.js 生成。',
  ' */',
  '(function (root) {',
  '  const T = (id, cn, en, cat, formula, props, lang, term, gloss, note, tags) => ({',
  '    id, cn, en, cat, formula: formula || \'\', props, lang, term, gloss, note, tags',
  '  });',
  '',
  '  root.TERMS = [',
  z0,
  '  ];',
  '',
  '  root.TERMS.push(',
  z1,
  '  );',
  '',
  '  root.TERMS.push(',
  z2,
  '  );',
  '})(typeof window !== \'undefined\' ? window : globalThis);',
  ''
].join(NL);

if (process.argv.includes('--apply')) {
  fs.writeFileSync(FILE, out);
  console.log('已回写', out.length, '字节');
}
if (process.argv.includes('--list')) {
  console.log(mats.slice().sort((a, b) => a.h - b.h)
    .map((it, i) => `${String(i + 1).padStart(3)}  ${String(it.h).padStart(5)}  ${it.id}  ${it.cn}`).join(NL));
}
