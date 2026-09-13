import { Link, Navigate, useParams } from 'react-router-dom'
import { WikiNav } from '../components/WikiNav'
import { wikiPages } from '../data/wiki'

export function WikiPage() {
  const { slug } = useParams()
  const page = wikiPages.find((p) => p.slug === slug)
  if (!page) return <Navigate to="/wiki" replace />

  return (
    <main className="wrap page">
      <div className="wiki-grid">
        <WikiNav />
        <article className="card article">
          <div className="crumb">
            <Link to="/">首頁</Link> · <Link to="/wiki">校園 Wiki</Link> · {page.category}
          </div>
          <h1>{page.title}</h1>
          <div className="wiki-meta">
            <span className="badge b-student">學生整理</span>
            <span className="muted">最後確認 {page.lastVerified}</span>
          </div>
          {page.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <div className="sources">
            <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
              資料來源
            </div>
            {page.sources.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                {s.title} ↗
              </a>
            ))}
          </div>
        </article>
      </div>
    </main>
  )
}
