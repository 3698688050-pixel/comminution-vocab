/* 部件 / 物性去重合并
 * 用法：node scripts/merge-comp-metric.js            预览
 *       node scripts/merge-comp-metric.js --apply    回写 data/terms.js
 *
 * 部件：58 个零件基底 × 4 个修饰语（可更换/耐磨/陶瓷衬里/液压调节）→ 每个零件 1 条，
 *       修饰语收进「常见做法」属性。删掉与粉碎设备无关的 偏心轴/曲轴/飞轮/平衡轮。
 * 物性：60 个指标基底 × 4 个测量位置 → 每个指标 1 条，位置另立 4 条独立词条。
 *       同义词合并（解离程度→解离度、滞留时间→停留时间、沉降速率→沉降速度、
 *       质量流量/体积流量→流量），删掉叶尖速度。
 */
const fs = require('fs');
const NL = String.fromCharCode(10);
const FILE = __dirname + '/../data/terms.js';
const src = fs.readFileSync(FILE, 'utf8');
/* 与原有精编条目重名的扩充指标：保留原有那条，扩充的丢掉 */
const KEEP_EXISTING = ['比表面积', '筛余', '休止角'];
const lines = src.split(NL);

const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const arr = a => '[' + a.map(q).join(', ') + ']';
/* 数据直接从 terms.js 加载，不解析源码文本：格式由数据自己保证 */
const Sandbox = { window: {} };
const vm = require('vm');
vm.createContext(Sandbox);
vm.runInContext(src, Sandbox);
const TERMS = Sandbox.window.TERMS;
if (!TERMS || TERMS.length === 0) throw new Error('terms.js 加载失败');

/* ── 部件 ─────────────────────────────────────────────── */
const MODS = [
  { key: 'replaceable', cn: '可更换', note: '便于检修与快速更换' },
  { key: 'wear-resistant', cn: '耐磨', note: '用于高磨蚀性物料工况' },
  { key: 'ceramic-lined', cn: '陶瓷衬里', note: '降低金属污染与磨损' },
  { key: 'hydraulically-adjusted', cn: '液压调节', note: '支持间隙或位置的在线调节' }
];
const DROP_COMP = ['eccentric-shaft', 'crankshaft', 'flywheel', 'balance-wheel'];

const baseOfComp = t => {
  let id = t.id.replace('expanded-component-', '');
  for (const m of MODS) if (id.startsWith(m.key + '-')) return id.slice(m.key.length + 1);
  return id;
};

const compGroups = {};
TERMS.filter(t => t.cat === 'component' && t.id.startsWith('expanded-component-'))
  .forEach(t => {
    const b = baseOfComp(t);
    (compGroups[b] = compGroups[b] || []).push(t);
  });

function mergeComp(b, group) {
  const any = group[0];
  const baseCn = (any.props.find(p => p[0] === '部件类别') || [])[1] || any.cn;
  const baseEn = any.en.replace(/^(Replaceable|Wear-Resistant|Ceramic-Lined|Hydraulically Adjusted) /, '');
  const notes = group.map(g => {
    const mod = MODS.find(m => g.id.startsWith('expanded-component-' + m.key + '-'))
             || MODS.find(m => g.cn.startsWith(m.cn));
    const note = (g.props.find(p => p[0] === '工程说明') || [])[1] || '';
    return { mod, note };
  }).filter(x => x.mod);

  const props = [
    ['部件类别', baseCn],
    ['常见做法', notes.map(n => n.mod.cn + '（' + n.note + '）').join('；')],
    ['选型提示', '以上修饰语是同一零件的不同做法，不是不同零件']
  ];
  const en = '（' + notes.map(n => n.mod.cn).join(' / ') + '）';
  return `T(${q(b)}, ${q(baseCn)}, ${q(baseEn)}, 'component', '', ` +
    `[${props.map(([k, v]) => `[${q(k)}, ${q(v)}]`).join(', ')}], ` +
    `${q('英语复合词')}, ${q(baseEn.split(' ').join(' + ').toLowerCase())}, ${q(baseCn + '（修饰语是同一零件的不同做法）')}, ` +
    `${q(baseCn + '：' + notes.map(n => n.mod.cn + '——' + n.note).join('；'))}, ` +
    `${arr(['部件', '扩充词库', '零件'])})`;
}

/* ── 物性 ─────────────────────────────────────────────── */
const POSITIONS = ['入料', '产品', '磨机排料', '分级机溢流'];
const POS_EN = { '入料': 'Feed', '产品': 'Product', '磨机排料': 'Mill Discharge', '分级机溢流': 'Classifier Overflow' };
const POS_NOTE = {
  '入料': '进磨前的物料状态，决定选型输入',
  '产品': '出料成品状态，决定成品是否达标',
  '磨机排料': '磨机出口、尚未分级的中间状态',
  '分级机溢流': '分级后细粉侧的状态'
};
/* 同义词：右列为保留项 */
const SYNONYM = { '解离程度': '解离度', '滞留时间': '停留时间', '沉降速率': '沉降速度' };
/* 直接删除 */
const DROP_METRIC = ['叶尖速度'];

const baseOfMetric = t => {
  let cn = t.cn;
  for (const p of POSITIONS) if (cn.startsWith(p)) return cn.slice(p.length);
  return cn;
};

const metricGroups = {};
TERMS.filter(t => t.cat === 'metric' && t.id.startsWith('expanded-metric-'))
  .forEach(t => {
    const b = baseOfMetric(t);
    (metricGroups[b] = metricGroups[b] || []).push(t);
  });

function mergeMetric(b, group) {
  const any = group[0];
  const en = any.en.replace(/^(Feed|Product|Mill Discharge|Classifier Overflow) /, '');
  const props = [
    ['测量位置', POSITIONS.join(' / ')],
    ['含义', '同一指标在不同测量点的取值，选型主要看入料与产品两处']
  ];
  const id = 'expanded-metric-' + en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `T(${q(id)}, ${q(b)}, ${q(en)}, 'metric', '', ` +
    `[${props.map(([k, v]) => `[${q(k)}, ${q(v)}]`).join(', ')}], ` +
    `${q('英语复合词')}, ${q(en.toLowerCase())}, ${q(b)}, ` +
    `${q(b + '：' + POSITIONS.map(p => p + '（' + POS_NOTE[p] + '）').join('；'))}, ` +
    `${arr(['物性', '扩充词库', '指标'])})`;
}

function positionItems() {
  return POSITIONS.map(p => {
    const id = 'measurement-position-' + POS_EN[p].toLowerCase().replace(/ /g, '-');
    const props = [
      ['作用', POS_NOTE[p]],
      ['取值', '同一指标在这四个位置各有一个值']
    ];
    return `T(${q(id)}, ${q(p)}, ${q(POS_EN[p])}, 'metric', '', ` +
      `[${props.map(([k, v]) => `[${q(k)}, ${q(v)}]`).join(', ')}], ` +
      `${q('英语复合词')}, ${q(POS_EN[p])}, ${q(POS_NOTE[p])}, ` +
      `${q(p + '：' + POS_NOTE[p] + '。粒度、浓度、流量等指标都要标明是在哪个位置测的，否则数字无法比较。')}, ` +
      `${arr(['物性', '测量位置'])})`;
  });
}

/* ── 组装 ─────────────────────────────────────────────── */
const out = [];
const skipped = { comp: 0, metric: 0 };
const mergedComp = Object.entries(compGroups).filter(([b]) => !DROP_COMP.includes(b));
const mergedMetric = Object.entries(metricGroups)
  .map(([b, g]) => [SYNONYM[b] || b, g])
  .filter(([b]) => !DROP_METRIC.includes(b));

const emitted = { comp: new Set(), metric: new Set() };
for (const line of lines) {
  const m = line.trim().match(/^T\((['"])(expanded-(component|metric)-[a-z0-9-]+)\1/);
  if (!m) { out.push(line); continue; }
  const kind = m[3];
  const id = m[2];

  if (kind === 'component') {
    const b = baseOfComp({ id });
    if (DROP_COMP.includes(b)) { skipped.comp++; continue; }
    if (emitted.comp.has(b)) { skipped.comp++; continue; }
    emitted.comp.add(b);
    const g = compGroups[b];
    out.push('    ' + mergeComp(b, g) + ',');
    continue;
  }
  const t = TERMS.find(x => x.id === id);
  let b = baseOfMetric(t);
  b = SYNONYM[b] || b;
  if (DROP_METRIC.includes(b) || KEEP_EXISTING.includes(b)) { skipped.metric++; continue; }
  if (emitted.metric.has(b)) { skipped.metric++; continue; }
  emitted.metric.add(b);
  const g = metricGroups[Object.keys(metricGroups).find(k => (SYNONYM[k] || k) === b)];
  out.push('    ' + mergeMetric(b, g) + ',');
}

// 测量位置放在物性段末尾
const lastMetric = out.map((l, i) => (/^\s+T\(['"]expanded-metric-/.test(l) ? i : -1)).filter(i => i >= 0).pop();
positionItems().forEach(l => out.splice(lastMetric + 1, 0, '    ' + l + ','));

const result = out.join(NL);
console.log('部件：', Object.keys(compGroups).length, '基底 →', mergedComp.length, '条，删', skipped.comp);
console.log('物性：', Object.keys(metricGroups).length, '基底 →', mergedMetric.length, '条 + 4 位置，删', skipped.metric);

if (process.argv.includes('--apply')) {
  fs.writeFileSync(FILE, result);
  console.log('已回写');
}
