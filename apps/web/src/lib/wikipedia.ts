export const WIKI_PAGE_TITLE = '臺北市私立復興實驗高級中學'
export const WIKI_PAGE_URL = `https://zh.wikipedia.org/wiki/${encodeURIComponent(WIKI_PAGE_TITLE)}`
export const WIKI_LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/deed.zh'

const API =
  `https://zh.wikipedia.org/w/api.php?action=parse` +
  `&page=${encodeURIComponent(WIKI_PAGE_TITLE)}` +
  `&prop=text&format=json&origin=*&redirects=1&disableeditsection=1`

const CACHE_KEY = 'fhjh.wiki.zh.v1'
const CACHE_MS = 60 * 60 * 1000

export type WikiArticle = {
  title: string
  html: string
}

export function rewriteWikiHtml(html: string): string {
  return html
    .replace(/\s(?:srcset|data-srcset|srcset-dark)="[^"]*"/gi, '')
    .replace(/(href|src)="\/\//gi, '$1="https://')
    .replace(/(href|src)="\/wiki\//gi, '$1="https://zh.wikipedia.org/wiki/')
    .replace(/(href|src)="\/w\//gi, '$1="https://zh.wikipedia.org/w/')
    .replace(/href="\/(?!\/)/gi, 'href="https://zh.wikipedia.org/')
    .replace(/<a\s/gi, '<a target="_blank" rel="noreferrer" ')
}

export async function fetchSchoolWiki(): Promise<WikiArticle> {
  const cached = readCache()
  if (cached) return cached

  const res = await fetch(API)
  if (!res.ok) throw new Error(`維基百科回應 ${res.status}`)
  const data = (await res.json()) as {
    error?: { info?: string }
    parse?: { title: string; text: { '*': string } }
  }
  if (data.error || !data.parse) {
    throw new Error(data.error?.info || '讀不到條目')
  }

  const article = {
    title: data.parse.title,
    html: rewriteWikiHtml(data.parse.text['*']),
  }
  writeCache(article)
  return article
}

function readCache(): WikiArticle | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WikiArticle & { at: number }
    if (!parsed.html || Date.now() - parsed.at > CACHE_MS) return null
    return { title: parsed.title, html: parsed.html }
  } catch {
    return null
  }
}

function writeCache(article: WikiArticle) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...article, at: Date.now() }))
  } catch {
    /* quota / private mode */
  }
}
