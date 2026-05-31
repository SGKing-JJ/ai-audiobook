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
