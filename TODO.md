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

- **Perícia UFMG × Auditoria AECOM** — os 7 documentos do `node/582` estão todos
  em `cruzado`; falta a síntese final. **4 marcados para revisão humana** e
  entram na página com aviso.
  · retomar: `python X:/DevCoder/_lote-ambiental/analise/estado.py` (ele imprime
  o próximo comando)
  · worktree: `.claude/worktrees/cp-ambiental-estudos` · plano:
  `Projetos/Controle Popular — Perícia UFMG × Auditoria (Executable Plan).md`

- **Expansão: acordos, contratos e convênios de MG** — Blocos 0, A e metade do
  B entregues. No ar: `/ambiental/tac` (execução financeira dos TACs + cadastro
  GTAC) e `/ambiental/convenios` (convênios ambientais estaduais + régua
  federal do Transferegov).
  · **próximo:** B6 (coletor das decisões da CGE — a sondagem já está feita, ver
  abaixo), B7 (TACs do MPMG, exige OCR), B8 (DataJud TJMG).
  · **B4 (PNCP) saiu da fila: não é "custo baixo", é bloqueado.** O coletor
  existente (`etl/betim/etl/pncp/contratos.py`) grava via
  `get_supabase_client()`, e a Neon está em 402 — ver "Esperando data".
  · armadilhas de cada fonte já registradas em `docs/FONTES.md` — ler antes de
  tocar em qualquer uma delas.
  · worktree: nenhum (feito no checkout principal) · plano em
  `.claude/plans/joyful-gathering-willow.md` (fora do repo, no perfil)

- **B6 — decisões de recurso da CGE: sondado, coletor por escrever.** 753
  decisões (2020–2026), sem login e sem captcha, mas é WebForms: cada POST exige
  o `__VIEWSTATE` de um GET anterior. Tabela por ano e tipo em `docs/FONTES.md`.
  · **corrige o plano:** eu havia escrito que filtrar por *Provimento* daria "o
  mapa das negativas indevidas". São **16 casos em 7 anos** — servem de exemplo,
  não de base estatística. O que domina é *Não conhecimento* (265).
  · antes de publicar qualquer total por tipo: em 2022–2025 a soma dos tipos não
  fecha com o total do ano, e ninguém investigou por quê.

- **Pedido de LAI à CGE-MG — redigido, falta protocolar.** O
  `ft_convenio_metaetapa` do conjunto `convenios-saida` sai com **só o
  cabeçalho**: 87 bytes comprimidos, 75 descomprimidos, 1 linha. No mesmo
  conjunto e no mesmo minuto, um recurso irmão devolveu 784.802 linhas — o que
  elimina a resposta "problema na sua conexão". Sem essa tabela dá para dizer
  quanto um convênio custou e quanto demorou, **não** se ele entregou o que
  prometeu.
  · texto pronto: `Projetos/Controle Popular — Pedido LAI CGE-MG (metas de
  convênio).md`, no vault
  · depois de protocolar, registrar em `docs/LAI-PROTOCOLOS.json` — aí a CI
  diária passa a vigiar o prazo sozinha

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
