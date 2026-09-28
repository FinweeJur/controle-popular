#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/indexar-cavas.py

Fase 2/4 do plano de cavas — PIPELINE DE EMBEDDINGS.

O que faz: varre os recortes 512x512 de scripts/.cache/cavas-calibracao/,
passa cada imagem pelo Chinese-CLIP e grava o vetor de 512 dimensões
(normalizado, cosseno = produto escalar) num índice que scripts/
buscar-cavas.py consulta depois. Sem este passo não existe busca por
similaridade: o índice É a memória do detector.

Fonte do modelo: OFA-Sys/chinese-clip (MIT), pesos locais em
%TEMP%/opencode/cavas/chinese-clip. A API do transformers 5.5 devolve um
objeto em get_image_features(); o embedding projetado está em
.pooler_output e SEM normalização — normalizar aqui é decisão nossa
(F.normalize), senão a distância de cosseno não significa nada.

Decisões técnicas (todas com motivo):

1. Só use_safetensors=True. O pytorch_model.bin do mesmo diretório é
   inseguro no torch 2.5.1 (CVE-2025-32434: pickle carrega código). O
   script falha alto se faltar o .safetensors.
2. fp16 via autocast só no forward (a RTX 3050 tem 4 GiB); os pesos
   ficam em fp32. O vetor sai em fp32 e é gravado em float16 no disco —
   20 mil vetores = 20 MB em vez de 40 MB. Medido em 28/09: arredondar
   os 2112 vetores para fp16 e renormalizar desvia o cosseno em menos
   que 5e-7, ou seja, o erro maior vem do forward (imagem sozinha ×
   lote 16 ≈ 2e-4), não do disco. A busca reconverte para fp32 e
   corta o cosseno em [-1,1] para nunca mostrar número > 1.
3. Retomada por CHAVE = "tipo/arquivo" + tamanho em bytes. O nome do
   JPG já é o hash do recorte gerado pelo coletor, então o nome identifica
   o conteúdo; o tamanho protege contra reescrita do mesmo nome. Não
   re-hasheamos 20 mil JPEGs — decodificar custa menos que isso. Para
   refazer tudo, --reindexar.
4. Salvamento atômico periódico (--salvar-a-cada): escreve em .tmp e
   troca com os.replace. Se a sessão cair no meio, nada do que já foi
   calculado se perde.
5. OOM de VRAM (GPU pode estar em uso por outra sessão): dorme 60 s,
   esvazia a cache e tenta de novo com o lote pela metade, até lote 1.
6. num_workers=0 e sem DataLoader: no Windows o spawn exige tudo
   serializável, e o ganho seria pequeno — decodificar um JPEG 512x512
   custa milissegundos.

Corte de nuvem: usa nuvem_max = 0.20, o MESMO corte do treino (Fase 3)
e do zero-shot. Motivo: a busca só devolve o que o modelo aprendeu a
ver; incluir cena nublada inflaria o índice com recorte que o treino
descarta. Use --nuvem-max para mudar.

Saída em %TEMP%/opencode/cavas/indice/: vetores.npy, metadados.json,
manifesto.json.

Exemplos:
    python scripts/indexar-cavas.py
    python scripts/indexar-cavas.py --batch 8 --reindexar
    python scripts/indexar-cavas.py --dados <dir> --saida <dir>
"""

import argparse
import json
import os
import sys
import tempfile
import time
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
DEFAULT_SAIDA = TMP / "opencode" / "cavas" / "indice"
DEFAULT_DADOS = (
    Path(__file__).resolve().parent.parent
    / "scripts" / ".cache" / "cavas-calibracao"
)

# Dimensão do espaço projetado do Chinese-CLIP ViT-B/16 (lido do
# config.projection_dim para não virar número mágico).
DIM_PADRAO = 512
# Mesmo corte de nuvem do treino e do zero-shot (NUVEM_MAX lá).
NUVEM_MAX = 0.20
# Meta do plano de cavas: 20 mil recortes. Só serve para a extrapolação
# de tempo impressa no final.
META_ALVO = 20_000

ARQ_VETORES = "vetores.npy"
ARQ_METADADOS = "metadados.json"
ARQ_MANIFESTO = "manifesto.json"
VERSAO_INDICE = 1


# ------------------------------------------------------------- dados ----
def ler_checkpoint(dados: Path, nuvem_max: float):
    """Lê o checkpoint.jsonl e monta os registros a indexar.

    Retorna (registros, resumo, chaves_checkpoint). Cada registro traz
    caminho absoluto, tamanho em bytes (chave de retomada) e os
    metadados que vão junto com o vetor na tela de busca.

    chaves_checkpoint é o conjunto de "tipo/arquivo" de TODAS as linhas
    lidas, antes dos cortes — serve para contar JPG órfãos sem confundir
    "arquivo descartado por nuvem" com "arquivo sem metadado".

    Só entra registro cujo JPG exista no disco: o coletor grava o JSON
    antes/depois da imagem, e a ordem nunca é garantida — conferir o
    arquivo é mais barato que confiar na ordem.
    """
    ckp = dados / "checkpoint.jsonl"
    if not ckp.exists():
        raise SystemExit(
            f"checkpoint.jsonl não encontrado em {dados}\n"
            "Passe --dados com o diretório que contém checkpoint.jsonl "
            "e recortes/{positivo,negativo}/."
        )

    registros, vistos = [], set()
    descartados = {"nuvem": 0, "sem_jpg": 0, "tipo": 0, "duplicado": 0}
    with open(ckp, encoding="utf-8") as f:
        for linha in f:
            linha = linha.strip()
            if not linha:
                continue
            try:
                r = json.loads(linha)
            except json.JSONDecodeError:
                descartados["tipo"] += 1
                continue
            tipo = r.get("tipo")
            nome = r.get("arquivo")
            if tipo not in ("positivo", "negativo") or not nome:
                descartados["tipo"] += 1
                continue
            chave = f"{tipo}/{nome}"
            if chave in vistos:
                # checkpoint é append-only: a mesma coleta pode gravar o
                # mesmo recorte duas vezes; a primeira linha vence.
                descartados["duplicado"] += 1
                continue
            vistos.add(chave)
            nuvem = float(r.get("nuvem") or 0.0)
            if nuvem > nuvem_max:
                descartados["nuvem"] += 1
                continue
            caminho = dados / "recortes" / tipo / nome
            if not caminho.exists():
                descartados["sem_jpg"] += 1
                continue
            st = caminho.stat()
            registros.append(
                {
                    "chave": chave,
                    "arquivo": nome,
                    "caminho": str(caminho.resolve()),
                    "tipo": tipo,
                    "cena": r.get("cena") or "",
                    "data": r.get("data") or "",
                    "nuvem": nuvem,
                    "processo": r.get("processo") or "",
                    "fase": r.get("fase") or "",
                    "bbox": r.get("bbox"),
                    "hash": r.get("hash") or "",
                    "tamanho": int(st.st_size),
                }
            )
    if not registros:
        raise SystemExit(
            f"Nenhum recorte válido em {dados} (resumo: {descartados})."
        )
    return registros, descartados, vistos


def varrer_jpgs_orfaos(dados: Path, chaves_checkpoint) -> int:
    """Conta JPGs do disco que o checkpoint ainda não descreveu.

    Não é erro: o coletor pode estar rodando junto (a imagem sai antes
    da linha do checkpoint). Só é aviso, para o relatório não prometer
    índice completo quando falta metadado.
    """
    orfaos = 0
    for sub in ("positivo", "negativo"):
        pasta = dados / "recortes" / sub
        if not pasta.is_dir():
            continue
        for p in pasta.glob("*.jpg"):
            if f"{sub}/{p.name}" not in chaves_checkpoint:
                orfaos += 1
    return orfaos


# ----------------------------------------------------------- índice ----
def carregar_indice(saida: Path, nuvem_max: float):
    """Carrega o índice existente, ou devolve None se não houver.

    Valida a coerência (manifesto x tamanho dos arrays) e o corte de
    nuvem: trocar nuvem_max sem --reindexar misturaria vetores de dois
    critérios de seleção, e a busca não teria como avisar.
    """
    arq_v, arq_m, arq_man = (
        saida / ARQ_VETORES,
        saida / ARQ_METADADOS,
        saida / ARQ_MANIFESTO,
    )
    if not (arq_v.exists() and arq_m.exists() and arq_man.exists()):
        return None
    manifesto = json.loads(arq_man.read_text(encoding="utf-8"))
    if manifesto.get("versao") != VERSAO_INDICE:
        raise SystemExit(
            f"Índice com versão {manifesto.get('versao')} (esperado "
            f"{VERSAO_INDICE}). Rode com --reindexar."
        )
    if float(manifesto.get("nuvem_max", -1)) != float(nuvem_max):
        raise SystemExit(
            f"Índice foi gerado com nuvem_max="
            f"{manifesto.get('nuvem_max')}, você pediu {nuvem_max}. "
            "Os critérios precisam bater — rode com --reindexar."
        )
    vetores = np.load(arq_v)
    metadados = json.loads(arq_m.read_text(encoding="utf-8"))
    if len(vetores) != len(metadados):
        raise SystemExit(
            f"Índice corrompido: {len(vetores)} vetores x "
            f"{len(metadados)} metadados. Rode com --reindexar."
        )
    return vetores.astype(np.float32), metadados, manifesto


def salvar_indice(saida: Path, blocos, metadados, manifesto):
    """Grava vetores + metadados + manifesto de forma atômica.

    Escreve em arquivo .tmp e troca com os.replace: ou o índice novo
    inteiro entra, ou fica o antigo. Nunca meio índice (que quebraria a
    correspondência linha-a-linha entre vetor e metadado).
    """
    saida.mkdir(parents=True, exist_ok=True)
    matriz = (
        np.concatenate(blocos, axis=0) if blocos else np.zeros((0, DIM_PADRAO), np.float32)
    )
    # float16 no disco: metade do espaço; a busca reconverte para fp32.
    tmp_v = saida / (ARQ_VETORES + ".tmp")
    with open(tmp_v, "wb") as f:
        np.save(f, matriz.astype(np.float16), allow_pickle=False)
    os.replace(tmp_v, saida / ARQ_VETORES)

    tmp_m = saida / (ARQ_METADADOS + ".tmp")
    tmp_m.write_text(
        json.dumps(metadados, ensure_ascii=False), encoding="utf-8"
    )
    os.replace(tmp_m, saida / ARQ_METADADOS)

    manifesto["n"] = len(metadados)
    manifesto["atualizado"] = time.strftime("%Y-%m-%d %H:%M:%S")
    tmp_man = saida / (ARQ_MANIFESTO + ".tmp")
    tmp_man.write_text(
        json.dumps(manifesto, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    os.replace(tmp_man, saida / ARQ_MANIFESTO)


# ----------------------------------------------------------- modelo ----
def montar_modelo(dir_modelo: Path, dispositivo):
    """Carrega Chinese-CLIP (só safetensors) + processador.

    Falha alto se faltar model.safetensors ou vocab.txt: um erro claro
    vale mais que um traceback no meio da indexação.
    """
    dir_modelo = Path(dir_modelo)
    safetensors = dir_modelo / "model.safetensors"
    if not safetensors.exists():
        raise SystemExit(
            f"model.safetensors não encontrado em {dir_modelo}.\n"
            "O pytorch_model.bin não pode ser usado (CVE-2025-32434 no "
            "torch 2.5.1). Baixe com:\n"
            "  curl -L -o model.safetensors "
            "https://huggingface.co/OFA-Sys/chinese-clip-vit-base-patch16/"
            "resolve/main/model.safetensors"
        )
    modelo = ChineseCLIPModel.from_pretrained(
        str(dir_modelo), use_safetensors=True
    )
    processador = ChineseCLIPProcessor.from_pretrained(str(dir_modelo))
    if not (dir_modelo / "vocab.txt").exists() or len(processador.tokenizer) < 1000:
        raise SystemExit(
            f"Tokenizer incompleto em {dir_modelo} "
            f"(vocab={len(processador.tokenizer)}). Falta o vocab.txt."
        )
    modelo.to(dispositivo).eval()
    return modelo, processador


def abrir_imagem(caminho: str) -> Image.Image:
    """Abre o JPG e devolve RGB pronto para o processador.

    O processador do Chinese-CLIP faz resize para 224x224 sozinho
    (preprocessor_config.json); não redimensionamos aqui para não
    duplicar passo nem mudar o recorte que o modelo vê.
    """
    with Image.open(caminho) as im:
        return im.convert("RGB")


@torch.no_grad()
def codificar_lote(modelo, processador, caminhos, dispositivo):
    """Vetoriza um lote de imagens: [b, 512] float32 normalizado (L2).

    fp16 só no forward (autocast), pesos em fp32. A normalização sai
    DEPOIS do cast para fp32, para o cosseno não herdar erro de fp16.
    """
    imgs = [abrir_imagem(c) for c in caminhos]
    pv = processador(images=imgs, return_tensors="pt")["pixel_values"]
    pv = pv.to(dispositivo, non_blocking=True)
    uso_amp = torch.amp.autocast(
        "cuda", dtype=torch.float16, enabled=dispositivo.type == "cuda"
    )
    with uso_amp:
        out = modelo.get_image_features(pixel_values=pv)
    # transformers 5.5: get_image_features devolve objeto; embedding em
    # .pooler_output, sem normalizar (medido pelo Agente B).
    emb = F.normalize(out.pooler_output, dim=-1).float()
    return emb.cpu().numpy()


def _e_oom(erro) -> bool:
    """Detecta estouro de VRAM (exceção dedicada ou mensagem do CUDA)."""
    if isinstance(erro, torch.cuda.OutOfMemoryError):
        return True
    return isinstance(erro, RuntimeError) and "out of memory" in str(erro).lower()


# ------------------------------------------------------------- main ----
def main():
    ap = argparse.ArgumentParser(
        description=(
            "Indexa os recortes de cava no Chinese-CLIP e gera o índice "
            "de busca por similaridade (vetores .npy + metadados)."
        )
    )
    ap.add_argument("--dados", type=Path, default=DEFAULT_DADOS,
                    help="dir com checkpoint.jsonl e recortes/")
    ap.add_argument("--saida", type=Path, default=DEFAULT_SAIDA,
                    help="dir do índice (vetores.npy, metadados.json)")
    ap.add_argument("--modelo", type=Path, default=DEFAULT_MODELO,
                    help="dir do Chinese-CLIP local (só safetensors)")
    ap.add_argument("--batch", type=int, default=16,
                    help="tamanho do lote (8–16 na RTX 3050 4 GiB)")
    ap.add_argument("--reindexar", action="store_true",
                    help="ignora o índice existente e refaz tudo")
    ap.add_argument("--nuvem-max", type=float, default=NUVEM_MAX,
                    help="corte de nuvem (padrão 0.20, igual ao treino)")
    ap.add_argument("--salvar-a-cada", type=int, default=250,
                    help="checkpoint do índice a cada N crops indexados")
    args = ap.parse_args()

    if args.batch < 1:
        raise SystemExit("--batch precisa ser >= 1")

    dispositivo = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if dispositivo.type != "cuda":
        raise SystemExit(
            "CUDA indisponível: o plano exige a RTX 3050 desta máquina."
        )

    t_total0 = time.time()
    registros, resumo, chaves_ckp = ler_checkpoint(args.dados, args.nuvem_max)
    orfaos = varrer_jpgs_orfaos(args.dados, chaves_ckp)
    print(
        f"Dados: {len(registros)} recortes com metadado em {args.dados}\n"
        f"  descartados: nuvem>{args.nuvem_max}={resumo['nuvem']}, "
        f"JPG ausente={resumo['sem_jpg']}, linha inválida={resumo['tipo']}, "
        f"duplicado={resumo['duplicado']}"
        + (f"\n  AVISO: {orfaos} JPG(s) no disco ainda sem metadado "
           "(coleta em andamento?)" if orfaos else "")
    )

    # ---- retomada: o que já está no índice e o que ficou velho ----
    if args.reindexar:
        print("Modo --reindexar: índice existente será ignorado.")
        blocos, metadados, pendentes = [], [], registros
        manifesto = None
        ja_indexados = 0
    else:
        carregado = carregar_indice(args.saida, args.nuvem_max)
        if carregado is None:
            blocos, metadados, pendentes = [], [], registros
            manifesto = None
            ja_indexados = 0
        else:
            vetores_antigos, metadados_antigos, manifesto = carregado
            # Tamanho novo por chave: mesmo nome com conteúdo diferente
            # (coletor regravou) invalida a linha — vetor velho serviria
            # para imagem nova, o pior tipo de erro num índice.
            tamanho_novo = {r["chave"]: r["tamanho"] for r in registros}
            velhos = {
                i for i, m in enumerate(metadados_antigos)
                if m.get("tamanho") is not None
                and tamanho_novo.get(m["chave"]) is not None
                and m["tamanho"] != tamanho_novo[m["chave"]]
            }
            if velhos:
                print(
                    f"  {len(velhos)} recorte(s) mudou de tamanho: "
                    "serão reindexados."
                )
            mantidos = [
                i for i in range(len(metadados_antigos)) if i not in velhos
            ]
            blocos = [vetores_antigos[mantidos]] if mantidos else []
            metadados = [metadados_antigos[i] for i in mantidos]
            ja_indexados = len(metadados)
            tem = {m["chave"] for m in metadados}
            pendentes = [r for r in registros if r["chave"] not in tem]

    if manifesto is None:
        manifesto = {
            "versao": VERSAO_INDICE,
            "dim": DIM_PADRAO,
            "dtype": "float16",
            "nuvem_max": args.nuvem_max,
            "chave": "tipo/arquivo",
            "dados": str(args.dados),
            "modelo": str(args.modelo),
            "pesos": "model.safetensors",
            "criado": time.strftime("%Y-%m-%d %H:%M:%S"),
            "torch": torch.__version__,
            "transformers": __import__("transformers").__version__,
        }
    print(
        f"Índice em {args.saida}: {ja_indexados} já indexados, "
        f"{len(pendentes)} pendentes."
    )

    if not pendentes:
        print("Nada a indexar. Pronto.")
        return

    modelo, processador = montar_modelo(args.modelo, dispositivo)
    # Confere a dimensão projetada no config: se não for 512, o diretório
    # --modelo não é o ViT-B/16 esperado e o índice sairia incompatível
    # com a busca.
    dim_real = int(getattr(modelo.config, "projection_dim", DIM_PADRAO))
    if dim_real != DIM_PADRAO:
        raise SystemExit(
            f"projection_dim do modelo é {dim_real}, esperado {DIM_PADRAO}. "
            "Confira o diretório --modelo."
        )
    if manifesto.get("dim") != DIM_PADRAO:
        raise SystemExit(
            f"Índice existente tem dim={manifesto.get('dim')} — rode com "
            "--reindexar."
        )

    t0 = time.time()
    if dispositivo.type == "cuda":
        torch.cuda.reset_peak_memory_stats(dispositivo)

    pendentes_novos, metadados_novos = [], []
    batch_atual = args.batch
    indexados_agora = 0
    desde_ultima_salva = 0
    i = 0

    def despejar():
        """Acumula o lote pronto e grava checkpoint do índice."""
        nonlocal pendentes_novos, metadados_novos, desde_ultima_salva
        if not pendentes_novos:
            return
        blocos.append(np.concatenate(pendentes_novos, axis=0))
        metadados.extend(metadados_novos)
        pendentes_novos, metadados_novos = [], []
        desde_ultima_salva = 0
        salvar_indice(args.saida, blocos, metadados, manifesto)

    while i < len(pendentes):
        lote = pendentes[i:i + batch_atual]
        caminhos = [r["caminho"] for r in lote]
        try:
            emb = codificar_lote(modelo, processador, caminhos, dispositivo)
        except (torch.cuda.OutOfMemoryError, RuntimeError) as e:
            if not _e_oom(e):
                raise
            if batch_atual == 1:
                raise SystemExit(
                    "CUDA OOM mesmo com lote=1. A GPU deve estar com outra "
                    "sessão usando a memória — espere e rode de novo."
                )
            print(
                f"CUDA OOM com lote={batch_atual}: dormindo 60 s, esvaziando "
                f"cache e tentando com lote={max(1, batch_atual // 2)}..."
            )
            torch.cuda.empty_cache()
            time.sleep(60)
            batch_atual = max(1, batch_atual // 2)
            continue

        pendentes_novos.append(emb)
        metadados_novos.extend(lote)
        i += len(lote)
        indexados_agora += len(lote)
        desde_ultima_salva += len(lote)

        if desde_ultima_salva >= args.salvar_a_cada:
            despejar()
            decorrido = time.time() - t0
            taxa = indexados_agora / decorrido if decorrido else 0.0
            print(
                f"  {indexados_agora}/{len(pendentes)} crops "
                f"({taxa:.1f} crops/s, lote={batch_atual})"
            )

    despejar()
    salvar_indice(args.saida, blocos, metadados, manifesto)

    t_encode = time.time() - t0
    taxa = indexados_agora / t_encode if t_encode else 0.0
    vram = torch.cuda.max_memory_allocated(dispositivo) / 2**30
    t_total = time.time() - t_total0
    proj_20k = META_ALVO / taxa if taxa else 0.0

    print()
    print("=== Índice gerado ===")
    print(f"  vetor novos ......... {indexados_agora} (total {len(metadados)})")
    print(f"  dimensão ............ {DIM_PADRAO} (normalizado L2)")
    print(f"  lote final .......... {batch_atual} (inicial {args.batch})")
    print(f"  throughput .......... {taxa:.2f} crops/s")
    print(f"  tempo indexação ..... {t_encode:.1f} s")
    print(f"  tempo total ......... {t_total:.1f} s (com carga do modelo)")
    print(f"  VRAM máxima ......... {vram:.2f} GiB")
    print(
        f"  extrapolação 20 mil . {proj_20k / 60:.1f} min "
        f"({proj_20k:.0f} s) nesse mesmo ritmo"
    )
    print(f"  saída ............... {args.saida}")
    print(f"  consulta ............ python scripts/buscar-cavas.py --texto \"...\"")


if __name__ == "__main__":
    main()
