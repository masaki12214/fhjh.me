import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ExamState } from './data/types'
import { deleteRemoteExam, fetchRemoteExam, loadPublishKey, putRemoteExam } from './lib/examApi'
import { clearExam, loadExam, saveExam } from './lib/examStore'

const Ctx = createContext<{
  exam: ExamState
  remote: boolean
  publish: (next: ExamState, publishKey?: string) => Promise<void>
  reset: (publishKey?: string) => Promise<void>
} | null>(null)

export function ExamProvider({ children }: { children: ReactNode }) {
  const [exam, setExam] = useState<ExamState>(() => loadExam())
  const [remote, setRemote] = useState(false)

  useEffect(() => {
    let live = true
    fetchRemoteExam()
      .then((next) => {
        if (!live || !next) return
        saveExam(next)
        setExam(next)
        setRemote(true)
      })
      .catch(() => {
        /* local fallback */
      })
    return () => {
      live = false
    }
  }, [])

  const value = useMemo(
    () => ({
      exam,
      remote,
      async publish(next: ExamState, publishKey = loadPublishKey()) {
        try {
          await putRemoteExam(next, publishKey)
          setRemote(true)
        } catch (err) {
          if (remote) throw err
          /* local vite has no /api/exam */
        }
        saveExam(next)
        setExam(next)
      },
      async reset(publishKey = loadPublishKey()) {
        try {
          await deleteRemoteExam(publishKey)
          setRemote(true)
        } catch (err) {
          if (remote) throw err
        }
        clearExam()
        setExam(loadExam())
      },
    }),
    [exam, remote],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useExam() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useExam')
  return ctx
}
