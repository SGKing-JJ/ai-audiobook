'use client'
import { useEffect, useState } from 'react'
import { BookCard } from '@/components/book/BookCard'
import Link from 'next/link'
import type { Book } from '@/types/database'

export default function FavoritesPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setLoading(false)

      const { data } = await supabase
        .from('favorites')
        .select('books(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const favBooks = (data ?? []).map((f: { books: Book | Book[] }) => {
        const b = f.books
        return Array.isArray(b) ? b[0] : b
      }).filter(Boolean) as Book[]
      setBooks(favBooks)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-4 text-muted-foreground">載入中...</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">收藏</h1>
      {books.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🤍</p>
          <p className="text-muted-foreground mb-4">還沒有收藏的書籍</p>
          <Link href="/library" className="text-primary font-medium">去書架收藏 →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {books.map(book => <BookCard key={book.id} book={book} isFavorited />)}
        </div>
      )}
    </div>
  )
}
