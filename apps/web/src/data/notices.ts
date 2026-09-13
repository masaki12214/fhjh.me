import type { Notice } from './types'

/** 首頁不列出這些。公告頁只放真正跟在校生日常有關的。 */
export const notices: Notice[] = [
  {
    nid: 7920,
    title: '115學年度國中與高中使用教科書版本',
    summary: '教科書版本說明 PDF。',
    publishedAt: '2026-06-17',
    departments: ['中學部', '中學雙語'],
    url: 'https://www.fhjh.tp.edu.tw/news/7920',
    studentRelevant: true,
  },
  {
    nid: 874,
    title: '中學部行事曆（學生版）',
    summary: '115-1 段考日寫在這份 PDF。',
    publishedAt: '2021-08-27',
    departments: ['中學部'],
    url: 'https://www.fhjh.tp.edu.tw/faculty-introduction/874',
    studentRelevant: true,
  },
]
