"""analise-almg-rubrica.py — pipeline de análise garantista para proposições da ALMG.

Adapta o pipeline federal (etl/congresso/etl/rubrica.py) para o estadual.
Lê proposições de apps/web/data/almg-proposicoes.json, envia ao LLM,
valida contra a rubrica e grava em apps/web/data/almg-analises.json.

Rodar:
    python scripts/analise-almg-rubrica.py                # analisa pendentes
    python scripts/analise-almg-rubrica.py --limit 5      # teste com 5
    python scripts/analise-almg-rubrica.py --dry-run       # mostra prompts sem chamar LLM
"""
from __future__ import annotations

import argparse
import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# ── Caminhos ─────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
RUBRICA_PATH = ROOT / "apps" / "web" / "lib" / "congresso" / "rubrica" / "rubrica.json"
ENTRADA = ROOT / "apps" / "web" / "data" / "almg-proposicoes.json"
SAIDA = ROOT / "apps" / "web" / "data" / "almg-analises.json"

# ── LLM ──────────────────────────────────────────────────────────────
OLLAMA_URL = "http://172.18.176.1:11434/api/chat"
MODEL = "sabia-finetuned"
PAUSA_ENTRE_CHAMADAS = 1.5

# ── Rubrica (mesma fonte canônica do Congresso) ──────────────────────
RUBRICA = json.loads(RUBRICA_PATH.read_text(encoding="utf-8"))

DIREITOS = RUBRICA["direitos"]
MECANISMOS = RUBRICA["mecanismos"]
PESO_GRAU: dict[str, float] = RUBRICA["pesos"]["grau"]
PESO_DIRECAO: dict[str, float] = RUBRICA["pesos"]["direcao"]
CONFIANCA_MINIMA: float = RUBRICA["confianca_minima"]

# ── System prompt (adaptado para estadual) ───────────────────────────
SYSTEM = """Você é um analista legislativo estadual. Sua tarefa é EXTRAIR fatos \
verificáveis de uma proposição da Assembleia Legislativa de Minas Gerais (ALMG), \
não opinar sobre ela.

Contexto: esta proposição é da legislação estadual de MG. Ao citar dispositivos, \
use a Constituição Estadual de MG quando aplicável, além da CF/88. Exemplos: \
"CEMG, art. 5º" ou "CF/88, art. 5º".

Regras absolutas:
1. O campo `dispositivo` NUNCA pode ficar vazio. Ele deve conter um \
artigo concreto. Use, nesta ordem de preferência:
   (a) o artigo que a própria proposição altera, se a ementa disser qual;
   (b) uma das ÂNCORAS listadas ao lado do direito que você escolheu — \
elas são a base legal daquele direito e são sempre uma citação correta.
   Nunca invente um número de artigo que você não viu na ementa nem na \
lista de âncoras. Se nenhuma das duas opções servir, não inclua o item.
2. Cite no campo `trecho` um pedaço LITERAL da ementa ou do texto \
fornecido. Não parafraseie.
3. Se a proposição for meramente técnica, processual ou de homenagem \
(denominação de via, data comemorativa), devolva `direitos_afetados` \
vazio. Não force uma classificação que não existe.
4. Use APENAS os valores das listas fechadas fornecidas.
5. Responda somente com o objeto JSON, sem comentário fora dele.

EXEMPLO de um item bem preenchido, para uma ementa que dissesse "Altera a \
Lei nº X para vedar o corte de energia elétrica de consumidor inadimplente em \
dias de temperatura extrema":
{"direito": "direitos_consumidor", "dispositivo": "CEMG, art. 166 ou Lei 8.078/1990 \
(CDC), art. 22", "direcao": "amplia", "mecanismo": "cria_garantia_processual", \
"titulares": ["consumidor residencial inadimplente"], "grau": "moderado", \
"trecho": "vedar o corte de energia elétrica de consumidor inadimplente em \
dias de temperatura extrema", "confianca": 0.8}"""


# ── Prompt (mesmo do Congresso, com contexto estadual) ───────────────
def montar_prompt(proposicao: dict) -> str:
    direitos = "\n".join(
        f"  - {slug}: {d['rotulo']} (âncoras: {'; '.join(d['ancoras'])})"
        for slug, d in DIREITOS.items()
    )
    mecanismos = "\n".join(
        f"  - {slug}: {m['rotulo']} [{m['direcao']}]" for slug, m in MECANISMOS.items()
    )

    identificacao = f"{proposicao.get('sigla_tipo', '')} {proposicao.get('numero', '')}/{proposicao.get('ano', '')}"
    ementa = proposicao.get("ementa") or ""
    resumo = proposicao.get("resumo") or ""
    indexacao = proposicao.get("indexacao") or ""

    return f"""PROPOSIÇÃO: {identificacao}
EMENTA: {ementa}
RESUMO: {resumo}
PALAVRAS-CHAVE OFICIAIS: {indexacao}

DIREITOS (use exatamente estes slugs):
{direitos}

MECANISMOS (use exatamente estes slugs):
{mecanismos}

GRAU: marginal (ajuste pontual) | moderado (muda a política) | \
estrutural (muda o patamar do direito)

Devolva JSON exatamente neste formato:
{{
  "direitos_afetados": [
    {{
      "direito": "<slug da lista>",
      "dispositivo": "<artigo concreto, ex.: 'CEMG, art. 5º' ou 'CF/88, art. 7º, XIII'>",
      "direcao": "amplia" | "restringe" | "neutro",
      "mecanismo": "<slug da lista>",
      "titulares": ["<quem é afetado>"],
      "grau": "marginal" | "moderado" | "estrutural",
      "trecho": "<citação literal>",
      "confianca": <0.0 a 1.0>
    }}
  ],
  "clausula_petrea": <true se toca direito protegido pelo art. 60, §4º da CF>,
  "vedacao_retrocesso": <true se reduz patamar de direito social já conquistado>,
  "normas_alteradas": ["<lei/artigo que a proposição altera>"],
  "resumo_neutro": "<2 a 4 frases: o que a proposição muda, na letra, sem juízo de valor>"
}}"""


# ── Validação (espelho de etl/rubrica.py) ────────────────────────────
def _dispositivo_plausivel(dispositivo: str) -> bool:
    d = (dispositivo or "").strip().lower()
    if len(d) < 6 or not any(ch.isdigit() for ch in d):
        return False
    marcas = ("art", "cf/88", "cemg", "lei", "decreto", "adct", "súmula",
              "convenção", "cdc", "clt", "stf")
    return any(m in d for m in marcas)


def validar_itens(bruto: dict) -> tuple[list[dict], list[str]]:
    validos: list[dict] = []
    descartes: list[str] = []

    for item in bruto.get("direitos_afetados") or []:
        direito = (item.get("direito") or "").strip()
        direcao = (item.get("direcao") or "").strip()
        grau = (item.get("grau") or "").strip()
        mecanismo = (item.get("mecanismo") or "").strip() or None
        dispositivo = (item.get("dispositivo") or "").strip()

        if direito not in DIREITOS:
            descartes.append(f"direito fora da taxonomia: {direito!r}")
            continue
        if direcao not in PESO_DIRECAO:
            descartes.append(f"direção inválida: {direcao!r}")
            continue
        if grau not in PESO_GRAU:
            descartes.append(f"grau inválido: {grau!r}")
            continue
        if not _dispositivo_plausivel(dispositivo):
            descartes.append(f"dispositivo não citável: {dispositivo!r}")
            continue
        if mecanismo and mecanismo not in MECANISMOS:
            descartes.append(f"mecanismo fora da taxonomia (limpo): {mecanismo!r}")
            mecanismo = None

        try:
            confianca = min(1.0, max(0.0, float(item.get("confianca", 0.5))))
        except (TypeError, ValueError):
            confianca = 0.5

        validos.append({
            "direito": direito,
            "dispositivo": dispositivo,
            "direcao": direcao,
            "mecanismo": mecanismo,
            "titulares": item.get("titulares") or None,
            "grau": grau,
            "trecho": (item.get("trecho") or "")[:2000] or None,
            "confianca": round(confianca, 2),
            "peso": round(PESO_GRAU[grau] * PESO_DIRECAO[direcao] * confianca, 2),
        })

    return validos, descartes


def calcular(itens: list[dict]) -> dict:
    score = round(sum(i["peso"] for i in itens), 2)
    positivos = sum(i["peso"] for i in itens if i["peso"] > 0)
    negativos = abs(sum(i["peso"] for i in itens if i["peso"] < 0))

    misto = positivos >= 1 and negativos >= 1
    rotulo = "misto" if misto else _rotulo_por_score(score)

    requer_revisao = any(i["confianca"] < CONFIANCA_MINIMA for i in itens)
    return {
        "score": score,
        "rotulo": rotulo,
        "misto": misto,
        "requer_revisao": requer_revisao,
    }


def _rotulo_por_score(score: float) -> str:
    for faixa in RUBRICA["faixas"]:
        if score >= faixa["min"]:
            return faixa["rotulo"]
    return "neutro"


# ── LLM ──────────────────────────────────────────────────────────────
def chamar_llm(prompt: str) -> dict | None:
    """Chama Ollama /api/chat e retorna JSON bruto ou None em caso de erro."""
    payload = json.dumps({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt},
        ],
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.0, "num_predict": 2000},
    }).encode("utf-8")

    req = urllib.request.Request(
        OLLAMA_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            conteudo = result.get("message", {}).get("content", "")
            return json.loads(conteudo)
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError) as e:
        print(f"  [!] Erro LLM: {e}")
        return None


def extrair_json(resposta: str) -> dict | None:
    """Tenta extrair JSON de uma resposta que pode ter texto ao redor."""
    texto = resposta.strip()
    # Direto
    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        pass
    # Sem cercas de código
    if "```" in texto:
        limpo = texto.split("```")[1].strip()
        if limpo.startswith("json"):
            limpo = limpo[4:].strip()
        try:
            return json.loads(limpo)
        except json.JSONDecodeError:
            pass
    # Recorte por chaves
    ini = texto.find("{")
    fim = texto.rfind("}") + 1
    if ini >= 0 and fim > ini:
        try:
            return json.loads(texto[ini:fim])
        except json.JSONDecodeError:
            pass
    return None


# ── Pipeline ─────────────────────────────────────────────────────────
def carregar_entrada() -> list[dict]:
    if not ENTRADA.exists():
        return []
    return json.loads(ENTRADA.read_text(encoding="utf-8"))


def carregar_analises_existentes() -> dict[str, dict]:
    if not SAIDA.exists():
        return {}
    lista = json.loads(SAIDA.read_text(encoding="utf-8"))
    return {a["codigo"]: a for a in lista}


def gravar_analises(analises: list[dict]) -> None:
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    # Merge com existentes
    existentes = carregar_analises_existentes()
    for a in analises:
        existentes[a["codigo"]] = a
    resultado = sorted(existentes.values(), key=lambda x: x.get("created_at", ""), reverse=True)
    SAIDA.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n[ok] {len(resultado)} análises total ({len(analises)} novas) → {SAIDA.name}")


def analisar(proposicao: dict) -> dict | None:
    """Analisa uma proposição: prompt → LLM → validação → score."""
    prompt = montar_prompt(proposicao)
    bruto = chamar_llm(prompt)
    if not bruto:
        return None

    # Se o LLM devolveu texto cru, tenta extrair
    if isinstance(bruto, str):
        bruto = extrair_json(bruto)
    if not bruto:
        return None

    itens, descartes = validar_itens(bruto)
    calculo = calcular(itens)

    codigo = proposicao["codigo"]
    return {
        "codigo": codigo,
        "score": calculo["score"],
        "rotulo": calculo["rotulo"],
        "misto": calculo["misto"],
        "requer_revisao": calculo["requer_revisao"],
        "itens": itens,
        "descartes": descartes,
        "clausula_petrea": bruto.get("clausula_petrea", False),
        "vedacao_retrocesso": bruto.get("vedacao_retrocesso", False),
        "normas_alteradas": bruto.get("normas_alteradas", []),
        "resumo_neutro": bruto.get("resumo_neutro", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="Análise garantista de proposições ALMG")
    ap.add_argument("--dry-run", action="store_true",
                    help="Mostra prompts sem chamar o LLM")
    ap.add_argument("--limit", type=int, default=0,
                    help="Limita a N proposições (0 = todas)")
    args = ap.parse_args()

    proposicoes = carregar_entrada()
    if not proposicoes:
        print(f"[!] Arquivo de entrada vazio ou ausente: {ENTRADA}")
        return

    # Filtra só as que têm ementa
    com_ementa = [p for p in proposicoes if (p.get("ementa") or "").strip()]
    print(f"[almg] {len(com_ementa)} proposições com ementa (de {len(proposicoes)} total)")

    # Pula as já analisadas
    existentes = carregar_analises_existentes()
    pendentes = [p for p in com_ementa if p["codigo"] not in existentes]
    print(f"[almg] {len(pendentes)} pendentes ({len(existentes)} já analisadas)")

    if args.limit > 0:
        pendentes = pendentes[:args.limit]
        print(f"[almg] limitado a {len(pendentes)} proposições")

    if not pendentes:
        print("[almg] nada a fazer.")
        return

    if args.dry_run:
        print("\n=== DRY RUN — prompts que seriam enviados ===\n")
        for i, p in enumerate(pendentes[:10], 1):
            ident = f"{p.get('sigla_tipo', '')} {p.get('numero', '')}/{p.get('ano', '')}"
            print(f"--- {i}. {ident} ---")
            print(f"    ementa: {(p.get('ementa') or '')[:120]}...")
            prompt = montar_prompt(p)
            print(f"    prompt ({len(prompt)} chars):")
            print(f"    {prompt[:300]}...")
            print()
        if len(pendentes) > 10:
            print(f"... e mais {len(pendentes) - 10} proposições")
        return

    # Execução real
    novas = []
    erros = 0

    for i, prop in enumerate(pendentes, 1):
        ident = f"{prop.get('sigla_tipo', '')} {prop.get('numero', '')}/{prop.get('ano', '')}"
        print(f"\n[{i}/{len(pendentes)}] {ident}")

        resultado = analisar(prop)
        if not resultado:
            erros += 1
            print(f"  [x] Falha na análise — pulando")
            if i < len(pendentes):
                time.sleep(PAUSA_ENTRE_CHAMADAS)
            continue

        novas.append(resultado)
        print(f"  => {resultado['rotulo'].upper()}  (score {resultado['score']})")
        if resultado["clausula_petrea"]:
            print("  => selo: toca cláusula pétrea")
        if resultado["vedacao_retrocesso"]:
            print("  => selo: possível vedação do retrocesso")
        for it in resultado["itens"]:
            print(f"     [{it['peso']:+.2f}] {it['direito']} · {it['direcao']} "
                  f"· {it['grau']} · {it['dispositivo']} (conf. {it['confianca']})")
        for d in resultado["descartes"]:
            print(f"     DESCARTADO: {d}")

        # Grava incrementalmente a cada 10 para não perder trabalho
        if len(novas) % 10 == 0:
            gravar_analises(novas)

        if i < len(pendentes):
            time.sleep(PAUSA_ENTRE_CHAMADAS)

    # Grava o que sobrou
    if novas:
        gravar_analises(novas)

    print(f"\n[almg] CONCLUÍDO: {len(novas)} novas · {erros} erros · "
          f"{len(pendentes) - len(novas) - erros} puladas")


if __name__ == "__main__":
    main()
