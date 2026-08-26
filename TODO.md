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

- **As 4 trilhas paralelas de 22/08 — MESCLADAS em `main` (local, sem
  push ainda).** Rodaram simultâneas via workflow (4 agentes, 466 chamadas de
  ferramenta, 0 erro), cada uma na própria branch, depois mescladas uma a uma
  com `git merge --no-ff` (dois conflitos, os dois no padrão já documentado
  em `docs/DESENVOLVIMENTO.md` — `.gitignore`/`launch.json`: manter as duas
  entradas; `docs/ESTADO.md`: reconciliado à mão, mantendo a versão mais
  completa e atualizando o número para o real). `npm test` na `main`
  mescladada achou 1 falha real (não de lógica): timeout do teste do Ollama
  curto demais pro cold-start que o próprio `ollama.ts` já documentava —
  corrigido (`92dd276`). **Estado final: 1036 vitest + 141 globo, 0 falhas;
  `tsc --noEmit` limpo.**

  · **`diario-oficial`** (5 commits, o último de um chip rodando em paralelo
  — ver abaixo) — coletor `etl/betim/etl/camaras/sigpub.py` + classificador
  portado pra Python. ✅ O conflito dos dois relatos do mecanismo se
  resolveu: a migration `0077` estava certa (GET + sessão + token CSRF
  reutilizável); o relato de 11/08 errava nome de campo e filtro, não
  mecanismo. ⚠️ Corrigiu a `0077` num ponto: `pagina` nunca vem preenchida,
  só `edicao`. Medido ao vivo: 196 matérias da Prefeitura (id 905) + 11 da
  Câmara (id 21672) só em julho/2026. ✅ **Backfill decidido: desde
  01/2020** ("penúltima gestão municipal") — ainda não executado (precisa de
  banco; coleta de horas, não minutos). ✅ **Gap do classificador fechado
  pelo chip `task_f4a38f90`**: "outro" caiu de 16% (32/196) para 5,6%
  (11/196) — fixture cresceu para 75 títulos reais. **Pendência real:**
  migration `0079` (ids de entidade) nunca aplicada em banco nenhum;
  `_gravar_atos()` nunca gravou uma linha de verdade.
  · **Proposta nova registrada**: `docs/planos/diario-oficial-plano.md`
  ganhou uma seção inteira ("Proposta") sobre o que estruturar além dos 7
  tipos — encadear processo/contrato pelos aditivos, dispensa/inexigibilidade
  como subtipo, buracos na numeração sequencial, concentração de fornecedor,
  subtipo de pessoal, ritmo temporal do mandato, comparação entre cidades —
  com exemplo real de título para cada eixo. Nada implementado ainda.

  · **`cabecalho-zonas`** (9 commits) — Paraopeba ganhou `layout.tsx` de zona
  de verdade (⚠️ tem **11 subpáginas**, não 9 como esta mesma entrada dizia
  antes — corrigido pelo próprio agente, achado durante o trabalho, não
  suposição). Terras **não** ganhou `layout.tsx` — ganhou um componente manual
  (`Cabecalho.tsx`) importado nas 3 páginas, porque o `/mapa` (globo 3D com
  HUD) colidiria. **O conflito com o HUD foi medido, não suposto**: o HUD roda
  isolado dentro do `<iframe>` do globo, e um cabeçalho de portal mais alto só
  encolhe a caixa do iframe — confirmado 9 painéis do HUD intactos, 12px de
  margem, zero corte. De quebra corrigiu um `<main>` sem `id`/`tabIndex` em
  `/paraopeba/pericia` (único das 12 rotas sem isso) e um bug real de sintaxe
  JSX que quebrava aquela rota com 500 (achado rodando o servidor de verdade,
  não só por `tsc`).

  · **`home-orientacao`** (2 commits) — linha acima do grid, contraste medido
  nos 3 temas (7,08:1 claro / 8,30:1 escuro / 21:1 alto-contraste — todos
  acima do piso de 7:1).

  · **`chatbot-poc`** (1 commit) — `apps/web/lib/assistente/embeddings/`
  (Ollama local, chunking, similaridade de cosseno), testado ao vivo sobre
  4 normas reais já no repo (`etl/betim/dados/legislacao-mma.json`, sobre a
  barragem de Fundão): 3 de 4 perguntas acertaram o trecho certo por
  similaridade; a 4ª ("qual norma foi revogada?") **não** acertou — achado
  honesto, documentado no código, fora das asserções: busca semântica não
  substitui casamento de palavra-chave. **Achado de segurança relevante:** a
  guarda de dado pessoal (`checar-dado-pessoal-em-dado.py`) não cobre
  `etl/betim/dados/` — só `apps/web/data/` e `docs/dados/` — chip
  `task_dae5f906` já rodando (1 commit até agora, numa branch própria,
  `claude/strange-rosalind-9d4f9b`, ainda não revisada nem mesclada aqui).

  · **Os dois chips continuam rodando em sessões independentes** — não fazem
  parte deste merge. Quando terminarem: `task_f4a38f90` já mesclado (seu
  commit ficou na própria branch `diario-oficial`, que subiu junto);
  `task_dae5f906` segue em `claude/strange-rosalind-9d4f9b`, à parte.

## Esperando data

- **Neon volta em 2026-09-01** (HTTP 402 até lá; sem banco não há `next build` na
  máquina de dev). Trava: migrations 0071–0077, **carga das 8.570 normas federais
  do MMA + 370 do CNDH (já feitas no Postgres local em 26/08)**, auditoria dos
  25.729 links, backfill de temas (100 de 10.317), **e o B4 (PNCP, contratos
  estaduais de MG)** — o coletor escreve no banco.
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
