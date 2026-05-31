import type { SummaryVersion } from '@/types/database'

interface PromptOptions {
  title: string
  author: string | null
  text: string
  version: SummaryVersion
  language: string
}

const VERSIONS = {
  '3min': {
    words: '300到400字',
    instructions: `包含以下三個部分，用口語化的敘述連接，不要用條列符號：
1. 一句話說明這本書的核心主題
2. 三個最重要的觀念或洞見（每個用2-3句話說明）
3. 一個最值得立刻實踐的行動建議`,
  },
  '10min': {
    words: '900到1200字',
    instructions: `包含以下部分，用口語化的敘述連接，不要用條列符號：
1. 書籍背景與作者的核心論點（100字）
2. 每個主要章節或主題的重點整理（500-600字）
3. 書中最重要的3-5個金句或觀念（用自己的話詮釋）
4. 三個可以立刻行動的具體建議（200字）`,
  },
  'deep': {
    words: '2500到3000字',
    instructions: `包含以下部分，用口語化的敘述連接，不要用條列符號：
1. 書籍背景、作者背景與這本書為何重要（200字）
2. 逐章深入分析，每章包含核心論點、支撐論據、實際案例（1500字）
3. 書中最重要的思維框架或模型（300字）
4. 與其他相關書籍的比較與延伸思考（300字）
5. 五個可以立刻行動的具體建議（400字）`,
  },
}

export function buildSummaryPrompt(opts: PromptOptions): string {
  const { title, author, text, version, language } = opts
  const v = VERSIONS[version]
  const langNote = language === 'zh' ? '請使用繁體中文輸出。' : 'Please output in English.'

  return `你是一位專業的書籍知識摘要師，擅長將書籍濃縮成適合語音朗讀的口語化重點整理。

書名：《${title}》${author ? `\n作者：${author}` : ''}

書籍內容（前段）：
${text}

---

請根據上述內容，生成一份${v.words}的書籍摘要，格式要求如下：
${v.instructions}

重要規則：
- ${langNote}
- 輸出要適合耳機朗讀，使用口語化、自然的說話語氣
- 不要使用「一、二、三」或「•」等條列符號
- 不要直接引用原文段落，請用自己的話整理核心概念
- 開頭不要有「好的」「當然」等填充詞，直接開始內容`
}
