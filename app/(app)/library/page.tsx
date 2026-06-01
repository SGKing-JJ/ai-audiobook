'use client'
import { useEffect, useState } from 'react'
import { BookCard } from '@/components/book/BookCard'
import Link from 'next/link'
import type { Book } from '@/types/database'

const TABS = [
  { key: 'all',    label: '全部' },
  { key: 'public', label: '公版書庫' },
  { key: 'my',     label: '我的書' },
]

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'public' | 'my'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/books/library?type=${tab}`)
      .then(r => r.json())
      .then(data => { setBooks(Array.isArray(data) ? data : []); setLoading(false) })
  }, [tab])

  const filtered = books.filter(b =>
    !search || b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.author ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const readyBooks = filtered.filter(b => b.status === 'ready')
  const processingBooks = filtered.filter(b => b.status !== 'ready' && b.status !== 'error')

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">書架</h1>
        <Link href="/upload" className="text-sm text-primary">+ 上傳</Link>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 搜尋書名或作者..."
        className="w-full border rounded-xl px-4 py-2 text-sm bg-background mb-4"
      />

      <div className="flex gap-2 mb-4">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              tab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-muted-foreground text-center py-12">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-muted-foreground mb-4">
            {search ? '找不到符合的書籍' : tab === 'my' ? '還沒有上傳書籍' : '書架是空的'}
          </p>
          {tab === 'my' && <Link href="/upload" className="text-primary font-medium">上傳你的第一本書 →</Link>}
        </div>
      ) : (
        <div className="space-y-4">
          {readyBooks.length > 0 && (
            <div>
              {processingBooks.length > 0 && (
                <p className="text-xs text-muted-foreground mb-2">可聆聽（{readyBooks.length} 本）</p>
              )}
              <div className="space-y-2">
                {readyBooks.map(book => <BookCard key={book.id} book={book} />)}
              </div>
            </div>
          )}
          {processingBooks.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">AI 處理中（{processingBooks.length} 本）</p>
              <div className="space-y-2">
                {processingBooks.map(book => <BookCard key={book.id} book={book} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
