/* terms.js 解析：切出每个条目 { id, cn, cat, text }
 * - 条目起始：缩进后以 T(' 或 T(" 开头的行
 * - 条目结束：该行以 `),` 结尾（最后一条是 `)` 结尾，靠数组收尾行兜住）
 * 化学式里的 (OH)₂ 之类不会出现在行尾，因此不会误判。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'terms.js');
const src = fs.readFileSync(FILE, 'utf8');
const NL = String.fromCharCode(10);
const lines = src.split(NL);

const startsItem = l => /^\s+T\(['"]/.test(l);
const endsItem = l => /\)\s*,\s*$/.test(l);

const items = [];
for (let i = 0; i < lines.length; i++) {
  if (!startsItem(lines[i])) continue;
  const buf = [lines[i].trim()];
  let j = i;
  // 兼容尚未合并成行的旧格式：一直读到行尾 ), 为止
  while (!endsItem(buf[buf.length - 1]) && j + 1 < lines.length && !/^\s*(\]|\))\s*;?\s*$/.test(lines[j + 1])) {
    j++;
    buf.push(lines[j].trim());
  }
  const text = buf.join(' ').replace(/\s+/g, ' ').replace(/,\s*$/, '');
  const m = text.match(/^T\((['"])(.*?)\1,\s*(['"])(.*?)\3,\s*(['"])(.*?)\5,\s*(['"])(material|component|chemical|metric)\7/);
  if (!m) throw new Error('无法解析第 ' + (i + 1) + ' 行：' + text.slice(0, 70));
  items.push({ id: m[2], cn: m[4], cat: m[8], text, from: i, to: j });
}

/* 分区起点：每个 root.TERMS 行 */
const marks = [];
lines.forEach((l, i) => { if (/^\s*root\.TERMS/.test(l)) marks.push(i); });
marks.push(lines.length);

module.exports = { FILE, src, lines, items, marks, NL };
