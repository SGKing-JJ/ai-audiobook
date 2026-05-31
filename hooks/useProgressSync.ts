'use client'
import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/player'

export function useProgressSync() {
  const { summaryId, currentTime, isPlaying } = usePlayerStore()
  const lastSyncRef = useRef(0)

  useEffect(() => {
    if (!summaryId || !isPlaying) return

    const interval = setInterval(() => {
      const now = Math.floor(currentTime)
      if (now === lastSyncRef.current) return
      lastSyncRef.current = now

      fetch(`/api/progress/${summaryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionSec: now, completed: false }),
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [summaryId, currentTime, isPlaying])
}
