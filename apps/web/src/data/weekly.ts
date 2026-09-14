import type { WeeklySlot, WeeklyWeek } from './types.ts'

function slot(
  grade: WeeklySlot['grade'],
  date: string,
  period: WeeklySlot['period'],
  subject: string,
  extra: Partial<Omit<WeeklySlot, 'grade' | 'date' | 'period' | 'subject'>> = {},
): WeeklySlot {
  return {
    grade,
    date,
    period,
    subject,
    scope: extra.scope ?? null,
    time: extra.time ?? null,
    classes: extra.classes ?? null,
    collectPapers: extra.collectPapers ?? false,
    kind: extra.kind ?? 'practice',
  }
}

const D = {
  mon: '2026-09-14',
  tue: '2026-09-15',
  wed: '2026-09-16',
  thu: '2026-09-17',
  fri: '2026-09-18',
  sat: '2026-09-19',
}

/** 115-1 第三週高中自主練習一覽表（整理自教務處表格）。七、八年級不在這張表。 */
export const weeklyWeeks: WeeklyWeek[] = [
  {
    semester: '115-1',
    week: 3,
    title: '第三週自主練習',
    audience: '高中',
    startsOn: D.mon,
    endsOn: D.sat,
    sourceNote: '整理自教務處「115學年度第1學期第三週自主練習一覽表【高中】」。範圍以老師當週說明為準。',
    notes: [
      '核取方塊打勾的考程，請導師或任課老師到教務處領取試卷。',
      '9/18 十二年級夜自習暫停一次。',
      '十二年級課堂為第8、9節。',
    ],
    slots: [
      slot('g9', D.mon, '早自習', '歷史', { scope: 'B5 CH3 普世宗教的發展', classes: '信望', kind: 'practice' }),
      slot('g9', D.mon, '課堂', '探索活動', { classes: '愛', kind: 'activity' }),
      slot('g9', D.tue, '早自習', '自主學習', { kind: 'activity' }),
      slot('g9', D.tue, '課堂', '探索活動', { classes: '愛', kind: 'activity' }),
      slot('g9', D.wed, '早自習', '地理', { scope: '歐概念＋歐洲填圖', kind: 'practice' }),
      slot('g9', D.wed, '早自習', '風文', { kind: 'practice' }),
      slot('g9', D.wed, '課堂', '石滬測驗卷', { kind: 'quiz' }),
      slot('g9', D.thu, '早自習', '朝會', { scope: 'B3', kind: 'assembly' }),
      slot('g9', D.fri, '早自習', '數學', { scope: 'B1 單元2-1', collectPapers: true, kind: 'quiz' }),

      slot('g10', D.mon, '早自習', '英文單字檢定', {
        time: '7:30–8:10',
        scope: '單字書 L3',
        collectPapers: true,
        kind: 'quiz',
      }),
      slot('g10', D.tue, '早自習', '國文', { scope: '劉姥姥進大觀園', kind: 'practice' }),
      slot('g10', D.tue, '課堂', '公民', { scope: 'B1CH6', classes: '信望', kind: 'practice' }),
      slot('g10', D.wed, '早自習', '生物', { scope: '選修生物一 CH3-1～4-1', kind: 'practice' }),
      slot('g10', D.thu, '早自習', '朝會', { scope: 'B3', kind: 'assembly' }),
      slot('g10', D.fri, '早自習', '數學', { scope: '自主練習／機率', kind: 'practice' }),
      slot('g10', D.fri, '課堂', '公民', { scope: 'B1CH6', classes: '愛', kind: 'practice' }),

      slot('g11', D.mon, '早自習', '英文單字檢定', {
        time: '7:30–8:10',
        scope: '單字書 L4',
        collectPapers: true,
        kind: 'quiz',
      }),
      slot('g11', D.tue, '早自習', '國文', { scope: '張李德和文選', kind: 'practice' }),
      slot('g11', D.wed, '早自習', '地理', { scope: '臺灣全', classes: '信', kind: 'practice' }),
      slot('g11', D.wed, '早自習', '化學', { scope: '氧化還原', classes: '望愛', kind: 'practice' }),
      slot('g11', D.thu, '早自習', '朝會', { scope: 'B3', kind: 'assembly' }),
      slot('g11', D.thu, '課堂', '公民', { scope: 'B3CH6', classes: '信', kind: 'practice' }),
      slot('g11', D.fri, '早自習', '數學', {
        scope: 'B4 單元4、5（到兩面夾角）',
        collectPapers: true,
        kind: 'quiz',
      }),

      slot('g12', D.mon, '早自習', '英文', {
        time: '7:25–8:15',
        scope: '妙妙卷第2回（第2冊全）',
        kind: 'quiz',
      }),
      slot('g12', D.tue, '早自習', '國文', { scope: '三民版第四冊 L7～L12', kind: 'practice' }),
    ],
  },
]
