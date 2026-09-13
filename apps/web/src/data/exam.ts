import type { ExamState } from './types'

export const defaultExam: ExamState = {
  semester: '115-1',
  name: '第一次段考',
  startsOn: '2026-10-06',
  endsOn: '2026-10-07',
  dateNote: '依 115-1 中學部行事曆（學生版）。各科時間表尚未公布。',
  scheduleStatus: 'unpublished',
  schedule: [],
  source: {
    name: '中學部行事曆',
    url: 'https://www.fhjh.tp.edu.tw/faculty-introduction/874',
  },
  updatedAt: null,
}

export const GRADE_LABEL: Record<string, string> = {
  g7: '七',
  g8: '八',
  g9: '九',
  g10: '十',
  g11: '十一',
  g12: '十二',
}

export const GRADES = ['g7', 'g8', 'g9', 'g10', 'g11', 'g12'] as const
