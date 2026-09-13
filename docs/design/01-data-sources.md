# 01｜資料來源盤點：www.fhjh.tp.edu.tw 及子網站

盤點日期：2026-09-13。以下所有內容皆為實際請求官網後觀察到的結果；標示「待確認」者是本次從境外環境無法連線、需在台灣網路或校內再測。

## 1. 主站技術事實

| 項目 | 觀察結果 | 對我們的意義 |
| --- | --- | --- |
| CMS | Drupal 10（Varbase 發行版），Apache 2.4 | HTML 結構高度規律，class 命名穩定 |
| 機器介面 | `rss.xml`、`/jsonapi`、`?_format=json` 皆 404／406；`sitemap.xml` 只列首頁 | **沒有現成 API，必須爬 HTML** |
| robots.txt | 允許 `/news`、`/honor`、`/faculty-introduction` 等；**禁止 `/search/`**、`/admin/`、`/user/*` | 用列表頁分頁，不可用站內搜尋當爬取入口 |
| 快取標頭 | `cache-control: max-age=3600, public`、有 `ETag`／`Last-Modified`，但 `If-None-Match` 仍回 200（`Vary: Cookie` 所致） | 以**內容 hash** 判斷是否變更；單一頁面最多每小時抓一次 |
| 內容 ID | `/node/{nid}` 301 到別名（`/news/8150`）；`nid` 全站唯一、遞增 | `nid` 作為主鍵；可用最大 nid 偵測新內容 |
| 附件 | `/system/files/...`（Drupal private files），匿名可下載，`cache-control: private` | 可直接連結；抓全文時需自行快取，不可依賴 CDN |
| 語系 | `/en/...` 有英文站 | 第一版不處理 |

## 2. 內容型態與網址結構

### 2.1 訊息公告 `/news`（第一優先）

- 列表：`/news`（全部）、`/news/{dept}`（單一學部）。每頁 10 筆，`?page=N`（0 起算），目前 155 頁 ≈ 1,550 則。
- 排序：`?sort_bef_combine=published_at_DESC|published_at_ASC`。
- 學部 taxonomy（`field_top_department_target_id`）：

| slug | 名稱 | term id | 官網色碼 |
| --- | --- | --- | --- |
| `preschool` | 幼兒部 | 8 | — |
| `elementary` | 小學部 | 9 | — |
| `elementary-bilingual` | 小學雙語 | 10 | — |
| `secondary` | 中學部 | 11 | `#4C91D6` |
| `secondary-bilingual` | 中學雙語 | 12 | `#C91215` |
| `administration` | 行政單位 | 13 | `#949494` |
| `special` | 特色中心 | 14 | `#949494` |

- 列表列 HTML（穩定選擇器）：

```html
<article about="/news/8150" class="node node--type-news node--view-mode-list-type-a">
  <div class="field--name-field-news-type">
    <div class="field__item" style="background-color:#949494;"><a href="/news/special">特色中心</a></div>
    <div class="field__item" style="background-color:#4C91D6;"><a href="/news/secondary">中學部</a></div>
  </div>
  <h2 class="title"><a href="/news/8150"><span class="field--name-title">【校外競賽】2026 GoSTEAM科技之星競賽</span></a></h2>
  <time datetime="2026-09-11T17:28:15+08:00" class="datetime">2026.09.11</time>
  <div class="view_count">4</div>
</article>
```

- 詳細頁 `/news/{nid}` 可取欄位：

| 欄位 | 選擇器 / 位置 | 備註 |
| --- | --- | --- |
| 標題 | `<h1>` / `og:title`（去掉 ` \| 臺北市私立復興實驗高級中學`） | |
| 發布時間 | `article.node--type-news .field--name-published-at time[datetime]` | ISO 8601 含時區 |
| 瀏覽數 | `.view_count` | |
| 內文 | `.field--name-body` | HTML，含 `<p>`、`<br>`，常見公文條列「一、二、（一）」 |
| 附件 | `.field--name-field-private-file a[href][type]` | `type` 為 MIME |
| 學部 | 列表頁的 `field--name-field-news-type`（詳細頁不重複顯示） | 多值 |
| 摘要 | `meta[name=description]` | 通常是內文第一段 |
| **公文主旨** | 分享區 `a.share.fb[href]` 的 `title=` 參數 | 長於標題，例：「函轉國立臺灣師範大學辦理『2026 GoSTEAM科技之星競賽』相關資訊，請協助轉知並鼓勵學生踴躍報名參加…」；對摘要與截止日抽取很有用 |

- 內容特徵：標題常帶前綴 `【轉知】`、`【校外競賽】`、`【校外競賽通知】`；日期幾乎都是民國年（`115年9月14日（星期一）`）；很多公告只有一個 PDF 沒有內文（例如 `/news/7920` 教科書版本）。
- 混入非學生內容：徵才（`/news/7601`）、採購案（`/news/8143`）、韓語班招生等，需以規則降權（見 05）。

### 2.2 優質成果 `/honor`

- 列表結構同 2.1（15 頁），學部只有四個（無幼兒／行政／特色）。
- 內容：定期考查榮譽榜、模考榮譽榜、比賽得獎名單，**多為含學生姓名的 PDF**。
- 政策：只抓標題／日期／連結，**不抓附件全文、不進全文搜尋**（個資最小化）。

### 2.3 活動花絮 `/gallery`

- `article.node--type-gallery`，有封面圖、標題、日期、瀏覽數。第一版不做，資料表保留 `content_type='gallery'` 即可。

### 2.4 學部介紹 `/faculty-introduction/{dept}`（中學部為主）

中學部 hub 頁 `/faculty-introduction/secondary` 有固定子選單，每個子選單是一個節點列表；節點網址為 `/faculty-introduction/{nid}`。**這是校園 Wiki 與段考中心最重要的官方來源。**

| 子選單 | 路徑 | 重要節點（nid） | 用途 |
| --- | --- | --- | --- |
| 計劃與辦法 | `/secondary/secondary` | **874 中學部行事曆**（每學期一份 PDF，命名 `114-1行事曆(學生版).pdf`）、672 教務處計畫與辦法（評量辦法、補考申請、獎勵辦法、英檢加分）、758 學務處、713 輔導室、4007 圖書館 | 段考日期、成績規定 |
| 學生相關規則 | `/secondary/secondary-1` | **802 學務處規章**（請假規定、線上請假 APP、服儀、行動載具、獎懲、作息時間、遠道證）、800 高中社團規章與表單、813 申訴評議 | Wiki「怎麼辦」 |
| 學生手冊 | `/secondary/student-handbook` | （頁面目前無節點） | |
| 教育專網 | `/secondary/education-network` | 686 防災、476 性平、861 交通安全 | 低 |
| 自主學習專區 | `/secondary/gaozhong...` | 859 | 高中 |
| 學習及升學資訊 | `/secondary/xuexijishengxuezixun` | 1004 國中生、1003 高中生 | Wiki |
| 獎學金與補助款 | `/secondary/jiangxuejinyubuzhukuan` | | Wiki |
| 校外圖書競賽 | `/secondary/librarycontest` | | 事件 |
| 表單下載 | `/secondary/secondary-0` | 669 教務處各項證明申請、705 重大考試補考申請單、801 服務學習時數證明、804 平安保險、4005 圖書館表單 | Wiki／常用連結 |

節點頁本體是一個 `.field--name-body`，內容是 `<a href="/system/files/inline-files/...pdf">` 的清單，偶有 `<table>`。抓取方式：把 body 內每個連結記成一筆 `attachments`（owner = 該節點），標題取連結文字。

### 2.5 行政單位 `/administrative-unit/{unit}`

總務處、人事室、健康中心、教師會、校友會、會計室。健康中心 hub 頁與 2.4 同構（子選單＋節點列表）。對學生價值低，第一版只抓 hub 頁的節點標題與連結，不抓內文。

### 2.6 特色中心 `/feature-center/{center}` 與節點

英語研究、數位學習、探索體驗、體育發展、藝術人文、國際交流。重要節點：

- 1666 國中校務行政系統（學生）、1667 高中校本部、1668 高中雙語部：內含登入網址（`school.tp.edu.tw/Login.action?schNo=331304`）、帳號規則說明、忘記密碼流程 → **Wiki「校務系統怎麼登入」的官方依據，但我們只轉述流程，不放帳密欄位。**
- 942 國際運算思維考古題專區。

### 2.7 家長園地 `/garden/{nid}`

| nid | 標題 | 型態 | 用途 |
| --- | --- | --- | --- |
| 591 | 公佈欄 | 節點列表 | 低 |
| 674 | 家長會行事曆 | **HTML `<table>`**（項目／地點／日期） | 事件（家長會相關，對象＝家長） |
| 100 | 表單下載 | 連結清單 | 低 |
| 98 | 相關網站 | 連結清單 | 常用連結（外部） |
| 101 | APP 介紹 | 說明頁 | Wiki |

### 2.8 E 化校園 `/e-school`（常用連結的主要來源）

- 不是 node，是 ECK entity 清單：`.views-row .eck-entity .field--name-field-link a[href][target]`。
- 分類（`field_e_school_type_target_id`）：學生園地、教師平台、行政管理、選課專區、友善連結。
- 目前 18 個連結，含：翰林 TEAMS、學生 Gmail（`@st.fhjh.tp.edu.tw`）、復興 APP 網頁版（1campus）、三套校務行政系統說明頁、成測/模考成績查詢（`web1/sind`）、學習歷程檔案（cooc）、高中自主學習專區、復興電子報、YouTube、MOD、圖書查詢、英打系統、運算思維考古題、體育常識題庫。
- 這份清單就是計畫書「常用連結 ≤ 20 個、全部人工確認」的起點；抓進 `links` 表後由編輯標記 `audience`、`requires_login`、`on_campus_only`。

### 2.9 其他

- 首頁跑馬燈／置頂（`狂賀…`）：直接連到首頁，無獨立節點，忽略。
- `/contact-us`：學校電話一覽表 PDF（Wiki「行政窗口」來源）。
- `/admissions-information/*`、`/about-fuhsing/*`、`/friendly/*`：與在校生無關，不抓。

## 3. 子網站（fhjh.tp.edu.tw 底下）

DNS 全部落在 `203.72.177.0/24`（校內機房）。**本次從境外只有 `www`（203.72.177.1）可連，其餘皆逾時**，判斷為校方防火牆對非台灣來源封鎖或只開校內。開工第一週需從台灣 IP 與校內網路各測一次並回填此表。

| 主機 | 用途 | 內容公開？ | 需登入？ | 政策 | 狀態 |
| --- | --- | --- | --- | --- | --- |
| `web1.fhjh.tp.edu.tw/calendar/` | 學校行事曆（頁尾連結） | 應公開 | 否 | **優先確認格式**；若是可解析的網頁或可匯出 iCal，就是段考日期最好的來源 | 待確認 |
| `web1.fhjh.tp.edu.tw/sind/` | 成測／模考成績查詢 | 否（個人成績） | 是 | **禁止**抓取與代理；只給連結 | 待確認 |
| `web1.fhjh.tp.edu.tw/KPlayground/` | 幼兒園遊戲場 | 是 | 否 | 不相關 | 待確認 |
| `ebook.fhjh.tp.edu.tw` | 復興電子報 | 是 | 否 | 第二階段考慮索引標題 | 待確認 |
| `jlib.fhjh.tp.edu.tw` | 圖書查詢（限校內） | 校內 | 否 | 只給連結，標 `on_campus_only` | 待確認 |
| `typing.fhjh.tp.edu.tw` | 英打系統 | ? | 可能 | 只給連結 | 待確認 |
| `mod.fhjh.tp.edu.tw` | MOD 視訊隨選 | ? | 可能 | 只給連結 | 待確認 |
| `sites.google.com/gm.fhjh.tp.edu.tw/*` | Google Sites（無障礙空間等） | 是 | 否 | 只給連結 | 可連 |
| `st.fhjh.tp.edu.tw` | 學生 Gmail 網域 | — | 是 | 只給連結 | — |

外部但學生高頻（只做連結，不抓）：`school.tp.edu.tw`（校務行政系統）、`ldap.tp.edu.tw`（單一身分驗證）、`fhjh.teams.com.tw`（翰林 TEAMS）、`1campus.net`（復興 APP）、`e-portfolio.cooc.tp.edu.tw`（學習歷程）。

## 4. 來源分級（決定抓取方式）

| 級別 | 定義 | 例子 | 處理 |
| --- | --- | --- | --- |
| **A 結構化抓取** | 公開、無登入、列表＋詳細頁規律 | `/news`、`/honor`（僅標題）、`/e-school`、`/faculty-introduction/*` 節點、`/garden/674` | 排程爬取 → 正規化 → API |
| **B 半自動** | 公開但內容在 PDF | 行事曆 PDF、學務處規章 PDF、評量辦法 PDF | 記錄附件 metadata；全文抽取與結構化（段考日期）第一版由編輯人工輸入，第二階段再自動化 |
| **C 只導覽** | 需登入、校內限定、或屬個資 | 校務系統、成績查詢、Gmail、圖書館 | 只存 `links`，附官方說明頁連結 |
| **D 不碰** | 與學生無關或有風險 | 招生、捐款、徵才、採購 | 抓進來也標 `audience=none` 並隱藏，或直接不抓 |

## 5. 抓取禮儀（寫進爬蟲設定，不可改）

- User-Agent：`fhjh.me-bot/1.0 (+https://fhjh.me/about/bot; 學生非官方整理)`。
- 併發 1、請求間隔 ≥ 1 秒、單次排程總請求 ≤ 60。
- 同一 URL 抓取間隔 ≥ 60 分鐘（對齊官網 `max-age=3600`），僅 `/news?page=0` 可到 30 分鐘。
- 全站回填（backfill）只做一次，於夜間、每分鐘 ≤ 20 頁。
- 遇到 5xx 或連續逾時 → 指數退避並暫停該來源 1 小時。
- 尊重 robots.txt；不進 `/search/`、`/user/`、`/admin/`。
- 不下載 `/honor` 附件；其他附件只在需要抽全文時下載一次並存 hash。
