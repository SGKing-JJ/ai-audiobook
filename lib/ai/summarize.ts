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
