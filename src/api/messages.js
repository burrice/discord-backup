/*
 * discord-backup - by epy
 * github.com/burrice
 */

import { discordFetch } from './client.js'
import { log } from '../utils/logger.js'

const BATCH = 100

export async function* fetchMessages(channelId, beforeId = null) {
  let before = beforeId
  let total = 0

  while (true) {
    const params = new URLSearchParams({ limit: String(BATCH) })
    if (before) params.set('before', before)

    const msgs = await discordFetch(`/channels/${channelId}/messages?${params}`)
    if (!msgs.length) break

    total += msgs.length
    log.debug(`${total} mensagens - canal ${channelId}`)

    yield msgs

    if (msgs.length < BATCH) break
    before = msgs[msgs.length - 1].id
  }
}
