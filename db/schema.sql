-- 粉碎词汇 · 数据库结构（SQLite 方言，PostgreSQL 需把 TEXT→VARCHAR、去掉 CHECK 外的方言差异）
-- 设计原则：词条是静态内容，学习状态是动态数据，二者分表；属性与标签用 JSON 留扩展余地。

PRAGMA foreign_keys = ON;

-- ── 词条 ─────────────────────────────────────────────────────────────
-- cat 四类：material 物料 / component 部件 / chemical 化学品 / metric 物性指标
-- day 与 slot 是「一周排课」的落库结果：day 1..7，slot 1..10（每天 10 词）
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
  day         INTEGER NOT NULL CHECK (day BETWEEN 1 AND 7),
  slot        INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 10),
  seq         INTEGER NOT NULL UNIQUE,        -- 全局学习顺序
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_term_day ON term (day, slot);
CREATE INDEX idx_term_cat ON term (cat);

-- ── 学习记录 ─────────────────────────────────────────────────────────
-- 一次复习一条，便于日后接间隔重复（SM-2）而不改词条表
CREATE TABLE review_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  term_id   TEXT NOT NULL REFERENCES term (id) ON DELETE CASCADE,
  day       INTEGER NOT NULL,                 -- 学习日 1..7
  result    TEXT NOT NULL CHECK (result IN ('known', 'again')),
  flipped   INTEGER NOT NULL DEFAULT 0,       -- 是否翻面后才作答
  at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_review_term ON review_log (term_id, at);

-- ── 进度视图 ─────────────────────────────────────────────────────────
-- 每词最近一次 review 的结果，驱动「已掌握」状态与每日进度条
CREATE VIEW term_progress AS
SELECT t.id,
       t.day,
       t.slot,
       t.cn,
       t.en,
       (SELECT r.result FROM review_log r
         WHERE r.term_id = t.id ORDER BY r.at DESC, r.id DESC LIMIT 1) AS last_result
FROM term t;

-- 每日完成度：mastered / total
CREATE VIEW day_progress AS
SELECT t.day,
       COUNT(*) AS total,
       SUM(CASE WHEN p.last_result = 'known' THEN 1 ELSE 0 END) AS mastered
FROM term t
JOIN term_progress p ON p.id = t.id
GROUP BY t.day
ORDER BY t.day;
