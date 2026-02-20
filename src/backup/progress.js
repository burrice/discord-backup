/*
 * discord-backup - by epy
 * github.com/burrice
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export class ProgressTracker {
  constructor(backupDir) {
    this.file = path.join(backupDir, '.progress.json')
    this.data = { channels: {} }
  }

  async load() {
    try {
      this.data = JSON.parse(await readFile(this.file, 'utf8'))
    } catch {}
    return this
  }

  isComplete(id) { return this.data.channels[id]?.complete === true }
  getLastId(id) { return this.data.channels[id]?.lastMessageId ?? null }
  getCount(id) { return this.data.channels[id]?.messageCount ?? 0 }

  async update(id, lastMessageId, messageCount) {
    this.data.channels[id] = { ...this.data.channels[id], lastMessageId, messageCount, complete: false }
    await this.save()
  }

  async markComplete(id, messageCount) {
    this.data.channels[id] = { ...this.data.channels[id], messageCount, complete: true }
    await this.save()
  }

  async save() {
    await writeFile(this.file, JSON.stringify(this.data, null, 2), 'utf8')
  }
}
