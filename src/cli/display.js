/*
 * discord-backup - by epy
 * github.com/burrice
 */

import chalk from 'chalk'

export function printHeader() {
  console.log()
  console.log(chalk.bold.magenta('  ╔══════════════════════════════════════════╗'))
  console.log(chalk.bold.magenta('  ║') + chalk.bold.white('       Discord Backup Tool v1.0.0        ') + chalk.bold.magenta('║'))
  console.log(chalk.bold.magenta('  ║') + chalk.gray('                by epy                   ') + chalk.bold.magenta('║'))
  console.log(chalk.bold.magenta('  ╚══════════════════════════════════════════╝'))
  console.log()
  console.log(chalk.gray('  Salve suas mensagens, mídias e histórico de canais'))
  console.log(chalk.yellow('  ⚠ Selfbots violam os ToS do Discord - use por sua conta e risco'))
  console.log(chalk.dim('  © 2025 epy - Todos os direitos reservados'))
  console.log(chalk.dim('  github.com/burrice'))
  console.log()
}

export function printSummary(summary) {
  console.log()
  console.log(chalk.bold.green('  Backup Concluído!'))
  console.log(chalk.gray(`  ID: ${summary.backupId}`))
  console.log(chalk.gray(`  Canais: ${summary.channels.length}`))
  console.log(chalk.gray(`  Mensagens: ${summary.totalMessages.toLocaleString()}`))
  if (summary.totalMedia > 0)
    console.log(chalk.gray(`  Mídias: ${summary.totalMedia.toLocaleString()}`))
  console.log(chalk.gray(`  Duração: ${getDuration(summary.startedAt, summary.finishedAt)}`))
  console.log()
}

function getDuration(start, end) {
  const s = Math.floor((new Date(end) - new Date(start)) / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60), rs = s % 60
  if (m < 60) return `${m}m ${rs}s`
  return `${Math.floor(m/60)}h ${m%60}m`
}

export function printScheduleInfo(interval) {
  const u = { m: 'minuto(s)', h: 'hora(s)', d: 'dia(s)' }
  const match = interval.match(/^(\d+)([mhd])$/)
  if (match) console.log(chalk.blue(`  Backup agendado a cada ${match[1]} ${u[match[2]]}`))
  console.log(chalk.gray('  Pressione Ctrl+C para parar'))
  console.log()
}
