# FHJH.me 前端

版本 A（白底＋深藍）。本機：

```bash
npm install
npm run dev
```

http://localhost:5173

| 路徑 | 內容 |
| --- | --- |
| `/` | 段考日期／考程有沒有公布 |
| `/exam` | 段考中心（未公布／已發布） |
| `/wiki` | 校園 Wiki 主頁＝中文維基百科該校條目 |
| `/wiki/:slug` | 請假、補考等怎麼辦 |
| `/links` | 常用連結 |
| `/notices` | 官方文件（不轉貼競賽） |
| `/events` | 行事曆入口 |
| `/admin` | 上傳 .txt 或貼考程 → JSON → 發布到 `/api/exam`（Cloudflare KV） |

Workers 靜態資源 + `worker.ts` 的 `/api/exam`。SPA 路由靠 `not_found_handling`。
