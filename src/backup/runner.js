/*
 * discord-backup - by epy
 * github.com/burrice
 */

import { fetchMessages } from '../api/messages.js'
import { getGuildChannels, getGuildName } from '../api/guilds.js'
import { getDMDisplayName } from '../api/channels.js'
import { getBackupDir, getChannelDir, ensureDir, appendMessages, writeManifest } from './storage.js'
import { ProgressTracker } from './progress.js'
import { downloadAttachments } from './media.js'
import { log } from '../utils/logger.js'

export async function runBackup({ guilds = [], dmChannels = [], downloadMedia = false, onProgress }) {
  const backupId = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = getBackupDir(backupId)
  await ensureDir(backupDir)

  const progress = await new ProgressTracker(backupDir).load()
  const summary = { backupId, startedAt: new Date().toISOString(), channels: [], totalMessages: 0, totalMedia: 0 }
  const notify = (d) => onProgress?.(d)

  for (const guild of guilds) {
    const channels = guild._channels || await getGuildChannels(guild.id)
    const guildName = guild.name || await getGuildName(guild.id)

    for (const ch of channels) {
      const dir = getChannelDir(backupDir, 'guilds', guildName, ch.name)
      await ensureDir(dir)

      const r = await backupChannel(ch.id, `#${ch.name} (${guildName})`, dir, progress, downloadMedia, notify)
      summary.channels.push({ type: 'guild', guild: guildName, channel: ch.name, ...r })
      summary.totalMessages += r.messageCount
      summary.totalMedia += r.mediaCount
    }
  }

  for (const dm of dmChannels) {
    const name = getDMDisplayName(dm)
    const dir = getChannelDir(backupDir, 'dms', '', name)
    await ensureDir(dir)

    const r = await backupChannel(dm.id, `DM: ${name}`, dir, progress, downloadMedia, notify)
    summary.channels.push({ type: 'dm', name, ...r })
    summary.totalMessages += r.messageCount
    summary.totalMedia += r.mediaCount
  }

  summary.finishedAt = new Date().toISOString()
  await writeManifest(backupDir, summary)
  return summary
}

async function backupChannel(channelId, channelName, channelDir, progress, downloadMedia, notify) {
  if (progress.isComplete(channelId)) {
    const c = progress.getCount(channelId)
    log.info(`Pulando ${channelName} (${c} mensagens, já completo)`)
    notify({ channel: channelName, messageCount: c, phase: 'skipped' })
    return { messageCount: c, mediaCount: 0 }
  }

  const lastId = progress.getLastId(channelId)
  let msgCount = progress.getCount(channelId)
  let mediaCount = 0

  notify({ channel: channelName, messageCount: msgCount, phase: 'start' })
  log.info(`Fazendo backup de ${channelName}${lastId ? ' (retomando)' : ''}...`)

  try {
    for await (const batch of fetchMessages(channelId, lastId)) {
      await appendMessages(channelDir, batch)
      msgCount += batch.length

      if (downloadMedia)
        mediaCount += await downloadAttachments(batch, channelDir)

      await progress.update(channelId, batch[batch.length - 1].id, msgCount)
      notify({ channel: channelName, messageCount: msgCount, phase: 'progress' })
    }

    await progress.markComplete(channelId, msgCount)
    notify({ channel: channelName, messageCount: msgCount, phase: 'done' })
    log.info(`Concluído ${channelName}: ${msgCount} mensagens`)
  } catch (e) {
    log.error(`Erro em ${channelName}: ${e.message}`)
    notify({ channel: channelName, messageCount: msgCount, phase: 'error', error: e.message })
  }

  return { messageCount: msgCount, mediaCount }
}
