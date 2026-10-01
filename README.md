# browser-mcp-server

[![CI](https://github.com/vicktor12/browser-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/vicktor12/browser-mcp-server/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Servidor [MCP](https://modelcontextprotocol.io) local (Node.js + Playwright) que permite ao Claude Code controlar o Google Chrome: navegar, clicar, preencher formulários, tirar screenshots e ler páginas. Útil para completar fluxos que exigiriam intervenção manual (deploys em painéis web, parametrizações em sistemas etc.), usando as sessões já logadas do seu perfil do Chrome.

> **Aviso:** dá a um agente de IA controle de um navegador com suas sessões reais. Leia [docs/security.md](docs/security.md) antes de usar.

## Tools

| Tool | O que faz |
| --- | --- |
| `browser_navigate` | Abre uma URL e aguarda o carregamento |
| `browser_click` | Clica por seletor CSS, texto visível ou aria-label |
| `browser_fill` | Preenche um campo de formulário |
| `browser_screenshot` | Salva um PNG da página |
| `browser_read_page` | Lê título, URL, texto visível e links |
| `browser_wait_for` | Aguarda elemento ou texto |

Detalhes de parâmetros em [docs/tools.md](docs/tools.md).

## Requisitos

- Node.js 20+
- Google Chrome instalado (usa o Chrome real, não o Chromium do Playwright)

## Instalação

```bash
git clone https://github.com/vicktor12/browser-mcp-server.git
cd browser-mcp-server
npm install
cp .env.example .env   # e preencha CHROME_USER_DATA_DIR
```

### Registrar no Claude Code

```bash
claude mcp add browser --scope user \
  -e "CHROME_USER_DATA_DIR=<caminho do perfil>" \
  -e CHROME_PROFILE=Default \
  -- node "<caminho absoluto>/browser-mcp-server/index.js"
```

Reinicie o Claude Code e confira com `claude mcp list`. Alternativamente, copie `claude-settings.example.json` para `.claude/settings.json` e ajuste o caminho.

> **Feche o Chrome por completo antes de usar** — o Playwright precisa de acesso exclusivo ao perfil.

## Configuração

Tudo por variáveis de ambiente (ver [.env.example](.env.example)):

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `CHROME_USER_DATA_DIR` | perfil temporário dedicado | Diretório de dados do Chrome (mantém logins) |
| `CHROME_PROFILE` | `Default` | Perfil dentro do diretório |
| `SCREENSHOTS_DIR` | `<tmpdir>/browser-mcp-screenshots` | Onde salvar screenshots |
| `AUDIT_LOG` | `<tmpdir>/browser-mcp-audit.log` | Arquivo de auditoria |
| `BROWSER_HEADLESS` | `false` | `true` roda sem janela |
| `BROWSER_TIMEOUT` | `15000` | Timeout das operações (ms) |
| `BLOCKED_DOMAINS` | `banco,pagamento,financeiro,pix,transferencia` | Termos bloqueados no hostname |

Caminhos típicos do perfil:

- Windows: `C:\Users\<usuario>\AppData\Local\Google\Chrome\User Data`
- macOS: `~/Library/Application Support/Google/Chrome`
- Linux: `~/.config/google-chrome`

## Como o agente deve usar

Toda chamada **deve** incluir `[AGENT-BROWSER-TASK]` em `task_description`, com o que está sendo feito e por quê:

```
[AGENT-BROWSER-TASK] Acessando painel de hospedagem para realizar deploy
da versão 1.2.0 do sistema. Ação: clicar no botão Deploy na aba Production.
Risco identificado: nenhum. Credenciais: não serão inseridas nesta sessão.
```

Sem o marcador (ou com qualquer padrão de risco) o guard bloqueia a chamada e devolve um erro descritivo.

## Desenvolvimento

```bash
npm test          # testes unitários (sem browser)
npm run lint      # ESLint
npm run test:e2e  # fluxo real contra example.com (precisa de Chrome; BROWSER_HEADLESS=true para não abrir janela)
```

Mais em [docs/architecture.md](docs/architecture.md) e [CONTRIBUTING.md](CONTRIBUTING.md).

## Limitações conhecidas

- O Chrome deve estar **fechado** quando o servidor iniciar (conflito de perfil).
- Chrome 136+ pode recusar automação sobre o diretório de dados **padrão**. Se falhar, copie o perfil para outra pasta e aponte `CHROME_USER_DATA_DIR` para ela.
- Páginas com 2FA exigem intervenção manual prévia.
- Sites com anti-bot pesado (ex.: Cloudflare challenge) podem bloquear.
- Uma única aba ativa; sem suporte a múltiplas abas.

## Licença

[MIT](LICENSE)
