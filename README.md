# fhjh.me

學生建立、學生維護、面向全校學生的非官方校園資訊平台（臺北市私立復興實驗高級中學）。

> 本站為學生製作之非官方網站；資料來源為 [學校官網](https://www.fhjh.tp.edu.tw/) 及其子網站的公開頁面，重要資訊請以官方原文為準。

## 網站（成品）

```bash
cd apps/web
npm install
npm run dev
```

開啟 http://localhost:5173 。

- 首頁：第一次段考何時、考程在不在
- 校園 Wiki 主頁：中文維基百科「臺北市私立復興實驗高級中學」
- 後台 `/admin`：上傳 .txt 或貼考程文字 → 轉 JSON → 發布（存在這個瀏覽器）
- 部署：`cd apps/web && npm run deploy`（Cloudflare Workers 靜態資產 + `fhjh.me`）

## 文件

- 設計稿：[`docs/design/`](docs/design/README.md)
  - 資料來源盤點、系統架構、資料模型、API、解析規則、主頁線框、里程碑
- D1 schema：[`db/schema.sql`](db/schema.sql)
- OpenAPI：[`api/openapi.yaml`](api/openapi.yaml)

## 授權

程式碼採 AGPL-3.0（見 [LICENSE](LICENSE)）。官網內容之著作權屬原權利人，本專案僅做索引、摘要與連結。
