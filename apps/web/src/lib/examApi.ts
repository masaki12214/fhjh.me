import type { ExamState } from '../data/types'

const KEY_STORE = 'fhjh.exam.publish-key'

export function loadPublishKey() {
  try {
    return sessionStorage.getItem(KEY_STORE) || ''
  } catch {
    return ''
  }
}

export function savePublishKey(key: string) {
  try {
    if (key) sessionStorage.setItem(KEY_STORE, key)
    else sessionStorage.removeItem(KEY_STORE)
  } catch {
    /* ignore */
  }
}

export async function fetchRemoteExam(): Promise<ExamState | null> {
  const res = await fetch('/api/exam', { headers: { accept: 'application/json' } })
  if (!res.ok) return null
  const data = (await res.json()) as { exam?: ExamState | null }
  return data.exam && data.exam.name ? data.exam : null
}

export async function putRemoteExam(exam: ExamState, publishKey: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (publishKey) headers['x-publish-key'] = publishKey
  const res = await fetch('/api/exam', {
    method: 'PUT',
    headers,
    body: JSON.stringify(exam),
  })
  if (res.status === 401) throw new Error('發布密鑰不對')
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error || `發布失敗（${res.status}）`)
  }
}

export async function deleteRemoteExam(publishKey: string) {
  const headers: Record<string, string> = {}
  if (publishKey) headers['x-publish-key'] = publishKey
  const res = await fetch('/api/exam', { method: 'DELETE', headers })
  if (res.status === 401) throw new Error('發布密鑰不對')
  if (!res.ok) throw new Error(`撤下失敗（${res.status}）`)
}
