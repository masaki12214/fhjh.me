import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GRADE_LABEL, GRADES } from '../data/exam'
import { wikiPages } from '../data/wiki'
import { useExam } from '../examContext'
import { daysUntil, formatRange, weekday } from '../lib/examStore'
import { loadGrade, saveGrade } from '../lib/grade'
import type { Grade } from '../data/types'

export function Home() {
  const { exam } = useExam()
  const [grade, setGrade] = useState<Grade>(() => loadGrade())
  const days = daysUntil(exam.startsOn)
  const published = exam.scheduleStatus === 'published' && exam.schedule.some((s) => s.grade === grade)

  return (
    <main className="wrap page">
      <section className="card exam-hero">
        <p className="kicker">{exam.semester} · 現在最重要的一件事</p>
        <h1>{exam.name}</h1>
        <div className="grades">
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              className={g === grade ? 'on' : ''}
              onClick={() => {
                setGrade(g)
                saveGrade(g)
              }}
            >
              {GRADE_LABEL[g]}
            </button>
          ))}
        </div>
        <div className="facts">
          <div className="fact">
            <div className="l">什麼時候</div>
            <div className="v">{formatRange(exam)}</div>
            <div className="s">
              {exam.startsOn ? `${weekday(exam.startsOn)}` : ''}
              {exam.endsOn ? `、${weekday(exam.endsOn)}` : ''}
              {days !== null ? ` · ${days >= 0 ? `還有 ${days} 天` : '已開始或已結束'}` : ''}
            </div>
          </div>
          <div className={`fact ${published ? '' : 'wait'}`}>
            <div className="l">考程（哪一天考哪一科）</div>
            <div className="v">{published ? `${GRADE_LABEL[grade]}年級已公布` : '還沒公布'}</div>
            <div className="s">{published ? '打開段考中心看各科時間' : '一公布就會出現在段考中心'}</div>
          </div>
        </div>
        <Link className="btn btn-pri btn-block" to={`/exam?grade=${grade}`}>
          打開段考中心
        </Link>
        <div className="src">{exam.dateNote}</div>
      </section>

      <div className="tools">
        <Link className="card" to="/wiki">
          <b>校園 Wiki</b>
          <span>學校簡介來自維基百科；請假、補考在側欄</span>
        </Link>
        <Link className="card" to="/links">
          <b>常用連結</b>
          <span>校務系統、Gmail、TEAMS</span>
        </Link>
        <Link className="card" to="/notices">
          <b>官方文件</b>
          <span>行事曆、教科書版本</span>
        </Link>
        <Link className="card" to="/events">
          <b>行事曆</b>
          <span>全校日期，不堆競賽</span>
        </Link>
      </div>

      <h2 className="section-h">怎麼辦</h2>
      <div className="chips">
        {wikiPages.map((p) => (
          <Link key={p.slug} to={`/wiki/${p.slug}`}>
            {p.title}
          </Link>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
        競賽轉知不放在首頁。完整公告見{' '}
        <a href="https://www.fhjh.tp.edu.tw/news/secondary" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontWeight: 600 }}>
          學校官網
        </a>
        。
      </p>
    </main>
  )
}
