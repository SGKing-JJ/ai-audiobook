import { PDFParse } from 'pdf-parse'

const MAX_CHARS = 50000
const MIN_MEANINGFUL_CHARS = 200

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (buffer.length === 0) return ''
  try {
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()

    // result 可能是 string 或 { text: string }
    const raw = typeof result === 'string' ? result : (result as { text: string }).text ?? ''
    const text = raw
      .replace(/--\s*\d+\s*of\s*\d+\s*--/g, '') // 移除頁碼標記
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_CHARS)

    if (text.length < MIN_MEANINGFUL_CHARS) {
      throw new Error('IMAGE_PDF')
    }

    return text
  } catch (e) {
    if (e instanceof Error && e.message === 'IMAGE_PDF') throw e
    return ''
  }
}
