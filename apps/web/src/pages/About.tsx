import { Link } from 'react-router-dom'
import { WIKI_LICENSE_URL, WIKI_PAGE_URL } from '../lib/wikipedia'

export function About() {
  return (
    <main className="wrap page">
      <div className="crumb">
        <Link to="/">首頁</Link> · 關於
      </div>
      <h1>這不是學校官網</h1>
      <p className="lead">FHJH.me 由學生製作與維護，整理公開資訊。與臺北市私立復興實驗高級中學無隸屬關係。</p>
      <div className="card article">
        <h2>我們做什麼</h2>
        <p>把「這週考什麼、第一次段考何時、考程在哪、請假怎麼走」放在同一個短網址。段考考程由編輯上傳，不是爬班群。</p>
        <h2>我們不做什麼</h2>
        <p>不代理登入、不收帳密、不做論壇、不排名、不把競賽轉知堆在首頁。</p>
        <h2>資料從哪來</h2>
        <p>
          每週考試先依教務處自主練習一覽表整理。段考日期先依官網{' '}
          <a href="https://www.fhjh.tp.edu.tw/faculty-introduction/874" style={{ color: 'var(--blue)' }}>
            中學部行事曆
          </a>
          。考程等學校公布後，後台上傳再發布。
        </p>
        <p>
          校園 Wiki 主頁直接轉載{' '}
          <a href={WIKI_PAGE_URL} target="_blank" rel="noreferrer">
            中文維基百科該校條目
          </a>
          ，依{' '}
          <a href={WIKI_LICENSE_URL} target="_blank" rel="noreferrer">
            CC BY-SA 4.0
          </a>{' '}
          授權。請假等「怎麼辦」頁連回學務處／教務處原文。
        </p>
        <p>
          發現錯誤或個資問題，請<Link to="/report">回報</Link>。
        </p>
      </div>
    </main>
  )
}
