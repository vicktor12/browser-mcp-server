# Arquitetura

## Visão geral

```
Claude Code ──stdio (JSON-RPC / MCP)──> index.js ──> tools/*.js ──> browser.js ──> Chrome
                                                          │
                                                          └──> security/guard.js ──> audit log
```

O servidor roda como processo filho do Claude Code, falando MCP por stdin/stdout.
**Nada pode ser escrito em stdout além de mensagens MCP**; logs vão para `stderr` (`console.error`).

## Módulos

| Arquivo | Responsabilidade |
| --- | --- |
| `index.js` | Entry point. Registra as tools, converte os schemas Zod em JSON Schema (`z.toJSONSchema`), faz o dispatch das chamadas e converte qualquer exceção em `isError: true` (o servidor nunca cai por erro de tool). Fecha o browser em `SIGINT`/`SIGTERM`. |
| `browser.js` | Singleton do contexto/página. `getBrowser()` cria o Chrome (`launchPersistentContext`, `channel: "chrome"`) na primeira chamada e reaproveita a página depois; recria se o usuário fechar a janela. |
| `security/guard.js` | `validate(tool, input, ctx)`: validação obrigatória antes de qualquer ação. Ver [security.md](security.md). |
| `tools/*.js` | Uma tool por arquivo, cada uma exportando `name`, `description`, `schema` (Zod) e `handler(input)`. |

## Contrato de uma tool

```js
export const name = "browser_xxx";
export const description = "...";
export const schema = z.object({ task_description: z.string(), /* ... */ });
export async function handler(input) { /* validate(...) -> ação -> objeto serializável */ }
```

- `index.js` faz `schema.parse(args)` (aplica defaults e rejeita input inválido) e só então chama `handler`.
- O `handler` retorna um objeto; o `index.js` o serializa como JSON no `content` da resposta.
- Para adicionar uma tool: criar o arquivo em `tools/`, importá-lo no array de `index.js` e cobrir o schema em `test/schemas.test.js`.

## Decisões de design

- **Estado único de página.** Há uma única aba ativa compartilhada entre as chamadas; simples e suficiente para fluxos sequenciais. Não há suporte a múltiplas abas.
- **`wait_for` não lança em timeout**; devolve `{ success: false, error }` para o agente decidir o próximo passo. Os demais erros viram `isError`.
- **`fill` nunca devolve o valor preenchido**, só o tamanho, para não vazar dados em logs/transcrição.
- **Guard antes de tudo.** Em `navigate` o guard roda antes de abrir o browser; nas demais tools roda com a URL atual da página para bloquear ações em domínios proibidos mesmo após redirecionamentos.
- **Configuração só por variáveis de ambiente** (sem caminhos ou credenciais no código). Defaults de diretórios usam `os.tmpdir()` para funcionar em Windows/macOS/Linux.
- **Sem perfil configurado → perfil temporário dedicado**, em vez de falhar ou de tocar silenciosamente no perfil real.

## Testes

- `npm test`: unitários (`node:test`), sem browser. Cobrem o guard e os schemas das tools. Rodam no CI.
- `npm run test:e2e`: usa Chrome real contra `example.com` (precisa de Chrome instalado e acesso à internet). Use `BROWSER_HEADLESS=true` para não abrir janela.
