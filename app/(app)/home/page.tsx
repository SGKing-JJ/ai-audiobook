'use client'
import { useEffect, useState } from 'react'
import { BookCard } from '@/components/book/BookCard'
import Link from 'next/link'
import type { Book } from '@/types/database'

export default function HomePage() {
  const [recentBooks, setRecentBooks] = useState<Book[]>([])

  useEffect(() => {
    fetch('/api/books/library')
      .then(r => r.json())
      .then((data: Book[]) => setRecentBooks(data.slice(0, 3)))
  }, [])

  return (
    <div className="p-4 space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">你好 👋</h1>
        <p className="text-muted-foreground">今天要聽哪本書的重點？</p>
      </div>

      {recentBooks.length > 0 ? (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">最近上傳</h2>
            <Link href="/library" className="text-sm text-primary">查看全部</Link>
          </div>
          <div className="space-y-3">
            {recentBooks.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </section>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-muted p-10 text-center">
          <p className="text-4xl mb-3">🎧</p>
          <p className="text-muted-foreground mb-4">還沒有書籍</p>
          <Link href="/upload" className="text-primary font-medium">上傳你的第一本書 →</Link>
        </div>
      )}
    </div>
  )
}
