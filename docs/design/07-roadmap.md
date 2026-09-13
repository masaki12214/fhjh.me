# 07｜里程碑與待確認事項

里程碑以「交付物與驗收條件」定義，不以日曆時間定義。

## M0｜資料管線驗證（先證明 API 做得出來）

交付：
- `apps/ingest`：抓 `/news?page=0..4` → `source_documents` → `notices` / `notice_departments` / `attachments`；HTML 樣本快照測試通過。
- `apps/api`：`GET /v1/notices`、`GET /v1/notices/{nid}`、`GET /v1/status`。
- D1 migration `0001_init.sql`（= `db/schema.sql`）。

驗收：
- 對 30 則近期公告人工比對：標題、學部、日期、附件 100% 一致；`tags` 抽取正確率 ≥ 95%。
- 截止日候選（`auto`）在有明確「至…止」句型的公告命中率 ≥ 80%，且無一被輸出到 `/deadlines`。
- 官網每小時請求數 ≤ 10（`news-hot` 早停生效）。

## M1｜MVP（計畫書 §10 必做）

交付：
- 抓取：`/honor`（標題）、`/faculty-introduction/secondary/*` 全部節點、`/e-school`、`/garden/674`、`/contact-us`；`pages-weekly`、`link-check` 排程。
- API：`/home`、`/deadlines`、`/events`、`/events.ics`、`/semesters`、`/exams*`、`/wiki*`、`/links`、`/pages*`、`/search`、`/departments`、`/sources`、`/feeds/notices.atom`、`POST /reports`。
- Admin：註記編輯（含候選截止日一鍵確認）、學期／段考／科目範圍、Wiki（含版本）、連結審核、設定首頁精選、手動重抓、審核紀錄。
- 前端：主頁（06）、`/exam`、`/notices`、`/wiki`、`/links`、`/events`、回報表單。
- 內容：115-1 至少一個年級段考完整；Wiki ≥ 10 篇（請假、補考、證明申請、服儀、行動載具、校務系統登入、學習歷程、社團、遠道證、行政窗口電話）；連結 ≤ 20 全部人工確認；近期公告摘要 ≥ 5。

驗收：計畫書附錄 A 全部勾選；`GET /v1/home` p95 < 300 ms；Lighthouse 行動版 Performance ≥ 90。

## M2｜投稿與治理

交付：`POST /submissions`（六種 kind）、審核佇列、`exam_resources` 上線、`contact` 自動清除、濫用限流、Discord／Email 告警。

驗收：投稿→審核→發布全程有 `audit_log`；垃圾投稿測試 100 筆全部被 Turnstile／限流擋下或進 `spam`。

## M3｜擴張

- 行事曆 PDF 自動抽取段考日期（05 §9）。
- `ebook.fhjh.tp.edu.tw` 電子報標題索引（若可連線且公開）。
- `web1/calendar` 若為可解析格式，成為 `events` 的官方來源。
- 搜尋：同義詞（段考＝定期考查）、無結果關鍵字統計。
- 英文站 `/en` 對雙語部。

## 開工前必須確認（會影響設計）

| # | 事項 | 為什麼重要 | 怎麼確認 |
| --- | --- | --- | --- |
| 1 | `web1.fhjh.tp.edu.tw/calendar/` 的實際格式與可及性 | 若是結構化行事曆，段考日期不必人工輸入 | 從台灣家用網路與校內各開一次；存 HTML／截圖到 `fixtures/` |
| 2 | 其他子網域（ebook/jlib/typing/mod）是否只限校內 | 決定 `links.on_campus_only` 與是否索引電子報 | 同上 |
| 3 | 官網對爬蟲的態度 | 避免被封鎖、也符合「不被誤認官方」 | 上線前以學生身分向資訊中心（分機 161/162）說明：只讀公開頁、頻率、UA、聯絡方式；把 `/sources` 頁給對方看 |
| 4 | 附件 `cache-control: private` 是否意味不希望被轉載 | 決定是否鏡像 PDF | 預設**不鏡像**，只連結；需要全文時抽文字後即刪原檔 |
| 5 | 榮譽榜／得獎名單的呈現界線 | 個資 | 預設只列標題連回官網；任何含姓名的內容不進搜尋 |
| 6 | 管理員登入方式 | 不自建密碼 | Cloudflare Access + 指定 Gmail（可用 `@st.fhjh.tp.edu.tw` 網域白名單，但需確認學生帳號可用於第三方 OAuth） |
| 7 | 網域 | `api.fhjh.me`、`admin.fhjh.me` 需在 Cloudflare DNS 建 CNAME 到 Workers | 已有 `fhjh.me` 在 Cloudflare（計畫書 §08） |

## Repo 目錄規劃（實作時建立）

```
fhjh.me/
├─ apps/
│  ├─ ingest/        Workers：排程 + Queue 消費 + parsers/
│  ├─ api/           Workers：公開 API + feeds
│  ├─ admin/         Workers：管理 API（Access 保護）+ 極簡後台 UI
│  └─ web/           Pages：前端
├─ packages/
│  ├─ schema/        由 api/openapi.yaml 產生的 TS 型別與 zod
│  └─ rules/         05 的純函式（日期、標題、截止日、對象、分數）+ 測試
├─ db/
│  ├─ schema.sql
│  └─ migrations/
├─ api/openapi.yaml
├─ fixtures/         官網 HTML 快照（測試用，不打官網）
└─ docs/design/      本設計稿
```
