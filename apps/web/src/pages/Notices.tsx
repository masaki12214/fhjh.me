import { Link } from 'react-router-dom'
import { notices } from '../data/notices'

export function Notices() {
  return (
    <main className="wrap page">
      <div className="crumb">
        <Link to="/">首頁</Link> · 公告
      </div>
      <h1>跟學生有關的官方文件</h1>
      <p className="lead">這裡不轉貼競賽。完整列表在學校官網。</p>
      <div className="link-list">
        {notices.map((n) => (
          <a className="card" key={n.nid} href={n.url} target="_blank" rel="noreferrer">
            <b>{n.title}</b>
            <span>
              {n.publishedAt} · {n.summary}
            </span>
          </a>
        ))}
        <a className="card" href="https://www.fhjh.tp.edu.tw/news/secondary" target="_blank" rel="noreferrer">
          <b>學校訊息公告（中學部）↗</b>
          <span>官網原文全量</span>
        </a>
      </div>
    </main>
  )
}
