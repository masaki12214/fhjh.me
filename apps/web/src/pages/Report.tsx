import { useState } from 'react'
import { Link } from 'react-router-dom'

export function Report() {
  const [sent, setSent] = useState(false)

  return (
    <main className="wrap page">
      <div className="crumb">
        <Link to="/">首頁</Link> · 回報
      </div>
      <h1>回報錯誤／侵權／個資</h1>
      <p className="lead">不用留姓名。真的需要聯絡時再填 email。</p>
      {sent ? (
        <div className="ok">已記下（此示範存在你的瀏覽器）。正式上線會寄到編輯信箱。</div>
      ) : (
        <form
          className="card article"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const payload = Object.fromEntries(fd.entries())
            const prev = JSON.parse(localStorage.getItem('fhjh.reports') || '[]')
            prev.push({ ...payload, at: new Date().toISOString() })
            localStorage.setItem('fhjh.reports', JSON.stringify(prev))
            setSent(true)
          }}
        >
          <div className="field">
            <label htmlFor="reason">原因</label>
            <select id="reason" name="reason" required>
              <option value="wrong">內容錯誤</option>
              <option value="outdated">過期</option>
              <option value="privacy">個資</option>
              <option value="copyright">侵權</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="message">說明</label>
            <textarea id="message" name="message" rows={5} required maxLength={1000} />
          </div>
          <div className="field">
            <label htmlFor="contact">聯絡方式（選填）</label>
            <input id="contact" name="contact" maxLength={120} />
          </div>
          <button className="btn btn-navy" type="submit">
            送出
          </button>
        </form>
      )}
    </main>
  )
}
