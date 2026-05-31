'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { SummaryPicker } from '@/components/book/SummaryPicker'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { BookWithSummaries } from '@/types/database'

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [book, setBook] = useState<BookWithSummaries | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/books/${id}`)
      if (res.ok) setBook(await res.json())
      setLoading(false)
    }
    load()

    const interval = setInterval(async () => {
      const res = await fetch(`/api/books/${id}`)
      if (res.ok) {
        const data = await res.json()
        setBook(data)
        if (data.status === 'ready') clearInterval(interval)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [id])

  async function handleDelete() {
    if (!confirm('確定要刪除這本書嗎？')) return
    setDeleting(true)
    const res = await fetch(`/api/books/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/library')
    } else {
      alert('刪除失敗，請重試')
      setDeleting(false)
    }
  }

  if (loading) return <div className="p-4 text-muted-foreground">載入中...</div>
  if (!book) return <div className="p-4 text-muted-foreground">找不到這本書</div>

  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-4">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-24 h-36 object-cover rounded-lg shadow" />
        ) : (
          <div className="w-24 h-36 bg-muted rounded-lg flex items-center justify-center text-5xl shadow">📖</div>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight">{book.title}</h1>
          {book.author && <p className="text-muted-foreground mt-1">{book.author}</p>}
          {book.status === 'processing' && (
            <div className="mt-3 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2">
              ⏳ AI 正在分析這本書，約需 1–3 分鐘...
            </div>
          )}
          {book.status === 'error' && (
            <div className="mt-3 text-sm text-destructive bg-destructive/10 rounded-lg p-2">
              ❌ 處理失敗，可刪除後重新上傳
            </div>
          )}
        </div>
      </div>

      <SummaryPicker summaries={book.summaries} />

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive w-full"
        onClick={handleDelete}
        disabled={deleting}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {deleting ? '刪除中...' : '刪除這本書'}
      </Button>
    </div>
  )
}
