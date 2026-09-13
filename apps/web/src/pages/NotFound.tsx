import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <main className="wrap page">
      <div className="card empty">
        <h2>沒有這個頁面</h2>
        <p>可能打錯網址，或這篇還沒寫。</p>
        <div className="row-btns" style={{ justifyContent: 'center' }}>
          <Link className="btn btn-navy" to="/">
            回首頁
          </Link>
          <Link className="btn btn-ghost" to="/search">
            搜尋
          </Link>
          <Link className="btn btn-ghost" to="/report">
            回報
          </Link>
        </div>
      </div>
    </main>
  )
}
