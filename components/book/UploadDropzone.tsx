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
    if (!title) {
      setTitle(f.name.replace(/\.(pdf|epub)$/i, '').replace(/[_-]/g, ' '))
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
    setProgress(60)
    setStage('processing')

    // Step 3: 建立書籍記錄
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

    // 觸發 AI 處理（fire-and-forget，不等待完成）
    fetch('/api/books/process-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId }),
    })

    setProgress(100)
    setStage('done')

    setTimeout(() => router.push(`/book/${bookId}`), 1000)
  }

  const canUpload = stage === 'idle' || stage === 'error'

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div
        className="border-2 border-dashed border-muted rounded-xl p-8 text-center cursor-pointer hover:border-primary transition"
        onClick={() => canUpload && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf,.epub"
          onChange={handleFileChange}
          className="hidden"
          disabled={!canUpload}
        />
        {file ? (
          <div>
            <p className="text-2xl mb-2">📄</p>
            <p className="font-medium text-sm">{file.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-4xl mb-3">📚</p>
            <p className="text-muted-foreground">點擊選擇 PDF 或 EPUB 檔案</p>
            <p className="text-xs text-muted-foreground mt-1">建議 50MB 以下</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="title">書名 *</Label>
          <Input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="輸入書名"
            disabled={!canUpload}
          />
        </div>
        <div>
          <Label htmlFor="author">作者（選填）</Label>
          <Input
            id="author"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="輸入作者名稱"
            disabled={!canUpload}
          />
        </div>
      </div>

      {(stage === 'uploading' || stage === 'processing' || stage === 'done') && (
        <div className="space-y-1">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground text-center">
            {stage === 'uploading' && '上傳中...'}
            {stage === 'processing' && '建立書籍中...'}
            {stage === 'done' && '✅ 完成！即將跳轉...'}
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</p>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || !title || !canUpload}
        className="w-full"
        size="lg"
      >
        {canUpload ? '上傳並開始分析' : '處理中...'}
      </Button>
    </div>
  )
}
