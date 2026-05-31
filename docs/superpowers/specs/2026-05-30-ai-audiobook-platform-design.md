# AI 聽書平台 — 完整產品設計規格文件

**版本** 1.0  
**日期** 2026-05-30  
**狀態** 已確認  
**適用讀者** 開發者、設計師、投資人

---

## 專案背景

- **開發者**: 個人獨立開發者，零基礎願意學習
- **每月預算上限**: USD $100（實際估算 $8–24/月）
- **內容策略**: 混合策略（公版書 + 使用者上傳 + 後期授權）
- **目標市場**: 繁體中文為主，雙語擴充（英文）
- **技術路線**: 兩階段（PWA → React Native）

---

## 一、產品概覽

### 1.1 產品一句話定義

> 「上傳任何你合法擁有的書，AI 60秒內濃縮成10分鐘重點，戴上耳機，通勤路上邊走邊聽。」

### 1.2 五個定位角度（同時成立）

| # | 定位 | 核心訴求 |
|---|------|---------|
| A | 通勤場景工具 | 走路、騎車、做家事時聆聽書籍重點 |
| B | 效率摘要引擎 | 不讀完整本書，AI 幫你抓核心 |
| C | 個人化 AI 助理 | 你的書、你問問題、AI 回答 |
| D | 知識型 Spotify | 像音樂播放器一樣管理知識書單 |
| E | 上傳轉語音工具 | PDF/EPUB → AI 摘要 → 語音播放 |

---

## 二、使用者族群分析

| 族群 | 核心痛點 | 使用場景 | 最重要功能 |
|------|---------|---------|-----------|
| 上班族通勤族 | 通勤時間無法閱讀 | 捷運、步行 20–40 分鐘 | 語音播放、倍速、續播 |
| 忙碌創業者 | 想吸收知識但時間極少 | 午餐、健身時 | 3/10 分鐘摘要 |
| 家長 | 帶孩子做家事無法讀書 | 做飯、洗碗時 | 背景播放、鎖屏繼續 |
| 學生/自學者 | 想讀很多書但讀完太慢 | 睡前、運動時 | AI 問答、筆記 |
| 投資人/主管 | 需要快速掌握書的核心論點 | 開會前、出差時 | 深度版摘要、章節分拆 |

---

## 三、MVP 功能清單

### 🟢 必要功能（第一版，目標 2–3 個月上線）

| 功能 | 說明 |
|------|------|
| 使用者上傳 PDF/EPUB | 使用者帶自己合法擁有的書來 |
| AI 生成摘要 | 3分鐘版 + 10分鐘版 + 深度版 |
| TTS 語音朗讀 | 摘要轉語音（MP3） |
| 播放器 | 播放/暫停/±15秒/倍速（0.75x–2x） |
| 鎖屏播放控制 | Media Session API，耳機按鈕可控制 |
| 登入/註冊 | Email 或 Google OAuth（Supabase Auth） |
| 個人書架 | 查看已上傳的書籍與摘要狀態 |
| 播放進度記錄 + 續播 | 每30秒自動儲存，下次繼續 |
| 收藏書籍 | 加入/移除收藏 |

### 🟡 可延後功能（上線後 1–2 個月補上）

- 公版書搜尋（Project Gutenberg 整合）
- 書籍分類瀏覽（14個分類）
- AI 問答（針對書本內容提問，RAG 模式）
- 中英文介面切換（i18n）
- PWA 加到主畫面引導
- 最近播放頁

### 🟣 未來進階功能（Phase 2+）

- 訂閱付費（Stripe）
- 推播通知
- 閱讀統計儀表板
- 書單分享功能
- 多種 TTS 聲音選擇
- React Native 原生 APP（iOS/Android）

---

## 四、完整頁面架構

### 4.1 頁面清單

```
公開頁面（未登入可看）
  /               歡迎頁（Landing Page）
  /login          登入/註冊頁

主應用（登入後）
  /home           首頁（繼續播放 + 推薦）
  /upload         上傳書籍
  /library        個人書架
  /book/:id       書籍詳情頁
  /player/:id     摘要播放頁（核心頁面）
  /search         搜尋頁
  /category/:slug 分類瀏覽頁
  /favorites      收藏頁
  /recent         最近播放頁
  /settings       設定頁

進階（Phase 2）
  /subscribe      訂閱頁

後台管理
  /admin/books    書籍管理
  /admin/users    使用者管理
  /admin/queue    AI 處理佇列
```

### 4.2 各頁面設計規格

#### 歡迎頁 `/`
- **目的**: 5秒讓訪客理解產品，轉換為註冊用戶
- **主要元素**: Hero 標語、3個核心功能亮點、「免費開始使用」CTA、產品截圖
- **UX 重點**: 行動版優先設計，標語要能一眼說清楚產品是什麼

#### 首頁 `/home`
- **目的**: 快速回到上次在聽的書
- **主要元素**: 「繼續播放」卡片（最顯眼）、最近上傳的書、公版推薦書
- **UX 重點**: 「繼續播放」按鈕在第一眼就看到，不需額外點擊

#### 上傳頁 `/upload`
- **目的**: 上傳書籍並觸發 AI 處理
- **主要元素**: 拖放區域（PDF/EPUB）、處理進度（解析中→摘要中→語音中→完成）
- **UX 重點**: 處理過程要有明確進度回饋，避免用戶以為當機

#### 書籍詳情頁 `/book/:id`
- **目的**: 讓用戶決定要聽哪個版本的摘要
- **主要元素**: 書封、書名/作者/簡介、三個摘要版本（標示時間）、「開始聆聽」按鈕
- **UX 重點**: 三個版本的時間長度要清楚標示（3分 / 10分 / 25分）

#### 摘要播放頁 `/player/:id`（最重要）
- **目的**: 主要使用體驗
- **主要元素**: 書封（大）、進度條、播放控制、倍速按鈕、文字稿（同步捲動）
- **使用者操作流程**:
  1. 進入頁面 → 自動載入音檔
  2. 點播放 → 開始朗讀
  3. 鎖屏 → 鎖屏畫面顯示控制
  4. 倍速 → 點速度按鈕切換
  5. 離開 → 自動儲存進度
- **UX 重點**: 鎖屏後能用耳機按鈕控制；文字稿同步高亮顯示

#### 設定頁 `/settings`
- **目的**: 個人化偏好設定
- **主要元素**: 預設播放速度、TTS 聲音選擇（Phase 2）、介面語言、帳號管理、登出

---

## 五、技術架構

### 5.1 技術選型

#### 第一階段：PWA（Month 1–6）

```
前端框架   Next.js 15 App Router + TypeScript
UI 元件    Tailwind CSS + shadcn/ui
全局狀態   Zustand（播放器狀態管理）
音訊播放   HTML5 Audio API + Media Session API
PWA        next-pwa（Service Worker + 離線支援）
部署       Vercel（Hobby 免費額度）

後端       Next.js API Routes（全端同一 repo）
資料庫     Supabase（PostgreSQL）
認證       Supabase Auth（Email + Google OAuth）
檔案儲存   Supabase Storage
AI 摘要    Claude Haiku API（anthropic SDK）
語音合成   Google Cloud Text-to-Speech
PDF 解析   pdf-parse（Node.js）
EPUB 解析  epub.js
搜尋       Supabase Full-Text Search
```

#### 第二階段：React Native（Month 7–12）

```
框架       Expo SDK + Expo Router
音訊       react-native-track-player（原生背景播放）
後端       共用第一階段所有 Supabase + API
建置       EAS Build（雲端編譯）
部署       App Store（$99/年）+ Google Play（$25 一次）
```

### 5.2 月費成本估算

| 項目 | 方案 | 月費（USD） |
|------|------|------------|
| Vercel 托管 | Hobby 免費 | $0 |
| Supabase | Free（500MB DB + 1GB Storage） | $0 |
| Claude Haiku API | 每本書摘要約 $0.02–0.05 | $5–15 |
| Google Cloud TTS | 每本摘要音檔約 $0.003 | $2–8 |
| 網域（Cloudflare） | 年費攤分 | ~$1 |
| **總計** | | **$8–24/月** |

### 5.3 PWA 背景播放解法

```
iOS Safari 限制與解法：

限制：一般瀏覽器開啟 PWA，切到背景會暫停音訊
解法：引導用戶「加到主畫面」安裝 PWA
→ iOS 15+ 安裝後，背景播放行為接近原生 APP

實作要點：
1. Media Session API 設定鎖屏播放資訊
   navigator.mediaSession.metadata = new MediaMetadata({
     title: book.title,
     artist: book.author,
     artwork: [{ src: book.cover_url, sizes: '512x512' }]
   })

2. Action Handler 設定
   mediaSession.setActionHandler('play', () => audio.play())
   mediaSession.setActionHandler('pause', () => audio.pause())
   mediaSession.setActionHandler('seekbackward', () => audio.currentTime -= 15)
   mediaSession.setActionHandler('seekforward', () => audio.currentTime += 15)

3. 首次進入 APP 顯示「加到主畫面」引導 Banner
4. 音訊必須由使用者手動觸發（iOS 禁止自動播放）
```

---

## 六、資料庫設計

```sql
-- 使用者 Profile（擴充 Supabase Auth 內建 auth.users）
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name  TEXT,
  avatar_url    TEXT,
  locale        TEXT NOT NULL DEFAULT 'zh-TW',
  plan          TEXT NOT NULL DEFAULT 'free',  -- free | pro
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 書籍分類
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT UNIQUE NOT NULL,  -- 'business', 'self-growth'
  name_zh    TEXT NOT NULL,
  name_en    TEXT NOT NULL,
  parent_id  UUID REFERENCES categories(id)
);

-- 書籍
CREATE TABLE books (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id),  -- NULL = 公版書
  title        TEXT NOT NULL,
  author       TEXT,
  cover_url    TEXT,
  description  TEXT,
  language     TEXT NOT NULL DEFAULT 'zh',
  source_type  TEXT NOT NULL,  -- 'upload' | 'gutenberg' | 'manual'
  source_url   TEXT,           -- 公版書原始 URL
  file_path    TEXT,           -- Supabase Storage 路徑
  status       TEXT NOT NULL DEFAULT 'processing',  -- processing | ready | error
  category_id  UUID REFERENCES categories(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- AI 摘要
CREATE TABLE summaries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  version       TEXT NOT NULL,  -- '3min' | '10min' | 'deep'
  content_text  TEXT,
  audio_url     TEXT,           -- Supabase Storage 音檔路徑
  duration_sec  INTEGER,
  language      TEXT NOT NULL DEFAULT 'zh',
  model_used    TEXT,           -- 'claude-haiku-4-5-20251001'
  status        TEXT NOT NULL DEFAULT 'generating',  -- generating | ready | error
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, version, language)
);

-- 播放進度
CREATE TABLE play_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  summary_id    UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  position_sec  INTEGER NOT NULL DEFAULT 0,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, summary_id)
);

-- 收藏
CREATE TABLE favorites (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id    UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, book_id)
);
```

**Supabase Storage Buckets**

```
books-files/   使用者上傳的原始 PDF/EPUB（私有，Row Level Security）
audio-cache/   TTS 生成的 MP3 音檔（私有，簽名 URL 存取，60分鐘有效）
book-covers/   書籍封面圖片（公開）
```

---

## 七、API 規劃

```
=== 書籍管理 ===
POST   /api/books/upload           上傳書籍，觸發 AI 處理 Job
GET    /api/books/library          個人書架（分頁）
GET    /api/books/:id              書籍詳情（含摘要清單）
DELETE /api/books/:id              刪除書籍與相關資料

=== 摘要與音訊 ===
GET    /api/summaries/:id          取得摘要文字內容
GET    /api/summaries/:id/audio    取得音檔簽名 URL（60分鐘有效）
POST   /api/summaries/generate     觸發特定版本摘要生成（手動重試用）

=== 播放進度 ===
GET    /api/progress               取得所有播放進度（含最近播放排序）
PUT    /api/progress/:summaryId    更新播放進度（每30秒呼叫）

=== 收藏 ===
GET    /api/favorites              收藏清單
POST   /api/favorites/:bookId      加入收藏
DELETE /api/favorites/:bookId      移除收藏

=== 探索（公版書） ===
GET    /api/categories             取得分類樹
GET    /api/explore                公版書清單（分頁、支援 category 篩選）
GET    /api/search?q=&lang=        全文搜尋書籍

=== AI 問答（Phase 2） ===
POST   /api/ai/chat                針對指定書本提問（RAG）
```

---

## 八、書籍分類架構

14 個主類別，每類可下拆子類別：

| # | Slug | 中文名 | 熱門子類 |
|---|------|--------|---------|
| 1 | business | 商業理財 | 管理、財務、策略 |
| 2 | self-growth | 自我成長 | 習慣、時間管理、心態 |
| 3 | investment | 投資理財 | 股票、房地產、個人理財 |
| 4 | entrepreneurship | 創業經營 | 新創、產品、商業模式 |
| 5 | marketing | 行銷業務 | 品牌、數位行銷、銷售 |
| 6 | management | 職場管理 | 領導、溝通、職涯 |
| 7 | psychology | 心理學 | 認知偏誤、行為、人際 |
| 8 | communication | 人際溝通 | 說話、談判、關係 |
| 9 | technology | 科技趨勢 | AI、區塊鏈、未來學 |
| 10 | parenting | 親子教育 | 教養、學習法、青少年 |
| 11 | health | 健康生活 | 飲食、運動、睡眠 |
| 12 | history | 歷史文化 | 世界史、台灣史、哲學 |
| 13 | biography | 傳記人物 | 企業家、政治人物、藝術家 |
| 14 | literature | 小說文學 | 現代小說、經典文學（公版為主） |

---

## 九、AI 摘要流程

```
使用者上傳 PDF/EPUB
        ↓
Step 1  檔案解析（Next.js API Route）
        PDF → pdf-parse → 純文字
        EPUB → epub.js → 純文字
        → 取前 50,000 字（約 50 頁，控制 AI 費用）
        ↓
Step 2  AI 摘要生成（Claude Haiku API）
        三個版本各呼叫一次，或使用 Batch API 降低成本
        
        3min 版 Prompt 核心指令：
        "輸出適合語音朗讀的口語化重點，約300-400字繁體中文，
         包含：核心主題一句話 + 3個最重要觀念 + 1個行動建議。
         不要引用原文，用自己的話整理。"
        
        ↓
Step 3  TTS 語音生成（Google Cloud TTS）
        語音：zh-TW-Standard-A（預設）
        格式：MP3，16kHz
        → 輸出 MP3 音檔（Buffer）
        ↓
Step 4  音檔上傳至 Supabase Storage
        路徑：audio-cache/{book_id}/{version}_{language}.mp3
        ↓
Step 5  更新資料庫
        summaries.status → 'ready'
        summaries.audio_url → Storage 路徑
        summaries.duration_sec → 音檔長度
        ↓
Step 6  通知前端（Supabase Realtime）
        前端訂閱 summaries 表格變更，狀態變 ready 時自動更新 UI
```

### 摘要版本規格

| 版本 | 字數 | 朗讀時間 | 內容結構 | 估算 API 成本 |
|------|------|----------|---------|-------------|
| 3min 版 | 300–400字 | ~3分鐘 | 核心主題 + 3觀念 + 1行動 | ~$0.005 |
| 10min 版 | 900–1200字 | ~10分鐘 | 章節重點 + 金句 + 行動建議 | ~$0.015 |
| 深度版 | 2500–3000字 | ~25分鐘 | 完整分析 + 延伸思考 | ~$0.04 |

---

## 十、語音播放流程

```
使用者點「開始播放」
        ↓
前端請求 GET /api/summaries/:id/audio
後端生成 Supabase Storage 簽名 URL（60分鐘有效）
        ↓
前端建立 HTML5 Audio element
  const audio = new Audio(signedUrl)
        ↓
設定 Media Session API（鎖屏資訊）
  navigator.mediaSession.metadata = new MediaMetadata({
    title: summary.book.title,
    artist: summary.book.author,
    artwork: [{ src: summary.book.cover_url, sizes: '512x512', type: 'image/jpeg' }]
  })
        ↓
設定 Media Action Handlers（耳機/鎖屏控制）
  play / pause / seekbackward(-15s) / seekforward(+15s)
        ↓
啟動進度儲存（每30秒）
  setInterval(() => {
    PUT /api/progress/:summaryId { position_sec: audio.currentTime }
  }, 30000)
        ↓
使用者操作：
  鎖屏 → 鎖屏畫面顯示書封 + 播放控制
  切到其他 APP → 繼續播放（需已加到主畫面）
  耳機按鈕 → 觸發對應 Action Handler
        ↓
播放完成
  completed = true → 儲存至 play_progress
  → 顯示「你已聽完這本書的摘要」+ 推薦下一本
```

---

## 十一、法務與版權風險分析

### 風險等級分類

| 情境 | 風險等級 | 說明 | 對策 |
|------|---------|------|------|
| 使用者上傳自己合法購買的書 | 🟡 低中 | 個人使用合理，但平台儲存有疑慮 | 服務條款要求聲明，可選擇處理後刪除原始檔 |
| 平台自行收錄現代暢銷書全文 | 🔴 **不可做** | 明確違反台灣著作權法 | 絕對禁止 |
| 使用公版書（著作權已過期） | 🟢 零風險 | 完全合法 | 積極建立公版書庫 |
| AI 生成原創摘要（不抄原文） | 🟢 低風險 | Prompt 明確要求原創整理 | 不引用原文段落，只提取概念 |
| 顯示書籍封面圖片 | 🟡 中 | 封面設計有版權 | 使用 Google Books API 合法封面 |

### 合法資料來源比較

| 來源 | 書籍量 | 語言 | 成本 | 風險 | 建議用途 |
|------|--------|------|------|------|---------|
| Project Gutenberg | 70,000+ 本 | 英文為主 | 免費 | 零 | MVP 英文公版書庫 |
| Open Library API | 數百萬筆 | 多語言 | 免費（有限額） | 零 | Metadata 查詢 |
| Google Books API | 數千萬筆 | 多語言 | 免費（有限額） | 低 | 封面、簡介 |
| 台灣國家圖書館 | 數萬筆 | 繁中 | 免費（需申請） | 低 | 台灣書籍 Metadata |
| 使用者上傳 | 無上限 | 任何 | 零 | 低中 | MVP 主要內容來源 |
| 出版社授權 | 視合作 | 任何 | 高（版稅） | 低 | Phase 3+ |

### 合規操作指引

1. **服務條款**：要求用戶聲明「我合法擁有此書的電子版授權」
2. **原始檔處理**：AI 處理完後提供選項「刪除原始 PDF/EPUB，只保留摘要」
3. **摘要不抄原文**：Claude Prompt 明確指示輸出原創整理，不引用段落
4. **封面來源**：使用 Google Books API 提供的封面（有授權許可）
5. **DMCA 機制**：預先設計後台「快速下架書籍」功能，收到投訴可立即處理
6. **隱私政策**：說明用戶上傳的書籍如何儲存、處理、是否共享

---

## 十二、商業模式

### 免費 vs 付費功能

| 功能 | 免費版 | Pro（$4.99/月） |
|------|--------|----------------|
| 上傳書籍 | 3本/月 | 無限 |
| 摘要版本 | 僅 3 分鐘版 | 3分 + 10分 + 深度版 |
| 倍速播放 | 1x / 1.5x | 0.75x–2x |
| 音檔品質 | 標準 | 高品質，多聲音可選 |
| 離線快取 | ✗ | ✅ |
| AI 問答 | ✗ | ✅（Phase 2） |
| 廣告 | 有（Phase 2） | 無 |

### 定價策略

- **月訂閱**: $4.99（約 NT$160，一杯咖啡的心理門檻）
- **年訂閱**: $39.9（省 33%，推動年付提高留存）
- **學生方案**: $2.99/月（Phase 2，需 .edu 信箱驗證）
- **企業版**: $29/月，10 席位（Phase 3）

### 提高留存率策略

1. **習慣形成**：每次打開首頁看到「繼續上次的書」，形成每日開啟習慣
2. **成就感**：「你今年已聽完 12 本書的重點」年度報告
3. **推薦鏈**：聽完自動推薦「讀了這本書的人還聽了...」
4. **內容 Email**：每週一封書摘 Email，不開 APP 也能接觸品牌
5. **免費版上限**：3本/月的限制讓重度用戶自然升級，不強迫輕度用戶

---

## 十三、開發時程表

### Phase 1：MVP PWA（Month 1–3）

#### Month 1：基礎建設
- [ ] 建立 Next.js 15 + TypeScript + Tailwind 專案
- [ ] 設計並建立所有 Supabase 資料表與 RLS 政策
- [ ] 實作使用者登入/註冊（Supabase Auth + Google OAuth）
- [ ] 實作書籍上傳（前端拖放 + 後端存至 Supabase Storage）
- [ ] 建立基本頁面骨架（歡迎頁、首頁、書架頁、書籍詳情）
- [ ] 部署到 Vercel，設定環境變數

#### Month 2：AI 核心功能
- [ ] 實作 PDF 解析（pdf-parse）
- [ ] 實作 EPUB 解析（epub.js）
- [ ] 串接 Claude Haiku API，生成 3 種摘要版本
- [ ] 串接 Google Cloud TTS，生成 MP3 音檔
- [ ] 實作書籍詳情頁（顯示摘要版本選項 + 處理進度）
- [ ] 實作基本播放器（播放/暫停/倍速/進度條）

#### Month 3：體驗完整化
- [ ] 實作播放進度記錄（30秒自動儲存）+ 續播
- [ ] 實作 Media Session API（鎖屏控制 + 耳機按鈕）
- [ ] 實作收藏功能
- [ ] 加入 Project Gutenberg 公版書搜尋
- [ ] 實作文字稿同步顯示（播放時高亮對應段落）
- [ ] 全面測試：iOS Safari / Android Chrome / PWA 安裝後
- [ ] Beta 上線，邀請 20 個測試用戶收集回饋

### Phase 2：功能完善（Month 4–6）
- [ ] 書籍分類瀏覽（14個分類）
- [ ] AI 問答功能（RAG，使用 Supabase pgvector）
- [ ] 中英文介面切換（next-intl）
- [ ] 訂閱付費（Stripe Checkout + Webhooks）
- [ ] PWA 安裝引導 Banner
- [ ] 效能優化（音檔預載、圖片 lazy load）
- [ ] 正式上線 + 開始收費

### Phase 3：原生 APP（Month 7–12，視用戶數決定）
- [ ] 評估是否有足夠用戶支持投資原生 APP
- [ ] 建立 Expo 專案，共用 Supabase 後端（API 不需改）
- [ ] 實作 react-native-track-player（完整背景播放）
- [ ] App Store 審核 + Google Play 上架

---

## 十四、未來擴充功能建議

| 優先級 | 功能 | 說明 |
|--------|------|------|
| 高 | AI 個人化推薦 | 根據已聽書單推薦下一本 |
| 高 | 出版社授權合作 | 正式進軍現代暢銷書目錄 |
| 中 | 書友圈 | 分享書單，看朋友在聽什麼 |
| 中 | 閱讀統計 | 年度報告，「你今年聽了幾本書」 |
| 中 | 企業知識庫版 | 上傳公司文件，AI 摘要+語音化 |
| 低 | API 對外開放 | 讓其他 APP 嵌入 AI 摘要功能 |
| 低 | 多語言 TTS | 日語、韓語、法語市場擴充 |
| 低 | Podcast 模式 | 作者親自錄音解說重點（Premium） |

---

*文件由 AI 聽書平台設計工作坊輸出，2026-05-30*
