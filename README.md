<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/platform-windows%20%7C%20linux%20%7C%20macos-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/license-MIT-yellow?style=flat-square" />
  <img src="https://img.shields.io/badge/by-epy-magenta?style=flat-square" />
</p>

<h1 align="center">Discord Backup Tool</h1>

<p align="center">
  Ferramenta de backup completo para Discord — salva mensagens, mídias, histórico de canais, DMs e grupos.<br>
  Gera um <b>visualizador HTML</b> idêntico ao chat do Discord para você navegar offline.
</p>

<p align="center">
  <img src="https://media1.tenor.com/m/mjWYgxi6RS8AAAAC/lain-typing.gif" width="300" />
  <img src="https://media1.tenor.com/m/L2iMH_Thu9gAAAAC/lain-serial-experiments-lain.gif" width="300" />
</p>

> **⚠ Aviso:** Selfbots violam os Termos de Serviço do Discord e podem resultar em banimento da conta. Use por sua conta e risco.

---

## Funcionalidades

- **Backup completo da conta** — todos os servidores, canais, DMs e grupos em um clique
- **Backup seletivo** — escolha servidores e canais específicos
- **Download de mídias** — salva imagens, vídeos, áudios e arquivos anexados
- **Visualizador HTML** — abre no navegador com visual idêntico ao Discord (tema escuro, avatares, embeds, reações, replies, stickers, spoilers)
- **Backup agendado** — a cada X minutos, horas ou dias automaticamente
- **Saída em ZIP** — `nomedaconta-2025-01-01.zip` compactado
- **Chat em texto** — `chat.txt` legível por humanos em cada canal
- **Resumível** — se interromper com Ctrl+C, retoma de onde parou
- **Token persistente** — salva o token localmente, não precisa digitar toda vez
- **Rate limit inteligente** — respeita os limites da API do Discord automaticamente

## Instalação

```bash
git clone https://github.com/burrice/discord-backup.git
cd discord-backup
npm install
```

## Uso

```bash
npm start
```

O CLI interativo vai te guiar:

```
  ╔══════════════════════════════════════════╗
  ║       Discord Backup Tool v1.0.0        ║
  ║                by epy                   ║
  ╚══════════════════════════════════════════╝

  Salve suas mensagens, mídias e histórico de canais
  ⚠ Selfbots violam os ToS do Discord - use por sua conta e risco
  © 2025 epy - Todos os direitos reservados
  github.com/burrice

? Digite seu token do Discord: ****
  Conectado como usuario#0

? O que deseja fazer backup?
  ❯ Conta inteira (tudo - servidores, DMs, grupos, mídias)
    Servidores
    DMs (mensagens diretas)
    Ambos (selecionar manualmente)

? Gerar visualizador HTML (visual do Discord)? Sim
? Agendar backups recorrentes? Não

  -> #geral (Meu Servidor)
  ✓ #geral (Meu Servidor): 4.231 mensagens
  -> DM: João
  ✓ DM: João: 892 mensagens

  Backup Concluído!
  Mensagens: 5.123
  Mídias: 47
  ✓ Visualizador gerado
  ✓ Salvo em: backups/usuario-2025-01-01.zip
```

## Como pegar o token

1. Abra o Discord no **navegador** (discord.com/app)
2. Pressione `F12` para abrir o DevTools
3. Vá na aba **Network** (Rede)
4. Envie qualquer mensagem em um canal
5. Clique em qualquer request para `messages`
6. Procure o header **Authorization** — esse é seu token

## Estrutura do backup

```
usuario-2025-01-01.zip
└── 2025-01-01T12-00-00-000Z/
    ├── manifest.json
    ├── viewer.html          ← abre no navegador
    ├── guilds/
    │   └── Meu Servidor/
    │       ├── geral/
    │       │   ├── messages.jsonl
    │       │   ├── chat.txt
    │       │   └── media/
    │       └── off-topic/
    │           ├── messages.jsonl
    │           └── chat.txt
    └── dms/
        ├── João/
        │   ├── messages.jsonl
        │   ├── chat.txt
        │   └── media/
        └── Grupo da Galera/
            ├── messages.jsonl
            └── chat.txt
```

## Agendamento

Você pode agendar backups automáticos:

| Intervalo | Uso |
|-----------|-----|
| `15m` | A cada 15 minutos |
| `1h` | A cada hora |
| `6h` | A cada 6 horas |
| `1d` | Diariamente |
| Personalizado | Qualquer combinação (ex: `45m`, `3h`, `2d`) |

O programa fica rodando e executa o backup no intervalo. Pressione `Ctrl+C` para parar — o progresso é salvo.

## Dependências

| Pacote | Uso |
|--------|-----|
| `@inquirer/prompts` | Prompts interativos no terminal |
| `chalk` | Cores no terminal |
| `cli-progress` | Barras de progresso |
| `archiver` | Compressão ZIP |
| `dotenv` | Variáveis de ambiente |

Todo o resto usa built-ins do Node.js (`fetch`, `fs`, `path`, `stream`).

## Requisitos

- Node.js **18+** (usa `fetch` nativo)
- Token de usuário do Discord

## Licença

MIT — use como quiser.

---

<p align="center">
  <img src="https://media1.tenor.com/m/G9wtd4WhwXIAAAAC/lain-computer.gif" width="200" /><br>
  feito com mass preguiça por <b>epy</b><br>
  <a href="https://github.com/burrice">github.com/burrice</a>
</p>
