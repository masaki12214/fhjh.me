import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { WeeklySlotCard } from '../components/WeeklySlots'
import { GRADE_LABEL, GRADES } from '../data/exam'
import { wikiPages } from '../data/wiki'
import type { Grade } from '../data/types'
import { useExam } from '../examContext'
import { daysUntil, formatMd, formatRange, weekday } from '../lib/examStore'
import { loadGrade, saveGrade } from '../lib/grade'
import {
  dateInWeek,
  groupSlotsByDate,
  publishedWeek,
  quizSlots,
  slotsOnDate,
  slotsForGrade,
  taipeiToday,
  weekHasGrade,
  weekRangeLabel,
} from '../lib/weekly'

export function Home() {
  const { exam } = useExam()
  const week = publishedWeek()
  const [grade, setGrade] = useState<Grade>(() => loadGrade())
  const today = taipeiToday()
  const days = daysUntil(exam.startsOn)
  const published = exam.scheduleStatus === 'published' && exam.schedule.some((s) => s.grade === grade)
  const slots = useMemo(() => slotsForGrade(week, grade), [week, grade])
  const todaySlots = dateInWeek(week, today) ? slotsOnDate(slots, today) : []
  const quizzes = quizSlots(slots)
  const hasGrade = weekHasGrade(week, grade)
  const rest = slots.filter((s) => s.date !== today)

  return (
    <main className="wrap page">
      <section className="card exam-hero">
        <p className="kicker">
          {week.semester} · 第{week.week}週 · {week.audience}自主練習
        </p>
        <h1>本週考試</h1>
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

        {!hasGrade ? (
          <p className="week-empty-hero">
            這張表是高中自主練習。{GRADE_LABEL[grade]}年級週考還沒整理進來，可改選九～十二，或先看下面的段考。
          </p>
        ) : (
          <>
            <div className="facts">
              <div className="fact">
                <div className="l">這週</div>
                <div className="v">{weekRangeLabel(week)}</div>
                <div className="s">
                  {GRADE_LABEL[grade]}年級 · {quizzes.length ? `${quizzes.length} 項考試／領卷` : '沒有標成考試的項目'}
                </div>
              </div>
              <div className={`fact ${todaySlots.length ? '' : 'wait'}`}>
                <div className="l">今天</div>
                <div className="v">
                  {dateInWeek(week, today)
                    ? todaySlots.length
                      ? `${todaySlots.length} 項`
                      : '沒有排項目'
                    : '不在這一週'}
                </div>
                <div className="s">
                  {dateInWeek(week, today) ? `${weekday(today)} · 早自習／課堂` : `目前顯示第${week.week}週`}
                </div>
              </div>
            </div>

            {todaySlots.length > 0 ? (
              <div className="today-block">
                <div className="today-h">今天要做的</div>
                <div className="wslot-list on-hero">
                  {todaySlots.map((s) => (
                    <WeeklySlotCard key={`${s.date}-${s.period}-${s.subject}-${s.classes ?? ''}`} slot={s} />
                  ))}
                </div>
              </div>
            ) : null}

            {rest.length > 0 ? (
              <div className="week-preview">
                {groupSlotsByDate(rest).map(([date, items]) => (
                  <div key={date} className="week-preview-row">
                    <span>
                      {formatMd(date)}（{weekday(date)}）
                    </span>
                    <b>{items.map((s) => s.subject).join('、')}</b>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}

        <Link className="btn btn-pri btn-block" to={`/weekly?grade=${grade}`}>
          打開本週完整表
        </Link>
        <div className="src">{week.sourceNote}</div>
      </section>

      <section className="card exam-next">
        <p className="kicker-navy">{exam.semester} · 下一次段考</p>
        <h2>{exam.name}</h2>
        <div className="facts light">
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
        <Link className="btn btn-navy" to={`/exam?grade=${grade}`}>
          打開段考中心
        </Link>
        <p className="muted" style={{ margin: '12px 0 0', fontSize: 13 }}>
          {exam.dateNote}
        </p>
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
