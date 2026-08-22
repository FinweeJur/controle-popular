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

Nada aqui avança sem resposta. Ver o Bloco D do plano da expansão.

- **Chatbot / degrau 3 do assistente** — 3 decisões (região do cérebro, qual
  acervo entra, ressalva de IA). Travam **dois** planos que descrevem a mesma
  coisa: `docs/planos/PLANO-CHATBOT-IA.md` e o degrau 3 do
  `PLANO-INDICE-ESTATICO-E-ASSISTENTE.md`.
- **Corte de LGPD do diário oficial** — migration e classificador prontos; o
  coletor não sai sem isso (`docs/planos/diario-oficial-plano.md`).
- **Protocolar o pedido ao TCE-MG** — texto pronto e sem protocolo desde 07/08
  (`Projetos/Controle Popular — Pedido Ouvidoria TCE-MG (dados abertos).md`).
- **Cabeçalho de Terras e Paraopeba; hierarquia da home** —
  `docs/planos/REVISAO-UX-E-ONBOARDING.md`.
