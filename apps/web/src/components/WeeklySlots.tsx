import type { WeeklySlot } from '../data/types'
import { dayHeading, isAssessed } from '../lib/weekly'

export function WeeklySlotCard({ slot }: { slot: WeeklySlot }) {
  return (
    <article className={`wslot ${isAssessed(slot) ? 'assessed' : ''} kind-${slot.kind}`}>
      <div className="wslot-top">
        <span className="wslot-period">{slot.period}</span>
        {slot.time ? <span className="wslot-time">{slot.time}</span> : null}
        {slot.classes ? <span className="wslot-class">{slot.classes}</span> : null}
        {slot.collectPapers ? <span className="wslot-tag">領卷</span> : null}
        {slot.kind === 'quiz' && !slot.collectPapers ? <span className="wslot-tag quiz">考試</span> : null}
      </div>
      <b>{slot.subject}</b>
      {slot.scope ? <p>{slot.scope}</p> : null}
    </article>
  )
}

export function WeeklyDayList({
  days,
  today,
}: {
  days: [string, WeeklySlot[]][]
  today?: string
}) {
  if (days.length === 0) return null
  return (
    <div className="week-days">
      {days.map(([date, slots]) => (
        <section key={date} className={`week-day${date === today ? ' is-today' : ''}`} data-date={date}>
          <h3>{dayHeading(date, today)}</h3>
          <div className="wslot-list">
            {slots.map((s) => (
              <WeeklySlotCard key={`${s.grade}-${s.date}-${s.period}-${s.subject}-${s.classes ?? ''}`} slot={s} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
