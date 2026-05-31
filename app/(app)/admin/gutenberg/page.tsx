'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface GutBook { id: number; title: string; author: string | null; downloadCount: number; hasText: boolean }

export default function GutenbergAdminPage() {
  const [query, setQuery] = useState('')
  const [lang, setLang] = useState('en')
  const [results, setResults] = useState<GutBook[]>([])
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState<number | null>(null)
  const [imported, setImported] = useState<number[]>([])
  const [message, setMessage] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    setMessage('')
    const res = await fetch(`/api/admin/gutenberg/search?q=${encodeURIComponent(query)}&lang=${lang}`)
    const data = await res.json()
    setResults(data.books || [])
    setSearching(false)
  }

  async function handleImport(book: GutBook) {
    setImporting(book.id)
    setMessage('')
    const res = await fetch('/api/admin/gutenberg/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gutenbergId: book.id }),
    })
    const data = await res.json()
    if (res.ok) {
      setImported(prev => [...prev, book.id])
      setMessage(`✅ 已匯入《${data.title}》，AI 正在處理中...`)
      // 觸發 AI 處理
      fetch('/api/books/process-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: data.bookId }),
      })
    } else {
      setMessage(`❌ 匯入失敗：${data.error}`)
    }
    setImporting(null)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">匯入 Project Gutenberg 書籍</h1>
      <p className="text-sm text-muted-foreground mb-6">
        搜尋並匯入公版書（著作權已過期），完全合法免費
      </p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜尋書名或作者..."
          className="flex-1"
        />
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          className="border rounded-md px-3 text-sm bg-background"
        >
          <option value="en">英文</option>
          <option value="zh">中文</option>
          <option value="fr">法文</option>
          <option value="de">德文</option>
        </select>
        <Button type="submit" disabled={searching || !query}>
          {searching ? '搜尋中...' : '搜尋'}
        </Button>
      </form>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-muted text-sm">{message}</div>
      )}

      <div className="space-y-2">
        {results.map(book => (
          <div key={book.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-tight">{book.title}</p>
              {book.author && <p className="text-xs text-muted-foreground">{book.author}</p>}
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs">#{book.id}</Badge>
                <Badge variant="outline" className="text-xs">⬇ {book.downloadCount.toLocaleString()}</Badge>
                {!book.hasText && <Badge variant="destructive" className="text-xs">無文字版</Badge>}
              </div>
            </div>
            <Button
              size="sm"
              disabled={!book.hasText || importing === book.id || imported.includes(book.id)}
              onClick={() => handleImport(book)}
            >
              {importing === book.id ? '匯入中...' : imported.includes(book.id) ? '已匯入 ✓' : '匯入'}
            </Button>
          </div>
        ))}
      </div>

      {results.length === 0 && !searching && query && (
        <p className="text-center text-muted-foreground py-8">沒有找到結果</p>
      )}
    </div>
  )
}
