import { rewriteWikiHtml } from './wikipedia.ts'

const html = rewriteWikiHtml(
  `<p><a href="/wiki/臺北市">台北</a><img src="//upload.wikimedia.org/x.jpg" srcset="//upload.wikimedia.org/x.jpg 2x"></p>`,
)

if (!html.includes('https://zh.wikipedia.org/wiki/臺北市')) {
  throw new Error(`wiki href not rewritten: ${html}`)
}
if (!html.includes('https://upload.wikimedia.org/x.jpg')) {
  throw new Error(`protocol-relative src not rewritten: ${html}`)
}
if (html.includes('srcset=')) {
  throw new Error(`srcset should be stripped: ${html}`)
}
if (!html.includes('target="_blank"')) {
  throw new Error(`links should open in a new tab: ${html}`)
}

console.log('rewriteWikiHtml ok')
