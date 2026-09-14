import { Link } from 'react-router-dom'
import { useExam } from '../examContext'
import { daysUntil, formatRange, weekday } from '../lib/examStore'

export function Events() {
  const { exam } = useExam()
  const days = daysUntil(exam.startsOn)

  return (
    <main className="wrap page">
      <div className="crumb">
        <Link to="/">首頁</Link> · 行事曆
      </div>
      <h1>活動與行事曆</h1>
      <p className="lead">這裡只放全校日期。每週考試看本週頁；競賽轉知請看官網，不堆在本站首頁。</p>
      <div className="card article">
        <h2>本週考試</h2>
        <p>高中自主練習、單字檢定、課堂小考每週都有。段考是另外一件比較大的事。</p>
        <Link className="btn btn-navy" to="/weekly">
          打開本週考試
        </Link>
      </div>
      <div className="card article" style={{ marginTop: 12 }}>
        <h2>{exam.name}</h2>
        <p>
          {exam.semester} · {formatRange(exam)}
          {exam.startsOn ? `（${weekday(exam.startsOn)}` : ''}
          {exam.endsOn ? `、${weekday(exam.endsOn)}）` : exam.startsOn ? '）' : ''}
          {days !== null ? ` · ${days >= 0 ? `還有 ${days} 天` : '已開始或已結束'}` : ''}
        </p>
        <p className="muted">{exam.dateNote}</p>
        <Link className="btn btn-navy" to="/exam">
          打開段考中心
        </Link>
      </div>
      <div className="link-list" style={{ marginTop: 12 }}>
        <a className="card" href="https://www.fhjh.tp.edu.tw/faculty-introduction/874" target="_blank" rel="noreferrer">
          <b>中學部行事曆（學生版）↗</b>
          <span>官方 PDF · 段考日寫在這裡</span>
        </a>
      </div>
    </main>
  )
}
