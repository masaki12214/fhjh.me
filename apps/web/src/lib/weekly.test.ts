import { weeklyWeeks } from '../data/weekly.ts'
import {
  dateInWeek,
  groupSlotsByDate,
  quizSlots,
  slotsForGrade,
  weekHasGrade,
} from './weekly.ts'

const week = weeklyWeeks[0]
if (week.week !== 3 || week.startsOn !== '2026-09-14') {
  throw new Error('expected 115-1 week 3 starting 2026-09-14')
}

const g10 = slotsForGrade(week, 'g10')
if (g10.length !== 7) {
  throw new Error(`expected 7 grade-10 slots, got ${g10.length}`)
}

const vocab = g10.find((s) => s.subject === '英文單字檢定')
if (!vocab || vocab.date !== '2026-09-14' || !vocab.collectPapers || vocab.scope !== '單字書 L3') {
  throw new Error(`bad g10 vocab slot ${JSON.stringify(vocab)}`)
}

const g11math = slotsForGrade(week, 'g11').find((s) => s.subject === '數學')
if (!g11math?.collectPapers || g11math.date !== '2026-09-18') {
  throw new Error(`bad g11 math ${JSON.stringify(g11math)}`)
}

if (weekHasGrade(week, 'g7') || weekHasGrade(week, 'g8')) {
  throw new Error('junior high should not be on the high-school sheet')
}

const days = groupSlotsByDate(slotsForGrade(week, 'g9'))
if (days.length !== 5) {
  throw new Error(`g9 should have 5 weekdays with items, got ${days.length}`)
}

const quizzes = quizSlots(slotsForGrade(week, 'g12'))
if (quizzes.length !== 1 || quizzes[0].subject !== '英文') {
  throw new Error(`g12 should have the 妙妙卷 English quiz, got ${JSON.stringify(quizzes)}`)
}

if (!dateInWeek(week, '2026-09-19') || dateInWeek(week, '2026-09-13')) {
  throw new Error('week range check failed')
}

console.log('weekly data ok', week.slots.length)
