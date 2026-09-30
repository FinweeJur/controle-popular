#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/treinar-cavas-chinese-clip.py

Fine-tune do Chinese-CLIP (OFA-Sys/chinese-clip, MIT) para classificar
recortes de satélite 512x512 em "cava de mineração" (1) vs
"sem mineração" (0). Fase 2 do plano de rastreamento de cavas.

REGRA DE OURO DO SPLIT — POR CENA, NUNCA ALEATÓRIO POR IMAGEM:

    A separação treino/validação é feita pelo campo "cena" do
    checkpoint.jsonl (ex.: CBERS_4A_WPM_20260912_196_136_L2).
    Recortes da mesma cena se parecem — mesma luz, mesmo dia, mesmo
    sensor — e vazariam a validação se as imagens fossem embaralhadas
    à toa. A validação só vale alguma coisa quando a cena inteira foi
    vedada do treino.

    Com poucas cenas (< 8) o split vira "last-scene-out": uma única
    cena (a que cobre mais classes) fica de fora, com aviso de que a
    estimativa é frágil. Com 1 cena só, o script recusa rodar — não há
    split por cena válido, e split aleatório por imagem é proibido.

O que este script faz:
  - lê checkpoint.jsonl + JPGs (valida nuvem <= 0.20; 1=positivo,
    0=negativo) UMA VEZ SÓ, no início do processo. Esse é o SNAPSHOT:
    a coleta de negativos roda em paralelo com o treino e o disco
    cresce sob os pés do script; reler o jsonl no meio do caminho
    faria o holdout e o treino mudarem de composição sem ninguém ver;
  - confere a integridade dos JPGs do snapshot (abre e decodifica cada
    um, ~8 s para 2,1 mil imagens): um JPEG meio-escrito pela coleta
    paralela derrubaria o treino na metade da época;
  - split por cena (acima) FIXADO em
    scripts/.cache/cavas-treino/split.json — o holdout vira lista
    fechada de arquivos e o treino aceita os recortes novos da coleta,
    desde que não sejam de cena do holdout (vedação por cena). Sem
    esse arquivo, uma reexecução com --so-avaliar mediria num holdout
    diferente do usado no treino (a coleta teria crescido) e a
    comparação seria fraude sem querer;
  - aumento de dados (flip H/V, rotação 90°, zoom leve) só no treino;
  - fine-tune com fp16/AMP, batch pequeno + gradient accumulation,
    LR cosine com warmup, early stop por F1 de validação;
  - estratégia de desbalanceamento (~18 positivos para cada negativo,
    a questão central destes dados) via --estrategia:
      * peso        — BCEWithLogitsLoss(pos_weight = neg/pos): a
                      classe maioria (positivo) pesa neg/pos dentro do
                      loss, igualando a contribuição total das duas
                      classes sem repetir imagem nenhuma;
      * sobreamostragem — WeightedRandomSampler com peso 1/n_classe:
                      cada época sorteia metade positivos e metade
                      negativos (os ~70 negativos são re-vistos ~12×
                      por época, cada vez com aumento aleatório);
      * nenhuma     — loss puro, controle do experimento;
  - checkpoint em Temp (nunca no repo), resumível com --continuar;
  - avaliação no holdout: curva precisão×recall varrendo o limiar de
    decisão de 0,05 a 0,95 (passo 0,01, salva inteira em
    metricas.json); o limiar é escolhido AUTOMATICAMENTE com duas
    portas: precisão >= 70% (o gate do plano) e, dentro dela, a MAIOR
    ACURÁCIA BALANCEADA (a regra de "maior recall" puro escolhia o
    limiar trivial que chama tudo de cava — medição 28/09); matriz de
    confusão impressa no limiar escolhido e no 0,5;
  - linha de base zero-shot (par de textos B, o mesmo medido pelo
    Agente B) calculada no MESMO holdout com os pesos BASE do modelo —
    antes de qualquer fine-tune tocar nos pesos — para a comparação
    ser justa.

Pesos: só model.safetensors (o pytorch_model.bin NÃO pode ser lido com
torch.load no torch 2.5.1 — CVE-2025-32434). O script recusa rodar sem
o safetensors.

Compatibilidade transformers 5.5.0 (medido nesta máquina):
  - ChineseCLIPModel / ChineseCLIPProcessor existem e carregam;
  - get_image_features() devolve BaseModelOutputWithPooling com
    pooler_output JÁ projetado em 512 dim (sem normalizar);
  - tokenizer vem de vocab.txt no mesmo diretório (sem ele, o
    vocabulário cai para 5 tokens e tudo vira [UNK]).

Exemplos:
    # smoke test (2 épocas, poucos recortes)
    python scripts/treinar-cavas-chinese-clip.py --epocas 2 --batch 4

    # treino real, estratégia de pesos (default)
    python scripts/treinar-cavas-chinese-clip.py --epocas 8 --batch 4 \
        --acum 2 --lr 2e-5 --saida <dir em Temp>

    # mesmo treino, competindo com sobreamostragem dos negativos
    python scripts/treinar-cavas-chinese-clip.py --epocas 8 --batch 4 \
        --acum 2 --lr 2e-5 --estrategia sobreamostragem --saida <dir>

    # retomar de onde parou
    python scripts/treinar-cavas-chinese-clip.py --epocas 8 --continuar

    # só avaliar o melhor checkpoint no holdout (split lido do split.json)
    python scripts/treinar-cavas-chinese-clip.py --sem-treino
"""

import argparse
import gc
import json
import math
import random
import sys
import tempfile
import time
from collections import defaultdict
from pathlib import Path

# Nota de ambiente (medido nesta máquina): o torch 2.5.1 de Windows NÃO
# aceita PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True (é Linux) —
# setar aqui só imprime UserWarning. O alívio real para a fragmentação
# nesta GPU de 4 GiB compartilhada é empty_cache() nos caminhos de OOM.

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler
from transformers import ChineseCLIPModel, ChineseCLIPProcessor
from transformers.optimization import get_cosine_schedule_with_warmup

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

ALVO_PRECISAO = 0.70  # gate do plano: precisão >= 70% no holdout
NUVEM_MAX = 0.20
MIN_CENAS_SPLIT = 8  # abaixo disso, last-scene-out com aviso

TMP = Path(tempfile.gettempdir())
DEFAULT_MODELO = TMP / "opencode" / "cavas" / "chinese-clip"
DEFAULT_SAIDA = TMP / "opencode" / "cavas" / "treino-cavas"
DEFAULT_DADOS = (
    Path(__file__).resolve().parent.parent
    / "scripts" / ".cache" / "cavas-calibracao"
)
# Único arquivo novo que este script escreve dentro do repo: o split
# fixo. Fica em .cache (não versionado) e é o que impede o holdout de
# mudar quando a coleta paralela de negativos cresce.
SPLIT_PADRAO = (
    Path(__file__).resolve().parent.parent
    / "scripts" / ".cache" / "cavas-treino" / "split.json"
)

# Par de textos B — a linha de base zero-shot medida pelo Agente B
# (F1 0,923 num holdout pequeno). USAR OS MESMOS TEXTOS aqui, senão a
# comparação fine-tune × zero-shot não vale nada.
TEXTO_ZERO_SHOT_B = {
    "nome": "B: solo-exposto x cobertura-vegetal",
    "positivos": [
        "solo exposto cavado por máquinas, áreas mineradas",
        "terra movimentada, taludes, poços de mineração",
    ],
    "negativos": [
        "campo verde, pastagem, cobertura vegetal contínua",
        "lavoura ordenada, vegetação saudável",
    ],
}


# ---------------------------------------------------------------- dados ----

def carregar_registros(dados: Path, nuvem_max: float = NUVEM_MAX):
    """Lê checkpoint.jsonl + confere os JPGs. Retorna lista de dicts.

    SNAPSHOT: lê o jsonl UMA vez, na chamada. A coleta de negativos
    roda em paralelo e só acrescenta linhas — quem chama esta função no
    início do processo fica com a amostra congelada daquele instante.
    """
    ckp = dados / "checkpoint.jsonl"
    if not ckp.exists():
        raise SystemExit(
            f"checkpoint.jsonl não encontrado em {dados}\n"
            "Passe --dados com o diretório que contém checkpoint.jsonl "
            "e recortes/{positivo,negativo}/."
        )
    registros, sem_arquivo, sem_cena = [], 0, 0
    descartados_nuvem, tipos_ruins = 0, 0
    with open(ckp, encoding="utf-8") as f:
        for linha in f:
            linha = linha.strip()
            if not linha:
                continue
            r = json.loads(linha)
            tipo = r.get("tipo")
            if tipo not in ("positivo", "negativo"):
                tipos_ruins += 1
                continue
            nuvem = r.get("nuvem")
            nuvem = 0.0 if nuvem is None else float(nuvem)
            if nuvem > nuvem_max:
                descartados_nuvem += 1
                continue
            nome = r.get("arquivo")
            caminho = dados / "recortes" / tipo / (nome or "")
            if not nome or not caminho.exists():
                sem_arquivo += 1
                continue
            cena = r.get("cena")
            if not cena:
                sem_cena += 1
                cena = f"SEM-CENA/{r.get('hash', nome)}"
            registros.append(
                {
                    "arquivo": str(caminho),
                    "rotulo": 1 if tipo == "positivo" else 0,
                    "cena": cena,
                    "tipo": tipo,
                    "nuvem": nuvem,
                    "hash": r.get("hash", ""),
                }
            )
    if not registros:
        raise SystemExit(
            f"Nenhum recorte válido em {dados} "
            f"(sem_arquivo={sem_arquivo}, nuvem>{nuvem_max}={descartados_nuvem})."
        )
    n_pos = sum(1 for r in registros if r["rotulo"] == 1)
    n_neg = len(registros) - n_pos
    print(
        f"Dados: {len(registros)} recortes "
        f"(positivo={n_pos}, negativo={n_neg}) em {dados}"
    )
    if descartados_nuvem:
        print(f"  descartados por nuvem > {nuvem_max}: {descartados_nuvem}")
    if sem_arquivo:
        print(f"  descartados por JPG ausente: {sem_arquivo}")
    if tipos_ruins:
        print(f"  descartados por tipo inesperado: {tipos_ruins}")
    if sem_cena:
        print(
            f"  AVISO: {sem_cena} sem campo 'cena' — cada um vira cena "
            "única (pior que cena verdadeira, mas nunca mistura imagem "
            "com cena de outro dia)"
        )
    if n_pos == 0 or n_neg == 0:
        print(
            f"  AVISO: só há uma classe ({'positivo' if n_pos else 'negativo'}). "
            "Métricas de precisão não significam nada com uma classe só."
        )
    return registros


def validar_integridade(registros):
    """Abre e decodifica cada JPG do snapshot; devolve só os íntegros.

    POR QUÊ: a coleta de negativos está gravando em paralelo. Entre o
    jsonl e o disco pode existir um JPEG ainda meio-escrito; ele passa
    pela checagem de existência (só testa Path.exists) e estoura no
    meio da época, perdendo o trabalho. Custo medido: ~8 s para 2,1
    mil imagens de 512x512 — barato perto de 8 épocas de treino.
    """
    quebrados, ok = [], 0
    t0 = time.time()
    for r in registros:
        try:
            img = Image.open(r["arquivo"])
            img.load()          # decodifica de verdade, não só o cabeçalho
            img.close()
            ok += 1
        except Exception as e:  # noqa: BLE001 — qualquer erro de PIL derruba o treino
            quebrados.append((r["arquivo"], str(e)))
    if quebrados:
        print(f"  AVISO: {len(quebrados)} JPG(s) ilegível(is) fora do snapshot:")
        for caminho, erro in quebrados[:5]:
            print(f"    {Path(caminho).name}: {erro}")
        print("  (provável arquivo meio-escrito pela coleta paralela)")
    print(
        f"Integridade do snapshot: {ok}/{len(registros)} JPGs decodificados "
        f"em {time.time() - t0:.1f}s"
    )
    if ok == 0:
        raise SystemExit("Nenhum JPG íntegro — snapshot inutilizável.")
    if not quebrados:
        return registros
    ruins = {q[0] for q in quebrados}
    return [r for r in registros if r["arquivo"] not in ruins]


def split_por_cena(registros, frac_val=0.2, seed=42):
    """REGRA DE OURO: split POR CENA, nunca aleatório por imagem.

    cenas >= MIN_CENAS_SPLIT: holdout por cena (~frac_val das cenas,
        com cobertura das duas classes dos dois lados quando os dados
        permitem).
    2..MIN_CENAS_SPLIT-1 cenas: last-scene-out — uma cena (a que cobre
        mais classes) fica de fora; estimativa frágil, aviso incluso.
    1 cena: recusa (não existe split por cena válido).

    Retorna (idx_treino, idx_val, info).
    """
    por_cena = defaultdict(list)
    for i, r in enumerate(registros):
        por_cena[r["cena"]].append(i)
    cenas = sorted(por_cena)
    rng = random.Random(seed)
    rng.shuffle(cenas)
    rotulo_cena = {
        c: {registros[i]["rotulo"] for i in por_cena[c]} for c in cenas
    }
    classes = sorted({r["rotulo"] for r in registros})
    n = len(registros)

    if len(cenas) < 2:
        raise SystemExit(
            "Só existe 1 cena nos dados. A regra de ouro proíbe split "
            "aleatório por imagem (a validação vazaria). Colete cenas "
            "novas antes de treinar."
        )

    avisos = []
    if len(cenas) < MIN_CENAS_SPLIT:
        # last-scene-out: a cena que cobre mais classes fica de fora
        ordem = list(cenas)  # já embaralhada pelo seed
        val_c = {max(ordem, key=lambda c: (len(rotulo_cena[c]), ordem.index(c)))}
        avisos.append(
            f"só {len(cenas)} cenas (< {MIN_CENAS_SPLIT}) — last-scene-out: "
            f"cena {sorted(val_c)[0]} fica de fora; a estimativa de "
            "validação é frágil"
        )
    else:
        alvo = max(1, round(frac_val * n))
        val_c = set()

        def cobertura(excluidos):
            s = set()
            for c in excluidos:
                s |= rotulo_cena[c]
            return s

        # fase 1: garantir as duas classes na validação, sem esvaziar o
        # treino de nenhuma classe
        for cl in classes:
            if any(cl in rotulo_cena[c] for c in val_c):
                continue
            for c in cenas:
                if c in val_c or cl not in rotulo_cena[c]:
                    continue
                resto = [x for x in cenas if x != c and x not in val_c]
                if not resto or cl not in cobertura(resto):
                    continue
                val_c.add(c)
                break
        # fase 2: encher até a fração alvo mantendo o treino completo
        for c in cenas:
            if sum(len(por_cena[x]) for x in val_c) >= alvo:
                break
            if c in val_c:
                continue
            resto = [x for x in cenas if x != c and x not in val_c]
            if not resto or not set(classes) <= cobertura(resto):
                continue
            val_c.add(c)

    idx_val = sorted(i for c in val_c for i in por_cena[c])
    idx_treino = sorted(i for c in cenas if c not in val_c for i in por_cena[c])
    if not idx_val or not idx_treino:
        raise SystemExit("Split por cena gerou treino ou validação vazio.")

    def conta(idx):
        pos = sum(1 for i in idx if registros[i]["rotulo"] == 1)
        return pos, len(idx) - pos

    tp, tn = conta(idx_treino)
    vp, vn = conta(idx_val)
    for lado, (p, g) in (("treino", (tp, tn)), ("validação", (vp, vn))):
        if p == 0 or g == 0:
            avisos.append(f"{lado} ficou com uma classe só ({p} pos / {g} neg)")
    info = {
        "cenas_total": len(cenas),
        "cenas_treino": len(cenas) - len(val_c),
        "cenas_val": len(val_c),
        "n_treino": len(idx_treino),
        "n_val": len(idx_val),
        "treino_pos": tp,
        "treino_neg": tn,
        "val_pos": vp,
        "val_neg": vn,
        "seed": seed,
        "frac_val": frac_val,
        "cenas_val_lista": sorted(val_c),
        "avisos": avisos,
    }
    print(
        f"Split POR CENA: treino {info['n_treino']} imgs / "
        f"{info['cenas_treino']} cenas ({tp} pos, {tn} neg) | "
        f"validação {info['n_val']} imgs / {info['cenas_val']} cenas "
        f"({vp} pos, {vn} neg) [seed={seed}]"
    )
    for a in avisos:
        print(f"  AVISO: {a}")
    return idx_treino, idx_val, info


# ------------------------------------------- split fixo (split.json) ----

def _relativo(registros, i):
    """Chave estável de um recorte: 'positivo/hash.jpg' (sem caminho absoluto)."""
    r = registros[i]
    return f"{r['tipo']}/{Path(r['arquivo']).name}"


def salvar_split(caminho: Path, registros, idx_treino, idx_val, info):
    """Grava o split por cena: lista FECHADA do holdout (o treino cresce).

    POR QUÊ: a coleta de negativos está rodando AGORA, em paralelo.
    Sem este arquivo, o próximo --so-avaliar releria o jsonl já
    crescendo, recalcularia outro holdout e publicaria uma métrica em
    um conjunto que o treino nem viu — número bonito e sem significado.
    A lista de treino também é gravada, mas como PROVENIÊNCIA: quem
    decide o treino depois é a regra "todo o resto que não é cena de
    holdout" (ver carregar_split).
    """
    doc = {
        "versao": 1,
        "criado_em": time.strftime("%Y-%m-%d %H:%M:%S"),
        "motivo": (
            "holdout imutável: a coleta de negativos cresce em paralelo; "
            "sem esta lista o holdout mudaria entre execuções"
        ),
        "seed": info.get("seed"),
        "frac_val": info.get("frac_val"),
        "info": info,
        "treino": [_relativo(registros, i) for i in idx_treino],
        "val": [_relativo(registros, i) for i in idx_val],
    }
    caminho = Path(caminho)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(
        json.dumps(doc, indent=1, ensure_ascii=False), encoding="utf-8"
    )
    print(
        f"Split fixado em {caminho} "
        f"({len(doc['treino'])} treino / {len(doc['val'])} holdout)"
    )


def carregar_split(caminho: Path, registros):
    """Lê split.json: holdout FIXO, treino que CRESCE com a coleta.

    Regra que resolve o impasse entre "holdout não pode mudar" e "os
    negativos novos não podem ser jogados fora":

      * holdout = exatamente a lista de arquivos do arquivo, sem
        acrescentar nem tirar ninguém;
      * treino  = todo o resto do snapshot, EXCETO recorte de cena que
        esteja no holdout (vedação por cena — sem ela, um negativo
        novo colhido numa cena de holdout iria treinar o modelo a
        acertar a prova);

    Assim a coleta paralela só fortalece o treino e nunca contamina a
    avaliação. Recortes do holdout que sumiram do disco viram aviso;
    saída dura se o holdout ou o treino ficar vazio ou sem uma classe.
    """
    doc = json.loads(Path(caminho).read_text(encoding="utf-8"))
    indice = {}
    for i, r in enumerate(registros):
        indice.setdefault(_relativo(registros, i), i)
    val_lista = doc.get("val", [])
    val_set = set(val_lista)
    faltando = [x for x in val_lista if x not in indice]
    idx_val = sorted({indice[x] for x in val_lista if x in indice})
    if not idx_val:
        raise SystemExit(
            f"split.json ({caminho}) sem nenhum arquivo do holdout "
            "presente no snapshot — não dá para avaliar. Apague o "
            "split.json para remontar o split (o holdout será outro)."
        )
    # vedações de cena: cenas do holdout nunca entram no treino
    cenas_val = set(doc.get("info", {}).get("cenas_val_lista", []))
    cenas_val |= {registros[i]["cena"] for i in idx_val}
    idx_treino, por_cena_vetada, no_treino_novo = [], 0, 0
    treino_salvo = set(doc.get("treino", []))
    for i in range(len(registros)):
        rel = _relativo(registros, i)
        if rel in val_set:
            continue
        if registros[i]["cena"] in cenas_val:
            por_cena_vetada += 1
            continue
        idx_treino.append(i)
        if rel not in treino_salvo:
            no_treino_novo += 1
    if not idx_treino:
        raise SystemExit(
            f"split.json ({caminho}) deixou o treino vazio — remonte o split."
        )
    info = dict(doc.get("info", {}))

    def conta(idx):
        p = sum(1 for i in idx if registros[i]["rotulo"] == 1)
        return p, len(idx) - p

    tp, tn = conta(idx_treino)
    vp, vn = conta(idx_val)
    cenas_t = {registros[i]["cena"] for i in idx_treino}
    cenas_v = {registros[i]["cena"] for i in idx_val}
    info.update({
        "cenas_treino": len(cenas_t), "cenas_val": len(cenas_v),
        "n_treino": len(idx_treino), "n_val": len(idx_val),
        "treino_pos": tp, "treino_neg": tn,
        "val_pos": vp, "val_neg": vn,
        "cenas_val_lista": sorted(cenas_v),
        "arquivo_split": str(Path(caminho)),
        "holdout_fixo": True,
    })
    print(
        f"Split FIXO lido de {caminho} (criado em {doc.get('criado_em')}): "
        f"treino {len(idx_treino)} imgs / {len(cenas_t)} cenas "
        f"({tp} pos, {tn} neg) | holdout {len(idx_val)} imgs / "
        f"{len(cenas_v)} cenas ({vp} pos, {vn} neg)"
    )
    if faltando:
        print(f"  AVISO: {len(faltando)} arquivo(s) do holdout sumiram do "
              "snapshot — o holdout encolheu")
    if no_treino_novo:
        n_pos = sum(1 for i in idx_treino
                    if _relativo(registros, i) not in treino_salvo
                    and registros[i]["rotulo"] == 1)
        print(
            f"  coleta que cresceu: {no_treino_novo} recorte(s) novo(s) "
            f"entraram no TREINO ({n_pos} pos, "
            f"{no_treino_novo - n_pos} neg); holdout intocado"
        )
    if por_cena_vetada:
        print(
            f"  {por_cena_vetada} recorte(s) de cena do holdout ficaram "
            "FORA do treino (vedação por cena)"
        )
    if vp == 0 or vn == 0 or tp == 0 or tn == 0:
        raise SystemExit(
            f"split.json sem uma classe de um lado (treino {tp}/{tn}, "
            f"holdout {vp}/{vn}) — remonte o split."
        )
    return idx_treino, idx_val, info


def aplicar_split(registros, caminho_split, frac_val, seed):
    """Split fixo se o arquivo existir; senão calcula POR CENA e grava.

    É a porta de entrada única do split: todo caminho (treino,
    --so-avaliar) passa por aqui, para que treino e avaliação falem
    sempre do mesmo conjunto.
    """
    caminho_split = Path(caminho_split)
    if caminho_split.exists():
        return carregar_split(caminho_split, registros)
    idx_treino, idx_val, info = split_por_cena(
        registros, frac_val=frac_val, seed=seed
    )
    salvar_split(caminho_split, registros, idx_treino, idx_val, info)
    info["arquivo_split"] = str(caminho_split)
    return idx_treino, idx_val, info


# ------------------------------------------------------------ métricas ----

def calcular_metricas(y_verdadeiro, y_probabilidade, limiar=0.5):
    y_true = np.asarray(y_verdadeiro, dtype=int)
    y_prob = np.asarray(y_probabilidade, dtype=float)
    y_pred = (y_prob >= limiar).astype(int)
    tp = int(((y_pred == 1) & (y_true == 1)).sum())
    fp = int(((y_pred == 1) & (y_true == 0)).sum())
    fn = int(((y_pred == 0) & (y_true == 1)).sum())
    tn = int(((y_pred == 0) & (y_true == 0)).sum())
    precisao = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precisao * recall / (precisao + recall)
          if (precisao + recall) else 0.0)
    n = len(y_true)
    acuracia = (tp + tn) / n if n else 0.0
    return {
        "n": n,
        "positivos": int(y_true.sum()),
        "limiar": float(limiar),
        "precisao": precisao,
        "recall": recall,
        "f1": f1,
        "acuracia": acuracia,
        "tp": tp, "fp": fp, "fn": fn, "tn": tn,
    }


def curva_precisao_recall(y_verdadeiro, y_probabilidade, alvo=ALVO_PRECISAO,
                          inicio=0.05, fim=0.95, passo=0.01):
    """Curva precisão×recall varrendo o limiar de decisão 0,05→0,95.

    Devolve a curva INTEIRA (91 pontos, passo 0,01) e o limiar
    escolhido. Duas portas em sequência (regra de 28/09):

      1. PRECISÃO >= alvo (70%) — a trava do dev do plano, sem ela
         nada entra;
      2. dentro da trava, MAIOR ACURÁCIA BALANCEADA — média do recall
         de positivos e de negativos —, desempate por maior recall.

    Por que a porta 2 existe: com o holdout de 95,5% positivo (medição
    de 28/09), "maior recall" puro escolhia o limiar 0,05, que chama
    TODO MUNDO de cava — precisão 0,955 "passa" no gate só por causa da
    base rate, e o modelo não aprendeu nada. A acurácia balanceada dá
    0,5 nesse classificador trivial e 0,68 num limiar que separa de
    verdade (medição: 8 de 21 negativos acertados em 0,5), então ela
    empurra a escolha para onde existe sinal de separação. Escolher F1
    solto ignoraria a trava do dev; escolher recall solto repete o
    bug do trivial.

    Se NENHUM limiar cumpre a trava, devolve limiar_escolhido=None:
    gate não passou em lugar nenhum da curva (é um resultado, não um
    bug — o relatório precisa mostrar isso).

    AVISO de método: o limiar é escolhido no próprio holdout, que é o
    conjunto usado para reportar a métrica. Isso otimista o número
    (seleção no teste). O caminho correto, quando houver dados para
    isso, é calibrar o limiar numa validação e medir no-teste.
    """
    pontos, melhor = [], None
    n = int(round((fim - inicio) / passo))
    for k in range(n + 1):
        l = round(inicio + k * passo, 2)
        m = calcular_metricas(y_verdadeiro, y_probabilidade, limiar=l)
        pontos.append({c: m[c] for c in
                       ("limiar", "precisao", "recall", "f1", "acuracia",
                        "tp", "fp", "fn", "tn")})
        if m["precisao"] >= alvo:
            # acurácia balanceada: (recall_pos + recall_neg) / 2
            rec_pos = (m["tp"] / (m["tp"] + m["fn"])) if (m["tp"] + m["fn"]) else 0.0
            rec_neg = (m["tn"] / (m["tn"] + m["fp"])) if (m["tn"] + m["fp"]) else 0.0
            bal = (rec_pos + rec_neg) / 2
            chave = (round(bal, 6), m["recall"], m["precisao"])
            if melhor is None or chave > melhor["chave"]:
                melhor = {"limiar": m["limiar"], "recall": m["recall"],
                          "precisao": m["precisao"],
                          "acuracia_balanceada": round(bal, 4),
                          "chave": chave}
    if melhor:
        melhor.pop("chave")
    return {
        "alvo_precisao": alvo,
        "intervalo": [inicio, fim],
        "passo": passo,
        "n_pontos": len(pontos),
        "curva": pontos,
        "limiar_escolhido": melhor,
    }


def imprimir_curva(curva, a_cada=0.05):
    """Imprime a curva a cada `a_cada` (a inteira fica em metricas.json)."""
    print(f"  curva precisão×recall ({curva['n_pontos']} pontos de "
          f"{curva['intervalo'][0]:.2f} a {curva['intervalo'][1]:.2f}, "
          f"impressa a cada {a_cada:.2f}):")
    print("    limiar  precisão  recall     F1    tp/fp/fn/tn")
    for p in curva["curva"]:
        if abs(round(p["limiar"] / a_cada) * a_cada - p["limiar"]) > 1e-9:
            continue
        print(f"    {p['limiar']:5.2f}   {p['precisao']:7.3f}  "
              f"{p['recall']:6.3f}  {p['f1']:5.3f}  "
              f"{p['tp']}/{p['fp']}/{p['fn']}/{p['tn']}")


def avaliar_holdout(reais, probs, limiar_fixo, titulo):
    """Fecha a avaliação do holdout: limiar fixo, curva PR e limiar do gate.

    Três leituras da mesma predição, de propósito:
      1. no limiar fixo (0,5 por padrão) — régua simples, comparável
         com qualquer outro trabalho;
      2. a curva inteira 0,05→0,95 — para o leitor ver o trade-off
         precisão×recall sem acreditar na palavra de ninguém;
      3. no limiar ESCOLHIDO (precisão >= 70% + maior acurácia
         balanceada — regra de 28/09, ver curva_precisao_recall) — é
         ele que responde o gate do plano.

    Retorna (metricas_limiar_fixo, curva, metricas_limiar_escolhido,
    gate) e imprime tudo, com matriz de confusão nos dois limiares.
    """
    m_fixo = calcular_metricas(reais, probs, limiar=limiar_fixo)
    imprimir_metricas(m_fixo, f"{titulo} · limiar fixo {limiar_fixo:.2f}")
    curva = curva_precisao_recall(reais, probs)
    imprimir_curva(curva)
    escolhido = curva["limiar_escolhido"]
    if escolhido is None:
        print(
            f"  LIMIAR ESCOLHIDO: nenhum — nenhum limiar de "
            f"{curva['intervalo'][0]:.2f} a {curva['intervalo'][1]:.2f} "
            f"cumpre precisão >= {ALVO_PRECISAO:.0%}"
        )
        return m_fixo, curva, None, "NÃO PASSOU"
    m_lim = calcular_metricas(reais, probs, limiar=escolhido["limiar"])
    gate = imprimir_metricas(
        m_lim, f"{titulo} · LIMIAR ESCOLHIDO {escolhido['limiar']:.2f}"
    )
    print(
        f"  limiar escolhido {escolhido['limiar']:.2f} = maior acurácia "
        f"balanceada ({escolhido['acuracia_balanceada']:.3f}) entre os que "
        f"cumprem precisão >= {ALVO_PRECISAO:.0%} (aqui "
        f"{escolhido['precisao']:.3f}, recall {escolhido['recall']:.3f})"
    )
    return m_fixo, curva, m_lim, gate


def imprimir_metricas(m, titulo, alvo=ALVO_PRECISAO):
    gate = "PASSOU" if m["precisao"] >= alvo else "NÃO PASSOU"
    print(f"=== {titulo} (n={m['n']}, limiar={m['limiar']:.2f}) ===")
    print(f"  precisão : {m['precisao']:.3f}  [gate >= {alvo:.2f}] {gate}")
    print(f"  recall   : {m['recall']:.3f}")
    print(f"  F1       : {m['f1']:.3f}")
    print(f"  acurácia : {m['acuracia']:.3f}")
    print("  matriz de confusão (linhas=real, colunas=previsto):")
    print(f"              prev_pos  prev_neg")
    print(f"    real_pos  {m['tp']:8d}  {m['fn']:8d}")
    print(f"    real_neg  {m['fp']:8d}  {m['tn']:8d}")
    return gate


# ------------------------------------------------------------- modelo ----

def carregar_modelo(dir_modelo: Path, dispositivo):
    dir_modelo = Path(dir_modelo)
    safetensors = dir_modelo / "model.safetensors"
    if not safetensors.exists():
        raise SystemExit(
            f"model.safetensors não encontrado em {dir_modelo}.\n"
            "O pytorch_model.bin não pode ser usado (CVE-2025-32434 no "
            "torch 2.5.1). Baixe o safetensors com curl, ex.:\n"
            "  curl -L -o model.safetensors "
            "https://huggingface.co/OFA-Sys/chinese-clip-vit-base-patch16/"
            "resolve/main/model.safetensors"
        )
    modelo = ChineseCLIPModel.from_pretrained(
        str(dir_modelo), use_safetensors=True
    )
    processador = ChineseCLIPProcessor.from_pretrained(str(dir_modelo))
    if len(processador.tokenizer) < 1000:
        raise SystemExit(
            f"Tokenizer inválido em {dir_modelo} "
            f"(vocab={len(processador.tokenizer)}). Falta o vocab.txt:\n"
            "  curl -L -o vocab.txt "
            "https://huggingface.co/OFA-Sys/chinese-clip-vit-base-patch16/"
            "resolve/main/vocab.txt"
        )
    modelo.to(dispositivo)
    return modelo, processador


def congelar_texto(modelo):
    """Congela o text tower (decisão do plano: fp16 + congelar texto).

    Retorna a contagem de parâmetros congelados.
    """
    n_cong = 0
    for p in modelo.text_model.parameters():
        p.requires_grad_(False)
        n_cong += p.numel()
    for p in modelo.text_projection.parameters():
        p.requires_grad_(False)
        n_cong += p.numel()
    modelo.logit_scale.requires_grad_(False)
    n_cong += modelo.logit_scale.numel()
    return n_cong


def cabeca_classificacao(dim=512):
    return torch.nn.Linear(dim, 1)


def parametros_treinaveis(modelo, cabeca, so_cabeca=False):
    if so_cabeca:
        for p in modelo.parameters():
            p.requires_grad_(False)
    params = [p for p in modelo.parameters() if p.requires_grad]
    params += list(cabeca.parameters())
    return params


# ---------------------------------------------------------- aumento ----

def aumentar(img: Image.Image, rng: random.Random) -> Image.Image:
    """Flip H/V, rotação 90° e zoom leve — só no treino."""
    if rng.random() < 0.5:
        img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if rng.random() < 0.5:
        img = img.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    k = rng.randint(0, 3)
    if k:
        img = img.transpose(
            getattr(Image.Transpose, f"ROTATE_{90 * k}")
        )
    if rng.random() < 0.5:
        w, h = img.size
        s = rng.uniform(0.85, 1.0)
        bw, bh = max(1, int(w * s)), max(1, int(h * s))
        x0 = rng.randint(0, w - bw)
        y0 = rng.randint(0, h - bh)
        img = img.crop((x0, y0, x0 + bw, y0 + bh))
    return img


class DatasetCavas(Dataset):
    def __init__(self, registros, treino, seed=42):
        self.registros = registros
        self.treino = treino
        self.rng = random.Random(seed)

    def __len__(self):
        return len(self.registros)

    def __getitem__(self, k):
        r = self.registros[k]
        img = Image.open(r["arquivo"]).convert("RGB")
        if self.treino:
            img = aumentar(img, self.rng)
        return {"imagem": img, "rotulo": float(r["rotulo"])}


def fazer_collate(processador):
    def collate(lotes):
        px = processador(
            images=[l["imagem"] for l in lotes], return_tensors="pt"
        )["pixel_values"]
        y = torch.tensor([l["rotulo"] for l in lotes], dtype=torch.float32)
        return {"pixel_values": px, "labels": y}
    return collate


# -------------------------------------------------------- avaliação ----

# Sem @torch.no_grad aqui de propósito: a época de treino (linha ~1230)
# chama esta função para FINO-TUNAR — precisa do gradiente fluindo pelo
# vision tower. Os caminhos de avaliação (avaliar, embeddings_texto,
# avaliar_zero_shot) carregam o no_grad deles.
def extrair_embedding_imagem(modelo, pixel_values):
    """pooler_output projetado em 512 dim e normalizado (L2)."""
    out = modelo.get_image_features(pixel_values=pixel_values)
    return F.normalize(out.pooler_output, dim=-1)


@torch.no_grad()
def avaliar(modelo, cabeca, loader, dispositivo, uso_amp, limiar=0.5):
    modelo.eval()
    cabeca.eval()
    probs, reais = [], []
    for lote in loader:
        pv = lote["pixel_values"].to(dispositivo, non_blocking=True)
        with uso_amp:
            emb = extrair_embedding_imagem(modelo, pv)
            logits = cabeca(emb.float()).squeeze(-1)
        probs.extend(torch.sigmoid(logits).cpu().tolist())
        reais.extend(lote["labels"].tolist())
    return calcular_metricas(reais, probs, limiar=limiar), probs, reais


@torch.no_grad()
def embeddings_texto(modelo, processador, textos, dispositivo):
    """Embeddings L2-normalizados dos textos (mesmo pipeline do zero-shot."""
    enc = processador(text=textos, return_tensors="pt", padding=True,
                      truncation=True)
    enc = {k: v.to(dispositivo) for k, v in enc.items()}
    uso_amp = torch.amp.autocast("cuda", dtype=torch.float16,
                                 enabled=dispositivo.type == "cuda")
    with uso_amp:
        out = modelo.get_text_features(**enc)
    return F.normalize(out.pooler_output, dim=-1).float().cpu()


def vram_livre_gib():
    """Memória livre da GPU em GiB (99.0 se não houver CUDA)."""
    if not torch.cuda.is_available():
        return 99.0
    return torch.cuda.mem_get_info()[0] / 2**30


def esperar_vram(min_gib, paciencia_s=120, intervalo_s=3, estaveis=3):
    """Espera até ter `min_gib` livres na GPU, no máximo `paciencia_s`.

    POR QUÊ: neste PC há processos de outras sessões (geração de imagem,
    ollama, coleta de negativos) que sobem e descem da GPU a qualquer
    momento. OOM aqui é quase sempre disputa, não tamanho de batch — e
    disputa passa. Dormir e conferir custa segundos; abortar um treino
    custa minutos.

    POR QUÊ `estaveis` amostras seguidas: a memória livre oscila em
    segundos (rajada do outro processo entre dois vales). Uma leitura
    alta isolada pode ser justamente o vale entre rajadas — lançar o
    forward nesse instante dá OOM logo depois, mesmo com "VRAM
    liberada". Exigir a mesma folga em `estaveis` amostras seguidas
    filtra a rajada.

    Devolve True se conseguiu a memória, False se estourou a paciência.
    """
    t0 = time.time()
    seguidas = 0
    while time.time() - t0 < paciencia_s:
        if vram_livre_gib() >= min_gib:
            seguidas += 1
            if seguidas >= estaveis:
                return True
        else:
            seguidas = 0
        time.sleep(intervalo_s)
    return False


def tentar_oom(rotina, onde, tentativas=5, min_gib=2.0, paciencia_s=240,
               ao_falhar=None):
    """Executa `rotina`; se estourar CUDA OOM, limpa, espera VRAM e repete.

    Detalhe que custou um treino inteiro descobrir: NÃO se pode limpar
    memória DENTRO do bloco `except`. Enquanto a exceção está sendo
    tratada, o traceback dela ainda segura os frames das camadas do
    modelo — e com eles os activations de 2+ GiB. Rodar empty_cache ali
    dentro não libera nada, e a próxima tentativa nasce endividada.
    Por isso o ajuste (`ao_falhar`) e a limpeza rodam DEPOIS do bloco
    except, quando a exceção já foi descartada.

    `rotina` precisa ser callable de zero argumentos.
    `ao_falhar(n_tentativa)` é chamado após cada falha (ex.: cortar o
    batch) — também fora do except, de propósito.
    """
    for t in range(tentativas + 1):
        try:
            return rotina()
        except torch.OutOfMemoryError:
            if t >= tentativas:
                raise
            # só sinaliza: limpar aqui dentro não adianta (ver docstring)
        # except encerrado → traceback solto, agora sim dá para liberar
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        if ao_falhar is not None:
            ao_falhar(t + 1)
        conseguiu = esperar_vram(min_gib, paciencia_s=paciencia_s)
        nosso = (torch.cuda.memory_allocated() / 2**30
                 if torch.cuda.is_available() else 0.0)
        print(
            f"  CUDA OOM em {onde}: tentativa {t + 1}/{tentativas} falhou; "
            f"livre agora {vram_livre_gib():.2f} GiB (nosso alocado "
            f"{nosso:.2f} GiB); esperando {min_gib} GiB livres "
            f"{'por 3 amostras' if conseguiu else f'— esgotou {paciencia_s} s'}"
        )
    raise RuntimeError("inalcançável")


# POR QUE o no_grad: sem ele o forward do zero-shot monta grafo de
# autograd e a lista `embs` (tensors .cpu() ainda com grad_fn) segura os
# nós CUDA vivos até o fim do laço. A memória sobe lote a lote e o OOM
# estoura mesmo com ~2,4 GiB livres e batch 1 — parecia disputa de GPU,
# mas era gradiente onde não havia treino. Medido em 28/09.
@torch.no_grad()
def avaliar_zero_shot(modelo, processador, registros, dispositivo, batch=16):
    """Linha de base SEM treino, no MESMO holdout que o fine-tune.

    Regra do Agente B (scripts/zero-shot-cavas.py), par de textos B:
    a imagem é "cava" quando a similaridade média com os textos
    positivos supera a média com os negativos. Sem limiar treinado —
    é por isso que o número é a régua honesta do que o modelo sabe
    sem tocar em peso nenhum.

    TEM que ser chamada com o modelo ainda nos pesos BASE (antes de
    carregar qualquer checkpoint de fine-tune): embedding de modelo já
    afinado não é zero-shot, é modelo treinado disfarçado.

    Retorna as métricas no limiar 0.5 sobre a regra em 0/1, mais a
    margem (sim_pos - sim_neg) para a curva do zero-shot.
    """
    modelo.eval()
    uso_amp = torch.amp.autocast("cuda", dtype=torch.float16,
                                 enabled=dispositivo.type == "cuda")
    estado = {"batch": max(1, int(batch)), "reducoes": 0}

    def passar():
        """Codifica as imagens do holdout em embeddings 512 dim."""
        dl = DataLoader(
            DatasetCavas(registros, treino=False), batch_size=estado["batch"],
            shuffle=False, num_workers=0, collate_fn=fazer_collate(processador),
        )
        embs = []
        for lote in dl:
            pv = lote["pixel_values"].to(dispositivo, non_blocking=True)
            with uso_amp:
                embs.append(extrair_embedding_imagem(modelo, pv).float().cpu())
        return embs

    def cortar_batch(_tentativa):
        """Reduz o batch pela metade a cada falha (até 3 cortes)."""
        if estado["reducoes"] >= 3 or estado["batch"] <= 1:
            return
        estado["reducoes"] += 1
        antigo = estado["batch"]
        estado["batch"] = max(1, antigo // 2)
        print(f"  CUDA OOM no zero-shot: batch {antigo} → "
              f"{estado['batch']} (corte {estado['reducoes']}/3)")

    lista = tentar_oom(passar, "zero-shot (imagens do holdout)",
                       ao_falhar=cortar_batch)
    emb_img = torch.cat(lista) if lista else torch.empty(0, 512)

    par = TEXTO_ZERO_SHOT_B
    textos = par["positivos"] + par["negativos"]
    emb_txt = tentar_oom(
        lambda: embeddings_texto(modelo, processador, textos, dispositivo),
        "zero-shot (textos)",
    )
    n_pos_t = len(par["positivos"])
    sim = emb_img @ emb_txt.T
    margem = (sim[:, :n_pos_t].mean(dim=1) - sim[:, n_pos_t:].mean(dim=1))
    pred = (margem > 0).numpy().astype(int)   # regra: sim_pos > sim_neg
    rotulos = [r["rotulo"] for r in registros]
    m = calcular_metricas(rotulos, pred, limiar=0.5)
    m["regra"] = "media_sim(textos_pos) > media_sim(textos_neg)"
    m["par_textos"] = par["nome"]
    return m, margem.numpy().tolist(), rotulos


def curva_zero_shot(rotulos, margens, alvo=ALVO_PRECISAO):
    """Mesma lógica da curva PR, mas varrendo limiar na MARGEM do zero-shot.

    A margem (sim_pos - sim_neg) não vive em 0..1, então em vez de
    varrer 0,05→0,95 fixo varre os quantis 5%..95% das margens
    observadas — mesma densidade de pontos, domínio adequado. Sem isso
    o zero-shot teria um único ponto e a comparação com o fine-tune
    (que escolhe limiar) seria desleal na mão do fine-tune.
    """
    m = np.asarray(margens, dtype=float)
    if len(m) == 0:
        return {"curva": [], "limiar_escolhido": None}
    grade = np.unique(np.quantile(m, np.arange(0.05, 0.951, 0.01)))
    pontos, melhor, chave_melhor = [], None, None
    for l in grade:
        r = calcular_metricas(rotulos, (m > l).astype(int), limiar=0.5)
        # reescreve o limiar no espaço da margem para o relatório
        # (0/1 predito com limiar 0.5 é exatamente "margem > l")
        r["limiar"] = round(float(l), 4)
        pontos.append({k: r[k] for k in
                       ("limiar", "precisao", "recall", "f1", "acuracia",
                        "tp", "fp", "fn", "tn")})
        if r["precisao"] >= alvo:
            chave = (r["recall"], r["precisao"])
            if chave_melhor is None or chave > chave_melhor:
                melhor, chave_melhor = dict(r), chave
    return {"alvo_precisao": alvo, "dominio": "margem sim_pos-sim_neg",
            "curva": pontos, "limiar_escolhido": melhor}


# --------------------------------------------------------- treino ----

def salvar_ultimo(caminho, epoca, modelo, cabeca, otimizador, escalador,
                  agendador, melhor_f1, historico, args):
    torch.save(
        {
            "epoca": epoca,
            "modelo": modelo.state_dict(),
            "cabeca": cabeca.state_dict(),
            "otimizador": otimizador.state_dict(),
            "escalador": escalador.state_dict(),
            "agendador": agendador.state_dict(),
            "melhor_f1": melhor_f1,
            "historico": historico,
            "args": vars(args),
            "torch_rng": torch.get_rng_state(),
            "cuda_rng": (torch.cuda.get_rng_state_all()
                         if torch.cuda.is_available() else None),
        },
        caminho,
    )


def salvar_melhor(caminho, epoca, modelo, cabeca, melhor_f1, metricas, args):
    torch.save(
        {
            "epoca": epoca,
            "modelo": modelo.state_dict(),
            "cabeca": cabeca.state_dict(),
            "melhor_f1": melhor_f1,
            "metricas": metricas,
            "args": vars(args),
        },
        caminho,
    )


def carregar_checkpoint(caminho, modelo, cabeca, otimizador=None,
                        escalador=None, agendador=None):
    ck = torch.load(caminho, map_location="cpu", weights_only=False)
    modelo.load_state_dict(ck["modelo"])
    cabeca.load_state_dict(ck["cabeca"])
    if otimizador is not None and "otimizador" in ck:
        otimizador.load_state_dict(ck["otimizador"])
    if escalador is not None and "escalador" in ck:
        escalador.load_state_dict(ck["escalador"])
    if agendador is not None and "agendador" in ck:
        agendador.load_state_dict(ck["agendador"])
    if "torch_rng" in ck:
        torch.set_rng_state(ck["torch_rng"].cpu())
    if ck.get("cuda_rng") and torch.cuda.is_available():
        try:
            torch.cuda.set_rng_state_all([s.cpu() for s in ck["cuda_rng"]])
        except RuntimeError:
            pass
    return ck


def montar_loaders(treino_ds, val_ds, collate, batch, sampler, embaralhar):
    """Cria os DataLoaders de treino e validação com o batch dado.

    Separado numa função para o tratador de OOM refazer os dois com
    batch menor no meio do treino, mantendo amostrador e embaralhamento
    idênticos (senão a época repetida não seria a mesma época).
    """
    treino_dl = DataLoader(
        treino_ds, batch_size=batch, shuffle=bool(embaralhar),
        sampler=sampler, num_workers=0, collate_fn=collate,
        drop_last=False,
    )
    # validação com o MESMO batch do treino: ela só faz forward, mas o
    # pico de VRAM é o que importa quando a GPU é compartilhada
    val_dl = DataLoader(
        val_ds, batch_size=batch, shuffle=False, num_workers=0,
        collate_fn=collate,
    )
    return treino_dl, val_dl


def treinar(args, registros, idx_treino, idx_val, info_split,
            modelo, processador, dispositivo, saida: Path):
    treino_ds = DatasetCavas([registros[i] for i in idx_treino], treino=True,
                             seed=args.seed)
    val_ds = DatasetCavas([registros[i] for i in idx_val], treino=False,
                          seed=args.seed)
    collate = fazer_collate(processador)

    # ---- desbalanceamento (~18 positivos por negativo) ----
    # O problema central destes dados: sem freio, o loss aprende a chamar
    # tudo de "positivo" e a precisão do gate despenca. Três caminhos
    # (escolhidos por --estrategia), todos medidos no MESMO split:
    n_pos = info_split["treino_pos"]
    n_neg = info_split["treino_neg"]
    criterio = torch.nn.BCEWithLogitsLoss()
    sampler, embaralhar = None, True
    if args.estrategia == "peso":
        razao = (n_neg / n_pos) if (n_pos and n_neg) else 1.0
        criterio = torch.nn.BCEWithLogitsLoss(
            pos_weight=torch.tensor([razao], device=dispositivo)
        )
        nota = (
            f"peso: pos_weight={razao:.4f} — a positiva é a MAIORIA, então "
            "cada positivo vale só fração de um negativo dentro do loss e "
            "as duas classes somam contribuição parecida; nenhuma imagem "
            "é repetida"
        )
    elif args.estrategia == "sobreamostragem":
        pesos = torch.tensor([
            ((1.0 / n_pos) if r["rotulo"] == 1 else (1.0 / n_neg))
            if (n_pos and n_neg) else 1.0
            for r in treino_ds.registros
        ], dtype=torch.double)
        gen = torch.Generator()
        gen.manual_seed(args.seed)
        sampler = WeightedRandomSampler(pesos, num_samples=len(pesos),
                                        replacement=True, generator=gen)
        embaralhar = False  # sampler e shuffle=True são mutuamente exclusivos
        vistos = len(pesos) / 2 / max(1, n_neg)
        nota = (
            f"sobreamostragem: sorteio metade/metade; os {n_neg} negativos "
            f"do treino são re-vistos ~{vistos:.1f}x por época, cada vez "
            "com aumento aleatório diferente (é o que segura o overfitting "
            "do negativo repetido)"
        )
    else:
        nota = "nenhuma: loss puro e sorteio uniforme (controle do teste)"
    print(f"Estratégia de desbalanceamento [{args.estrategia}]: {nota}")

    treino_dl, val_dl = montar_loaders(
        treino_ds, val_ds, collate, args.batch, sampler, embaralhar
    )

    congelar_texto(modelo)
    cabeca = cabeca_classificacao().to(dispositivo)
    params = parametros_treinaveis(modelo, cabeca, so_cabeca=args.so_cabeca)
    n_treinaveis = sum(p.numel() for p in params)
    n_cabeca = sum(p.numel() for p in cabeca.parameters())
    rotulo_params = (
        "só a cabeça" if args.so_cabeca else "visão + projeção + cabeça"
    )
    print(
        f"Parâmetros treináveis: {n_treinaveis / 1e6:.3f} M "
        f"({rotulo_params}; cabeça={n_cabeca}; text tower congelado)"
    )

    otimizador = torch.optim.AdamW(params, lr=args.lr, weight_decay=0.01)
    passos_epoca = math.ceil(len(treino_ds) / (args.batch * args.acum))
    total_passos = max(1, passos_epoca * args.epocas)
    agendador = get_cosine_schedule_with_warmup(
        otimizador,
        num_warmup_steps=max(1, int(0.05 * total_passos)),
        num_training_steps=total_passos,
    )
    uso_amp = torch.amp.autocast(
        "cuda", dtype=torch.float16, enabled=dispositivo.type == "cuda"
    )
    escalador = torch.amp.GradScaler("cuda", enabled=dispositivo.type == "cuda")

    # critério (criterio) e amostrador (sampler) já foram montados lá em
    # cima, no bloco de --estrategia; aqui não se mexe mais neles.

    ultimo = saida / "ultimo.pt"
    melhor = saida / "melhor.pt"
    epoca_inicio = 0
    melhor_f1 = -1.0
    historico = []
    if args.continuar:
        if ultimo.exists():
            ck = carregar_checkpoint(ultimo, modelo, cabeca, otimizador,
                                     escalador, agendador)
            epoca_inicio = ck["epoca"] + 1
            melhor_f1 = ck.get("melhor_f1", -1.0)
            historico = ck.get("historico", [])
            print(
                f"Retomando de {ultimo} (época {ck['epoca']}, "
                f"melhor F1={melhor_f1:.3f}) → épocas {epoca_inicio}.."
                f"{args.epocas - 1}"
            )
        else:
            print(f"--continuar dado, mas {ultimo} não existe; começando do zero")
    if epoca_inicio >= args.epocas:
        print(f"Já treinado até a época {epoca_inicio - 1} (>= {args.epocas}).")
        return melhor, historico

    if dispositivo.type == "cuda":
        torch.cuda.reset_peak_memory_stats(dispositivo)

    paciencia = args.paciencia
    sem_melhora = 0
    tentativas_oom = 0
    t_total = time.time()
    if dispositivo.type == "cuda" and not esperar_vram(2.5, paciencia_s=90):
        print(
            f"  AVISO: treinando com {vram_livre_gib():.2f} GiB livres — "
            "se disputa na GPU derrubar, a época repete sozinha"
        )

    def rodar_epoca(epoca):
        """Roda UMA época (treino + validação) e devolve o registro.

        Função aninhada de propósito: ela lê treino_dl/val_dl do escopo
        de fora A CADA CHAMADA, então quando o tratador de OOM troca os
        loaders por uns de batch menor, a próxima tentativa já usa o
        batch novo — sem refatorar nada aqui dentro.
        """
        modelo.train()
        cabeca.train()
        otimizador.zero_grad(set_to_none=True)
        soma_loss, n_lotes = 0.0, 0
        t0 = time.time()
        for passo, lote in enumerate(treino_dl):
            pv = lote["pixel_values"].to(dispositivo, non_blocking=True)
            y = lote["labels"].to(dispositivo, non_blocking=True)
            with uso_amp:
                emb = extrair_embedding_imagem(modelo, pv)
                logits = cabeca(emb.float()).squeeze(-1)
                loss = criterio(logits, y) / args.acum
            escalador.scale(loss).backward()
            soma_loss += loss.item() * args.acum
            n_lotes += 1
            fim_de_grupo = ((passo + 1) % args.acum == 0
                            or (passo + 1) == len(treino_dl))
            if fim_de_grupo:
                escalador.unscale_(otimizador)
                torch.nn.utils.clip_grad_norm_(params, 1.0)
                escalador.step(otimizador)
                escalador.update()
                otimizador.zero_grad(set_to_none=True)
                agendador.step()
        loss_medio = soma_loss / max(1, n_lotes)
        # tempo só do treino (sem a validação): é ele que serve para
        # extrapolar o custo de 20 mil imagens, porque a validação tem
        # tamanho fixo e não escala com o acervo
        t_treino = time.time() - t0

        m_val, probs, reais = avaliar(
            modelo, cabeca, val_dl, dispositivo, uso_amp, limiar=0.5
        )
        vram = (torch.cuda.max_memory_allocated(dispositivo) / 2**30
                if dispositivo.type == "cuda" else 0.0)
        registro = {
            "epoca": epoca,
            "loss_treino": round(loss_medio, 5),
            "lr": otimizador.param_groups[0]["lr"],
            "val": m_val,
            "vram_max_gb": round(vram, 3),
            "segundos_treino": round(t_treino, 1),
            "segundos_val": round(time.time() - t0 - t_treino, 1),
            "segundos": round(time.time() - t0, 1),
            "batch": args.batch,
        }
        return registro, m_val

    for epoca in range(epoca_inicio, args.epocas):
        # A GPU é compartilhada: se faltar memória, corta o batch ao meio
        # e REPETE a mesma época — no máximo 3 vezes, depois desiste.
        while True:
            try:
                registro, m_val = rodar_epoca(epoca)
                break
            except torch.OutOfMemoryError:
                tentativas_oom += 1
                if tentativas_oom > 3:
                    print("OOM persistente após 3 tentativas — desisto.")
                    raise
                # NÃO limpar aqui dentro: o traceback da exceção ainda
                # segura os frames (e activations) das camadas do modelo
            # except encerrado → exceção descartada; aí sim limpa e refaz
            gc.collect()
            if dispositivo.type == "cuda":
                torch.cuda.empty_cache()
            antigo = args.batch
            if args.batch > 1:
                args.batch = max(1, args.batch // 2)
                treino_dl, val_dl = montar_loaders(
                    treino_ds, val_ds, collate, args.batch, sampler,
                    embaralhar
                )
            esperar_vram(2.0, paciencia_s=120)
            otimizador.zero_grad(set_to_none=True)
            print(
                f"  CUDA OOM na época {epoca + 1}: batch {antigo} → "
                f"{args.batch} (tentativa {tentativas_oom}/3), VRAM "
                f"livre {vram_livre_gib():.2f} GiB; a época recomeça"
            )
        historico.append(registro)
        print(
            f"Época {epoca + 1}/{args.epocas}: "
            f"loss={registro['loss_treino']:.4f} "
            f"lr={registro['lr']:.2e} | val F1={m_val['f1']:.3f} "
            f"precisão={m_val['precisao']:.3f} recall={m_val['recall']:.3f} "
            f"| treino {registro['segundos_treino']}s + val "
            f"{registro['segundos_val']}s VRAM={registro['vram_max_gb']:.2f} GiB"
        )
        if m_val["f1"] > melhor_f1:
            melhor_f1 = m_val["f1"]
            sem_melhora = 0
            salvar_melhor(melhor, epoca, modelo, cabeca, melhor_f1, m_val, args)
        else:
            sem_melhora += 1
            print(f"  sem melhora no F1 há {sem_melhora} época(s) "
                  f"(paciência={paciencia})")
        salvar_ultimo(ultimo, epoca, modelo, cabeca, otimizador, escalador,
                      agendador, melhor_f1, historico, args)
        if sem_melhora >= paciencia:
            print(f"Early stop na época {epoca + 1} "
                  f"(melhor F1={melhor_f1:.3f}).")
            break

    print(
        f"Treino pronto em {time.time() - t_total:.0f}s. "
        f"VRAM máxima: "
        f"{torch.cuda.max_memory_allocated(dispositivo) / 2**30:.2f} GiB "
        "(torch.cuda.max_memory_allocated)"
    )
    return melhor, historico


# ------------------------------------------------------------- main ----

def main():
    ap = argparse.ArgumentParser(
        description="Fine-tune do Chinese-CLIP para classificar cava de "
                    "mineração (split POR CENA — regra de ouro)."
    )
    ap.add_argument("--epocas", type=int, default=8)
    ap.add_argument("--batch", type=int, default=4,
                    help="batch micro (4–8 recomendado na RTX 3050 4 GB)")
    ap.add_argument("--acum", type=int, default=2,
                    help="gradient accumulation (batch efetivo = batch*acum)")
    ap.add_argument("--lr", type=float, default=2e-5)
    ap.add_argument("--dados", type=Path, default=DEFAULT_DADOS,
                    help="dir com checkpoint.jsonl + recortes/")
    ap.add_argument("--modelo", type=Path, default=DEFAULT_MODELO,
                    help="dir dos pesos safetensors do Chinese-CLIP")
    ap.add_argument("--saida", type=Path, default=DEFAULT_SAIDA,
                    help="dir de checkpoints (precisa ficar FORA do repo)")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--frac-val", type=float, default=0.2,
                    help="fração-alvo de IMAGENS na validação; o grupo é "
                         "sempre a cena inteira (>=8 cenas)")
    ap.add_argument("--paciencia", type=int, default=3,
                    help="early stop por F1 de validação")
    ap.add_argument("--nuvem-max", type=float, default=NUVEM_MAX)
    ap.add_argument("--limiar", type=float, default=0.5,
                    help="limiar fixo reportado à parte; o limiar do gate "
                         "é escolhido na curva PR (ver --estrategia)")
    ap.add_argument("--estrategia",
                    choices=("peso", "sobreamostragem", "nenhuma"),
                    default="peso",
                    help="como enfrentar o desbalanceamento ~18:1 "
                         "'peso' = pos_weight no loss (default); "
                         "'sobreamostragem' = WeightedRandomSampler "
                         "metade/metade; 'nenhuma' = controle")
    ap.add_argument("--split", type=Path, default=SPLIT_PADRAO,
                    help="arquivo JSON que fixa o split por cena; existe = "
                         "é ele que manda (holdout imutável), não existe = "
                         "calcula por cena e grava aqui")
    ap.add_argument("--so-cabeca", action="store_true",
                    help="só treina a cabeça linear (backbone congelado)")
    ap.add_argument("--continuar", action="store_true",
                    help="retoma de saida/ultimo.pt se existir")
    ap.add_argument("--so-avaliar", "--sem-treino",
                    "--sem-treino-so-avaliar",
                    "--sem-treino-só-avaliar", action="store_true",
                    dest="so_avaliar",
                    help="sem treino: só avalia o melhor checkpoint no holdout")
    args = ap.parse_args()

    raiz = Path(__file__).resolve().parent.parent
    try:
        dentro = args.saida.resolve().is_relative_to(raiz.resolve())
    except (OSError, ValueError):
        dentro = False
    if dentro:
        raise SystemExit(
            f"--saida {args.saida} cai dentro do repositório. Checkpoints "
            "nunca vão para o repo (fica em Temp, pesado e descartável). "
            "Use o default ou um caminho em Temp."
        )

    dispositivo = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if dispositivo.type == "cpu":
        print("AVISO: sem CUDA — treino em CPU é lento; rodando em fp32.")
    else:
        livre, total = torch.cuda.mem_get_info()
        print(
            f"GPU: {torch.cuda.get_device_name(0)} — "
            f"{livre / 2**30:.2f} GiB livres de {total / 2**30:.2f} GiB "
            "(GPU compartilhada: OOM aqui costuma ser disputa, não batch)"
        )

    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)

    # SNAPSHOT ÚNICO: lê o jsonl uma vez, confere os JPGs e nunca mais
    # relê. A coleta de negativos continua gravando em paralelo e isto
    # garante que treino e avaliação falem da mesma amostra.
    registros = carregar_registros(args.dados, nuvem_max=args.nuvem_max)
    registros = validar_integridade(registros)
    idx_treino, idx_val, info_split = aplicar_split(
        registros, args.split, args.frac_val, args.seed
    )
    print(
        f"Amostra fixa: {len(registros)} recortes | treino "
        f"{info_split['treino_pos']} pos/{info_split['treino_neg']} neg em "
        f"{info_split['cenas_treino']} cenas | holdout "
        f"{info_split['val_pos']} pos/{info_split['val_neg']} neg em "
        f"{info_split['cenas_val']} cenas"
    )

    modelo, processador = carregar_modelo(args.modelo, dispositivo)
    saida = Path(args.saida)
    saida.mkdir(parents=True, exist_ok=True)

    # Linha de base zero-shot ANTES de qualquer fine-tune: aqui o modelo
    # ainda está com os pesos base. Depois de treinar() os pesos mudam e
    # a conta deixaria de ser zero-shot.
    if dispositivo.type == "cuda" and not esperar_vram(2.5, paciencia_s=90):
        print(
            f"  AVISO: GPU com só {vram_livre_gib():.2f} GiB livres "
            "(outra sessão disputando) — seguindo mesmo assim"
        )
    zs_m, zs_margem, zs_rotulos = avaliar_zero_shot(
        modelo, processador, [registros[i] for i in idx_val], dispositivo,
        batch=args.batch,
    )
    zs_curva = curva_zero_shot(zs_rotulos, zs_margem)
    print(
        f"Zero-shot base [{TEXTO_ZERO_SHOT_B['nome']}] no holdout: "
        f"precisão {zs_m['precisao']:.3f} recall {zs_m['recall']:.3f} "
        f"F1 {zs_m['f1']:.3f} acurácia {zs_m['acuracia']:.3f} "
        f"(tp {zs_m['tp']}/fp {zs_m['fp']}/fn {zs_m['fn']}/tn {zs_m['tn']})"
    )
    if zs_curva["limiar_escolhido"]:
        z = zs_curva["limiar_escolhido"]
        print(
            f"  zero-shot com limiar na margem ({z['limiar']:+.4f}): "
            f"precisão {z['precisao']:.3f} / recall {z['recall']:.3f} "
            f"no gate de {ALVO_PRECISAO:.0%}"
        )

    if args.so_avaliar:
        caminho = saida / "melhor.pt"
        if not caminho.exists():
            caminho = saida / "ultimo.pt"
        if not caminho.exists():
            raise SystemExit(
                f"Nenhum checkpoint em {saida} (melhor.pt/ultimo.pt). "
                "Rode o treino antes, ou ajuste --saida."
            )
        cabeca = cabeca_classificacao().to(dispositivo)
        ck = torch.load(caminho, map_location="cpu", weights_only=False)
        modelo.load_state_dict(ck["modelo"])
        cabeca.load_state_dict(ck["cabeca"])
        val_ds = DatasetCavas([registros[i] for i in idx_val], treino=False)
        val_dl = DataLoader(val_ds, batch_size=args.batch,
                            shuffle=False, num_workers=0,
                            collate_fn=fazer_collate(processador))
        uso_amp = torch.amp.autocast(
            "cuda", dtype=torch.float16, enabled=dispositivo.type == "cuda"
        )
        _, probs, reais = tentar_oom(
            lambda: avaliar(modelo, cabeca, val_dl, dispositivo, uso_amp,
                            limiar=args.limiar),
            "avaliação do holdout (--so-avaliar)",
        )
        m_fixo, curva, m_lim, gate = avaliar_holdout(
            reais, probs, args.limiar, f"Avaliação holdout ({caminho.name})"
        )
        relatorio = {
            "modo": "so-avaliar",
            "checkpoint": str(caminho),
            "epoca_ckp": ck.get("epoca"),
            "dados": str(args.dados),
            "split": info_split,
            "metricas_holdout": m_fixo,
            "curva_pr": curva,
            "metricas_limiar_escolhido": m_lim,
            "limiar_escolhido": curva["limiar_escolhido"],
            "zero_shot_holdout": zs_m,
            "zero_shot_curva": zs_curva,
            "gate": gate,
            "alvo_precisao": ALVO_PRECISAO,
            "vram_max_gb": round(
                (torch.cuda.max_memory_allocated(dispositivo) / 2**30
                 if dispositivo.type == "cuda" else 0.0), 3
            ),
        }
        (saida / "metricas.json").write_text(
            json.dumps(relatorio, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        print(f"Relatório: {saida / 'metricas.json'}")
        return

    melhor, historico = treinar(
        args, registros, idx_treino, idx_val, info_split,
        modelo, processador, dispositivo, saida
    )

    # avaliação final com o MELHOR checkpoint no holdout
    if melhor.exists():
        ck = torch.load(melhor, map_location="cpu", weights_only=False)
        modelo.load_state_dict(ck["modelo"])
        cabeca = cabeca_classificacao().to(dispositivo)
        cabeca.load_state_dict(ck["cabeca"])
        epoca_best = ck.get("epoca")
    else:
        cabeca = cabeca_classificacao().to(dispositivo)
        epoca_best = None
        print("AVISO: melhor.pt não encontrado; avaliando o modelo final.")
    val_ds = DatasetCavas([registros[i] for i in idx_val], treino=False)
    val_dl = DataLoader(val_ds, batch_size=args.batch, shuffle=False,
                        num_workers=0, collate_fn=fazer_collate(processador))
    uso_amp = torch.amp.autocast(
        "cuda", dtype=torch.float16, enabled=dispositivo.type == "cuda"
    )
    _, probs, reais = tentar_oom(
        lambda: avaliar(modelo, cabeca, val_dl, dispositivo, uso_amp,
                        limiar=args.limiar),
        "avaliação final do holdout",
    )
    titulo = f"HOLDOUT final (melhor checkpoint, época {epoca_best})"
    m_fixo, curva, m_lim, gate = avaliar_holdout(
        reais, probs, args.limiar, titulo
    )

    # comparação justa: mesmo holdout, mesma régua de gate
    print("=== COMPARAÇÃO (mesmo holdout, mesma regra de gate) ===")
    print(
        f"  zero-shot [{TEXTO_ZERO_SHOT_B['nome']}]: precisão "
        f"{zs_m['precisao']:.3f} recall {zs_m['recall']:.3f} "
        f"F1 {zs_m['f1']:.3f} | gate {zs_m['precisao'] >= ALVO_PRECISAO and 'PASSOU' or 'NÃO PASSOU'}"
    )
    if zs_curva["limiar_escolhido"]:
        z = zs_curva["limiar_escolhido"]
        print(
            f"  zero-shot com limiar na margem ({z['limiar']:+.4f}): "
            f"precisão {z['precisao']:.3f} recall {z['recall']:.3f} "
            f"F1 {z['f1']:.3f} | gate "
            f"{'PASSOU' if z['precisao'] >= ALVO_PRECISAO else 'NÃO PASSOU'}"
        )
    if m_lim:
        print(
            f"  fine-tune no limiar {m_lim['limiar']:.2f}: precisão "
            f"{m_lim['precisao']:.3f} recall {m_lim['recall']:.3f} "
            f"F1 {m_lim['f1']:.3f} | gate {gate}"
        )

    # Extrapolação para 20 mil imagens: só o tempo de TREINO escala com
    # o acervo (validação tem tamanho fixo). A primeira época é
    # descartada da média quando há mais de uma — ela paga o aquecimento
    # de CUDA e o cache de disco.
    dur = [h["segundos_treino"] for h in historico
           if h.get("segundos_treino") is not None]
    base = dur[1:] if len(dur) > 1 else dur
    medio = (sum(base) / len(base)) if base else 0.0
    n_tr = max(1, info_split["n_treino"])
    extrapolacao = {
        "epocas_medidas": len(base),
        "segundos_por_epoca_treino": round(medio, 1),
        "n_imagens_treino": n_tr,
        "segundos_por_imagem": round(medio / n_tr, 4),
        "20k_imgs_min_por_epoca": round(medio / n_tr * 20000 / 60, 1),
        "20k_imgs_min_treino_completo": round(
            medio / n_tr * 20000 * args.epocas / 60, 1
        ),
        "nota": (
            "extrapolação linear pela contagem de imagens (mesmo batch, "
            "mesma augmentação, mesma GPU); I/O e augmentação crescem "
            "junto, mas o custo dominante é o forward/backward do ViT, "
            "que escala por imagem"
        ),
    }
    print(
        f"Tempo de treino: {extrapolacao['segundos_por_epoca_treino']}s/época "
        f"em {n_tr} imgs → 20 mil imagens ≈ "
        f"{extrapolacao['20k_imgs_min_por_epoca']} min/época, "
        f"{extrapolacao['20k_imgs_min_treino_completo']} min para "
        f"{args.epocas} épocas"
    )

    vram = (torch.cuda.max_memory_allocated(dispositivo) / 2**30
            if dispositivo.type == "cuda" else 0.0)
    relatorio = {
        "modo": "treino",
        "dados": str(args.dados),
        "modelo": str(args.modelo),
        "args": {k: (str(v) if isinstance(v, Path) else v)
                 for k, v in vars(args).items()},
        "split": info_split,
        "epoca_melhor": epoca_best,
        "historico": historico,
        "metricas_holdout": m_fixo,
        "curva_pr": curva,
        "metricas_limiar_escolhido": m_lim,
        "limiar_escolhido": curva["limiar_escolhido"],
        "zero_shot_holdout": zs_m,
        "zero_shot_curva": zs_curva,
        "extrapolacao": extrapolacao,
        "gate": gate,
        "alvo_precisao": ALVO_PRECISAO,
        "vram_max_gb": round(vram, 3),
        "torch": torch.__version__,
        "transformers": __import__("transformers").__version__,
        "data": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    (saida / "metricas.json").write_text(
        json.dumps(relatorio, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"VRAM máxima: {vram:.2f} GiB | Relatório: {saida / 'metricas.json'}")


if __name__ == "__main__":
    main()
