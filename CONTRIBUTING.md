# Contribuindo

1. Faça um fork/branch a partir de `main`.
2. `npm install`
3. Faça a mudança com testes (`test/`). Mudanças no guard **precisam** de teste para o caso bloqueado e para o caso permitido.
4. Antes de abrir o PR: `npm run lint && npm test`.
5. Commits curtos e no imperativo (ex.: `Bloqueia extensão .p12 no guard`).

## Convenções

- Node.js com ESM; sem caminhos ou credenciais hardcoded (tudo via variáveis de ambiente, documentadas em `.env.example`).
- Nunca escrever em `stdout` (reservado ao protocolo MCP); use `console.error` para logs.
- Toda tool novo segue o contrato descrito em [docs/architecture.md](docs/architecture.md) e chama o guard antes de agir.
- Atualize `docs/tools.md` e o `CHANGELOG.md` quando mudar o comportamento de uma tool.
