# Plano de Automação da Coleta de Dados — Capitais e Polos do Interior

> **Tipo:** PLANO
> **Domínio:** cidades
> **Última medição:** 2026-09-01
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md](PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [PLANO-M7-M11-CURADORIA-OSS.md](PLANO-M7-M11-CURADORIA-OSS.md), [HANDOFF-M9-M10-PODMAN.md](HANDOFF-M9-M10-PODMAN.md), [ROTEIRO-EXECUCAO-PENDENCIAS.md](ROTEIRO-EXECUCAO-PENDENCIAS.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** automacao, coleta, capitais, polos, interior, picoclaw, jcode, ollama, deepseek, fallback, enriquecimento, sapl, diario-oficial, cadencia, ibge

## Sumário

- [Propósito](#propósito)
- [Cidades-alvo e estado do seed](#cidades-alvo-e-estado-do-seed)
- [Papéis na automação](#papéis-na-automação)
- [Fontes por cidade e cadência](#fontes-por-cidade-e-cadência)
- [Pipeline proposto](#pipeline-proposto)
- [Componentes novos](#componentes-novos)
- [Orquestração com jcode](#orquestração-com-jcode)
- [Fallback Ollama → DeepSeek](#fallback-ollama-→-deepseek)
- [Regras e salvaguardas](#regras-e-salvaguardas)
- [Fases de execução](#fases-de-execução)
- [Verificação](#verificação)
- [Decisões registradas](#decisões-registradas)
- [Origem / Histórico](#origem--histórico)

## Propósito

Definir como automatizar a coleta de dados das cidades estratégicas do portal
(27 capitais + 172 polos do interior = 199 municípios) reusando a esteira que
já existe, em vez de criar um orquestrador novo: **PicoClaw** monitora a saúde
das fontes, **jcode** orquestra as rodadas e paraleliza por região, **Ollama**
local faz o enriquecimento sem mandar dado para fora, e **DeepSeek** é o
fallback remoto quando o Ollama falha. Tudo isso dentro das rotinas já
agendadas (`rotina-local.mts`, `rotina-coletas.mts`, rotinas PowerShell e n8n).

## Cidades-alvo e estado do seed

| Grupo | Quantidade | Estado | Referência |
|---|---:|---|---|
| Capitais + DF | 27 | semeadas (migration `0082`) | `PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md` |
| Polos do interior | 172 | inventário pronto; seeds `0083-0087` pendentes | `apps/web/data/polos-interior-ibge.json` (gerado por `scripts/gerar-polos-interior.cjs` ao vivo da API do IBGE) |
| **Total** | **199** | — | — |

O que falta para os seeds dos polos, na ordem do
[runbook-cidade-nova.md](../dominios/cidades/betim/runbook-cidade-nova.md):

1. **CNPJ da prefeitura e da câmara** conferidos ao vivo (PNCP/Interlegis) —
   CNPJ errado faz o `etl.pncp.contratos` coletar contrato de outro ente em
   silêncio.
2. **Fornecedor da câmara** (SAPL, SysSolution, nenhum) por polo, para o
   `camara_sistema`/`camara_coletor` certo.
3. `ativo = false` até o ETL rodar pelo menos uma vez; guardas de MG
   (`paraopeba`, `citrolandia`, `links_uteis_mg`, `rotas_legadas`) em `false`
   para todo polo fora de MG.

Cidades ativas hoje: Betim, Belo Horizonte, São Paulo, Diamantina, Araçuaí e
Itinga. Regra dura: casar por **código IBGE de 7 dígitos**, nunca por nome
(homônimos e grafia divergem); `datasus_6dig` e `comunicabr` usam 6 dígitos.

## Papéis na automação

| Papel | Ferramenta | O que faz hoje | O que passa a fazer |
|---|---|---|---|
| **Monitor de fontes** | PicoClaw (`scripts/agent-tools/picoclaw-source-watcher.mts`) | Sonda as 24 fontes do `registry.ts` (HEAD/GET range, hash SHA-256 de 8 KB, retry 1× com 5 s, histórico JSONL em `picoclaw-historico.jsonl`) | Aceitar `--cidade <ibge>` e sondar as fontes específicas da cidade; relatório por cidade no `picoclaw-fontes-status.json` |
| **Orquestrador** | jcode | — | Agenda e executa as rodadas (diária/semanal), dispara agentes em paralelo por região, valida (`tsc`, `vitest`, guarda mod-11), commita por pathspec e publica; reporta ao Telegram |
| **Inferência local** | Ollama (`localhost:11434`) | Embeddings (`nomic-embed-text`, 768 dims), RAG do chatbot, síntese do Colibri (`hermes3:8b`, `qwen2.5-coder:7b`, `qwen2.5-coder:1.5b`, `llama3.2:3b`) | Classificação residual dos atos, extração de entidades, resumo de textos longos e dedupe de registros coletados — sem dado sair da máquina |
| **Fallback remoto** | DeepSeek (`deepseek-chat`, `https://api.deepseek.com`) | Provedor de IA do assistente (degrau 3) junto com a Maritaca, com cascata já implementada | Mesmo contrato de prompt do Ollama; acionado só quando o Ollama estiver fora do ar, lento ou com qualidade baixa; texto sempre sanitizado antes do envio |

## Fontes por cidade e cadência

Reusando o ranqueamento do plano de expansão (Tier 0/1/2/3), a cadência
proposta para a coleta automática:

| Tier | Fontes | Escopo | Cadência proposta | Mecanismo |
|---|---|---|---|---|
| **0 — Federal (lote nacional)** | ComunicaBR, PNCP, Siconfi, Transferegov, SIGBM/ANM, SIRENEJud/CNJ, DATASUS/SIH | 1 sync nacional cobre as 199 cidades | mensal (ComunicaBR, SIRENEJud, SIH) / semanal (PNCP, Transferegov) | `rotina-local.mts` lê `etl-*.yml` (já é assim); fatias por cidade geradas no build |
| **1 — Padrão aberto por cidade** | Diários oficiais (SIGPub AMM-MG, DOM-PBH, órgão oficial), SAPL/Interlegis (>1.800 câmaras), CKAN de capitais | por cidade | diário (diários) / semanal (SAPL, CKAN) | coletores existentes (`sigpub.py`, `domweb.py`) + `coletar-cidade.mts` novo |
| **2 — Fornecedores ERP** | Betha, Sonner/WebISS, Fiorilli, Aspec, IPM/Thema, SysSolution | 1 conector atende dezenas de cidades | semanal/mensal | conector por fornecedor, alimentado pelo `cidades-estrategicas.json` |
| **3 — Customizado** | Portais legados, PDF escaneado | por cidade | — | **Degradação graciosa**: `camara_proposicoes: false` + lacuna declarada, nunca scraping ad-hoc |

## Pipeline proposto

```
                ┌────────────────────────────────────────────────────┐
                │  jcode (orquestrador)                              │
                │  agenda: rotina-local.mts + coletar-cidade +       │
                │         rotina-coletas.mts + enriquecimento        │
                └───────┬────────────────────────────┬───────────────┘
                        │                            │
              coleta por cidade              PicoClaw (saúde das fontes)
              (Tier 0 lote + Tier 1/2       HEAD/GET range + hash 8 KB
               por cidade)                  por fonte/cidade → JSONL
                        │                            │
                        ▼                            ▼
        ┌─────────────────────────────┐   alerta Telegram se
        │  enriquecimento (Ollama)    │   taxaDisponibilidade < 70%
        │  classificar | extrair |    │
        │  resumir | deduplicar       │
        │      │ fallback: DeepSeek   │
        └──────────────┬──────────────┘
                       ▼
        guarda mod-11 (checar-dado-pessoal-em-dado.py)
                       ▼
        build → travas (piso de páginas, queda relativa, 25 MiB)
                       ▼
        publicação (home-pc via Cloudflare Tunnel) + Telegram
```

Regra de proveniência: todo registro enriquecido carrega
`{fonte, provedor, modelo, dataGeracao}` — o portal só mostra resumo gerado
por máquina rotulado com data e modelo (regra editorial do AGENTS.md).

## Componentes novos

1. **`apps/web/data/cidades-estrategicas.json`** — catálogo das 199 cidades:
   `id_municipio` (7 dígitos), `uf`, `regiao`, `datasus_6dig`, CNPJ de
   prefeitura e câmara, `camara_sistema`/`camara_coletor`, URLs de diário e
   SAPL. Derivado de `polos-interior-ibge.json` + seeds `0082-0087` + confere
   ao vivo (PNCP/Interlegis). Nunca digitar CNPJ à mão.
2. **`scripts/coletar-cidade.mts`** — coletor por cidade (`--cidade <ibge>`):
   resolve, a partir do catálogo, quais coletores rodam (SAPL proposições,
   diário oficial, PNCP por CNPJ, fatia ComunicaBR/SIH) e os executa com pausa
   honesta e UA do projeto. Sai em `apps/web/data/cidades/<ibge>/`.
3. **`scripts/agente-enriquecimento.mts`** — etapa nova de enriquecimento com
   fallback Ollama → DeepSeek (seção abaixo). Processa JSONL coletado, grava
   com proveniência e nunca envia texto com dado pessoal.
4. **PicoClaw com `--cidade`** — filtro por cidade nas sondagens; o relatório
   ganha seção por cidade (fontes da cidade online/falha) sem quebrar o
   histórico JSONL existente.
5. **`scripts/n8n-workflows/*.json`** — workflows do M10 versionados
   (madrugada, manha, alerta-disponibilidade), espelhando as rotinas
   PowerShell; os `.ps1` viram contingência até a validação de 3 dias.
6. **Rotina semanal "cidades"** — agendada por jcode: catálogo → coletas
   Tier 1/2 → enriquecimento → guarda → build sem deploy → relatório Telegram.

## Orquestração com jcode

- **Rodada diária** (já existe): tarefa do Windows `Controle Popular - rotina
  diaria` 06:00 → `rotina-local.mts` (ETL → build → travas → deploy). jcode
  apenas observa logs (`logs/rotina-*.log`) e alerta se a última linha não for
  `publicado.`.
- **Rodada semanal "cidades"**: jcode agenda e executa
  `rotina-coletas.mts --frente cidades` + `coletar-cidade.mts` por cidade +
  enriquecimento + PicoClaw + guarda. Resultado publicado por pathspec, um
  commit por arquivo de saída (regras 5-6 do AGENTS.md).
- **Paralelização por região** (preferência do dono, ver
  `ROTEIRO-EXECUCAO-PENDENCIAS.md` §7): 5 agentes jcode em paralelo — Norte
  (31 cidades), Nordeste (54), Centro-Oeste (24), Sudeste (54), Sul (38) —
  cada um com `cidades-estrategicas.json` da própria região e arquivos de
  saída distintos. **Proibido** em paralelo: dois agentes no `registry.ts`,
  na guarda de privacidade ou nos `.ps1`.
- **Pausa por domínio**: dois coletores contra o mesmo domínio não são
  paralelo — dividir por fonte, não por mês (pausa ≥ 1 s já é regra).
- **Telegram**: status por rodada (sucesso/falha por fonte, varredura mod-11,
  duração) no canal existente; `/status` e `/andamento` já respondem.

## Fallback Ollama → DeepSeek

Contrato: o wrapper de geração já existe em `lib/assistente/embeddings/`
(`ollama.ts` para `/api/generate`, `provedores.ts`/`geracao.ts` para
`/v1/chat/completions`). O `agente-enriquecimento.mts` implementa a cascata:

1. **Tenta Ollama** (`ollamaDisponivel()`, timeout 30-60 s, modelo config em
   `colibri/colibri-config.json`).
2. **Falhou/timeout/qualidade baixa** → **DeepSeek** (`deepseek-chat`) com o
   mesmo prompt; texto sanitizado (redigir CPF, regra do AGENTS.md) antes de
   qualquer envio remoto.
3. **Ambos falharam** → determinístico (sem modelo) com lacuna declarada —
   nunca fabricar dado nem classificar com chute.

Medição obrigatória antes de fixar o padrão: comparar 10 classificações de
atos "outro" (Ollama vs DeepSeek vs classificador determinístico) e escolher o
padrão com a taxa de concordância em mãos. A regra do repositório manda:
o número vem do dado, o modelo só embrulha — o enriquecimento nunca substitui
a fonte, só preenche lacuna declarada.

## Regras e salvaguardas

- **Guarda mod-11** antes de commitar dado coletado (existente); coletor novo
  que grava JSON por rodada entra em `DIRETORIOS_DADO`.
- **Editorial**: resumo/classificação gerados por modelo são rotulados com
  data e modelo; dois dados verdadeiros lado a lado não viram um terceiro
  falso.
- **Travas do build**: piso de páginas (>1.000), queda relativa (>20%) e teto
  de asset (25 MiB) — não mudar com este plano.
- **Privacidade**: Ollama mantém o texto na máquina; DeepSeek só recebe texto
  já varrido e redigido.
- **IBGE**: casar por código, nunca por nome; 7 dígitos vs 6 dígitos
  (DATASUS/ComunicaBR).
- **Fora da CI**: coleta e enriquecimento rodam no home-pc (banco local), não
  em GitHub Actions.

## Fases de execução

| Fase | Escopo | Bloqueio | Sai quando |
|---|---|---|---|
| **0** | Catálogo `cidades-estrategicas.json` + seeds `0083-0087` dos polos (CNPJ ao vivo, fornecedor da câmara) | runbook-cidade-nova | catálogo validado contra PNCP/Interlegis |
| **1** | Tier 0 nacional em cadência mensal/semanal + fatias por cidade no build | Neon 01/09 destrava banco | fatia de 1 capital de teste |
| **2** | Tier 1 por cidade: SAPL (Interlegis) + diários oficiais via `coletar-cidade.mts` | CNPJ/fornecedor da Fase 0 | 1 cidade piloto do interior (ex.: Campinas ou Uberlândia) |
| **3** | `agente-enriquecimento.mts` (Ollama → DeepSeek) no pipeline | medição das 10 classificações | relatório de concordância |
| **4** | PicoClaw `--cidade` + watches changedetection para portais JS + alerta <70% | — | relatório por cidade no status JSON |
| **5** | Orquestração jcode semanal + workflows n8n versionados | validação de 3 dias das rotinas | n8n espelha os `.ps1` sem divergência |

Ordem de paralelização: Fase 1 e Fase 4 são independentes (arquivos distintos)
e podem rodar juntas; Fase 2 depende da 0; Fase 3 é solo (toca a guarda e o
pipeline).

## Verificação

- Guarda: `python scripts/checar-dado-pessoal-em-dado.py` limpa antes de
  qualquer commit de dado coletado.
- `npx tsc --noEmit -p apps/web` e `npx vitest run` nos testes tocados
  (registry, sem-cpf-no-repo).
- `python scripts/validar-documentacao.py` para docs.
- `npx tsx scripts/rotina-local.mts --listar` mostra o que a cadência do dia
  vai rodar — primeiro comando depois de mexer em workflow.
- Piloto: rodar Fase 1+2 para 1 capital e 1 polo, conferir 3 registros contra
  a fonte e o relatório PicoClaw da cidade antes de escalar para o lote.

## Decisões registradas

- **Reusar a esteira existente** — PicoClaw, `rotina-local.mts`,
  `rotina-coletas.mts` e Colibri continuam sendo a fonte da verdade; jcode e
  n8n só orquestram, não duplicam lógica de coleta.
- **Ollama é o caminho padrão de inferência; DeepSeek é fallback** — privacidade
  e custo zero; a cascata segue o mesmo espírito do degrau 3 do assistente
  (remoto só quando o local falha).
- **Fallback final é determinístico com lacuna declarada** — nunca fabricar
  dado nem rotular chute como fonte.
- **Um agente por arquivo de saída** — paralelização por região respeitando
  as regras 4-6 do AGENTS.md (worktree, pathspec, mensagem por arquivo).
- **Cadência Tier 1 semanal, Tier 0 mensal** — alinhada à cadência das fontes
  e às rotinas já agendadas; nada de coleta diária onde a fonte é mensal.

## Origem / Histórico

Plano derivado da leitura de `PRODUTO.md`, `ESTADO.md`, `OPERACAO.md`,
`PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md`, `ROTEIRO-EXECUCAO-PENDENCIAS.md`,
`HANDOFF-M9-M10-PODMAN.md` e do código (`registry.ts`,
`picoclaw-source-watcher.mts`, `colibri-bridge.mts`, `rotina-coletas.mts`,
`rotina-local.mts`) em 2026-09-01, a pedido do dono para automatizar a coleta
das capitais e municípios grandes do interior via PicoClaw, jcode e Ollama com
fallback via DeepSeek.
