# PLANO — condicionantes ambientais de barragens (piloto Irapé + Setúbal)

> **Tipo:** PLANO
> **Domínio:** ambiental
> **Última medição:** 2026-09-23 (Fase 2 aplicada e Fase 4 esqueleto no mesmo dia)
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md), [FONTES.md](../06-fontes/FONTES.md), [PRODUTO.md](../01-produto/PRODUTO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [PLANO-EXPANSAO-ACORDOS-MG.md](PLANO-EXPANSAO-ACORDOS-MG.md), [PLANO-revisao-dados-visibilizacao.md](PLANO-revisao-dados-visibilizacao.md)
> **Palavras-chave:** plano, condicionantes, barragens, irape, setubal, licenciamento, ocr, r2, tac, etl

## Sumário

- [Propósito](#propósito)
- [Contexto medido](#contexto-medido)
- [Decisões do dono](#decisões-do-dono)
- [Fase 1 — descoberta e espelho](#fase-1--descoberta-e-espelho)
- [Fase 2 — banco (3 tabelas)](#fase-2--banco-3-tabelas)
- [Fase 3 — ETL e classificação](#fase-3--etl-e-classificação)
- [Fase 4 — página `/ambiental/condicionantes`](#fase-4--página-ambientalcondicionantes)
- [Fase 5 — expansão](#fase-5--expansão)
- [Critério de pronto](#critério-de-pronto)
- [Fora do escopo](#fora-do-escopo)
- [Ordenação com a fila de 22/09](#ordenação-com-a-fila-de-2209)
- [Origem](#origem)

## Propósito

Página `/ambiental/condicionantes` + ETL de condicionantes ambientais de
barragens. Soma-se a `/ambiental/tac` (TACs e acordos). Começa pelo piloto
**Irapé** e **Setúbal** (hidrelétricas, CEMIG), depois expande.

Cada condicionante fica pesquisável, classificável, filtrável, com resumo,
status honesto de cumprimento, referência ABNT e link direto à fonte.

## Contexto medido

Medido em 23/09 (leitura de repo + docs):

| Fato | Onde |
|---|---|
| Condicionantes **não existem** no repo (rota, tabela, coletor) | busca `*condicion*` = zero |
| Lacuna registrada: “cumprimento de condicionantes não tem consulta pública em MG” | [PLANO-EXPANSAO-ACORDOS-MG.md](PLANO-EXPANSAO-ACORDOS-MG.md) |
| Ideia de produto pronta: “licenciamentos com condicionantes não cumpridas” | [PLANO-revisao-dados-visibilizacao.md](PLANO-revisao-dados-visibilizacao.md) |
| Padrões das cinco coisas | `/ambiental/tac`, `/ambiental/licenciamento`, `/ambiental/copam` |
| Barragens no banco: FEAM 249 MG, SNISB 2.212 MG (`possui_pae`, `categoria_risco`) | `feam_barragens`, `snisb_barragens` |
| SIGBM 320 MG e MPMG 45 em JSON | `apps/web/data/barragens-sigbm.json`, `etl/betim/dados/barragens-mpmg.json` |
| OCR: `pdftotext`, PyMuPDF e `pdf-parse` existem; **Tesseract ausente** | registro TRT-3; `bot-ocr-cpf-scanner.mts` |
| Irapé já aparece como semente IBAMA | `scripts/coletar-ibama-mg.mts` |
| Setúbal sem registro fixo no repo | só menções incidentais |

## Decisões do dono

Confirmadas em 23/09. **Não reabrir sem remensurar.**

| # | Decisão |
|---|---|
| 1 | Status `cumprida`/`nao_cumprida` **só** com evidência linkada (DCE, PAE, auto, relatório). Sem evidência: `nao_informado` + o que existe perto (AGENTS §7). |
| 2 | Setúbal: descoberta de 23/09 corrigiu o pressuposto — Ruralminas/COPASA, uso múltiplo, sem LO. Piloto mantém o critério do dono (barragem antiga com condicionantes). |
| 3 | Texto integral dos PDFs no **espelho R2**; Postgres guarda só metadados, resumo, status e índice. |
| 4 | Piloto = **só Irapé + Setúbal** com dado real antes de escalar. |
| 5 | LLM só resume, rotulado (“gerado por máquina”, data, modelo) — nunca emite status. |
| 6 | Publicações acadêmicas (dissertações, teses, artigos, relatórios GESTA) **não** viram condicionante estruturado. Vão no rodapé “Para saber mais” de cada página de barragem/empreendimento. O condicionante vem só de fonte oficial (licença, TAC, CAP, parecer). |

## Fase 1 — descoberta e espelho

**Descoberta de 23/09 (medida):** mapa completo em
[FONTES.md § Condicionantes](../06-fontes/FONTES.md#condicionantes--piloto-irapé-e-setubal--descoberta-2309--downloads).

Achados principais:

- **Irapé:** LP 10/12/1997 com **47 condicionantes**; LI 26/4/2002 com TAC do
  MPF; LO dez/2005 com obrigações contestadas. Processo SIAM antigo ainda não
  localizado; pareceres SEMAD acessíveis em PDF com camada de texto.
- **Setúbal:** ⚠️ **não é UHE CEMIG em operação.** Nasceu CEMIG (1989,
  parada); concluída em 2010 pela **Ruralminas** como abastecimento/usos
  múltiplos. Processo LI `11492/2005/002/2006`, LP com **36 condicionantes**,
  **sem Licença de Operação há ~13 anos** (ALMG/MAB, 2026).

1. Localizar licenças e condicionantes de Irapé e Setúbal:
   SISEMA/EcoSistemas/SIAM legado, IBAMA, Ruralminas/COPASA, processos antigos.
2. PDF com camada de texto → PyMuPDF; escaneado → Tesseract
   (instalar se faltar: `tesseract-ocr` + `por`/`eng`).
3. Baixar com UA honesto, pausa 1–2 s/host, checkpoint
   (AGENTS §11); ler `robots.txt` e registrar decisão.
4. Varredura de CPF no texto extraído
   (`scripts/checar-dado-pessoal-em-dado.py`) **antes** de commitar.
5. Espelhar PDF no R2
   (`apps/web/scripts/arquivar-fontes.mjs` / `scripts/sincronizar-documentos-r2.mts`).
6. Anotar em [FONTES.md](../06-fontes/FONTES.md) URL, acesso medido e
   armadilha de cada fonte nova.

**Saída da fase:** PDFs no R2, texto varrido em disco temporário, tabela de
descoberta (URL → órgão → método) escrita.

**Pendente da descoberta:** PDFs da LP de Setúbal (36 cond.), Parecer IEF
0026/2006, processo SIAM da UHE Irapé, TAC integral do MPF, dissertação
Zucarelli (UFMG), Lestingi USP (conexão fechada no download 23/09).
Lestingi e GESTA baixados parcialmente — medições em
[FONTES.md § Condicionantes](../06-fontes/FONTES.md#condicionantes--piloto-irapé-e-setubal--descoberta-2309--downloads).
`idNorma=45918` descartado (é o Decreto 47.383/2018).

## Fase 2 — banco (3 tabelas)

Migration em `supabase/betim/migrations/`, convenção snake_case plural
(AGENTS §4):

| Tabela | Colunas essenciais |
|---|---|
| `documentos_ambientais` | `id`, `url_fonte`, `url_r2`, `hash_sha256`, `orgao`, `empreendimento`, `tipo_documento`, `data_documento`, `metodo_texto` (nativo\|ocr), `criado_em` |
| `condicionantes` | `id`, `documento_id`, `empreendimento`, `barragem_ref` (FEAM/SNISB id, nullable), `texto`, `tipo`, `prazo`, `orgao`, `status`, `metodo_status`, `confianca`, `resumo_ia`, `criado_em` |
| `condicionantes_evidencias` | `id`, `condicionante_id`, `tipo` (dce\|pae\|auto\|relatorio\|outro), `url_especifica`, `data`, `observacao` |

`status` enum: `cumprida` | `parcial` | `nao_cumprida` | `nao_informado` |
`em_analise`.

`metodo_status`: `evidencia_estruturada` | `evidencia_documental` |
`sem_evidencia`.

Consulta em `apps/web/lib/db/queries/condicionantes.ts` (padrão
`ambiental-licenciamento.ts`).

## Fase 3 — ETL e classificação

Coletores no padrão do repo (`scripts/*.mts` ou `etl/betim/etl/apis/*.py`):
UA honesto, pausa, checkpoint, flag `--seco`.

1. **Extração:** segmentar condicionantes do texto; gravar trecho da fonte
   (posição na página quando houver).
2. **Cruzamento de evidências** (dupla verificação, AGENTS §1):
   - SNISB: `possui_pae`, `categoria_risco`, `dano_potencial`;
   - FEAM: DCE / estabilidade atestada;
   - CAP/IBAMA: autos e embargos (indício de descumprimento);
   - GTAC: cláusula em ementa de TAC.
3. **Evidência estruturada** define `status`; sem ela → `nao_informado`.
4. **LLM:** só `resumo_ia`, com rótulo de data e modelo (AGENTS §7).
5. **Testes fixture:** PDFs (ou trechos) de Irapé e Setúbal viram regressão
   em `lib/**/*.test.ts` / script de ETL.
6. Varredura de CPF no dado ingerido antes de commit (AGENTS §5.2).

## Fase 4 — página `/ambiental/condicionantes`

Cinco coisas (AGENTS §8), copiando o padrão de `/ambiental/copam`:

| # | Coisa |
|---|---|
| 1 | Gráfico SVG/CSS — status por órgão/tipo; alternativa em texto |
| 2 | Cartões — total, % com informação, % cumpridas, barragens cobertas |
| 3 | CSV do **filtrado** — separador `;`, BOM UTF-8 |
| 4 | Filtro — barragem, tipo, status, órgão, período |
| 5 | Ordenação por coluna |
| + | Página de cada barragem/empreendimento fecha com rodapé “Para saber mais”: publicações acadêmicas (decisão 6), referência ABNT + hiperlink. |

Regras de payload:

- Agregado no servidor; array completo **nunca** em prop de cliente
  (AGENTS §5.1).
- Acima de ~2 mil linhas: fatiar ou paginar no servidor
  (`TabelaEstatica.tsx`).
- Cada condicionante: hiperlink direto ao ato/PDF (não home genérica),
  referência ABNT, botão “Fonte” (AGENTS §8, PRODUTO).
- Status visível com o método ao lado (“sem evidência pública até
  23/09/2026”).

## Fase 5 — expansão

Após piloto verde, nesta ordem:

1. Barragens FEAM / SNISB / SIGBM — casar por **código ou id**, nunca por
   nome (AGENTS §6).
2. Power BI Sisema: abas `GESTÃO DE BARRAGENS` e `TERMOS DE COMPROMISSO`
   (decodificador `_powerbi_dsr.py`).
3. TACs/GTAC — condicionante como cláusula de termo (ponte com
   `/ambiental/tac`).
4. Outros empreendimentos (mineração, licenciamento geral).

## Critério de pronto

- [ ] Irapé: licença localizada, texto extraído (OCR se preciso), condicionantes
      listadas, status honesto, links clicáveis ao documento.
- [ ] Setúbal: idem.
- [x] Migration 0089 no Guara + seed de 7 documentos oficiais (23/09).
- [x] Esqueleto da página `/ambiental/condicionantes` com as cinco coisas
      (vazio honesto até a LP item a item) + rodapé “Para saber mais”.
- [x] `npx tsc --noEmit` limpo; testes de `publicacoes-barragens` e navegação verdes.
- [x] Dado ingerido sem CPF (script de varredura).
- [x] `python scripts/validar-documentacao.py` verde.
- [ ] `npm test` verde (pré-existente: `lib/noticias/portal.test.ts` categoria
      “Ferramentas do Portal” fora do set do teste — não desta frente).

## Fora do escopo

- B7 (OCR dos TACs do MPMG): endpoint morto — `buscarTac` 200/0 byte
  ([FONTES.md](../06-fontes/FONTES.md)).
- LAPA, CPRM/SGS: não catalogadas; só se o piloto exigir.
- pgvector / embeddings de condicionante: espera Fase 5 do chatbot.

## Ordenação com a fila de 22/09

- **Não bloqueia** A0 (coletas Betim) nem o deploy ~5 dias
  ([ESTADO.md § fila](../02-estado/ESTADO.md#fila-viva)).
- Storage: texto cheio no R2, nunca no Guara (1 GiB).
- Este plano entra na fila como frente nova, atrás de A0–A1 quando
  conflitarem com deploy.

## Origem

Pedido do dono em 23/09/2026: plano de página/ETL de condicionantes
ambientais, somando-se a `/ambiental/tac`, com piloto em barragens antigas
(Irapé e Setúbal). Decisões 1–5 desta mesma sessão. Descoberta da Fase 1 no
mesmo dia; registro em FONTES.md.
