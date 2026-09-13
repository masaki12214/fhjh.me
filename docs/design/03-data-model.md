# 03｜資料模型

完整 DDL 在 [`db/schema.sql`](../../db/schema.sql)（已用 SQLite 3.45 驗證可建立，FTS5 trigram 中文查詢可用）。本文只講設計理由與資料流。

## 1. 三層分離

```
官網 HTML ──► 原始層 source_documents (+ R2 原始快照)
                 │  parser（05 規則）
                 ▼
             正規化層 notices / pages / attachments / departments      ← 官方原文，人工不可改
                 │  編輯在後台加註
                 ▼
             學生整理層 notice_annotations / events / exams / wiki / links ← 帶 credibility + status
                 │
                 ▼
             API v1（04）：把「官方」與「學生整理」合併輸出並逐欄標示來源
```

為什麼不直接在 `notices` 上加欄位讓編輯改？

- 官網內容會改；重抓時若覆蓋 `notices`，會把編輯的截止日洗掉。分表後重抓只動正規化層。
- 計畫書要求每則資訊清楚區分「官方原文／學生整理／學生投稿／待確認」。分表讓 API 能逐欄回答「這個欄位是誰說的」。
- 出錯時可只重跑正規化（改 `rules_version`）而不影響任何人工資料。

## 2. 主鍵策略

| 資料 | 主鍵 | 理由 |
| --- | --- | --- |
| 官網節點（公告、頁面、榮譽榜） | 官網 `nid` | 全站唯一、穩定、可從 `/node/{nid}` 反查；也是 API 對外 ID（`/v1/notices/8150` 與官網 `/news/8150` 對得起來） |
| 非節點內容（E 化校園連結、行事曆表格列） | 自增 id + `url` 唯一 | 官網無 ID |
| 學期 | `'115-1'` 字串 | 學生語言，URL 友善 |
| 我們自建內容（事件、Wiki、段考） | 自增 id；Wiki 另有 `slug` | |

## 3. 各表用途速查

### 原始層

- `sources`：來源登記與抓取政策（tier A–D、最小間隔）。
- `source_documents`：每個 URL 一列。`content_hash` 變動 → `last_changed_at` 更新、正規化層版本 +1。`status='gone'` 代表官網已移除（回 404），前端顯示「官方已下架」但保留紀錄。
- `crawl_runs`：每次排程統計，供 `/v1/status` 與告警。

### 正規化層

- `notices`：公告本體。`title_clean` / `tags_json` 由標題前綴切出；`subject` 是官網分享連結裡的公文主旨（常比標題完整）；`relevance_score` 與 `is_hidden` 由規則決定，讓徵才、採購、幼兒部內容不佔學生版面。
- `notice_departments`：多對多（一則公告常同時標中學部＋中學雙語）。
- `attachments`：所有附件與 body 內的檔案連結。`no_index=1` 的（榮譽榜）永不下載、不進搜尋。全文抽取結果放 R2，不塞 D1。
- `pages`：學部介紹／行政單位／特色中心／家長園地／榮譽榜的節點。`hub_path`+`hub_label` 保留官網的分類脈絡（例如「中學部 → 學生相關規則」），Wiki 引用時可直接顯示。

### 學生整理層

- `notice_annotations`：與 `notices` 一對一。`deadline_confidence`：`auto`（規則抽出，**不上首頁**）、`confirmed`（編輯確認，才進「快到期」）。`importance=3` 且 `status=published` 者就是首頁「本週重點」候選。
- `semesters` / `exams` / `exam_subjects` / `exam_resources`：段考中心。第一版 `exams` 與 `exam_subjects` 由編輯依行事曆 PDF 人工輸入，`source_url` 指向該 PDF。
- `events`：所有有日期的東西的統一視圖來源。`origin_type`/`origin_ref` 記錄它從哪來（某則公告、某個段考、家長會行事曆表格…）。ICS 與首頁倒數都讀這張表。
- `wiki_pages` / `wiki_revisions`：`sources_json` 強制記錄依據的官方文件；`last_verified_at + stale_after_days` 過期則 API 回 `is_stale=true`，前端顯示黃色警示。
- `links`：常用連結。`origin='eschool'` 的由爬蟲建立（status 預設 draft），編輯補 `audience`、`requires_login`、`on_campus_only`、`help_wiki_slug` 後發布。`link-check` 排程更新 `is_broken`。

### 治理

- `users`：只存 Access 給的 email 與角色，沒有密碼。
- `submissions`：投稿一律先進這張表，審核通過才轉成 `exam_resources` / `events` / `wiki_revisions`。`contact` 30 天清除。
- `reports`：頁面上的「回報錯誤／侵權／個資」。
- `audit_log`：所有 admin 寫入的前後快照。
- `settings`：首頁精選、非官方聲明文字、爬蟲暫停開關等。

## 4. 可信度標籤對應

| `credibility` | 意義 | 哪些表會出現 | 前端呈現（計畫書 §05） |
| --- | --- | --- | --- |
| `official` | 直接來自官網／政府 | `notices`、`pages`、`attachments`（隱含，API 輸出時標上） | 綠色「官方原文」 |
| `student_summary` | 依公開來源重寫 | `notice_annotations`、`exams`、`events`、`wiki_pages`、`links` | 藍色＋原文連結 |
| `submission` | 投稿者提供、已基本審核 | `exam_resources`、部分 `events` | 灰／紫色 |
| `unverified` | 來源不足或可能過期 | 任何學生整理層資料；Wiki 過期自動視為此級 | 黃色警示，不上首頁精選 |

## 5. 對象（audience）字彙

固定字串陣列，API 與 DB 一致：

`g7` `g8` `g9`（國中）· `g10` `g11` `g12`（高中）· `junior`（=g7–g9）· `senior`（=g10–g12）· `bilingual`（雙語部）· `all`（全體學生）· `parents` · `staff` · `none`（與學生無關）

## 6. 資料生命週期

| 資料 | 建立 | 更新 | 到期／封存 |
| --- | --- | --- | --- |
| 公告 | 爬蟲 | 爬蟲（hash 變動） | 發布 > 180 天自動 `relevance_score` 降權；官網 404 → `gone` |
| 註記 | 編輯 | 編輯 | `deadline_at` 過後自動離開「快到期」，資料保留 |
| 事件 | 編輯／規則 | 編輯 | 結束後保留供搜尋，不再出現在列表預設範圍 |
| 段考 | 編輯（每學期初） | 編輯 | 學期結束 `semesters.is_current=0`，頁面轉為封存 |
| Wiki | 編輯 | 編輯（留版本） | 超過 `stale_after_days` 未確認 → `is_stale` |
| 連結 | 爬蟲＋編輯 | link-check | 連續 3 次失敗 → `is_broken=1`，前端隱藏 |
| 投稿 | 匿名 | 審核者 | 決定後 90 天刪 `payload_json` 中的檔案、30 天刪 `contact` |
