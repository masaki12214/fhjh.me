import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GRADE_LABEL, GRADES } from '../data/exam'
import { useExam } from '../examContext'
import type { ExamSlot, ExamState, Grade } from '../data/types'
import { parseScheduleText } from '../lib/examStore'

const SAMPLE = `八年級第一次段考考程
10/6（二）
1-2節 國文
3-4節 英文
5-6節 數學
10/7（三）
1-2節 理化
3-4節 歷史
5-6節 地理`

export function Admin() {
  const { exam, publish, reset } = useExam()
  const [grade, setGrade] = useState<Grade>('g8')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [slots, setSlots] = useState<ExamSlot[]>(exam.schedule)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const json = useMemo(
    () =>
      JSON.stringify(
        {
          semester: exam.semester,
          exam: exam.name,
          dates: [exam.startsOn, exam.endsOn],
          schedule: slots,
          status: 'draft',
        },
        null,
        2,
      ),
    [exam, slots],
  )

  function extract() {
    setError('')
    setOk('')
    const parsed = parseScheduleText(text, grade)
    if (!parsed.length) {
      setError('認不出「日期 + 節次 + 科目」。可先貼下面範例試試，或改文字後再轉。')
      return
    }
    const others = slots.filter((s) => s.grade !== grade)
    setSlots([...others, ...parsed])
    setOk(`抽出 ${parsed.length} 筆 ${GRADE_LABEL[grade]}年級考程。請核對 JSON 再發布。`)
  }

  function doPublish() {
    if (!slots.length) {
      setError('沒有任何考程列，不能發布。')
      return
    }
    const next: ExamState = {
      ...exam,
      scheduleStatus: 'published',
      schedule: slots,
      updatedAt: new Date().toISOString(),
      dateNote: '考程由編輯上傳。範圍以各科老師為準。',
    }
    publish(next)
    setOk('已發布。回首頁或段考中心即可看到時間表（存在這個瀏覽器）。')
  }

  return (
    <main className="wrap page admin">
      <div className="crumb">
        <Link to="/">前台</Link> · 後台
      </div>
      <h1>上傳{exam.name}考程</h1>
      <p className="lead">
        把老師或教務處發的考程文字貼上來（或先從 PDF／截圖自己打出來）。這裡用規則把「哪一天、第幾節、哪一科」抽成
        JSON。之後可換成 LLM，格式不變。
      </p>

      <div className="drop">
        <b>檔案名稱只作備註</b>
        <p className="muted" style={{ margin: '8px 0 0' }}>
          正式環境會把 PDF／照片丟給模型。現在請把認得出的文字貼在下面。
        </p>
        <input
          style={{ marginTop: 12 }}
          type="file"
          accept=".pdf,image/*"
          onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
        />
        {fileName ? <p className="muted">已選：{fileName}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="grade">這份是哪個年級</label>
        <select id="grade" value={grade} onChange={(e) => setGrade(e.target.value as Grade)}>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {GRADE_LABEL[g]}年級
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="raw">考程文字</label>
        <textarea
          id="raw"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={SAMPLE}
        />
      </div>
      <div className="row-btns">
        <button className="btn btn-navy" type="button" onClick={extract}>
          轉成 JSON
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            setText(SAMPLE)
            setError('')
          }}
        >
          填入範例
        </button>
      </div>
      {error ? <p className="err">{error}</p> : null}
      {ok ? <div className="ok">{ok}</div> : null}

      <h2 style={{ fontSize: 16, marginTop: 24, color: 'var(--navy)' }}>JSON 草稿</h2>
      <pre>{json}</pre>

      <div className="row-btns">
        <button className="btn btn-navy" type="button" onClick={doPublish}>
          確認並發布
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            reset()
            setSlots([])
            setOk('已清回「考程未公布」。')
          }}
        >
          撤下考程
        </button>
        <Link className="btn btn-ghost" to="/exam">
          看前台
        </Link>
      </div>
    </main>
  )
}
