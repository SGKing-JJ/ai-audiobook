import { createClient, createServiceClient } from '@/lib/supabase/server'
import { extractTextFromPdf } from '@/lib/parse/pdf'
import { extractTextFromEpub } from '@/lib/parse/epub'
import { generateSummary } from '@/lib/ai/summarize'
import { generateAudio } from '@/lib/tts/generate'
import { NextResponse } from 'next/server'
import type { SummaryVersion } from '@/types/database'

export const maxDuration = 300

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookId } = await request.json()
  const serviceClient = createServiceClient()

  const { data: book } = await serviceClient
    .from('books')
    .select('*')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single()

  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  try {
    // Step 1: 下載並解析書籍文字
    const { data: fileData, error: fileError } = await serviceClient.storage
      .from('books-files')
      .download(book.file_path!)

    if (fileError || !fileData) throw new Error('Failed to download file')

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const ext = book.file_path!.split('.').pop()?.toLowerCase()

    let text: string
    try {
      text = ext === 'epub'
        ? await extractTextFromEpub(buffer)
        : await extractTextFromPdf(buffer)
    } catch (e) {
      if (e instanceof Error && e.message === 'IMAGE_PDF') {
        await serviceClient.from('books').update({
          status: 'error',
          description: '這是掃描圖片 PDF，無法擷取文字。請改用有實際文字的電子書 PDF。'
        }).eq('id', bookId)
        await serviceClient.from('summaries').update({ status: 'error' }).eq('book_id', bookId)
        return NextResponse.json({ error: 'IMAGE_PDF' }, { status: 422 })
      }
      throw e
    }

    if (!text) throw new Error('Failed to extract text from file')

    // Step 2: 逐版本生成摘要 + 語音
    const versions: SummaryVersion[] = ['3min', '10min', 'deep']

    for (const version of versions) {
      const { data: summary } = await serviceClient
        .from('summaries')
        .select('id')
        .eq('book_id', bookId)
        .eq('version', version)
        .single()

      if (!summary) continue

      const summaryText = await generateSummary({
        title: book.title,
        author: book.author,
        text,
        version,
        language: book.language,
      })

      const audioBuffer = await generateAudio(summaryText, book.language)

      const audioPath = `${user.id}/${bookId}/${version}.mp3`
      await serviceClient.storage
        .from('audio-cache')
        .upload(audioPath, audioBuffer, { contentType: 'audio/mpeg', upsert: true })

      await serviceClient
        .from('summaries')
        .update({
          content_text: summaryText,
          audio_path: audioPath,
          status: 'ready',
          model_used: 'claude-haiku-4-5-20251001',
        })
        .eq('id', summary.id)
    }

    await serviceClient
      .from('books')
      .update({ status: 'ready' })
      .eq('id', bookId)

    return NextResponse.json({ success: true })
  } catch (error) {
    await serviceClient.from('books').update({ status: 'error' }).eq('id', bookId)
    await serviceClient.from('summaries').update({ status: 'error' }).eq('book_id', bookId)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
