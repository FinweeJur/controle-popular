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
LIM_POS="${LIM_POS:-20}"
LIM_NEG="${LIM_NEG:-20}"
URL_REPO="https://github.com/FinweeJur/controle-popular"

echo "[preparador] inicio $(date -u +%FT%TZ)"

# SEM BLOB_SAS a rodada nao tem prova de fim. O timer/systemd da VM inicia
# sozinho no boot e rodava local-only ate morrer por OOM (medido 29/10).
# Teste local de proposito precisa de PERMITIR_LOCAL=1.
if [ -z "${BLOB_SAS:-}" ] && [ "${PERMITIR_LOCAL:-0}" != "1" ]; then
  echo "[preparador] sem BLOB_SAS; rodada local exige PERMITIR_LOCAL=1. Saindo."
  exit 0
fi

# SWAP 2G: a B2ats_v2 tem ~887 MB e o docker consome parte. Sem swap o
# coletor morre com Killed (medido 29/10). O disco P4 ja e cobrado; swap nao
# muda a fatura e evita o OOM. swapfile persiste em /etc/fstab.
if ! swapon --show 2>/dev/null | grep -q '/swapfile'; then
  if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile 2>/dev/null \
      || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
  fi
  swapon /swapfile 2>/dev/null || true
  grep -q '^/swapfile' /etc/fstab 2>/dev/null \
    || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
sysctl -w vm.swappiness=10 >/dev/null 2>&1 || true

STAMP=$(date -u +%Y%m%d-%H%M)
BLOB_CONTAINER="${BLOB_CONTAINER:-cavas}"
URL_BLOB=""
PROGRESSO=""
ping() { :; }

# HEARTBEAT NO BLOB — o unico canal vivo durante a coleta.
# Medido 12/10/2026: enquanto o preparador roda, a extensao run-command da
# VM fica OCUPADA e todo `az vm run-command` de fora responde
# "Conflict: Run command extension execution is in progress" (75 min medidos
# no run das 03:19). Nem o proprio workflow consegue ler
# /var/log/preparador-cavas.log antes de desligar a VM — entao a causa de
# uma coleta que nao termina ficava invisivel. Este arquivo pequeno e
# REESCRITO a cada 60 s com fase e contagem de recortes: prova que comecou,
# mostra o avanco de fora (o workflow le e imprime) e marca o fim.
# O SAS vale 3 h; depois disso o curl falha calado (`|| true`) e o arquivo
# para de atualizar — envelhecer tambem e sinal.
if [ -n "${BLOB_ACCOUNT:-}" ] && [ -n "${BLOB_SAS:-}" ]; then
  URL_BLOB="https://${BLOB_ACCOUNT}.blob.core.windows.net/${BLOB_CONTAINER}"
  PROGRESSO="/tmp/progresso-${STAMP}.json"
  ping() {
    local fase="$1" pos neg
    pos=$(find "$REPO/scripts/.cache/cavas-calibracao/recortes/positivo" -type f 2>/dev/null | wc -l || true)
    neg=$(find "$REPO/scripts/.cache/cavas-calibracao/recortes/negativo" -type f 2>/dev/null | wc -l || true)
    printf '{"fase":"%s","em":"%s","stamp":"%s","positivos":%d,"negativos":%d}\n' \
      "$fase" "$(date -u +%FT%TZ)" "$STAMP" "${pos:-0}" "${neg:-0}" > "$PROGRESSO"
    curl -fsS --connect-timeout 10 --max-time 60 -X PUT -H "x-ms-blob-type: BlockBlob" \
      --upload-file "$PROGRESSO" \
      "${URL_BLOB}/progresso-${STAMP}.json?${BLOB_SAS}" >/dev/null 2>&1 || true
  }
  # LOG VIA BLOB: a extensao run-command fica OCUPADA enquanto o preparador
  # roda (Conflict medido por 75 min) e, no run de 14:23 (12/10), o CMD nem
  # chegou a executar — nos dois casos /var/log/... fica ilegivel de fora.
  # Cada execucao despeja a cauda do log no Blob: no inicio leva a do run
  # anterior, e no fim/abort leva a propria. E o diagnostico que nao depende
  # do az.
  enviar_log() {
    local nome="$1"
    tail -n 150 /var/log/preparador-cavas.log > "/tmp/log-${STAMP}-${nome}.txt" 2>/dev/null || true
    curl -fsS --connect-timeout 10 --max-time 60 -X PUT -H "x-ms-blob-type: BlockBlob" \
      --upload-file "/tmp/log-${STAMP}-${nome}.txt" \
      "${URL_BLOB}/log-${STAMP}-${nome}.txt?${BLOB_SAS}" >/dev/null 2>&1 || true
  }
else
  enviar_log() { :; }
fi

# A cauda do log de JA RODADAS e a primeira coisa que sai — se este run
# morrer antes de qualquer outra coisa, ainda assim ficamos com o fim do
# anterior no Blob.
enviar_log "inicio"

# Se o script MORRE no meio (set -e), o EXIT trap grava "abortado-rc<N>" no
# proprio heartbeat antes de matar o loop: o Blob passa a dizer ONDE e POR QUE
# parou. Medido 12/10/2026 no run das 13:22 — o arquivo congelou em
# "negativos" sem codigo, e sem codigo a causa fica no escuro. Sucesso grava
# "fim" e marca FINALIZOU, para o trap nao sobrescrever.
FINALIZOU=0
WATCH=""
trap 'rc=$?; if [ "$FINALIZOU" -ne 1 ]; then ping "abortado-rc${rc}" || true; enviar_log "abortado-rc${rc}" || true; fi; if [ -n "$WATCH" ]; then kill "$WATCH" 2>/dev/null || true; fi' EXIT

# O loop comeca AQUI, antes do apt e do repo: a maioria das mortes antigas
# acontecia antes de qualquer recorte existir, e sem heartbeat nenhuma fase
# de preparacao aparecia. Dorme antes de gravar para nao apagar o marcador
# da fase atual.
if [ -n "$PROGRESSO" ]; then
  ping preparando
  ( set +e; while :; do sleep 60; ping coletando || true; done ) &
  WATCH=$!
fi

# 1) Dependencias: Python + numpy + Pillow + rasterio vem do apt (evita pip/PEP 668).
# O rasterio entrou na condicao por MEDICAO em 12/10/2026: todo run da VM desde
# 11/10 morria no primeiro negativo com ModuleNotFoundError no import lazy de
# rasterio dentro de ler_janela (scripts/coletar-cavas-calibracao.py:417).
# Testar os quatro juntos e instalar o que faltar ANTES de qualquer coleta.
if ! command -v python3 >/dev/null 2>&1 || ! python3 -c "import numpy, PIL, rasterio" >/dev/null 2>&1; then
  echo "[preparador] instalando python3/numpy/pillow/rasterio/git via apt"
  ping apt
  export DEBIAN_FRONTEND=noninteractive
  # DPKG INTERROMPIDO: um apt anterior morto no meio (reboot, auto-shutdown ou
  # desligamento da VM) deixa o banco do dpkg com pacote pendente, e TODO
  # apt-get seguinte recusa com rc100 "dpkg was interrupted, you must manually
  # run 'dpkg --configure -a'". Medido 12/10/2026 nos runs das 19:21 e 22:05:
  # os dois morreram em 10-18 s, antes de instalar qualquer coisa, e o
  # heartbeat gravava "abortado-rc100". Consertar o banco ANTES do update e a
  # cura exata que o proprio erro pede. `|| true` porque quem relata o estado
  # final do pacote e o apt-get logo abaixo — aqui so desfaz o que ficou pela
  # metade.
  dpkg --configure -a || true
  apt-get update -y
  apt-get install -y python3 python3-numpy python3-pil python3-rasterio git ca-certificates
fi

# MUNCHA DE SEGURANCA do rasterio: nem toda imagem traz python3-rasterio, e
# falhar AQUI e melhor do que morrer 10 linhas adiante no meio do coletor,
# com o heartbeat ja batendo e o checkpoint pela metade. O Ubuntu 24.04 bloqueia
# pip no sistema (PEP 668), entao a primeira tentativa carrega
# --break-system-packages; se nem isso colar, tenta o pip normal. Depois de
# tudo, se o import ainda falha: mensagem clara e exit 4 — codigo distinto de
# rc1. O EXIT trap (instalado la em cima, antes deste bloco) grava
# "abortado-rc4" no heartbeat e despeja o log no Blob.
if ! python3 -c "import rasterio" >/dev/null 2>&1; then
  echo "[preparador] rasterio ausente apos o apt — tentando pip3"
  pip3 install rasterio --break-system-packages \
    || pip3 install rasterio \
    || true
fi
if ! python3 -c "import rasterio" >/dev/null 2>&1; then
  echo "[preparador] ERRO: rasterio nao importa nem depois do apt e do pip3." >&2
  echo "[preparador] ERRO: abortando antes do coletor (exit 4), para nao morrer no meio da coleta." >&2
  exit 4
fi
ping deps-ok

# 2) Repo (publico, sem credencial). Depth 1 basta; o dado vem do STAC/WFS.
if [ -d "$REPO/.git" ]; then
  # Um fetch morto no meio (reboot ou desligamento da VM) deixa shallow.lock
  # (ou index.lock) para tras, e o git recusa TODO fetch seguinte com rc128
  # "Unable to create '.git/shallow.lock': File exists" — medido 12/10/2026.
  # O lock e so um marcador de trabalho interrompido: apaga-lo aqui e seguro
  # porque nenhum outro git roda nesta VM durante o preparador.
  rm -f "$REPO/.git/shallow.lock" "$REPO/.git/index.lock"
  echo "[preparador] atualizando o repo"
  ping repo
  git -C "$REPO" fetch --depth 1 origin main
  git -C "$REPO" reset --hard origin/main
else
  echo "[preparador] clonando o repo"
  ping clone
  git clone --depth 1 "$URL_REPO" "$REPO"
fi
ping repo-ok

cd "$REPO"

# 3) Coleta sequencial: UM escritor por checkpoint (positivo, depois negativo).
echo "[preparador] positivos (limite=$LIM_POS)"
ping positivos
python3 scripts/coletar-cavas-calibracao.py --tipo positivo --limite "$LIM_POS"
ping positivos-feitos

echo "[preparador] negativos (limite=$LIM_NEG)"
ping negativos
python3 scripts/coletar-cavas-calibracao.py --tipo negativo --limite "$LIM_NEG"
ping negativos-feitos

echo "[preparador] reexportando o manifesto"
ping manifesto
python3 scripts/coletar-cavas-calibracao.py --exporta

# 4) Envia os recortes (um tar por rodada) e o manifesto para o Blob do Azure,
#    se o workflow passou BLOB_ACCOUNT + BLOB_SAS. Sem isso, so coleta local
#    (util para rodar na mao). O SAS e curto (3 h) e so escreve neste container.
if [ -n "$URL_BLOB" ]; then
  BASE="$REPO/scripts/.cache/cavas-calibracao"
  # Prazos nos curls de upload: sem limite, um PUT travado segura o script
  # ate o desligamento da VM e o manifesto nunca chega (o workflow so sabe
  # que a coleta acabou quando o manifesto sobe). Tar pode ter ~360 MB,
  # por isso 1 h; manifesto e minusculo, 10 min bastam. Retry cobre
  # queda de rede transitoria no meio do envio.
  if [ -d "$BASE/recortes" ]; then
    ping tar
    tar czf /tmp/recortes.tgz -C "$BASE" recortes
    curl -fsS --connect-timeout 15 --max-time 3600 --retry 3 --retry-delay 15 \
      -X PUT -H "x-ms-blob-type: BlockBlob" --upload-file /tmp/recortes.tgz \
      "${URL_BLOB}/recortes-${STAMP}.tgz?${BLOB_SAS}" \
      && echo "[preparador] Blob: recortes-${STAMP}.tgz enviado"
    ping tar-enviado
  fi
  if [ -f "$REPO/apps/web/data/cavas-calibracao-manifesto.json" ]; then
    curl -fsS --connect-timeout 15 --max-time 600 --retry 3 --retry-delay 15 \
      -X PUT -H "x-ms-blob-type: BlockBlob" \
      --upload-file "$REPO/apps/web/data/cavas-calibracao-manifesto.json" \
      "${URL_BLOB}/manifesto-${STAMP}.json?${BLOB_SAS}" \
      && echo "[preparador] Blob: manifesto-${STAMP}.json enviado"
    ping manifesto-enviado
  fi
else
  echo "[preparador] BLOB_ACCOUNT/BLOB_SAS ausentes — recortes ficam so na VM"
fi

ping fim
enviar_log "fim"
FINALIZOU=1
if [ -n "$WATCH" ]; then kill "$WATCH" 2>/dev/null || true; fi

N=$(find "$REPO/scripts/.cache/cavas-calibracao/recortes" -type f 2>/dev/null | wc -l)
echo "[preparador] fim $(date -u +%FT%TZ) — recortes no cache: $N"
