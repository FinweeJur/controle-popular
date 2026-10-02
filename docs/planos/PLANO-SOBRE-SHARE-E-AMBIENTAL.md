# PLANO — /sobre, compartilhamento e unificação ambiental

> **Tipo:** PLANO
> **Domínio:** global (conteúdo institucional, metadados de compartilhamento e navegação ambiental)
> **Última medição:** 2026-10-02
> **Leitura estimada:** media
> **Relacionados:** [AGENTS.md](/AGENTS.md), [PENDENCIAS-02-10.md](PENDENCIAS-02-10.md), [PRODUTO.md](../01-produto/PRODUTO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md)
> **Palavras-chave:** sobre, ia, revisao, inspiracoes, referencias, codigo-nao-binario, eixos, subfrentes, og, compartilhamento, ambiental, car, licenciamento, tac, outorgas, eia-rima, barragens, brumadinho

## Sumário

- [Propósito](#propósito)
- [Item 1 — texto de IA e de revisão](#item-1--texto-de-ia-e-de-revisão)
- [Item 2 — "Inspirações e Referências"](#item-2--inspirações-e-referências)
- [Item 3 — de "6 frentes" para eixos e subfrentes](#item-3--de-6-frentes-para-eixos-e-subfrentes)
- [Item 4 — unificar a navegação da área ambiental estadual](#item-4--unificar-a-navegação-da-área-ambiental-estadual)
- [Item 5 — metadados de compartilhamento (OpenGraph)](#item-5--metadados-de-compartilhamento-opengraph)
- [Pontos a confirmar antes de executar](#pontos-a-confirmar-antes-de-executar)

## Propósito

Cinco mudanças na página `/sobre` e em pontos que ela governa (faixa de
aviso, compartilhamento) e um plano de navegação para a área ambiental
estadual. Nada aqui vai a deploy antes de tudo resolvido (ordem do dono,
02/10/2026).

## Item 1 — texto de IA e de revisão

Trocar o texto atual — *"Este portal usa inteligência artificial — e o portal
está em revisão"* e a lista de ferramentas (Claude Code, Kimi Code, ZaiCode) —
pelo texto do dono:

> Site em desenvolvimento, aberto para acesso, colaboração e revisão. Os dados
> ainda estão sendo conferidos e podem conter erros.
>
> O site foi feito com auxílio de Inteligência Artificial - IA, como modelos de
> linguagem como Deepseek, Mimo, Claude e ferramentas como OpenCode, entre
> outras.

Onde aparece (conferir cada um):

| Arquivo | Linha | O que tem hoje |
|---|---|---|
| `apps/web/app/sobre/page.tsx` | 110–124 | título + 1º parágrafo sobre IA e revisão |
| `apps/web/app/politica-de-ia/page.tsx` | 57–63 | "Este portal usa inteligência artificial para…" |
| `apps/web/app/components/FaixaDesenvolvimento.tsx` | 51–55 | faixa global "Site em desenvolvimento…" |

O título do card (`/sobre`) e a faixa mantêm `text-sm` (§5.10) e o par de
contraste `--cp-alert`.

## Item 2 — "Inspirações e Referências"

Card em `apps/web/app/sobre/page.tsx` (295–375). Mudanças:

1. **Posição:** mover para **depois do poema da Carolina Maria de Jesus**
   (hoje a epígrafe `carolina-mundo-modificar` está no `<header>`, linha 80).
2. **Apagar os 2 parágrafos** que hoje vêm logo abaixo da Carolina
   (⚠️ confirmar quais: candidatos são as linhas 65–78 ou o início da
   seção "O que é", 88–108).
3. **Renomear** o título: `De onde vem o nome — e a quem devemos` →
   **`Inspirações e Referências`** (linha 298).
4. **Remover** `É palavra de ordem de quem vive na bacia, não de quem assina o
   contrato.` (linhas 312–313).
5. **Remover** `A homenagem é reconhecimento, não filiação. O portal publica
   dado público e não fala em nome de movimento nenhum.` (linhas 370–371).
6. **Trocar** `Mas sem essas organizações ninguém teria cobrado transparência
   na água, na barragem e no licenciamento — e este portal não existiria.` por:
   *"Sem essas organizações cobrando por justiça e direitos nas florestas, nas
   águas, no campo, na cidade e nas redes, esse portal não existiria."*
7. **Acrescentar**, no 3º parágrafo, após "Movimento Brasil Popular", com
   hiperlink para o site oficial (https://codigonaobinario.org/):
   *"E a inspiração tecnológica hacker pra criar redes mais justas e tecnologia
   mais acessível veio da Código Não Binário, organização que bate de frente
   com as Big Techs quando é pra falar de IA."*

## Item 3 — de "6 frentes" para eixos e subfrentes

A home (`app/page.tsx`, via `lib/zonas.ts` + `SanfonaFrentes`) e o `/sobre`
ainda descrevem as **6 frentes antigas**. O portal hoje se organiza em **4
Grandes Eixos e mais de 36 subfrentes** (dado canônico em
`lib/eixos/catalogo.ts`, usado por `/central` e pelos hubs de eixo).

O que a página deve passar a fazer:

- Falar de **eixos e subfrentes**, não das 6 zonas.
- Dizer **que dado concreto** a pessoa alcança, com **links e botões** para as
  subfrentes (ex.: "Contratos e licitações →", "Licenciamento ambiental →",
  "Emendas e orçamento →").
- Fonte da lista de subfrentes: `lib/eixos/catalogo.ts` (não duplicar).

Arquivos: `apps/web/app/page.tsx`, `apps/web/lib/zonas.ts`,
`apps/web/app/components/SanfonaFrentes.tsx`, `apps/web/lib/eixos/catalogo.ts`.

## Item 4 — unificar a navegação da área ambiental estadual

**Problema:** a área ambiental de MG tem muitas telas profundas e afins, sem um
índice que junte: **CAR, Licenciamento, TACs, Outorgas, EIA-RIMA/Estudos,
Barragens, Acordos Ambientais e a Reparação Brumadinho**. Quem chega não sabe
por onde começar.

**Proposta:** um **guia/índice** na zona ambiental (ex.: `/ambiental` ou
`/ambiental/guia`) com cartões — um por assunto —, cada um com uma frase e o
**número medido** de registros, mais botões para as páginas atuais. Preservar
todas as páginas específicas atuais.

| Assunto | Rota atual (conferir) |
|---|---|
| CAR | `/ambiental/car` |
| Licenciamento | `/ambiental/licenciamento` |
| TACs | `/ambiental/tac` |
| Outorgas | `/ambiental/autorizacoes` (conferir) |
| EIA-RIMA / estudos | `/ambiental/estudos` (conferir) |
| Barragens | `/ambiental/barragens` |
| Acordos ambientais | `/ambiental/mariana` (repactuação) |
| Reparação Brumadinho | `/paraopeba` |

Entregáveis: (a) cartões de entrada com âncora; (b) remissão cruzada entre as
telas irmãs (ex.: licenciamento ↔ TAC ↔ barragem); (c) contagens medidas, não
digitadas. Sem apagar as páginas profundas.

## Item 5 — metadados de compartilhamento (OpenGraph)

Quando a URL é compartilhada (WhatsApp etc.), aparece a imagem da home e um
texto que fala das **6 frentes antigas**. Hoje em `app/layout.tsx`:
- `DEFAULT_DESCRIPTION` cita "203 cidades estratégicas, acordos de Mariana e
  Brumadinho, 7 órgãos de Justiça de MG e diários oficiais".
- `openGraph.images` / `twitter.images` usam `/capas/home-page.webp`
  (o desenho da home com as 6 frentes).

Mudanças: (a) reescrever a descrição para os 4 eixos e subfrentes; (b)
substituir a imagem por uma que reflita o portal atual. ⚠️ A imagem é um
arquivo estático — o dono precisa fornecer/gerar a arte nova (ou aprovamos uma
nova `home-page.webp`).

## Pontos a confirmar antes de executar

1. **Item 2.2:** quais são exatamente "os 2 parágrafos abaixo da Carolina" a
   apagar.
2. **Item 3:** confirmar que a "página das 6 frentes" é a home (e o `/sobre`),
   e não o `/central`.
3. **Item 4:** confirmar as rotas certas de **Outorgas** e **EIA-RIMA** e se o
   guia entra em `/ambiental` ou numa rota nova.
4. **Item 5:** quem fornece a nova imagem de compartilhamento.
