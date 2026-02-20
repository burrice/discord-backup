/*
 * discord-backup - by epy
 * github.com/burrice
 */

import { discordFetch } from './client.js'

export async function getGuilds() {
  return discordFetch('/users/@me/guilds')
}

export async function getGuildChannels(guildId) {
  const channels = await discordFetch(`/guilds/${guildId}/channels`)
  return channels.filter(ch => [0, 5, 15].includes(ch.type))
}

export async function getGuildName(guildId) {
  const g = await discordFetch(`/guilds/${guildId}`)
  return g.name
}
