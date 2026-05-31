'use client'
import { useEffect, useState } from 'react'
import { BookCard } from '@/components/book/BookCard'
import Link from 'next/link'
import type { Book } from '@/types/database'

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/books/library')
      .then(r => r.json())
      .then(data => { setBooks(data); setLoading(false) })
  }, [])

  if (loading) return <div className="p-4 text-muted-foreground">載入中...</div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">個人書架</h1>
        <Link href="/upload" className="text-sm text-primary">+ 上傳</Link>
      </div>
      {books.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-muted-foreground mb-4">書架還是空的</p>
          <Link href="/upload" className="text-primary font-medium">上傳你的第一本書 →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {books.map(book => <BookCard key={book.id} book={book} />)}
        </div>
      )}
    </div>
  )
}
