# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Alterado
- Documentação: cópia do perfil para o Chrome 136+, esclarece quando o `.env` é lido, `.mcp.json` para config por projeto e fluxo de login manual.

## [1.0.0] - 2026-09-30

### Adicionado
- Servidor MCP via stdio com as tools `browser_navigate`, `browser_click`, `browser_fill`, `browser_screenshot`, `browser_read_page` e `browser_wait_for`.
- Guard de segurança (marcador obrigatório, padrões de risco, domínios bloqueados, audit log).
- Testes unitários (`node:test`), teste E2E, ESLint e CI no GitHub Actions.
- Documentação em `docs/`.
