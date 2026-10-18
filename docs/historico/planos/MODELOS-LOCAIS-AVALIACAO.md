# Avaliação de modelos locais (Ollama) — como escolher

> **Arquivado em 18/10/2026** na consolidação de planos. O que restava
> de pendência foi absorvido pelos planos integrados em `docs/planos/`.


> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [PLANO-ORQUESTRACAO-AGENTES-V2.md](/docs/historico/planos/PLANO-ORQUESTRACAO-AGENTES-V2.md), [scripts/avaliar-modelos-locais.py](../../../scripts/avaliar-modelos-locais.py)
> **Palavras-chave:** ollama, modelos-locais, avaliacao, tokens-por-segundo, qwen3, sabia, sabiazinho, bertimbau, gguf, gpu, vram, soberania

## Sumário

- [Propósito](#propósito)
- [Hardware medido](#hardware-medido)
- [Bateria de provas](#bateria-de-provas)
- [Como rodar](#como-rodar)
- [Candidatos e veredito](#candidatos-e-veredito)
- [Bertimbau não é modelo de conversa](#bertimbau-não-é-modelo-de-conversa)
- [Sabiá / Sabiazinho local (GGUF)](#sabiá--sabiazinho-local-gguf)
- [Como decidir](#como-decidir)

## Propósito

Escolher o modelo local por **medição**, não por intuição. A pergunta que o
script responde: qual modelo local entrega a melhor combinação de **qualidade
de resposta** e **tokens por segundo** no hardware do dono, para o papel de
cada bot.

Regra que governa tudo (AGENTS.md §5.15): dado sensível só roda no degrau
local. Por isso o modelo local precisa ser bom de verdade, não simbólico.

## Hardware medido

| Item | Medido (18/10/2026) |
|---|---|
| GPU | NVIDIA GeForce RTX 3050 Laptop — **4 GB VRAM** |
| iGPU | Intel Iris Xe — 2 GB (não usada pelo Ollama) |
| RAM | **15,7 GB** |
| Disco livre | C: 260,8 GB · X: 52,5 GB |

Consequência prática: modelo de 7B–8B em Q4 (~4,5–5 GB) cabe com folga
parcial na VRAM e o resto na RAM; **14B+ fica lento**; MoE grande
(GLM-5.2 744B via colibrì, ~25 GB de RAM) **não cabe** nesta máquina.

## Bateria de provas

Cinco provas, 1 ponto cada; empate desempata por tokens/s:

| Prova | O que mede |
|---|---|
| `json_extracao` | JSON estrito com chaves exigidas (extração de contrato) |
| `aritmetica` | conta multi-passo com resposta exata |
| `tool_call` | formato `{"name","arguments"}` para chamada de ferramenta |
| `brevidade` | obediência de formato (máximo de linhas, sem lista) |
| `recall_contexto` | ler o contexto dado e responder o número certo |

## Como rodar

```bash
python scripts/avaliar-modelos-locais.py                      # todos os instalados
python scripts/avaliar-modelos-locais.py qwen3:8b qwen3-vl:4b  # escolhidos
python scripts/avaliar-modelos-locais.py --out docs/planos/modelos-locais-report.json
```

O script fala só com `127.0.0.1:11434`, usa `temperature=0` e grava relatório
JSON opcional. Nada sai da máquina.

## Candidatos e veredito

| Candidato | Estado (18/10/2026) | Uso indicado |
|---|---|---|
| `qwen3:8b` | **instalado** (5,2 GB) | Secretária pessoal (padrão local) |
| `qwen3-vl:4b-instruct` | instalado (3,3 GB) | triagem e visão, bot Ollama |
| `qwen2.5:3b-instruct` | instalado (1,9 GB) | volume simples |
| `gemma2:2b` | instalado (1,6 GB) | tarefas triviais |
| `sabiazinho-4-br-sp` (API BR) | via OpenCode Go | **fallback** da Secretária |
| Sabiá-7B GGUF local | a importar | candidato forte em PT-BR |
| BERTimbau | não é chat | classificação, NER, embeddings |

## Bertimbau não é modelo de conversa

BERTimbau é **encoder** (só entende, não gera texto). Serve para
classificação, NER e embeddings — por exemplo, etiquetar e-mail e medir
similaridade. Não pode ser o cérebro de um bot: ele não conversa.

## Sabiá / Sabiazinho local (GGUF)

O caminho para rodar Sabiá localmente é GGUF (llama.cpp/Ollama):

1. baixar o GGUF da família Sabiá 7B (Q4_K_M);
2. `ollama create sabia-7b -f Modelfile` apontando para o arquivo;
3. rodar o avaliador: `python scripts/avaliar-modelos-locais.py sabia-7b`;
4. comparar com `qwen3:8b` na mesma bateria antes de promover.

Enquanto isso, `sabiazinho-4-br-sp` (API) cobre o fallback com qualidade BR.

## Medição de 18/10/2026 (RTX 3050 4 GB, 15,7 GB RAM)

| Modelo | Pontos | tok/s | s/requisição | Veredito |
|---|---|---|---|---|
| `qwen3:8b` | 1/5 | **0,8** | 236,6 | **reprovado** — não cabe na VRAM, roda em CPU |
| `qwen3-vl:4b-instruct` | **5/5** | 2,3 | 47,1 | melhor qualidade; lento para uso interativo |
| `qwen2.5:3b-instruct` | 4/5 | **35,3** | **15,0** | **melhor equilíbrio** (padrão local) |
| `gemma2:2b` | 4/5 | 32,5 | 18,4 | aceitável para triagem |

Leitura: o 8B é **44× mais lento** que o 3B e ainda erra 4 de 5 provas — a
VRAM de 4 GB não o comporta e ele cai para a CPU. O 4B acerta tudo, mas
custa ~47 s por resposta. O 3B é o único que junta qualidade suficiente
(4/5) com velocidade de conversa (15 s).

Regra prática tirada da medição:

- **uso interativo da Secretária:** `qwen2.5:3b-instruct`;
- **relatório diário em lote (pode esperar):** `qwen3-vl:4b-instruct`;
- **fallback quando o local não dá conta:** `sabiazinho-4-br-sp` (API BR);
- **nunca** `qwen3:8b` neste hardware.

## Como decidir

1. **Rode a bateria** nos candidatos que couberem no hardware.
2. **Corte por qualidade:** menos de 4/5 pontos não vira cérebro de bot;
   serve para triagem.
3. **Desempate por tokens/s:** mais rápido ganha quando a qualidade empata.
4. **Papel define o mínimo:** Secretária (dado sensível) exige o melhor local
   disponível; triagem aceita o menor.
5. **Registre a medição** aqui com a data — número sem data apodrece.