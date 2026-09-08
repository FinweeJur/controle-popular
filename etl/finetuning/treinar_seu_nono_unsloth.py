#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
treinar_seu_nono_unsloth.py

Treinamento QLoRA do Seu Nono 7B (Sabiá-7B) via Unsloth e exportacao direta para GGUF Q4_K_M.
Pode ser executado no Google Colab (GPU T4 gratuita) ou em qualquer maquina com GPU Nvidia (>= 6GB VRAM).

Tempo de execucao estimado:
- Treino (3 epocas, 405 exemplos): 15 a 20 minutos
- Exportacao para GGUF Q4_K_M: 3 a 5 minutos
- Tempo total: ~25 minutos
"""

import os
import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# 1. Configuracao Unsloth
from unsloth import FastLanguageModel

MAX_SEQ_LENGTH = 2048
DTYPE = None # Auto deteta (Float16 ou Bfloat16)
LOAD_IN_4BIT = True  # QLoRA 4-bit para caber em GPU 4GB VRAM

# Modelo Base: Sabiá-7B (Maritaca AI)
MODEL_NAME = "maritaca-ai/sabia-7b"

print(">>> 1/5 Carregando modelo base...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_NAME,
    max_seq_length=MAX_SEQ_LENGTH,
    dtype=DTYPE,
    load_in_4bit=LOAD_IN_4BIT,
)

print(">>> 2/5 Configurando adaptadores LoRA...")
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha=32,
    lora_dropout=0, # Unsloth otimizado com dropout 0
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=3407,
)

print(">>> 3/5 Carregando dataset civico...")
DATASET_PATH = "dataset-seu-nono-v1-expanded.jsonl"
if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(f"Coloque o arquivo {DATASET_PATH} na mesma pasta deste script!")

dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

def formatar_prompt(exemplos):
    textos = []
    for sys, inst, inp, out in zip(exemplos["system"], exemplos["instruction"], exemplos["input"], exemplos["output"]):
        prompt = f"<|im_start|>system\n{sys}<|im_end|>\n<|im_start|>user\n{inst} ({inp})<|im_end|>\n<|im_start|>assistant\n{out}<|im_end|>"
        textos.append(prompt)
    return {"text": textos}

dataset = dataset.map(formatar_prompt, batched=True)

print(">>> 4/5 Iniciando treinamento (3 epocas)...")

def formatting_func(exemplo):
    return exemplo["text"]

trainer = SFTTrainer(
    model=model,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=10,
        num_train_epochs=3,
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=10,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="cosine",
        seed=3407,
        output_dir="outputs_seu_nono",
    ),
    train_dataset=dataset,
    processing_class=tokenizer,
    formatting_func=formatting_func,
)

trainer.train()

print(">>> 5/5 Exportando pesos fundidos diretamente para GGUF Q4_K_M...")
# O Unsloth faz o merge e a quantizacao GGUF automaticamente!
model.save_pretrained_gguf("seu-nono-7b-q4_k_m", tokenizer, quantization_method="q4_k_m")

print("="*60)
print("SUCESSO! O arquivo GGUF foi gerado na pasta 'seu-nono-7b-q4_k_m'.")
print("Basta copiar o arquivo .gguf para a pasta models/seu-nono/ no Controle Popular!")
print("="*60)
