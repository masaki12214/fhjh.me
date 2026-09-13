import { parseScheduleText } from './examStore'

const sample = `八年級第一次段考考程
10/6（二）
1-2節 國文
3-4節 英文
5-6節 數學
10/7（三）
1-2節 理化
3-4節 歷史
5-6節 地理`

const slots = parseScheduleText(sample, 'g8')
if (slots.length !== 6) {
  console.error(slots)
  throw new Error(`expected 6 slots, got ${slots.length}`)
}
if (slots[0].subject !== '國文' || slots[0].date !== '2026-10-06') {
  throw new Error(`bad first slot ${JSON.stringify(slots[0])}`)
}
if (slots[5].subject !== '地理' || slots[5].date !== '2026-10-07') {
  throw new Error(`bad last slot ${JSON.stringify(slots[5])}`)
}
console.log('parseScheduleText ok', slots.length)
