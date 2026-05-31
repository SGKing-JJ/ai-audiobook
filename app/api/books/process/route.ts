import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, author, filePath, language } = await request.json()
  const serviceClient = createServiceClient()

  const { data: book, error } = await serviceClient
    .from('books')
    .insert({
      user_id: user.id,
      title,
      author: author || null,
      file_path: filePath,
      language: language || 'zh',
      status: 'processing',
      source_type: 'upload',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await serviceClient.from('summaries').insert([
    { book_id: book.id, version: '3min',  language: language || 'zh', status: 'generating' },
    { book_id: book.id, version: '10min', language: language || 'zh', status: 'generating' },
    { book_id: book.id, version: 'deep',  language: language || 'zh', status: 'generating' },
  ])

  return NextResponse.json({ bookId: book.id })
}
