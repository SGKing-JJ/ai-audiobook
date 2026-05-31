import { create } from 'zustand'

interface BookInfo {
  title: string
  author: string | null
  coverUrl: string | null
}

interface PlayerStore {
  summaryId: string | null
  bookInfo: BookInfo | null
  audioUrl: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  speed: number
  setTrack: (summaryId: string, audioUrl: string, bookInfo: BookInfo) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setSpeed: (speed: number) => void
  clear: () => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  summaryId: null,
  bookInfo: null,
  audioUrl: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  speed: 1,
  setTrack: (summaryId, audioUrl, bookInfo) =>
    set({ summaryId, audioUrl, bookInfo, isPlaying: true, currentTime: 0 }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setSpeed: (speed) => set({ speed }),
  clear: () => set({ summaryId: null, audioUrl: null, bookInfo: null, isPlaying: false }),
}))
