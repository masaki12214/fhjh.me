import { defaultExam } from '../data/exam'
import type { ExamSlot, ExamState, Grade } from '../data/types'

const KEY = 'fhjh.exam.v1'

export function loadExam(): ExamState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultExam
    const parsed = JSON.parse(raw) as ExamState
    if (!parsed?.name) return defaultExam
    return { ...defaultExam, ...parsed }
  } catch {
    return defaultExam
  }
}

export function saveExam(state: ExamState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function clearExam() {
  localStorage.removeItem(KEY)
}

export function formatRange(exam: ExamState) {
  if (!exam.startsOn) return '日期未定'
  const a = formatMd(exam.startsOn)
  const b = exam.endsOn ? formatMd(exam.endsOn) : null
  return b && b !== a ? `${a} – ${b}` : a
}

export function formatMd(iso: string) {
  const [, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d).toString().padStart(2, '0')}`
}

export function weekday(iso: string) {
  const names = ['日', '一', '二', '三', '四', '五', '六']
  return names[new Date(`${iso}T12:00:00+08:00`).getDay()]
}

export function daysUntil(iso: string | null) {
  if (!iso) return null
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
  const start = new Date(`${iso}T00:00:00+08:00`)
  const now = new Date(`${today}T00:00:00+08:00`)
  return Math.round((start.getTime() - now.getTime()) / 86400000)
}

export function slotsForGrade(exam: ExamState, grade: Grade): ExamSlot[] {
  return exam.schedule
    .filter((s) => s.grade === grade)
    .sort((a, b) => a.date.localeCompare(b.date) || a.period.localeCompare(b.period))
}

/** 把貼上的考程文字抽成 JSON。認民國年、10/6、節次、科目。 */
export function parseScheduleText(text: string, grade: Grade): ExamSlot[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\u3000/g, ' ').trim())
    .filter(Boolean)

  const slots: ExamSlot[] = []
  let currentDate: string | null = null

  for (const line of lines) {
    const date = extractDate(line)
    if (date) currentDate = date

    const period = extractPeriod(line)
    const subject = extractSubject(line)
    if (currentDate && period && subject) {
      slots.push({
        grade,
        date: currentDate,
        period,
        subject,
        scope: extractScope(line),
      })
      continue
    }

    if (currentDate && subject && !period) {
      const many = extractManySubjects(line)
      if (many.length) {
        many.forEach((item) =>
          slots.push({ grade, date: currentDate!, period: item.period, subject: item.subject, scope: null }),
        )
      }
    }
  }

  return dedupe(slots)
}

const SUBJECTS = ['國文', '英文', '英語', '數學', '理化', '生物', '地科', '歷史', '地理', '公民', '健體', '體育', '資訊', '科技', '美術', '音樂', '國文作文', '作文']

function extractDate(line: string): string | null {
  let m = line.match(/(\d{2,3})年(\d{1,2})月(\d{1,2})日/)
  if (m) return toIso(Number(m[1]) + 1911, m[2], m[3])
  m = line.match(/(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/)
  if (m) return toIso(Number(m[1]), m[2], m[3])
  m = line.match(/(?<!\d)(\d{1,2})[./月](\d{1,2})日?/)
  if (m) return toIso(2026, m[1], m[2])
  return null
}

function toIso(y: number, m: string | number, d: string | number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function extractPeriod(line: string): string | null {
  let m = line.match(/第?\s*([1-8一二三四五六七八])\s*[-~～到至]\s*([1-8一二三四五六七八])\s*節/)
  if (m) return `${digit(m[1])}-${digit(m[2])}`
  m = line.match(/([1-8一二三四五六七八])\s*[-~～]\s*([1-8一二三四五六七八])\s*節/)
  if (m) return `${digit(m[1])}-${digit(m[2])}`
  m = line.match(/第([1-8一二三四五六七八])節/)
  if (m) return digit(m[1])
  return null
}

function digit(s: string) {
  const map: Record<string, string> = { 一: '1', 二: '2', 三: '3', 四: '4', 五: '5', 六: '6', 七: '7', 八: '8' }
  return map[s] ?? s
}

function extractSubject(line: string): string | null {
  return SUBJECTS.find((s) => line.includes(s)) ?? null
}

function extractScope(line: string): string | null {
  const m = line.match(/範圍[：:]\s*(.+)$/)
  return m ? m[1].trim() : null
}

function extractManySubjects(line: string): { period: string; subject: string }[] {
  const out: { period: string; subject: string }[] = []
  const re = /([1-8一二三四五六七八][-~～到至][1-8一二三四五六七八]|第[1-8一二三四五六七八]節)\s*([^\s，、]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line))) {
    const subject = SUBJECTS.find((s) => m![2].includes(s))
    if (!subject) continue
    const p = m[1].includes('第') ? digit(m[1].replace(/[第節]/g, '')) : m[1].replace(/[到至~～]/g, '-').replace(/[一二三四五六七八]/g, (c) => digit(c))
    out.push({ period: p, subject })
  }
  return out
}

function dedupe(slots: ExamSlot[]) {
  const seen = new Set<string>()
  return slots.filter((s) => {
    const k = `${s.grade}|${s.date}|${s.period}|${s.subject}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
