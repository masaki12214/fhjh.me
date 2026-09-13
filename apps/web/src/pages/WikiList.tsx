import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { WikiNav } from '../components/WikiNav'
import {
  fetchSchoolWiki,
  WIKI_LICENSE_URL,
  WIKI_PAGE_TITLE,
  WIKI_PAGE_URL,
  type WikiArticle,
} from '../lib/wikipedia'

export function WikiList() {
  const [article, setArticle] = useState<WikiArticle | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    fetchSchoolWiki()
      .then((next) => {
        if (live) setArticle(next)
      })
      .catch((err: Error) => {
        if (live) setError(err.message || '讀取失敗')
      })
    return () => {
      live = false
    }
  }, [])

  return (
    <main className="wrap page">
      <div className="wiki-grid">
        <WikiNav />
        <article className="card article">
          <div className="crumb">
            <Link to="/">首頁</Link> · 校園 Wiki
          </div>
          <h1>{article?.title || WIKI_PAGE_TITLE}</h1>
          <div className="wiki-meta">
            <span className="badge b-official">維基百科原文</span>
            <a href={WIKI_PAGE_URL} target="_blank" rel="noreferrer">
              在維基百科開啟 ↗
            </a>
          </div>
          <p className="lead wiki-attr">
            主頁直接轉載中文維基百科「{WIKI_PAGE_TITLE}」，依{' '}
            <a href={WIKI_LICENSE_URL} target="_blank" rel="noreferrer">
              CC BY-SA 4.0
            </a>{' '}
            授權。作者與修訂歷史以原文頁為準。
          </p>
          {error ? (
            <div className="card empty">
              <h2>現在讀不到維基百科</h2>
              <p>{error}。請直接開原文，或稍後再試。</p>
              <a className="btn btn-navy" href={WIKI_PAGE_URL} target="_blank" rel="noreferrer">
                開維基百科原文
              </a>
            </div>
          ) : null}
          {!error && !article ? (
            <div className="wiki-loading">
              <div className="wiki-skel" />
              <div className="wiki-skel short" />
              <p className="muted">正在從維基百科載入條目…</p>
            </div>
          ) : null}
          {article ? <div className="wiki-mw" dangerouslySetInnerHTML={{ __html: article.html }} /> : null}
        </article>
      </div>
    </main>
  )
}
