/*
 * discord-backup - by epy
 * github.com/burrice
 */

import { input, select, checkbox, confirm } from '@inquirer/prompts'
import chalk from 'chalk'
import { getToken, setToken, saveToken } from '../config.js'
import { verifyToken } from '../api/client.js'
import { getGuilds, getGuildChannels } from '../api/guilds.js'
import { getDMChannels, getDMDisplayName } from '../api/channels.js'

export async function promptToken() {
  let token = getToken()

  if (token) {
    console.log(chalk.gray('  Token salvo encontrado. Verificando...'))
    try {
      const user = await verifyToken()
      console.log(chalk.green(`  Conectado como ${user.username}#${user.discriminator ?? '0'}`))
      const keep = await confirm({ message: `Continuar como ${user.username}?`, default: true })
      if (keep) { console.log(); return user }
    } catch {
      console.log(chalk.yellow('  Token salvo inválido ou expirado.'))
    }
  }

  token = await input({
    message: 'Digite seu token do Discord:',
    validate: v => v.trim().length > 0 || 'Token obrigatório',
  })
  setToken(token.trim())

  console.log(chalk.gray('  Verificando token...'))
  try {
    const user = await verifyToken()
    console.log(chalk.green(`  Conectado como ${user.username}#${user.discriminator ?? '0'}`))
    saveToken(token.trim())
    console.log(chalk.gray('  Token salvo para próximas sessões.'))
    console.log()
    return user
  } catch (e) {
    console.log(chalk.red(`  Token inválido: ${e.message}`))
    process.exit(1)
  }
}

export async function promptBackupTarget() {
  return select({
    message: 'O que deseja fazer backup?',
    choices: [
      { name: 'Conta inteira (tudo - servidores, DMs, grupos, mídias)', value: 'full' },
      { name: 'Servidores', value: 'guilds' },
      { name: 'DMs (mensagens diretas)', value: 'dms' },
      { name: 'Ambos (selecionar manualmente)', value: 'both' },
    ],
  })
}

export async function fetchAllTargets() {
  console.log(chalk.cyan('  Carregando dados da conta inteira...'))

  console.log(chalk.gray('  Buscando servidores...'))
  const allGuilds = await getGuilds()
  console.log(chalk.gray(`  ${allGuilds.length} servidores encontrados`))

  const guilds = []
  for (const g of allGuilds) {
    console.log(chalk.gray(`  Carregando canais de ${g.name}...`))
    const channels = await getGuildChannels(g.id)
    guilds.push({ id: g.id, name: g.name, channels })
  }

  console.log(chalk.gray('  Buscando DMs e grupos...'))
  const dmChannels = await getDMChannels()
  const dms = dmChannels.filter(d => d.type === 1).length
  const groups = dmChannels.filter(d => d.type === 3).length
  console.log(chalk.gray(`  ${dms} DMs e ${groups} grupos encontrados`))
  console.log()

  return { guilds, dmChannels }
}

export async function promptGuilds() {
  console.log(chalk.gray('  Carregando servidores...'))
  const guilds = await getGuilds()
  if (!guilds.length) { console.log(chalk.yellow('  Nenhum servidor encontrado.')); return [] }

  return checkbox({
    message: 'Selecione os servidores para backup:',
    choices: guilds.map(g => ({ name: g.name, value: g })),
  })
}

export async function promptGuildChannels(guild) {
  console.log(chalk.gray(`  Carregando canais de ${guild.name}...`))
  const channels = await getGuildChannels(guild.id)
  if (!channels.length) { console.log(chalk.yellow(`  Nenhum canal de texto em ${guild.name}.`)); return [] }

  const all = await confirm({ message: `Backup de todos os ${channels.length} canais em ${guild.name}?`, default: true })
  if (all) return channels

  return checkbox({
    message: `Selecione os canais de ${guild.name}:`,
    choices: channels.map(ch => ({ name: `#${ch.name}`, value: ch })),
  })
}

export async function promptDMs() {
  console.log(chalk.gray('  Carregando DMs...'))
  const dms = await getDMChannels()
  if (!dms.length) { console.log(chalk.yellow('  Nenhuma DM encontrada.')); return [] }

  return checkbox({
    message: 'Selecione as DMs para backup:',
    choices: dms.map(dm => ({ name: getDMDisplayName(dm), value: dm })),
  })
}

export async function promptMediaDownload() {
  return confirm({ message: 'Baixar mídias/anexos?', default: false })
}

export async function promptHtmlExport() {
  return confirm({ message: 'Gerar visualizador HTML (visual do Discord)?', default: true })
}

export async function promptSchedule() {
  const ok = await confirm({ message: 'Agendar backups recorrentes?', default: false })
  if (!ok) return null

  const interval = await select({
    message: 'Intervalo:',
    choices: [
      { name: 'A cada 15 minutos', value: '15m' },
      { name: 'A cada 30 minutos', value: '30m' },
      { name: 'A cada 1 hora', value: '1h' },
      { name: 'A cada 6 horas', value: '6h' },
      { name: 'A cada 12 horas', value: '12h' },
      { name: 'A cada 1 dia', value: '1d' },
      { name: 'Personalizado', value: 'custom' },
    ],
  })

  if (interval !== 'custom') return interval

  const custom = await input({
    message: 'Intervalo (ex: 5m, 2h, 1d):',
    validate: v => /^\d+[mhd]$/.test(v.trim()) || 'Formato: <número><m|h|d>',
  })
  return custom.trim()
}
