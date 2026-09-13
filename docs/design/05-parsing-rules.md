# 05｜解析與正規化規則（rules_version = 1）

規則分兩類：**確定性規則**（純字串處理，結果直接寫入正規化層）與**啟發式規則**（結果只能寫成 `auto`／候選，需編輯確認才會出現在首頁）。所有規則需有對應的固定 HTML 樣本測試（`fixtures/` 內存官網頁面快照，測試不打官網）。

## 1. 列表頁 → source_documents

| 步驟 | 規則 |
| --- | --- |
| 列舉 | 對每個 `article[about]`：`nid` = `about` 最後一段整數；`content_type` 由 class `node--type-{x}` 取得 |
| 新增判定 | `nid` 不在 `source_documents` → 新文件，入 Queue 抓詳細頁 |
| 更新判定 | 已存在者：比對列表上的 `title`、`time[datetime]`、學部集合；任一不同 → 入 Queue；相同只更新 `last_seen_at`、`view_count` |
| 早停 | `news-hot` 任務在連續 10 筆皆為已知且未變時停止翻頁 |
| 學部 | `.field--name-field-news-type a[href]` 的最後一段 = `departments.slug` |

## 2. 詳細頁 → notices / pages

| 欄位 | 規則 |
| --- | --- |
| `title` | `og:title` 去掉 ` | 臺北市私立復興實驗高級中學`，再 `trim`、全形空白→半形、連續空白→1 |
| `tags_json` / `title_clean` | 從標題開頭反覆匹配 `^【([^】]{1,12})】\s*`，每個括號內容進 `tags`（去掉尾綴「通知」→ `校外競賽通知` 與 `校外競賽` 同義，記錄 `校外競賽`）；剩下為 `title_clean` |
| `subject` | `a.share.fb[href]` 的 query `title=` 值 URL-decode；若與 `title` 相同則設 NULL |
| `summary` | `meta[name=description]` |
| `body_html` | `.field--name-body` 內 HTML 經白名單清洗：允許 `p br strong em u ol ul li a table thead tbody tr td th h3 h4 img`；`a[href]` 相對路徑轉絕對、加 `rel="noopener"`；移除 `style`、`class`、`on*`；`img` 只保留 `src alt` |
| `body_text` | `body_html` 去標籤、`&nbsp;`→空白、多個換行壓成一個 |
| `attachments` | `.field--name-field-private-file a[href]` 與 `body` 內所有 `a[href*="/system/files/"]`、`a[href$=".pdf|.doc|.docx|.xls|.xlsx|.odt|.ppt|.pptx"]`；`label` = 連結文字或檔名 URL-decode |
| `published_at` | `.field--name-published-at time[datetime]` |
| `view_count` | `.view_count` 整數 |
| `content_hash` | SHA-256(`title` + `body_text` + 排序後附件 URL 列表) |
| 404 | `source_documents.status='gone'`；不刪 `notices` |

`pages`（學部介紹等）額外記錄 `hub_path`/`hub_label`：由抓取時所屬的 hub 頁子選單（`.breadcrumb` 與側邊選單 active 項）帶入。

## 3. 民國年與日期

台灣公文全部民國年，轉西元 = 民國 + 1911。支援格式（依序嘗試，全部轉為 `Asia/Taipei`）：

| 樣式 | 例 | 結果 |
| --- | --- | --- |
| `(\d{2,3})年(\d{1,2})月(\d{1,2})日` | `115年10月12日` | `2026-10-12` |
| `(\d{2,3})[./-](\d{1,2})[./-](\d{1,2})` | `115/8/25`、`115.10.12` | `2026-08-25` |
| 7 碼 `(\d{3})(\d{2})(\d{2})` | `1150313` | `2026-03-13` |
| 學年度 `(\d{2,3})學年度第([12一二])學期` / `(\d{3})-([12])` | `114學年度第1學期`、`113-2` | `semester_id = '114-1'` |
| 時間尾綴 `(上午|下午|中午)?\s*(\d{1,2})[:：時](\d{2})?分?` | `下午5時止`、`上午10:00` | `17:00`、`10:00`；「下午」且 hour < 12 → +12 |
| 相對詞 | `本週五`、`即日起` | **不解析**（需編輯） |

西元年 `20\d{2}` 亦接受。任何無法判定年份的日期（如只有「10月12日」）→ 依 `published_at` 所在學年推斷，並將 `deadline_confidence` 設為 `auto`。

## 4. 截止日候選（啟發式 → `auto`）

在 `subject` + `body_text` 中依優先序找第一個命中：

1. `報名(時間|日期|期間)[：:]?\s*自?(日期A)(（[^）]*）)?\s*(起)?\s*至\s*(日期B)(（[^）]*）)?\s*(時間)?\s*止?` → 截止 = 日期B(+時間)
2. `(截止|收件截止|報名截止|繳交期限|繳交截止)[日期時間]*[：:為]?\s*(日期)(時間)?`
3. `(於|請於|最遲於)\s*(日期)(時間)?\s*(前|以前|之前)`
4. `(日期)\s*(前|以前)\s*(繳交|送交|回覆|報名|完成)`
5. `至\s*(日期)(時間)?\s*止` （最後才用，誤判率高）

結果寫 `notice_annotations.deadline_at`、`deadline_confidence='auto'`，並在 admin 待辦清單標示「有候選截止日」。**`auto` 不會出現在 `/deadlines`、首頁「快到期」與 ICS。** 編輯確認後改 `confirmed`。若 `deadline_at` 早於 `published_at` → 丟棄候選。

## 5. 對象候選（啟發式 → 建議值，編輯可一鍵接受）

| 訊號 | 對象 |
| --- | --- |
| 學部含 `secondary` 且不含 `secondary-bilingual` | `junior`,`senior`（校本部） |
| 學部含 `secondary-bilingual` | `bilingual` |
| 學部只有 `preschool`/`elementary*` | `none`（隱藏） |
| 學部只有 `administration` 且標題含 `徵才|甄選|採購|招標|評選|標案|會計|人事` | `staff` + `is_hidden=1` |
| 文中 `國中|七年級|八年級|九年級|國[一二三]` | `g7`/`g8`/`g9`（命中年級者精確，否則 `junior`） |
| 文中 `高中|高級中等學校|十[一二]?年級|高[一二三]` | `g10`/`g11`/`g12` 或 `senior` |
| 文中 `全校|全體學生|所有同學` | `all` |
| 文中 `家長` 且無學生指涉 | `parents` |
| 標題 `【轉知】` 且 `subject` 含 `教師|教職員|研習` | `staff` |

## 6. 相關度分數 `relevance_score`（0–1，決定預設列表與首頁排序）

```
score = 0.5
+0.3  學部含 secondary 或 secondary-bilingual
+0.1  標題有【校外競賽】【競賽】【活動】【講座】【報名】
+0.1  有截止日候選
-0.5  學部只有 preschool / elementary*（→ 上限 0）
-0.5  命中 staff 規則
-0.2  標題含 招生簡章|外語班|才藝班 且非本校（轉知）
-0.1  每超過 90 天（自 published_at 起）遞減，最低 0.1
score = clamp(0, 1)；score == 0 或 is_hidden → 預設列表不顯示
```

編輯可在 admin 覆寫（`is_hidden` 手動 / `importance`）。

## 7. E 化校園 → links

- 每個 `.eck-entity a[href]`：`title` = 連結文字；`origin='eschool'`；`origin_ref` = 該列所屬分類（頁面篩選器的值）。
- 自動標記：標題含 `限校內|校內使用` → `on_campus_only=1`；含 `登入|帳密|帳號|Gmail|校務行政|TEAMS|1campus|學習歷程` → `requires_login=1`；含 `教師|教職員` → `audience=['staff']`。
- 分類建議：`校務行政|成績|學習歷程|APP|Gmail` → `system`；`TEAMS|考古題|題庫|自主學習|JSTOR` → `learning`；`圖書|電子刊物|MOD|Youtube` → `library`；其他 → `external`。
- 新連結預設 `status='draft'`，由編輯發布；官網移除的連結 → `status='archived'`。

## 8. 家長會行事曆表格（`/garden/674`）→ events

- 對每個 `<table>`：表頭前一個 `<p>`／`<h*>` 文字含 `(\d{3})學年度第([12])學期` → 學期；每列三欄「項目／地點／日期」。
- `title` = 項目；`location` = 地點；`starts_at` = 日期＋時間（§3）；`category='meeting'`；`audience=['parents']`；`origin_type='garden_calendar'`；`origin_ref=674`；`credibility='student_summary'`；`status='published'`（此表格資訊明確，允許自動發布）。
- 以 `(origin_type, origin_ref, title, starts_at)` 去重。

## 9. 行事曆 PDF（`/faculty-introduction/874`）→ semesters / exams

- 第一版：爬蟲只建立 `attachments`（owner=page 874）並在 admin 顯示「新學期行事曆 PDF 出現，請建立學期與段考」。
- 第二版：離線工具（Node + pdfjs，跑在 GitHub Actions）抽文字，找 `(第[一二三]次)?(段考|定期考查|期中考|期末考|模擬考|複習考)` 所在列的日期，產生 `exams` 草稿（`status='draft'`, `credibility='unverified'`），編輯確認後發布。

## 10. 榮譽榜（`/honor`）

- 只寫 `pages`（`section='honor'`）的 `title`、`published_at`、`url`、`view_count`；`body_html/body_text` 皆 NULL；`attachments.no_index=1`；不進 `search_index` 的 `body`。
- 允許用途：段考中心可連到「115學年度定期考查榮譽榜」原文；不做任何排名或彙整。

## 11. 變更與失效

| 情況 | 處理 |
| --- | --- |
| `content_hash` 變動 | `notices.content_version+1`、`origin_updated_at=now`；若 `notice_annotations` 存在且 `status='published'` → 標 `needs_review`（以 `settings` 內待辦清單實作）並通知編輯 |
| 官網 404 | `source_documents.status='gone'`；API 回 `is_gone=true`；首頁與 `/deadlines` 排除 |
| 附件 URL 變動 | 舊附件 `last_seen_at` 停止更新；超過 30 天未見 → 不再輸出 |
| 規則升版 | 提高 `rules_version`，admin 觸發「重算正規化層」：從 R2 原始快照重跑 parser，不重抓官網 |
