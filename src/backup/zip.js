/*
 * discord-backup - by epy
 * github.com/burrice
 */

import { createWriteStream } from 'node:fs'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import archiver from 'archiver'
import { log } from '../utils/logger.js'

export async function zipBackup(backupDir, username) {
  const safe = username.replace(/[<>:"/\\|?*\s]/g, '_')
  const date = new Date().toISOString().slice(0, 10)
  const name = `${safe}-${date}.zip`
  const zipPath = path.join(path.dirname(backupDir), name)

  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 6 } })

    output.on('close', async () => {
      const mb = (archive.pointer() / 1048576).toFixed(1)
      log.info(`ZIP criado: ${name} (${mb} MB)`)
      try { await rm(backupDir, { recursive: true, force: true }) } catch {}
      resolve(zipPath)
    })

    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(backupDir, path.basename(backupDir))
    archive.finalize()
  })
}
