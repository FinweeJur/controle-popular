#!/usr/bin/env bash
# preparador-cavas.sh — Fase 1 do plano das cavas, rodando na VM do Azure.
#
# O QUE FAZ: instala o necessario, atualiza o repo (publico) e roda o coletor
# de calibracao (`coletar-cavas-calibracao.py`) para POSITIVOS e NEGATIVOS,
# reexportando o manifesto. E o "lado CPU" (fase 1-3 do pedido): baixar janelas
# de satelite e recortar/persistir — sem GPU.
#
# POR QUE NA VM: libera a RTX 3050 (home-pc) para os embeddings e o treino.
# A imagem de satelite e publica (INPE/Monitor), entao baixar aqui nao fere a
# decisao "modelo roda local" — o MODELO continua so no PC.
#
# ENTRADAS (env, com padrao):
#   CP_REPO  = /opt/controle-popular   (clone do repo)
#   LIM_POS  = 500    limite de positivos nesta rodada
#   LIM_NEG  = 500    limite de negativos nesta rodada
#   PAUSA    = nao usado (o script ja pausa 2 s/cena por cortesia)
#
# SAIDA: recortes em $CP_REPO/scripts/.cache/cavas-calibracao/recortes/
#        manifesto versionado em apps/web/data/cavas-calibracao-manifesto.json
# (os recortes ficam no disco da VM; o home-pc os puxa por Tailscale/rsync.)
#
# IDEMPOTENTE: pode rodar de novo; o coletor retoma pelo checkpoint.

set -euo pipefail

REPO="${CP_REPO:-/opt/controle-popular}"
LIM_POS="${LIM_POS:-500}"
LIM_NEG="${LIM_NEG:-500}"
URL_REPO="https://github.com/FinweeJur/controle-popular"

echo "[preparador] inicio $(date -u +%FT%TZ)"

# 1) Dependencias: Python + numpy + Pillow vem do apt (evita pip/PEP 668).
if ! command -v python3 >/dev/null 2>&1 || ! python3 -c "import numpy, PIL" >/dev/null 2>&1; then
  echo "[preparador] instalando python3/numpy/pillow/git via apt"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y python3 python3-numpy python3-pil git ca-certificates
fi

# 2) Repo (publico, sem credencial). Depth 1 basta; o dado vem do STAC/WFS.
if [ -d "$REPO/.git" ]; then
  echo "[preparador] atualizando o repo"
  git -C "$REPO" fetch --depth 1 origin main
  git -C "$REPO" reset --hard origin/main
else
  echo "[preparador] clonando o repo"
  git clone --depth 1 "$URL_REPO" "$REPO"
fi

cd "$REPO"

# 3) Coleta sequencial: UM escritor por checkpoint (positivo, depois negativo).
echo "[preparador] positivos (limite=$LIM_POS)"
python3 scripts/coletar-cavas-calibracao.py --tipo positivo --limite "$LIM_POS"

echo "[preparador] negativos (limite=$LIM_NEG)"
python3 scripts/coletar-cavas-calibracao.py --tipo negativo --limite "$LIM_NEG"

echo "[preparador] reexportando o manifesto"
python3 scripts/coletar-cavas-calibracao.py --exporta

# 4) Envia os recortes (um tar por rodada) e o manifesto para o Blob do Azure,
#    se o workflow passou BLOB_ACCOUNT + BLOB_SAS. Sem isso, so coleta local
#    (util para rodar na mao). O SAS e curto (3 h) e so escreve neste container.
if [ -n "${BLOB_ACCOUNT:-}" ] && [ -n "${BLOB_SAS:-}" ]; then
  BLOB_CONTAINER="${BLOB_CONTAINER:-cavas}"
  BASE="$REPO/scripts/.cache/cavas-calibracao"
  STAMP=$(date -u +%Y%m%d-%H%M)
  URL="https://${BLOB_ACCOUNT}.blob.core.windows.net/${BLOB_CONTAINER}"
  if [ -d "$BASE/recortes" ]; then
    tar czf /tmp/recortes.tgz -C "$BASE" recortes
    curl -fsS -X PUT -H "x-ms-blob-type: BlockBlob" --upload-file /tmp/recortes.tgz \
      "${URL}/recortes-${STAMP}.tgz?${BLOB_SAS}" \
      && echo "[preparador] Blob: recortes-${STAMP}.tgz enviado"
  fi
  if [ -f "$REPO/apps/web/data/cavas-calibracao-manifesto.json" ]; then
    curl -fsS -X PUT -H "x-ms-blob-type: BlockBlob" \
      --upload-file "$REPO/apps/web/data/cavas-calibracao-manifesto.json" \
      "${URL}/manifesto-${STAMP}.json?${BLOB_SAS}" \
      && echo "[preparador] Blob: manifesto-${STAMP}.json enviado"
  fi
else
  echo "[preparador] BLOB_ACCOUNT/BLOB_SAS ausentes — recortes ficam so na VM"
fi

N=$(find "$REPO/scripts/.cache/cavas-calibracao/recortes" -type f 2>/dev/null | wc -l)
echo "[preparador] fim $(date -u +%FT%TZ) — recortes no cache: $N"
