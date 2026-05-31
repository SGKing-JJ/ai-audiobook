import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filename, contentType } = await request.json()
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!['pdf', 'epub'].includes(ext ?? '')) {
    return NextResponse.json({ error: '只支援 PDF 或 EPUB 格式' }, { status: 400 })
  }

  const filePath = `${user.id}/${Date.now()}.${ext}`
  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient.storage
    .from('books-files')
    .createSignedUploadUrl(filePath)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ signedUrl: data.signedUrl, filePath, token: data.token })
}
