# Referência das tools

Todas as tools exigem `task_description` contendo `[AGENT-BROWSER-TASK]`. As respostas são JSON no `content` de texto; erros vêm com `isError: true`.

## `browser_navigate`

Navega para uma URL e aguarda o carregamento.

| Campo | Tipo | Obrigatório | Padrão |
| --- | --- | --- | --- |
| `url` | string (URL válida) | sim | |
| `wait_until` | `load` \| `networkidle` \| `domcontentloaded` | não | `load` |

Resposta: `{ success, url, title }`

## `browser_click`

Clica em um elemento. Estratégias, em ordem: `selector` (CSS) → `text` (texto visível, parcial) → `aria_label` (botão com esse nome, depois `getByLabel`). Informe ao menos um. Após o clique, aguarda `networkidle` por até 3 s (ignora timeout).

Resposta: `{ success, clicked }`. Erro se nenhum elemento for encontrado.

## `browser_fill`

Preenche input/textarea (limpando antes, por padrão).

| Campo | Tipo | Obrigatório | Padrão |
| --- | --- | --- | --- |
| `selector` | string (CSS) | sim | |
| `value` | string | sim | |
| `clear_first` | boolean | não | `true` |
| `press_enter` | boolean | não | `false` |

Resposta: `{ success, field, value_length }` (o valor não é devolvido).

## `browser_screenshot`

Salva um PNG em `SCREENSHOTS_DIR`.

| Campo | Tipo | Padrão |
| --- | --- | --- |
| `filename` | string, sem extensão | timestamp |
| `full_page` | boolean | `false` |

Resposta: `{ success, path, url }`

## `browser_read_page`

Lê o estado atual da página.

| Campo | Tipo | Padrão |
| --- | --- | --- |
| `include_links` | boolean | `true` (até 30 links) |
| `max_text_length` | inteiro positivo | `3000` |

Resposta: `{ title, url, text, truncated, links? }`

## `browser_wait_for`

Aguarda um seletor no estado desejado e/ou um texto na página. Informe `selector` e/ou `text`.

| Campo | Tipo | Padrão |
| --- | --- | --- |
| `selector` | string (CSS) | |
| `text` | string | |
| `state` | `visible` \| `hidden` \| `attached` \| `detached` | `visible` |
| `timeout` | ms | `BROWSER_TIMEOUT` |

Resposta: `{ success: true, found: true }` ou, em timeout, `{ success: false, error }` (sem exceção).
