import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GRADE_LABEL, GRADES } from '../data/exam'
import { useExam } from '../examContext'
import { formatMd, formatRange, slotsForGrade, weekday } from '../lib/examStore'
import { loadGrade, saveGrade } from '../lib/grade'
import type { Grade } from '../data/types'

export function Exam() {
  const { exam } = useExam()
  const [params, setParams] = useSearchParams()
  const grade = (
    GRADES.includes(params.get('grade') as Grade) ? params.get('grade') : loadGrade()
  ) as Grade
  const slots = useMemo(() => slotsForGrade(exam, grade), [exam, grade])
  const published = exam.scheduleStatus === 'published' && slots.length > 0

  return (
    <main className="wrap page">
      <div className="crumb">
        <Link to="/">首頁</Link> · 段考中心
      </div>
      <h1>{exam.name}</h1>
      <p className="lead">
        {exam.semester} · 行事曆日期 {formatRange(exam)}
        {exam.startsOn ? `（${weekday(exam.startsOn)}` : ''}
        {exam.endsOn ? `、${weekday(exam.endsOn)}）` : exam.startsOn ? '）' : ''}
        。每週小考與自主練習在{' '}
        <Link to={`/weekly?grade=${grade}`}>本週考試</Link>
        。
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

      {!published ? (
        <div className="card empty">
          <h2>{GRADE_LABEL[grade]}年級考程尚未公布</h2>
          <p>
            現在只知道段考落在 {formatRange(exam)}。哪一節考哪一科，等學校或老師發出考程後，從後台上傳就會出現在這張表。
          </p>
          <p className="muted">日期：{formatRange(exam)} · 考程：沒有</p>
          <Link className="btn btn-ghost" to="/admin" style={{ marginTop: 8 }}>
            我是編輯，去上傳考程
          </Link>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>節次</th>
                  <th>科目</th>
                  <th>範圍</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={`${s.date}-${s.period}-${s.subject}`}>
                    <td>
                      {formatMd(s.date)}（{weekday(s.date)}）
                    </td>
                    <td>{s.period}</td>
                    <td>
                      <b>{s.subject}</b>
                    </td>
                    <td className="muted">{s.scope || '尚未填寫'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ padding: '12px 16px', margin: 0 }}>
            資料由編輯上傳。範圍以各科老師為準。
          </p>
        </div>
      )}
    </main>
  )
}
