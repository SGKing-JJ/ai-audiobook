import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎧</span>
          <span className="font-bold text-lg">AI 聽書</span>
        </div>
        <Link href="/login">
          <Button variant="outline" size="sm">登入</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center gap-6">
        <div className="space-y-1">
          <div className="text-6xl mb-4">🎧</div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            把一本書<br />
            <span className="text-primary">濃縮成 10 分鐘</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-xs mx-auto">
            上傳你的書，AI 自動生成重點摘要，<br />戴上耳機，通勤路上聽完一本書的精華。
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link href="/login?mode=signup">
            <Button className="w-full" size="lg">免費開始使用</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full" size="lg">已有帳號？登入</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-12 max-w-md mx-auto w-full space-y-4">
        <h2 className="text-center font-semibold text-muted-foreground text-sm uppercase tracking-wide">為什麼選擇 AI 聽書</h2>
        {[
          { icon: '🤖', title: 'AI 智能摘要', desc: '3分鐘、10分鐘、深度版三種長度，由 Claude AI 生成' },
          { icon: '🔊', title: '自然語音朗讀', desc: 'OpenAI 最新語音技術，媲美真人播音' },
          { icon: '📱', title: '通勤隨走隨聽', desc: '鎖屏繼續播放，支援倍速，切換 APP 不中斷' },
          { icon: '📚', title: '豐富書單', desc: '數千本免費公版經典，或上傳你自己的電子書' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex gap-4 p-4 rounded-xl border bg-card">
            <span className="text-3xl flex-shrink-0">{icon}</span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Footer CTA */}
      <section className="px-6 pb-12 text-center">
        <Link href="/login?mode=signup">
          <Button size="lg" className="w-full max-w-xs">立即免費試用 →</Button>
        </Link>
        <p className="text-xs text-muted-foreground mt-3">無需信用卡，免費使用基本功能</p>
      </section>
    </main>
  )
}
