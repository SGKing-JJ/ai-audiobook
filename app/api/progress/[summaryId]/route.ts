import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ summaryId: string }> }
) {
  const { summaryId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { positionSec, completed } = await request.json()

  const { error } = await supabase.from('play_progress').upsert({
    user_id: user.id,
    summary_id: summaryId,
    position_sec: Math.floor(positionSec),
    completed: completed ?? false,
    updated_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ summaryId: string }> }
) {
  const { summaryId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('play_progress')
    .select('position_sec, completed')
    .eq('user_id', user.id)
    .eq('summary_id', summaryId)
    .single()

  return NextResponse.json(data ?? { position_sec: 0, completed: false })
}
