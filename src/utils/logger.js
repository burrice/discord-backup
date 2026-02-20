/*
 * discord-backup - by epy
 * github.com/burrice
 */

import chalk from 'chalk'

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }
let level = LEVELS.info

export function setLogLevel(l) {
  level = LEVELS[l] ?? LEVELS.info
}

const ts = () => new Date().toLocaleTimeString()

export const log = {
  debug: (...a) => level <= LEVELS.debug && console.log(chalk.gray(`[${ts()}]`), ...a),
  info: (...a) => level <= LEVELS.info && console.log(chalk.blue(`[${ts()}]`), ...a),
  warn: (...a) => level <= LEVELS.warn && console.log(chalk.yellow(`[${ts()}]`), ...a),
  error: (...a) => level <= LEVELS.error && console.log(chalk.red(`[${ts()}]`), ...a),
}
