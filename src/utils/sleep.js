/*
 * discord-backup - by epy
 * github.com/burrice
 */

export const sleep = (ms) => new Promise(r => setTimeout(r, ms))

export const randomDelay = (min = 200, max = 300) =>
  sleep(min + Math.random() * (max - min))
