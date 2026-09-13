import { NavLink } from 'react-router-dom'
import { wikiPages } from '../data/wiki'

const GROUPS = ['怎麼辦', '系統', '規定', '窗口'] as const

export function WikiNav() {
  return (
    <aside className="card side wiki-side">
      <div className="wiki-side-h">學校</div>
      <NavLink to="/wiki" end>
        學校簡介（維基百科）
      </NavLink>
      {GROUPS.map((cat) => (
        <div key={cat}>
          <div className="wiki-side-h">{cat}</div>
          {wikiPages
            .filter((p) => p.category === cat)
            .map((p) => (
              <NavLink key={p.slug} to={`/wiki/${p.slug}`}>
                {p.title}
              </NavLink>
            ))}
        </div>
      ))}
    </aside>
  )
}
