# Plano — Biblioteca unificada de documentos dos crimes socioambientais de Mariana e Brumadinho

> **Tipo:** PLANO
> **Domínio:** ambiental/paraopeba
> **Última medição:** 2026-08-31
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [FONTES.md](../06-fontes/FONTES.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [PRODUTO.md](../01-produto/PRODUTO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** biblioteca, desastres, mariana, brumadinho, paraopeba, doce, atis, documentos, filtros, busca, coletores, noticias, atingidos, bahia, espirito santo

## Sumário

- [Propósito](#propósito)
- [Decisões do dono registradas](#decisões-do-dono-registradas)
- [Modelo de dado unificado](#modelo-de-dado-unificado)
- [Coletores da fase 1](#coletores-da-fase-1)
- [A página /ambiental/crimes-socioambientais](#a-página-ambientalcrimes-socioambientais)
- [Absorção da rota /paraopeba/biblioteca](#absorção-da-rota-paraopebabiblioteca)
- [Regras editoriais específicas](#regras-editoriais-específicas)
- [Fases de execução](#fases-de-execução)
- [Verificação](#verificação)
- [Riscos](#riscos)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## Propósito

Uma biblioteca única de documentos oficiais (metadado + link, **nunca o arquivo**
— regra já decidida no repo: Lei 9.610/98, "linkar, não copiar") dos dois
desastres de barragens de rejeitos, coletada de bibliotecas de órgãos federais,
estaduais (MG, ES, BA), instituições de justiça e ATIs — com busca, tags,
filtros e ordenação. A página **absorve** a atual `/paraopeba/biblioteca`
(597 itens AEDAS/Guaicuy/ADAI), que passa a ser recorte dela.

Não é uma página nova de "notícia": é o acervo documental que sustenta qualquer
alegação sobre reparação — decisão, laudo, resolução, termo — publicado por
quem é parte ou autoridade no caso.

## Decisões do dono registradas

1. **Absorver** a biblioteca das ATIs do Paraopeba; na abertura a biblioteca
   mostra só o **desastre em foco**, e o leitor amplia clicando na tag do outro
   caso.
2. **ES + BA no escopo.** ES entra por ser bacia atingida do Doce (IEMA, AGERH,
   MPES, TJES). BA entra principalmente por **notícias** — pedido do dono em
   31/08/2026: "recentemente teve reconhecimento de atingidos da Bahia e tem
   mais notícias disso". Documental da BA fica em fase 2, guiado pelo que as
   notícias revelarem.
3. Fase 1 = **4 coletores piloto** + 1 coletor de notícias.
4. Rota: **`/ambiental/crimes-socioambientais`**.

## Modelo de dado unificado

Item normalizado do acervo:

```ts
interface ItemDesastre {
  id: string;                  // fonteId + slug
  desastre: "mariana" | "brumadinho";
  bacia: "doce" | "paraopeba";
  titulo: string;
  data: string | null;         // ISO yyyy-mm-dd; null = a fonte não publicou
  tipo: string;                // rótulo do tipo como a fonte o nomeia
  orgao: string;               // nome curto do órgão/instituição
  esfera: "federal" | "estadual" | "justica" | "ati" | "imprensa";
  uf: "MG" | "ES" | "BA" | "BR";
  tags: string[];
  resumo: string | null;       // descrição publicada pela PRÓPRIA fonte; nunca gerado
  url: string;                 // página do item na fonte — nunca o PDF
  fonteId: string;             // slug da fonte no registry
  coletadoEm: string;
}
```

- **Absorção:** o agregador consome o `apps/web/public/data/biblioteca-ati.json`
  existente, marca `desastre: "brumadinho"`, `bacia: "paraopeba"`,
  `esfera: "ati"` e funde com as demais fontes por `fonteId` — fusão idempotente,
  coleta vazia não sobrescreve o arquivo bom (padrão medido em
  `coletar-biblioteca-ati.py`).

  ⚠️ **ATIs existem nos DOIS desastres.** O `biblioteca-ati.json` existente
  cobre só o **programa Paraopeba** (AEDAS/Guaicuy/ADAI/NACAB na bacia do
  Paraopeba = Brumadinho) — por isso o mapeamento para `desastre: "brumadinho"`
  está correto. **Mariana tem as próprias ATIs** — Cáritas, CTA (Centro de
  Tecnologia Alternativa) e também AEDAS/ADAI no programa do Rio Doce —, que
  são **fonte nova** para a biblioteca com `desastre: "mariana"`. O coletor
  delas grava `etl/betim/dados/desastres/ati-mariana.json` (schema normalizado),
  que o agregador já consome sem mudança de código.
- **Lacuna é informação:** o arquivo carrega `ficouDeFora` por fonte, exibido na
  tela — fonte que respondeu menos que o previsto é declaração, não silêncio.
- **Resumo:** só metadescription/descrição publicada pela fonte. Nenhum resumo
  gerado por modelo sem rótulo (regra: "o número vem do dado; o modelo, se
  houver, só embrulha").
- **Camada:** `apps/web/public/data/biblioteca-desastres.json` (asset buscado
  pelo cliente, padrão `PainelTac.tsx`), com entrada no
  `outputFileTracingExcludes` do `next.config.ts` — o único mecanismo que tira o
  arquivo do bundle do Worker (ARQUITETURA.md). Fonte de verdade por fonte em
  `etl/betim/dados/desastres/*.json`, unificada por
  `scripts/agregar-biblioteca-desastres.mts`.
- **Agregado de servidor:** `COBERTURA_BIBLIOTECA_DESASTRES` (total, por
  desastre, por esfera, por fonte, barradosPelaTriagem, ficouDeFora,
  coletadoEm) — a página servidor importa só ele, nunca o array.

## Coletores da fase 1

Todos no padrão do repo (FONTES.md + OPERACAO.md): cabeçalho-doc com robots.txt
e decisão registrada, UA honesto `ControlePopular/1.0 (+https://controlepopular.com.br)`,
pausa 1–2 s por host, 429/503 param a coleta, validar **conteúdo** nunca só
status, `--seco`, trava de CPF no serializado antes de gravar, saída de
metadado + link.

| # | Coletor | Fontes-alvo | Desastre | Esfera |
|---|---|---|---|---|
| 1 | `coletar-biblioteca-cif-mariana.*` | CIF (Comitê Interfederativo) do Acordo de Mariana — resoluções e documentos | mariana | federal (tripartite) |
| 2 | `coletar-documentos-mpf.*` | MPF — casos Samarco/Fundão e Brumadinho | ambos | justica |
| 3 | `coletar-biblioteca-mg.*` | SEMAD/IGAM/FEAM (relatórios, fiscalização) + CGE-MG (sem duplicar `/ambiental/decisoes-lai`) | ambos | estadual |
| 4 | `coletar-biblioteca-es.*` | IEMA-ES, AGERH, MPES, TJES — bacia do Doce | mariana | estadual + justica |
| 5 | `coletar-noticias-desastres.py` | Radar: título, fonte, data de publicação, microresumo (metadescription da matéria), link — padrão `coletar-noticias-paraopeba.py`, nunca o corpo. Buscas: "atingidos Bahia" (prioridade), Mariana, Brumadinho | ambos | imprensa |
| 6 | `coletar-biblioteca-ati-mariana.*` | ATIs de Mariana — Cáritas, CTA, AEDAS/ADAI no programa do Rio Doce | mariana | ati |

Registro obrigatório ao fim de cada coletor: slug no `REGISTRY_FONTES`
(camada `public-assets`), entrada no `MAPA_SCRIPTS` do `rotina-coletas.mts`,
diretório de saída em `DIRETORIOS_DADO` do `checar-dado-pessoal-em-dado.py`
(coletor que grava JSON a cada rodada entra na lista) e seção em `FONTES.md`.

## A página /ambiental/crimes-socioambientais

Estrutura no padrão inviolável do repo — **server importa só `COBERTURA_*`**,
cliente recebe o array por fetch de asset:

- **page.tsx (servidor):** cartões de topo (total por desastre, por esfera, por
  fonte), gráfico SVG inline (evolução por ano; com alternativa em texto/tabela
  e textura, nunca só cor), aviso editorial "dois desastres, dois casos" no
  topo — Mariana (2015, Samarco/Vale/BHP, bacia do Doce, atingidos em MG e ES)
  e Brumadinho (2019, Vale, bacia do Paraopeba, MG) são casos distintos com
  responsáveis, acordos e processos diferentes.
- **`BibliotecaDesastresClient.tsx`:** busca full-text com `semAcento` de
  `lib/busca/normalizar.ts`; filtros por **desastre** (chips com contagem) —
  abertura com o desastre em foco: chega de `/paraopeba` → Brumadinho; de
  `/ambiental/mariana` → Mariana; entrada direta → os dois visíveis com selo de
  desastre em cada item; **clicar na tag do outro caso amplia** (decisão do
  dono). Filtros por esfera, órgão, tipo, ano, UF e tags; ordenação por coluna
  (`lib/tabela/ordenar.ts`); CSV do filtrado (`lib/tabela/csv.ts`, `;` + BOM
  UTF-8); paginação "Ver mais" (~40); mensagem explícita de vazio.
- **Notícias:** bloco "Radar" na mesma página (padrão `/paraopeba/clipping`),
  filtrado pelo mesmo seletor de desastre.
- Se o acervo unificado passar de ~10 mil itens: migrar para índice fatiado
  (`lib/estatico/fatiar.ts` + `emitir.ts` + `TabelaEstatica`). Até lá, asset +
  fetch (padrão `PainelTac`).

## Absorção da rota /paraopeba/biblioteca

- O arquivo `biblioteca-ati.json` e `lib/paraopeba/biblioteca.ts` **continuam
  como estão** (outras telas da frente dependem deles); o agregador da
  biblioteca unificada lê o mesmo arquivo — **a absorção é de dado
  compartilhado, não de rota**.
- `/paraopeba/biblioteca` **segue contentful** (decisão de 01/09/2026, após o
  commit do remoto `74ef839` que ali indexou o acervo Pró-Brumadinho): é a
  biblioteca da frente Paraopeba (ATIs + acervo oficial do Acordo de
  Brumadinho). A biblioteca unificada em `/ambiental/crimes-socioambientais`
  cobre os DOIS desastres e inclui o mesmo acervo ATI como fonte. Não há
  duplicação de dado — as duas telas leem os mesmos arquivos.
- Decisão do dono "abrir com o desastre em foco e ampliar clicando no outro"
  vale para a biblioteca unificada (chips por caso); a página do Paraopeba
  mantém o filtro por ATI/acervo que já tinha.

## Regras editoriais específicas

- **Mariana ≠ Brumadinho:** selo de desastre colado a cada item; nenhum
  agregado mistura os dois sem rótulo (a regra da insinuação, AGENTS.md §"A
  regra editorial").
- **"Crime":** a página descreve o que os autos dizem (há ações penais), sem
  afirmar condenação que não exista.
- Número vem do dado; `ficouDeFora` e `barradosPelaTriagem` (régua de dado
  pessoal do build) entram nas coberturas — item barrado não é publicado nem em
  título.
- Link só para a página do item; PDF apenas se a fonte declarar licença aberta.

## Fases de execução

- **Fase 0:** schema + agregador + página com absorção dos 597 itens das ATIs +
  coletor #5 (notícias) → primeira versão no ar, sem coletores novos.
- **Fase 1:** coletores 1–4, um a um (descoberta de endpoint → cabeçalho-doc →
  `--seco` → gravação → varredura de dado pessoal → commit por pathspec).
- **Fase 2:** `REGISTRY_FONTES`, `FONTES.md`, `ESTADO.md` atualizados.
- **Fase 3 (futuro):** BA documental (INEMA/MPBA/TJBA), Renova/Fundação Renova,
  ANM, CGU/TCU, Defensorias, comitês de bacia do Doce.

## Verificação

`npm test` (suíte + `sem-cpf-no-repo.test.ts`), `npx tsc --noEmit`,
`python scripts/checar-dado-pessoal-em-dado.py`,
`python scripts/validar-documentacao.py`, build no home-pc (Neon 402 não
bloqueia: dado é de arquivo). Coletores fora da CI; rotina local ou
`rotina-coletas.mts --fonte`.

## Riscos

- Fontes sem API (sites estáticos/WordPress — resolver com sitemap/wp-json,
  armadilhas já mapeadas em `coletar-biblioteca-ati.py`).
- robots.txt restritivo (precedente FGV documentado em FONTES.md).
- PDFs com CPF (varredura fail-closed; espelho só via DocVault/R2, fora do repo).
- Volumetria: medir com `--seco` antes de decidir asset vs. índice fatiado.
- CIF (cif.org.br) estava inacessível na sondagem de 31/08/2026 — o coletor 1
  precisa de re-sondagem antes de escrever o cabeçalho-doc.

## Decisões registradas

1. Biblioteca unificada absorve o DADO das ATIs; `/paraopeba/biblioteca` segue
   contentful (ver seção "Absorção da rota") — absorção de dado, não de rota.
2. Abertura da biblioteca mostra o desastre em foco; ampliar clicando na tag do
   outro caso (dono, 31/08/2026).
3. ES + BA no escopo; BA por notícias na fase 1 (dono, 31/08/2026).
4. Metadado + link, nunca o arquivo — mesmo veredito da biblioteca das ATIs
   (Lei 9.610/98, direitos reservados sem licença declarada).
5. `desastre` é campo obrigatório do item — dois casos não se misturam sem
   rótulo.
6. ATIs existem nos dois desastres: o acervo ATI existente é do programa
   Paraopeba (Brumadinho); as ATIs de Mariana (Cáritas, CTA, AEDAS/ADAI no
   Doce) são fonte nova com `desastre: "mariana"` (correção do dono, 01/09/2026).

## Origem

Escrito em 31/08/2026 na sessão que criou a rota `/ambiental/crimes-socioambientais`.
Absorve a decisão de `/paraopeba/biblioteca` (597 itens) e o pedido do dono de
radar de notícias sobre reconhecimento de atingidos na Bahia. Sem arquivo
anterior absorvido.
