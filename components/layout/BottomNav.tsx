'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Upload, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/home',     icon: Home,     label: '首頁' },
  { href: '/library',  icon: BookOpen, label: '書架' },
  { href: '/upload',   icon: Upload,   label: '上傳' },
  { href: '/settings', icon: Settings, label: '設定' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around z-50">
      {navItems.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-col items-center gap-1 text-xs px-3 py-2',
            pathname.startsWith(href)
              ? 'text-primary'
              : 'text-muted-foreground'
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
