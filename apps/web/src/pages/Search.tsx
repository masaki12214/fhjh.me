import { type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GRADE_LABEL } from '../data/exam'
import { weeklyWeeks } from '../data/weekly'
import { links } from '../data/links'
import { notices } from '../data/notices'
import { wikiPages } from '../data/wiki'
import { slotSearchText } from '../lib/weekly'
import { WIKI_PAGE_TITLE } from '../lib/wikipedia'

export function Search() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const q = (params.get('q') || '').trim()
  const needle = q.toLowerCase()

  const weeklyPageHit =
    q.length >= 2 &&
    (q.includes('週考') ||
      q.includes('本週') ||
      q.includes('自主練習') ||
      q.includes('單字檢定') ||
      q.includes('考試') ||
      weeklyWeeks.some((w) => w.title.includes(q)))
  const weeklyHits =
    q.length >= 2
      ? weeklyWeeks.flatMap((week) =>
          week.slots
            .filter((s) => slotSearchText(s).includes(q))
            .slice(0, 12)
            .map((s) => ({ week, slot: s })),
        )
      : []

  const wikiHome =
    q.length >= 2 &&
    (WIKI_PAGE_TITLE.includes(q) ||
      needle.includes('wiki') ||
      q.includes('維基') ||
      q.includes('復興') ||
      q.includes('學校') ||
      q.includes('簡介'))

  const wikiHits = wikiPages.filter(
    (p) => p.title.includes(q) || p.summary.includes(q) || p.body.some((b) => b.includes(q)),
  )
  const linkHits = links.filter((l) => l.title.toLowerCase().includes(needle) || l.description.includes(q))
  const noticeHits = notices.filter((n) => n.title.includes(q) || (n.summary && n.summary.includes(q)))

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const next = String(new FormData(e.currentTarget).get('q') || '').trim()
    if (next.length < 2) return
    navigate(`/search?q=${encodeURIComponent(next)}`)
  }

  return (
    <main className="wrap page search-page">
      <div className="crumb">
        <Link to="/">首頁</Link> · 搜尋
      </div>
      <h1>搜尋</h1>
      <form className="search-form" onSubmit={submit}>
        <input
          key={q}
          type="search"
          name="q"
          defaultValue={q}
          placeholder="週考、段考、請假、校務系統…"
          aria-label="搜尋關鍵字"
        />
        <button className="btn btn-navy" type="submit">
          搜尋
        </button>
      </form>
      <p className="lead">{q ? `「${q}」` : '請輸入至少兩個字。'}</p>
      {!q || q.length < 2 ? null : (
        <>
          <h2 style={{ fontSize: 16, color: 'var(--navy)' }}>本週考試</h2>
          {weeklyPageHit ? (
            <Link className="hit" to="/weekly">
              <b>本週考試 · 自主練習一覽</b>
              <span className="muted">高中每週小考、單字檢定、早自習範圍</span>
            </Link>
          ) : null}
          {weeklyHits.map(({ week, slot }) => (
            <Link
              className="hit"
              key={`${slot.grade}-${slot.date}-${slot.period}-${slot.subject}-${slot.classes ?? ''}`}
              to={`/weekly?grade=${slot.grade}`}
            >
              <b>
                {GRADE_LABEL[slot.grade]}年級 · {slot.subject}
              </b>
              <span className="muted">
                {week.title} · {slot.period}
                {slot.scope ? ` · ${slot.scope}` : ''}
              </span>
            </Link>
          ))}
          {!weeklyPageHit && weeklyHits.length === 0 ? <p className="muted">沒有週考項目。</p> : null}

          <h2 style={{ fontSize: 16, color: 'var(--navy)', marginTop: 20 }}>Wiki</h2>
          {wikiHome ? (
            <Link className="hit" to="/wiki">
              <b>{WIKI_PAGE_TITLE}</b>
              <span className="muted">維基百科條目 · 校園 Wiki 主頁</span>
            </Link>
          ) : null}
          {wikiHits.length === 0 && !wikiHome ? <p className="muted">沒有頁面。</p> : null}
          {wikiHits.map((p) => (
            <Link className="hit" key={p.slug} to={`/wiki/${p.slug}`}>
              <b>{p.title}</b>
              <span className="muted">{p.summary}</span>
            </Link>
          ))}
          <h2 style={{ fontSize: 16, color: 'var(--navy)', marginTop: 20 }}>連結</h2>
          {linkHits.length === 0 ? <p className="muted">沒有連結。</p> : null}
          {linkHits.map((l) => (
            <a className="hit" key={l.id} href={l.url} target="_blank" rel="noreferrer">
              <b>{l.title}</b>
              <span className="muted">{l.description}</span>
            </a>
          ))}
          <h2 style={{ fontSize: 16, color: 'var(--navy)', marginTop: 20 }}>官方文件</h2>
          {noticeHits.length === 0 ? <p className="muted">沒有文件。</p> : null}
          {noticeHits.map((n) => (
            <a className="hit" key={n.nid} href={n.url} target="_blank" rel="noreferrer">
              <b>{n.title}</b>
              <span className="muted">{n.summary}</span>
            </a>
          ))}
          {wikiHits.length === 0 &&
          !wikiHome &&
          !weeklyPageHit &&
          weeklyHits.length === 0 &&
          linkHits.length === 0 &&
          noticeHits.length === 0 ? (
            <p>
              找不到？<Link to="/report">回報這個關鍵字</Link>
            </p>
          ) : null}
        </>
      )}
    </main>
  )
}
