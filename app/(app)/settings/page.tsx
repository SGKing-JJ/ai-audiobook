'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">設定</h1>
      <div className="rounded-xl border divide-y">
        <Link href="/admin/gutenberg" className="flex items-center justify-between p-4 hover:bg-accent transition">
          <div>
            <p className="font-medium">匯入公版書</p>
            <p className="text-sm text-muted-foreground">從 Project Gutenberg 匯入免費書籍</p>
          </div>
          <span className="text-muted-foreground">→</span>
        </Link>
      </div>
      <Button variant="outline" className="w-full" onClick={handleSignOut}>
        登出
      </Button>
    </div>
  )
}
