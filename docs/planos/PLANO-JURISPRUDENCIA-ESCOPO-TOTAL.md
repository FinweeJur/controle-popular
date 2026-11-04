# Plano — jurisprudência em escopo total (do Rio Doce às sínteses por tribunal)

> **Tipo:** PLANO
> **Domínio:** jurisprudência dos desastres e direitos humanos
> **Última medição:** 2026-11-04 00:42
> **Leitura estimada:** media (10-15 min)
> **Relacionados:** [PLANO-RAG-JURIMETRIA-TJMG.md](PLANO-RAG-JURIMETRIA-TJMG.md), [PLANO-JURISPRUDENCIA-02-11.md](PLANO-JURISPRUDENCIA-02-11.md), [PLANO-PAGINA-JURISPRUDENCIA.md](PLANO-PAGINA-JURISPRUDENCIA.md), [CADERNO-ATIS-PROCESSO-COLETIVO.md](CADERNO-ATIS-PROCESSO-COLETIVO.md), [PROMPT-BATCH-SABIA-ANALISE-RIO-DOCE.md](PROMPT-BATCH-SABIA-ANALISE-RIO-DOCE.md), [PROMPT-DELEGACAO-BRUMADINHO.md](PROMPT-DELEGACAO-BRUMADINHO.md)
> **Palavras-chave:** plano, jurimetria, catálogo, crítico acadêmico, RAG, home-pc, cadeia de modelos, deploy

## Sumário

- [Estado das fases](#estado-das-fases)
- [Veredito executivo](#veredito-executivo)
- [Estado medido](#estado-medido)
- [Regras de ferro](#regras-de-ferro)
- [Cadeia de modelos](#cadeia-de-modelos)
- [Fases](#fases)
- [Quem faz o quê](#quem-faz-o-quê)
- [Resumabilidade](#resumabilidade)
- [RAG sem sobrelotar](#rag-sem-sobrelotar)
- [Do ETL à página](#do-etl-à-página)
- [Telegram](#telegram)
- [Agenda](#agenda)
- [O que trava](#o-que-trava)
- [Decisões pendentes](#decisões-pendentes)

## Estado das fases

| Fase | Frente | Estado |
|---|---|---|
| F0 | Rio Doce | ✅ fechada: 3.656/3.656, crítico limpo, no ar |
| F1 | Brumadinho | ✅ fechada: 2.469/2.471, 2 casos sem JSON listados |
| F2 | Itatiaiuçu | ✅ medida: 7 acórdãos confirmados na ementa; expansão exige coleta nova |
| F3 | Direitos humanos | 🚧 rodando no home-pc com rubrica própria |
| F4 | Penal | ⏸ não começou: tem página e classificação próprias |
| F5 | Estadual (TJES) | ◐ parcialmente coberta pela frente do Rio Doce (2.492 casos TJES) |
| F6 | Teses gerais | ✅ 3 relatórios refeitos pela esteira |
| F7 | Sínteses por tribunal | ✅ primeira versão: `SINTESE-TEMATICA.md` |
| F8 | Página e RAG | ◐ página com catálogo por frente; RAG aguarda lote controlado |

## Veredito executivo

A esteira já roda sozinha à 01:00 e **para** quando o crítico acadêmico acha erro.
O que falta não é código novo, é **escala por frente**: hoje só o Rio Doce está
catalogado, e mesmo ele em 16%.

O plano faz seis coisas, nesta ordem:

1. fecha o catálogo do Rio Doce (S5-free, custo zero);
2. delega **Brumadinho** para o `home-pc`, que fica ligado, com GLM free;
3. abre Itatiaiuçu, direitos humanos, penal e o corte estadual, um por vez;
4. transforma catálogo em tese geral e em síntese temática por tribunal;
5. ingere no RAG em lotes com teto, sem estourar o índice;
6. só então atualiza página, gráficos e subpáginas, e publica.

Cada fase tem portão: **não avança com crítico em erro, cobertura abaixo de 95%
ou número sem fonte.** É o que impede publicar meia-verdade.

## Estado medido

Acervo publicado (`apps/web/data/jurisprudencia-casos.json`): **23.533 casos**.

| Frente | Casos |
|---|---:|
| brumadinho | 7.744 |
| penal | 6.182 |
| riodoce | 5.362 |
| dh | 2.373 |
| sumula | 1.872 |

| Tribunal | Casos |
|---|---:|
| TJMG | 12.987 |
| TJES | 5.682 |
| STF | 3.728 |
| STJ | 673 |
| TST | 463 |

Catálogo da rubrica v3 (S5-free), medido às 01:20: **1.503 de 3.656** na fila do
Rio Doce (41%), a 2,4 s por caso — fecha por volta das 02:50.

Fila medida por frente (antes de gastar chamada):

| Frente | Na fila | Observação |
|---|---:|---|
| Rio Doce | 3.656 | planilha NACAB decide o resto |
| Brumadinho | 2.471 | planilha própria decide 413 casos |
| Direitos humanos | 2.373 | sem planilha de polo; rubrica a validar |
| Penal | 6.166 | fora da cadeia por ora: tem página e rubrica próprias |

RAG: 2.361 documentos no índice; biblioteca de evidências com 1.081 itens.

## Regras de ferro

- **Custo zero primeiro.** Só gasto com "sim" do dono. Teto combinado: R$ 1 por
  lote.
- **Nenhum captcha**, em nenhuma etapa, por nenhum caminho.
- **Modelo rotula e cita; não conta.** Todo total, percentual e taxa sai de
  contagem determinística sobre CSV.
- **Checkpoint por linha.** Queda de energia ou de conexão não perde trabalho.
- **Commit por etapa**, com push. Trabalho não commitado não existe.
- **Portão do crítico.** Erro no crítico bloqueia publicação. Cobertura do
  catálogo abaixo de 95% também.
- **Dado pessoal.** CPF não entra em prompt; `sem-cpf-no-repo` roda antes do
  push no portal.
- **Polo do acervo não é sobrescrito por rótulo de lote.** Concordância medida:
  26%. As divergências ficam registradas no crítico.

## Cadeia de modelos

Ordem de tentativa, com o que já está configurado em
`C:\Users\teste\.config\opencode\opencode.jsonc`:

| # | Modelo | Como é chamado | Custo | Observação |
|---|---|---|---|---|
| 1 | `S5-free` (Maritaca) | HTTP, `MARITACA_API_KEY` | zero | 1 M de contexto, 60 RPM, 256 k TPM. **Sem batch.** |
| 2 | `glm-4.5-flash` (Z.ai) | HTTP, `ZAI_API_KEY` | zero | `glm-4.7-flash` ainda não está na config. **Medido: 148 s por caso** — reserva, não volume |
| 3 | `deepseek/deepseek-v4.1-flash-free` (OrcaRouter) | HTTP, `ORCAROUTER_API_KEY` | zero | 32 k de contexto: só ementa, nunca inteiro teor |
| 4 | `S5` (Maritaca) | HTTP, pago | R$ 0,50 / R$ 2,50 por Mi | Universo do Rio Doce em batch: R$ 2,03 |
| 5 | `qwen3.8-flash` (plano Go) | CLI | conforme plano | provedor ainda **não** configurado |
| 6 | `deepseek-v4-flash` (API DeepSeek) | HTTP, `deepseek-proxy` | pago | último recurso |

Regras da cadeia:

- **Cair de degrau é evento, não rotina.** Cada queda grava no log o motivo
  (429, 5xx, JSON inválido, contexto estourado) e a hora.
- **Resposta sem JSON conta como falha** e desce um degrau. Modelo de raciocínio
  precisa de `reasoning_effort: none` — com `low` o S5 já gastou 9 mil tokens
  pensando e devolveu conteúdo vazio.
- **Contexto manda.** Inteiro teor só no S5-free (1 M). Nos degraus de 32 k, o
  caso entra por ementa recortada.
- **Degrau pago só com autorização.** Antes de cruzar do #3 para o #4, o script
  para e pede o "sim", com número de casos e valor.

**Pacote GitHub (IA científica, GLM e Qwen).** É cota limitada, não volume:
serve para (a) duplo-cego de conferência em amostra e (b) sínteses temáticas,
que são poucas chamadas e caras em julgamento. Falta o dono informar o endpoint
e as credenciais para entrar na cadeia como degrau separado.

## Fases

Cada fase tem: objetivo, fonte, script, portão, saída, custo e tempo.

### F0 — fechar o Rio Doce (rodando agora)

- Fonte: `tabelas/rio-doce-*/`, `rio_doce_decisoes.csv`.
- Script: `rotular_sync.py --modelo S5-free`, checkpoint
  `tabelas/lotes_rotulo/sync-S5-free.csv`.
- Portão: 3.656/3.656 e crítico sem erro.
- Saída: `relatorios/CATALOGO-INDETERMINADOS.md` (conflitos, direitos, motivos,
  palavras-chave, divergências).
- Custo: R$ 0. Tempo: ~2 h a partir das 00:42.

### F1 — Brumadinho (delegada ao home-pc)

- Fonte: `tabelas/brumadinho-*/`, frente `brumadinho` no acervo (7.744 casos).
- Bloqueio técnico: `lote_rotulagem._do_caso` fixa `frente == "riodoce"` e lê
  `rio_doce_decisoes.csv`. Precisa de `--frente`.
- Portão: mesma rubrica v3, crítico sem erro, cobertura ≥ 95% **da fila de
  Brumadinho**.
- Custo: zero (GLM free no home-pc); se cair para S5 pago, pedir antes.
- Prompt pronto: [PROMPT-DELEGACAO-BRUMADINHO.md](PROMPT-DELEGACAO-BRUMADINHO.md).

### F2 — Itatiaiuçu

- Fonte: `tabelas/atingidos-barragens`, `atingidos-mineracao` (filtrar pelos
  processos do município).
- Antes de catalogar: **medir quantos casos existem**. Se a frente não estiver
  no acervo, o trabalho começa pela coleta, não pelo modelo.
- Portão: coleta auditada pelo crítico antes de qualquer rotulagem.

### F3 — Direitos humanos (2.373 casos) — **bloqueada por medição**

- Fonte: `direitos-humanos_jurimetria.csv` (coleta por termo livre "direitos
  humanos" na ementa do TJMG) e `direitos-humanos_resumos.csv`.
- **Medido em 04/11:** só 6 dos 2.373 casos citam desastre, Renova ou barragem.
  O restante é jurisprudência comum: 1.145 apelações cíveis, mandado de
  segurança de concurso público, plano de saúde, alongamento capilar.
- Consequência: a rubrica de desastre (v3/v4) não serve aqui, e `lado_vencedor`
  atingido/empresa não existe nesses casos. Catalogar seria 95 minutos de lixo.
- O que falta antes de rotular: decidir se `dh` é **frente temática** (direito à
  saúde, moradia, água) com rubrica própria — direito violado, resultado do
  recurso, esfera administrativa — ou se a coleta por termo livre deve ser
  substituída por recorte de assunto do tribunal.
- Portão: nenhuma linha de dh entra no catálogo antes disso.

### F4 — Penal (6.182 casos)

- Fonte: `lotes_penal`, `analise_penal.py`, `PENAL-CLASSIFICACAO.md`.
- Portão: **não contaminar** o acervo cível. Já existe
  `medir_contaminacao_penal.py`; ele roda antes da agregação.

### F5 — Corte estadual (TJES 5.682 e o que houver de TJMG estadual)

- Fonte: `rag-tjes.json`, `exportar_inteiro_teor_tjes.py`.
- Objetivo: comparar o mesmo conflito em dois tribunais.
- Portão: divergência entre tribunais só é publicada com os dois lados contados.

### F6 — Teses gerais

- Script: `canonizar_teses.py` + `analisar_teses.py` por lente
  (`desastre`, `dh`, `penal`).
- Saída: `TESES-DESASTRE.md`, `TESES-DH.md`, `TESES-PENAL.md`.
- Portão: tese canônica precisa de ≥ 2 acórdãos; tese de um caso fica como
  exemplo, não como tese.

### F7 — Sínteses temáticas por tribunal

- Insumo: catálogo de conflitos + teses canônicas.
- Recorte: conflito × tribunal × ano. Ex.: prescrição no TJMG contra prescrição
  no TJES; Tema 1.280 no STJ.
- Modelo: aqui vale o pacote GitHub, porque são poucas chamadas de julgamento.
- Portão: cada síntese cita os processos que a sustentam.

### F8 — Página, gráficos e RAG

- Só depois de F0–F7 com crítico limpo.
- Ordem: dado → gráfico → página → subpágina → índice → deploy.
- Detalhe em [Do ETL à página](#do-etl-à-página).

## Quem faz o quê

| Máquina | Papel | Por quê |
|---|---|---|
| PC local (`X:\DevCoder`) | Rio Doce, crítico, página, deploy | é onde o portal e o git vivem |
| `home-pc` (`100.91.10.1`) | Brumadinho e frentes de volume | fica ligado; 160 GB livres; Python 3.12.10 |
| Pacote GitHub (GLM/Qwen) | duplo-cego e sínteses | cota limitada, julgamento caro |
| API paga | só com autorização | custo |

Medido no `home-pc` em 04/11: repo em `C:\DevCoder\tjmg-jurimetria`, `.venv`
presente, `ZAI_API_KEY` gravada, **sem** `MARITACA_API_KEY` e sem git no PATH do
SSH. Rodei o catálogo de Brumadinho lá: a cadeia caiu no GLM e fez 7 casos em
~5 min (148 s por caso, medido depois em chamada isolada). Para 2.471 casos
seriam 4 dias — inviável. O home-pc fica como reserva para o pacote GitHub e
para conferência, não para volume.

Consequência prática: **o volume é sequencial no S5-free**, a 2,4 s por caso.
Tentar paralelizar esbarra no limite de 60 RPM da oferta gratuita. Se o dono
copiar a `MARITACA_API_KEY` para o home-pc, as duas máquinas rodam frentes
diferentes ao mesmo tempo e o tempo total cai pela metade.

Coordenação por SSH segue a skill `/ssh`:

```powershell
ssh -i C:\Users\teste\.ssh\id_ed25519_rag user@100.91.10.1 whoami
```

Regras de convivência:

- **Um checkpoint, um dono.** Rio Doce só no PC local; Brumadinho só no
  `home-pc`. Nada de duas máquinas no mesmo CSV.
- **Antes de disparar lote no `home-pc`**, conferir processo Python ativo
  (`Get-CimInstance Win32_Process`), porque já existe `captcha_watch.py` rodando
  lá.
- **Lote remoto desanexa por WMI**, nunca `Start-Process` (morre com o SSH).
- **Trazer o CSV** por `scp` para `tabelas/lotes_rotulo/` e rodar o crítico aqui.

## Resumabilidade

O que protege o trabalho quando cai energia, internet ou o modelo:

1. `rotular_sync.py` grava **cada linha** e `flush()` imediato; o CSV é o
   checkpoint.
2. `single_instance.py` trava instância dupla — a tarefa da madrugada não
   duplica a rodada manual.
3. `esteira_analise.py` espera o catálogo fechar (teto de 5 h) e registra no log
   cada 2 min.
4. Etapa que falha **para a esteira**; nada de seguir com etapa faltando.
5. `git commit` por etapa; `push` quando há remoto.
6. Lote remoto roda desanexado; se o SSH cair, o lote continua.

O que ainda falta para queda de energia no meio de um lote pago: o lote já é
retomável por `custom_id` (saída válida 30 dias), mas o script de retomada
precisa ser exercitado uma vez de propósito.

## RAG sem sobrelotar

Regras para não repetir o erro de encher o índice com o que não se consulta:

- **Lote por frente**, com teto: ~200 documentos por rodada, e `rag:check`
  depois de cada lote.
- **Um documento por unidade citável** (acórdão, norma, artigo), nunca o CSV
  inteiro.
- **Nada de duplicata:** o ingresso compara por chave de origem; se já existe,
  atualiza em vez de inserir.
- **Medir antes e depois:** nº de documentos, nº de trechos, tamanho do índice.
  Se o índice cresce sem a avaliação melhorar, o lote não entra.
- **Dado pessoal mascarado** antes da ingestão.
- Base: [PLANO-RAG-JURIMETRIA-TJMG.md](PLANO-RAG-JURIMETRIA-TJMG.md) e
  [MANUAL-RAG-E-LLM.md](../03-desenvolvimento/MANUAL-RAG-E-LLM.md).

## Do ETL à página

Ordem fixa — inverter quebra número:

1. **ETL** — coleta e normalização; nada publicado.
2. **Catálogo** — modelo rotula; `agregar_catalogo.py` conta.
3. **Jurimetria** — `jurimetria_rio_doce.py` mede sobre o catálogo.
4. **Crítico** — arquivos, base, amostra, números, citações, links, caderno.
5. **Dado do portal** — `gerar_jurisprudencia_casos.py` reescreve o JSON.
6. **Gráficos** — regerados a partir do JSON, nunca à mão.
7. **Página e subpáginas** — leem o JSON; nenhum número digitado no JSX.
8. **Build** — `npm run build` no `apps/web`.
9. **Deploy** — só com o crítico limpo.

Gráficos que precisam existir/atualizar por frente: favorabilidade, conflitos,
motivo de indeterminação, direitos citados, comarca × taxa, relator × taxa,
série por ano, tribunal × conflito.

## Telegram

Aviso curto (2–3 linhas), nos marcos — não a cada caso:

- catálogo fechado (frente, casos, tempo, modelo);
- crítico com erro (qual conferência e o que fazer);
- queda de degrau de modelo (de qual para qual e por quê);
- pedido de autorização de gasto (casos, custo, teto);
- publicação concluída (URL e o que mudou).

## Agenda

| Quando | O quê |
|---|---|
| 01:00 diário | `CP-Analise-Madrugada` — esteira completa, publica só com crítico limpo |
| ao fechar cada frente | crítico + commit + push + aviso |
| diário | regerar gráficos e dados do portal das frentes fechadas |
| semanal | `rag:check`, `sem-cpf-no-repo`, avaliação do RAG |

## O que trava

- Catálogo do Rio Doce em 16% — trava F0 e todo o resto.
- `lote_rotulagem` preso ao Rio Doce — trava F1.
- `glm-4.7-flash` e `qwen3.8-flash` (Go) não configurados — degraus 2 e 5 da
  cadeia não existem ainda.
- Pacote GitHub sem endpoint/credencial definidos — trava F7 pelo caminho barato.
- Página ainda não lê `catalogo-indeterminados.json` — F8 depende disso.

## Decisões pendentes

1. **Pacote GitHub:** qual endpoint, qual chave e qual cota? Sem isso ele não
   entra na cadeia.
2. **Itatiaiuçu:** entra como frente nova no acervo ou como recorte de
   `atingidos-barragens`?
3. **Corte estadual:** TJES é frente própria ou coluna de comparação?
4. **Deploy automático da madrugada:** mantém, ou o deploy fica sempre manual
   depois do aviso?

## Origem / Histórico

- **04/11/2026 — plano criado.** Nasce do pedido de rodar todas as frentes em
  cadeia, com crítico acadêmico, commit por etapa, RAG controlado e aviso no
  Telegram.
