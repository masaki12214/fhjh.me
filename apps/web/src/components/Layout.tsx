import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

const nav = [
  { to: '/', label: '首頁' },
  { to: '/exam', label: '段考中心' },
  { to: '/wiki', label: '校園Wiki' },
  { to: '/links', label: '常用連結' },
]

export function Layout() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [q, setQ] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  function goSearch(e: React.FormEvent) {
    e.preventDefault()
    const query = q.trim()
    if (query.length < 2) return
    setSearchOpen(false)
    setMenuOpen(false)
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <>
      <header className="topbar">
        <div className={`wrap topbar-row ${searchOpen ? 'searching' : ''}`}>
          <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
            FHJH.me
            <span className="pill">非官方</span>
            <small>學生製作 · 非校方官方網站</small>
          </Link>
          <nav className="nav">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <form className={`search ${searchOpen ? 'open' : ''}`} onSubmit={goSearch}>
            <span aria-hidden="true">🔍</span>
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜尋段考、請假…"
              aria-label="搜尋"
            />
          </form>
          <div className="icon-btns">
            <button className="icon-btn" type="button" aria-label="搜尋" onClick={() => setSearchOpen((v) => !v)}>
              🔍
            </button>
            <button className="icon-btn" type="button" aria-label="選單" onClick={() => setMenuOpen((v) => !v)}>
              ☰
            </button>
          </div>
        </div>
        <nav className={`drawer ${menuOpen ? 'open' : ''}`}>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setMenuOpen(false)} end={n.to === '/'}>
              {n.label}
            </NavLink>
          ))}
          <NavLink to="/notices" onClick={() => setMenuOpen(false)}>
            官方文件
          </NavLink>
          <NavLink to="/events" onClick={() => setMenuOpen(false)}>
            行事曆
          </NavLink>
          <NavLink to="/about" onClick={() => setMenuOpen(false)}>
            關於本站
          </NavLink>
        </nav>
      </header>
      <div className="notice-bar">
        <div className="wrap">
          <span className="dot" />
          <span className="full">非官方 · 學生製作 · 非校方官方網站 · 段考日期依行事曆；考程公布後會更新到這站</span>
          <span className="short">非官方 · 考程以段考中心為準</span>
        </div>
      </div>
      <Outlet />
      <footer className="site">
        <div className="wrap">
          <div>
            <b style={{ color: 'var(--ink)' }}>FHJH.me</b> 學生製作，與復興實中無隸屬關係。重要規定以官方原文為準。
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/wiki">校園 Wiki</Link>
            <Link to="/about">關於</Link>
            <Link to="/report">回報錯誤</Link>
            <Link to="/admin">後台上傳考程</Link>
          </div>
        </div>
      </footer>
      <nav className="tabbar">
        <NavLink to="/" end>
          <span>⌂</span>首頁
        </NavLink>
        <NavLink to="/exam">
          <span>考</span>段考
        </NavLink>
        <NavLink to="/wiki">
          <span>W</span>Wiki
        </NavLink>
        <NavLink to="/links">
          <span>連</span>連結
        </NavLink>
        <NavLink to="/about">
          <span>i</span>關於
        </NavLink>
      </nav>
    </>
  )
}
