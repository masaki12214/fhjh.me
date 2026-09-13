import { GRADES } from '../data/exam'
import type { Grade } from '../data/types'

const KEY = 'fhjh.grade.v1'

export function loadGrade(fallback: Grade = 'g8'): Grade {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw && (GRADES as readonly string[]).includes(raw)) return raw as Grade
  } catch {
    /* ignore */
  }
  return fallback
}

export function saveGrade(grade: Grade) {
  try {
    localStorage.setItem(KEY, grade)
  } catch {
    /* ignore */
  }
}
