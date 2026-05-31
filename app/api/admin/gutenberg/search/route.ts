import { NextResponse } from 'next/server'

const GUTENDEX_API = 'https://gutendex.com/books'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const page = searchParams.get('page') || '1'
  const lang = searchParams.get('lang') || 'en'

  const url = `${GUTENDEX_API}?search=${encodeURIComponent(query)}&languages=${lang}&page=${page}`
  const res = await fetch(url)
  if (!res.ok) return NextResponse.json({ error: 'Gutenberg API failed' }, { status: 500 })

  const data = await res.json()
  const books = (data.results || []).map((b: {
    id: number
    title: string
    authors: { name: string }[]
    download_count: number
    formats: Record<string, string>
  }) => ({
    id: b.id,
    title: b.title,
    author: b.authors[0]?.name ?? null,
    downloadCount: b.download_count,
    hasText: !!(b.formats['text/plain; charset=utf-8'] || b.formats['text/plain; charset=us-ascii'] || b.formats['text/plain']),
  }))

  return NextResponse.json({ books, total: data.count, next: data.next })
}
