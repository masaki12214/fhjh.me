import { Link } from 'react-router-dom'
import { links } from '../data/links'

const ORDER = ['系統', '學習', '官方'] as const

export function Links() {
  return (
    <main className="wrap page">
      <div className="crumb">
        <Link to="/">首頁</Link> · 常用連結
      </div>
      <h1>常用連結</h1>
      <p className="lead">只做導覽，不收帳密。標「要登入」的請到官方頁自己登。</p>
      {ORDER.map((cat) => {
        const items = links.filter((l) => l.category === cat)
        if (!items.length) return null
        return (
          <section key={cat} className="link-group">
            <h2 className="section-h">{cat}</h2>
            <div className="link-list">
              {items.map((item) => (
                <a className="card" key={item.id} href={item.url} target="_blank" rel="noreferrer">
                  <b>
                    {item.title}{' '}
                    {item.requiresLogin ? <span className="badge b-warn">要登入</span> : null}{' '}
                    {item.onCampusOnly ? <span className="badge b-student">限校內</span> : null}
                  </b>
                  <span>{item.description}</span>
                </a>
              ))}
            </div>
          </section>
        )
      })}
    </main>
  )
}
