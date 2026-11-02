# Plano — usar o padrão de painel para reduzir a dispersão de rotas

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
  `next.config.ts` **só vale onde há servidor**; em `output: 'export'` ele é
  ignorado em silêncio e o equivalente é `components/PaginaPonte.tsx`
  (`<meta http-equiv="refresh">`). Ver `next.config.ts` linha ~523.
  Antes de remover uma rota, confirme qual alvo está publicado.
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
