# 粉碎词汇 · comminution lexicon

工业物料与粉碎设备专业词汇的记忆工具。正面只给中文，翻面得英文名、词根来源、化学式与物性。不设每日额度，开机接着上次的位置。

在线使用：<https://3698688050-pixel.github.io/comminution-vocab/>

## 内容

1000 词，四类轮转交错，相邻两张必属不同类，随手翻都是「矿物 + 机器零件 + 化学式 + 指标」的混合：

| 分类 | 词数 | 例 |
|---|---:|---|
| 物料 | 332 | 石英 quartz、铬铁矿 chromite、石英砂 silica sand |
| 部件 | 256 | 分级轮 classifier wheel、耐磨颚式破碎机 wear-resistant jaw crusher |
| 化学品 | 162 | 二氧化硅 silicon dioxide、硫酸钙 calcium sulfate、氢氧化钠 sodium hydroxide |
| 物性 | 250 | 莫氏硬度 Mohs hardness、粒度 particle size、磨机排料功率 mill discharge power |

扩充词条覆盖矿物与工艺物料、破碎/粉磨/分级设备及其变体、常见无机化学品和过程测量指标。词条按类目交错排列，范围胶囊只用于筛选，不设每日学习配额。

词根照实写，有争议就写争议：quartz 一般借自西斯拉夫语 *tvьrdъ、sulfur 词源未定、auger 来自「a nauger → an auger」的误拆分、kaolin 是汉语「高岭」进国际术语、camera 的「相机」义是 camera obscura 的缩略。德语 / 阿拉伯语 / 古诺斯语 / 人名地名的来源不硬套拉丁词根。

## 用法

双击 `index.html` 即可，纯静态、无构建、无网络请求（字体有本地回退）。

- 轻触卡片或 `空格` / `回车` 翻面
- `←` / `→` 换卡，`M` 标记已掌握（标记后自动跳下一张未掌握的）
- 顶部胶囊只收窄范围（全部 / 物料 / 部件 / 化学品 / 物性），两个视图共用，不限制背多少
- 到头接着下一轮：`←` 在第一张回到最后一张，`→` 在最后一张回到第一张
- 「词表」页检索中文 / 英文 / 词根 / 化学式 / 标签，已掌握的词带红点，点行原地展开
- 进度存 localStorage，按当前范围「清空进度」

## 文件

```
index.html              单页应用
assets/styles.css       设计系统与组件
assets/app.js           词序、翻转、进度
data/terms.js           1000 词条，唯一真源
db/schema.sql           表 + 视图（SQLite 方言）
db/seed.sql             生成的种子数据
scripts/build-seed.mjs  校验词条并重生成 SQL
screens/                截图
DESIGN.md               完整设计方案
```

## 改词条

改 `data/terms.js`，然后：

```bash
node scripts/build-seed.mjs
```

脚本会拒绝空字段、重复 id、未知分类、化学品缺化学式、缺性质或缺标签的数据，并打印各类词数，通过后重写 `db/seed.sql`。

## 数据库

```
term           静态词条：id, cn, en, cat, formula, props(JSON), root_*, tags(JSON), seq
review_log     每次作答一条：term_id, result(known|again), flipped, at
term_progress  视图：每词最近一次结果
progress       视图：按类目 mastered / total
```

词条与学习状态分表；`review_log` 只追加，`at + result + flipped` 已够接 SM-2 间隔重复。

## 还没做

间隔重复（接口已备好未接）、发音 / IPA、词根族视图、进度导入导出。
