"""etl.camara.presenca — a folha de ponto do plenário: presença dia a dia.

Rodar:
    python -m etl.camara.presenca                     # ano corrente, todos
    python -m etl.camara.presenca --ano 2025
    python -m etl.camara.presenca --ano 2026 --limite 10
    python -m etl.camara.presenca --dry-run

O QUE ESTA FONTE ACRESCENTA: até aqui o portal media o que o parlamentar
PRODUZ (proposições) e o que ele VOTA. Não media se ele **aparece**. E
ausência não sai do voto nominal: a API só devolve quem votou, então quem
faltou e quem estava presente e não registrou ficam indistinguíveis — a
falta seria inferida por OMISSÃO, que é afirmação que este portal não faz.

Esta é a única fonte PRIMÁRIA de presença de todo o Controle Popular. A
própria Casa publica, dia a dia e sessão a sessão, com a justificativa que
ela mesma registrou.

═══ ⚠ NÃO É A API DE DADOS ABERTOS ═══

Todo o resto do eixo Congresso vem de `dadosabertos.camara.leg.br`, versionada
e estável. Presença não está lá. Sai de HTML do portal `www`:

    GET https://www.camara.leg.br/deputados/{id}/presenca-plenario/{ano}

Verificado ao vivo em 2026-08-06: HTTP 200, tabela com o cabeçalho
"Data | Frequência por Sessão | Frequência por Dia/Justificativa".

Consequência: **quebra quando a Câmara redesenha a página**, e quebra em
silêncio se ninguém desenhar o guarda. Por isso `main()` ABORTA sem gravar
nada quando NENHUM deputado rendeu tabela válida (§ "O guarda"). Um scraper
mudo que grava zero presença não devolve "sem dado" — devolve uma acusação
de absenteísmo contra 513 pessoas.

═══ A ESTRUTURA DA TABELA, E POR QUE OS DOIS NÍVEIS FICAM ═══

As linhas alternam, e a CLASSE do `<tr>` é o marcador confiável (o texto da
célula não é):

    class="info-data"          → o DIA     ['02/02/2026 Presença', '', 'Presença']
    class="info-data__child"   → a SESSÃO  ['EXTRAORDINÁRIA Nº 001 - …', 'Presença', '']

Num mesmo dia há ordinária e extraordinárias, e o deputado pode constar numa
e não na outra. Guardar só o dia perderia isso; guardar só a sessão impediria
responder "quantos DIAS ele trabalhou". Por isso o dia é a linha e as sessões
viram contagem — os dois números lado a lado, nenhum derivado do outro.

═══ AUSÊNCIA JUSTIFICADA NÃO É FALTA ═══

Vocabulário observado em 2026-08-06 sobre 6 deputados: `Presença`,
`Ausência`, `Missão Autorizada`. Há mais (licença médica, licença-
maternidade), e é por isso que `situacao_dia` guarda o texto DA FONTE e a
classificação vive em `JUSTIFICADAS` — não numa lista fechada no banco.

Tratar missão autorizada e licença-maternidade como falta seria errado, e
errado de forma enviesada: licença-maternidade recai sobre um grupo
específico, e uma métrica pública que a conta como absenteísmo pune
maternidade. A régua de pontuação (`lib/betim/vereadores.ts` e a leitura do
Congresso) recebe as três contagens separadas e decide o que faz com cada uma
— este módulo não resume por ela.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import unicodedata
from datetime import date
from pathlib import Path

import requests
from lxml import html as lxml_html

from ..common import get_supabase_client, registrar_fonte, upsert_em_lotes

CASA_ID = "camara"
URL = "https://www.camara.leg.br/deputados/{id}/presenca-plenario/{ano}"
FONTE = "Câmara dos Deputados — Relatório de presença em plenário"

# O cabeçalho que prova que estamos lendo a tabela certa. Comparado
# normalizado (sem acento, minúsculo): a Casa alterna a grafia entre anos.
CABECALHO_ESPERADO = ("data", "frequencia por sessao")

# O vocabulário de presença NÃO mora aqui. Mora em
# `apps/web/lib/presenca/vocabulario.json`, lido também por
# `lib/presenca/vocabulario.ts`.
#
# Duplicar a lista dos dois lados não daria erro nenhum — só faria o coletor
# imprimir "0 desconhecidas" enquanto a tela tratasse o mesmo rótulo como
# falta, e ninguém saberia qual dos dois números está certo. É a mesma razão
# de `rubrica.json` ser único: a régua é decisão editorial versionada, não
# constante de módulo.
VOCABULARIO_PATH = (
    Path(__file__).resolve().parents[4]
    / "apps"
    / "web"
    / "lib"
    / "presenca"
    / "vocabulario.json"
)
VOCABULARIO: dict = json.loads(VOCABULARIO_PATH.read_text(encoding="utf-8"))
_DIA = VOCABULARIO["presenca_dia"]

PRESENTES: tuple[str, ...] = tuple(_DIA["presente"])
JUSTIFICADAS: tuple[str, ...] = tuple(_DIA["justificada"])
FALTAS: tuple[str, ...] = tuple(_DIA["falta"])

_session = requests.Session()
_session.headers.update(
    {
        # O portal `www` (diferente da API) responde 403 sem User-Agent de
        # browser.
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        ),
        "Accept-Language": "pt-BR,pt;q=0.9",
    }
)


def normalizar(texto: str) -> str:
    sem_acento = unicodedata.normalize("NFKD", texto or "")
    sem_acento = "".join(c for c in sem_acento if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", sem_acento).strip().lower()


def classificar(situacao: str) -> str:
    """'presente' | 'justificada' | 'falta' | 'desconhecida'.

    Mesma ordem e mesmos prefixos de `classificarDia` em
    `lib/presenca/vocabulario.ts`, porque as duas leem o mesmo JSON."""
    s = normalizar(situacao)
    if not s:
        return "desconhecida"
    if any(s.startswith(p) for p in PRESENTES):
        return "presente"
    if any(s.startswith(j) for j in JUSTIFICADAS):
        return "justificada"
    if any(s.startswith(f) for f in FALTAS):
        return "falta"
    return "desconhecida"


def _celulas(tr) -> list[str]:
    return [
        re.sub(r"\s+", " ", (td.text_content() or "")).strip()
        for td in tr.xpath("./td|./th")
    ]


def parse_pagina(html: str) -> tuple[list[dict], bool]:
    """(dias, cabecalho_ok).

    `cabecalho_ok=False` significa "esta página não tem a tabela esperada" —
    e isso tem DUAS causas que só se distinguem no agregado: o deputado não
    esteve em exercício naquele ano (normal, a maioria das páginas vazias) ou
    a Câmara redesenhou o HTML (catástrofe silenciosa). Por isso a função só
    relata, e quem decide abortar é `main()`, que vê o total."""
    doc = lxml_html.fromstring(html)
    for tabela in doc.xpath("//table"):
        ths = [normalizar(x.text_content()) for x in tabela.xpath(".//th")]
        if not all(any(c in t for t in ths) for c in CABECALHO_ESPERADO):
            continue

        dias: list[dict] = []
        atual: dict | None = None
        for tr in tabela.xpath(".//tbody/tr"):
            classes = tr.get("class") or ""
            cells = _celulas(tr)
            if len(cells) < 3:
                continue

            if "info-data__child" in classes:
                # Sessão do dia corrente. Sessão órfã (sem dia antes) é
                # descartada em vez de atribuída ao dia anterior — inventar o
                # dono de uma sessão é pior que perdê-la.
                if atual is None:
                    continue
                atual["sessoes_total"] += 1
                if classificar(cells[1]) == "presente":
                    atual["sessoes_presente"] += 1
                continue

            # Linha de DIA. `cells[0]` = "02/02/2026 Presença"; a data é o que
            # importa, e o veredito confiável está em `cells[2]`.
            m = re.match(r"(\d{2}/\d{2}/\d{4})", cells[0])
            if not m:
                continue
            d, mes, a = m.group(1).split("/")
            situacao = cells[2] or cells[0][len(m.group(1)) :].strip()
            atual = {
                "data": f"{a}-{mes}-{d}",
                "ano": int(a),
                "situacao_dia": situacao,
                "sessoes_total": 0,
                "sessoes_presente": 0,
            }
            dias.append(atual)
        return dias, True
    return [], False


def coletar_deputado(id_externo: str, ano: int, timeout: int = 30):
    url = URL.format(id=id_externo, ano=ano)
    r = _session.get(url, timeout=timeout)
    if r.status_code == 404:
        return [], False, url
    r.raise_for_status()
    dias, ok = parse_pagina(r.text)
    return dias, ok, url


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--ano", type=int, default=date.today().year)
    ap.add_argument("--limite", type=int, help="só os N primeiros (teste)")
    ap.add_argument("--pausa", type=float, default=0.4, help="segundos entre páginas")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    client = get_supabase_client()
    parlamentares = (
        client.table("parlamentares")
        .select("id, id_externo, nome")
        .eq("casa_id", CASA_ID)
        .execute()
        .data
    )
    if args.limite:
        parlamentares = parlamentares[: args.limite]
    if not parlamentares:
        print("nenhum parlamentar da Câmara no banco — rode etl.camara.parlamentares "
              "antes", file=sys.stderr)
        return 1

    linhas: list[dict] = []
    com_tabela = 0
    sem_tabela = 0
    desconhecidas: dict[str, int] = {}
    contagem = {"presente": 0, "justificada": 0, "falta": 0, "desconhecida": 0}

    for i, p in enumerate(parlamentares, 1):
        try:
            dias, ok, url = coletar_deputado(p["id_externo"], args.ano)
        except Exception as e:
            print(f"  ! {p['nome']}: {type(e).__name__} {e}", file=sys.stderr)
            sem_tabela += 1
            continue

        if not ok:
            sem_tabela += 1
        else:
            com_tabela += 1

        for d in dias:
            k = classificar(d["situacao_dia"])
            contagem[k] += 1
            if k == "desconhecida":
                desconhecidas[d["situacao_dia"]] = (
                    desconhecidas.get(d["situacao_dia"], 0) + 1
                )
            linhas.append(
                {
                    "casa_id": CASA_ID,
                    "parlamentar_id": p["id"],
                    "data": d["data"],
                    "ano": d["ano"],
                    "situacao_dia": d["situacao_dia"],
                    # A justificativa vem no próprio rótulo quando existe; o
                    # campo fica separado para a tela poder mostrá-la sem
                    # reinterpretar `situacao_dia`.
                    "justificativa": (
                        d["situacao_dia"] if k == "justificada" else None
                    ),
                    "sessoes_total": d["sessoes_total"] or None,
                    "sessoes_presente": d["sessoes_presente"] or None,
                    "link_fonte": url,
                }
            )

        if i % 25 == 0:
            print(f"  {i}/{len(parlamentares)} · {len(linhas)} dias")
        time.sleep(args.pausa)

    # ═══ O GUARDA ═══
    #
    # Zero página com tabela válida sobre a lista INTEIRA não é "ninguém
    # trabalhou": é o seletor tendo deixado de casar. Gravar aqui zeraria a
    # presença de todo mundo e o portal passaria a acusar 513 deputados de
    # absenteísmo — com aparência de dado, sem uma linha de erro. Sai com
    # exit 1 e NÃO escreve.
    #
    # O limiar é "nenhuma", não uma fração: deputado sem tabela é normal
    # (suplente que não assumiu, licenciado o ano todo), então qualquer corte
    # percentual seria arbitrário e ora deixaria passar, ora falharia à toa.
    if com_tabela == 0:
        print(
            f"\nABORTADO: nenhuma das {len(parlamentares)} páginas trouxe a tabela "
            f"com o cabeçalho {CABECALHO_ESPERADO}. Ou o portal mudou o HTML, ou "
            f"está bloqueando este IP. Nada foi gravado — presença zerada seria "
            f"acusação, não ausência de dado.",
            file=sys.stderr,
        )
        return 1

    print(
        f"\n{args.ano}: {com_tabela} deputados com tabela, {sem_tabela} sem · "
        f"{len(linhas)} dias · presente {contagem['presente']} · "
        f"justificada {contagem['justificada']} · falta {contagem['falta']} · "
        f"desconhecida {contagem['desconhecida']}"
    )
    if desconhecidas:
        # Rótulo novo da Casa. Enquanto não entrar em `JUSTIFICADAS`, ele não
        # conta como falta NEM como presença — fica visível e inerte, que é o
        # comportamento seguro.
        print("  ⚠ SITUAÇÃO NÃO CATALOGADA (decidir se é justificada):", file=sys.stderr)
        for rotulo, n in sorted(desconhecidas.items(), key=lambda kv: -kv[1]):
            print(f"      {rotulo!r}: {n}", file=sys.stderr)

    if args.dry_run:
        print("(dry-run: nada gravado)")
        return 0

    upsert_em_lotes(
        client, "presencas_plenario", linhas, on_conflict="parlamentar_id,data"
    )
    registrar_fonte(
        client, FONTE, URL.format(id="{id}", ano=args.ano), "presenca_plenario"
    )
    print(f"gravadas {len(linhas)} linhas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
