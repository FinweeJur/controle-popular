# 15/08/2026 — a promessa de procedência do eixo Judiciário

> **Tipo:** HISTORICO
> **Domínio:** judiciario
> **Última medição:** 2026-08-15
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, diario, descoberta

## Sumário

- [Propósito](#propósito)
- [O resumo em uma frase](#o-resumo-em-uma-frase)
- [1. O que foi medido](#1-o-que-foi-medido)
- [2. A decisão: implementar, e corrigir o excesso](#2-a-decisão-implementar-e-corrigir-o-excesso)
- [3. O que passou a existir](#3-o-que-passou-a-existir)
- [4. Verificação](#4-verificação)
- [5. Fora de escopo, deixado anotado](#5-fora-de-escopo-deixado-anotado)
- [Relacionados](#relacionados)

## Propósito

> Registro da decisão e do que foi medido. Mesmo padrão de > `docs/DIARIO-2026-08-13.md` §2, que é o precedente direto deste caso.

> Registro da decisão e do que foi medido. Mesmo padrão de
> `docs/DIARIO-2026-08-13.md` §2, que é o precedente direto deste caso.

## O resumo em uma frase

`/judiciario/sobre` prometia um **grafo** que não existe e **link de fonte em
cada página** que nenhuma página tinha; a promessa do grafo foi retirada
(não havia o que construir), a promessa do link foi **cumprida**, e a
correção ficou na tela, com data.

---

## 1. O que foi medido

A rodada de 15/08 apontou duas afirmações em `apps/web/app/judiciario/sobre/page.tsx`.
As duas se confirmaram, e a varredura achou **uma terceira página** que a
medição original não tinha visto:

| Onde | O que afirmava | Situação |
|---|---|---|
| `app/judiciario/sobre/page.tsx` | "monta o **grafo** de poder de indicação" | Falso — é contagem exibida como lista |
| `app/judiciario/sobre/page.tsx` | "com link para a fonte **em cada página**" | Falso — nenhuma página tinha |
| `app/judiciario/page.tsx` (home do eixo) | "com link para conferir na fonte **em cada página**" | Falso — **não estava na lista de achados** |
| `app/judiciario/metodologia/page.tsx` | "que qualquer pessoa pode conferir **clicando**" | Falso — não havia o que clicar |

Eram **três** páginas fazendo a mesma promessa, cada uma com sua redação. A
terceira e a quarta só apareceram porque a busca foi pelo *comportamento*
prometido, não pela frase que o relatório citava.

**O grafo.** Não existe, e nunca existiu. O que há é `agregarPoder` em
`apps/web/lib/judiciario/agregado.ts` — contagem por autoridade nomeante —
renderizada como lista em `app/judiciario/tribunais/[sigla]/page.tsx`. Não há
nenhum componente de visualização de rede em `app/judiciario` nem em
`lib/judiciario`.

**O link de fonte.** `app/judiciario/components/DataCard.tsx` tinha o botão de
fonte e **nunca foi importado por tela nenhuma** do eixo. Era cópia do card de
Betim: o texto de compartilhamento ainda dizia `Controle Popular Betim`. E
`nomeacoes.url_fonte`, que existe no tipo desde a F2 e é **gravado pelo ETL**
(`etl/judiciario/etl/senado/indicacoes.py`, a partir de `urlDocumento`), não
era renderizado em lugar nenhum.

**O número que decidiu a forma da correção:** no corpus de descoberta F0
(`docs/judiciario/f0-corpus-indicacoes.json`, varredura 2003–2026), das **130**
indicações judiciais apenas **35 têm `urlDocumento`** — 27%. O Senado publica o
documento na minoria dos processos. Isso significa que *nenhuma* redação do
tipo "toda indicação tem link" seria verdadeira, mesmo depois de implementar.

---

## 2. A decisão: implementar, e corrigir o excesso

O enunciado oferecia duas saídas — corrigir o texto **ou** implementar o que ele
promete. A escolha foi **implementar a promessa no nível em que ela foi feita
(por página) e corrigir o texto onde a promessa passava do que o dado sustenta
(por dado)**.

Por que não só apagar as três frases: elas são o compromisso que faz o portal
valer alguma coisa, e o compromisso era ~90% viável com dado que **já estava no
banco e já vinha na query**. Retirar teria sido barato e teria empobrecido o
produto para esconder uma dívida de três linhas de JSX.

Por que não usar o `DataCard`, como o enunciado sugeria: o eixo /congresso **já
tinha aposentado a mesma cópia** desse componente, trocando-a por uma linha
`Fonte: … ↗` — está comentado em `app/congresso/votacoes/page.tsx`. Reanimar o
DataCard aqui seria inventar um padrão contra o que a casa já decidiu. O
`DataCard` do Judiciário foi **removido**: código morto que fazia uma afirmação
falsa parecer sustentada.

---

## 3. O que passou a existir

- **`app/judiciario/components/FonteRodape.tsx`** — crédito de fonte, no formato
  que o /congresso adotou. Está nas **seis** páginas que exibem dado: home,
  `/tribunais`, `/tribunais/[sigla]`, `/vagas`, `/indicacoes`, `/metodologia`.
- **`url_fonte` renderizado** como "documento no Senado ↗" em `/indicacoes` e na
  seção de indicações da página do tribunal. O dado já existia; faltava a tela.
- **`fonte_curadoria` passou a ser lido** (`lib/db/queries/judiciario.ts`, uma
  coluna a mais no `select` existente — sem query nova, sem egress novo). É
  gravado por `etl/composicao.py` desde a migration 0008 e nunca havia sido
  usado. Agora credita a origem real da composição de cada tribunal.
- **`lib/judiciario/procedencia.ts` + teste** — a frase de cobertura e a decisão
  "isto é URL ou é texto?" saíram do `page.tsx` para onde o vitest alcança
  (`include` é `lib/**/*.test.ts`). 11 testes.
- **Correção pública e datada** em `/judiciario/sobre`, no padrão de 13/08.

### As duas armadilhas que a implementação evitou

1. **Número escrito à mão.** "35 de 130" **não** foi digitado na tela: a frase é
   derivada da lista renderizada (`resumoProcedencia`). Um número fixo
   envelheceria errado na primeira execução do ETL. Regra herdada do
   /congresso, escrita em `etl/judiciario/etl/senado/indicacoes.py`.
2. **Link de fonte inventado.** Nem todo `fonte_curadoria` é URL — o do STJ é
   `"stj.jus.br — Composição do STJ (PDF…)"`. Sem guarda, viraria
   `href="stj.jus.br — …"`, que o navegador resolve como caminho **relativo ao
   próprio portal**: um link com cara de fonte oficial apontando para dentro de
   casa. Fonte sem URL vira texto. Coberto por teste.

---

## 4. Verificação

- `tsc --noEmit`: limpo.
- `vitest run`: **398 testes, 30 arquivos, todos passando** (eram 387 antes; 11 novos).
- As **11 rotas** do eixo servidas em dev: HTTP 200, sem erro de servidor, e o
  rodapé de fonte presente e correto em cada uma — o TSE e a 2ª instância
  corretamente **sem** o Senado, porque a nomeação deles não passa por lá.
- Um defeito de renderização foi achado e corrigido no processo: o espaço depois
  de `</strong>` e `</em>` era comido na compilação e saía `2026.Até` e
  `grafode` na tela. **Medido no DOM** (`innerHTML`), não suposto — a extração de
  texto e o DOM concordaram, e o `{" "}` explícito resolveu.

**O que NÃO foi verificado, e por quê:** o worktree não tem `.env.local`, então
não há banco e as listas vêm vazias. O caminho *com dado* — a linha com o link
do Senado, o crédito de composição por tribunal — não foi visto em tela contra
linhas reais. Foi coberto por teste unitário sobre as strings reais do ETL, e a
Neon está em 402 (egress), então ligar o banco custaria o que este repo
justamente evita. **Vale um olhar na primeira execução com banco.**

---

## 5. Fora de escopo, deixado anotado

- `app/congresso/components/DataCard.tsx` é a **mesma cópia morta**, também não
  importada por nenhuma tela. Não foi tocada — é outro eixo.
- `app/judiciario/layout.tsx` tem 28 erros de lint (`no-html-link-for-pages`) e
  a página do tribunal tem 1 aviso de import não usado. **Todos pré-existentes**:
  medidos idênticos em `main`, antes de qualquer mudança desta entrega.
- `docs/ROTEIROS-REDES-SOCIAIS.md` traz a tabela de achados que originou isto,
  mas vive na branch `cp-redes-sociais` e não em `main` — a linha do Judiciário
  daquela tabela **fica pendente de atualização quando as duas se encontrarem**.

---

## Relacionados

`docs/DIARIO-2026-08-13.md` §2 (o precedente: procedência falsa em
`/ambiental/direito-critico`) · `apps/web/app/sobre/page.tsx` (onde aquela
correção foi admitida em público) · `docs/ROTEIROS-REDES-SOCIAIS.md`, seção
"O que convém corrigir no portal ANTES de gravar"
