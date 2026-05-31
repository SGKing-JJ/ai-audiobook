'use client'
import { useProgressSync } from '@/hooks/useProgressSync'

export function ProgressSyncProvider({ children }: { children: React.ReactNode }) {
  useProgressSync()
  return <>{children}</>
}
