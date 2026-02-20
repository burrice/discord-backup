/*
 * discord-backup - by epy
 * github.com/burrice
 */

import 'dotenv/config'
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

const CONFIG_DIR = path.join(homedir(), '.discord-backup')
const TOKEN_FILE = path.join(CONFIG_DIR, '.token')

let token = loadToken()

function loadToken() {
  if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== 'seu_token_aqui')
    return process.env.DISCORD_TOKEN
  try {
    return readFileSync(TOKEN_FILE, 'utf8').trim()
  } catch {
    return null
  }
}

export function getToken() { return token }

export function setToken(t) { token = t }

export function saveToken(t) {
  try {
    mkdirSync(CONFIG_DIR, { recursive: true })
    writeFileSync(TOKEN_FILE, t, 'utf8')
  } catch {}
}

export function clearToken() {
  try { unlinkSync(TOKEN_FILE) } catch {}
  token = null
}
