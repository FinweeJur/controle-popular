# Prompt — painel de facetas para reduzir dispersão de rotas

> **Tipo:** PROMPT
> **Domínio:** front-end, rotas, facetas, redirects, SEO
> **Última medição:** 2026-11-02
> **Leitura estimada:** curta (5–15 min)
> **Relacionados:** [PLANO-PAINEL-INTEGRADO-02-11.md](PLANO-PAINEL-INTEGRADO-02-11.md), [AGENTS.md](/AGENTS.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md)
> **Palavras-chave:** prompt, painel, facetas, faceta, redirects, ponte, direitos, jurisprudencia

## Sumário

- [Papel e objetivo](#0-papel-e-objetivo)
- [O padrão](#1-o-padrão-leia-antes-de-escrever-código)
- [Estado medido](#2-estado-medido-02112026--não-repita-a-medição-sem-motivo)
- [Tarefa A](#3-tarefa-a--extrair-o-componente)
- [Tarefa B](#4-tarefa-b--piloto-em-direitos-em-movimento)
- [Tarefa C](#5-tarefa-c--repetir-em-uma-família-por-vez)
- [Critérios de aceite](#6-critérios-de-aceite)
- [Comandos](#7-comandos)
- [O que não fazer](#8-o-que-não-fazer)
- [Entrega](#9-entrega)

Copie daqui até o fim e cole numa sessão nova do opencode aberta em
`X:\DevCoder\OpenCode\controle-popular`.

---

## 0. Papel e objetivo

> ⚠️ **Fase 1 já executada em 02/11/2026** (tarefa A + `/direitos-em-movimento`).
> O padrão vive em `app/components/PainelFacetas.tsx` e
> `app/components/Barras.tsx`; a ponte genérica em `app/components/PaginaPonte.tsx`.
> Leia a seção 7 de `PLANO-PAINEL-INTEGRADO-02-11.md` antes de repetir qualquer
> etapa e siga para a fase 2.

Você é o agente de front-end do Controle Popular. O portal tem **343 rotas**
(`page.tsx`) e `~46` páginas do top-100 são irmãs que diferem só por uma
dimensão. Objetivo desta sessão: **transformar famílias de rotas irmãs em um
painel só, com faceta por link**, começando pelo eixo de direitos.

O padrão já existe e está em produção em `/jurisprudencia` (feito em
02/11/2026). Reaproveite, não reinvente.

## 1. O padrão (leia antes de escrever código)

Arquivos de referência, todos no repo:

- `apps/web/app/jurisprudencia/page.tsx` — composição: recorte único alimenta
  painel **e** lista.
- `apps/web/app/jurisprudencia/partes.tsx` — `Barras` (ranking em barra, CSS
  puro), `FaixaTemas` (botões que são links, N ao lado), `TabelaCasos`
  (5 colunas no desktop, cartão no celular).
- `apps/web/lib/jurisprudencia.ts` — funções puras: `filtrar` com `recorte`,
  `contagemPor`, `contarLista`, `faixasDeValor`, `estatisticasDeValor`,
  `contagemTemasIndenizacao`.
- `apps/web/lib/jurisprudencia.test.ts` — 14 testes do casamento de tema.

Regras do padrão, sem exceção:

1. **Faceta é link**, com o estado na URL (`?recorte=`, `?subfrente=`,
   `?lente=`). Nunca `useState` segurando coleção — AGENTS §5.1.
2. **Render no servidor.** O clique não recarrega a casca — AGENTS §5.13.
3. **Um recorte alimenta todos os blocos.** Contador, barras e lista nunca
   discordam entre si.
4. **Todo número com N e denominador.** Percentual sem base é erro de
   publicação.
5. **Celular é a régua (390 px)**: painel em uma coluna, tabela vira cartão,
   nada de rolagem lateral — AGENTS §5.14.
6. **Fonte mínima 12 px** — AGENTS §5.16.

## 2. Estado medido (02/11/2026 — não repita a medição sem motivo)

| Prefixo | Páginas no top-100 |
|---|---:|
| `/ambiental` | 20 |
| `/direitos-em-movimento` | 8 |
| `/judiciario` | 6 |
| `/congresso` | 4 |
| `/empresas` | 4 |
| `/paraopeba` | 4 |
| `/terra-e-territorios` | 4 |
| `/funcaosocialterra` | 3 |

Catálogos que precisam continuar coerentes depois de qualquer merge:

- `apps/web/lib/eixos/catalogo.ts` — 3 eixos, 18 subfrentes (id, slug, título,
  tags).
- `apps/web/data/top-100-paginas.json` — 100 páginas com `href`, `eixo`,
  `subfrenteId`.
- `apps/web/app/indice/` — o catálogo público das 100 páginas
  (`Catalogo100PaginasClient`).

## 3. Tarefa A — extrair o componente

Mova a faixa de facetas e as barras para `apps/web/app/components/`:

- `PainelFacetas.tsx` — recebe `facetas: {slug, rotulo, n}[]`, a faceta atual e
  uma função que monta href. Não conhece jurisprudência.
- `Barras.tsx` — ranking com denominador explícito.

`/jurisprudencia` passa a importar de lá (sem mudar comportamento; os 14 testes
seguem verdes). Este passo existe para não copiar código em cada família.

## 4. Tarefa B — piloto em `/direitos-em-movimento`

Hoje: 8 páginas no top-100, sendo seis subfrentes de serviço essencial com o
mesmo esqueleto (indicador, série, lista).

1. Ler as rotas reais: `Get-ChildItem apps/web/app/direitos-em-movimento -Recurse -Filter page.tsx`.
2. Para cada subfrente que virar faceta, **conferir o dado**: se a página tem
   série própria e conteúdo exclusivo, ela continua rota; se é só um recorte,
   vira faceta.
3. Painel em `/direitos-em-movimento` com `?subfrente=<slug>`.
4. Rotas absorvidas: redirecionar **conforme o alvo de build** — a armadilha
   está documentada em `apps/web/next.config.ts` (linha ~523):
   - alvo com servidor (`azure`/`tunnel`): `async redirects()` no
     `next.config.ts`, `permanent: true`;
   - alvo `output: 'export'` (`PAGES_BASE_PATH` definido → GitHub Pages):
     `redirects()` **não é aplicado e o Next não avisa** — o equivalente é a
     página-ponte `app/components/PaginaPonte.tsx` com
     `<meta http-equiv="refresh">`. O Cloudflare é o outro alvo e roda com
     servidor (Workers), onde `redirects()` vale.
   Se você usar `redirects()` e testar só no alvo estático, a rota antiga vira
   404 em produção sem nenhum erro no build.
5. Atualizar `top-100-paginas.json` e o catálogo do índice: nenhuma entrada
   pode apontar para rota que só redireciona.

## 5. Tarefa C — repetir em UMA família por vez

Ordem sugerida: `/empresas` → `/congresso` → `/judiciario` → `/ambiental` →
`[municipio]/prefeitura`.

**Não faça em lote por prefixo.** `ambiental/barragens/descaracterizacao` e
`ambiental/copam` parecem irmãs de `/ambiental` e têm dado próprio. Decida
página a página, olhando o conteúdo, e registre a decisão no commit.

## 6. Critérios de aceite

- [ ] `/jurisprudencia` continua idêntica em comportamento (testes verdes).
- [ ] Cada família migrada tem **uma** URL canônica; as antigas dão 301.
- [ ] Nenhuma entrada do top-100 ou do índice aponta para rota redirecionada.
- [ ] Painel no celular (390 px) sem rolagem lateral.
- [ ] Nenhuma fonte abaixo de 12 px.
- [ ] `npx tsc --noEmit` limpo.
- [ ] `npm test` verde.
- [ ] `npm run build` verde, com contagem de páginas igual ou maior que antes.

## 7. Comandos

```powershell
# rotas do eixo escolhido
Get-ChildItem apps\web\app\<eixo> -Recurse -Filter page.tsx | Select-Object FullName

# total de rotas (baseline: 343)
(Get-ChildItem apps\web\app -Recurse -Filter page.tsx -File | Measure-Object).Count

# verificação
cd apps\web
npx tsc --noEmit
npx vitest run lib/jurisprudencia.test.ts
npx eslint app lib --ext .ts,.tsx
npm run build

# fonte mínima
rg "text-\[(9|10|11)px\]" apps\web\app
```

## 8. O que não fazer

- Não remover rota sem 301 — link externo e histórico se perdem.
- Não deixar duas URLs indexáveis com o mesmo conteúdo.
- Não pôr a coleção como prop de cliente.
- Não mover página com dado próprio só porque o prefixo bate.
- Não fazer deploy: commit e push sim; publicar só com ordem do dono.

## 9. Entrega

- Commits pequenos, um por família migrada, com a lista de rotas removidas e
  os redirects no corpo da mensagem.
- Atualizar `docs/planos/PLANO-PAINEL-INTEGRADO-02-11.md` com o que foi feito e
  o que mudou de plano.
- Avisar no Telegram em 2–3 linhas ao terminar cada família.
