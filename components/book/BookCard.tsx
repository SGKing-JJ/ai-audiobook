'use client'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import type { Book } from '@/types/database'

interface BookCardProps {
  book: Book
  isFavorited?: boolean
}

const STATUS_LABELS = {
  processing: { label: 'AI 分析中', variant: 'secondary' as const },
  ready:      { label: '可聆聽', variant: 'default' as const },
  error:      { label: '處理失敗', variant: 'destructive' as const },
}

export function BookCard({ book, isFavorited = false }: BookCardProps) {
  const [favorited, setFavorited] = useState(isFavorited)
  const status = STATUS_LABELS[book.status]

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    const next = !favorited
    setFavorited(next)
    await fetch(`/api/favorites/${book.id}`, { method: next ? 'POST' : 'DELETE' })
  }

  return (
    <Link href={`/book/${book.id}`}
      className="flex gap-3 p-3 rounded-xl border bg-card hover:bg-accent transition">
      {book.cover_url ? (
        <img src={book.cover_url} alt={book.title} className="w-14 h-20 object-cover rounded flex-shrink-0" />
      ) : (
        <div className="w-14 h-20 bg-muted rounded flex items-center justify-center text-2xl flex-shrink-0">📖</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm leading-tight line-clamp-2">{book.title}</p>
        {book.author && <p className="text-xs text-muted-foreground mt-1 truncate">{book.author}</p>}
        <Badge variant={status.variant} className="mt-2 text-xs">{status.label}</Badge>
      </div>
      <button onClick={toggleFavorite} className="p-1 self-start flex-shrink-0">
        <Heart className={`h-4 w-4 ${favorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
      </button>
    </Link>
  )
}
