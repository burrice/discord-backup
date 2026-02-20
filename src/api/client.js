/*
 * discord-backup - by epy
 * github.com/burrice
 */

import { getToken } from '../config.js'
import { sleep, randomDelay } from '../utils/sleep.js'
import { log } from '../utils/logger.js'

const BASE = 'https://discord.com/api/v10'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const MAX_RETRIES = 5

export async function discordFetch(endpoint, opts = {}) {
  const url = `${BASE}${endpoint}`
  const token = getToken()

  for (let i = 0; i <= MAX_RETRIES; i++) {
    await randomDelay()

    const res = await fetch(url, {
      ...opts,
      headers: {
        Authorization: token,
        'User-Agent': UA,
        'Content-Type': 'application/json',
        ...opts.headers,
      },
    })

    if (res.status === 429) {
      const body = await res.json().catch(() => ({}))
      const wait = body.retry_after ?? parseFloat(res.headers.get('retry-after')) ?? 5
      log.warn(`Rate limited, aguardando ${wait}s...`)
      await sleep(wait * 1000 + 500)
      continue
    }

    if (res.status >= 500) {
      const wait = 1000 * 2 ** i
      log.warn(`Erro ${res.status}, tentando novamente em ${wait / 1000}s...`)
      await sleep(wait)
      continue
    }

    const remaining = res.headers.get('x-ratelimit-remaining')
    const resetAfter = res.headers.get('x-ratelimit-reset-after')
    if (remaining === '0' && resetAfter)
      await sleep(parseFloat(resetAfter) * 1000 + 100)

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Discord API ${res.status}: ${body}`)
    }

    return res.json()
  }

  throw new Error(`Falha após ${MAX_RETRIES} tentativas: ${endpoint}`)
}

export async function verifyToken() {
  return discordFetch('/users/@me')
}
