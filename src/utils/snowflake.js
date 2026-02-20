/*
 * discord-backup - by epy
 * github.com/burrice
 */

const DISCORD_EPOCH = 1420070400000n

export function snowflakeToDate(id) {
  return new Date(Number((BigInt(id) >> 22n) + DISCORD_EPOCH))
}

export function dateToSnowflake(date) {
  return ((BigInt(date.getTime()) - DISCORD_EPOCH) << 22n).toString()
}
