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

- **Expansão: acordos, contratos e convênios de MG** — Blocos 0 e A entregues
  (`509df09`, `f51558e`, `d9297ab`). Próximo: Bloco B, começando pelo dinheiro — coletor CKAN
  do `dados.mg.gov.br` (`convenios-saida`, que tem `Convênio - Meta Etapa`).
  · atenção: `dados.mg.gov.br` devolve **403 sem User-Agent de navegador**, e o
  DataStore do CKAN responde `success: true` com `total: 0` — baixar os CSV
  direto.
  · worktree: ainda não aberto · plano:
  `C:\Users\teste\.claude\plans\joyful-gathering-willow.md`

## Esperando data

- **Neon volta em 2026-09-01** (HTTP 402 até lá; sem banco não há `next build`).
  Trava: migrations 0071–0077, carga das 8.570 normas federais do MMA + 370 do
  CNDH, auditoria dos 25.729 links, backfill de temas (100 de 10.317).
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
