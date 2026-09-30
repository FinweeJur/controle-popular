#!/usr/bin/env python3
"""Recolore os cursores Korkhon: o contorno marrom vira preto puro.

Por que existe este script (regra do dev, contraste de elemento gráfico,
WCAG 1.4.11 — "≥3:1 contra qualquer cor adjacente"):

O pacote Korkhon 2.0 XS pinta o contorno em #5c4542 (luminância relativa
0,069) e o preenchimento em areia #cea67b (0,418). Medido contra os oito
temas do portal, o par passa folgado (6,86 a 8,88). Mas o portal não é só
tambor de tema: o globo de terras pinta imagem de satélite, e em solo de
luminância média — floresta (2,26) e asfalto (2,38), medidos — o par
inteiro cai abaixo de 3:1 e o cursor some no chão.

Com o contorno em preto puro (luminância 0) os dois limiares se
sobrepõem e a lacuna fecha:

    preto  vale ≥3:1 quando o fundo tem L ≥ 0,10
    areia  vale ≤3:1 quando o fundo tem L ≤ 0,106

Ou seja: ≥3:1 em QUALQUER fundo, em qualquer tema, em qualquer pixel de
imagem. O preenchimento areia fica intacto — a identidade visual do
pacote sobrevive, muda só a borda.

Como é feito:

- .cur: cada frame é recolorido pixel a pixel. Frames BMP (BGRA 32 bits)
  mudam no lugar, mesmo tamanho. Frames PNG são reencodados e o arquivo
  é remontado (ICONDIRENTRY recalcula bytesInRes e imageOffset).
- .ani: é um contêiner RIFF('ACON') com chunks 'icon' dentro da LIST
  'fram'; cada chunk é um .cur completo e passa pelo mesmo caminho, e os
  tamanhos de LIST e RIFF são reescritos.

Regra de pixel: distância euclidiana no RGB até #5c4542 ≤ 60 vira
preto; o resto não mexe. Areia (distância ~160) e os meios-tons de
sombreamento (distância ~104) ficam. É idempotente: preto ficou a 132
de distância e não volta a casar.

Uso:
    python scripts/recolor-contraste-cursor.py          # grava
    python scripts/recolor-contraste-cursor.py --seco   # só relata
"""

from __future__ import annotations

import io
import struct
import sys
from pathlib import Path

from PIL import Image

# Contorno original do pacote Korkhon 2.0 XS (domínio público, EfeMaden).
MARRON = (0x5C, 0x45, 0x42)
TOLERANCIA = 60.0  # distância RGB; abaixo disso é família do contorno

PASTA = Path(__file__).resolve().parents[1] / "apps" / "web" / "public" / "cursor"

# Fundos usados para relatar o pior caso depois da troca: os dois que
# falhavam (floresta e asfalto, medidos na tela) e três âncoras de tema.
FUNDOS = {
    "floresta": "#4a7a3a",
    "asfalto": "#6b6b6b",
    "pequi (bg)": "#0d0b08",
    "claro (bg)": "#f7f8fa",
    "alto contraste": "#ffffff",
}


def _contorno(rgb: tuple[int, ...]) -> bool:
    """Diz se o pixel pertence à família do contorno (marrom escuro)."""
    r, g, b = rgb[0], rgb[1], rgb[2]
    d2 = (r - MARRON[0]) ** 2 + (g - MARRON[1]) ** 2 + (b - MARRON[2]) ** 2
    return d2 <= TOLERANCIA * TOLERANCIA


def _recolor_bmp(dados: bytes) -> tuple[bytes, int]:
    """Recolore um frame BMP (BGRA 32 bits, linhas de baixo para cima).

    Retorna o frame (mesmo tamanho) e quantos pixels mudaram. Frames que
    não sejam BGRA 32 bits voltam intactos — nunca se mexe no que não se
    entende.
    """
    if len(dados) < 40:
        return dados, 0
    bi_size, largura, altura, _planos, bits = struct.unpack("<IiiHH", dados[:16])
    if bi_size != 40 or bits != 32 or largura <= 0 or altura == 0:
        return dados, 0

    # Ícone quadrado: se a altura veio dobrada é porque o frame traz a
    # máscara AND logo acima do XOR. Só o plano XOR tem cor.
    xor = abs(altura) // 2 if abs(altura) == 2 * largura else abs(altura)
    passo = ((largura * bits + 31) // 32) * 4
    inicio = bi_size
    fim = inicio + passo * xor
    if fim > len(dados):
        return dados, 0

    bruto = bytearray(dados)
    mudou = 0
    for linha in range(xor):
        base = inicio + linha * passo
        for col in range(largura):
            i = base + col * 4
            if _contorno((bruto[i + 2], bruto[i + 1], bruto[i])):
                bruto[i] = bruto[i + 1] = bruto[i + 2] = 0
                mudou += 1
    return bytes(bruto), mudou


def _recolor_png(dados: bytes) -> tuple[bytes, int]:
    """Recolore um frame PNG. Reencoda com PIL (o tamanho pode mudar)."""
    img = Image.open(io.BytesIO(dados)).convert("RGBA")
    px = img.load()
    mudou = 0
    for y in range(img.height):
        for x in range(img.width):
            p = px[x, y]
            if p[3] > 0 and _contorno(p):
                px[x, y] = (0, 0, 0, p[3])
                mudou += 1
    if not mudou:
        return dados, 0
    saida = io.BytesIO()
    img.save(saida, format="PNG")
    return saida.getvalue(), mudou


def _recolor_frame(dados: bytes) -> tuple[bytes, int]:
    """Despacha um frame pelo tipo (PNG pelo assinatura, senão BMP)."""
    if dados[:8] == b"\x89PNG\r\n\x1a\n":
        return _recolor_png(dados)
    return _recolor_bmp(dados)


def processar_cur(dados: bytes) -> tuple[bytes, int, int]:
    """Remonta um .cur com todos os frames recoloridos.

    Retorna (arquivo novo, pixels mudados, frames processados).
    """
    if len(dados) < 6:
        raise ValueError("cur curto demais")
    _reservado, tipo, contagem = struct.unpack("<HHH", dados[:6])
    if tipo != 2:  # 1 = ícone, 2 = cursor; estes arquivos são cursor
        raise ValueError(f"tipo {tipo} não é cursor")

    entradas = []
    for k in range(contagem):
        e = 6 + 16 * k
        registro = bytearray(dados[e : e + 16])
        tam = struct.unpack("<I", registro[8:12])[0]
        desloc = struct.unpack("<I", registro[12:16])[0]
        # bytes 0..7 do registro já guardam tamanho e HOTSPOT (não planos/
        # bits, como num ícone) — por isso o registro é copiado cru.
        entradas.append((registro, dados[desloc : desloc + tam]))

    total = 0
    novos_payloads = []
    for registro, payload in entradas:
        novo, mudou = _recolor_frame(payload)
        total += mudou
        struct.pack_into("<I", registro, 8, len(novo))
        novos_payloads.append((registro, novo))

    saida = bytearray(struct.pack("<HHH", 0, 2, contagem))
    # Formato do CUR: cabeçalho, TODAS as entradas, depois TODOS os frames.
    # Por isso os deslocamentos são calculados antes de escrever qualquer
    # um — montar entrada+frame alternados desloca a tabela inteira.
    base = 6 + 16 * contagem
    deslocamentos = []
    cursor = base
    for _registro, payload in novos_payloads:
        deslocamentos.append(cursor)
        cursor += len(payload)
    for (registro, _payload), desloc in zip(novos_payloads, deslocamentos):
        struct.pack_into("<I", registro, 12, desloc)
        saida += registro
    for _registro, payload in novos_payloads:
        saida += payload
    return bytes(saida), total, contagem


def processar_ani(dados: bytes) -> tuple[bytes, int, int]:
    """Remonta um .ani: recolor cada chunk 'icon' e corrige os tamanhos.

    Retorna (arquivo novo, pixels mudados, chunks processados).
    """
    if dados[:4] != b"RIFF" or dados[8:12] != b"ACON":
        raise ValueError("não é um ANI (RIFF/ACON)")
    pos = 12
    dentro = bytearray(b"ACON")  # quatro bytes da forma, depois vêm os chunks
    total = 0
    processados = 0
    while pos + 8 <= len(dados):
        cid = dados[pos : pos + 4]
        tam = struct.unpack("<I", dados[pos + 4 : pos + 8])[0]
        corpo = dados[pos + 8 : pos + 8 + tam]
        if cid == b"icon":
            novo, mudou, n = processar_cur(corpo)
            total += mudou
            processados += n
            dentro += cid + struct.pack("<I", len(novo)) + novo
            if len(novo) & 1:
                dentro += b"\x00"
        elif cid == b"LIST" and corpo[:4] == b"fram":
            sub = bytearray(b"fram")
            p = 4
            while p + 8 <= len(corpo):
                sid = corpo[p : p + 4]
                stam = struct.unpack("<I", corpo[p + 4 : p + 8])[0]
                scorp = corpo[p + 8 : p + 8 + stam]
                if sid == b"icon":
                    novo, mudou, n = processar_cur(scorp)
                    total += mudou
                    processados += n
                    sub += sid + struct.pack("<I", len(novo)) + novo
                    if len(novo) & 1:
                        sub += b"\x00"
                else:
                    sub += sid + struct.pack("<I", stam) + scorp
                    if stam & 1:
                        sub += b"\x00"
                p += 8 + stam + (stam & 1)
            dentro += b"LIST" + struct.pack("<I", len(sub)) + bytes(sub)
            if len(sub) & 1:
                dentro += b"\x00"
        else:
            dentro += cid + struct.pack("<I", tam) + corpo
            if tam & 1:
                dentro += b"\x00"
        pos += 8 + tam + (tam & 1)

    return b"RIFF" + struct.pack("<I", len(dentro)) + bytes(dentro), total, processados


def _luminancia(hexcor: str) -> float:
    """Luminância relativa WCAG de uma cor hexadecimal (#rrggbb)."""
    h = hexcor.lstrip("#")
    rgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    f = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]


def _contraste(a: float, b: float) -> float:
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def cores_opacas(dados: bytes) -> set[tuple[int, int, int]]:
    """Cores RGB opacas de todos os frames de um .cur (para medir)."""
    _r, tipo, contagem = struct.unpack("<HHH", dados[:6])
    cores: set[tuple[int, int, int]] = set()
    for k in range(contagem):
        e = 6 + 16 * k
        tam = struct.unpack("<I", dados[e + 8 : e + 12])[0]
        desloc = struct.unpack("<I", dados[e + 12 : e + 16])[0]
        payload = dados[desloc : desloc + tam]
        if payload[:8] == b"\x89PNG\r\n\x1a\n":
            img = Image.open(io.BytesIO(payload)).convert("RGBA")
            px = img.load()
            for y in range(img.height):
                for x in range(img.width):
                    p = px[x, y]
                    if p[3] == 255:
                        cores.add(p[:3])
        else:
            if len(payload) < 40:
                continue
            bi_size, largura, altura, _p, bits = struct.unpack("<IiiHH", payload[:16])
            if bi_size != 40 or bits != 32:
                continue
            xor = abs(altura) // 2 if abs(altura) == 2 * largura else abs(altura)
            passo = ((largura * bits + 31) // 32) * 4
            for linha in range(xor):
                base = bi_size + linha * passo
                for col in range(largura):
                    i = base + col * 4
                    if payload[i + 3] == 255:
                        cores.add((payload[i + 2], payload[i + 1], payload[i]))
    return cores


def _luminancia_rgb(rgb: tuple[int, int, int]) -> float:
    """Luminância relativa WCAG de um pixel RGB (0-255)."""
    f = []
    for v in rgb:
        v = v / 255
        f.append(v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]


def relatorio_contraste(dados: bytes) -> list[str]:
    """Pior caso por fundo: melhor contraste entre as cores opacas e o fundo.

    "Melhor" porque o olho só precisa de UMA cor do cursor se separando do
    fundo — é assim que o WCAG avalia elemento gráfico não textual.
    """
    cores = cores_opacas(dados)
    linhas = []
    for nome, cor in FUNDOS.items():
        lum = _luminancia(cor)
        melhor = max(_contraste(_luminancia_rgb(c), lum) for c in cores)
        veredito = "PASSA" if melhor >= 3 else "FALHA"
        linhas.append(f"    {nome:22} melhor cor do cursor: {melhor:5.2f}  {veredito}")
    return linhas


def main(argv: list[str]) -> int:
    seco = "--seco" in argv
    arquivos = sorted(PASTA.glob("*.cur")) + sorted(PASTA.glob("*.ani"))
    if not arquivos:
        print(f"nenhum cursor em {PASTA}", file=sys.stderr)
        return 1

    print(f"pasta: {PASTA}  {'(dry run)' if seco else '(gravando)'}")
    falhas = 0
    ponteiro = b""
    for arq in arquivos:
        original = arq.read_bytes()
        try:
            if arq.suffix == ".ani":
                novo, mudou, frames = processar_ani(original)
            else:
                novo, mudou, frames = processar_cur(original)
        except ValueError as erro:
            print(f"  {arq.name:18} ERRO: {erro}")
            falhas += 1
            continue
        if arq.name == "pointer.cur":
            ponteiro = novo
        delta = len(novo) - len(original)
        situacao = "sem mudanca" if mudou == 0 else f"{mudou} pixels, {frames} frames, {delta:+d} bytes"
        print(f"  {arq.name:18} {situacao}")
        if not seco and novo != original:
            arq.write_bytes(novo)

    print("\npior caso por fundo, depois da troca (cores opacas de pointer.cur):")
    for linha in relatorio_contraste(ponteiro):
        print(linha)
    return 1 if falhas else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
