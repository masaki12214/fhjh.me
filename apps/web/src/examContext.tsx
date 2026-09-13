import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ExamState } from './data/types'
import { clearExam, loadExam, saveExam } from './lib/examStore'

const Ctx = createContext<{
  exam: ExamState
  publish: (next: ExamState) => void
  reset: () => void
} | null>(null)

export function ExamProvider({ children }: { children: ReactNode }) {
  const [exam, setExam] = useState<ExamState>(() => (typeof localStorage === 'undefined' ? loadExam() : loadExam()))

  const value = useMemo(
    () => ({
      exam,
      publish(next: ExamState) {
        saveExam(next)
        setExam(next)
      },
      reset() {
        clearExam()
        setExam(loadExam())
      },
    }),
    [exam],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useExam() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useExam')
  return ctx
}
