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
