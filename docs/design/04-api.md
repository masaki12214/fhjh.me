# 04｜API 規格 v1

機器可讀版：[`api/openapi.yaml`](../../api/openapi.yaml)（OpenAPI 3.1）。本文說明慣例與每個端點的用途；欄位細節以 OpenAPI 為準。

## 1. 慣例

| 項目 | 規定 |
| --- | --- |
| Base URL | `https://api.fhjh.me/v1`（管理端 `https://admin.fhjh.me/v1`） |
| 格式 | JSON、UTF-8；時間 ISO 8601 含時區（`2026-09-11T17:28:15+08:00`）；日期 `YYYY-MM-DD` |
| 認證 | 公開 GET 不需認證；`POST /reports`、`POST /submissions` 需 Turnstile token；管理端由 Cloudflare Access 注入 `Cf-Access-Jwt-Assertion` |
| CORS | 公開端點 `Access-Control-Allow-Origin: *` |
| 快取 | `Cache-Control: public, max-age=300, stale-while-revalidate=3600`、`ETag`；支援 `If-None-Match` → 304 |
| 限流 | 匿名 60 req/min/IP；寫入端點 10 req/hour/IP；超過回 `429` + `Retry-After` |
| 分頁 | cursor 分頁：`?limit=20&cursor=...`（`limit` ≤ 50）；回應 `meta.next_cursor` 為 null 表示結束 |
| 回應信封 | `{ "data": ..., "meta": { "generated_at", "disclaimer", "next_cursor"? , "total"? } }` |
| 錯誤 | RFC 9457 `application/problem+json`：`{ type, title, status, detail, instance }` |
| 版本 | 路徑版本 `/v1`；破壞性變更才開 `/v2`；欄位只增不減 |
| 來源標示 | 每個代表官網內容的物件都有 `source: { name, url, fetched_at }`；每個學生整理欄位群都有 `credibility` |

固定 `meta.disclaimer`：`"FHJH.me 為學生製作之非官方整理，資料來源為臺北市私立復興實驗高級中學官網等公開頁面；重要資訊請以官方原文為準。"`

## 2. 公開端點總表

| 方法 | 路徑 | 用途 | 主要參數 |
| --- | --- | --- | --- |
| GET | `/home` | 首頁一次取回（KV 快取） | `audience` |
| GET | `/notices` | 公告列表（官方＋註記） | `dept`, `audience`, `tag`, `has_deadline`, `since`, `q`, `sort`, `include_hidden`, `limit`, `cursor` |
| GET | `/notices/{nid}` | 單則公告 | |
| GET | `/deadlines` | 快到期（已確認截止日的公告＋deadline 類事件） | `within_days`, `audience` |
| GET | `/events` | 事件列表 | `from`, `to`, `category`, `audience`, `limit`, `cursor` |
| GET | `/events/{id}` | 單一事件 | |
| GET | `/events.ics` | iCalendar 訂閱 | `audience`, `category` |
| GET | `/semesters` | 學期列表（含 current） | |
| GET | `/exams` | 段考列表 | `semester`（預設 current）, `grade` |
| GET | `/exams/next` | 下一個段考（首頁倒數） | `grade` |
| GET | `/exams/{id}` | 段考詳情：科目範圍、資源、來源 | `grade` |
| GET | `/wiki` | Wiki 列表 | `category`, `q`, `limit`, `cursor` |
| GET | `/wiki/{slug}` | Wiki 頁 | |
| GET | `/links` | 常用連結（依分類分組） | `category`, `audience` |
| GET | `/pages` | 官網頁面型節點索引（規章、表單） | `section`, `hub`, `q`, `limit`, `cursor` |
| GET | `/pages/{nid}` | 單一頁面（含附件清單） | |
| GET | `/search` | 全站搜尋 | `q`（必填，≥ 2 字）, `type`, `limit` |
| GET | `/departments` | 學部字典 | |
| GET | `/sources` | 資料來源與抓取政策（透明度） | |
| GET | `/status` | 最近抓取時間、各表筆數、健康度 | |
| GET | `/feeds/notices.atom` | 公告 Atom feed（官網沒有 RSS，這是加值） | `dept`, `audience` |
| POST | `/reports` | 回報錯誤／侵權／個資 | body |
| POST | `/submissions` | 投稿 | body |

## 3. 關鍵物件

### Notice（`/notices`、`/notices/{nid}`）

```json
{
  "nid": 8150,
  "title": "【校外競賽】2026 GoSTEAM科技之星競賽",
  "title_clean": "2026 GoSTEAM科技之星競賽",
  "tags": ["校外競賽"],
  "subject": "函轉國立臺灣師範大學辦理「2026 GoSTEAM科技之星競賽」相關資訊，請協助轉知並鼓勵學生踴躍報名參加",
  "departments": [
    { "slug": "special", "name": "特色中心" },
    { "slug": "secondary", "name": "中學部", "color": "#4C91D6" },
    { "slug": "secondary-bilingual", "name": "中學雙語", "color": "#C91215" }
  ],
  "published_at": "2026-09-11T17:28:15+08:00",
  "origin_updated_at": null,
  "view_count": 4,
  "summary": "一、依據臺師大115年9月7日師大科技字第1151023845號函辦理。",
  "body_html": "<p>一、依據…</p>",
  "attachments": [
    { "label": "簡章 2026 GoSTEAM科技之星競賽.pdf", "url": "https://www.fhjh.tp.edu.tw/system/files/2026-09/...pdf", "mime": "application/pdf" }
  ],
  "source": {
    "name": "臺北市私立復興實驗高級中學 訊息公告",
    "url": "https://www.fhjh.tp.edu.tw/news/8150",
    "fetched_at": "2026-09-13T09:00:12+08:00",
    "credibility": "official"
  },
  "student": {
    "credibility": "student_summary",
    "status": "published",
    "audience": ["g10", "g11", "g12"],
    "summary": "高中生可報名的 STEAM 實作競賽，11/21 在三民高中比賽。",
    "action": "9/14–10/12 到官網報名，簡章看附件。",
    "deadline_at": "2026-10-12T17:00:00+08:00",
    "deadline_confidence": "confirmed",
    "importance": 1,
    "updated_at": "2026-09-12T20:11:00+08:00"
  },
  "relevance_score": 0.82,
  "is_hidden": false
}
```

- 列表模式不含 `body_html`；`?fields=full` 才回。
- `student` 為 `null` 表示尚無註記（前端就只顯示官方欄位）。
- `deadline_confidence: "auto"` 的 `deadline_at` 也會回傳，但前端應標示「待確認」且不可用於首頁「快到期」；`/deadlines` 端點只回 `confirmed`。

### Exam（`/exams/{id}`）

```json
{
  "id": 3,
  "semester": { "id": "115-1", "academic_year": 115, "term": 1, "is_current": true },
  "seq": 1,
  "name": "第一次段考",
  "kind": "regular",
  "starts_on": "2026-10-06",
  "ends_on": "2026-10-07",
  "days_until": 23,
  "grades": ["g7", "g8", "g9", "g10", "g11", "g12"],
  "source": { "name": "115-1 行事曆（學生版）", "url": "https://www.fhjh.tp.edu.tw/system/files/inline-files/...pdf", "credibility": "student_summary" },
  "subjects": [
    { "grade": "g8", "subject": "數學", "exam_date": "2026-10-06", "scope": "第一章～第二章 2-2", "credibility": "student_summary", "source_url": null, "updated_at": "..." }
  ],
  "resources": [
    { "grade": "g8", "subject": "數學", "title": "2-1 重點整理", "url": "https://...", "kind": "student_notes", "contributor_display": "阿明", "license": "CC-BY-NC", "credibility": "submission" }
  ],
  "status": "published"
}
```

### Event / Deadline

```json
{
  "id": 41,
  "title": "GoSTEAM 科技之星競賽報名截止",
  "starts_at": "2026-10-12T17:00:00+08:00",
  "ends_at": null,
  "all_day": false,
  "category": "deadline",
  "audience": ["g10", "g11", "g12"],
  "url": "https://www.fhjh.tp.edu.tw/news/8150",
  "origin": { "type": "notice", "ref": "8150" },
  "credibility": "student_summary",
  "days_until": 29
}
```

### WikiPage

```json
{
  "slug": "leave-request",
  "title": "請假怎麼辦",
  "category": "procedure",
  "body_md": "## 一般請假\n1. 用「復興線上請假 APP」…",
  "sources": [
    { "title": "學生請假規定（1130923 修訂）", "url": "https://www.fhjh.tp.edu.tw/system/files/inline-files/05...pdf" },
    { "title": "復興線上請假APP操作說明", "url": "https://www.fhjh.tp.edu.tw/system/files/inline-files/...pdf" }
  ],
  "last_verified_at": "2026-09-01",
  "is_stale": false,
  "credibility": "student_summary",
  "version": 3,
  "updated_at": "2026-09-01T21:00:00+08:00"
}
```

### Link

```json
{
  "id": 7,
  "title": "國中校務行政系統",
  "url": "https://school.tp.edu.tw/Login.action?schNo=331304",
  "category": "system",
  "audience": ["junior"],
  "requires_login": true,
  "on_campus_only": false,
  "help": { "wiki_slug": "school-system-login", "official_url": "https://www.fhjh.tp.edu.tw/feature-center/1666" },
  "origin": { "type": "eschool", "ref": "學生園地" },
  "is_broken": false,
  "last_checked_at": "2026-09-08T00:05:00+08:00"
}
```

### Home（`/home`）

```json
{
  "highlights": [ { "kind": "notice", "nid": 8145, "title": "…", "line": "超越盃數學競賽：週五截止", "url": "/notices/8145" } ],
  "next_exam": { "id": 3, "name": "第一次段考", "starts_on": "2026-10-06", "days_until": 23, "url": "/exam/115-1/1" },
  "deadlines": [ { "title": "社團報名", "deadline_at": "…", "days_until": 2, "url": "/notices/8120" } ],
  "latest_notices": [ /* Notice 精簡版 × 5 */ ],
  "recent_resources": [ /* ExamResource × 4 */ ],
  "counts": { "notices_this_week": 12, "wiki_pages": 14, "links": 18 },
  "meta": { "generated_at": "…", "semester": "115-1", "disclaimer": "…", "last_crawl_at": "…" }
}
```

`highlights` 由 `settings['home.highlights']`（編輯手選）＋ `importance=3` 的註記組成，最多 3 則；`deadlines` 只取 `confirmed` 且 14 天內。

## 4. 查詢參數細節

- `dept`：逗號分隔 slug（`secondary,secondary-bilingual`）。預設不過濾學部但 `include_hidden=false` 會把 `is_hidden=1` 與 `relevance_score=0` 的排除；要看官網全量請帶 `include_hidden=true`。
- `audience`：對象碼；伺服器展開 `junior`→`g7,g8,g9`，且 `all` 永遠符合。
- `tag`：`轉知`、`校外競賽`、`公告` 等由標題前綴抽出的值（`/notices/tags` 不另開端點，`/departments` 回應內附 `tags_seen`）。
- `sort`：`published_at`（預設，新到舊）、`deadline_at`、`relevance`。
- `since`：ISO 時間，回傳該時間後發布或變更（`origin_updated_at`）的公告；供第三方輪詢。
- `q`：走 FTS，只在標題＋主旨＋內文；結果依 rank。

## 5. 寫入端點

### `POST /reports`

```json
{ "target_type": "wiki", "target_id": "leave-request", "reason": "outdated", "message": "請假 APP 已改名", "contact": "", "turnstile_token": "..." }
```

回 `202 Accepted` `{ "data": { "id": 120, "status": "open" } }`。`message` ≤ 1000 字，`contact` 選填。

### `POST /submissions`

```json
{
  "kind": "exam_scope",
  "payload": { "exam_id": 3, "grade": "g8", "subject": "數學", "scope_text": "第一章～2-2", "evidence_url": "" },
  "contact": "",
  "agree_terms": true,
  "turnstile_token": "..."
}
```

`kind` 決定 `payload` schema（OpenAPI 內以 `oneOf` 定義）。回 `202` 與 `submission_id`；投稿者可用 `GET /submissions/{id}?token=` 查狀態（token 隨回應給，不需登入）。

## 6. 管理端 `admin.fhjh.me/v1`

全部要求 Access JWT；角色檢查：`editor` 可改學生整理層、`admin` 可管理 `users`、`settings`、下架與刪除。

| 方法 | 路徑 | 說明 |
| --- | --- | --- |
| GET/PUT | `/notices/{nid}/annotation` | 讀寫註記；PUT 需帶 `version`（樂觀鎖） |
| POST | `/notices/{nid}/hide` · `/unhide` | 人工隱藏 |
| CRUD | `/events`, `/exams`, `/exams/{id}/subjects`, `/exams/{id}/resources`, `/wiki`, `/links`, `/semesters` | 皆有 `status` 流轉：draft → published → archived |
| GET | `/submissions?status=pending` · POST `/submissions/{id}/approve|reject|spam` | 審核；approve 時帶目標表與轉換後資料 |
| GET | `/reports?status=open` · POST `/reports/{id}/resolve` | |
| POST | `/crawl/run` `{ "job": "news-hot" }` · GET `/crawl/runs` | 手動觸發與紀錄 |
| POST | `/pages/{nid}/refetch` · `/notices/{nid}/refetch` | 單頁重抓 |
| GET/PUT | `/settings/{key}` | 首頁精選、聲明、爬蟲暫停 |
| GET | `/audit?table=&row_id=` | |
| GET/PATCH | `/users` | admin only |
| POST | `/cache/purge` | 清 Cache API + 重算 `home:v1` |

所有寫入回應包含 `audit_id`。

## 7. Feed 與匯出

- `GET /events.ics`：標準 iCalendar，`UID` = `event-{id}@fhjh.me`，`X-WR-CALNAME: FHJH.me 學生行事曆`；可用 `?audience=g8` 過濾。
- `GET /feeds/notices.atom`：Atom 1.0，`<entry>` 的 `<link rel="alternate">` 指官網原文、`<link rel="related">` 指 fhjh.me 頁；`<summary>` 用學生摘要（若無則用官方 `summary`）。
- 未來若官網願意，`/sources` 與 `/status` 可作為校方檢視我們抓取行為的窗口。
