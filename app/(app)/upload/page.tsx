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
