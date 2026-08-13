r"""etl.apis.legislacao_almg — legislação AMBIENTAL estadual publicada pela
Assembleia Legislativa de Minas Gerais (leis, decretos, leis complementares
etc. — "normas básicas" no vocabulário da própria fonte).

Fonte: `https://dadosabertos.almg.gov.br/api/v2/` — JSON, sem auth. Contrato
testado ao vivo em 2026-08-11 (ver `docs/ambiental/F0-discovery.md` §6):

    GET /legislacao/mineira/pesquisa/direcionada?formato=json&p={pagina}
      -> {"resultado": {"noOcorrencias": 2539, "numPagina": N,
                         "listaItem": [{numDoc, tipo, numero, ano, data,
                                        origem, ementa, indexacao, ...}]}}

═══ AS ARMADILHAS MEDIDAS (docs/ambiental/F0-discovery.md §6, confirmadas
    de novo ao vivo em 2026-08-11 antes de escrever este módulo) ═══

1. **A RESPOSTA VEM ANINHADA EM `resultado`, NÃO NA RAIZ.** `j["resultado"]
   ["listaItem"]`, não `j["listaItem"]`.

2. **`p=` PAGINA. NENHUM OUTRO NOME FUNCIONA.** `numPagina`, `pagina`,
   `page`, `offset`, `start` — todos ignorados em silêncio (a fonte sempre
   devolve a página 1). `tamanhoPagina` também é ignorado: a página é FIXA
   em 20 registros.

3. **NÃO EXISTE BUSCA POR TEXTO LIVRE.** `expr`, `q`, `termo`, `busca`,
   `ementa`, `indexacao`, `assunto` — nenhum parâmetro filtra por palavra.
   A consulta padrão (sem filtro) devolve as **2.539 "normas básicas"** — um
   corpus pequeno o bastante para baixar inteiro (127 páginas, ~2,5 min a
   1 req/s) e filtrar localmente. O corpus completo da ALMG é uma ordem de
   grandeza maior (`tipo=LEI` sozinho já devolve 30.156) — este módulo NUNCA
   pede isso.

4. **FILTRO AMBIENTAL É PELO CAMPO `indexacao` (taxonomia oficial da ALMG),
   NUNCA POR PALAVRA-CHAVE NA EMENTA.** `indexacao` é uma lista de
   caminhos hierárquicos ("/Tema/Meio Ambiente/Gestão Ambiental/...")
   atribuída pela própria ALMG — é o mesmo princípio já estabelecido em
   `F0-discovery.md` §3 para os setores do Copam ("nunca por palavra-chave
   em texto livre — é o bug do `licita` casando dentro de `SOlicitação`").
   Uma norma entra aqui se e só se `"Meio Ambiente"` aparecer em algum
   caminho de `indexacao`. O valor bruto de `indexacao` é GRAVADO na coluna
   de mesmo nome (migration 0066) — usado por `etl.temas_ambientais` pra
   classificar tema pela taxonomia oficial da ALMG, não só por
   palavra-chave na ementa (a única das três fontes que tem esse campo).

5. **LIMITE DE TAXA É DA PRÓPRIA ALMG, DOCUMENTADO E ESTRITO**: máx. 2
   concorrentes, ≥1s entre pedidos, "acesso pode ser bloqueado sem aviso".
   Este módulo é sequencial (concorrência 1) com `--pausa` ≥1,1s por
   padrão, e PARA (não retenta, não muda User-Agent) em 403/429 — mesma
   regra de parada de `F0-discovery.md` §2.2.

6. **`tipo` VEM ABREVIADO** ("DEC", "LCP") — normalizado para a forma por
   extenso em `etl.apis._legislacao_ambiental.normalizar_tipo`, usada só na
   `chave_dedup` (a coluna `tipo` grava o literal da fonte, sem inventar).

═══ O QUE ESTE MÓDULO NÃO FAZ ═══

Não resolve normas fora das 2.539 básicas (ex. uma norma revogada que só
aparece no corpus completo de 30 mil) — está fora do escopo desta tarefa
(F0-discovery.md §6: "resolver normas específicas por URL direta" fica para
quem precisar).

Uso:

    python -m etl.apis.legislacao_almg --sondar
    python -m etl.apis.legislacao_almg --sondar --paginas 3
    python -m etl.apis.legislacao_almg
"""
import argparse
import datetime as dt
import sys
import time

import requests
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

from etl.common import get_supabase_client
from etl.apis._legislacao_ambiental import UA, chave_dedup

LOG = "[etl.apis.legislacao_almg]"

BASE = "https://dadosabertos.almg.gov.br/api/v2/legislacao/mineira/pesquisa/direcionada"
TIMEOUT = 60
PAUSA_PADRAO = 1.1  # a fonte exige >=1s; a margem é contra jitter de rede
TAMANHO_PAGINA = 20  # fixo pela fonte — `tamanhoPagina` é ignorado (armadilha 2)

# Público, legível por humano — distinto do endpoint de dados abertos.
# Confirmado ao vivo em 2026-08-11: `/consulte/legislacao/completa/completa.html
# ?tipo=X&num=Y&ano=Z` redireciona 302 para esta forma limpa, com o MESMO
# código curto de `tipo` que a API devolve ("DEC", "LCP" — não precisa
# expandir para a URL funcionar).
URL_PUBLICA = "https://www.almg.gov.br/legislacao-mineira/{tipo}/{numero}/{ano}/"


class BloqueadoPelaFonte(RuntimeError):
    pass


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    return s


@retry(
    retry=retry_if_exception_type(requests.exceptions.Timeout),
    stop=stop_after_attempt(3),
    wait=wait_fixed(3),
)
def _buscar_pagina(sessao: requests.Session, pagina: int) -> dict:
    r = sessao.get(BASE, params={"formato": "json", "p": pagina}, timeout=TIMEOUT)
    if r.status_code in (403, 429):
        # Regra de parada do F0-discovery.md §2.2: não retenta, não troca
        # User-Agent. "Acesso pode ser bloqueado sem aviso" é da própria
        # documentação da ALMG.
        raise BloqueadoPelaFonte(
            f"{LOG} HTTP {r.status_code} na página {pagina} — a ALMG documenta que "
            "pode bloquear sem aviso. Parando (não retentando)."
        )
    r.raise_for_status()
    corpo = r.json()
    resultado = corpo.get("resultado")
    if resultado is None:
        # Armadilha 1: um coletor que lesse a raiz aqui gravaria silêncio.
        raise RuntimeError(f"{LOG} resposta sem chave 'resultado' na página {pagina} — layout mudou?")
    return resultado


def _eh_ambiental(indexacao: str | None) -> bool:
    """Armadilha 4: filtro pela taxonomia oficial da própria ALMG, nunca por
    palavra-chave livre na ementa."""
    return "Meio Ambiente" in (indexacao or "")


def _data_iso(bruto: str | None) -> str | None:
    """`"20260806"` -> `"2026-08-06"`."""
    if not bruto or len(bruto) != 8:
        return None
    try:
        return dt.date(int(bruto[:4]), int(bruto[4:6]), int(bruto[6:8])).isoformat()
    except ValueError:
        return None


def _url_publica(tipo: str, numero: str, ano: str) -> str | None:
    if not tipo or not numero or not ano:
        return None
    return URL_PUBLICA.format(tipo=tipo, numero=numero, ano=ano)


def _linha(item: dict) -> dict | None:
    id_fonte = item.get("numDoc")
    tipo = item.get("tipo")
    numero = item.get("numero")
    ano_bruto = item.get("ano")
    if not id_fonte or not tipo:
        return None
    ano = int(ano_bruto) if ano_bruto and ano_bruto.isdigit() else None
    return {
        "fonte": "almg",
        "id_fonte": str(id_fonte),
        "tipo": tipo,
        "numero": numero,
        "ano": ano,
        "ementa": (item.get("ementa") or "").strip() or None,
        "data": _data_iso(item.get("data")),
        "orgao": item.get("origem"),  # "Legislativo" | "Executivo" — quem editou a norma
        "link_pdf": _url_publica(tipo, numero, ano_bruto or ""),
        "id_ibge_municipio": None,  # ver a nota da migration 0063 — normas estaduais não são por município
        "chave_dedup": chave_dedup(tipo, numero, ano),
        # Migration 0066: até aqui `indexacao` só era lido pra filtrar
        # ambiental (`_eh_ambiental`) e descartado — a ALMG é a única das
        # três fontes que atribui taxonomia OFICIAL a cada norma, guardar o
        # bruto é o que permite `etl.temas_ambientais.temas_da_indexacao_almg`
        # classificar por essa taxonomia em vez de só palavra-chave.
        "indexacao": (item.get("indexacao") or "").strip() or None,
    }


def coletar(
    *, pausa: float = PAUSA_PADRAO, max_paginas: int | None = None, verboso: bool = False
) -> tuple[list[dict], dict]:
    """Baixa as páginas das normas básicas e filtra localmente as
    ambientais (armadilhas 3+4). Devolve (linhas_ambientais, diagnóstico)."""
    sessao = _sessao()
    primeira = _buscar_pagina(sessao, 1)
    total_ocorrencias = primeira.get("noOcorrencias") or 0
    total_paginas = (total_ocorrencias + TAMANHO_PAGINA - 1) // TAMANHO_PAGINA
    ultima = min(max_paginas, total_paginas) if max_paginas else total_paginas

    diag = {
        "total_normas_basicas": total_ocorrencias,
        "total_paginas": total_paginas,
        "paginas_lidas": 0,
        "truncado": max_paginas is not None and max_paginas < total_paginas,
    }

    # Por `id_fonte` (numDoc), não lista — mesma cautela do
    # `legislacao_semad` (fonte irmã, mesma classe de risco de duplicata na
    # paginação): mesmo sem duplicata observada aqui, upsert em lote com
    # `id_fonte` repetido no MESMO lote quebra o Postgres, não só duplica.
    por_id: dict[str, dict] = {}
    for pagina in range(1, ultima + 1):
        resultado = primeira if pagina == 1 else _buscar_pagina(sessao, pagina)
        itens = resultado.get("listaItem") or []
        for item in itens:
            if not _eh_ambiental(item.get("indexacao")):
                continue
            linha = _linha(item)
            if linha:
                por_id[linha["id_fonte"]] = linha
        diag["paginas_lidas"] += 1
        if verboso:
            print(f"{LOG}   página {pagina}/{ultima}: {len(itens)} norma(s) na página, "
                  f"{len(por_id)} ambiental(is) acumulada(s)")
        if pagina < ultima:
            time.sleep(pausa)

    return list(por_id.values()), diag


def sondar(pausa: float, max_paginas: int | None) -> None:
    linhas, diag = coletar(pausa=pausa, max_paginas=max_paginas, verboso=True)
    print(f"\n{LOG} {diag['total_normas_basicas']} norma(s) básica(s) na fonte "
          f"({diag['total_paginas']} página(s)); {diag['paginas_lidas']} página(s) lida(s).")
    if diag["truncado"]:
        print(f"{LOG} SONDAGEM TRUNCADA — amostra, não o corpus inteiro.")
    print(f"{LOG} {len(linhas)} norma(s) ambiental(is) (filtro por indexação 'Meio Ambiente').")
    for l in linhas[:8]:
        print(f"       {l['tipo']:<5} {l['numero']:<7} {l['ano']} {l['data']} "
              f"chave={l['chave_dedup']!r}  {(l['ementa'] or '')[:60]}")


def sync(*, pausa: float = PAUSA_PADRAO) -> None:
    client = get_supabase_client()
    linhas, diag = coletar(pausa=pausa, verboso=True)
    print(f"{LOG} {diag['total_normas_basicas']} norma(s) básica(s) na fonte, "
          f"{len(linhas)} ambiental(is) para gravar.")
    if not linhas:
        print(f"{LOG} nada ambiental encontrado — NÃO apago o que já existe.")
        return
    for i in range(0, len(linhas), 200):
        client.table("ambiental_legislacao").upsert(
            linhas[i : i + 200], on_conflict="fonte,id_fonte"
        ).execute()
    print(f"{LOG} {len(linhas)} linha(s) gravada(s)/atualizada(s) (fonte=almg).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sondar", action="store_true", help="consulta e relata, NÃO grava, NÃO lê o banco")
    parser.add_argument("--paginas", type=int, help="teto de páginas (amostra) — só com --sondar")
    parser.add_argument("--pausa", type=float, default=PAUSA_PADRAO, help="segundos entre requisições (fonte exige >=1s)")
    args = parser.parse_args()

    try:
        if args.sondar:
            sondar(args.pausa, args.paginas)
        else:
            sync(pausa=args.pausa)
    except BloqueadoPelaFonte as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
