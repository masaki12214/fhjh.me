import { weeklyWeeks } from '../data/weekly.ts'
import type { Grade, WeeklyKind, WeeklyPeriod, WeeklySlot, WeeklyWeek } from '../data/types.ts'

export const WEEKLY_PERIODS: WeeklyPeriod[] = ['早自習', '課堂']

const KIND_RANK: Record<WeeklyKind, number> = {
  quiz: 0,
  practice: 1,
  activity: 2,
  assembly: 3,
}

export function taipeiToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
}

function md(iso: string) {
  const [, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d).toString().padStart(2, '0')}`
}

function weekdayName(iso: string) {
  const names = ['日', '一', '二', '三', '四', '五', '六']
  return names[new Date(`${iso}T12:00:00+08:00`).getDay()]
}

export function publishedWeek(): WeeklyWeek {
  return weeklyWeeks[0]
}

export function weekRangeLabel(week: WeeklyWeek) {
  return `${md(week.startsOn)}–${md(week.endsOn)}`
}

export function dateInWeek(week: WeeklyWeek, iso: string) {
  return iso >= week.startsOn && iso <= week.endsOn
}

export function slotsForGrade(week: WeeklyWeek, grade: Grade): WeeklySlot[] {
  return week.slots
    .filter((s) => s.grade === grade)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        WEEKLY_PERIODS.indexOf(a.period) - WEEKLY_PERIODS.indexOf(b.period) ||
        KIND_RANK[a.kind] - KIND_RANK[b.kind] ||
        a.subject.localeCompare(b.subject, 'zh-Hant'),
    )
}

export function slotsOnDate(slots: WeeklySlot[], iso: string) {
  return slots.filter((s) => s.date === iso)
}

export function groupSlotsByDate(slots: WeeklySlot[]) {
  const map = new Map<string, WeeklySlot[]>()
  for (const s of slots) {
    const list = map.get(s.date) ?? []
    list.push(s)
    map.set(s.date, list)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export function quizSlots(slots: WeeklySlot[]) {
  return slots.filter((s) => s.kind === 'quiz' || s.collectPapers)
}

export function isAssessed(slot: WeeklySlot) {
  return slot.kind === 'quiz' || slot.collectPapers
}

export function weekHasGrade(week: WeeklyWeek, grade: Grade) {
  return week.slots.some((s) => s.grade === grade)
}

export function dayHeading(iso: string, today = taipeiToday()) {
  const mark = iso === today ? '今天 · ' : ''
  return `${mark}${md(iso)}（${weekdayName(iso)}）`
}

export function slotSearchText(slot: WeeklySlot) {
  return [slot.subject, slot.scope, slot.classes, slot.time, slot.period].filter(Boolean).join(' ')
}
