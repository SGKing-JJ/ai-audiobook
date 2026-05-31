const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech'
const CHUNK_SIZE = 4000 // OpenAI TTS 限制約 4096 字元

function splitIntoChunks(text: string): string[] {
  const chunks: string[] = []
  // 按句子切割，避免語音在奇怪的地方中斷
  const sentences = text.split(/(?<=[。！？.!?])\s*/)
  let current = ''
  for (const sentence of sentences) {
    if ((current + sentence).length > CHUNK_SIZE && current) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current += sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.filter(c => c.length > 0)
}

async function synthesizeChunk(text: string, voice: string, apiKey: string): Promise<Buffer> {
  const response = await fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      response_format: 'mp3',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI TTS error: ${err}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

export function buildTtsRequestBody(text: string, language: string) {
  return { text, language, voice: language === 'zh' ? 'nova' : 'nova' }
}

export async function generateAudio(text: string, language: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not set')

  // nova：活潑有情感，適合中英文知識內容
  const voice = 'nova'
  const chunks = splitIntoChunks(text)
  const buffers: Buffer[] = []

  for (const chunk of chunks) {
    const buf = await synthesizeChunk(chunk, voice, apiKey)
    buffers.push(buf)
  }

  return Buffer.concat(buffers)
}
