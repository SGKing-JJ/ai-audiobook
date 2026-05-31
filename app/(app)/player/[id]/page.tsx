'use client'
import { useEffect, useState, use } from 'react'
import { usePlayerStore } from '@/store/player'
import { Slider } from '@/components/ui/slider'

function formatTime(secs: number) {
  if (!secs || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [summaryData, setSummaryData] = useState<{
    content_text: string | null
    books: { title: string; author: string | null; cover_url: string | null }
  } | null>(null)

  const { isPlaying, currentTime, duration, speed, setTrack, setIsPlaying, setSpeed } = usePlayerStore()

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/summaries/${id}`)
      if (!res.ok) return
      const data = await res.json()

      const book = Array.isArray(data.books) ? data.books[0] : data.books
      setSummaryData({ content_text: data.content_text, books: book })

      const audioRes = await fetch(`/api/summaries/${id}/audio`)
      if (audioRes.ok) {
        const { url } = await audioRes.json()
        setTrack(id, url, {
          title: book.title,
          author: book.author,
          coverUrl: book.cover_url,
        })
      }
    }
    load()
  }, [id, setTrack])

  function nextSpeed() {
    const idx = SPEEDS.indexOf(speed)
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length])
  }

  if (!summaryData) return <div className="p-4 text-muted-foreground">載入中...</div>

  const book = summaryData.books

  return (
    <div className="p-6 flex flex-col items-center gap-6">
      <div className="mt-6">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title}
            className="w-48 h-72 object-cover rounded-xl shadow-lg" />
        ) : (
          <div className="w-48 h-72 bg-muted rounded-xl flex items-center justify-center text-8xl shadow-lg">📖</div>
        )}
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold">{book.title}</h1>
        {book.author && <p className="text-muted-foreground text-sm mt-1">{book.author}</p>}
      </div>

      <div className="w-full space-y-1">
        <Slider value={[currentTime]} max={duration || 100} step={1} className="w-full" />
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-sm text-muted-foreground w-12 text-center font-medium" onClick={nextSpeed}>
          {speed}x
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg text-2xl"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="w-12" />
      </div>

      {summaryData.content_text && (
        <div className="w-full pb-4">
          <h2 className="font-semibold mb-3 text-sm uppercase text-muted-foreground tracking-wide">摘要全文</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {summaryData.content_text}
          </p>
        </div>
      )}
    </div>
  )
}
