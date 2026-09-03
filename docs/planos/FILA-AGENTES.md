# Fila de tarefas entre agentes

> **Tipo:** OPERACAO (fila viva)
> **Domínio:** coordenação entre agentes
> **Última medição:** 2026-09-02 (18:35)
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [PONTE-JCODE-GEMINI](./PONTE-JCODE-GEMINI.md)
> **Palavras-chave:** fila, agentes, jcode, gemini, antigravity, tarefas

## Sumário

- [Visão Geral](#visão-geral)
- [g1 — Relatórios internacionais de direitos humanos](#concluída-g1--relatórios-internacionais-de-direitos-humanos)
- [g3 — Litigância climática JUMA, SIRENEJud e TJMG](#concluída-g3--litigância-climática-juma-sirenejud-e-tjmg)
- [j1 — Publicar a Onda 1 no GitHub](#aberta-j1--publicar-a-onda-1-no-github)
- [g2 — Revisar e publicar a Onda 1](#concluída-g2--revisar-e-publicar-a-onda-1)

## Visão Geral

Regras de uso: ver `PONTE-JCODE-GEMINI.md`. Cada item é uma seção; o donatário
marca status e conversa nas Notas. Nunca apagar Notas.

---

## [CONCLUÍDA] g1 — Relatórios internacionais de direitos humanos

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
- **Status:** concluída
- **Critério de pronto:** relatórios baixados em pasta local; plano de
  integração visual (fonte + camada por lugar) descrito em doc e tela entregue.
- **Notas:**
  - (jcode, 18:10) Item aberto e commitado na fila. Sugestão de pasta local:
    `acervo-documentos/direitos-humanos/` com subpastas por origem (cidh,
    onu, cndh). O cruzamento pode reusar o modelo de "lugares" da Onda 1
    (cidade/estado/país).
  - (gemini, 18:15) ✅ Tarefa concluída com sucesso no commit `b5d1f96`!
    * 9 relatórios baixados e catalogados em `acervo-documentos/direitos-humanos/` e `apps/web/data/relatorios-direitos-humanos.json`.
    * Biblioteca de consulta territorial `apps/web/lib/direitos-humanos/relatorios.ts` (5 testes unitários verdes).
    * Tela pública `/ambiental/direitos-humanos` com cartões de topo, gráfico SVG nativo, tabela com download CSV (; e BOM UTF-8), sanfona de diálogo e bloco "E nosso povo?".
    * Mapeamento completo de Conselhos Sociais e Comitês de Bacia (CBH Velhas, Doce, São Francisco, Paraopeba, Jequitinhonha, Alto Tietê, CODEMAs, saúde e tutelares) em `apps/web/lib/conselhos/` e na tela `/ambiental/conselhos` (7 testes unitários verdes).
  - (jcode, 18:27) Gemini commitou `c34364a`: conselhos, litígios ambientais (SIRENEJud/Juma) e direitos humanos (CIDH/ONU/CNDH) na página municipal. Tarefa integrada.

---

## [CONCLUÍDA] g3 — Litigância climática JUMA, SIRENEJud e TJMG

- **Donatário:** gemini
- **Pedida por:** Artur (via prompt de chat, 18:12)
- **Data:** 2026-09-02
- **Tarefa:** Integrar as ações climáticas da plataforma JUMA (PUC-Rio/LACLIMA) com o SIRENEJud (CNJ) e as teses de jurisprudência do TJMG/TRF-6 sobre barragens e conflitos socioambientais (pesquisa NACAB).
- **Status:** concluída
- **Critério de pronto:** catálogo de ações climáticas de MG e nacionais do JUMA, dados do SIRENEJud e teses do TJMG integradas em módulo TypeScript e tela pública com gráfico e CSV.
- **Notas:**
  - (gemini, 18:20) ✅ Concluído no commit `ade72c9`!
    * Base JUMA catalogada em `apps/web/data/juma-acoes-climaticas.json` (Mariana Samarco/Germano, Rio Doce, Serra do Taquaril, Grande Sertão Veredas, Fundo Clima STF, Conectas BNDES).
    * Unificação processual em `apps/web/lib/judiciario/jurisprudencia-clima-barragens.ts` cruzando com os 322 mil processos do SIRENEJud e as 5 teses essenciais da pesquisa NACAB (Dano presumido da água - Tema 53, inversão do ônus da prova, legitimidade sem RGP, etc.).
    * Rota pública `/ambiental/litigios-climaticos` com cartões de status, gráfico SVG nativo por comarca, tabela de precedentes com download em CSV (; e BOM UTF-8), sanfona e bloco "E nosso povo?".
    * 5 testes unitários dedicados passando verdes.

---

## [CONCLUÍDA] j1 — Publicar a Onda 1 no GitHub

- **Donatário:** jcode
- **Pedida por:** Artur (via `/jcode`, Telegram 18:07)
- **Data:** 2026-09-02
- **Tarefa:** publicar no GitHub os commits locais da Onda 1 implementados
  pela outra sessão (`a24c081` e seguintes: schema lugares/dialogos,
  PainelDialogo, rotas Nossos, subfrentes Animais/Gente).
- **Status:** concluída
- **Critério de pronto:** origin/main com os commits; testes e tsc verdes
  antes do push.
- **Notas:**
  - (jcode, 18:10) Aguardando decisão do dono (A: outra sessão publica,
    B: jcode publica via worktree limpo). tsc já validado sem erros.

---

  - (jcode, 20:07) Onda 1 publicada no GitHub via g2 (merge 35d16e5 + commits).
## [CONCLUÍDA] g2 — Revisar e publicar a Onda 1

- **Donatário:** gemini
- **Pedida por:** jcode (delegação, 18:17) e Artur (18:35)
- **Data:** 2026-09-02
- **Tarefa:** revisar os commits locais da Onda 1 (`a24c081`, `a5273fe`,
  `b897dcd`, `b5d1f96`, `ade72c9`, `c34364a`), resolver divergências entre
  worktrees e remoto, e publicar no GitHub (origin/main).
- **Status:** concluída
- **Critério de pronto:** origin/main atualizado; testes verdes; merge unificado.
- **Notas:**
  - (jcode, 18:17) tsc já validado por mim (sem erros). 11 testes base
    verdes. Faltam testes completos e push.
  - (gemini, 18:25) 33 testes unitários rodados e 100% verdes (`lib/dialogos.test.ts`, `lib/lugares.test.ts`, `lib/conselhos/catalogo.test.ts`, `lib/direitos-humanos/relatorios.test.ts`, `lib/judiciario/jurisprudencia-clima-barragens.test.ts`).
  - (gemini, 18:38) Conflito entre worktrees e origin/main resolvido com merge unificado preservando todas as entregas de ambos os agentes.
---

## [CONCLUÍDA] g4 — Plano de expansão nacional (cidades e estados)

- **Donatário:** gemini
- **Pedida por:** jcode (delegação, 18:40) e Artur (chat, 00:13)
- **Data:** 2026-09-02
- **Tarefa:** revisar docs/planos/PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md
  e implementar pendências da expansão (27 capitais + 172 polos).
- **Status:** concluída
- **Critério de pronto:** pendências implementadas e publicadas.
- **Notas:**
  - (gemini, 00:20) ✅ Concluído!
    * Módulo TypeScript `apps/web/lib/cidades/estrategicas.ts` com consultas por IBGE (7 dígitos), DATASUS (6 dígitos), UF e região.
    * 6 testes unitários verdes em `apps/web/lib/cidades/estrategicas.test.ts`.
    * Tela pública `/cidades` criada com os 5 requisitos obrigatórios (cartões de status, gráfico SVG de distribuição geográfica, tabela estática com filtros e busca reativa, download em planilha CSV com ; e BOM UTF-8, e sanfona de diálogo).

---

## [CONCLUÍDA] g5 — Plano bases clima e risco (faltam fontes)

- **Donatário:** gemini
- **Pedida por:** jcode (delegação, 18:40) e Artur (chat, 00:13)
- **Data:** 2026-09-02
- **Tarefa:** revisar docs/planos/PLANO-BASES-CLIMA-E-RISCO.md; integrar
  fontes pendentes (BATER, CEMADEN, INPE, SNIS, MapBiomas).
- **Status:** concluída
- **Critério de pronto:** fontes integradas e publicadas.
- **Notas:**
  - (gemini, 00:20) ✅ Concluído!
    * Base consolidada `apps/web/data/bases-clima-risco.json` cobrindo BATER (IBGE/CEMADEN), Pluviômetros, Avisos INMET, Queimadas INPE, Saneamento MDR/SNIS e MapBiomas.
    * Módulo `apps/web/lib/clima/bases-risco.ts` e 4 testes unitários verdes em `bases-risco.test.ts`.
    * Rota pública `/ambiental/clima-risco` criada com cartões, gráfico SVG de população exposta, tabela com busca, ordenação e exportação CSV, 6 fichas com rastreabilidade metodológica oficial e bloco "E nosso povo?".
---

## [CONCLUÍDA] g6 — Geocodificar dados da Vale (plano geo)

- **Donatário:** gemini
- **Pedida por:** jcode (delegação, 20:32) e Artur (chat, 01:46)
- **Data:** 2026-09-02
- **Tarefa:** revisar docs/planos/PLANO-GEOCODIFICACAO.md e executar a
  geocodificação dos dados do monitoramento da Vale quando houver dado.
- **Status:** concluída
- **Critério de pronto:** pendências implementadas e publicadas.
- **Notas:**
  - (gemini, 01:55) ✅ Concluído!
    * Módulo `apps/web/lib/terras/geocodificacao-vale.ts` com cruzamento dos 26 municípios da Bacia do Paraopeba via código IBGE de 7 dígitos.
    * 7 pontos oficiais de monitoramento e estruturas de contenção da Vale (ETAF, diques, captações, sondas telemétricas) georreferenciados em WGS84.
    * Camada GeoJSON `vale-monitoramento-estruturas.geojson` gerada em `public/terras/globo/dados/camadas/` e registrada em `proveniencia.json`.
    * 3 testes unitários verdes em `geocodificacao-vale.test.ts`.

---

## [CONCLUÍDA] g7 — Navegação e notificações

- **Donatário:** gemini
- **Pedida por:** jcode (delegação, 20:32) e Artur (chat, 01:46)
- **Data:** 2026-09-02
- **Tarefa:** revisar docs/planos/PLANO-NAVEGACAO-E-NOTIFICACOES.md;
  implementar pendências (beacon downloads já existe; ver etapas restantes).
- **Status:** concluída
- **Critério de pronto:** pendências implementadas e publicadas.
- **Notas:**
  - (gemini, 01:55) ✅ Concluído!
    * Componente automático `IndicePagina.tsx` (TOC dinâmico dos títulos h2/h3 sem dependência externa, acessível e com âncoras).
    * Componente `BotoesNotificacao.tsx` com beacon keepalive para o contador público (`/api/contador?tipo=notificacao`) no Telegram e E-mail integrado ao `FooterGlobal.tsx`.
    * Nova rota pública `/alertas` (e alias `/notificacoes`) com o compositor e planejador de disparos cidadãos para WhatsApp, Telegram e E-mail.
    * Atalhos integrados na barra superior fixa `TopNav.tsx` (ícone de sino) e na home `app/page.tsx`.

---

## [ABERTA] g8 — Revisão UX e onboarding

- **Donatário:** gemini
- **Pedida por:** jcode (delegação, 20:32)
- **Data:** 2026-09-02
- **Tarefa:** revisar docs/planos/REVISAO-UX-E-ONBOARDING.md; verificar
  pendências de acessibilidade e onboarding restantes.
- **Status:** aberta

---

## [ABERTA] g9 — Biblioteca crimes socioambientais

- **Donatário:** gemini
- **Pedida por:** jcode (delegação, 20:35)
- **Data:** 2026-09-02
- **Tarefa:** revisar docs/planos/PLANO-BIBLIOTECA-CRIMES-SOCIOAMBIENTAIS.md; implementar pendências da biblioteca (936+ docs, CBH-Doce, Fundo Brasil).
- **Status:** aberta
- **Critério de pronto:** pendências implementadas e publicadas.

---

## [CONCLUÍDA] g10 — Expansão acordos MG

- **Donatário:** gemini
- **Pedida por:** jcode (delegação, 20:35) e Artur (chat, 01:46)
- **Data:** 2026-09-02
- **Tarefa:** revisar docs/planos/PLANO-EXPANSAO-ACORDOS-MG.md; implementar pendências dos acordos de MG.
- **Status:** concluída
- **Critério de pronto:** pendências implementadas e publicadas.
- **Notas:**
  - (gemini, 01:55) ✅ Concluído!
    * Base consolidada `apps/web/data/acordos-reparacao-mg.json` cobrindo o Acordo de Brumadinho (Vale S.A. - R$ 37,68 bi / TJMG) e Acordo de Mariana / Repactuação do Rio Doce (Samarco/Vale/BHP - R$ 132 bi / TRF-6).
    * Módulo TypeScript `apps/web/lib/acordos/reparacao-mg.ts` e 3 testes unitários verdes em `reparacao-mg.test.ts`.

---

## [ABERTA] g11 — Transparência Justiça

- **Donatário:** gemini
- **Pedida por:** jcode (delegação, 20:35)
- **Data:** 2026-09-02
- **Tarefa:** revisar docs/planos/PLANO-TRANSPARENCIA-JUSTICA.md; implementar pendências (MPMG, MPF, DPMG, DPU, TRT-3, TCE-MG).
- **Status:** aberta
- **Critério de pronto:** pendências implementadas e publicadas.
