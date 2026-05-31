import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const GUTENDEX_API = 'https://gutendex.com/books'

interface GutenbergBook {
  id: number
  title: string
  authors: { name: string }[]
  formats: Record<string, string>
  subjects: string[]
  languages: string[]
  download_count: number
}

async function fetchBookInfo(gutenbergId: number): Promise<GutenbergBook | null> {
  const res = await fetch(`${GUTENDEX_API}/${gutenbergId}`)
  if (!res.ok) return null
  return res.json()
}

async function downloadBookText(book: GutenbergBook): Promise<string | null> {
  // 優先順序：plain text UTF-8 > plain text
  const textUrl =
    book.formats['text/plain; charset=utf-8'] ||
    book.formats['text/plain; charset=us-ascii'] ||
    book.formats['text/plain']
  if (!textUrl) return null

  const res = await fetch(textUrl)
  if (!res.ok) return null
  const text = await res.text()
  // 移除 Project Gutenberg 前後的版權聲明
  return cleanGutenbergText(text)
}

function cleanGutenbergText(text: string): string {
  const startMarkers = [
    '*** START OF THE PROJECT GUTENBERG',
    '*** START OF THIS PROJECT GUTENBERG',
    '*END*THE SMALL PRINT',
  ]
  const endMarkers = [
    '*** END OF THE PROJECT GUTENBERG',
    '*** END OF THIS PROJECT GUTENBERG',
    'End of the Project Gutenberg',
    'End of Project Gutenberg',
  ]

  let start = 0
  for (const marker of startMarkers) {
    const idx = text.indexOf(marker)
    if (idx !== -1) {
      start = text.indexOf('\n', idx) + 1
      break
    }
  }

  let end = text.length
  for (const marker of endMarkers) {
    const idx = text.indexOf(marker)
    if (idx !== -1) { end = idx; break }
  }

  return text.slice(start, end).trim().slice(0, 50000)
}

export async function POST(request: Request) {
  const serviceClient = createServiceClient()

  const { gutenbergId, triggerAi = false } = await request.json()
  if (!gutenbergId) return NextResponse.json({ error: 'gutenbergId required' }, { status: 400 })

  // 查 Gutendex API 取得書籍資訊
  const bookInfo = await fetchBookInfo(gutenbergId)
  if (!bookInfo) return NextResponse.json({ error: 'Book not found on Gutenberg' }, { status: 404 })

  const title = bookInfo.title
  const author = bookInfo.authors[0]?.name ?? null
  const language = bookInfo.languages[0] === 'zh' ? 'zh' : 'en'

  // 下載書籍全文
  const textContent = await downloadBookText(bookInfo)
  if (!textContent) {
    return NextResponse.json({ error: 'No plain text format available for this book' }, { status: 422 })
  }

  // 儲存文字到 Supabase Storage（作為「虛擬 file」）
  const filePath = `gutenberg/${gutenbergId}.txt`
  const { error: uploadError } = await serviceClient.storage
    .from('books-files')
    .upload(filePath, Buffer.from(textContent, 'utf-8'), {
      contentType: 'text/plain',
      upsert: true,
    })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  // 建立書籍記錄（user_id = null 表示公版書）
  const { data: book, error: bookError } = await serviceClient
    .from('books')
    .insert({
      title,
      author,
      language,
      source_type: 'gutenberg',
      file_path: filePath,
      status: 'processing',
      description: `Project Gutenberg #${gutenbergId}. Downloads: ${bookInfo.download_count}`,
    })
    .select()
    .single()

  if (bookError) return NextResponse.json({ error: bookError.message }, { status: 500 })

  // 建立三個摘要記錄
  await serviceClient.from('summaries').insert([
    { book_id: book.id, version: '3min',  language, status: 'generating' },
    { book_id: book.id, version: '10min', language, status: 'generating' },
    { book_id: book.id, version: 'deep',  language, status: 'generating' },
  ])

  // triggerAi is accepted but AI processing is triggered by the client separately
  void triggerAi

  return NextResponse.json({ bookId: book.id, title, author, language, textLength: textContent.length })
}
