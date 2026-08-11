"""Rubrica garantista × reducionista — lado Python (prompt + validação).

Lê `rubrica/rubrica.json`, a MESMA fonte canônica que `lib/rubrica.ts`.
A taxonomia não é duplicada aqui de propósito: se o prompt instruísse o
modelo com uma lista de mecanismos e o frontend pontuasse com outra, a
deriva seria silenciosa — rótulos calculados sobre categorias que o app
não reconhece.

O papel deste módulo: montar o prompt a partir da rubrica, validar a saída
do modelo contra ela, e recalcular o score de forma determinística (mesmo
algoritmo de `calcularRubrica` em TS — o cálculo é feito nos dois lados
porque o ETL grava e a UI confere).
"""
import json
from pathlib import Path
from typing import Any

RUBRICA_PATH = Path(__file__).resolve().parents[3] / "apps" / "web" / "lib" / "congresso" / "rubrica" / "rubrica.json"
RUBRICA: dict[str, Any] = json.loads(RUBRICA_PATH.read_text(encoding="utf-8"))

VERSAO_RUBRICA: str = RUBRICA["versao"]
VERSAO_PROMPT = "1.0.0"

DIREITOS: dict[str, Any] = RUBRICA["direitos"]
MECANISMOS: dict[str, Any] = RUBRICA["mecanismos"]
PESO_GRAU: dict[str, float] = RUBRICA["pesos"]["grau"]
PESO_DIRECAO: dict[str, float] = RUBRICA["pesos"]["direcao"]
CONFIANCA_MINIMA: float = RUBRICA["confianca_minima"]


SYSTEM = """Você é um analista legislativo. Sua tarefa é EXTRAIR fatos \
verificáveis de um projeto de lei brasileiro, não opinar sobre ele.

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
Lei nº 8.987/1995 para vedar o corte de energia elétrica de consumidor \
inadimplente em dias de temperatura extrema":
{"direito": "direitos_consumidor", "dispositivo": "Lei 8.078/1990 (CDC), \
art. 22", "direcao": "amplia", "mecanismo": "cria_garantia_processual", \
"titulares": ["consumidor residencial inadimplente"], "grau": "moderado", \
"trecho": "vedar o corte de energia elétrica de consumidor inadimplente em \
dias de temperatura extrema", "confianca": 0.8}"""


def montar_prompt(proposicao: dict) -> str:
    """Prompt de extração. Os fatos (identificação, ementa, texto) vêm do
    banco já verificados — o modelo nunca busca informação, só estrutura a
    que recebeu."""
    direitos = "\n".join(
        f"  - {slug}: {d['rotulo']} (âncoras: {'; '.join(d['ancoras'])})"
        for slug, d in DIREITOS.items()
    )
    mecanismos = "\n".join(
        f"  - {slug}: {m['rotulo']} [{m['direcao']}]" for slug, m in MECANISMOS.items()
    )

    texto = (proposicao.get("texto_integral") or "")[:20000]
    bloco_texto = f"\nTEXTO INTEGRAL (pode estar truncado):\n{texto}\n" if texto else ""

    return f"""PROPOSIÇÃO: {proposicao.get('identificacao')}
EMENTA: {proposicao.get('ementa')}
EMENTA DETALHADA: {proposicao.get('ementa_detalhada') or '—'}
PALAVRAS-CHAVE OFICIAIS: {proposicao.get('keywords') or '—'}
{bloco_texto}
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
      "dispositivo": "<artigo concreto, ex.: 'CF/88, art. 7º, XIII'>",
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


def _dispositivo_plausivel(dispositivo: str) -> bool:
    """Trava mínima contra dispositivo inventado.

    Não valida se o artigo existe de fato (isso exigiria uma base
    normativa completa — F3/`etl/normas.py` avança nessa direção), mas
    rejeita o que claramente não é uma citação: exigimos um número e uma
    marca de norma. Um modelo de 8B que "cita" apenas "Constituição
    Federal" sem artigo não passa daqui.
    """
    d = (dispositivo or "").strip().lower()
    if len(d) < 6 or not any(ch.isdigit() for ch in d):
        return False
    # "stf" cobre a única âncora de jurisprudência que a rubrica lista
    # (direitos_lgbtqia: "STF, ADO 26 / MI 4.733") — sem essa marca, o
    # próprio dispositivo que o rubrica.json manda citar era rejeitado
    # pela checagem que devia aceitá-lo. Achado importando o lote de BH
    # 2026-08-11: item usava a âncora oficial ao pé da letra e caía em
    # "dispositivo não citável".
    marcas = ("art", "cf/88", "lei", "decreto", "adct", "súmula", "convenção", "cdc", "clt", "stf")
    return any(m in d for m in marcas)


def validar_itens(bruto: dict) -> tuple[list[dict], list[str]]:
    """Filtra os itens do modelo contra a rubrica.

    Devolve (itens_válidos, motivos_de_descarte). Nada é corrigido em
    silêncio: item fora da taxonomia ou sem dispositivo é DESCARTADO e o
    motivo fica registrado, para que a qualidade do modelo seja mensurável
    em vez de suposta.
    """
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
            # Mecanismo é informativo, não entra no peso — vale limpar em
            # vez de descartar o item inteiro, que tem dispositivo válido.
            descartes.append(f"mecanismo fora da taxonomia (limpo): {mecanismo!r}")
            mecanismo = None

        try:
            confianca = min(1.0, max(0.0, float(item.get("confianca", 0.5))))
        except (TypeError, ValueError):
            confianca = 0.5

        validos.append(
            {
                "direito": direito,
                "dispositivo": dispositivo,
                "direcao": direcao,
                "mecanismo": mecanismo,
                "titulares": item.get("titulares") or None,
                "grau": grau,
                "trecho": (item.get("trecho") or "")[:2000] or None,
                "confianca": round(confianca, 2),
                "peso": round(PESO_GRAU[grau] * PESO_DIRECAO[direcao] * confianca, 2),
            }
        )

    return validos, descartes


def calcular(itens: list[dict]) -> dict:
    """Score e rótulo — determinístico, espelho de `calcularRubrica` em TS."""
    score = round(sum(i["peso"] for i in itens), 2)
    positivos = sum(i["peso"] for i in itens if i["peso"] > 0)
    negativos = abs(sum(i["peso"] for i in itens if i["peso"] < 0))

    # "Misto" não é faixa de score: um PL que amplia um direito e restringe
    # outro somaria perto de zero e apareceria como "neutro" — leitura
    # errada, porque ele é controverso, não inócuo.
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
