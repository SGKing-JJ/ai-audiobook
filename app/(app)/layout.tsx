import { BottomNav } from '@/components/layout/BottomNav'
import { AudioPlayer } from '@/components/player/AudioPlayer'
import { ProgressSyncProvider } from '@/components/ProgressSyncProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProgressSyncProvider>
      <div className="min-h-screen bg-background">
        <main className="pb-32">{children}</main>
        <AudioPlayer />
        <BottomNav />
      </div>
    </ProgressSyncProvider>
  )
}
