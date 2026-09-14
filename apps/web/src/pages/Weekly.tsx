import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { WeeklyDayList } from '../components/WeeklySlots'
import { GRADE_LABEL, GRADES } from '../data/exam'
import type { Grade } from '../data/types'
import { loadGrade, saveGrade } from '../lib/grade'
import {
  groupSlotsByDate,
  publishedWeek,
  quizSlots,
  slotsForGrade,
  taipeiToday,
  weekHasGrade,
  weekRangeLabel,
} from '../lib/weekly'

export function Weekly() {
  const week = publishedWeek()
  const [params, setParams] = useSearchParams()
  const grade = (
    GRADES.includes(params.get('grade') as Grade) ? params.get('grade') : loadGrade()
  ) as Grade
  const today = taipeiToday()
  const slots = useMemo(() => slotsForGrade(week, grade), [week, grade])
  const days = useMemo(() => groupSlotsByDate(slots), [slots])
  const quizzes = quizSlots(slots)
  const hasGrade = weekHasGrade(week, grade)

  return (
    <main className="wrap page">
      <div className="crumb">
        <Link to="/">首頁</Link> · 本週考試
      </div>
      <h1>{week.title}</h1>
      <p className="lead">
        {week.semester} · {week.audience} · {weekRangeLabel(week)}
        {quizzes.length ? ` · ${GRADE_LABEL[grade]}年級這週有 ${quizzes.length} 項考試／領卷` : ''}
      </p>
      <div className="chips">
        {GRADES.map((g) => (
          <button
            key={g}
            type="button"
            className={g === grade ? 'on' : ''}
            onClick={() => {
              saveGrade(g)
              setParams({ grade: g })
            }}
          >
            {GRADE_LABEL[g]}
          </button>
        ))}
      </div>

      {!hasGrade ? (
        <div className="card empty">
          <h2>{GRADE_LABEL[grade]}年級不在這張高中表</h2>
          <p>這週整理的是高中自主練習（九～十二年級）。七、八年級週考／自主練習尚未放進本站。</p>
          <p className="muted">切換上面的年級，或看段考日期。</p>
          <div className="row-btns" style={{ justifyContent: 'center' }}>
            <button
              className="btn btn-navy"
              type="button"
              onClick={() => {
                saveGrade('g10')
                setParams({ grade: 'g10' })
              }}
            >
              改看十年級
            </button>
            <Link className="btn btn-ghost" to="/exam">
              段考中心
            </Link>
          </div>
        </div>
      ) : (
        <WeeklyDayList days={days} today={today} />
      )}

      <ul className="week-notes">
        {week.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <p className="muted" style={{ fontSize: 13 }}>
        {week.sourceNote}
      </p>
    </main>
  )
}
