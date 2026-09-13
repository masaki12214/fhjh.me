const KEY = 'exam.json'

type ExamEnv = {
  EXAM: {
    get(key: string): Promise<string | null>
    put(key: string, value: string): Promise<void>
    delete(key: string): Promise<void>
  }
  EXAM_PUBLISH_KEY?: string
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function authorized(request: Request, env: ExamEnv) {
  const expected = env.EXAM_PUBLISH_KEY
  if (!expected) return false
  const header = request.headers.get('x-publish-key') || ''
  return header === expected
}

export default {
  async fetch(request: Request, env: ExamEnv) {
    const url = new URL(request.url)
    if (url.pathname !== '/api/exam') return new Response(null, { status: 404 })

    if (request.method === 'GET') {
      const raw = await env.EXAM.get(KEY)
      if (!raw) return json({ exam: null })
      try {
        return json({ exam: JSON.parse(raw) })
      } catch {
        return json({ exam: null })
      }
    }

    if (request.method === 'PUT' || request.method === 'POST') {
      if (!authorized(request, env)) return json({ error: '需要發布密鑰' }, 401)
      let body: { name?: string; scheduleStatus?: string; schedule?: unknown[] }
      try {
        body = (await request.json()) as typeof body
      } catch {
        return json({ error: 'JSON 讀不到' }, 400)
      }
      if (!body?.name || !Array.isArray(body.schedule)) {
        return json({ error: '格式不對' }, 400)
      }
      if (body.scheduleStatus !== 'published' && body.scheduleStatus !== 'unpublished') {
        return json({ error: 'status 不對' }, 400)
      }
      await env.EXAM.put(KEY, JSON.stringify(body))
      return json({ ok: true })
    }

    if (request.method === 'DELETE') {
      if (!authorized(request, env)) return json({ error: '需要發布密鑰' }, 401)
      await env.EXAM.delete(KEY)
      return json({ ok: true })
    }

    return json({ error: '方法不行' }, 405)
  },
}
