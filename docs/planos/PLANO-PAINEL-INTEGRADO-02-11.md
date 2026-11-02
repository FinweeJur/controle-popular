# Plano — usar o padrão de painel para reduzir a dispersão de rotas

> **Tipo:** PLANO
> **Domínio:** front-end, rotas, facetas, SEO, redirects
> **Última medição:** 2026-11-02
> **Leitura estimada:** curta (5–15 min)
> **Relacionados:** [PROMPT-PAINEL-INTEGRADO.md](PROMPT-PAINEL-INTEGRADO.md), [AGENTS.md](/AGENTS.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md)
> **Palavras-chave:** painel, facetas, rotas, redirects, ponte, direitos, jurisprudencia, seo

## Sumário

- [O número que motiva](#1-o-número-que-motiva)
- [O padrão que se repete](#2-o-padrão-que-se-repete)
- [Onde aplicar, em ordem](#3-onde-aplicar-em-ordem)
- [O que não fazer](#4-o-que-não-fazer)
- [Como saber que funcionou](#5-como-saber-que-funcionou)
- [Ordem de trabalho para a próxima sessão](#6-ordem-de-trabalho-sugerida-para-a-próxima-sessão)
- [Execução de 02/11/2026](#7-execução--02112026-tarefa-a-e-fase-1)

Criado: 2026-11-02. Status: proposta.
Origem: o painel construído em `/jurisprudencia` (facetas por link, render no
servidor, estado na URL) resolve o mesmo problema em outras famílias de página.

## 1. O número que motiva

Medido em 02/11/2026 no checkout canônico:

- **343 rotas** com `page.tsx` em `apps/web/app`.
- O catálogo `apps/web/data/top-100-paginas.json` distribui as 100 páginas
  nobres em 3 eixos + Central ONSA.
- A concentração mostra onde há dispersão: páginas irmãs que diferem só por uma
  dimensão — o mesmo dado, outro recorte.

| Prefixo | Páginas no top-100 | Exemplo de irmãs |
|---|---:|---|
| `/ambiental` | **20** | barragens, barragens/descaracterizacao, licenciamento, copam |
| `/direitos-em-movimento` | 8 | saude-publica, educacao, trabalho-e-renda, moradia |
| `/judiciario` | 6 | instituicoes, contatos, tribunais, sirenejud |
| `/congresso` | 4 | proposicoes, votacoes, mg |
| `/empresas` | 4 | fortunas, conglomerados, executivos |
| `/paraopeba` | 4 | execucao, biblioteca, linha-do-tempo |
| `/terra-e-territorios` | 4 | vales, nossos-rios, nossas-serras |
| `/funcaosocialterra` | 3 | mapa, alertas |

E no nível de diretório: `[municipio]/prefeitura` sozinho tem **11 rotas** —
multiplicadas por cidade quando o alvo prerenderiza.

Isso não é só estética. Cada rota irmã duplica: layout, h1, metadata,
canonical, link no índice, entrada no top-100, teste de acessibilidade e um
lugar a mais para o dado divergir.

## 2. O padrão que se repete

O painel de `/jurisprudencia` tem três peças que servem em qualquer família:

1. **Faixa de facetas** — botões que são links, com o N ao lado. Estado na URL
   (`?recorte=`), então cada recorte é compartilhável, indexável e funciona sem
   JavaScript.
2. **Blocos derivados de um recorte único** — contadores, barras e lista saem
   todos da mesma seleção, então os números nunca discordam da tabela.
3. **Render no servidor** — a coleção não vira prop de cliente (AGENTS §5.1) e
   a casca não desmonta (AGENTS §5.13).

O que muda de uma família para outra é só a dimensão da faceta: subfrente
(direitos), tipo de instrumento (ambiental), órgão (judiciário), tema de
indenização (jurisprudência).

## 3. Onde aplicar, em ordem

### Fase 1 — `/direitos-em-movimento` (piloto, 8 páginas → 1 painel + 1 rota por subfrente só se preciso)

As seis subfrentes de serviço essencial têm a mesma forma: indicador, série,
lista de equipamentos. Hoje são seis rotas com o mesmo esqueleto.

- Painel com faceta por subfrente (saúde, educação, trabalho e renda, moradia,
  segurança alimentar, acesso à justiça).
- As rotas antigas respondem **301** para `?subfrente=...`.
- Por que primeiro: é o eixo com mais páginas no top-100 depois de
  `/ambiental`, e o dado é tabular — o ganho aparece rápido.

### Fase 2 — `/empresas`, `/congresso`, `/judiciario` (14 páginas → 3 painéis)

Famílias pequenas, mesmo formato: uma entidade, várias lentes.

- `/empresas?lente=conglomerados|fortunas|executivos`
- `/congresso?lente=proposicoes|votacoes|mg`
- `/judiciario?lente=tribunais|instituicoes|contatos|sirenejud`

### Fase 3 — `/ambiental` (20 páginas → 1 painel de 5 facetas)

O maior bloco. A dimensão natural é **instrumento**: barragens, licenciamento,
COPAM, territórios (serras/rios/vales), desastres.

Cuidado: `barragens/descaracterizacao` e `copam` têm dado próprio e podem
merecer faceta, não redirect. Decidir página a página com o catálogo na mão —
**não** mover por prefixo no automático.

### Fase 4 — `[municipio]/prefeitura` (11 rotas × cidades)

Painel por município com faceta por área (contratos, pessoal, legislação,
meio ambiente). Aqui o ganho é de manutenção: uma rota em vez de onze por
cidade, e a URL continua linda (`/betim/prefeitura?area=contratos`).

## 4. O que **não** fazer

- **Não apagar rota sem redirecionar.** Cada rota do top-100 tem link externo e
  histórico. Mas o mecanismo depende do alvo: `redirects()` no
  `next.config.ts` **só vale onde há servidor**. No alvo `output: 'export'`
  (`PAGES_BASE_PATH` definido → GitHub Pages) ele é ignorado em silêncio e o
  equivalente é a página-ponte genérica `app/components/PaginaPonte.tsx`
  (`<meta http-equiv="refresh">`). Ver `next.config.ts` linha ~523.
  Antes de remover uma rota, confirme qual alvo está publicado.
  ⚠️ Correção de 02/11/2026: a versão anterior deste plano chamava o alvo
  estático de "Cloudflare estático" e mandava a ponte para
  `components/PaginaPonte.tsx` sem o prefixo `app/`. O Cloudflare roda com
  servidor (Workers) e é o alvo em que `redirects()` funciona; o estático é o
  GitHub Pages, e a ponte mora em `app/components/PaginaPonte.tsx`.
- **Não deixar duas rotas com o mesmo conteúdo** indexável: canônica aponta
  para o painel, a antiga redireciona.
- **Não usar estado de cliente** para a faceta: quebra compartilhamento,
  indexação e a regra 5.1.
- **Não mover em lote por prefixo.** `barragens/descaracterizacao` parece irmã
  e tem dado próprio.
- **Não testar em produção.** O gate é `tsc`, `npm test` e build local.

## 5. Como saber que funcionou

| Métrica | Antes | Meta |
|---|---|---|
| Rotas `page.tsx` | 343 | −40 na fase 1–3 |
| Páginas do top-100 com irmã duplicada | ~46 | ≤ 10 |
| Redirects 301 cobrindo rota removida | 0 | 100% |
| Entradas no índice apontando para rota viva | 100 | 100 |
| `npm test` | verde | verde |
| Build | verde | verde |

Verificação manual, por família: abrir o painel, clicar em cada faceta, conferir
que o N do botão bate com o total da lista e que a URL muda sem recarregar a
casca.

## 6. Ordem de trabalho sugerida para a próxima sessão

1. Ler `lib/eixos/catalogo.ts` (3 eixos, 18 subfrentes) e
   `data/top-100-paginas.json`.
2. Listar as rotas do eixo escolhido com
   `Get-ChildItem apps/web/app/<eixo> -Recurse -Filter page.tsx`.
3. Extrair o componente de painel de `app/jurisprudencia/` para
   `apps/web/app/components/PainelFacetas.tsx` (faixa + barras), sem acoplar ao
   acervo de jurisprudência.
4. Migrar **uma** família primeiro (fase 1), com 301 e índice atualizado.
5. Só depois repetir o padrão nas outras.

O prompt pronto para a sessão nova está em
[`PROMPT-PAINEL-INTEGRADO.md`](PROMPT-PAINEL-INTEGRADO.md).

## 7. Execução — 02/11/2026 (tarefa A e fase 1)

Branch `painel-facetas`, worktree `.claude/worktrees/painel-facetas`, porta 3048.

### Tarefa A — componentes extraídos (feito)

- `apps/web/app/components/PainelFacetas.tsx`: faixa de facetas por link, com
  `facetas`, `atual`, `total` e `hrefDe`. Não conhece eixo nem acervo.
- `apps/web/app/components/Barras.tsx`: ranking com denominador vindo do
  chamador e rótulos por prop (chave sem tradução aparece crua, não inventada).
- `/jurisprudencia` importa os dois; `FaixaTemas` e `Barras` ficaram como
  adaptadores finos. Os 14 testes seguem verdes e nada muda na tela.

### Fase 1 — medido antes de migrar (o plano estava otimista)

A família **não** eram 8 irmãs:

| Rota | O que é | Decisão |
|---|---|---|
| `/direitos-em-movimento` | hub de navegação, com abertura viva | continua rota |
| `/ajuda` | diretório da rede de proteção | continua rota |
| `/informacao` | canais de LAI | continua rota |
| `/conselhos` | painel de 710 conselhos, com cliente próprio | continua rota |
| `/denuncia` | entrevista guiada + DOCX no navegador | continua rota |
| `/seguranca-publica` | Sinesp VDE, dado real com tabela própria | continua rota |
| `/saude-publica` | 4 cartões + série + fichas | **faceta** |
| `/educacao` | mesma forma | **faceta** |
| `/trabalho-e-renda` | mesma forma | **faceta** |
| `/trabalho-e-renda/cadastro-empregadores` | lista nominal de CNPJ | continua rota |

Três, não seis — e as três compartilhavam o mesmo esqueleto de fato.

### Achado que mudou a execução: os cartões eram "dados sintéticos"

As três páginas traziam números fixos no código, comentados como "dados
sintéticos oficiais de referência", rotulados com fonte oficial (CNES, INEP,
CAGED). Num portal cuja regra é "todo número com fonte", isso é risco
editorial: o leitor não distingue referência nacional de medição do portal.

Decisão do dono: manter os números, com rótulo honesto. O que foi feito:

- `apps/web/lib/direitos/servicos.ts` guarda a dimensão da faceta, a fonte de
  cada recorte e a `ressalva` (o que o número não diz).
- `AvisoReferencia` aparece **antes** do primeiro cartão: "referência nacional,
  não medição deste portal", com link para a página oficial da fonte.
- O N das facetas é o número de fichas catalogadas por subfrente — o único N
  real disponível (hoje 2, 1 e 0). Não se inventou contagem para enfeitar botão.

### O que foi entregue

- Rota canônica `/direitos-em-movimento/servicos?subfrente=saude-publica|educacao|trabalho-e-renda`.
- Conteúdo movido sem perda para `servicos/ConteudoSaude|ConteudoEducacao|ConteudoTrabalho.tsx`,
  mais `FichasDaSubfrente.tsx` (lista e sugestões, antes repetidas três vezes).
- As três rotas antigas viraram ponte (`app/components/PaginaPonte.tsx`,
  criado nesta sessão) **e** entrada em `redirects()` do `next.config.ts`,
  cada uma apontando para o recorte certo.
- `top-100-paginas.json`, `resumos-top100.ts`, `sitemap.ts`, `rotas-descobertas.ts`,
  `indice`, `menu-portal`, `FichaCard`, escada do assistente e `contexto-pagina`
  deixaram de apontar para rota redirecionada.
- As três pontes entraram em `EXCLUIR` de `lib/sitemap/descoberta.ts`; o painel
  sem faceta também, porque quem é anunciado são os três recortes.

### O que mudou de plano

1. **A URL do painel é `/servicos`, não a raiz do eixo.** O hub é a porta de
   entrada (quatro portas, abertura viva); pendurar o painel nele misturaria
   dois níveis de página.
2. **O alvo estático é GitHub Pages, não Cloudflare.** O Cloudflare roda com
   servidor (Workers), onde `redirects()` funciona. Corrigido também no prompt.
3. **A ponte mora em `app/components/PaginaPonte.tsx`.** A versão anterior do
   texto apontava `components/PaginaPonte.tsx`, caminho que não existia.
4. **Rotas a menos: 3 → 1** nesta fase (mais 1 arquivo de ponte por rota, que
   não conta como página de conteúdo). A meta de −40 continua nas fases 2–4.

### Pendência registrada

Os números de referência continuam sem data de competência ("2023", "2025"
aparecem só na prosa). Quando alguém for atualizá-los, trocar valor **e** data
no mesmo commit — número velho sem data envelhece calado.

