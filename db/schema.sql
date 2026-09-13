-- FHJH.me · Cloudflare D1 (SQLite) schema · v0.1
-- 三層：原始層 (source_*) → 正規化層 (notices/attachments/...) → 學生整理層 (annotations/events/exams/wiki/links)
-- 時間一律 ISO 8601 文字（含時區）；布林用 INTEGER 0/1；JSON 欄位以 _json 結尾。

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- 原始層
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sources (
  id            INTEGER PRIMARY KEY,
  key           TEXT NOT NULL UNIQUE,          -- 'fhjh-www', 'fhjh-web1-calendar', ...
  base_url      TEXT NOT NULL,
  kind          TEXT NOT NULL,                 -- 'drupal' | 'html' | 'pdf' | 'ical' | 'manual'
  tier          TEXT NOT NULL,                 -- 'A' 結構化抓取 | 'B' 半自動 | 'C' 只導覽 | 'D' 不碰
  crawl_enabled INTEGER NOT NULL DEFAULT 1,
  min_interval_minutes INTEGER NOT NULL DEFAULT 60,
  notes         TEXT
);

CREATE TABLE IF NOT EXISTS source_documents (
  id               INTEGER PRIMARY KEY,
  source_id        INTEGER NOT NULL REFERENCES sources(id),
  nid              INTEGER,                    -- Drupal node id（非 node 內容為 NULL）
  content_type     TEXT NOT NULL,              -- 'news' | 'honor' | 'gallery' | 'page' | 'hub' | 'eschool' | 'calendar'
  url              TEXT NOT NULL UNIQUE,       -- 絕對網址（canonical）
  title            TEXT,
  published_at     TEXT,                       -- 官網顯示的發布時間
  content_hash     TEXT,                       -- 正規化後主要內容區塊的 SHA-256
  etag             TEXT,
  last_modified    TEXT,
  http_status      INTEGER,
  raw_r2_key       TEXT,                       -- R2 內原始 HTML 快照
  first_seen_at    TEXT NOT NULL,
  last_seen_at     TEXT NOT NULL,              -- 最近一次在列表頁或直接抓取看到
  last_fetched_at  TEXT,
  last_changed_at  TEXT,
  status           TEXT NOT NULL DEFAULT 'active', -- 'active' | 'gone' (404) | 'error'
  rules_version    INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_source_documents_nid ON source_documents(nid);
CREATE INDEX IF NOT EXISTS idx_source_documents_type_seen ON source_documents(content_type, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS crawl_runs (
  id            INTEGER PRIMARY KEY,
  job           TEXT NOT NULL,                 -- 'news-hot' | 'news-daily' | 'pages-weekly' | 'link-check' | 'backfill' | 'manual'
  source_id     INTEGER REFERENCES sources(id),
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  pages_fetched INTEGER NOT NULL DEFAULT 0,
  docs_new      INTEGER NOT NULL DEFAULT 0,
  docs_updated  INTEGER NOT NULL DEFAULT 0,
  errors        INTEGER NOT NULL DEFAULT 0,
  error_sample  TEXT
);

-- ---------------------------------------------------------------------------
-- 正規化層（官方內容的忠實副本，人工不可改）
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS departments (
  id      INTEGER PRIMARY KEY,                 -- 官網 taxonomy term id
  slug    TEXT NOT NULL UNIQUE,                -- 'secondary'
  name    TEXT NOT NULL,                       -- '中學部'
  color   TEXT,                                -- '#4C91D6'
  student_relevant INTEGER NOT NULL DEFAULT 1  -- 幼兒/小學/行政等對中學生預設 0
);

INSERT OR IGNORE INTO departments (id, slug, name, color, student_relevant) VALUES
  (8,  'preschool',            '幼兒部',   NULL,      0),
  (9,  'elementary',           '小學部',   NULL,      0),
  (10, 'elementary-bilingual', '小學雙語', NULL,      0),
  (11, 'secondary',            '中學部',   '#4C91D6', 1),
  (12, 'secondary-bilingual',  '中學雙語', '#C91215', 1),
  (13, 'administration',       '行政單位', '#949494', 0),
  (14, 'special',              '特色中心', '#949494', 1);

CREATE TABLE IF NOT EXISTS notices (
  nid                INTEGER PRIMARY KEY,      -- = source_documents.nid
  source_document_id INTEGER NOT NULL REFERENCES source_documents(id),
  title              TEXT NOT NULL,            -- 官網原標題
  title_clean        TEXT NOT NULL,            -- 去掉【前綴】後
  tags_json          TEXT NOT NULL DEFAULT '[]', -- ["轉知","校外競賽"] 由標題前綴抽出
  subject            TEXT,                     -- 公文主旨（分享連結 title 參數）
  summary            TEXT,                     -- meta description
  body_html          TEXT,                     -- 經過白名單清洗
  body_text          TEXT,                     -- 純文字，供搜尋與規則
  published_at       TEXT NOT NULL,
  view_count         INTEGER,
  url                TEXT NOT NULL,
  content_version    INTEGER NOT NULL DEFAULT 1,
  origin_updated_at  TEXT,                     -- content_hash 變動時間
  relevance_score    REAL NOT NULL DEFAULT 0,  -- 05 規則計算，0 = 隱藏
  is_hidden          INTEGER NOT NULL DEFAULT 0, -- 徵才/採購等（規則或人工）
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notices_published ON notices(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_relevance ON notices(is_hidden, relevance_score DESC, published_at DESC);

CREATE TABLE IF NOT EXISTS notice_departments (
  notice_nid    INTEGER NOT NULL REFERENCES notices(nid) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  PRIMARY KEY (notice_nid, department_id)
);

CREATE TABLE IF NOT EXISTS attachments (
  id            INTEGER PRIMARY KEY,
  owner_type    TEXT NOT NULL,                 -- 'notice' | 'page' | 'exam' | 'wiki' | 'resource'
  owner_id      INTEGER NOT NULL,              -- notice.nid / pages.nid / exams.id ...
  url           TEXT NOT NULL,
  filename      TEXT,
  label         TEXT,                          -- 連結文字
  mime          TEXT,
  size_bytes    INTEGER,
  sha256        TEXT,
  r2_key        TEXT,                          -- 有下載才有
  text_extracted INTEGER NOT NULL DEFAULT 0,
  text_r2_key   TEXT,                          -- 抽出的全文（不進 D1 以免過大）
  no_index      INTEGER NOT NULL DEFAULT 0,    -- 榮譽榜等含個資 → 1
  first_seen_at TEXT NOT NULL,
  last_seen_at  TEXT NOT NULL,
  UNIQUE (owner_type, owner_id, url)
);
CREATE INDEX IF NOT EXISTS idx_attachments_owner ON attachments(owner_type, owner_id);

-- 官網「頁面型」節點（學部介紹／行政單位／特色中心／家長園地／榮譽榜標題）
CREATE TABLE IF NOT EXISTS pages (
  nid                INTEGER PRIMARY KEY,
  source_document_id INTEGER NOT NULL REFERENCES source_documents(id),
  section            TEXT NOT NULL,            -- 'faculty-introduction' | 'administrative-unit' | 'feature-center' | 'garden' | 'honor'
  hub_path           TEXT,                     -- '/faculty-introduction/secondary/secondary-1'
  hub_label          TEXT,                     -- '學生相關規則'
  title              TEXT NOT NULL,
  body_html          TEXT,                     -- honor 不存 body
  body_text          TEXT,
  published_at       TEXT,
  view_count         INTEGER,
  url                TEXT NOT NULL,
  origin_updated_at  TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pages_section ON pages(section, hub_path);

-- ---------------------------------------------------------------------------
-- 學生整理層（編輯可改，全部帶 credibility 與 status）
-- credibility: 'official' | 'student_summary' | 'submission' | 'unverified'
-- status:      'draft' | 'published' | 'archived'
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,           -- 來自 Cloudflare Access JWT
  display_name TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'contributor', -- 'contributor' | 'editor' | 'admin'
  is_active    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL,
  last_seen_at TEXT
);

CREATE TABLE IF NOT EXISTS notice_annotations (
  notice_nid        INTEGER PRIMARY KEY REFERENCES notices(nid) ON DELETE CASCADE,
  audience_json     TEXT NOT NULL DEFAULT '[]', -- ["g7","g8","g9","g10","g11","g12","all","parents","staff"]
  deadline_at       TEXT,                      -- ISO；NULL = 無截止
  deadline_confidence TEXT NOT NULL DEFAULT 'none', -- 'none' | 'auto' | 'confirmed'
  action_text       TEXT,                      -- 「要做什麼」一句話
  student_summary   TEXT,                      -- 學生版摘要（≤ 200 字）
  importance        INTEGER NOT NULL DEFAULT 0, -- 0 一般 · 1 值得看 · 2 重要 · 3 本週重點
  pin_until         TEXT,                      -- 置頂到期
  credibility       TEXT NOT NULL DEFAULT 'student_summary',
  status            TEXT NOT NULL DEFAULT 'draft',
  editor_id         INTEGER REFERENCES users(id),
  version           INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_annotations_deadline ON notice_annotations(status, deadline_at);
CREATE INDEX IF NOT EXISTS idx_annotations_importance ON notice_annotations(status, importance DESC);

CREATE TABLE IF NOT EXISTS semesters (
  id               TEXT PRIMARY KEY,           -- '115-1'
  academic_year    INTEGER NOT NULL,           -- 115
  term             INTEGER NOT NULL,           -- 1 | 2
  starts_on        TEXT NOT NULL,              -- 'YYYY-MM-DD'
  ends_on          TEXT NOT NULL,
  calendar_pdf_url TEXT,                       -- 官網行事曆 PDF
  calendar_page_nid INTEGER,                   -- 874
  is_current       INTEGER NOT NULL DEFAULT 0,
  notes            TEXT
);

CREATE TABLE IF NOT EXISTS exams (
  id            INTEGER PRIMARY KEY,
  semester_id   TEXT NOT NULL REFERENCES semesters(id),
  seq           INTEGER NOT NULL,              -- 1,2,3
  name          TEXT NOT NULL,                 -- '第一次段考' / '期中考查' / '模擬考'
  kind          TEXT NOT NULL DEFAULT 'regular', -- 'regular' | 'mock' | 'final' | 'other'
  grades_json   TEXT NOT NULL DEFAULT '["g7","g8","g9","g10","g11","g12"]',
  starts_on     TEXT NOT NULL,
  ends_on       TEXT NOT NULL,
  source_url    TEXT,                          -- 行事曆 PDF 或公告
  credibility   TEXT NOT NULL DEFAULT 'student_summary',
  status        TEXT NOT NULL DEFAULT 'draft',
  notes         TEXT,
  editor_id     INTEGER REFERENCES users(id),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  UNIQUE (semester_id, seq)
);

CREATE TABLE IF NOT EXISTS exam_subjects (
  id            INTEGER PRIMARY KEY,
  exam_id       INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  grade         TEXT NOT NULL,                 -- 'g7'..'g12'
  subject       TEXT NOT NULL,                 -- '數學'
  exam_date     TEXT,                          -- 該科考試日（可空）
  scope_text    TEXT,                          -- 範圍
  source_url    TEXT,
  credibility   TEXT NOT NULL DEFAULT 'student_summary',
  status        TEXT NOT NULL DEFAULT 'draft',
  editor_id     INTEGER REFERENCES users(id),
  version       INTEGER NOT NULL DEFAULT 1,
  updated_at    TEXT NOT NULL,
  UNIQUE (exam_id, grade, subject)
);

CREATE TABLE IF NOT EXISTS exam_resources (
  id                  INTEGER PRIMARY KEY,
  exam_id             INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  grade               TEXT NOT NULL,
  subject             TEXT,
  title               TEXT NOT NULL,
  url                 TEXT NOT NULL,           -- 外部連結或 R2 檔
  kind                TEXT NOT NULL,           -- 'teacher_public' | 'student_notes' | 'link'
  contributor_display TEXT,                    -- 顯示名（暱稱），非真名
  license             TEXT,                    -- 'CC-BY-NC' | 'all-rights-reserved' | ...
  credibility         TEXT NOT NULL DEFAULT 'submission',
  status              TEXT NOT NULL DEFAULT 'draft',
  submission_id       INTEGER,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY,
  title         TEXT NOT NULL,
  starts_at     TEXT NOT NULL,
  ends_at       TEXT,
  all_day       INTEGER NOT NULL DEFAULT 1,
  category      TEXT NOT NULL,                 -- 'deadline' | 'exam' | 'activity' | 'holiday' | 'club' | 'competition' | 'meeting'
  audience_json TEXT NOT NULL DEFAULT '["all"]',
  location      TEXT,
  description   TEXT,
  url           TEXT,                          -- 官方原文／報名頁
  origin_type   TEXT NOT NULL,                 -- 'notice' | 'exam' | 'calendar_pdf' | 'garden_calendar' | 'manual'
  origin_ref    TEXT,                          -- notice nid / exam id / pdf url
  credibility   TEXT NOT NULL DEFAULT 'student_summary',
  status        TEXT NOT NULL DEFAULT 'draft',
  editor_id     INTEGER REFERENCES users(id),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_time ON events(status, starts_at);

CREATE TABLE IF NOT EXISTS wiki_pages (
  id               INTEGER PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,       -- 'leave-request'
  title            TEXT NOT NULL,              -- '請假怎麼辦'
  category         TEXT NOT NULL,              -- 'procedure' | 'rule' | 'place' | 'contact' | 'system' | 'faq'
  body_md          TEXT NOT NULL,
  sources_json     TEXT NOT NULL DEFAULT '[]', -- [{"title":"學生請假規定","url":"https://www.fhjh.tp.edu.tw/system/files/..."}]
  related_nids_json TEXT NOT NULL DEFAULT '[]',
  last_verified_at TEXT,                       -- 「最後確認日」
  stale_after_days INTEGER NOT NULL DEFAULT 180,
  credibility      TEXT NOT NULL DEFAULT 'student_summary',
  status           TEXT NOT NULL DEFAULT 'draft',
  editor_id        INTEGER REFERENCES users(id),
  version          INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wiki_revisions (
  id           INTEGER PRIMARY KEY,
  wiki_page_id INTEGER NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  version      INTEGER NOT NULL,
  body_md      TEXT NOT NULL,
  editor_id    INTEGER REFERENCES users(id),
  note         TEXT,
  created_at   TEXT NOT NULL,
  UNIQUE (wiki_page_id, version)
);

CREATE TABLE IF NOT EXISTS links (
  id               INTEGER PRIMARY KEY,
  title            TEXT NOT NULL,
  url              TEXT NOT NULL UNIQUE,
  category         TEXT NOT NULL,              -- 'system' | 'learning' | 'library' | 'form' | 'official' | 'external'
  audience_json    TEXT NOT NULL DEFAULT '["all"]',
  description      TEXT,
  origin           TEXT NOT NULL,              -- 'eschool' | 'garden' | 'page' | 'manual'
  origin_ref       TEXT,                       -- 官網分類名或 nid
  requires_login   INTEGER NOT NULL DEFAULT 0,
  on_campus_only   INTEGER NOT NULL DEFAULT 0,
  help_wiki_slug   TEXT,                       -- 例如 'school-system-login'
  sort_order       INTEGER NOT NULL DEFAULT 100,
  status           TEXT NOT NULL DEFAULT 'draft',
  last_checked_at  TEXT,
  last_status_code INTEGER,
  is_broken        INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- 投稿、回報、治理
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS submissions (
  id            INTEGER PRIMARY KEY,
  kind          TEXT NOT NULL,                 -- 'exam_scope' | 'exam_resource' | 'event' | 'wiki_edit' | 'link' | 'notice_hint'
  payload_json  TEXT NOT NULL,                 -- 經 schema 驗證
  contact       TEXT,                          -- 選填，30 天後清除
  ip_hash       TEXT,                          -- 限流／濫用追蹤，salted hash
  status        TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'spam'
  reviewer_id   INTEGER REFERENCES users(id),
  decision_note TEXT,
  created_at    TEXT NOT NULL,
  decided_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status, created_at);

CREATE TABLE IF NOT EXISTS reports (
  id           INTEGER PRIMARY KEY,
  target_type  TEXT NOT NULL,                  -- 'notice' | 'event' | 'exam' | 'wiki' | 'link' | 'resource' | 'site'
  target_id    TEXT NOT NULL,
  reason       TEXT NOT NULL,                  -- 'wrong' | 'outdated' | 'copyright' | 'privacy' | 'broken_link' | 'other'
  message      TEXT,
  contact      TEXT,
  ip_hash      TEXT,
  status       TEXT NOT NULL DEFAULT 'open',   -- 'open' | 'resolved' | 'dismissed'
  handler_id   INTEGER REFERENCES users(id),
  created_at   TEXT NOT NULL,
  resolved_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY,
  actor_id    INTEGER REFERENCES users(id),
  action      TEXT NOT NULL,                   -- 'create' | 'update' | 'publish' | 'archive' | 'approve' | 'reject' | 'crawl'
  table_name  TEXT NOT NULL,
  row_id      TEXT NOT NULL,
  before_json TEXT,
  after_json  TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_row ON audit_log(table_name, row_id);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,                 -- 'home.highlights' | 'disclaimer' | 'crawler.paused'
  value_json TEXT NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- 全文搜尋（外部內容表；由應用層維護）
-- trigram 支援中文子字串查詢；若環境不支援，改為 unicode61 並在寫入前做 bigram 斷詞。
-- ---------------------------------------------------------------------------

CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  doc_type,         -- 'notice' | 'wiki' | 'exam' | 'link' | 'page' | 'event'
  doc_id UNINDEXED,
  title,
  body,
  tags,
  published_at UNINDEXED,
  tokenize = 'trigram'
);
