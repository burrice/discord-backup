/*
 * discord-backup - by epy
 * github.com/burrice
 */

import { discordFetch } from './client.js'

export async function getDMChannels() {
  return discordFetch('/users/@me/channels')
}

export function getDMDisplayName(ch) {
  if (ch.type === 3)
    return ch.name || ch.recipients.map(r => r.username).join(', ')
  const r = ch.recipients?.[0]
  return r ? r.username : `DM-${ch.id}`
}
