/*
 * discord-backup - by epy
 * github.com/burrice
 */

import { readFile, readdir, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { log } from '../utils/logger.js'

export async function generateHtmlViewer(backupDir) {
  const manifest = JSON.parse(await readFile(path.join(backupDir, 'manifest.json'), 'utf8'))
  const channels = await loadAllChannels(backupDir)
  const html = buildHtml(manifest, channels)
  const out = path.join(backupDir, 'viewer.html')
  await writeFile(out, html, 'utf8')
  log.info(`Viewer salvo em ${out}`)
  return out
}

async function loadAllChannels(backupDir) {
  const channels = []

  const guildsDir = path.join(backupDir, 'guilds')
  if (await isDir(guildsDir)) {
    for (const guild of await readdir(guildsDir)) {
      const gp = path.join(guildsDir, guild)
      for (const ch of await readdir(gp)) {
        const msgs = await loadJsonl(path.join(gp, ch, 'messages.jsonl'))
        if (msgs.length)
          channels.push({ id: `g-${guild}-${ch}`, type: 'guild', guild, name: ch, icon: '#', messages: msgs })
      }
    }
  }

  const dmsDir = path.join(backupDir, 'dms')
  if (await isDir(dmsDir)) {
    for (const dm of await readdir(dmsDir)) {
      const msgs = await loadJsonl(path.join(dmsDir, dm, 'messages.jsonl'))
      if (msgs.length)
        channels.push({ id: `d-${dm}`, type: 'dm', guild: null, name: dm, icon: '@', messages: msgs })
    }
  }

  return channels
}

async function loadJsonl(fp) {
  try {
    const raw = await readFile(fp, 'utf8')
    return raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
      .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  } catch { return [] }
}

async function isDir(p) {
  try { return (await stat(p)).isDirectory() } catch { return false }
}

const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

function fmtTime(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}) + ' ' +
    d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})
}

function userColor(id) {
  const c = ['#f44336','#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#00bcd4','#009688',
    '#4caf50','#ff9800','#ff5722','#795548','#607d8b','#e6b800','#1abc9c','#e74c3c',
    '#3498db','#9b59b6','#2ecc71','#e67e22']
  const h = id.split('').reduce((a,c) => a + c.charCodeAt(0), 0)
  return c[h % c.length]
}

function renderContent(content) {
  if (!content) return ''
  let h = esc(content)
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  h = h.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
  h = h.replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em>$1</em>')
  h = h.replace(/~~(.+?)~~/g, '<del>$1</del>')
  h = h.replace(/`([^`]+?)`/g, '<code class="ic">$1</code>')
  h = h.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="cb"><code>$2</code></pre>')
  h = h.replace(/\|\|(.+?)\|\|/g, `<span class="sp" onclick="this.classList.toggle('rv')">$1</span>`)
  h = h.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>')
  h = h.replace(/&lt;@!?(\d+)&gt;/g, '<span class="mn">@user</span>')
  h = h.replace(/&lt;#(\d+)&gt;/g, '<span class="mn">#channel</span>')
  h = h.replace(/&lt;@&amp;(\d+)&gt;/g, '<span class="mn">@role</span>')
  h = h.replace(/&lt;(a?):(\w+):(\d+)&gt;/g,
    '<img class="ej" src="https://cdn.discordapp.com/emojis/$3.webp?size=48" alt=":$2:" title=":$2:">')
  h = h.replace(/\n/g, '<br>')
  return h
}

function avatarUrl(a) {
  if (!a) return ''
  if (a.avatar) {
    const ext = a.avatar.startsWith('a_') ? 'gif' : 'webp'
    return `https://cdn.discordapp.com/avatars/${a.id}/${a.avatar}.${ext}?size=80`
  }
  const i = a.discriminator === '0' ? (BigInt(a.id) >> 22n) % 6n : parseInt(a.discriminator||'0') % 5
  return `https://cdn.discordapp.com/embed/avatars/${i}.png`
}

function canGroup(msg, prev) {
  if (!prev) return false
  if (msg.author?.id !== prev.author?.id) return false
  if (msg.referenced_message || msg.message_reference) return false
  return (new Date(msg.timestamp) - new Date(prev.timestamp)) < 420000
}

function diffDay(a, b) {
  if (!a || !b) return true
  return new Date(a.timestamp).toDateString() !== new Date(b.timestamp).toDateString()
}

function renderAtt(att) {
  const url = att.url || '', fn = att.filename || 'file'
  if (/\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(fn))
    return `<div class="att"><a href="${esc(url)}" target="_blank"><img class="att-img" src="${esc(url)}" alt="${esc(fn)}" loading="lazy"></a></div>`
  if (/\.(mp4|webm|mov)$/i.test(fn))
    return `<div class="att"><video class="att-vid" controls preload="metadata"><source src="${esc(url)}"></video></div>`
  if (/\.(mp3|ogg|wav|flac)$/i.test(fn))
    return `<div class="att"><div class="att-f"><span>🎵</span><a href="${esc(url)}" target="_blank">${esc(fn)}</a></div><audio controls preload="metadata"><source src="${esc(url)}"></audio></div>`
  const sz = att.size ? ` <span class="fsz">${att.size < 1048576 ? (att.size/1024).toFixed(1)+' KB' : (att.size/1048576).toFixed(1)+' MB'}</span>` : ''
  return `<div class="att"><div class="att-f"><span>📄</span><a href="${esc(url)}" target="_blank">${esc(fn)}</a>${sz}</div></div>`
}

function renderEmbed(e) {
  const col = e.color ? `#${e.color.toString(16).padStart(6,'0')}` : '#202225'
  let h = `<div class="emb" style="border-left-color:${col}">`
  if (e.author) {
    h += `<div class="emb-a">`
    if (e.author.icon_url) h += `<img class="emb-ai" src="${esc(e.author.icon_url)}">`
    h += `<span>${esc(e.author.name||'')}</span></div>`
  }
  if (e.title) {
    const t = esc(e.title)
    h += e.url ? `<div class="emb-t"><a href="${esc(e.url)}" target="_blank">${t}</a></div>` : `<div class="emb-t">${t}</div>`
  }
  if (e.description) h += `<div class="emb-d">${renderContent(e.description)}</div>`
  if (e.fields?.length) {
    h += `<div class="emb-fs">`
    for (const f of e.fields)
      h += `<div class="emb-f${f.inline?' il':''}"><div class="emb-fn">${esc(f.name)}</div><div class="emb-fv">${renderContent(f.value)}</div></div>`
    h += `</div>`
  }
  if (e.image?.url) h += `<img class="emb-img" src="${esc(e.image.url)}" loading="lazy">`
  if (e.thumbnail?.url) h += `<img class="emb-th" src="${esc(e.thumbnail.url)}" loading="lazy">`
  if (e.footer) h += `<div class="emb-ft">${esc(e.footer.text||'')}</div>`
  return h + `</div>`
}

function renderReactions(reactions) {
  if (!reactions?.length) return ''
  let h = '<div class="reacts">'
  for (const r of reactions) {
    const ej = r.emoji.id
      ? `<img class="ej" src="https://cdn.discordapp.com/emojis/${r.emoji.id}.webp?size=20">`
      : r.emoji.name
    h += `<span class="react">${ej} <span class="rc">${r.count}</span></span>`
  }
  return h + '</div>'
}

function renderReply(msg) {
  if (!msg.referenced_message && !msg.message_reference) return ''
  const ref = msg.referenced_message
  if (!ref) return `<div class="reply"><span class="ri">↪</span> <em>Mensagem original apagada</em></div>`
  const a = ref.author?.username || 'Desconhecido'
  const p = (ref.content || '').slice(0, 100) || '[anexo]'
  const c = userColor(ref.author?.id || '0')
  return `<div class="reply"><span class="ri">↪</span><span class="ra" style="color:${c}">${esc(a)}</span><span class="rp">${esc(p)}</span></div>`
}

function renderMessages(messages) {
  let h = '', prev = null
  for (const msg of messages) {
    if (diffDay(msg, prev))
      h += `<div class="ds"><span>${fmtDate(msg.timestamp)}</span></div>`

    const grp = canGroup(msg, prev)
    const a = msg.author || {}
    const col = userColor(a.id || '0')
    const isDel = msg._deleted === true

    if (msg.type !== 0 && msg.type !== 19) {
      const sysTexts = {
        1:'adicionou alguém ao grupo',2:'removeu alguém do grupo',3:'iniciou uma chamada',
        6:'fixou uma mensagem',7:'entrou no servidor',8:'impulsionou o servidor'
      }
      const t = sysTexts[msg.type] || `mensagem do sistema (tipo ${msg.type})`
      h += `<div class="msg sys"><div class="sys-t">${esc(a.username||'?')} ${t} <span class="ts">${fmtTime(msg.timestamp)}</span></div></div>`
      prev = msg; continue
    }

    h += `<div class="msg${grp?' grp':''}${isDel?' del':''}" id="m-${msg.id}">`
    if (!grp) h += renderReply(msg)

    if (grp) {
      h += `<div class="mb grp-b"><span class="grp-ts">${new Date(msg.timestamp).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>`
    } else {
      h += `<div class="mb"><div class="avc"><img class="av" src="${avatarUrl(a)}" loading="lazy"></div>`
      h += `<div class="hdr"><span class="au" style="color:${col}">${esc(a.username||'Desconhecido')}</span>`
      if (a.bot) h += `<span class="bot">BOT</span>`
      if (isDel) h += `<span class="del-tag">(apagada)</span>`
      h += `<span class="ts">${fmtTime(msg.timestamp)}</span></div>`
    }

    if (msg.content) h += `<div class="ct">${renderContent(msg.content)}</div>`
    if (msg.attachments?.length) for (const att of msg.attachments) h += renderAtt(att)
    if (msg.embeds?.length) for (const e of msg.embeds) h += renderEmbed(e)
    if (msg.sticker_items?.length)
      for (const s of msg.sticker_items)
        h += `<div class="stk"><img src="https://media.discordapp.net/stickers/${s.id}.webp?size=160" alt="${esc(s.name)}" loading="lazy"></div>`
    h += renderReactions(msg.reactions)
    h += `</div></div>`
    prev = msg
  }
  return h
}

function buildSidebar(channels) {
  let h = ''
  const guilds = new Map(), dms = []
  for (const ch of channels) {
    if (ch.type === 'guild') {
      if (!guilds.has(ch.guild)) guilds.set(ch.guild, [])
      guilds.get(ch.guild).push(ch)
    } else dms.push(ch)
  }
  for (const [g, chs] of guilds) {
    h += `<div class="sg">${esc(g)}</div>`
    for (const ch of chs)
      h += `<div class="sc" data-ch="${ch.id}" onclick="show('${ch.id}')"><span class="ch">#</span> ${esc(ch.name)}<span class="mc">${ch.messages.length}</span></div>`
  }
  if (dms.length) {
    h += `<div class="sg">Mensagens Diretas</div>`
    for (const dm of dms)
      h += `<div class="sc" data-ch="${dm.id}" onclick="show('${dm.id}')"><span class="ch">@</span> ${esc(dm.name)}<span class="mc">${dm.messages.length}</span></div>`
  }
  return h
}

function buildHtml(manifest, channels) {
  const sidebar = buildSidebar(channels)
  let divs = '', first = channels[0]?.id || ''

  for (const ch of channels) {
    const label = ch.type === 'guild' ? `${ch.guild} > #${ch.name}` : ch.name
    divs += `<div class="cc" id="c-${ch.id}" style="display:none">
      <div class="chb"><span class="chi">${ch.icon}</span><span class="chn">${esc(label)}</span><span class="chc">${ch.messages.length.toLocaleString()} mensagens</span></div>
      <div class="msc">${renderMessages(ch.messages)}</div>
    </div>`
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Discord Backup - ${esc(manifest.backupId)} | by epy</title>
<style>
${CSS}
</style>
</head>
<body>
<div class="app">
  <div class="sb">
    <div class="sbh"><h2>Discord Backup</h2><div class="sbi">${fmtTime(manifest.startedAt)} | by epy</div></div>
    <div class="sbc">${sidebar}</div>
  </div>
  <div class="mn">
    ${divs}
    ${!channels.length ? '<div class="empty">Nenhuma mensagem encontrada.</div>' : ''}
  </div>
</div>
<script>
let cur=null;function show(id){document.querySelectorAll('.cc').forEach(e=>e.style.display='none');document.querySelectorAll('.sc').forEach(e=>e.classList.remove('act'));const c=document.getElementById('c-'+id),s=document.querySelector('[data-ch="'+id+'"]');if(c)c.style.display='flex';if(s)s.classList.add('act');cur=id;const m=c?.querySelector('.msc');if(m)m.scrollTop=m.scrollHeight}
document.addEventListener('DOMContentLoaded',()=>show('${first}'));
</script>
</body>
</html>`
}

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;background:#313338;color:#dbdee1;font-size:15px;line-height:1.375;overflow:hidden;height:100vh}
.app{display:flex;height:100vh}
.sb{width:260px;min-width:260px;background:#2b2d31;display:flex;flex-direction:column;border-right:1px solid #1e1f22}
.sbh{padding:16px;border-bottom:1px solid #1e1f22}
.sbh h2{font-size:16px;font-weight:600;color:#f2f3f5}
.sbi{font-size:11px;color:#949ba4;margin-top:4px}
.sbc{flex:1;overflow-y:auto;padding:8px 0}
.sbc::-webkit-scrollbar{width:6px}.sbc::-webkit-scrollbar-thumb{background:#1a1b1e;border-radius:3px}
.sg{padding:6px 16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#949ba4;letter-spacing:.02em;margin-top:12px}
.sc{display:flex;align-items:center;padding:6px 12px;margin:1px 8px;border-radius:4px;cursor:pointer;color:#949ba4;font-size:14px;transition:background .1s,color .1s}
.sc:hover{background:#35373c;color:#dbdee1}.sc.act{background:#404249;color:#f2f3f5}
.ch{margin-right:6px;font-size:16px;opacity:.7}
.mc{margin-left:auto;font-size:11px;background:#1e1f22;color:#949ba4;padding:1px 6px;border-radius:8px}
.mn{flex:1;display:flex;flex-direction:column;overflow:hidden}
.cc{flex:1;display:flex;flex-direction:column;overflow:hidden}
.chb{height:48px;min-height:48px;display:flex;align-items:center;padding:0 16px;border-bottom:1px solid #1e1f22;background:#313338;gap:8px}
.chi{color:#949ba4;font-size:20px}.chn{font-weight:600;color:#f2f3f5}.chc{margin-left:auto;color:#949ba4;font-size:12px}
.msc{flex:1;overflow-y:auto;padding:16px 0}
.msc::-webkit-scrollbar{width:8px}.msc::-webkit-scrollbar-thumb{background:#1a1b1e;border-radius:4px}
.empty{display:flex;align-items:center;justify-content:center;height:100%;color:#949ba4;font-size:16px}
.msg{padding:2px 48px 2px 72px;position:relative;min-height:2.75rem}
.msg:hover{background:#2e3035}.msg:not(.grp){margin-top:1.0625rem}
.mb{position:relative}.mb:not(.grp-b){padding-top:2px}
.avc{position:absolute;left:-52px;top:2px}
.av{width:40px;height:40px;border-radius:50%;object-fit:cover}
.hdr{display:flex;align-items:baseline;gap:8px;line-height:1.375}
.au{font-weight:600;font-size:15px;cursor:pointer}.au:hover{text-decoration:underline}
.bot{font-size:10px;font-weight:500;background:#5865f2;color:#fff;padding:1px 5px;border-radius:3px;text-transform:uppercase}
.ts{font-size:11px;color:#949ba4;font-weight:400}
.grp-b{padding-left:0}
.grp-ts{position:absolute;left:-52px;width:40px;text-align:center;font-size:10px;color:transparent;line-height:1.375rem}
.msg:hover .grp-ts{color:#949ba4}
.ct{color:#dbdee1;word-wrap:break-word;overflow-wrap:break-word;white-space:pre-wrap}
.ct a{color:#00a8fc;text-decoration:none}.ct a:hover{text-decoration:underline}
.ic{background:#2b2d31;border:1px solid #1e1f22;border-radius:3px;padding:0 4px;font-size:13px;font-family:Consolas,monospace}
.cb{background:#2b2d31;border:1px solid #1e1f22;border-radius:4px;padding:8px;margin:4px 0;font-size:13px;font-family:Consolas,monospace;overflow-x:auto;white-space:pre}
.sp{background:#1e1f22;color:transparent;border-radius:3px;padding:0 4px;cursor:pointer;transition:background .1s,color .1s}
.sp.rv{background:#4e505899;color:#dbdee1}
.mn-cls{background:#5865f233;color:#c9cdfb;border-radius:3px;padding:0 2px;font-weight:500}
.ej{width:22px;height:22px;vertical-align:-5px;object-fit:contain}
.att{margin:4px 0;max-width:520px}
.att-img{max-width:400px;max-height:300px;border-radius:8px;cursor:pointer;display:block}
.att-vid{max-width:400px;max-height:300px;border-radius:8px}
.att-f{display:flex;align-items:center;gap:8px;background:#2b2d31;border:1px solid #1e1f22;border-radius:8px;padding:12px}
.att-f a{color:#00a8fc;text-decoration:none}.att-f a:hover{text-decoration:underline}
.fsz{color:#949ba4;font-size:12px}
.emb{max-width:520px;background:#2b2d31;border-radius:4px;border-left:4px solid #202225;padding:12px 16px;margin:4px 0}
.emb-a{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;margin-bottom:4px}
.emb-ai{width:20px;height:20px;border-radius:50%}
.emb-t{font-weight:700;font-size:15px;margin-bottom:4px}.emb-t a{color:#00a8fc;text-decoration:none}.emb-t a:hover{text-decoration:underline}
.emb-d{font-size:14px;color:#dbdee1;margin-bottom:8px}
.emb-fs{display:flex;flex-wrap:wrap;gap:8px}.emb-f{flex:0 0 100%}.emb-f.il{flex:0 0 calc(33% - 8px)}
.emb-fn{font-weight:600;font-size:13px;margin-bottom:2px}.emb-fv{font-size:14px;color:#b5bac1}
.emb-img{max-width:100%;max-height:300px;border-radius:4px;margin-top:8px}
.emb-th{float:right;max-width:80px;max-height:80px;border-radius:4px;margin-left:16px}
.emb-ft{font-size:11px;color:#949ba4;margin-top:8px}
.reacts{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.react{display:flex;align-items:center;gap:4px;background:#2b2d31;border:1px solid #1e1f22;border-radius:8px;padding:2px 8px;font-size:14px}
.rc{font-size:12px;color:#b5bac1}
.reply{display:flex;align-items:center;gap:6px;font-size:13px;color:#949ba4;margin-bottom:2px;margin-left:-20px}
.ri{font-size:12px}.ra{font-weight:600;font-size:12px}.rp{font-size:12px;color:#949ba4;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ds{display:flex;align-items:center;justify-content:center;padding:8px 16px;margin:8px 0}
.ds span{background:#313338;padding:0 8px;font-size:12px;font-weight:600;color:#949ba4;position:relative;z-index:1}
.ds::before{content:'';position:absolute;left:16px;right:16px;height:1px;background:#3f4147}
.sys{padding:4px 16px 4px 72px}.sys-t{color:#949ba4;font-size:14px}
.stk img{width:160px;height:160px;object-fit:contain}
.msg.del{background:#3c1f1f;border-left:3px solid #ed4245}
.msg.del:hover{background:#4a2525}
.msg.del .ct{color:#f5a5a7}
.del-tag{font-size:11px;font-weight:500;background:#ed4245;color:#fff;padding:1px 6px;border-radius:3px}
::-webkit-scrollbar{width:8px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1a1b1e;border-radius:4px}
@media(max-width:768px){.sb{width:200px;min-width:200px}.att-img{max-width:260px}.emb{max-width:300px}}
`
