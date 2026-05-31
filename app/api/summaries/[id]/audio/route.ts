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

  const serviceClient = createServiceClient()
  const { data: summary } = await serviceClient
    .from('summaries')
    .select('audio_path, status, books(user_id)')
    .eq('id', id)
    .single()

  if (!summary) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (summary.status !== 'ready') return NextResponse.json({ error: 'Audio not ready' }, { status: 202 })

  const bookRaw = summary.books as unknown
  const book = (Array.isArray(bookRaw) ? bookRaw[0] : bookRaw) as { user_id: string } | null
  if (book?.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: signedUrl } = await serviceClient.storage
    .from('audio-cache')
    .createSignedUrl(summary.audio_path!, 3600)

  return NextResponse.json({ url: signedUrl?.signedUrl })
}
