#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/buscar-cavas.py

Fase 2/4 do plano de cavas — BUSCA kNN POR SIMILARIDADE.

O que faz: carrega o índice gerado por scripts/indexar-cavas.py, codifica
a CONSULTA (uma imagem nova ou um texto livre) no mesmo espaço do
Chinese-CLIP e devolve os k recortes mais parecidos por distância de
cosseno. É a régua de "isto parece uma cava?" antes de qualquer limiar:
o operador vê os vizinhos e julga.

Por que cosseno e não distância euclidiana: os vetores são normalizados
(L2 = 1) na indexação, então produto escalar É cosseno, e a comparação
entre imagem e texto só faz sentido no mesmo espaço — é o desenho do
CLIP. Aqui reportamos as duas leituras do mesmo número:

    cosseno   = q · v        (1.0 = idêntico)
    distância = 1 - cosseno  (0.0 = idêntico)

Fonte do modelo: OFA-Sys/chinese-clip (MIT), pesos locais em
%TEMP%/opencode/cavas/chinese-clip. transformers 5.5: get_image_features()
/get_text_features() devolvem objeto — o embedding está em .pooler_output e
PRECISA de F.normalize (medido pelo Agente B). Só safetensors
(use_safetensors=True); o .bin é inseguro no torch 2.5.1 (CVE-2025-32434).

Auto-exclusão da consulta: se --imagem for um arquivo já indexado, o
rank 1 seria a própria imagem (cosseno 1.0) e não diria nada. Por padrão
ela é pulada e marcada; use --manter-self para ver mesmo assim.

Saída em texto legível (regra do dev: frase curta, número com fonte).
--json devolve o mesmo resultado estruturado para consumo por script.

Exemplos:
    python scripts/buscar-cavas.py --texto "cava de mineração a céu aberto"
    python scripts/buscar-cavas.py --imagem recorte.jpg -k 10
    python scripts/buscar-cavas.py --texto "floresta" --json
"""

import argparse
import json
import sys
import tempfile
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from transformers import ChineseCLIPModel, ChineseCLIPProcessor

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

TMP = Path(tempfile.gettempdir())
DEFAULT_MODELO = TMP / "opencode" / "cavas" / "chinese-clip"
DEFAULT_INDICE = TMP / "opencode" / "cavas" / "indice"

ARQ_VETORES = "vetores.npy"
ARQ_METADADOS = "metadados.json"
ARQ_MANIFESTO = "manifesto.json"


def carregar_indice(indice: Path):
    """Lê vetor + metadados + manifesto e devolve tudo em fp32.

    float16 no disco é decisão do indexador (espacio); aqui reconvertemos
    para fp32 ANTES do produto escalar, para a ordem do ranking não
    herdar arredondamento de meio byte.
    """
    arq_v, arq_m, arq_man = (
        indice / ARQ_VETORES,
        indice / ARQ_METADADOS,
        indice / ARQ_MANIFESTO,
    )
    faltando = [p.name for p in (arq_v, arq_m, arq_man) if not p.exists()]
    if faltando:
        raise SystemExit(
            f"Índice incompleto em {indice} (falta: {', '.join(faltando)}).\n"
            "Gere primeiro: python scripts/indexar-cavas.py"
        )
    manifesto = json.loads(arq_man.read_text(encoding="utf-8"))
    vetores = np.load(arq_v).astype(np.float32)
    metadados = json.loads(arq_m.read_text(encoding="utf-8"))
    if len(vetores) != len(metadados):
        raise SystemExit(
            f"Índice corrompido: {len(vetores)} vetores x "
            f"{len(metadados)} metadados. Reindexe."
        )
    if not len(vetores):
        raise SystemExit("Índice vazio. Reindexe com scripts/indexar-cavas.py.")
    # Re-normaliza na leitura: garante cosseno exato mesmo que algum
    # vetor tenha sido gravado sem normalizar (defesa barata).
    normas = np.linalg.norm(vetores, axis=1, keepdims=True)
    normas[normas == 0] = 1.0
    return vetores / normas, metadados, manifesto


def montar_modelo(dir_modelo: Path, dispositivo):
    """Carrega Chinese-CLIP (só safetensors) + processador.

    Falha alto e em português: erro claro vale mais que traceback.
    """
    dir_modelo = Path(dir_modelo)
    if not (dir_modelo / "model.safetensors").exists():
        raise SystemExit(
            f"model.safetensors não encontrado em {dir_modelo}.\n"
            "O pytorch_model.bin não pode ser usado (CVE-2025-32434)."
        )
    modelo = ChineseCLIPModel.from_pretrained(
        str(dir_modelo), use_safetensors=True
    )
    processador = ChineseCLIPProcessor.from_pretrained(str(dir_modelo))
    modelo.to(dispositivo).eval()
    return modelo, processador


@torch.no_grad()
def vetor_imagem(modelo, processador, caminho: Path, dispositivo):
    """Vetor 512-d de uma imagem de consulta, normalizado (L2)."""
    with Image.open(caminho) as im:
        img = im.convert("RGB")
    pv = processador(images=[img], return_tensors="pt")["pixel_values"]
    pv = pv.to(dispositivo)
    uso_amp = torch.amp.autocast(
        "cuda", dtype=torch.float16, enabled=dispositivo.type == "cuda"
    )
    with uso_amp:
        out = modelo.get_image_features(pixel_values=pv)
    # transformers 5.5: embedding projetado em .pooler_output, sem
    # normalizar — F.normalize é obrigatório para o cosseno significar.
    return F.normalize(out.pooler_output, dim=-1).float().squeeze(0).cpu().numpy()


@torch.no_grad()
def vetor_texto(modelo, processador, texto: str, dispositivo):
    """Vetor 512-d de um texto de consulta, normalizado (L2).

    Mesmo espaço da imagem é que torna "cava a céu aberto" comparável a
    um recorte — é o desenho multimodal do CLIP.
    """
    enc = processador(
        text=[texto], return_tensors="pt", padding=True, truncation=True
    )
    enc = {k: v.to(dispositivo) for k, v in enc.items()}
    uso_amp = torch.amp.autocast(
        "cuda", dtype=torch.float16, enabled=dispositivo.type == "cuda"
    )
    with uso_amp:
        out = modelo.get_text_features(**enc)
    return F.normalize(out.pooler_output, dim=-1).float().squeeze(0).cpu().numpy()


def main():
    ap = argparse.ArgumentParser(
        description=(
            "Busca kNN por similaridade (cosseno) no índice de cavas: "
            "consulta por imagem ou por texto."
        )
    )
    ap.add_argument("--imagem", type=Path, help="caminho do recorte de consulta")
    ap.add_argument("--texto", type=str, help="texto de consulta, ex.: cava a céu aberto")
    ap.add_argument("-k", type=int, default=5, help="quantos vizinhos devolver")
    ap.add_argument("--indice", type=Path, default=DEFAULT_INDICE,
                    help="dir do índice gerado pelo indexar-cavas.py")
    ap.add_argument("--modelo", type=Path, default=DEFAULT_MODELO,
                    help="dir do Chinese-CLIP local (só safetensors)")
    ap.add_argument("--manter-self", action="store_true",
                    help="não pula a própria imagem quando ela está no índice")
    ap.add_argument("--json", action="store_true",
                    help="imprime o resultado como JSON (para script)")
    args = ap.parse_args()

    if bool(args.imagem) == bool(args.texto):
        raise SystemExit("Passe UMA consulta: --imagem OU --texto.")
    if args.imagem and not args.imagem.exists():
        raise SystemExit(f"Imagem de consulta não existe: {args.imagem}")
    if args.k < 1:
        raise SystemExit("-k precisa ser >= 1")

    dispositivo = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    vetores, metadados, manifesto = carregar_indice(args.indice)
    k = min(args.k, len(vetores))

    modelo, processador = montar_modelo(args.modelo, dispositivo)
    if args.texto:
        consulta = vetor_texto(modelo, processador, args.texto, dispositivo)
        rotulo_consulta = args.texto
        tipo_consulta = "texto"
    else:
        consulta = vetor_imagem(modelo, processador, args.imagem, dispositivo)
        rotulo_consulta = str(args.imagem)
        tipo_consulta = "imagem"

    # auto-exclusão: se a consulta é um arquivo indexado, o próprio rank 1
    # seria ela (cosseno 1.0) e não ensinaria nada sobre vizinhança.
    caminho_self = None
    if args.imagem and not args.manter_self:
        alvo = str(args.imagem.resolve())
        for m in metadados:
            if str(Path(m.get("caminho", "")).resolve()) == alvo:
                caminho_self = m["chave"]
                break

    scores = np.clip(vetores @ consulta, -1.0, 1.0)
    # clip em [-1,1]: medido, a consulta sozinha (lote 1) volta cosseno
    # 1.0002 para a própria imagem indexada em lote 16 — a diferença é
    # ruído numérico do forward (ordem de acumulação na GPU), não erro de
    # guarda. Sem clip a saída mostraria cosseno "impossível" > 1.
    ordem = np.argsort(-scores)
    resultados, pulado = [], None
    for linha in ordem:
        linha = int(linha)
        chave = metadados[linha]["chave"]
        if caminho_self is not None and chave == caminho_self:
            pulado = {
                "chave": chave,
                "cosseno": round(float(scores[linha]), 4),
                "motivo": "é a própria consulta (auto-exclusão)",
            }
            continue
        resultados.append(
            {
                "rank": len(resultados) + 1,
                "cosseno": round(float(scores[linha]), 4),
                "distancia": round(1.0 - float(scores[linha]), 4),
                **metadados[linha],
            }
        )
        if len(resultados) >= k:
            break

    if args.json:
        print(
            json.dumps(
                {
                    "consulta": {"tipo": tipo_consulta, "valor": rotulo_consulta},
                    "indice": str(args.indice),
                    "n_indexado": len(vetores),
                    "k": k,
                    "pulado": pulado,
                    "resultados": resultados,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return

    # ---- saída humana: colunas alinhadas, uma ideia por linha ----
    n_pos = sum(1 for m in metadados if m["tipo"] == "positivo")
    print(f"Consulta ({tipo_consulta}): {rotulo_consulta}")
    print(
        f"Índice: {len(vetores)} recortes ({n_pos} positivo / "
        f"{len(vetores) - n_pos} negativo) em {args.indice}"
    )
    print(f"Modelo: {manifesto.get('modelo', '?')} | pesos safetensors")
    print("distância = 1 - cosseno; 0.000 = idêntico.")
    if pulado:
        print(
            f"Pulado: {pulado['chave']} (cosseno {pulado['cosseno']:.4f}) — "
            f"{pulado['motivo']}."
        )
    if not resultados:
        print("Nenhum vizinho.")
        return
    print()
    cab = (
        f"{'#':>2} | {'cosseno':>7} | {'dist':>6} | {'tipo':9s} | "
        f"{'data':10s} | {'nuvem':>5} | {'processo':16s} | arquivo"
    )
    print(cab)
    print("-" * len(cab))
    for r in resultados:
        print(
            f"{r['rank']:>2} | {r['cosseno']:>7.4f} | {r['distancia']:>6.4f} | "
            f"{r['tipo']:9s} | {r['data'] or '-':10s} | "
            f"{r.get('nuvem', 0):>5.3f} | {r.get('processo') or '-':16s} | "
            f"{r['arquivo']}"
        )
    print()
    pos = sum(1 for r in resultados if r["tipo"] == "positivo")
    print(
        f"Resumo: {pos}/{len(resultados)} vizinhos são positivos. "
        "Isto é sanidade, não acurácia — a régua de qualidade é o "
        "holdout por cena do zero-shot."
    )


if __name__ == "__main__":
    main()
