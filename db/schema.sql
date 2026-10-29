-- 粉碎词汇 · 数据库结构（SQLite 方言，PostgreSQL 需把 TEXT→VARCHAR、去掉 CHECK 外的方言差异）
-- 设计原则：词条是静态内容，学习状态是动态数据，二者分表；属性与标签用 JSON 留扩展余地。

PRAGMA foreign_keys = ON;

-- ── 词条 ─────────────────────────────────────────────────────────────
-- cat 四类：material 物料 / component 部件 / chemical 化学品 / metric 物性指标
-- 不设每日额度：seq 是唯一的全局顺序，学习节奏由使用者决定
CREATE TABLE term (
  id          TEXT PRIMARY KEY,              -- 语义化 slug，如 'classifier-wheel'
  cn          TEXT NOT NULL,                  -- 中文（卡片正面）
  en          TEXT NOT NULL,                  -- 英文（卡片背面主词）
  cat         TEXT NOT NULL CHECK (cat IN ('material', 'component', 'chemical', 'metric')),
  formula     TEXT NOT NULL DEFAULT '',       -- 化学式，非化学物质留空
  props       TEXT NOT NULL,                  -- JSON: [["莫氏硬度","7"],["密度","2.65 g/cm³"]]
  root_lang   TEXT NOT NULL,                  -- 词根语言：希腊语 / 拉丁语 / 德语 / 汉语 / 人名 / 地名
  root_term   TEXT NOT NULL,                  -- 词根原形，如 'graphein'、'caementum'
  root_gloss  TEXT NOT NULL,                  -- 词根释义
  root_note   TEXT NOT NULL,                  -- 构词逻辑，含「词源有争议」的如实标注
  tags        TEXT NOT NULL,                  -- JSON: ["非金属矿","高磨蚀"]
  seq         INTEGER NOT NULL UNIQUE,        -- 全局顺序，按类目轮转交错
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_term_cat ON term (cat);

-- ── 学习记录 ─────────────────────────────────────────────────────────
-- 一次复习一条，便于日后接间隔重复（SM-2）而不改词条表
CREATE TABLE review_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  term_id   TEXT NOT NULL REFERENCES term (id) ON DELETE CASCADE,
  result    TEXT NOT NULL CHECK (result IN ('known', 'again')),
  flipped   INTEGER NOT NULL DEFAULT 0,       -- 是否翻面后才作答
  at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_review_term ON review_log (term_id, at);

-- ── 进度视图 ─────────────────────────────────────────────────────────
-- 每词最近一次 review 的结果，驱动「已掌握」状态与进度计数
CREATE VIEW term_progress AS
SELECT t.id,
       t.cat,
       t.cn,
       t.en,
       (SELECT r.result FROM review_log r
         WHERE r.term_id = t.id ORDER BY r.at DESC, r.id DESC LIMIT 1) AS last_result
FROM term t;

-- 完成度：按类目与全库计数，没有「今天必须背完」的概念
CREATE VIEW progress AS
SELECT t.cat,
       COUNT(*) AS total,
       SUM(CASE WHEN p.last_result = 'known' THEN 1 ELSE 0 END) AS mastered
FROM term t
JOIN term_progress p ON p.id = t.id
GROUP BY t.cat;
