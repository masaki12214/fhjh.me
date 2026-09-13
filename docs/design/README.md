# FHJH.me 設計稿（v0.1）

> 目的：把《FHJH.me 學生資訊平台計畫書 v1.0》落成可以直接開工的技術設計。
> 一切資料來源以 `https://www.fhjh.tp.edu.tw/` 及其底下各子網站為準，由我們的爬蟲整理後以 API 形式對外提供，前端（主頁、段考中心、公告、Wiki、常用連結）全部只吃這組 API。

## 文件索引

| 檔案 | 內容 | 讀者 |
| --- | --- | --- |
| [01-data-sources.md](01-data-sources.md) | 官網與子網站**實際盤點**：網址結構、內容型態、HTML 選擇器、可抓／不可抓、限制 | 爬蟲、內容編輯 |
| [02-architecture.md](02-architecture.md) | 系統架構（Cloudflare Workers / D1 / KV / R2 / Pages）、抓取排程、快取、安全 | 全體 |
| [03-data-model.md](03-data-model.md) | 資料模型：原始層 → 正規化層 → 學生整理層；可信度標籤；對應 [`db/schema.sql`](../../db/schema.sql) | 後端、編輯 |
| [04-api.md](04-api.md) | 公開 API v1 與管理 API 規格、回應格式、快取、限流；機器可讀版在 [`api/openapi.yaml`](../../api/openapi.yaml) | 前端、後端 |
| [05-parsing-rules.md](05-parsing-rules.md) | 解析與正規化規則：標題前綴、民國年、截止日／對象抽取、去重、下架偵測 | 爬蟲、編輯 |
| [06-homepage.md](06-homepage.md) | 主頁低保真線框（桌面／手機）＋每個區塊對應的 API 欄位 | 前端、設計 |
| **可點的前端設計稿** | [`design/mockups/index.html`](../../design/mockups/index.html) — A 儀表板／B 校刊／C App 三個版本 | 決策用 |
| [07-roadmap.md](07-roadmap.md) | 里程碑、驗收條件、開工前待確認事項 | 全體 |

## 三個最重要的設計決策

1. **官網沒有任何機器介面**（無 RSS、無 JSON:API、sitemap 只有首頁、`?_format=json` 回 406），所以「API」必須由我們自己爬 HTML 建出來。官網是 Drupal 10，HTML 結構非常規律（見 01），用 Workers 的 `HTMLRewriter` 就能穩定解析。
2. **官方內容與學生整理內容在資料層就分開。** `notices`（官方原文的正規化副本）永遠不被人工修改；學生摘要、對象、截止日放在 `notice_annotations`。API 回應同時帶兩者並標示 `credibility`，前端才能做出計畫書要求的「官方原文／學生整理／學生投稿／待確認」四種標籤。
3. **只碰公開、不需登入、不含個資的內容。** 成績查詢（`web1/sind`）、校務行政系統、Gmail、圖書館館內系統等一律只做導覽連結，不代理登入、不抓取、不存任何帳密。榮譽榜等含學生姓名的內容只索引標題，不索引附件全文。

## 名詞

| 名詞 | 定義 |
| --- | --- |
| 來源（source） | 一個被抓取的網站或系統，例如 `www.fhjh.tp.edu.tw` |
| 來源文件（source document） | 來源上的一個 URL 快照（含 hash、抓取時間） |
| 公告（notice） | 官網「訊息公告」一則，正規化後的官方內容 |
| 註記（annotation） | 編輯對公告加上的學生版摘要／對象／截止日／要做什麼 |
| 事件（event） | 有時間的事情：截止日、考試、活動；可由公告推導或人工建立 |
| 可信度（credibility） | `official` / `student_summary` / `submission` / `unverified` |
| nid | 官網 Drupal node id，全站唯一（`/news/8150`、`/honor/8113`、`/faculty-introduction/874` 共用同一組號碼），是我們對官網內容的主鍵 |
