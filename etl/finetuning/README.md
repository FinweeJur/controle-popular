# Fine-Tuning do Seu Nonô 7B (Sabiá / Llama-3-PTBR)

> **Tipo:** GUIA / RUNBOOK  
> **Domínio:** etl / finetuning  
> **Última medição:** 2026-09-07  
> **Relacionados:** `docs/planos/PLANO-DISTILACAO-SABIA-7B-SEU-NONO.md`, `models/seu-nono/Modelfile`

## Sumário

- [Visão Geral](#visão-geral)
- [Arquivos deste Diretório](#arquivos-deste-diretório)
- [Requisitos de Hardware](#requisitos-de-hardware)
- [Como Executar em Máquina Local com GPU Nvidia](#como-executar-em-máquina-local-com-gpu-nvidia)
- [Como Executar no Google Colab (GPU Gratuita T4)](#como-executar-no-google-colab-gpu-gratuita-t4)
- [O que Fazer Após o Término do Treino](#o-que-fazer-após-o-término-do-treino)

---

## Visão Geral

Este diretório contém o pipeline completo para treinar o cérebro local do assistente cívico **Seu Nonô 7B** através da técnica **QLoRA (4-bit)** e empacotá-lo diretamente no formato **GGUF Q4_K_M** para o Ollama.

Tempo total de execução em GPU: **~20 a 25 minutos**.

---

## Arquivos deste Diretório

1. **`dataset-seu-nono-v1.jsonl`**:
   - 405 exemplos de pares instrução-resposta formatados na voz do Seu Nonô.
   - Cobre orçamentos (TJMG, MPMG, DPMG, ICMS/IPVA), bacias do Paraopeba e Rio Doce (Mariana R$ 171 bi, Brumadinho), municípios de MG, barragens e Top Empresas/ESG.
   - Auditado por `scripts/checar-dado-pessoal-em-dado.py` (zero CPF de pessoa real).

2. **`treinar_seu_nono_unsloth.py`**:
   - Script em Python usando a biblioteca **Unsloth** (reduz consumo de VRAM em 70% e acelera o treino em 2x).
   - Treina por 3 épocas com learning rate 2e-4.
   - Faz o merge dos pesos LoRA e quantiza automaticamente para GGUF `q4_k_m`.

---

## Requisitos de Hardware

- **Placa de Vídeo:** GPU Nvidia com no mínimo 6 GB a 8 GB de VRAM (ex: RTX 3060, RTX 4060, T4, A100).
- **Driver:** CUDA 11.8 ou CUDA 12.x.
- *Nota:* Não roda em CPU ou GPU Intel integrada (como a máquina de build local). Por isso o treino deve ser feito em outro PC com placa dedicada ou no Google Colab.

---

## Como Executar em Máquina Local com GPU Nvidia

1. Clone o repositório ou baixe esta pasta:
   ```bash
   git clone https://github.com/FinweeJur/controle-popular.git
   cd controle-popular/etl/finetuning
   ```

2. Instale as dependências:
   ```bash
   pip install --no-deps "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
   pip install --no-deps trl peft accelerate bitsandbytes datasets
   ```

3. Execute o treinamento:
   ```bash
   python treinar_seu_nono_unsloth.py
   ```

4. O arquivo binário quantizado será salvo automaticamente na pasta `seu-nono-7b-q4_k_m/` com o nome `unsloth.Q4_K_M.gguf`.

---

## Como Executar no Google Colab (GPU Gratuita T4)

1. Acesse [Google Colab](https://colab.research.google.com).
2. Clique em **Ambiente de execução** > **Alterar tipo de ambiente de execução** > Selecione **T4 GPU**.
3. Faça upload dos arquivos `dataset-seu-nono-v1.jsonl` e `treinar_seu_nono_unsloth.py`.
4. Em uma célula de código, execute:
   ```bash
   !pip install --no-deps "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
   !pip install --no-deps trl peft accelerate bitsandbytes datasets
   !python treinar_seu_nono_unsloth.py
   ```
5. Ao término, faça o download do arquivo `.gguf` gerado.

---

## O que Fazer Após o Término do Treino

1. Renomeie o arquivo gerado para `seu-nono-7b-q4_k_m.gguf`.
2. Mova o arquivo para a pasta `models/seu-nono/` do repositório Controle Popular:
   ```
   models/seu-nono/seu-nono-7b-q4_k_m.gguf
   ```
3. Registre o modelo no Ollama:
   ```bash
   ollama create seu-nono -f models/seu-nono/Modelfile
   ```
4. Teste a inferência:
   ```bash
   ollama run seu-nono "Qual é o orçamento do TJMG para 2025?"
   ```
