/*
 * discord-backup - by epy
 * github.com/burrice
 */

import { mkdir } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import path from 'node:path'
import { log } from '../utils/logger.js'
import { sleep } from '../utils/sleep.js'

export async function downloadAttachments(messages, channelDir) {
  const atts = messages.flatMap(m =>
    (m.attachments || []).map(a => ({ url: a.url, filename: `${m.id}_${a.filename}` }))
  )

  if (!atts.length) return 0

  const dir = path.join(channelDir, 'media')
  await mkdir(dir, { recursive: true })

  let count = 0
  for (const att of atts) {
    try {
      const dest = path.join(dir, att.filename.replace(/[<>:"/\\|?*]/g, '_'))
      const res = await fetch(att.url)
      if (!res.ok) { log.warn(`Falha ao baixar ${att.filename}: ${res.status}`); continue }

      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
      count++
      await sleep(100)
    } catch (e) {
      log.warn(`Erro ao baixar ${att.filename}: ${e.message}`)
    }
  }

  return count
}
