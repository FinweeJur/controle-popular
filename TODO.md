# TODO — uma linha por trilha viva

> **Para que serve:** este arquivo é o ponto de encontro entre sessões. Mais de
> uma sessão trabalha neste repo ao mesmo tempo, cada uma no seu worktree
> (`docs/DESENVOLVIMENTO.md`), e nenhuma enxerga a conversa da outra. Quem chega
> sem contexto lê **isto** primeiro para saber o que está em curso e onde
> retomar.
>
> **Regra:** quem abre uma trilha escreve a linha; quem fecha, apaga. É leve de
> propósito — o detalhe mora no ledger ou no plano da trilha, nunca aqui. Uma
> linha que só descreve, sem dizer onde retomar, não serve.
>
> **Não é changelog.** O que já foi entregue sai daqui; o histórico é o
> `git log`, e o estado do produto é `docs/ESTADO.md`.
>
> *(Criado em 2026-08-20. `docs/` e o plano da Perícia mandavam ler este arquivo
> desde 15/08, mas ele nunca existiu — `git log --all -- TODO.md` era vazio. Era
> justamente o artefato de handoff entre sessões que estava faltando.)*

---

## Em curso

- **Expansão ambiental de MG — MERGEADA na main** (PR #2, 2026-08-22). No ar:
  `/ambiental/decisoes` (43.444 decisões, 9.554 negativas), `/ambiental/tac`,
  `/ambiental/decisoes-lai`, `/ambiental/barragens/descaracterizacao`,
  `/paraopeba/analise`, e a **regra das cinco coisas** em 8 páginas.
  · **o que sobrou pendente, com motivo escrito:**
  · **PNCP** — coletor pronto, API devolveu 504 por ~45 min em 21/08. O arquivo
  tem `coletaPendente: true`. Retomar é só rodar `scripts/coletar-pncp-mg.mts`
  quando a API voltar.
  · **NACAB** — 48 publicações coletadas e **fora da biblioteca de propósito**:
  apontam para o `.pdf` direto e a biblioteca aponta para a *página* da fonte
  (`biblioteca.test.ts`). Falta a URL de página e uma data confiável.
  · **B7 (TACs do MPMG) está morto**, com medição: `buscarTac` responde 200 com
  0 byte. Não reabrir sem a fonte voltar.
  · **Painel Sisema** — 3 dos 4 relatórios extraídos; falta o de educação
  ambiental (`6db83fcd-58ec-4439-9e9e-dd83e9ba0b9a`).
  · `/ambiental/licenciamento` e `/copam` têm as cinco coisas no código mas
  renderizam vazio enquanto a Neon estiver em 402 — não é regressão.

- **Diário oficial D1 (SIGPub) — destravado em 22/08.** O corte de LGPD saiu:
  nomeação e exoneração **entram**; CPF, endereço e dado de saúde de pessoa
  física continuam fora (e as duas guardas automáticas barram de qualquer
  jeito). Migration `0077` e `lib/diario/classificarAto.ts` já estão prontos.
  · retomar: escrever o coletor SIGPub (Diamantina é a única confirmação limpa)
  · plano: `docs/planos/diario-oficial-plano.md` · Itinga ganhou fonte:
  `https://www.itinga.mg.gov.br/diario` (HTTP 200 medido em 22/08), falta
  declarar em `apps/web/lib/db/cidades-do-build.ts`

- ⚠️ **ETL da FGV apagado sem commit no checkout principal.**
  `etl/betim/etl/apis/__init__.py` e `fgv_paraopeba.py` estão como `D` no
  `git status`, e `.github/workflows/etl-betim.yml:359` ainda chama o módulo —
  commitar assim para a tela de Betim de atualizar. **Decidido em 22/08: o ETL
  continua vivo**, então isto é restauração, não decisão.
  · retomar: `git restore etl/betim/etl/apis/__init__.py etl/betim/etl/apis/fgv_paraopeba.py`

## Esperando data

- **Neon volta em 2026-09-01** (HTTP 402 até lá; sem banco não há `next build`).
  Trava: migrations 0071–0077, carga das 8.570 normas federais do MMA + 370 do
  CNDH, auditoria dos 25.729 links, backfill de temas (100 de 10.317), **e o B4
  (PNCP, contratos estaduais de MG)** — o coletor escreve no banco.
  · runbook pronto: `docs/planos/ROTEIRO-NEON-01-09.md`

- **LAI INCRA — prazo 2026-08-28** (protocolado, prorrogado por 10 dias). O
  número de protocolo ainda não foi anotado.
  · confere sozinho: `.github/workflows/prazos-lai.yml`, cron diário

## Esperando decisão do dono

**12 decisões saíram em 22/08** e estão registradas em `docs/ESTADO.md`, que
passou a ser o plano único — quem chega lê a fila de lá, não daqui. O que
sobrou sem resposta:

- **Licença da fonte *Icones do Brasil*** — 22 ícones já estão no repo
  (`BrasilIcon.tsx`) com licença não verificada; uso público pede autorização
  do autor ou troca de fonte.
- **Fundir `docs/ARQUITETURA.md` e `docs/MAPA-APLICACAO.md`** — e qual caminho
  sobrevive (quem sumir quebra `docs/LEIA-PRIMEIRO.md:27`).
- **Credenciamento no Conecta gov.br** (CNPJ/CEP) — item 16 da fila.
- **Resumo por modelo dos PDFs da AJRI** — decidir com os 10 primeiros PDFs
  medidos, não antes.
