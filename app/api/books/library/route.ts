import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'my' | 'public' | 'all'
  const category = searchParams.get('category')

  let query = supabase
    .from('books')
    .select('*, summaries(id, version, status)')
    .order('title', { ascending: true })

  if (type === 'my') {
    query = query.eq('user_id', user.id)
  } else if (type === 'public') {
    query = query.is('user_id', null)
    if (category) query = query.eq('source_type', category)
  } else {
    // 'all' — 自己的書 + 公版書
    query = query.or(`user_id.eq.${user.id},user_id.is.null`)
  }

  const { data } = await query

  return NextResponse.json(data ?? [])
}
