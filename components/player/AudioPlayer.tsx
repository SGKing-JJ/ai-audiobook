'use client'
import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/player'
import { PlayerControls } from './PlayerControls'

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const {
    audioUrl, isPlaying, speed, summaryId,
    bookInfo, setCurrentTime, setDuration, setIsPlaying,
  } = usePlayerStore()

  useEffect(() => {
    audioRef.current = new Audio()
    return () => { audioRef.current?.pause() }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    audio.src = audioUrl
    audio.load()
    audio.play().catch(() => setIsPlaying(false))
  }, [audioUrl, setIsPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying, setIsPlaying])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration)
    const onEnded = () => setIsPlaying(false)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
    }
  }, [setCurrentTime, setDuration, setIsPlaying])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !bookInfo) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: bookInfo.title,
      artist: bookInfo.author ?? '',
      artwork: bookInfo.coverUrl
        ? [{ src: bookInfo.coverUrl, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    })
    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true))
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false))
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (audioRef.current) audioRef.current.currentTime -= 15
    })
    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (audioRef.current) audioRef.current.currentTime += 15
    })
  }, [bookInfo, setIsPlaying])

  if (!summaryId) return null

  return (
    <div className="fixed bottom-16 left-0 right-0 h-20 bg-card border-t px-4 flex items-center gap-3 z-40">
      {bookInfo?.coverUrl ? (
        <img src={bookInfo.coverUrl} alt="" className="h-12 w-12 rounded object-cover" />
      ) : (
        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xl">📖</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{bookInfo?.title}</p>
        <p className="text-xs text-muted-foreground truncate">{bookInfo?.author ?? '未知作者'}</p>
      </div>
      <PlayerControls audioRef={audioRef} />
    </div>
  )
}
