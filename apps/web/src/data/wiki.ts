import type { WikiPage } from './types'

export const wikiPages: WikiPage[] = [
  {
    slug: 'leave-request',
    title: '請假怎麼辦',
    category: '怎麼辦',
    summary: '用復興線上請假 APP 送出，再依假別附證明。',
    lastVerified: '2026-09-01',
    body: [
      '一般請假：用復興 APP／1campus 的「線上請假」送出。',
      '依假別附證明（病假診斷證明、事假家長說明等）。導師與學務處核准後才算完成。',
      '當天臨時請假：先由家長打電話到學務處或導師，再用 APP 補件。',
      '本頁不取代官方規定。銷假、曠課認定都以《學生請假規定》原文為準。',
    ],
    sources: [
      { title: '學生請假規定（1130923 修訂）', url: 'https://www.fhjh.tp.edu.tw/faculty-introduction/802' },
      { title: '學務處規章', url: 'https://www.fhjh.tp.edu.tw/faculty-introduction/802' },
    ],
  },
  {
    slug: 'makeup-exam',
    title: '重大考試補考申請',
    category: '怎麼辦',
    summary: '段考缺考要填補考申請單，交給教務處。',
    lastVerified: '2026-09-01',
    body: [
      '重大考試（段考等）缺考，依教務處規定填「重大考試補考申請單」。',
      '表單在中學部「表單下載」。核准與否以教務處為準。',
    ],
    sources: [
      { title: '重大考試補考申請單', url: 'https://www.fhjh.tp.edu.tw/faculty-introduction/705' },
      { title: '考場規則（教務處計畫與辦法）', url: 'https://www.fhjh.tp.edu.tw/faculty-introduction/672' },
    ],
  },
  {
    slug: 'school-system-login',
    title: '校務系統怎麼登入',
    category: '系統',
    summary: '國中用單一身分驗證；帳號規則以官方說明頁為準。',
    lastVerified: '2026-09-01',
    body: [
      '國中校務行政系統入口在臺北市校務系統，學校代碼 331304。',
      '學生帳號規則與忘記密碼流程，只看官方說明頁，不要把帳密傳給任何人（包含本站）。',
      '本站不代理登入、不收帳密。',
    ],
    sources: [
      { title: '國中校務行政系統說明（學生）', url: 'https://www.fhjh.tp.edu.tw/feature-center/1666' },
      { title: '高中校本部校務行政系統說明', url: 'https://www.fhjh.tp.edu.tw/feature-center/1667' },
    ],
  },
  {
    slug: 'transcript',
    title: '成績／在學證明怎麼申請',
    category: '怎麼辦',
    summary: '中學教務處各項證明申請。',
    lastVerified: '2026-09-01',
    body: [
      '在學證明、成績證明等，走中學教務處「各項證明申請」。',
      '需要正本時，依表單欄位辦理，不要只截圖本站。',
    ],
    sources: [
      { title: '中學教務處各項證明申請', url: 'https://www.fhjh.tp.edu.tw/faculty-introduction/669' },
    ],
  },
  {
    slug: 'uniform',
    title: '服裝儀容',
    category: '規定',
    summary: '服儀規定以學務處最新 PDF 為準。',
    lastVerified: '2026-09-01',
    body: [
      '服裝儀容規定會修訂。看學務處規章裡的最新「學生服裝儀容規定」。',
    ],
    sources: [
      { title: '學務處規章', url: 'https://www.fhjh.tp.edu.tw/faculty-introduction/802' },
    ],
  },
  {
    slug: 'phone',
    title: '行動載具（手機）',
    category: '規定',
    summary: '校內禁手機時段依學務處規範。',
    lastVerified: '2026-09-01',
    body: [
      '校園行動載具使用管理規範在學務處規章。上課期間以學校規定為準。',
      '所以本站預設你是放學後或在家打開，不是上課中滑。',
    ],
    sources: [
      { title: '學務處規章', url: 'https://www.fhjh.tp.edu.tw/faculty-introduction/802' },
    ],
  },
  {
    slug: 'distance-pass',
    title: '遠道證',
    category: '怎麼辦',
    summary: '遠道證申請要點在學務處規章。',
    lastVerified: '2026-09-01',
    body: [
      '住得比較遠、需要相關證明時，看「學生遠道證申請要點」。',
    ],
    sources: [
      { title: '學務處規章', url: 'https://www.fhjh.tp.edu.tw/faculty-introduction/802' },
    ],
  },
  {
    slug: 'english-test-bonus',
    title: '英檢加分／獎勵登記',
    category: '怎麼辦',
    summary: '通過英檢後依教務處當學期表單登記。',
    lastVerified: '2026-09-01',
    body: [
      '英檢獎勵辦法與當學期加分注意事項在教務處計畫與辦法。',
      '取得證明後，依該學期公布的表單上傳，不要只傳給同學。',
    ],
    sources: [
      { title: '教務處計畫與辦法', url: 'https://www.fhjh.tp.edu.tw/faculty-introduction/672' },
    ],
  },
  {
    slug: 'learning-portfolio',
    title: '高中學習歷程檔案',
    category: '系統',
    summary: '走臺北市學習歷程系統，不是本站。',
    lastVerified: '2026-09-01',
    body: [
      '高中學習歷程在臺北市系統。本站只提供入口，不代填、不存檔案。',
    ],
    sources: [
      { title: '臺北市高中學習歷程檔案系統', url: 'https://e-portfolio.cooc.tp.edu.tw/Portal.do' },
    ],
  },
  {
    slug: 'contacts',
    title: '學校電話一覽',
    category: '窗口',
    summary: '行政窗口看官方電話一覽表。',
    lastVerified: '2026-09-01',
    body: [
      '總機 02-27715859。各處室分機以官方「學校電話一覽表」PDF 為準。',
      '資訊中心分機 161、162（校務系統帳號問題，官方說明頁有寫）。',
    ],
    sources: [
      { title: '聯絡我們／電話一覽', url: 'https://www.fhjh.tp.edu.tw/contact-us' },
    ],
  },
]
