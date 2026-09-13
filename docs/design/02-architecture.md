# 02｜系統架構

## 1. 總覽

```
                 ┌──────────────────────────────────────────────────────────┐
                 │  官方來源（唯讀）                                          │
                 │  www.fhjh.tp.edu.tw  ·  web1/calendar(待確認)  ·  ebook… │
                 └───────────────▲──────────────────────────────────────────┘
                                 │ HTTPS GET（禮貌抓取，見 01 §5）
┌────────────────────────────────┴───────────────────────────────────────────┐
│ Cloudflare                                                                  │
│                                                                             │
│  ┌──────────────┐  Cron   ┌───────────────┐  Queue   ┌──────────────────┐  │
│  │ ingest-worker│◄───────►│ list crawler  │─────────►│ detail crawler   │  │
│  │ (排程/隊列)   │         │ /news?page=N  │          │ /news/{nid} 等   │  │
│  └──────┬───────┘         └───────────────┘          └────────┬─────────┘  │
│         │ HTMLRewriter 解析 → 正規化（05）                       │            │
│         ▼                                                      ▼            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ D1 (SQLite)  source_documents · notices · annotations · events ·     │   │
│  │              exams · wiki · links · submissions · audit · FTS5       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│         ▲                          ▲                                       │
│         │                          │                                       │
│  ┌──────┴───────┐          ┌───────┴────────┐        ┌──────────────────┐  │
│  │ api-worker   │          │ admin-worker   │        │ R2               │  │
│  │ api.fhjh.me  │          │ admin.fhjh.me  │        │ 附件快取/全文/備份│  │
│  │ /v1/* 公開唯讀│          │ Access 保護     │        └──────────────────┘  │
│  └──────┬───────┘          └────────────────┘                              │
│         │ KV: home payload / config / rate-limit                           │
│  ┌──────▼───────┐                                                          │
│  │ Pages        │  fhjh.me  主頁 · /exam · /notices · /wiki · /links       │
│  └──────────────┘                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

三個 Worker 各自獨立部署，共用同一個 D1；前端 Pages 只呼叫 `api.fhjh.me`。管理後台網域與程式與公開站分離（計畫書 §07）。

## 2. 元件職責

| 元件 | 技術 | 職責 | 不做的事 |
| --- | --- | --- | --- |
| `ingest-worker` | Workers + Cron Triggers + Queues | 依排程抓列表頁、比對 nid／hash、把需要更新的 URL 丟進 Queue；消費 Queue 抓詳細頁、解析、寫入 D1；記錄 `crawl_runs` | 不做任何內容判讀以外的「編輯」；不寫 annotations |
| `api-worker` | Workers（Hono 或原生） | 公開唯讀 API `/v1/*`、RSS/Atom/ICS feed、搜尋；Cache API + KV 快取；限流；`POST /reports`、`POST /submissions`（Turnstile 驗證） | 不接受任何寫入官方資料的請求 |
| `admin-worker` | Workers + Cloudflare Access（Google 登入白名單） | 編輯 annotations / events / exams / wiki / links、審核投稿、手動觸發抓取、審核紀錄 | 不自建密碼；不對外曝光 |
| D1 | SQLite | 所有結構化資料＋ FTS5 全文索引 | 不存原始 HTML（放 R2） |
| KV | | `home:v1` 首頁彙整 JSON（TTL 5 分鐘）、`config:semester`、限流計數 | |
| R2 | | 原始 HTML 快照（除錯／回溯）、需要全文的 PDF、每日 D1 匯出備份 | 不鏡像榮譽榜附件 |
| Pages | Astro（建議）或任何 SSG | 前端；SSR 或 build-time 呼叫 API | 不直接讀 D1 |

## 3. 抓取排程

| 名稱 | Cron（UTC；台灣 = UTC+8） | 範圍 | 目的 |
| --- | --- | --- | --- |
| `news-hot` | `*/30 23-13 * * 1-5`（台灣平日 07:00–21:30 每 30 分） | `/news?page=0`、`/news?page=1` | 當日新公告 |
| `news-daily` | `0 15 * * *`（台灣 23:00） | `/news` 前 5 頁、`/honor` 前 2 頁 | 補漏、抓瀏覽數／修改 |
| `pages-weekly` | `0 16 * * 0`（台灣週一 00:00） | 01 §2.4–2.8 列出的 hub 頁與節點、`/e-school`、`/garden/674` | 規章／表單／連結變動 |
| `link-check` | `0 17 * * 0` | `links.url` 全部 HEAD | 失效連結標記 |
| `backfill` | 手動一次 | `/news?page=0..154` | 建立歷史（僅近 2 學年，約 60 頁，其餘可略） |

Queue 消費端每則詳細頁：GET → 若 `content_hash` 未變則只更新 `last_seen_at`、`view_count`；有變則寫新版本並觸發 FTS 更新與 `home:v1` 失效。

## 4. 解析策略

- 使用 `HTMLRewriter`（Workers 原生串流解析），對 01 列出的選擇器註冊 handler；不引入 cheerio 等整頁 DOM 套件以控制 CPU 時間。
- 每個 content type 一個 parser module：`parseNewsList`、`parseNewsDetail`、`parseHubPage`、`parseBodyLinks`、`parseGardenCalendarTable`、`parseESchool`。
- 解析結果先寫 `source_documents`（原始層），再由「正規化步驟」寫 `notices` 等（正規化層）。兩步分開，parser 出錯可以只重跑正規化。
- 正規化規則集中在 05；規則有版本號 `rules_version`，改規則後可批次重算。

## 5. API 快取與效能

- 所有 `GET /v1/*` 回 `Cache-Control: public, max-age=300, stale-while-revalidate=3600` 與強 `ETag`（回應 body 的 SHA-256 前 16 碼）。
- Worker 內先查 Cache API（以 URL 為 key），miss 才查 D1。
- `GET /v1/home` 直接讀 KV `home:v1`，由 ingest 或 admin 寫入後主動更新（write-through），首頁不打 D1。
- 寫入操作（admin）完成後呼叫 `caches.default.delete()` 對應 URL，並重算 `home:v1`。
- 搜尋用 D1 FTS5 `tokenize='trigram'`（支援中文子字串），結果上限 50；若 D1 環境不支援 trigram，退回應用層 bigram 斷詞寫入 FTS（`unicode61`）。

## 6. 安全與隱私

| 面向 | 做法 |
| --- | --- |
| 管理身分 | Cloudflare Access（Google Workspace／指定 Gmail 白名單）+ Access JWT 驗證；角色存 D1 `users.role` |
| 公開寫入 | 只有 `POST /v1/reports`、`POST /v1/submissions`；Turnstile；每 IP 每小時 10 次；payload 走 schema 驗證與長度上限；HTML 一律轉義 |
| 限流 | 匿名 60 req/min/IP（KV 計數，或 Cloudflare Rate Limiting 規則）；超過回 429 + `Retry-After` |
| 個資 | 投稿表單不收姓名／班級／座號／電話；`contact` 為選填且只給審核者看，30 天後清除 |
| 憑證 | 沒有任何官網帳密；爬蟲只做匿名 GET |
| 備份 | 每日 `wrangler d1 export` 到 R2，保留 30 天；R2 版本控制開啟 |
| 審核紀錄 | 所有 admin 寫入進 `audit_log`（誰、何時、改了哪個資料列、前後 diff） |
| 非官方標示 | API 每個回應 `meta.disclaimer` 固定字串；前端頁首／頁尾固定顯示 |

## 7. 環境與部署

- 一個 monorepo：`apps/ingest`、`apps/api`、`apps/admin`、`apps/web`、`packages/schema`（TypeScript 型別 + zod，從 `api/openapi.yaml` 產生）、`db/migrations`。
- `staging` 與 `production` 兩組 D1／KV／R2 綁定，`wrangler.toml` 以環境切換。
- CI：型別檢查、parser 對「固定 HTML 樣本」的快照測試（樣本存在 repo，避免測試時打官網）、migration dry-run。
- 觀測：Workers Logs + Analytics Engine 記錄每次 crawl 的 fetched/new/updated/errors；連續 3 次 crawl 0 新增且官網有新 nid → 告警（Email/Discord）。
