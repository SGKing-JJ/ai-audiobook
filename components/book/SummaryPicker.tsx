'use client'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { Summary } from '@/types/database'

const VERSION_LABELS = {
  '3min':  { label: '3 分鐘版', desc: '核心觀念快速掌握', time: '~3分鐘' },
  '10min': { label: '10 分鐘版', desc: '章節重點完整整理', time: '~10分鐘' },
  'deep':  { label: '深度版', desc: '完整分析與延伸思考', time: '~25分鐘' },
}

export function SummaryPicker({
  summaries,
}: {
  summaries: Pick<Summary, 'id' | 'version' | 'status' | 'duration_sec'>[]
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
              <p className="text-sm text-muted-foreground">{info.desc} · {info.time}</p>
            </div>
            {isGenerating && <Badge variant="secondary">生成中...</Badge>}
            {isReady && <Badge>開始聆聽 ▶</Badge>}
            {!summary && <Badge variant="outline">等待中</Badge>}
          </button>
        )
      })}
    </div>
  )
}
