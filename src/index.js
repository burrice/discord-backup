/*
 * discord-backup - by epy
 * github.com/burrice
 */

import chalk from 'chalk'
import { printHeader, printSummary, printScheduleInfo } from './cli/display.js'
import {
  promptToken, promptBackupTarget, promptGuilds, promptGuildChannels,
  promptDMs, promptMediaDownload, promptHtmlExport, promptSchedule, fetchAllTargets,
} from './cli/prompts.js'
import { runBackup } from './backup/runner.js'
import { generateHtmlViewer } from './backup/html.js'
import { getBackupDir } from './backup/storage.js'
import { zipBackup } from './backup/zip.js'
import { sleep } from './utils/sleep.js'

function parseInterval(str) {
  const m = str.match(/^(\d+)([mhd])$/)
  if (!m) return null
  return parseInt(m[1]) * { m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2]]
}

async function main() {
  printHeader()

  const user = await promptToken()
  const username = user.username
  const target = await promptBackupTarget()

  let guilds = [], dmChannels = [], downloadMedia = false

  if (target === 'full') {
    const all = await fetchAllTargets()
    guilds = all.guilds
    dmChannels = all.dmChannels
    downloadMedia = true
    console.log(chalk.green('  Backup completo: tudo selecionado.\n'))
  } else {
    if (target === 'guilds' || target === 'both') {
      const sel = await promptGuilds()
      for (const g of sel) {
        const ch = await promptGuildChannels(g)
        guilds.push({ id: g.id, name: g.name, channels: ch })
      }
    }
    if (target === 'dms' || target === 'both')
      dmChannels = await promptDMs()

    if (!guilds.length && !dmChannels.length) {
      console.log(chalk.yellow('\n  Nada selecionado. Saindo.'))
      process.exit(0)
    }
    downloadMedia = await promptMediaDownload()
  }

  const genHtml = await promptHtmlExport()
  const schedule = await promptSchedule()

  const targets = {
    guilds: guilds.map(g => ({ id: g.id, name: g.name, _channels: g.channels })),
    dmChannels,
  }

  if (schedule) {
    const ms = parseInterval(schedule)
    printScheduleInfo(schedule)
    let run = 1
    while (true) {
      console.log(chalk.blue(`\n  === Backup #${run} - ${new Date().toLocaleString('pt-BR')} ===\n`))
      await executeBackup(targets, downloadMedia, genHtml, username)
      run++
      console.log(chalk.gray(`  Próximo backup em ${schedule}. Aguardando...`))
      await sleep(ms)
    }
  } else {
    await executeBackup(targets, downloadMedia, genHtml, username)
  }
}

async function executeBackup(targets, downloadMedia, genHtml, username) {
  const summary = await runBackup({
    guilds: targets.guilds,
    dmChannels: targets.dmChannels,
    downloadMedia,
    onProgress({ channel, messageCount, phase }) {
      if (phase === 'start') console.log(chalk.cyan(`  -> ${channel}`))
      else if (phase === 'progress') process.stdout.write(chalk.gray(`\r  ${channel}: ${messageCount.toLocaleString()} mensagens...`))
      else if (phase === 'done') { process.stdout.write('\n'); console.log(chalk.green(`  ✓ ${channel}: ${messageCount.toLocaleString()} mensagens`)) }
      else if (phase === 'skipped') console.log(chalk.gray(`  ⊘ ${channel}: pulado (já completo)`))
      else if (phase === 'error') console.log(chalk.red(`  ✗ ${channel}: erro`))
    },
  })

  printSummary(summary)

  const backupDir = getBackupDir(summary.backupId)

  if (genHtml && summary.totalMessages > 0) {
    console.log(chalk.cyan('  Gerando visualizador HTML...'))
    try {
      await generateHtmlViewer(backupDir)
      console.log(chalk.green('  ✓ Visualizador gerado'))
    } catch (e) {
      console.log(chalk.red(`  ✗ Falha HTML: ${e.message}`))
    }
  }

  if (summary.totalMessages > 0) {
    console.log(chalk.cyan('  Compactando em ZIP...'))
    try {
      const z = await zipBackup(backupDir, username)
      console.log(chalk.green(`  ✓ Salvo em: ${z}`))
    } catch (e) {
      console.log(chalk.red(`  ✗ Falha ZIP: ${e.message}`))
    }
  }

  console.log()
}

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n  Interrompido. Progresso salvo.'))
  process.exit(0)
})

main().catch(e => {
  console.error(chalk.red(`\n  Erro fatal: ${e.message}`))
  process.exit(1)
})
