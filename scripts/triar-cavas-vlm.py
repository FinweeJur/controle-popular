#!/usr/bin/env python3
"""Triagem assistida por VLM local dos recortes de cavas (Fase 4 do plano de cavas).

O QUE FAZ
---------
Para cada recorte JPEG de `scripts/.cache/cavas-calibracao/recortes/{positivo,negativo}`,
envia a imagem para um modelo de visão rodando LOCALMENTE no Ollama (nunca API de
nuvem — veto do dono) e grava em JSONL, por recorte:

    arquivo, legenda, escore (0-100), confianca, nuvem, modelo, data

No fim imprime um resumidor com a média de escore por tipo (positivo/negativo) —
o "sanity check": os positivos (cavas conhecidas) devem pontuar mais alto que os
negativos. Se não pontuarem, o prompt ou o modelo não servem para esta fila.

POR QUÊ (regra §5.9 do AGENTS.md — código auditável por cidadão e pesquisador)
-----------------------------------------------------------------------------
1. TRIAGEM, NUNCA PUBLICAÇÃO. O VLM só escreve legenda e escore da FILA de
   candidatos. A revisão humana é sempre obrigatória (plano Fase 4). Por isso a
   saída é um arquivo novo em diretório de trabalho, fora do repositório — nada
   aqui entra em `apps/web/data/` sozinho.
2. MODELO LOCAL E COM LICENÇA ABERTA. O plano original cita Qwen2.5-VL 3B, mas
   essa variante é `qwen-research` (uso não-comercial, medido em 25/09/2026).
   Preferimos a família `qwen3-vl` — Apache 2.0 — que cabe nos 4 GB da RTX 3050:
   padrão `qwen3-vl:2b-instruct`, alternativa `qwen3-vl:4b-instruct` (medições
   de 28/09/2026 no comentário de MODELO_PADRAO).
3. PROMPT FIXO EM PT. Prompt igual para todos os recortes: sem prompt variável não
   há como comparar escores entre imagens. O texto do prompt está no docstring e
   em `PROMPT_TRIAGEM` para auditoria.
4. SAÍDA JSON COM `format: "json"` DO OLLAMA. Modelo pequeno solta texto livre e
   quebra o parser; pedir JSON estrito evita perda de registro no meio da coleta
   (uma linha inválida estraga o JSONL inteiro).
5. ENRIQUECIMENTO SÓ DE LEITURA. Processo, data da cena e índice de nuvem vêm do
   `checkpoint.jsonl` da calibração (leitura pura, nunca escrita) — assim o
   humano que revisar consegue ir direto ao processo na fonte oficial.

USO
---
    # teste: 4 positivos + 4 negativos (o limite é POR TIPO)
    python scripts/triar-cavas-vlm.py --limite 4

    # fila inteira (2112 recortes)
    python scripts/triar-cavas-vlm.py

    # outro modelo ou outra pasta de dados
    python scripts/triar-cavas-vlm.py --modelo qwen3-vl:2b-instruct --dados OUTRO/DIRETORIO

Dependência: apenas biblioteca padrão do Python 3 (urllib/json) — nada de pip.
"""

from __future__ import annotations

import argparse
import base64
import json
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

# Endpoint local do Ollama. Nunca trocar por URL de nuvem: o dono vetou qualquer
# envio de imagem de cavas para API externa (as imagens são de área pública, mas o
# combinado é rodar tudo nesta máquina).
OLLAMA_URL = "http://127.0.0.1:11434"

# Modelo padrão: variante Apache 2.0 da família Qwen3-VL, quantização Q4.
# Medido em 28/09/2026, nesta máquina (RTX 3050 4 GB), mesmo lote de 20 recortes:
#   qwen3-vl:2b-instruct (1,9 GB) -> 82% na GPU, ~2,1 s/imagen, pos 72,0 vs neg 46,5
#   qwen3-vl:4b-instruct (3,3 GB) -> 47% na GPU (53% CPU), ~5,5 s/imagen, pos 56,0 vs neg 45,5
# O 2B ganhou nos dois critérios — velocidade e separação das classes — e ainda
# deixa folga de VRAM caso outro processo use a GPU junto. O 4B continua
# disponível via --modelo para quem quiser conferir a segunda opinião.
# Ambos são Apache 2.0 (Qwen3-VL-2B/4B-Instruct no Hugging Face); a variante
# qwen2.5vl do plano antigo é `qwen-research` (não-comercial) e ficou de fora.
MODELO_PADRAO = "qwen3-vl:2b-instruct"

# Prompt fixo em português. Pede os quatro campos da Fase 4 em uma resposta só.
# Por que tantas restrições no texto: modelo de 4B encurta e inventa se deixado
# livre; pedir "uma linha", "números inteiros" e enumeração fechada derruba a
# taxa de resposta inválida.
PROMPT_TRIAGEM = """Você analisa recortes de satélite (CBERS) de Minas Gerais em busca de mineração a céu aberto.
Responda SOMENTE com um objeto JSON exatamente com estas chaves e nenhum texto além dele:
{
  "legenda": "uma linha curta em português descrevendo o que se vê na imagem (terra exposta, piscina de decantação, estrada de terra, mata fechada, área urbana, água, etc.)",
  "escore": número inteiro de 0 a 100 com a evidência de mineração a céu aberto (0 = nada sugere mineração; 100 = mineração a céu aberto evidente),
  "confianca": uma destas palavras: alto, medio, baixo,
  "nuvem": uma destas palavras: sim, nao, parcial
}
Regras:
- "escore" deve ser 0 quando a imagem não mostra nada de mineração.
- "confianca" mede a SUA certeza sobre o escore, não o tamanho da mineração.
- "nuvem" = sim se nuvens ou sombra de nuvem cobrem a maior parte do recorte; parcial se cobrem parte dele; nao se o recorte está limpio."""


def caminho_padrao_saida() -> Path:
    """Caminho fixo exigido para a saída da triagem.

    Fica em Temp (fora do repositório) para que nenhum teste acidental vire
    commit — o repositório é público e dado coletado tem regra de varredura de
    dado pessoal (§5.2 do AGENTS.md).
    """
    return Path.home() / "AppData/Local/Temp/opencode/cavas/triagem/triagem.jsonl"


def normalizar_palavra(valor: object) -> str:
    """Converte a resposta do modelo em palavra simples sem acento.

    Modelo pequeno insiste em escrever "médio" com acento ou "Médio" maiúsculo;
    sem normalizar, o agrupador do resumidor quebraria em silêncio.
    """
    if not isinstance(valor, str):
        return ""
    bruto = unicodedata.normalize("NFKD", valor.strip().lower())
    return "".join(c for c in bruto if not unicodedata.combining(c))


def carregar_checkpoint(caminho: Path) -> dict[str, dict]:
    """Indexa `checkpoint.jsonl` por nome de arquivo (leitura somente).

    Devolve {arquivo: {processo, data_cena, nuvem_indice, ...}}. Usado só para
    enriquecer a linha da triagem — o humano revisor precisa do número do
    processo para conferir na fonte oficial sem procurar à mão.
    """
    indice: dict[str, dict] = {}
    if not caminho.is_file():
        return indice
    with caminho.open("r", encoding="utf-8") as fh:
        for linha in fh:
            linha = linha.strip()
            if not linha:
                continue
            try:
                reg = json.loads(linha)
            except json.JSONDecodeError:
                continue  # linha corrompida não pode derrubar a triagem inteira
            arquivo = reg.get("arquivo")
            if isinstance(arquivo, str):
                indice[arquivo] = reg
    return indice


def listar_recortes(dados: Path, limite: int | None) -> list[tuple[str, Path]]:
    """Monta a lista de trabalho: [(tipo, caminho)] ordenada de forma determinística.

    `limite` é POR TIPO — assim o teste de sanidade sempre recebe positivos e
    negativos na mesma quantidade (4 e 4) e a comparação de médias é justa.
    """
    tarefas: list[tuple[str, Path]] = []
    for tipo in ("positivo", "negativo"):
        pasta = dados / tipo
        if not pasta.is_dir():
            print(f"[aviso] pasta inexistente ignorada: {pasta}", file=sys.stderr)
            continue
        arquivos = sorted(p for p in pasta.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png"))
        if limite is not None:
            arquivos = arquivos[:limite]
        tarefas.extend((tipo, p) for p in arquivos)
    return tarefas


def chamar_vlm(modelo: str, imagem_b64: str, prompt: str, tentativas: int = 3) -> dict:
    """Envia uma imagem + prompt ao Ollama e devolve o JSON decodificado.

    Retentativas existem porque a GPU pode estar ocupada por outro processo (coleta
    noturna, treino de outro agente): em vez de perder o recorte, esperamos e
    tentamos de novo. Levanta RuntimeError se todas as tentativas falharem.
    """
    corpo = {
        "model": modelo,
        "stream": False,
        # JSON estrito: elimina prologo/epilogo do modelo e protege o arquivo JSONL.
        "format": "json",
        "keep_alive": "10m",  # mantém o modelo carregado entre imagens (evita recarregar 3 GB a cada chamada)
        "messages": [
            {
                "role": "user",
                "content": prompt,
                "images": [imagem_b64],
            }
        ],
        "options": {
            # Temperatura 0 (decodificação gulosa) de propósito: medido em
            # 28/09/2026, com temperatura 0.2 a MESMA imagem recebeu 85 numa
            # rodada e 10 na seguinte. Escore que muda sozinho não serve para
            # ordenar fila nem para auditoria — o portal precisa de número
            # reproduzível (§5.9: número vem do dado).
            "temperature": 0.0,
            "seed": 0,
            "num_predict": 400,
        },
    }
    dados = json.dumps(corpo).encode("utf-8")
    ultimo_erro: Exception | None = None
    for tentativa in range(tentativas):
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/chat",
            data=dados,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                resposta = json.loads(resp.read().decode("utf-8"))
            texto = resposta.get("message", {}).get("content", "")
            return json.loads(texto)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, KeyError) as exc:
            ultimo_erro = exc
            espera = 3 * (tentativa + 1)
            print(
                f"[aviso] chamada falhou ({exc}); aguardando {espera}s antes da tentativa {tentativa + 2}/{tentativas}",
                file=sys.stderr,
            )
            time.sleep(espera)
    raise RuntimeError(f"falhou após {tentativas} tentativas: {ultimo_erro}")


def montar_registro(
    tipo: str,
    caminho: Path,
    resposta: dict,
    modelo: str,
    meta: dict,
    latencia: float,
    erro: str | None,
) -> dict:
    """Monta a linha do JSONL de saída.

    Campos obrigatórios (pedido da Fase 4): arquivo, legenda, escore, confianca,
    nuvem, modelo, data. Os demais são enriquecimento para a revisão humana.
    """
    registro = {
        "arquivo": caminho.name,
        "tipo": tipo,
        "legenda": str(resposta.get("legenda", "")),
        "escore": resposta.get("escore"),
        "confianca": normalizar_palavra(resposta.get("confianca")),
        "nuvem": normalizar_palavra(resposta.get("nuvem")),
        "modelo": modelo,
        "data": date.today().isoformat(),
        "latencia_s": round(latencia, 2),
        "processo": meta.get("processo"),
        "data_cena": meta.get("data"),
        "nuvem_indice": meta.get("nuvem"),
        "erro": erro,
    }
    # O escore pode vir como texto ("85") ou fora da faixa; normalizamos aqui para
    # o resumidor não fazer média com string.
    try:
        registro["escore"] = max(0, min(100, int(resposta.get("escore"))))
    except (TypeError, ValueError):
        registro["escore"] = None
    return registro


def resumir(registros: list[dict]) -> None:
    """Imprime a média de escore por tipo e o sanity check.

    Critério de sanidade do plano: média(positivo) > média(negativo). Se falhar,
    o prompt/modelo não separa as classes e a fila não pode ser priorizada por ele.
    """
    print("\n=== RESUMO DA TRIAGEM ===")
    medias: dict[str, float | None] = {}
    for tipo in ("positivo", "negativo"):
        validos = [r["escore"] for r in registros if r["tipo"] == tipo and isinstance(r["escore"], int)]
        falhas = sum(1 for r in registros if r["tipo"] == tipo and r["erro"])
        if validos:
            media = sum(validos) / len(validos)
            medias[tipo] = media
            print(
                f"{tipo:>10}: {len(validos):>4} recortes com escore | "
                f"média {media:6.1f} | mín {min(validos)} | máx {max(validos)} | erros {falhas}"
            )
        else:
            medias[tipo] = None
            print(f"{tipo:>10}: nenhum escore válido | erros {falhas}")

    pos, neg = medias.get("positivo"), medias.get("negativo")
    if pos is None or neg is None:
        print("SANITY: ⚠️ não há dados dos dois tipos para comparar.")
    elif pos > neg:
        print(f"SANITY: ✅ positivos ({pos:.1f}) pontuaram acima de negativos ({neg:.1f}).")
    else:
        print(
            f"SANITY: ❌ positivos ({pos:.1f}) NÃO pontuaram acima de negativos ({neg:.1f}) — "
            "prompt/modelo precisam de revisão antes de usar a fila."
        )

    nuvens = [r["nuvem"] for r in registros if r["nuvem"] in ("sim", "parcial", "nao")]
    if nuvens:
        parcial_ou_sim = sum(1 for n in nuvens if n in ("sim", "parcial"))
        print(f"nuvens/obstrução: {parcial_ou_sim}/{len(nuvens)} recortes com alguma cobertura.")


def main(argv: list[str] | None = None) -> int:
    raiz = Path(__file__).resolve().parents[1]
    padrao_dados = raiz / "scripts/.cache/cavas-calibracao/recortes"
    padrao_checkpoint = raiz / "scripts/.cache/cavas-calibracao/checkpoint.jsonl"

    ap = argparse.ArgumentParser(description="Triagem por VLM local dos recortes de cavas (Fase 4).")
    ap.add_argument("--dados", type=Path, default=padrao_dados, help="pasta com recortes/{positivo,negativo}")
    ap.add_argument("--limite", type=int, default=None, help="máximo de recortes POR TIPO (ex.: 4 = 4 pos + 4 neg)")
    ap.add_argument("--modelo", type=str, default=MODELO_PADRAO, help="modelo do Ollama (vision)")
    ap.add_argument("--saida", type=Path, default=caminho_padrao_saida(), help="arquivo JSONL de saída")
    args = ap.parse_args(argv)

    # Console do Windows nasce em cp1252 e explode com acento e símbolo de OK no
    # print (UnicodeEncodeError). Forçamos UTF-8 para o log da triagem sobreviver
    # à acentuação portuguesa em qualquer terminal.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, OSError):
            pass

    tarefas = listar_recortes(args.dados, args.limite)
    if not tarefas:
        print(f"nenhum recorte em {args.dados}", file=sys.stderr)
        return 1

    checkpoint = carregar_checkpoint(padrao_checkpoint)
    args.saida.parent.mkdir(parents=True, exist_ok=True)

    # Retomada: o JSONL é aberto em append, então uma coleta interrompida
    # continua de onde parou. Sem esta lista de já-feitos, rodar de novo
    # duplicaria registro e inflaria a média do resumidor.
    ja_traiados: set[tuple[str, str]] = set()
    if args.saida.is_file():
        with args.saida.open("r", encoding="utf-8") as fh:
            for linha in fh:
                # lstrip("\ufeff"): arquivo aberto por ferramenta Windows pode
                # trazer BOM; sem isso o json.loads falha e o recorte seria
                # triado duas vezes na retomada.
                linha = linha.lstrip("\ufeff").strip()
                if not linha:
                    continue
                try:
                    reg = json.loads(linha)
                except json.JSONDecodeError:
                    continue
                ja_traiados.add((str(reg.get("tipo")), str(reg.get("arquivo"))))
    restantes = [t for t in tarefas if (t[0], t[1].name) not in ja_traiados]
    if ja_traiados:
        print(f"retomando: {len(ja_traiados)} recorte(s) já triado(s) pulado(s)")
    if not restantes:
        print("nada a triar: todos os recortes deste arquivo já foram processados")
    else:
        print(f"modelo: {args.modelo} | recortes: {len(restantes)} | saída: {args.saida}")

        # Append: permite retomar uma triagem interrompida sem perder o que já saiu.
        with args.saida.open("a", encoding="utf-8") as out:
            for i, (tipo, caminho) in enumerate(restantes, 1):
                meta = checkpoint.get(caminho.name, {})
                inicio = time.time()
                try:
                    b64 = base64.b64encode(caminho.read_bytes()).decode("ascii")
                    resposta = chamar_vlm(args.modelo, b64, PROMPT_TRIAGEM)
                    registro = montar_registro(tipo, caminho, resposta, args.modelo, meta, time.time() - inicio, None)
                except Exception as exc:  # noqa: BLE001 - um recorte quebrado não pode parar a fila
                    registro = montar_registro(
                        tipo, caminho, {}, args.modelo, meta, time.time() - inicio, str(exc)
                    )
                out.write(json.dumps(registro, ensure_ascii=False) + "\n")
                out.flush()
                marcador = "❌" if registro["erro"] else "✅"
                print(
                    f"[{i}/{len(restantes)}] {marcador} {tipo:>9} {caminho.name} "
                    f"escore={registro['escore']} conf={registro['confianca']} "
                    f"nuvem={registro['nuvem']} {registro['latencia_s']}s"
                )

    resumo: list[dict] = []
    # O resumo lê o ARQUIVO inteiro, não só esta rodada: numa retomada a
    # sanidade tem que valer para a fila toda.
    with args.saida.open("r", encoding="utf-8") as fh:
        for linha in fh:
            linha = linha.lstrip("\ufeff").strip()
            if not linha:
                continue
            try:
                resumo.append(json.loads(linha))
            except json.JSONDecodeError:
                pass
    resumir(resumo)
    print(f"\nJSONL: {args.saida}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
