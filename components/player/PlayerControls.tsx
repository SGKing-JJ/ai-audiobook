'use client'
import { RefObject } from 'react'
import { usePlayerStore } from '@/store/player'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]

export function PlayerControls({ audioRef }: { audioRef: RefObject<HTMLAudioElement | null> }) {
  const { isPlaying, speed, setIsPlaying, setSpeed } = usePlayerStore()

  function nextSpeed() {
    const idx = SPEEDS.indexOf(speed)
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length])
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon"
        onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 15 }}>
        <SkipBack className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon"
        onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>
      <Button variant="ghost" size="icon"
        onClick={() => { if (audioRef.current) audioRef.current.currentTime += 15 }}>
        <SkipForward className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={nextSpeed} className="text-xs w-10">
        {speed}x
      </Button>
    </div>
  )
}
