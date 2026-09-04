> **Tipo:** PROMPT
> **Domínio:** global
> **Última medição:** 2026-09-02
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [README dos planos](../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** prompt delegacao gemini, documentacao
PROMPT DE DELEGAÇÃO PARA O GEMINI/ANTIGRAVITY — 02/09/2026, 18:47

CONTEXTO

Você é o agente de execução do Controle Popular (repo FinweeJur/controle-popular,
nesta máquina Windows, checkout em C:\DevCoder\controle-popular). O agente jcode
(deepseek) atua como planejador e verificador; você executa o código. O dono é
Artur e acompanha pelo Telegram.

O repositório tem hoje dois checkouts em jogo:
1. O checkout principal (C:\DevCoder\controle-popular), onde você (Gemini/
   Antigravity) tem commitado direto no branch main local — inclusive commits
   que ainda não subiram para o GitHub (origin/main).
2. O worktree limpo C:\DevCoder\controle-popular\.claude\worktrees\github-docs,
   usado para publicar com segurança no origin/main.

ESTADO ATUAL (medido 18:40)

- Origin/main está em 1bd0211 (fila com g1 em andamento) e depois recebeu
  8d8f26b (fila com g4/g5) — confirme com git fetch.
- O main local tem commits seus ainda não publicados, incluindo:
  - a24c081 — Onda 1 (schema lugares/dialogos, PainelDialogo, rotas Nossos,
    BlocoPovoGente, Diamantina × Biribiri);
  - a5273fe — expansão de diálogos para 6 cidades + capitais do Sudeste;
  - b897dcd — subfrentes Nossos Animais e Nossa Gente;
  - b5d1f96 — relatórios CIDH/ONU/CNDH e conselhos sociais;
  - ade72c9 — ações climáticas JUMA, SIRENEJud/CNJ, jurisprudência TJMG;
  - c34364a — conselhos, litígios ambientais e direitos humanos na página
    municipal;
  - 0068073 — ouvinte de comandos Telegram para o Gemini.
- O dono relatou que você está corrigindo conflito entre commit local e GitHub
  (worktrees etc.). Se for o caso, conclua essa correção primeiro.

REGRAS DO REPO (obrigatórias)

- Nunca use --force no main.
- Commit com pathspec explícito (só os arquivos da sua tarefa); não arraste
  staging de outra sessão.
- Mensagem de commit com -F, sem acento, com trailer:
  Co-Authored-By: Jcode <jcode@local>
  Modelo: jcode - deepseek v4 flash
  (você pode adicionar seu próprio trailer Gemini/Antigravity junto).
- Rode npx tsc --noEmit e npm test antes de publicar.
- Nunca coloque dado pessoal, segredo ou protocolo LAI em commit.
- Para publicar no GitHub: prefira o worktree limpo github-docs (fetch +
  rebase origin/main + cherry-pick dos commits validados + push HEAD:main),
  ou o fluxo que você já usa, desde que sem --force.

TAREFAS (em ordem de prioridade)

TAREFA 1 — Resolver o conflito de publicação
- Objetivo: origin/main deve conter todo o trabalho bom que está no main
  local, sem perder nada e sem conflito futuro.
- Passos sugeridos:
  1. git fetch origin.
  2. Compare main local × origin/main (git log --oneline origin/main..HEAD).
  3. Identifique o que é trabalho seu/do projeto (Onda 1 + integrações) e o
     que é ruído (CRLF etc.).
  4. Publique no origin/main via worktree limpo ou rebase seguro.
  5. Confirme com git log origin/main -5 e avise o dono no Telegram
     (mensagem curta: o que subiu).
- Critério de pronto: origin/main contém a Onda 1 e as integrações; dono
  consegue ver as páginas novas no site depois do build.

TAREFA 2 — Revisar a Onda 1
- Rode npm test completo e npx tsc --noEmit no repo.
- Confira o link das pontes (nenhuma rota 404): as rotas destino dos diálogos
  em lib/dialogos.ts devem existir.
- Confira se as páginas novas renderizam (se houver dev server local, abra;
  senão, valide por código + testes).
- Corrija o que quebrar.
- Critério de pronto: testes verdes, tsc limpo, nenhuma ponte quebrada.

TAREFA 3 — Integração de direitos humanos (relatórios internacionais)
- O pedido do dono (via /gemini): procurar e baixar relatórios temáticos do
  CIDH, PIDESCA, Direitos Humanos ONU, combate à tortura, povos indígenas e
  afrodescendentes sobre Brasil e América Latina; usar os dados na integração
  visual cruzando por cidade/estado/país, junto com os relatórios do CNDH já
  baixados e demais conselhos.
- Você já começou (b5d1f96, c34364a). Continue: sugira pasta local para os
  PDFs (ex.: acervo-documentos/direitos-humanos/), registre as fontes e
  planeje/implemente a camada visual por lugar.
- Critério de pronto: fontes catalogadas com link; página ou bloco mostrando
  relatórios por cidade/estado/país; lacunas declaradas.

TAREFA 4 — Expansão nacional (cidades e estados)
- Leia docs/planos/PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md e o arquivo
  de catálogo das 199 cidades (27 capitais + 172 polos) já gerado.
- Identifique as pendências de implementação e execute as de menor custo.
- Critério de pronto: pendências fechadas documentadas no plano.

TAREFA 5 — Bases de clima e risco
- Leia docs/planos/PLANO-BASES-CLIMA-E-RISCO.md. Fatia 1 entregue; faltam
  BATER, CEMADEN, INPE, SNIS e MapBiomas.
- Sondar viabilidade de cada fonte e integrar as que tiverem dado acessível.
- Critério de pronto: fontes integradas ou lacuna declarada com data.

TAREFA 6 — Sanitização do repo (quando as tarefas acima estabilizarem)
- Leia docs/planos/PROPOSICAO-SANITIZACAO-REPO.md.
- Etapa 1: .gitattributes com * text=auto eol=lf + git add --renormalize
  (somente com aval do dono, pois toca o repo inteiro).
- Não apague worktrees sem confirmar antes.

COMO REPORTAR

- A cada tarefa concluída, atualize docs/planos/FILA-AGENTES.md (status e
  Notas) e commite.
- Envie ao dono no Telegram um resumo curto (o que fez, o que subiu, o que
  falta). O jcode também lê a fila e o git para verificar.

PRAZO/TOM

- Trabalhe em lote, com calma, sem pressa de commitar: valide antes.
- Se encontrar conflito de merge que não sabe resolver, pare e registre na
  fila em vez de forçar.## Sumário



