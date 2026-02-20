/*
 * discord-backup - by epy
 * github.com/burrice
 */

import { mkdir, appendFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BACKUPS_DIR = path.resolve('backups')

export function getBackupDir(id) {
  return path.join(BACKUPS_DIR, id)
}

export function getChannelDir(backupDir, type, parentName, channelName) {
  const safe = n => n.replace(/[<>:"/\\|?*]/g, '_').slice(0, 100)
  if (type === 'guilds')
    return path.join(backupDir, 'guilds', safe(parentName), safe(channelName))
  return path.join(backupDir, 'dms', safe(channelName))
}

export async function ensureDir(dir) {
  await mkdir(dir, { recursive: true })
}

export async function appendMessages(channelDir, messages) {
  const jsonl = messages.map(m => JSON.stringify(m)).join('\n') + '\n'
  await appendFile(path.join(channelDir, 'messages.jsonl'), jsonl, 'utf8')

  const txt = messages.map(fmtMsg).join('\n') + '\n'
  await appendFile(path.join(channelDir, 'chat.txt'), txt, 'utf8')
}

function fmtMsg(msg) {
  const date = new Date(msg.timestamp)
  const t = date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const author = msg.author?.username || 'Desconhecido'
  const bot = msg.author?.bot ? ' [BOT]' : ''
  const del = msg._deleted ? ' (apagada)' : ''

  let line = `[${t}] ${author}${bot}${del}`

  if (msg.referenced_message) {
    const ref = msg.referenced_message.author?.username || '?'
    const preview = (msg.referenced_message.content || '').slice(0, 50)
    line += `\n  ↪ Em resposta a ${ref}: "${preview}"`
  }

  if (msg.content)
    line += `\n  ${msg.content.replace(/\n/g, '\n  ')}`

  if (msg.attachments?.length)
    for (const a of msg.attachments)
      line += `\n  📎 ${a.filename} (${a.url})`

  if (msg.embeds?.length)
    for (const e of msg.embeds) {
      if (e.title) line += `\n  📌 [Embed] ${e.title}`
      if (e.description) line += `\n  ${e.description.slice(0, 200).replace(/\n/g, '\n  ')}`
    }

  if (msg.sticker_items?.length)
    for (const s of msg.sticker_items)
      line += `\n  🏷️ [Sticker] ${s.name}`

  if (msg.reactions?.length) {
    const r = msg.reactions.map(r => `${r.emoji.name || '?'} x${r.count}`).join('  ')
    line += `\n  💬 ${r}`
  }

  return line
}

export async function writeManifest(backupDir, manifest) {
  await writeFile(
    path.join(backupDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  )
}
