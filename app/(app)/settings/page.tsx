'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email ?? '')
    })
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      {/* 帳號資訊 */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">帳號</h2>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">登入中</p>
          <p className="font-medium mt-0.5">{email || '...'}</p>
        </div>
      </section>

      {/* 書架功能 */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">書架</h2>
        <div className="rounded-xl border divide-y">
          <Link href="/library?tab=my" className="flex items-center justify-between p-4 hover:bg-accent transition">
            <div>
              <p className="font-medium">我的書籍</p>
              <p className="text-sm text-muted-foreground">管理你上傳的電子書</p>
            </div>
            <span className="text-muted-foreground">→</span>
          </Link>
          <Link href="/library?tab=public" className="flex items-center justify-between p-4 hover:bg-accent transition">
            <div>
              <p className="font-medium">公版書庫</p>
              <p className="text-sm text-muted-foreground">瀏覽免費公版經典書籍</p>
            </div>
            <span className="text-muted-foreground">→</span>
          </Link>
          <Link href="/favorites" className="flex items-center justify-between p-4 hover:bg-accent transition">
            <div>
              <p className="font-medium">收藏清單</p>
              <p className="text-sm text-muted-foreground">查看你收藏的書籍</p>
            </div>
            <span className="text-muted-foreground">→</span>
          </Link>
        </div>
      </section>

      {/* 管理功能 */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">管理</h2>
        <div className="rounded-xl border divide-y">
          <Link href="/admin/gutenberg" className="flex items-center justify-between p-4 hover:bg-accent transition">
            <div>
              <p className="font-medium">匯入公版書</p>
              <p className="text-sm text-muted-foreground">從 Project Gutenberg 匯入免費書籍</p>
            </div>
            <span className="text-muted-foreground">→</span>
          </Link>
        </div>
      </section>

      {/* 登出 */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleSignOut}
      >
        登出
      </Button>

      <p className="text-center text-xs text-muted-foreground">AI 聽書 · MVP v1.0</p>
    </div>
  )
}
