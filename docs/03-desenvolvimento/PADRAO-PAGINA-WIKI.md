# Padrão de página wiki — padrão-meta de toda página nova

> **Tipo:** DESENVOLVIMENTO
> **Domínio:** global
> **Última medição:** 2026-10-13
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md), [GUIA-DE-DOCUMENTACAO.md](../GUIA-DE-DOCUMENTACAO.md), [PADRAO-VISUAL.md](../04-arquitetura/PADRAO-VISUAL.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** pagina wiki, IndiceWiki, SecaoWiki, MiniSumarioLateral, LinksRelacionados, ResumoExpandivel, IndicePagina, ancoras, top-100, next/link, acessibilidade, seis qualidades

## Sumário

- [Propósito](#propósito)
- [Esqueleto da página](#esqueleto-da-página)
- [1. Título e descrição sob o h1](#1-título-e-descrição-sob-o-h1)
- [2. "Nesta página" (IndiceWiki)](#2-nesta-página-indicewiki)
- [3. Seções com âncora](#3-seções-com-âncora)
- [4. Capítulos — wiki lateral flutuante](#4-capítulos--wiki-lateral-flutuante)
- [5. Sumário ao final da página (IndicePagina)](#5-sumário-ao-final-da-página-indicepagina)
- [6. Links relacionados nos dois pontos](#6-links-relacionados-nos-dois-pontos)
- [7. Gráficos SVG nativo acessível](#7-gráficos-svg-nativo-acessível)
- [8. Seis qualidades de dados](#8-seis-qualidades-de-dados)
- [9. Fonte oficial em formato ABNT](#9-fonte-oficial-em-formato-abnt)
- [10. Links internos sempre via next/link](#10-links-internos-sempre-via-nextlink)
- [11. Acessibilidade](#11-acessibilidade)
- [12. Verificação em camadas antes do commit](#12-verificação-em-camadas-antes-do-commit)
- [Checklist rápido](#checklist-rápido)
- [Onde mora cada peça](#onde-mora-cada-peça)
- [O que o checker automatizado exige](#o-que-o-checker-automatizado-exige)

## Propósito

Este documento é o **padrão-meta de toda página nova** do portal — e a régua
para revisar as 100 rotas do catálogo `apps/web/data/top-100-paginas.json`.

Uma página só entra no padrão quando os 12 itens abaixo estão cumpridos.
Cada item aponta o componente pronto: **não recrie o que já existe**.

Regras duras de commit, dado pessoal e publicação continuam no
[`AGENTS.md`](/AGENTS.md). Visual e tabelas: [PADRAO-VISUAL.md](../04-arquitetura/PADRAO-VISUAL.md).

## Esqueleto da página

Ordem fixa dos blocos. Copie este arranjo e preencha:

```tsx
import Link from "next/link";
import { IndiceWiki, SecaoWiki, LinksRelacionados, MiniSumarioLateral } from "@/app/components/wiki";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";

const SECOES = [
  { id: "resumo", titulo: "1. Resumo medido" },
  { id: "dados", titulo: "2. Dados da página" },
];

export default function Pagina() {
  return (
    <>
      <MiniSumarioLateral itens={SECOES} />

      <main id="conteudo-principal" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* a. breadcrumb (nav aria-label="Navegação estrutural") */}
        {/* b. OUTRAS páginas do mesmo eixo — nav com <Link>, 3 a 5 itens */}

        <h1>…</h1>
        <ResumoExpandivel texto={descricao} className="text-sm" /> {/* ≥ text-sm */}

        <IndiceWiki itens={SECOES} /> {/* topo, ≥ 2 itens */}

        <SecaoWiki id="resumo" titulo="1. Resumo medido">…</SecaoWiki>
        <SecaoWiki id="dados" titulo="2. Dados da página">…</SecaoWiki>

        <LinksRelacionados links={LINKS_RELACIONADOS} /> {/* rodapé, ≤ ~5 */}
      </main>
    </>
  );
}
```

O sumário do rodapé (`IndicePagina`) e o scroll-spy lateral não entram no
código da página: veja os itens 4 e 5.

## 1. Título e descrição sob o h1

- ✅ Descrição logo depois do `<h1>` **nunca menor que `text-sm`** (14px).
  Regra 5.10 do [`AGENTS.md`](/AGENTS.md).
- ✅ Descrição longa (mais de ~2 linhas) usa o componente
  `ResumoExpandivel` (`app/components/ResumoExpandivel.tsx`): aparece
  recolhida e abre no clique. **Reutilize, não recrie.**
- ⛔ Não reduza a fonte "para caber mais texto". O leitor está sob estresse.

## 2. "Nesta página" (IndiceWiki)

- ✅ Componente: `apps/web/app/components/wiki/IndiceWiki.tsx`.
- ✅ Import pelo barrel: `import { IndiceWiki } from "@/app/components/wiki";`
- ✅ Fica **no topo da página**, entre a descrição e o primeiro conteúdo.
- ✅ Aberto por padrão (é lista estática, sem botão de recolher).
- ✅ **Mínimo de 2 itens** — com menos, o componente retorna `null` e a
  página fica sem índice.
- ✅ Os `id` dos itens são exatamente os `id` das seções do item 3.

```tsx
<IndiceWiki itens={SECOES} />
```

O helper de seção é `SecaoWiki.tsx`, no mesmo diretório.

## 3. Seções com âncora

- ✅ Caminho preferido: `<SecaoWiki id="…" titulo="…">` — o `id` é
  **obrigatório** e alimenta o `IndiceWiki` e o sumário do rodapé.
- ✅ Caminho alternativo: `<h2 id="…">` direto, com o mesmo `id`.
- ✅ Quando falta `id`, o sumário do rodapé gera o slug sozinho com
  `slugDeTitulo` (`apps/web/lib/navegacao/indice-pagina.ts`, com teste ao
  lado: sem acento, minúsculo, símbolo vira hífen, vazio vira `secao-<idx>`).
- ✅ Toda seção de dados ganha `scroll-mt-20` (o `SecaoWiki` já traz) para
  a âncora não parar embaixo da barra fixa.

## 4. Capítulos — wiki lateral flutuante

- ✅ Componente: `apps/web/app/components/wiki/MiniSumarioLateral.tsx`
  (scroll-spy, some depois de 350 px de rolagem, só em tela larga, com
  botões de subir/descer).
- ✅ Precisa de **≥ 2 itens**; senão não renderiza.
- ✅ **Automático pelo layout raiz** desde 13/10/2026: o wrapper
  `CapitulosFlutuantes` (`app/components/wiki/CapitulosFlutuantes.tsx`)
  varre os `h2` do `main` e monta o widget. A página **não monta nada** —
  o requisito é só ter ≥ 2 headings. As 100 rotas do catálogo cobertas
  sem editar página a página. A montagem manual antiga
  (`<MiniSumarioLateral itens={SECOES} />`) pode ser removida de quem
  ainda usa.

## 5. Sumário ao final da página (IndicePagina)

- ✅ Componente: `apps/web/app/components/IndicePagina.tsx`.
- ✅ **Automático pelo layout raiz** (`app/layout.tsx`): a página não
  monta nada.
- ✅ Varre `main` por `h2`/`h3` e precisa de **≥ 2 headings** para aparecer.
- ✅ Nasce **fechado** (caixa compacta `p-2.5 sm:p-3`, uma linha) e abre
  no clique (`p-5 sm:p-6`) — regra do dono, 13/10/2026.
- ✅ Os títulos sem `id` ganham slug automático (item 3).

## 6. Links relacionados nos dois pontos

Dois blocos, cada um com **até ~5 itens**, cada item com **título +
descrição curta**.

| Ponto | O que é | Componente |
|---|---|---|
| **(a) topo da página** | bloco de navegação para OUTRAS páginas do mesmo eixo | `nav aria-label` com `<Link>` (exemplo real: `app/eua/components/SubNavEua.tsx`) |
| **(b) rodapé do conteúdo** | páginas de mesmo tema, "próximo passo" do leitor | `LinksRelacionados` (`app/components/wiki/LinksRelacionados.tsx`) |

- ✅ `LinksRelacionados` já usa `next/link` por dentro.
- ✅ Título + descrição em uma frase; acima de 5, crie uma página de
  índice dedicada.
- ⛔ Os dois pontos são obrigatórios juntos. Um só é "parcial".

## 7. Gráficos SVG nativo acessível

- ✅ SVG nativo ou componente próprio: `GraficoBarrasSvg.tsx`,
  `GraficoLinhaSvg.tsx` (`app/components/`), `BarrasValor`,
  `ComposicaoCamara`.
- ⛔ Nada de `recharts`, `nivo` nem biblioteca pesada — teto de 3 MiB no
  Workers ([PADRAO-VISUAL.md](../04-arquitetura/PADRAO-VISUAL.md)).
- ✅ Sempre **alternativa em texto ou tabela** ao lado do gráfico.
- ✅ **A cor nunca é o único canal:** rótulo, padrão de preenchimento ou
  ícone acompanham a cor (AGENTS §8, qualidades 4 e extras).
- ✅ `role="img"` + `<title>`/`aria-label` descrevendo o que o gráfico
  mostra.

## 8. Seis qualidades de dados

Vale para toda página que publica acervo ou lista
(§8 do [`AGENTS.md`](/AGENTS.md)):

| # | Qualidade | Como cumprir |
|---|---|---|
| 1 | Fonte oficial direta | hiperlink por registro à URL canônica, nunca à home do órgão |
| 2 | Busca e filtro | busca textual tolerante a acento + facetas reais (status, UF, ano, categoria) |
| 3 | Ordenação | por coluna, crescente e decrescente, inclusive nomes, valores e datas |
| 4 | Cartões de topo | agregados **medidos e datados**, nunca digitados à mão |
| 5 | Contexto no Seu Nonô | tags e metadados da base alimentam o assistente, resposta em frases curtas com link oficial |
| 6 | Exportação e impressão | CSV do que está **filtrado na tela**, separador `;`, **BOM UTF-8** (`\uFEFF`), + CSS `@media print` |

Não dispensa: página de servidor importa o **agregado** (`COBERTURA_*`),
nunca o array inteiro; e **página que lê do banco só mostra as seis
qualidades quando o banco responde** — "página vazia" ≠ "código faltando".

## 9. Fonte oficial em formato ABNT

- ✅ Citação no padrão **ABNT (Autor, Data)**, com hiperlink e botão
  "Fonte": `IBGE. Censo Demográfico 2022. Rio de Janeiro: IBGE, 2023.
  Disponível em: <url>. Acesso em: 13 out. 2026.`
- ✅ Fonte declarada também no cabeçalho do arquivo (`Fonte oficial:` no
  comentário de topo) e no rodapé do cartão de dado.
- ✅ **Dupla verificação** de todo número: 2× método, cálculo e
  raciocínio, antes de publicar.
- ⛔ Número sem fonte não vai ao ar; link solto para a home do órgão
  também não.

## 10. Links internos sempre via next/link

- ✅ Todo link para PÁGINA interna usa `next/link`, inclusive os de
  `href` dinâmico (o ESLint `no-html-link-for-pages` não enxerga esses).
- ✅ `<a href>` cru só para: externo, `mailto:`/`tel:`, âncora pura
  (`#`), arquivo (`.pdf`, `.json`, imagem) e `/api/...`.
- ⛔ `<a href="/pagina">` mata o áudio do rádio e o estado do pet —
  `AGENTS.md` §5.13. A rede de segurança é o `InterceptadorLinks`.

## 11. Acessibilidade

- ✅ `aria-label` em toda `nav`, `button` sem texto e `svg`.
- ✅ Foco visível: `focus-visible:ring-2 ring-focus` (nunca
  `outline: none` sem substituto).
- ✅ Contraste **AA ≥ 4,5:1** entre texto e fundo, inclusive na descrição
  sobre foto (contorno e sombra, `CapaFrente.tsx`).
- ✅ Alvo de toque confortável: ≥ 24 px (WCAG 2.5.8), ideal 44 px.
- ✅ Um `h1` por página; sem pular de `h1` para `h4`.

## 12. Verificação em camadas antes do commit

`AGENTS.md` §9. O commit não espera a suíte inteira:

```bash
npx tsc --noEmit                              # em apps/web
npx vitest run lib/sem-cpf-no-repo.test.ts    # guarda de CPF
npx eslint <arquivos do diff>                 # só o que mudou
python scripts/validar-documentacao.py        # se mexeu em docs/
```

- ✅ Diff tocando `lib/`: `npm run test:lib -- --changed HEAD` (de
  `apps/web`).
- ✅ UI pura (`.tsx`, sem `lib/`): `tsc` + `eslint` bastam.
- ✅ Antes do push e do deploy: `npm test` (suíte completa).
- ✅ Mexeu em `docs/`: `python scripts/validar-documentacao.py` — é o
  mesmo script da CI.

## Checklist rápido

Uma linha por item. Tudo `[x]` antes do commit.

| Feito | Item | O que conferir |
|---|---|---|
| [ ] | 1. Título + descrição | descrição ≥ `text-sm`; longa usa `ResumoExpandivel` |
| [ ] | 2. "Nesta página" | `IndiceWiki` no topo, aberto, ≥ 2 itens |
| [ ] | 3. Seções com âncora | `SecaoWiki` com `id` (ou `h2 id=`) em toda seção |
| [ ] | 4. Capítulos | `MiniSumarioLateral` montado com ≥ 2 itens |
| [ ] | 5. Sumário do rodapé | `IndicePagina` automático, ≥ 2 headings |
| [ ] | 6. Links relacionados | bloco no topo + `LinksRelacionados` no rodapé, ≤ ~5 cada |
| [ ] | 7. Gráficos | SVG nativo, alternativa em texto/tabela, cor não sozinha |
| [ ] | 8. Seis qualidades | fonte, busca, ordenação, cartões, Seu Nonô, CSV+BOM+print |
| [ ] | 9. Fonte ABNT | Autor, Data, hiperlink e botão "Fonte"; dupla verificação |
| [ ] | 10. `next/link` | nenhum `<a href>` cru para página interna |
| [ ] | 11. Acessibilidade | `aria-label`, foco visível, AA 4,5:1, alvo ≥ 24 px |
| [ ] | 12. Verificação em camadas | `tsc`, `eslint` do diff, `vitest` do escopo, validador de docs |

## Onde mora cada peça

| Peça | Componente / util | Arquivo |
|---|---|---|
| Descrição expansível | `ResumoExpandivel` | `apps/web/app/components/ResumoExpandivel.tsx` |
| "Nesta página" | `IndiceWiki` | `apps/web/app/components/wiki/IndiceWiki.tsx` |
| Seção com âncora | `SecaoWiki` | `apps/web/app/components/wiki/SecaoWiki.tsx` |
| "Veja +" da seção | `VejaMais` | `apps/web/app/components/wiki/VejaMais.tsx` |
| Capítulos lateral (scroll-spy) | `MiniSumarioLateral` | `apps/web/app/components/wiki/MiniSumarioLateral.tsx` |
| Card de índice de subfrente | `CartaoTopico` | `apps/web/app/components/wiki/CartaoTopico.tsx` |
| Links relacionados do rodapé | `LinksRelacionados` | `apps/web/app/components/wiki/LinksRelacionados.tsx` |
| Barrel dos componentes wiki | `index.ts` | `apps/web/app/components/wiki/index.ts` |
| Sumário automático do rodapé | `IndicePagina` | `apps/web/app/components/IndicePagina.tsx` (montado em `apps/web/app/layout.tsx`) |
| Slug automático de âncora | `slugDeTitulo` | `apps/web/lib/navegacao/indice-pagina.ts` (+ `.test.ts`) |
| Navegação do mesmo eixo (topo) | `SubNavEua` (referência) | `apps/web/app/eua/components/SubNavEua.tsx` |
| Rede de segurança de links | `InterceptadorLinks` | `apps/web/app/components/InterceptadorLinks.tsx` |
| Tabela com busca, ordenação e CSV | `TabelaEstatica` | `apps/web/app/[municipio]/components/TabelaEstatica.tsx` |
| Gráfico de barras / linha em SVG | `GraficoBarrasSvg`, `GraficoLinhaSvg` | `apps/web/app/components/` |
| Cartão de topo com número medido | `DataCard` | `apps/web/app/[municipio]/components/DataCard.tsx` |
| Roteiro visual (regra de ouro, cores) | — | `docs/04-arquitetura/PADRAO-VISUAL.md` |

## O que o checker automatizado exige

**Arquivo:** `scripts/verificar-padrao-pagina.py`
**Escopo:** as 100 rotas de `apps/web/data/top-100-paginas.json`.

⚠️ **Status (medido em 2026-10-13): implementado.** O script roda na CI
(`.github/workflows/padrao-pagina.yml`, em push para `main` com mudança em
`apps/web/**`) e no vigia do servidor.

Ele faz auditoria **estática** (lê `page.tsx`, sem subir o servidor) e marca
cada rota:

| Verificação | Sinal procurado no código |
|---|---|
| A rota resolve | arquivo da rota existe em `apps/web/app/…/page.tsx` **ou** é rota dinâmica (`[param]/`) |
| Tem seções | `SecaoWiki`, `h2` ou constante `SECOES*` |
| Tem "Nesta página" | `IndiceWiki` |
| Tem links relacionados | 2 = `LinksRelacionados` no rodapé; 1 = só bloco de links no topo (parcial) |
| Tem gráfico | `svg`, `Grafico*` ou `grafico*` |
| Tem fonte | marcação de fonte (`Fonte:`, `fonte oficial`, `ABNT`) |

Saída:

- ✅ relatório em `docs/relatorios-automacao/` (arquivo datado, com a
  situação rota a rota);
- ⛔ `exit 1` quando alguma rota do catálogo **não resolve** — aí a CI
  falha de verdade.

Limitação declarada, mesma honestidade do `auditar-seis-qualidades.py`:
auditoria estática por palavra-chave. **"não achou" ≠ "não existe"** — o
recurso pode morar num componente importado de outro diretório. Marca o
caminho, o humano confere.

## Decisões registradas

- **2026-10-13 — guia único do padrão de página:** este arquivo passa a
  ser a régua das páginas novas e das 100 rotas do catálogo; o
  `PADRAO-VISUAL.md` continua cuidando de regra de ouro, cores e
  componentes visuais. Os dois se complementam, não duplicam.
- **2026-10-13 — montagem automática pendente:** o sumário do rodapé já é
  automático pelo layout raiz; os capítulos laterais ainda são montados
  pela página (`MiniSumarioLateral`). A meta é automatizar os dois e
  fechar o sumário por padrão.
