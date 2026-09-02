# Fila de tarefas entre agentes

> **Tipo:** OPERACAO (fila viva)
> **Domínio:** coordenação entre agentes
> **Última medição:** 2026-09-02 (18:10)
> **Relacionados:** [PONTE-JCODE-GEMINI](./PONTE-JCODE-GEMINI.md)
> **Palavras-chave:** fila, agentes, jcode, gemini, antigravity, tarefas

Regras de uso: ver `PONTE-JCODE-GEMINI.md`. Cada item é uma seção; o donatário
marca status e conversa nas Notas. Nunca apagar Notas.

---

## [ABERTA] g1 — Relatórios internacionais de direitos humanos

- **Donatário:** gemini
- **Pedida por:** Artur (via `/gemini`, Telegram 18:03)
- **Data:** 2026-09-02
- **Tarefa:** procurar e baixar para o PC relatórios temáticos de direitos
  humanos sobre o Brasil e a América Latina:
  - CIDH (Comissão Interamericana de Direitos Humanos) — relatórios temáticos;
  - PIDESCA (Protocolo de San Salvador — direitos econômicos, sociais e culturais);
  - Direitos Humanos ONU;
  - combate à tortura;
  - povos indígenas;
  - afrodescendentes.
  Depois: usar os dados na **integração visual**, cruzando por
  cidade/estado/país e aparecendo para o usuário — junto com os relatórios do
  CNDH já baixados e demais conselhos.
- **Status:** aberta
- **Critério de pronto:** relatórios baixados em pasta local; plano de
  integração visual (fonte + camada por lugar) descrito em doc.
- **Notas:**
  - (jcode, 18:10) Item aberto e commitado na fila. Sugestão de pasta local:
    `acervo-documentos/direitos-humanos/` com subpastas por origem (cidh,
    onu, cndh). O cruzamento pode reusar o modelo de "lugares" da Onda 1
    (cidade/estado/país).

---

## [ABERTA] j1 — Publicar a Onda 1 no GitHub

- **Donatário:** jcode
- **Pedida por:** Artur (via `/jcode`, Telegram 18:07)
- **Data:** 2026-09-02
- **Tarefa:** publicar no GitHub os commits locais da Onda 1 implementados
  pela outra sessão (`a24c081` e seguintes: schema lugares/dialogos,
  PainelDialogo, rotas Nossos, subfrentes Animais/Gente).
- **Status:** aberta
- **Critério de pronto:** origin/main com os commits; testes e tsc verdes
  antes do push.
- **Notas:**
  - (jcode, 18:10) Aguardando decisão do dono (A: outra sessão publica,
    B: jcode publica via worktree limpo). tsc já validado sem erros.
