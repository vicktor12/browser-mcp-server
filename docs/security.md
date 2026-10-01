# Segurança

Este servidor dá a um agente de IA controle de um navegador, possivelmente com **sessões reais já logadas**. Trate-o como uma ferramenta de alto privilégio.

## Modelo de ameaça

| Risco | Mitigação |
| --- | --- |
| Agente executa ação sem intenção explícita | `task_description` obrigatório com o marcador `[AGENT-BROWSER-TASK]` e justificativa, registrado em auditoria |
| Vazamento de credenciais/tokens via URL ou formulário | O guard bloqueia tokens longos em URLs e seletores/rótulos de campos de credencial |
| Envio de arquivos sensíveis | Bloqueio de `.env`, `.pem`, `.key` em `url`, `selector`, `value` e `filename` |
| Ação em sistemas financeiros | Lista de domínios bloqueados (`BLOCKED_DOMAINS`), checada na URL de destino e na página atual |
| Path traversal ao salvar screenshots | O `filename` passa por `path.basename` |
| Valores sensíveis nos logs | `browser_fill` devolve só o tamanho do valor; o audit log guarda apenas os 100 primeiros caracteres da descrição |

## Regras do guard

Executadas em `security/guard.js`, nesta ordem; a primeira que falhar lança `Error` (que vira `isError: true` para o agente):

1. `task_description` contém `[AGENT-BROWSER-TASK]`.
2. `url` não casa com `/[?&][^=]+=.{32,}/` (possível token em query string).
3. `selector`, `aria_label` e `text` não casam com `password|api_key|secret|token|private_key` (case-insensitive).
4. `url`, `selector`, `value` e `filename` não contêm `.env`, `.pem` ou `.key` como extensão.
5. O hostname de `url` e o da página atual não contêm nenhum termo de `BLOCKED_DOMAINS`.
6. Se tudo passou, registra uma linha no audit log: `timestamp | tool | 100 primeiros chars da descrição`.

## Audit log

Arquivo definido por `AUDIT_LOG` (default `<tmpdir>/browser-mcp-audit.log`). Só tasks **aprovadas** são registradas; bloqueios aparecem como erro na resposta da tool.

## Limites conhecidos (leia antes de confiar)

- **O guard é uma barreira de bom senso, não um sandbox.** Ele inspeciona os *inputs da tool*, não o que a página faz. Um agente determinado pode contornar regras baseadas em texto (por exemplo, descrevendo o campo de forma diferente). Não use este servidor para limitar um agente hostil.
- `BLOCKED_DOMAINS` é correspondência por *substring* do hostname: `pix` bloqueia também `pixabay.com`; um banco com domínio sem os termos configurados não é bloqueado. Ajuste a lista ao seu caso.
- **Prompt injection:** o conteúdo lido de páginas (`browser_read_page`) é dado não confiável e pode conter instruções maliciosas. Revise o que o agente faz após ler páginas de terceiros.
- O servidor usa o perfil do Chrome informado: o agente tem acesso às sessões logadas nele. Prefira um **perfil dedicado** com apenas os logins necessários.
- Não há restrição de domínios por *allowlist*. Para ambientes mais sensíveis, considere adicionar uma.

## Boas práticas de uso

- Faça login nos sistemas **antes** de acionar o agente; nunca peça ao agente para digitar senhas ou tokens.
- Revise o audit log periodicamente.
- Nunca versione o `.env` (já está no `.gitignore`).

## Reportando vulnerabilidades

Abra uma *security advisory* privada no repositório do GitHub (aba **Security**) em vez de uma issue pública.
