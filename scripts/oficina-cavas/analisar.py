"""An├ílise em lote dos recortes de cavas j├í coletados (est├ígio 2 da Oficina).

O que ├®: passa por todos os .jpg do disco (recortes positivo/ e negativo/),
pontua cada um com o modelo fine-tune v7 e grava a pontua├º├úo em
`analisados.jsonl` ÔÇö uma linha por hash, incremental e retom├ível.

Por que separar da coleta: o gate de nuvem (medir_nuvem) e o classificador
rodam S├ô no momento do download. Se o gate ou o modelo mudam (v6 ÔåÆ v7), os
recortes antigos ficam com score antigo e n├úo d├í para reavaliar sem rebaixar
tudo. Separar o est├ígio de an├ílise permite reprocessar os ~5.131 recortes
existentes em minutos, offline, sem tocar a rede do INPE.

Duas pontua├º├Áes por recorte:
1. `score_cava` ÔÇö sa├¡da do classificador v7 (sigmoid do logit da cabe├ºa
   Linear(512,1) sobre o embedding do Chinese-CLIP). Limiar de decis├úo
   0.65 (medido no holdout v7: precis├úo 0.794, recall 0.851, F1 0.822).
2. `nuvem_jpg` ÔÇö regra de acromatismo/brilho recalculada no pr├│prio JPEG
   (8-bit). ├ë uma segunda opini├úo barata: o gate da coleta mediu nos bandas
   16-bit; aqui medimos no JPEG pronto, para checar se algum recorte passou
   com nuvem alta por falha de regra.

Retom├ível: o `analisados.jsonl` ├® lido no in├¡cio; hashes j├í analisados s├úo
pulados. Se o PC suspender no meio, o pr├│ximo start continua de onde parou.

Uso:
    python scripts/oficina-cavas/analisar.py --limite 500   # analisa 500 novos
    python scripts/oficina-cavas/analisar.py                # analisa todos os pendentes
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# Raiz do repo e caminhos fixos ÔÇö mesmos do coletor.
_RAIZ = Path(__file__).resolve().parents[2]
_CACHE = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
_RECORTES = _CACHE / "recortes"
_CHECKPOINT = _CACHE / "checkpoint.jsonl"
_ANALISADOS = _CACHE / "analisados.jsonl"

# Modelo fine-tune v7 (medido 13/10/2026): limiar 0.65, F1 0.822 no holdout.
import tempfile
_TMP = Path(tempfile.gettempdir())
DIR_MODELO_BASE = _TMP / "opencode" / "cavas" / "chinese-clip"
DIR_TREINO_V7 = _TMP / "opencode" / "cavas" / "treino-v7"
LIMIAR_V7 = 0.65

# Calibração por temperatura (medido 15/10/2026): os logits do v7 saem
# comprimidos — a cabeça Linear(512,1) tem peso ~0.030, então o sigmoid
# do positivo fica preso em ~0.658 (nunca passa de 0,70). Dividir o logit
# por T=0.5 antes do sigmoid ESTICA a distribuição sem mudar a ordem das
# predições: no holdout o F1 fica 0,834 estável de limiar 0,5 a 0,9, o que
# permite refiltrar rígido (limiar alto) sem perder os positivos bons.
# Fonte da medição: scripts/oficina-cavas/calibrar-modelo.py --otimizar.
TEMPERATURA_CALIB = 0.5

# Constantes de nuvem no JPEG 8-bit (mesmas regras do coletor, adaptadas
# de uint16 para uint8 ÔÇö os limiares de satura├º├úo e brilho s├úo adimensionais,
# ent├úo valem igual).
SAT_NUVEM = 0.20
BRILHO_NUVEM = 0.35 * 255  # 88.95 em 8-bit


def ler_checkpoint(caminho: Path = _CHECKPOINT) -> list[dict]:
    """L├¬ o checkpoint do coletor: uma linha JSON por recorte coletado."""
    itens: list[dict] = []
    if not caminho.exists():
        return itens
    with open(caminho, encoding="utf-8") as fh:
        for linha in fh:
            linha = linha.strip()
            if not linha:
                continue
            try:
                itens.append(json.loads(linha))
            except json.JSONDecodeError:
                continue  # linha meio escrita ÔÇö pula
    return itens


def ler_analisados(caminho: Path = _ANALISADOS) -> dict[str, dict]:
    """Hash ÔåÆ registro j├í analisado. Retomada: s├│ analisa o que falta."""
    feitos: dict[str, dict] = {}
    if not caminho.exists():
        return feitos
    with open(caminho, encoding="utf-8") as fh:
        for linha in fh:
            linha = linha.strip()
            if not linha:
                continue
            try:
                reg = json.loads(linha)
                if reg.get("hash"):
                    feitos[reg["hash"]] = reg
            except json.JSONDecodeError:
                continue
    return feitos


def nuvem_em_jpg(img: Image.Image) -> float:
    """Regra de nuvem recalculada no JPEG (0..1). Mesma l├│gica do coletor:
    acromatismo (satura├º├úo baixa) + brilho alto. 1.0 quando dispara corte."""
    arr = np.asarray(img.convert("RGB"), dtype=np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    v = (r > 0) & (g > 0) & (b > 0)
    n = max(int(v.sum()), 1)
    br = np.where(v, (r + g + b) / 3.0, 0.0)
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = (mx - mn) / np.maximum(mx, 1.0)
    frac_acrom = float(((sat <= SAT_NUVEM) & v).sum()) / n
    nuvem = float(np.mean((r > BRILHO_NUVEM) & (g > BRILHO_NUVEM)
                          & (b > BRILHO_NUVEM)))
    if frac_acrom > 0.75:  # quase tudo acrom├ítico = c├®u nublado
        nuvem = 1.0
    return min(max(nuvem, 0.0), 1.0)


class PontuadorV7:
    """Carrega o Chinese-CLIP + cabe├ºa v7 e pontua imagens.

    Mantido numa classe para carregar os pesos UMA vez (o modelo tem
    ~750 MB; recarregar por imagem levaria minutos). Uso:

        p = PontuadorV7.disponivel()
        if p:
            score = p.pontuar(Path("recorte.jpg"))
    """

    def __init__(self, modelo, processador, cabeca, dispositivo):
        self.modelo = modelo
        self.processador = processador
        self.cabeca = cabeca
        self.dispositivo = dispositivo

    @classmethod
    def disponivel(cls) -> "PontuadorV7 | None":
        """Carrega v7 se existir; devolve None se faltar peso (sem quebrar)."""
        import torch
        from transformers import ChineseCLIPModel, ChineseCLIPProcessor

        if not (DIR_MODELO_BASE / "model.safetensors").exists():
            return None
        if not (DIR_TREINO_V7 / "melhor.pt").exists():
            return None
        dispositivo = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu")
        modelo = ChineseCLIPModel.from_pretrained(
            str(DIR_MODELO_BASE), use_safetensors=True)
        processador = ChineseCLIPProcessor.from_pretrained(
            str(DIR_MODELO_BASE))
        ck = torch.load(DIR_TREINO_V7 / "melhor.pt",
                        map_location="cpu", weights_only=False)
        modelo.load_state_dict(ck["modelo"])
        # Cabe├ºa bin├íria Linear(512,1) ÔÇö mesma do treino v7.
        import torch.nn as nn
        cabeca = nn.Linear(512, 1)
        cabeca.load_state_dict(ck["cabeca"])
        modelo.to(dispositivo).eval()
        cabeca.to(dispositivo).eval()
        return cls(modelo, processador, cabeca, dispositivo)

    def pontuar(self, caminho: Path) -> float | None:
        """Devolve score_cava (sigmoid 0..1) ou None se a imagem falhar."""
        import torch
        import torch.nn.functional as F
        try:
            with Image.open(caminho) as im:
                img = im.convert("RGB")
            pv = self.processador(
                images=[img], return_tensors="pt")["pixel_values"]
            pv = pv.to(self.dispositivo)
            with torch.no_grad():
                out = self.modelo.get_image_features(pixel_values=pv)
                emb = F.normalize(out.pooler_output, dim=-1)
                logit = self.cabeca(emb.float()).squeeze(-1)
                # Temperatura de calibração: estica o logit comprimido do v7.
                prob = torch.sigmoid(logit / TEMPERATURA_CALIB)
                return float(prob.cpu().item())
        except Exception:
            return None


def _processar_item(item: dict, pont: "PontuadorV7 | None") -> dict | None:
    """Analisa um recorte e devolve o registro, ou None se falhar.

    Extra├¡do de analisar() para baixar a complexidade ciclom├ítica: cada
    caminho de falha (arquivo ausente, imagem ileg├¡vel) vira um return
    None nomeado em vez de um `continue` aninhado no la├ºo.
    """
    tipo = item.get("tipo", "desconhecido")
    caminho = _RECORTES / tipo / item["arquivo"]
    if not caminho.exists():
        return None
    try:
        with Image.open(caminho) as im:
            nuv = nuvem_em_jpg(im)
    except Exception:
        return None
    score = pont.pontuar(caminho) if pont else None
    return {
        "hash": item["hash"], "arquivo": item["arquivo"],
        "tipo": tipo, "cena": item.get("cena"),
        "nuvem_coleta": item.get("nuvem"),
        "nuvem_jpg": round(nuv, 4),
        "score_cava": round(score, 4) if score is not None else None,
        "modelo": "v7" if score is not None else None,
    }


def _pendentes(checkpoint: list[dict], feitos: dict,
               limite: int | None) -> list[dict]:
    """Recortes do checkpoint ainda n├úo analisados, at├® o limite.

    Extra├¡do de analisar() para manter a complexidade do la├ºo principal
    abaixo do teto do CodeScene.
    """
    pend = [i for i in checkpoint
            if i.get("hash") and i["hash"] not in feitos and i.get("arquivo")]
    return pend[:limite] if limite else pend


def analisar(limite: int | None = None, refazer: bool = False) -> int:
    """Analisa recortes pendentes. Devolve quantos novos foram analisados.

    Com refazer=True, re-pontua TODOS os recortes do checkpoint e regrava
    o analisados.jsonl do zero. Serve para aplicar uma nova calibração
    (ex.: a temperatura T=0.5 do v7) aos scores já existentes.

    O log de eventos fica por conta do orquestrador (oficina.py), que envolve
    cada estágio com o LoggerOficina — aqui só imprimimos progresso.
    """
    checkpoint = ler_checkpoint()
    # refazer: ignora os "feitos" e truncar o arquivo; senão só acrescenta.
    feitos = {} if refazer else ler_analisados()
    pendentes = _pendentes(checkpoint, feitos, limite)
    modo = "w" if refazer else "a"

    print(f"recortes no checkpoint: {len(checkpoint)} | "
          f"já analisados: {len(feitos)} | novos a analisar: {len(pendentes)}",
          flush=True)

    pont = PontuadorV7.disponivel()
    if pont is None:
        print("AVISO: modelo v7 indisponível — só nuvem_jpg será gravado.",
              flush=True)

    _ANALISADOS.parent.mkdir(parents=True, exist_ok=True)
    n_ok = 0
    with open(_ANALISADOS, modo, encoding="utf-8") as out:
        for item in pendentes:
            reg = _processar_item(item, pont)
            if reg is None:
                continue
            out.write(json.dumps(reg, ensure_ascii=False) + "\n")
            out.flush()
            n_ok += 1
            if n_ok % 25 == 0:
                print(f"  analisados: +{n_ok} "
                      f"(último score={reg['score_cava']})", flush=True)
    print(f"análise concluída: +{n_ok} novos em {len(pendentes)} tentados",
          flush=True)
    return n_ok


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--limite", type=int, default=None,
                    help="quantos recortes novos analisar nesta rodada")
    ap.add_argument("--refazer", action="store_true",
                    help="re-pontua todos os recortes e regrava (nova calibração)")
    args = ap.parse_args(argv)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    analisar(args.limite, args.refazer)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
