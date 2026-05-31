import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('books')
    .select('*, summaries(id, version, status, duration_sec)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()

  // 確認是自己的書
  const { data: book } = await serviceClient
    .from('books')
    .select('file_path, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // 刪除 Storage 檔案
  if (book.file_path) {
    await serviceClient.storage.from('books-files').remove([book.file_path])
  }
  await serviceClient.storage.from('audio-cache').list(`${user.id}/${id}`).then(async ({ data: files }) => {
    if (files?.length) {
      const paths = files.map(f => `${user.id}/${id}/${f.name}`)
      await serviceClient.storage.from('audio-cache').remove(paths)
    }
  })

  // 刪除資料庫記錄（summaries 會 cascade）
  await serviceClient.from('books').delete().eq('id', id)

  return NextResponse.json({ success: true })
}
