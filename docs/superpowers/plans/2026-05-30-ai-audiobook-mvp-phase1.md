# AI 聽書平台 MVP Phase 1 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一個可運作的 PWA，讓使用者上傳合法擁有的 PDF/EPUB，AI 自動生成三種版本摘要並轉成語音，支援鎖屏後繼續播放。

**Architecture:** Next.js 15 App Router 全端架構（前後端同一 repo）。Supabase 負責 PostgreSQL 資料庫、Email/Google 認證、檔案儲存。書籍上傳直接從瀏覽器推送到 Supabase Storage（繞過 Vercel 4.5MB body 限制）。AI 處理管線在 Next.js API Route 中同步執行。Zustand 管理全域播放器狀態，Media Session API 提供鎖屏控制。

**Tech Stack:** Next.js 15, TypeScript 5, Tailwind CSS 4, shadcn/ui, Supabase JS v2 (@supabase/ssr), Anthropic SDK, Google Cloud TTS REST API, Zustand, pdf-parse, adm-zip (EPUB 解析)

---

## 前置準備（開始前先完成）

在開始任何 Task 之前，請先完成以下帳號設定：

1. **Supabase 帳號**: 前往 https://supabase.com → New Project → 記下 Project URL、anon key、service_role key
2. **Anthropic API Key**: 前往 https://console.anthropic.com → API Keys → 建立一個 key
3. **Google Cloud TTS**:
   - 前往 https://console.cloud.google.com
   - 建立專案 → 啟用 "Cloud Text-to-Speech API"
   - Credentials → Create API Key → 記下 key
4. **Vercel 帳號**: 前往 https://vercel.com → 之後 Task 1 完成後連接

---

## 檔案結構總覽

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          登入/註冊頁
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── home/page.tsx           首頁（繼續播放 + 推薦）
│   │   ├── upload/page.tsx         上傳書籍頁
│   │   ├── library/page.tsx        個人書架頁
│   │   ├── book/[id]/page.tsx      書籍詳情頁
│   │   ├── player/[id]/page.tsx    摘要播放頁
│   │   ├── favorites/page.tsx      收藏頁
│   │   └── layout.tsx              APP shell（含底部導覽列）
│   ├── api/
│   │   ├── books/
│   │   │   ├── upload-url/route.ts    取得 Storage 簽名上傳 URL
│   │   │   ├── process/route.ts       觸發 AI 處理管線
│   │   │   ├── library/route.ts       取得個人書架
│   │   │   └── [id]/route.ts          取得/刪除單本書籍
│   │   ├── summaries/
│   │   │   ├── [id]/audio/route.ts    取得音檔簽名 URL
│   │   │   └── [id]/route.ts          取得摘要內容
│   │   ├── progress/
│   │   │   └── [summaryId]/route.ts   更新/取得播放進度
│   │   └── favorites/
│   │       └── [bookId]/route.ts      加入/移除收藏
│   ├── page.tsx                    Landing Page
│   └── layout.tsx                  Root layout
├── components/
│   ├── player/
│   │   ├── AudioPlayer.tsx         浮動播放器（頁面底部常駐）
│   │   └── PlayerControls.tsx      播放控制按鈕
│   ├── book/
│   │   ├── BookCard.tsx            書籍卡片元件
│   │   ├── SummaryPicker.tsx       摘要版本選擇器（3分/10分/深度）
│   │   └── UploadDropzone.tsx      拖放上傳區域
│   └── layout/
│       └── BottomNav.tsx           底部導覽列
├── lib/
│   ├── supabase/
│   │   ├── client.ts               瀏覽器端 Supabase client
│   │   ├── server.ts               伺服器端 Supabase client（API Routes 用）
│   │   └── middleware.ts           Auth middleware helper
│   ├── parse/
│   │   ├── pdf.ts                  PDF → 純文字
│   │   └── epub.ts                 EPUB → 純文字
│   ├── ai/
│   │   ├── prompts.ts              Claude prompt 模板
│   │   └── summarize.ts            呼叫 Claude Haiku 生成摘要
│   └── tts/
│       └── generate.ts             呼叫 Google Cloud TTS 生成 MP3
├── store/
│   └── player.ts                   Zustand 播放器狀態
├── types/
│   └── database.ts                 資料庫型別定義
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  資料庫初始化
└── middleware.ts                   Next.js Auth 路由保護
```

---

## Task 1: 專案腳手架

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts` (由 CLI 自動產生)
- Create: `.env.local`
- Create: `app/layout.tsx`

- [ ] **Step 1: 建立 Next.js 專案**

在你想放專案的資料夾中執行（例如 `C:\Users\satan\files\BOOKING`）：

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir=no --import-alias="@/*" --yes
```

- [ ] **Step 2: 安裝所有相依套件**

```bash
npm install @supabase/supabase-js @supabase/ssr zustand @anthropic-ai/sdk pdf-parse adm-zip
npm install -D @types/pdf-parse @types/adm-zip
npx shadcn@latest init -d
npx shadcn@latest add button card input label badge progress sheet slider
```

- [ ] **Step 3: 建立 .env.local（填入你的真實 key）**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_TTS_API_KEY=AIza...
```

- [ ] **Step 4: 確認專案可以啟動**

```bash
npm run dev
```

Expected: 瀏覽器開啟 http://localhost:3000 顯示 Next.js 預設頁面

- [ ] **Step 5: Commit**

```bash
git init
git add .
git commit -m "feat: initial Next.js 15 project scaffold"
```

---

## Task 2: 資料庫 Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `types/database.ts`

- [ ] **Step 1: 建立 migration 檔案**

建立 `supabase/migrations/001_initial_schema.sql`，內容如下：

```sql
-- 啟用 UUID 擴充
create extension if not exists "uuid-ossp";

-- 使用者 Profile（擴充 Supabase Auth）
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  locale        text not null default 'zh-TW',
  plan          text not null default 'free',
  created_at    timestamptz default now()
);

-- 新用戶自動建立 profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 書籍分類
create table public.categories (
  id        uuid primary key default uuid_generate_v4(),
  slug      text unique not null,
  name_zh   text not null,
  name_en   text not null,
  parent_id uuid references public.categories(id)
);

-- 書籍
create table public.books (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade,
  title        text not null,
  author       text,
  cover_url    text,
  description  text,
  language     text not null default 'zh',
  source_type  text not null default 'upload',
  file_path    text,
  status       text not null default 'processing',
  category_id  uuid references public.categories(id),
  created_at   timestamptz default now()
);

-- AI 摘要
create table public.summaries (
  id            uuid primary key default uuid_generate_v4(),
  book_id       uuid not null references public.books(id) on delete cascade,
  version       text not null,
  content_text  text,
  audio_path    text,
  duration_sec  integer,
  language      text not null default 'zh',
  model_used    text,
  status        text not null default 'generating',
  created_at    timestamptz default now(),
  unique(book_id, version, language)
);

-- 播放進度
create table public.play_progress (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  summary_id    uuid not null references public.summaries(id) on delete cascade,
  position_sec  integer not null default 0,
  completed     boolean not null default false,
  updated_at    timestamptz default now(),
  unique(user_id, summary_id)
);

-- 收藏
create table public.favorites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  book_id    uuid not null references public.books(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, book_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.summaries enable row level security;
alter table public.play_progress enable row level security;
alter table public.favorites enable row level security;

-- Profiles: 只能讀/改自己的
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Books: 只能讀/改/刪自己的
create policy "books_select_own" on public.books for select using (auth.uid() = user_id);
create policy "books_insert_own" on public.books for insert with check (auth.uid() = user_id);
create policy "books_delete_own" on public.books for delete using (auth.uid() = user_id);

-- Summaries: 透過 book 的 user_id 判斷
create policy "summaries_select_own" on public.summaries for select
  using (exists (select 1 from public.books where books.id = summaries.book_id and books.user_id = auth.uid()));

-- Play progress: 只能讀/寫自己的
create policy "progress_all_own" on public.play_progress for all using (auth.uid() = user_id);

-- Favorites: 只能讀/寫自己的
create policy "favorites_all_own" on public.favorites for all using (auth.uid() = user_id);

-- Storage Buckets（在 Supabase Dashboard 手動建立或用 API）
-- books-files: 私有，存使用者上傳的 PDF/EPUB
-- audio-cache: 私有，存 TTS 生成的 MP3
-- book-covers: 公開，存書籍封面
```

- [ ] **Step 2: 在 Supabase Dashboard 執行 SQL**

1. 前往你的 Supabase 專案 Dashboard
2. 點左側 "SQL Editor"
3. 複製貼上上面的 SQL → 點 "Run"
4. 確認沒有 error

- [ ] **Step 3: 在 Supabase Dashboard 建立 Storage Buckets**

1. 點左側 "Storage"
2. 建立三個 Bucket：
   - `books-files` → Private（取消勾選 Public）
   - `audio-cache` → Private
   - `book-covers` → Public（勾選 Public）

- [ ] **Step 4: 建立 TypeScript 型別定義**

建立 `types/database.ts`：

```typescript
export type Plan = 'free' | 'pro'
export type BookStatus = 'processing' | 'ready' | 'error'
export type SummaryVersion = '3min' | '10min' | 'deep'
export type SummaryStatus = 'generating' | 'ready' | 'error'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  locale: string
  plan: Plan
  created_at: string
}

export interface Category {
  id: string
  slug: string
  name_zh: string
  name_en: string
  parent_id: string | null
}

export interface Book {
  id: string
  user_id: string
  title: string
  author: string | null
  cover_url: string | null
  description: string | null
  language: string
  source_type: string
  file_path: string | null
  status: BookStatus
  category_id: string | null
  created_at: string
}

export interface Summary {
  id: string
  book_id: string
  version: SummaryVersion
  content_text: string | null
  audio_path: string | null
  duration_sec: number | null
  language: string
  model_used: string | null
  status: SummaryStatus
  created_at: string
}

export interface PlayProgress {
  id: string
  user_id: string
  summary_id: string
  position_sec: number
  completed: boolean
  updated_at: string
}

export interface BookWithSummaries extends Book {
  summaries: Summary[]
}
```

- [ ] **Step 5: Commit**

```bash
git add supabase/ types/
git commit -m "feat: add database schema and TypeScript types"
```

---

## Task 3: Supabase Client + Auth Middleware

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`

- [ ] **Step 1: 建立瀏覽器端 Supabase client**

建立 `lib/supabase/client.ts`：

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: 建立伺服器端 Supabase client（API Routes 用）**

建立 `lib/supabase/server.ts`：

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function createServiceClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: 建立 Auth middleware（保護登入後的路由）**

建立 `middleware.ts`（在 repo 根目錄）：

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 未登入但訪問 /home, /upload, /library 等 → 導向 /login
  const protectedPaths = ['/home', '/upload', '/library', '/book', '/player', '/favorites']
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 已登入但訪問 /login → 導向 /home
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
```

- [ ] **Step 4: 建立登入/註冊頁**

建立 `app/(auth)/layout.tsx`：

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {children}
    </div>
  )
}
```

建立 `app/(auth)/login/page.tsx`：

```typescript
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/home')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{isSignUp ? '建立帳號' : '登入'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '處理中...' : isSignUp ? '註冊' : '登入'}
          </Button>
        </form>
        <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
          使用 Google 登入
        </Button>
        <button
          type="button"
          className="text-sm text-muted-foreground w-full text-center"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? '已有帳號？登入' : '還沒有帳號？免費註冊'}
        </button>
      </CardContent>
    </Card>
  )
}
```

建立 `app/auth/callback/route.ts`（Google OAuth 回調）：

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/home`)
}
```

- [ ] **Step 5: 驗證登入流程**

```bash
npm run dev
```

前往 http://localhost:3000/login，嘗試用 Email 註冊一個測試帳號，確認可以成功登入並導向 /home（目前 /home 還不存在，會看到 404，這是正常的）。

- [ ] **Step 6: Commit**

```bash
git add app/ lib/ middleware.ts
git commit -m "feat: add Supabase auth, login page, and route protection"
```

---

## Task 4: APP Shell + 底部導覽列

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `components/layout/BottomNav.tsx`
- Create: `app/(app)/home/page.tsx` (暫時的 placeholder)

- [ ] **Step 1: 建立底部導覽列元件**

建立 `components/layout/BottomNav.tsx`：

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Upload, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/home',      icon: Home,     label: '首頁' },
  { href: '/library',   icon: BookOpen, label: '書架' },
  { href: '/upload',    icon: Upload,   label: '上傳' },
  { href: '/favorites', icon: Heart,    label: '收藏' },
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
```

- [ ] **Step 2: 建立 APP layout（含底部導覽 + 播放器空間）**

建立 `app/(app)/layout.tsx`：

```typescript
import { BottomNav } from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-32">{/* pb-32 = 底部導覽(h-16) + 播放器(h-20) 的空間 */}
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 3: 建立 /home 的 placeholder 頁面**

建立 `app/(app)/home/page.tsx`：

```typescript
export default function HomePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">你好，歡迎回來</h1>
      <p className="text-muted-foreground">上傳你的第一本書開始吧</p>
    </div>
  )
}
```

- [ ] **Step 4: 建立其他 placeholder 頁面**

建立 `app/(app)/library/page.tsx`：
```typescript
export default function LibraryPage() {
  return <div className="p-4"><h1 className="text-2xl font-bold">個人書架</h1></div>
}
```

建立 `app/(app)/favorites/page.tsx`：
```typescript
export default function FavoritesPage() {
  return <div className="p-4"><h1 className="text-2xl font-bold">收藏</h1></div>
}
```

- [ ] **Step 5: 確認導覽正常**

```bash
npm run dev
```

登入後應該可以看到底部導覽列，點選各項目可以切換頁面。

- [ ] **Step 6: Commit**

```bash
git add app/ components/
git commit -m "feat: add app shell with bottom navigation"
```

---

## Task 5: 書籍上傳（直接上傳到 Supabase Storage）

**Files:**
- Create: `app/api/books/upload-url/route.ts`
- Create: `app/api/books/process/route.ts`
- Create: `components/book/UploadDropzone.tsx`
- Create: `app/(app)/upload/page.tsx`

- [ ] **Step 1: 建立「取得上傳 URL」的 API Route**

建立 `app/api/books/upload-url/route.ts`：

```typescript
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filename, contentType } = await request.json()
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!['pdf', 'epub'].includes(ext ?? '')) {
    return NextResponse.json({ error: '只支援 PDF 或 EPUB 格式' }, { status: 400 })
  }

  const filePath = `${user.id}/${Date.now()}.${ext}`
  const serviceClient = await createServiceClient()

  const { data, error } = await serviceClient.storage
    .from('books-files')
    .createSignedUploadUrl(filePath)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ signedUrl: data.signedUrl, filePath, token: data.token })
}
```

- [ ] **Step 2: 建立「觸發處理」的 API Route**

建立 `app/api/books/process/route.ts`：

```typescript
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, author, filePath, language } = await request.json()
  const serviceClient = await createServiceClient()

  // 建立書籍記錄（status: processing）
  const { data: book, error } = await serviceClient
    .from('books')
    .insert({
      user_id: user.id,
      title,
      author: author || null,
      file_path: filePath,
      language: language || 'zh',
      status: 'processing',
      source_type: 'upload',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 建立三個摘要記錄（status: generating）
  await serviceClient.from('summaries').insert([
    { book_id: book.id, version: '3min',  language: language || 'zh', status: 'generating' },
    { book_id: book.id, version: '10min', language: language || 'zh', status: 'generating' },
    { book_id: book.id, version: 'deep',  language: language || 'zh', status: 'generating' },
  ])

  return NextResponse.json({ bookId: book.id })
}
```

- [ ] **Step 3: 建立上傳 Dropzone 元件**

建立 `components/book/UploadDropzone.tsx`：

```typescript
'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

type Stage = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export function UploadDropzone() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    // 從檔名自動填入書名
    if (!title) {
      setTitle(f.name.replace(/\.(pdf|epub)$/i, '').replace(/_/g, ' '))
    }
  }, [title])

  async function handleUpload() {
    if (!file || !title) return
    setStage('uploading')
    setError(null)
    setProgress(10)

    // Step 1: 取得簽名上傳 URL
    const urlRes = await fetch('/api/books/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    })
    if (!urlRes.ok) {
      setError((await urlRes.json()).error)
      setStage('error')
      return
    }
    const { signedUrl, filePath } = await urlRes.json()
    setProgress(20)

    // Step 2: 直接上傳到 Supabase Storage
    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    if (!uploadRes.ok) {
      setError('上傳失敗，請重試')
      setStage('error')
      return
    }
    setProgress(50)
    setStage('processing')

    // Step 3: 觸發 AI 處理
    const processRes = await fetch('/api/books/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author, filePath, language: 'zh' }),
    })
    if (!processRes.ok) {
      setError('建立書籍失敗')
      setStage('error')
      return
    }
    const { bookId } = await processRes.json()
    setProgress(100)
    setStage('done')

    setTimeout(() => router.push(`/book/${bookId}`), 1000)
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
        <input
          type="file"
          accept=".pdf,.epub"
          onChange={handleFileChange}
          className="hidden"
          id="file-input"
          disabled={stage !== 'idle' && stage !== 'error'}
        />
        <label htmlFor="file-input" className="cursor-pointer">
          {file ? (
            <p className="text-sm font-medium">{file.name}</p>
          ) : (
            <>
              <p className="text-muted-foreground">點擊選擇 PDF 或 EPUB 檔案</p>
              <p className="text-xs text-muted-foreground mt-1">建議 50MB 以下</p>
            </>
          )}
        </label>
      </div>

      <div>
        <Label htmlFor="title">書名 *</Label>
        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="輸入書名" />
      </div>
      <div>
        <Label htmlFor="author">作者</Label>
        <Input id="author" value={author} onChange={e => setAuthor(e.target.value)} placeholder="輸入作者（選填）" />
      </div>

      {stage !== 'idle' && stage !== 'error' && (
        <div className="space-y-1">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground text-center">
            {stage === 'uploading' ? '上傳中...' : stage === 'processing' ? '正在建立書籍...' : '完成！'}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={handleUpload}
        disabled={!file || !title || (stage !== 'idle' && stage !== 'error')}
        className="w-full"
      >
        {stage === 'idle' || stage === 'error' ? '上傳並分析' : '處理中...'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: 建立上傳頁面**

建立 `app/(app)/upload/page.tsx`：

```typescript
import { UploadDropzone } from '@/components/book/UploadDropzone'

export default function UploadPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-1">上傳書籍</h1>
      <p className="text-muted-foreground text-sm mb-6">
        上傳你合法擁有的 PDF 或 EPUB，AI 將自動生成聽書摘要
      </p>
      <UploadDropzone />
    </div>
  )
}
```

- [ ] **Step 5: 測試上傳流程**

```bash
npm run dev
```

1. 登入後前往 http://localhost:3000/upload
2. 選擇一個小型 PDF 檔案（測試用）
3. 填入書名
4. 點「上傳並分析」
5. 確認 Supabase Storage `books-files` bucket 中出現了上傳的檔案
6. 確認 Supabase `books` 資料表中出現了新記錄（status: processing）

- [ ] **Step 6: Commit**

```bash
git add app/ components/
git commit -m "feat: add book upload flow (direct to Supabase Storage)"
```

---

## Task 6: 檔案文字解析（PDF + EPUB）

**Files:**
- Create: `lib/parse/pdf.ts`
- Create: `lib/parse/epub.ts`
- Create: `lib/parse/pdf.test.ts`

- [ ] **Step 1: 建立 PDF 解析器的測試**

建立 `lib/parse/pdf.test.ts`：

```typescript
import { extractTextFromPdf } from './pdf'
import { readFileSync } from 'fs'
import path from 'path'

// 需要準備一個測試用的簡單 PDF 檔案
// 可以用任何文字 PDF，放在 lib/parse/__fixtures__/test.pdf
describe('extractTextFromPdf', () => {
  it('should return non-empty string from a valid PDF', async () => {
    const pdfBuffer = readFileSync(
      path.join(__dirname, '__fixtures__', 'test.pdf')
    )
    const text = await extractTextFromPdf(pdfBuffer)
    expect(typeof text).toBe('string')
    expect(text.length).toBeGreaterThan(0)
  })

  it('should return empty string for empty buffer', async () => {
    const text = await extractTextFromPdf(Buffer.from(''))
    expect(text).toBe('')
  })
})
```

- [ ] **Step 2: 執行測試確認它會失敗**

```bash
npx jest lib/parse/pdf.test.ts
```

Expected: FAIL（extractTextFromPdf 尚未定義）

- [ ] **Step 3: 建立 PDF 解析器**

建立 `lib/parse/pdf.ts`：

```typescript
import pdfParse from 'pdf-parse'

const MAX_CHARS = 50000

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (buffer.length === 0) return ''
  try {
    const data = await pdfParse(buffer)
    return data.text.slice(0, MAX_CHARS).trim()
  } catch {
    return ''
  }
}
```

- [ ] **Step 4: 建立 EPUB 解析器**

建立 `lib/parse/epub.ts`：

```typescript
import AdmZip from 'adm-zip'

const MAX_CHARS = 50000

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function extractTextFromEpub(buffer: Buffer): Promise<string> {
  if (buffer.length === 0) return ''
  try {
    const zip = new AdmZip(buffer)
    const entries = zip.getEntries()
    const htmlEntries = entries
      .filter(e => e.entryName.endsWith('.html') || e.entryName.endsWith('.xhtml'))
      .sort((a, b) => a.entryName.localeCompare(b.entryName))

    let text = ''
    for (const entry of htmlEntries) {
      const html = entry.getData().toString('utf-8')
      text += stripHtml(html) + '\n'
      if (text.length >= MAX_CHARS) break
    }
    return text.slice(0, MAX_CHARS).trim()
  } catch {
    return ''
  }
}
```

- [ ] **Step 5: 準備測試用 PDF 並執行測試**

1. 放一個測試 PDF 到 `lib/parse/__fixtures__/test.pdf`（任何含有文字的 PDF 即可）
2. 執行測試：

```bash
npx jest lib/parse/pdf.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/parse/
git commit -m "feat: add PDF and EPUB text extraction"
```

---

## Task 7: AI 摘要生成（Claude Haiku）

**Files:**
- Create: `lib/ai/prompts.ts`
- Create: `lib/ai/summarize.ts`
- Create: `lib/ai/summarize.test.ts`

- [ ] **Step 1: 建立 Prompt 模板**

建立 `lib/ai/prompts.ts`：

```typescript
import type { SummaryVersion } from '@/types/database'

interface PromptOptions {
  title: string
  author: string | null
  text: string
  version: SummaryVersion
  language: string
}

const VERSIONS = {
  '3min': {
    words: '300到400字',
    instructions: `
包含以下三個部分，用口語化的敘述連接，不要用條列符號：
1. 一句話說明這本書的核心主題
2. 三個最重要的觀念或洞見（每個用2-3句話說明）
3. 一個最值得立刻實踐的行動建議`,
  },
  '10min': {
    words: '900到1200字',
    instructions: `
包含以下部分，用口語化的敘述連接，不要用條列符號：
1. 書籍背景與作者的核心論點（100字）
2. 每個主要章節或主題的重點整理（500-600字）
3. 書中最重要的3-5個金句或觀念（用自己的話詮釋）
4. 三個可以立刻行動的具體建議（200字）`,
  },
  'deep': {
    words: '2500到3000字',
    instructions: `
包含以下部分，用口語化的敘述連接，不要用條列符號：
1. 書籍背景、作者背景與這本書為何重要（200字）
2. 逐章深入分析，每章包含核心論點、支撐論據、實際案例（1500字）
3. 書中最重要的思維框架或模型（300字）
4. 與其他相關書籍的比較與延伸思考（300字）
5. 五個可以立刻行動的具體建議（400字）`,
  },
}

export function buildSummaryPrompt(opts: PromptOptions): string {
  const { title, author, text, version, language } = opts
  const v = VERSIONS[version]
  const langNote = language === 'zh' ? '請使用繁體中文輸出。' : 'Please output in English.'

  return `你是一位專業的書籍知識摘要師，擅長將書籍濃縮成適合語音朗讀的口語化重點整理。

書名：《${title}》${author ? `\n作者：${author}` : ''}

書籍內容（前段）：
${text}

---

請根據上述內容，生成一份${v.words}的書籍摘要，格式要求如下：
${v.instructions}

重要規則：
- ${langNote}
- 輸出要適合耳機朗讀，使用口語化、自然的說話語氣
- 不要使用「一、二、三」或「•」等條列符號
- 不要直接引用原文段落，請用自己的話整理核心概念
- 開頭不要有「好的」「當然」等填充詞，直接開始內容`
}
```

- [ ] **Step 2: 建立摘要生成函式的測試**

建立 `lib/ai/summarize.test.ts`：

```typescript
import { buildSummaryPrompt } from './prompts'

describe('buildSummaryPrompt', () => {
  it('should include book title in prompt', () => {
    const prompt = buildSummaryPrompt({
      title: '原子習慣',
      author: '詹姆斯·克利爾',
      text: '這是測試書籍內容...',
      version: '3min',
      language: 'zh',
    })
    expect(prompt).toContain('原子習慣')
    expect(prompt).toContain('詹姆斯·克利爾')
    expect(prompt).toContain('繁體中文')
  })

  it('should use correct word count for each version', () => {
    const prompt3min = buildSummaryPrompt({
      title: 'Test', author: null, text: 'content',
      version: '3min', language: 'zh',
    })
    expect(prompt3min).toContain('300到400字')

    const prompt10min = buildSummaryPrompt({
      title: 'Test', author: null, text: 'content',
      version: '10min', language: 'zh',
    })
    expect(prompt10min).toContain('900到1200字')
  })
})
```

- [ ] **Step 3: 執行測試**

```bash
npx jest lib/ai/summarize.test.ts
```

Expected: PASS（純測試 prompt 生成，不呼叫 API）

- [ ] **Step 4: 建立 AI 摘要生成函式**

建立 `lib/ai/summarize.ts`：

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { buildSummaryPrompt } from './prompts'
import type { SummaryVersion } from '@/types/database'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MAX_TOKENS: Record<SummaryVersion, number> = {
  '3min': 1024,
  '10min': 2048,
  'deep': 4096,
}

interface SummarizeOptions {
  title: string
  author: string | null
  text: string
  version: SummaryVersion
  language: string
}

export async function generateSummary(opts: SummarizeOptions): Promise<string> {
  const prompt = buildSummaryPrompt(opts)
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: MAX_TOKENS[opts.version],
    messages: [{ role: 'user', content: prompt }],
  })
  const textContent = message.content.find(c => c.type === 'text')
  return textContent?.text ?? ''
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai/
git commit -m "feat: add Claude Haiku summarization with prompt templates"
```

---

## Task 8: TTS 語音生成（Google Cloud TTS）

**Files:**
- Create: `lib/tts/generate.ts`
- Create: `lib/tts/generate.test.ts`

- [ ] **Step 1: 建立 TTS 生成函式的測試**

建立 `lib/tts/generate.test.ts`：

```typescript
import { buildTtsRequestBody } from './generate'

describe('buildTtsRequestBody', () => {
  it('should use zh-TW voice for Chinese text', () => {
    const body = buildTtsRequestBody('這是一段測試文字', 'zh')
    expect(body.voice.languageCode).toBe('zh-TW')
    expect(body.input.text).toBe('這是一段測試文字')
  })

  it('should use en-US voice for English text', () => {
    const body = buildTtsRequestBody('This is a test', 'en')
    expect(body.voice.languageCode).toBe('en-US')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
npx jest lib/tts/generate.test.ts
```

Expected: FAIL

- [ ] **Step 3: 建立 TTS 生成函式**

建立 `lib/tts/generate.ts`：

```typescript
const TTS_API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize'

interface TtsRequestBody {
  input: { text: string }
  voice: { languageCode: string; name: string }
  audioConfig: { audioEncoding: string; speakingRate: number }
}

export function buildTtsRequestBody(text: string, language: string): TtsRequestBody {
  const isZh = language === 'zh'
  return {
    input: { text },
    voice: {
      languageCode: isZh ? 'zh-TW' : 'en-US',
      name: isZh ? 'zh-TW-Standard-A' : 'en-US-Standard-C',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
    },
  }
}

export async function generateAudio(text: string, language: string): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY
  if (!apiKey) throw new Error('GOOGLE_TTS_API_KEY not set')

  const body = buildTtsRequestBody(text, language)
  const response = await fetch(`${TTS_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`TTS API error: ${err}`)
  }

  const data = await response.json() as { audioContent: string }
  return Buffer.from(data.audioContent, 'base64')
}
```

- [ ] **Step 4: 執行測試**

```bash
npx jest lib/tts/generate.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/tts/
git commit -m "feat: add Google Cloud TTS audio generation"
```

---

## Task 9: AI 處理管線 API Route

這個 API Route 串接 Task 6/7/8，是整個產品的核心後端邏輯。

**Files:**
- Modify: `app/api/books/process/route.ts`
- Create: `app/api/books/process-ai/route.ts` (新的 AI 處理 endpoint)

- [ ] **Step 1: 建立書籍 AI 處理管線 API Route**

建立 `app/api/books/process-ai/route.ts`：

```typescript
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromPdf } from '@/lib/parse/pdf'
import { extractTextFromEpub } from '@/lib/parse/epub'
import { generateSummary } from '@/lib/ai/summarize'
import { generateAudio } from '@/lib/tts/generate'
import { NextResponse } from 'next/server'
import type { SummaryVersion } from '@/types/database'

export const maxDuration = 300 // Vercel 最大 timeout 300秒

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookId } = await request.json()
  const serviceClient = await createServiceClient()

  // 取得書籍資料
  const { data: book } = await serviceClient
    .from('books')
    .select('*')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single()

  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  try {
    // Step 1: 下載並解析書籍文字
    const { data: fileData, error: fileError } = await serviceClient.storage
      .from('books-files')
      .download(book.file_path!)

    if (fileError || !fileData) throw new Error('Failed to download file')

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const ext = book.file_path!.split('.').pop()?.toLowerCase()
    const text = ext === 'epub'
      ? await extractTextFromEpub(buffer)
      : await extractTextFromPdf(buffer)

    if (!text) throw new Error('Failed to extract text from file')

    // Step 2: 生成三個版本的摘要並轉語音
    const versions: SummaryVersion[] = ['3min', '10min', 'deep']

    for (const version of versions) {
      // 取得此版本的 summary 記錄
      const { data: summary } = await serviceClient
        .from('summaries')
        .select('id')
        .eq('book_id', bookId)
        .eq('version', version)
        .single()

      if (!summary) continue

      // 生成 AI 摘要文字
      const summaryText = await generateSummary({
        title: book.title,
        author: book.author,
        text,
        version,
        language: book.language,
      })

      // 生成 TTS 音檔
      const audioBuffer = await generateAudio(summaryText, book.language)

      // 上傳音檔到 Supabase Storage
      const audioPath = `${user.id}/${bookId}/${version}.mp3`
      await serviceClient.storage
        .from('audio-cache')
        .upload(audioPath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        })

      // 更新 summary 記錄
      await serviceClient
        .from('summaries')
        .update({
          content_text: summaryText,
          audio_path: audioPath,
          status: 'ready',
          model_used: 'claude-haiku-4-5-20251001',
        })
        .eq('id', summary.id)
    }

    // 更新書籍狀態為 ready
    await serviceClient
      .from('books')
      .update({ status: 'ready' })
      .eq('id', bookId)

    return NextResponse.json({ success: true })
  } catch (error) {
    // 處理失敗，更新狀態為 error
    await serviceClient.from('books').update({ status: 'error' }).eq('id', bookId)
    await serviceClient.from('summaries').update({ status: 'error' }).eq('book_id', bookId)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: 更新 UploadDropzone 以觸發 AI 處理**

在 `components/book/UploadDropzone.tsx` 的 `handleUpload` 函式，在 `setStage('done')` 前加入：

```typescript
    // Step 3b: 觸發 AI 處理（背景執行，不等待完成）
    fetch('/api/books/process-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId }),
    })
    // 注意：這是 fire-and-forget。AI 處理可能需要 1-3 分鐘。
    // 書籍頁面會輪詢狀態並在完成後顯示摘要。
```

- [ ] **Step 3: 建立音檔 URL API Route**

建立 `app/api/summaries/[id]/audio/route.ts`：

```typescript
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = await createServiceClient()
  const { data: summary } = await serviceClient
    .from('summaries')
    .select('audio_path, status, books(user_id)')
    .eq('id', id)
    .single()

  if (!summary) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (summary.status !== 'ready') {
    return NextResponse.json({ error: 'Audio not ready yet' }, { status: 202 })
  }

  // 驗證是書籍擁有者
  const book = summary.books as { user_id: string } | null
  if (book?.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: signedUrl } = await serviceClient.storage
    .from('audio-cache')
    .createSignedUrl(summary.audio_path!, 3600)

  return NextResponse.json({ url: signedUrl?.signedUrl })
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/ components/
git commit -m "feat: add AI processing pipeline (parse → summarize → TTS)"
```

---

## Task 10: 音訊播放器（Zustand + HTML5 Audio + Media Session API）

**Files:**
- Create: `store/player.ts`
- Create: `components/player/AudioPlayer.tsx`
- Create: `components/player/PlayerControls.tsx`

- [ ] **Step 1: 建立 Zustand 播放器 Store**

建立 `store/player.ts`：

```typescript
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
```

- [ ] **Step 2: 建立播放器元件**

建立 `components/player/AudioPlayer.tsx`：

```typescript
'use client'
import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '@/store/player'
import { PlayerControls } from './PlayerControls'

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const {
    audioUrl, isPlaying, speed, summaryId,
    bookInfo, setCurrentTime, setDuration,
    setIsPlaying,
  } = usePlayerStore()

  // 建立 Audio element（只建立一次）
  useEffect(() => {
    audioRef.current = new Audio()
    return () => { audioRef.current?.pause() }
  }, [])

  // 當 audioUrl 改變時載入新音檔
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    audio.src = audioUrl
    audio.load()
    audio.play().catch(() => setIsPlaying(false))
  }, [audioUrl, setIsPlaying])

  // 同步播放/暫停狀態
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying, setIsPlaying])

  // 同步倍速
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed])

  // 更新時間
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

  // Media Session API（鎖屏控制）
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
```

- [ ] **Step 3: 建立播放控制按鈕元件**

建立 `components/player/PlayerControls.tsx`：

```typescript
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
      <Button
        variant="ghost" size="icon"
        onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 15 }}
      >
        <SkipBack className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost" size="icon"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>
      <Button
        variant="ghost" size="icon"
        onClick={() => { if (audioRef.current) audioRef.current.currentTime += 15 }}
      >
        <SkipForward className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={nextSpeed} className="text-xs w-10">
        {speed}x
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: 將播放器加入 APP Layout**

修改 `app/(app)/layout.tsx`，加入 `<AudioPlayer />`：

```typescript
import { BottomNav } from '@/components/layout/BottomNav'
import { AudioPlayer } from '@/components/player/AudioPlayer'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-32">{children}</main>
      <AudioPlayer />
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add store/ components/player/ app/(app)/layout.tsx
git commit -m "feat: add audio player with Zustand state and Media Session API"
```

---

## Task 11: 播放進度追蹤

**Files:**
- Create: `app/api/progress/[summaryId]/route.ts`
- Create: `hooks/useProgressSync.ts`

- [ ] **Step 1: 建立進度 API Route**

建立 `app/api/progress/[summaryId]/route.ts`：

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ summaryId: string }> }
) {
  const { summaryId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { positionSec, completed } = await request.json()

  const { error } = await supabase.from('play_progress').upsert({
    user_id: user.id,
    summary_id: summaryId,
    position_sec: Math.floor(positionSec),
    completed: completed ?? false,
    updated_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ summaryId: string }> }
) {
  const { summaryId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('play_progress')
    .select('position_sec, completed')
    .eq('user_id', user.id)
    .eq('summary_id', summaryId)
    .single()

  return NextResponse.json(data ?? { position_sec: 0, completed: false })
}
```

- [ ] **Step 2: 建立進度同步 Hook**

建立 `hooks/useProgressSync.ts`：

```typescript
'use client'
import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/player'

export function useProgressSync() {
  const { summaryId, currentTime, isPlaying } = usePlayerStore()
  const lastSyncRef = useRef(0)
  const summaryIdRef = useRef(summaryId)
  summaryIdRef.current = summaryId

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
    }, 30000) // 每 30 秒同步一次

    return () => clearInterval(interval)
  }, [summaryId, currentTime, isPlaying])
}
```

- [ ] **Step 3: 建立 ProgressSyncProvider 並加入 APP Layout**

建立 `components/ProgressSyncProvider.tsx`（獨立 client component，不影響 layout 的 Server Component 能力）：

```typescript
'use client'
import { useProgressSync } from '@/hooks/useProgressSync'

export function ProgressSyncProvider({ children }: { children: React.ReactNode }) {
  useProgressSync()
  return <>{children}</>
}
```

修改 `app/(app)/layout.tsx`，用 ProgressSyncProvider 包裹：

```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add app/api/progress/ hooks/
git commit -m "feat: add play progress tracking (auto-sync every 30s)"
```

---

## Task 12: 書籍詳情頁 + 播放頁

**Files:**
- Create: `app/api/books/[id]/route.ts`
- Create: `app/api/summaries/[id]/route.ts`
- Create: `components/book/SummaryPicker.tsx`
- Create: `app/(app)/book/[id]/page.tsx`
- Create: `app/(app)/player/[id]/page.tsx`

- [ ] **Step 1: 書籍詳情 API**

建立 `app/api/books/[id]/route.ts`：

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('books')
    .select('*, summaries(id, version, status, duration_sec)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: 摘要內容 API**

建立 `app/api/summaries/[id]/route.ts`：

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('summaries')
    .select('*, books!inner(title, author, cover_url, user_id)')
    .eq('id', id)
    .single()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const book = data.books as { user_id: string; title: string; author: string; cover_url: string }
  if (book.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(data)
}
```

- [ ] **Step 3: 摘要版本選擇器元件**

建立 `components/book/SummaryPicker.tsx`：

```typescript
'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Summary } from '@/types/database'

const VERSION_LABELS = {
  '3min':  { label: '3 分鐘版', desc: '核心觀念快速掌握' },
  '10min': { label: '10 分鐘版', desc: '章節重點完整整理' },
  'deep':  { label: '深度版 25分', desc: '完整分析與延伸思考' },
}

export function SummaryPicker({
  summaries,
  bookTitle,
  bookAuthor,
  bookCoverUrl,
}: {
  summaries: Pick<Summary, 'id' | 'version' | 'status' | 'duration_sec'>[]
  bookTitle: string
  bookAuthor: string | null
  bookCoverUrl: string | null
}) {
  const router = useRouter()

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        選擇聆聽版本
      </h2>
      {(['3min', '10min', 'deep'] as const).map(version => {
        const summary = summaries.find(s => s.version === version)
        const info = VERSION_LABELS[version]
        const isReady = summary?.status === 'ready'
        const isGenerating = summary?.status === 'generating'

        return (
          <button
            key={version}
            disabled={!isReady}
            onClick={() => router.push(`/player/${summary?.id}`)}
            className="w-full flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div>
              <p className="font-medium">{info.label}</p>
              <p className="text-sm text-muted-foreground">{info.desc}</p>
            </div>
            {isGenerating && <Badge variant="secondary">生成中...</Badge>}
            {isReady && <Badge variant="default">開始聆聽 ▶</Badge>}
            {!summary && <Badge variant="outline">等待中</Badge>}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: 書籍詳情頁**

建立 `app/(app)/book/[id]/page.tsx`：

```typescript
'use client'
import { useEffect, useState, use } from 'react'
import { SummaryPicker } from '@/components/book/SummaryPicker'
import type { BookWithSummaries } from '@/types/database'

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [book, setBook] = useState<BookWithSummaries | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/books/${id}`)
      if (res.ok) setBook(await res.json())
      setLoading(false)
    }
    load()
    // 如果書籍還在處理中，每 10 秒輪詢一次
    const interval = setInterval(async () => {
      const res = await fetch(`/api/books/${id}`)
      if (res.ok) {
        const data = await res.json()
        setBook(data)
        if (data.status === 'ready') clearInterval(interval)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [id])

  if (loading) return <div className="p-4">載入中...</div>
  if (!book) return <div className="p-4">找不到這本書</div>

  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-4">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-24 h-36 object-cover rounded-lg" />
        ) : (
          <div className="w-24 h-36 bg-muted rounded-lg flex items-center justify-center text-4xl">📖</div>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold">{book.title}</h1>
          {book.author && <p className="text-muted-foreground mt-1">{book.author}</p>}
          {book.status === 'processing' && (
            <p className="text-sm text-amber-500 mt-2">AI 正在分析這本書，約需 1-3 分鐘...</p>
          )}
        </div>
      </div>

      <SummaryPicker
        summaries={book.summaries}
        bookTitle={book.title}
        bookAuthor={book.author}
        bookCoverUrl={book.cover_url}
      />
    </div>
  )
}
```

- [ ] **Step 5: 播放頁**

建立 `app/(app)/player/[id]/page.tsx`：

```typescript
'use client'
import { useEffect, useState, use } from 'react'
import { usePlayerStore } from '@/store/player'
import { Slider } from '@/components/ui/slider'
import type { Summary } from '@/types/database'

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [summary, setSummary] = useState<Summary & { books: { title: string; author: string; cover_url: string } } | null>(null)
  const { isPlaying, currentTime, duration, setTrack, setIsPlaying } = usePlayerStore()

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/summaries/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setSummary(data)

      // 取得音檔 URL 並啟動播放
      const audioRes = await fetch(`/api/summaries/${id}/audio`)
      if (audioRes.ok) {
        const { url } = await audioRes.json()
        setTrack(id, url, {
          title: data.books.title,
          author: data.books.author,
          coverUrl: data.books.cover_url,
        })
      }
    }
    load()
  }, [id, setTrack])

  if (!summary) return <div className="p-4">載入中...</div>

  return (
    <div className="p-6 flex flex-col items-center gap-6 min-h-screen">
      {summary.books.cover_url ? (
        <img
          src={summary.books.cover_url}
          alt={summary.books.title}
          className="w-48 h-72 object-cover rounded-xl shadow-lg mt-8"
        />
      ) : (
        <div className="w-48 h-72 bg-muted rounded-xl flex items-center justify-center text-8xl mt-8">📖</div>
      )}

      <div className="text-center">
        <h1 className="text-xl font-bold">{summary.books.title}</h1>
        <p className="text-muted-foreground">{summary.books.author}</p>
      </div>

      <div className="w-full space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={1}
          onValueChange={([val]) => {
            // 直接操作 audio 在播放頁面較複雜，簡化為顯示進度
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {summary.content_text && (
        <div className="w-full">
          <h2 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">摘要全文</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{summary.content_text}</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/ components/book/
git commit -m "feat: add book detail page, summary picker, and player page"
```

---

## Task 13: 書架頁 + 首頁 + 收藏功能

**Files:**
- Create: `app/api/books/library/route.ts`
- Create: `app/api/favorites/[bookId]/route.ts`
- Create: `components/book/BookCard.tsx`
- Modify: `app/(app)/home/page.tsx`
- Modify: `app/(app)/library/page.tsx`
- Modify: `app/(app)/favorites/page.tsx`

- [ ] **Step 1: 書架 API**

建立 `app/api/books/library/route.ts`：

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('books')
    .select('*, summaries(id, version, status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
```

- [ ] **Step 2: 收藏 API**

建立 `app/api/favorites/[bookId]/route.ts`：

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, book_id: bookId })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('book_id', bookId)

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: 書籍卡片元件**

建立 `components/book/BookCard.tsx`：

```typescript
'use client'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import type { Book } from '@/types/database'

interface BookCardProps {
  book: Book
  isFavorited?: boolean
  onFavoriteToggle?: (bookId: string, favorited: boolean) => void
}

const STATUS_LABELS = {
  processing: { label: '分析中', variant: 'secondary' as const },
  ready: { label: '可聆聽', variant: 'default' as const },
  error: { label: '處理失敗', variant: 'destructive' as const },
}

export function BookCard({ book, isFavorited = false, onFavoriteToggle }: BookCardProps) {
  const [favorited, setFavorited] = useState(isFavorited)
  const status = STATUS_LABELS[book.status]

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    const next = !favorited
    setFavorited(next)
    await fetch(`/api/favorites/${book.id}`, {
      method: next ? 'POST' : 'DELETE',
    })
    onFavoriteToggle?.(book.id, next)
  }

  return (
    <Link href={`/book/${book.id}`} className="flex gap-3 p-3 rounded-xl border bg-card hover:bg-accent transition">
      {book.cover_url ? (
        <img src={book.cover_url} alt={book.title} className="w-14 h-20 object-cover rounded" />
      ) : (
        <div className="w-14 h-20 bg-muted rounded flex items-center justify-center text-2xl">📖</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{book.title}</p>
        {book.author && <p className="text-xs text-muted-foreground truncate">{book.author}</p>}
        <Badge variant={status.variant} className="mt-2 text-xs">{status.label}</Badge>
      </div>
      <button onClick={toggleFavorite} className="p-1 self-start">
        <Heart className={`h-4 w-4 ${favorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
      </button>
    </Link>
  )
}
```

- [ ] **Step 4: 書架頁**

修改 `app/(app)/library/page.tsx`：

```typescript
'use client'
import { useEffect, useState } from 'react'
import { BookCard } from '@/components/book/BookCard'
import type { Book } from '@/types/database'

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/books/library')
      .then(r => r.json())
      .then(data => { setBooks(data); setLoading(false) })
  }, [])

  if (loading) return <div className="p-4">載入中...</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">個人書架</h1>
      {books.length === 0 ? (
        <p className="text-muted-foreground">還沒有書籍，去上傳你的第一本書吧！</p>
      ) : (
        <div className="space-y-3">
          {books.map(book => <BookCard key={book.id} book={book} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: 首頁（顯示最近播放）**

修改 `app/(app)/home/page.tsx`：

```typescript
'use client'
import { useEffect, useState } from 'react'
import { BookCard } from '@/components/book/BookCard'
import Link from 'next/link'
import type { Book } from '@/types/database'

export default function HomePage() {
  const [recentBooks, setRecentBooks] = useState<Book[]>([])

  useEffect(() => {
    fetch('/api/books/library')
      .then(r => r.json())
      .then((data: Book[]) => setRecentBooks(data.slice(0, 3)))
  }, [])

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">你好 👋</h1>
        <p className="text-muted-foreground">今天要聽哪本書的重點？</p>
      </div>

      {recentBooks.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">最近上傳</h2>
            <Link href="/library" className="text-sm text-primary">查看全部</Link>
          </div>
          <div className="space-y-3">
            {recentBooks.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </section>
      )}

      {recentBooks.length === 0 && (
        <div className="rounded-xl border-2 border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">還沒有書籍</p>
          <Link href="/upload" className="text-primary font-medium">上傳你的第一本書 →</Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/ components/book/BookCard.tsx
git commit -m "feat: add library page, home page, favorites toggle"
```

---

## Task 14: Landing Page + 部署到 Vercel

**Files:**
- Modify: `app/page.tsx`
- Create: `.gitignore` 更新（確保 .env.local 不被提交）

- [ ] **Step 1: 建立 Landing Page**

修改 `app/page.tsx`：

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex justify-between items-center border-b">
        <h1 className="font-bold text-lg">AI 聽書</h1>
        <Link href="/login">
          <Button variant="outline" size="sm">登入</Button>
        </Link>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="text-6xl">🎧</div>
        <h2 className="text-3xl font-bold leading-tight">
          把一本書<br />濃縮成 10 分鐘
        </h2>
        <p className="text-muted-foreground max-w-xs">
          上傳你的書，AI 自動生成重點摘要，戴上耳機，通勤時聽完一本書的精華。
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link href="/login?signup=true">
            <Button className="w-full" size="lg">免費開始使用</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full" size="lg">登入</Button>
          </Link>
        </div>
      </section>

      <section className="p-8 grid grid-cols-1 gap-4 max-w-sm mx-auto w-full">
        {[
          { icon: '🤖', title: 'AI 智能摘要', desc: '3分鐘、10分鐘、深度版三種長度' },
          { icon: '🔊', title: '語音朗讀', desc: '真人語音，支援倍速播放' },
          { icon: '📱', title: '背景播放', desc: '鎖屏後繼續播放，邊做事邊聽' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex gap-3 p-4 rounded-xl border">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
```

- [ ] **Step 2: 確認 .gitignore 正確**

確認 `.gitignore` 包含：

```
.env.local
.env*.local
node_modules/
.next/
```

- [ ] **Step 3: 部署到 Vercel**

```bash
# 確認所有 commit 都已提交
git status

# 前往 https://vercel.com → New Project → 匯入你的 GitHub repo
# 或使用 Vercel CLI（需先安裝）：
# npm i -g vercel && vercel
```

在 Vercel Dashboard 中，到 Project → Settings → Environment Variables，加入：
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
GOOGLE_TTS_API_KEY
```

- [ ] **Step 4: 完整測試 MVP 流程**

部署後進行完整測試：
1. 從手機瀏覽器開啟 Vercel URL
2. 使用 Email 註冊新帳號
3. 上傳一個小 PDF（建議先用 1-2 頁的測試 PDF）
4. 等待 AI 處理完成（約 1-3 分鐘）
5. 進入書籍頁面，點「3 分鐘版」
6. 確認語音可以播放
7. 鎖定手機螢幕，確認音訊繼續
8. 在 iOS：先加到主畫面再測試鎖屏播放

- [ ] **Step 5: 最終 Commit**

```bash
git add app/page.tsx
git commit -m "feat: add landing page and complete MVP Phase 1"
```

---

## 自我檢查（Self-Review）

### Spec 覆蓋率

| Spec 需求 | 對應 Task |
|-----------|-----------|
| 使用者上傳 PDF/EPUB | Task 5 |
| AI 生成 3 種摘要版本 | Task 7, 9 |
| TTS 語音朗讀 | Task 8, 9 |
| 播放/暫停/倍速 | Task 10 |
| 鎖屏播放控制 | Task 10（Media Session） |
| 登入/註冊 | Task 3 |
| 個人書架 | Task 13 |
| 播放進度記錄 + 續播 | Task 11 |
| 收藏書籍 | Task 13 |

### 已知限制（MVP 範圍內）

1. **續播功能**：進度已儲存在 DB，但播放頁目前啟動時未自動跳到上次進度（可在 Task 12 的 player 頁面加入：載入後 `audioRef.current.currentTime = savedProgress`）
2. **大型 PDF 處理**：若 PDF 超過 50MB，Supabase Storage 免費版有 50MB 單檔限制
3. **AI 處理超時**：若書籍文字極長，偶爾可能超過 300s Vercel timeout；建議測試時先用小型 PDF
4. **PWA 鎖屏播放**：iOS 需要先「加到主畫面」才能真正背景播放，首次進入 APP 時應顯示提示

---

*計畫生成於 2026-05-30，覆蓋 MVP Phase 1（Month 1–3）*
