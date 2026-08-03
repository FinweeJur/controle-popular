"""etl.psp.servidores — quadro de servidores e folha de pagamento de São Paulo.

    python -m etl.psp.servidores --id-municipio 3550308             # mês mais recente
    python -m etl.psp.servidores --id-municipio 3550308 --meses 6   # meio ano de folha

FONTE: CKAN da Prefeitura de São Paulo (`dados.prefeitura.sp.gov.br`,
CKAN 2.7.7, sem token), organização SEGES. Dois datasets mensais da
SEGES/SIGPEC, verificados ao vivo em 2026-08-03 na competência mai/2026:

* `servidores-ativos-da-prefeitura` — 129.430 linhas, 28 colunas, quem é e
  onde trabalha. Nome do arquivo: `verificado_ativos_<dd-mm-aaaa>_<mmm>-<aaaa>.csv`.
* `remuneracao-servidores-prefeitura-de-sao-paulo` — 128.476 linhas, 13
  colunas, quanto cada um recebeu. Nome: `mes_ano_folha_<AAAAMM>_...csv`.
  Soma bruta de mai/2026: R$ 1.534.784.800,21.

**`requests` BASTA — não precisa de `curl_cffi`.** A PBH exigiu
`curl_cffi` porque o WAF dela (GoCache) bloqueia por fingerprint de TLS; o
CKAN de SP não tem nada disso e responde 200 até com o User-Agent padrão do
`python-requests`. MAS há uma pegadinha de esquema que vale mais que o WAF:

    requests.get("http://dados.prefeitura.sp.gov.br/api/3/action/status_show")
      -> HTTP 200, corpo = página de desafio JavaScript do F5/TSPD
    requests.get("https://...  mesmo caminho ...")
      -> HTTP 200, JSON do CKAN

O desafio vem com **status 200 e sem redirect**, então `raise_for_status()`
passa e o estouro acontece só no `.json()`, longe da causa. Isso importa
porque `municipios.fontes.prefeitura_dados_abertos_host` de São Paulo está
gravado com `http://` — usar aquele valor tal e qual é o caminho natural e
errado. Por isso `_base_ckan()` força https em vez de confiar no que está
no banco.

**ENCODING: os dois arquivos são CP850**, não latin-1 e não cp1252. A ordem
padrão do projeto (utf-8-sig → utf-8 → cp1252 → latin-1, tudo estrito)
acerta em não parar no utf-8 e em rejeitar cp1252 (os arquivos têm 0x90,
byte indefinido em cp1252), mas termina em latin-1 — que aceita qualquer
byte e devolve mojibake em silêncio: "Exceção" vira "ExceÆo", "Número" vira
"N£mero", "5º" vira "5§". A pista é que os bytes altos são de code page de
DOS (0x87='ç', 0x88='ê', 0xC6='ã', 0xA3='ú' em CP850). Por isso
`_decodificar()` tenta **cp850 ANTES de latin-1** e, quando cai em latin-1,
avisa em vez de seguir calado.

DECISÃO DE PRIVACIDADE (a mesma já tomada em `etl/pbh/folha.py`; não é para
reabrir aqui): `servidores` recebe só quem/onde — a tabela não tem coluna de
remuneração — e o dinheiro vai AGREGADO por (órgão, competência) para
`folha_pagamento`. Republicar nome+salário individual é uma decisão
editorial com custo próprio, e o schema a torna impossível por construção.

CASAR OS DOIS ARQUIVOS. O arquivo de remuneração não tem coluna de
secretaria: o campo mais grosso dele é `Unidade` (3.926 valores distintos),
que é a mesma granularidade do `SETOR` do arquivo de ativos (3.918). Para
que o `orgao` de `folha_pagamento` seja o MESMO texto que o `orgao` de
`servidores` — senão as duas telas do portal falam de coisas diferentes com
o mesmo rótulo — o módulo constrói um mapa a partir do arquivo de ativos e
resolve cada linha de dinheiro em três tentativas. Medido em mai/2026:
(nome, unidade) resolve 120.032; unidade sem ambiguidade resolve mais 8.138
(86 dos 3.885 setores servem a mais de uma secretaria); nome sem ambiguidade
resolve 120; sobram 186 linhas (0,14%) sem par, que vão para
"SEM ÓRGÃO INFORMADO" em vez de sumirem da soma.

Cron: mensal (a SEGES publica a competência anterior por volta do dia 20).
"""

import argparse
import csv
import io
import re
import sys
import unicodedata
from collections import defaultdict

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
)

PACOTE_ATIVOS = "servidores-ativos-da-prefeitura"
PACOTE_REMUNERACAO = "remuneracao-servidores-prefeitura-de-sao-paulo"
HOST_ESPERADO = "dados.prefeitura.sp.gov.br"

FONTE_SERVIDORES = "CKAN Dados Abertos SP — SEGES/SIGPEC (servidores ativos)"
FONTE_FOLHA = "CKAN Dados Abertos SP — SEGES/SIGPEC (remuneração nominal)"

# Sem órgão o agregado não responde "quanto cada secretaria gasta", mas
# descartar a linha faria a soma do município ficar menor que a real e
# ninguém notaria. Fica visível.
ORGAO_DESCONHECIDO = "SEM ÓRGÃO INFORMADO"

# `servidores` tem UNIQUE(id_municipio, orgao, nome, cargo) e no Postgres
# NULL nunca conflita com NULL: gravar cargo NULL faria a mesma pessoa
# entrar de novo a cada rodada, sem erro. 20 linhas de mai/2026 não têm
# cargo nenhum preenchido, então o caso é real, não hipotético.
CARGO_DESCONHECIDO = "NÃO INFORMADO"

_MESES_PT = {
    "jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6,
    "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12,
}

# `verificado_ativos_03-06-2026_mai-2026.csv` e a variante com sufixo "in"
# (`..._mar-2026in.csv`), que a SEGES usa sem explicar. A competência é o
# `mmm-aaaa` do FIM do nome; a data do começo é a de extração, um mês à
# frente — usar a errada desloca a série inteira em um mês.
_RE_COMP_ATIVOS = re.compile(r"_(" + "|".join(_MESES_PT) + r")-(\d{4})\w*\.csv$", re.I)
_RE_COMP_REMUNERACAO = re.compile(r"mes_ano_folha_(\d{4})(\d{2})_", re.I)

_RE_VALOR = re.compile(r"^-?\d{1,3}(\.\d{3})*(,\d+)?$|^-?\d+(,\d+)?$")


def _base_ckan(cidade: dict) -> str:
    """A Action API do CKAN de SP, em https, derivada de `municipios`.

    O host sai de `fontes.prefeitura_dados_abertos_host` (é dado da cidade,
    não constante do módulo), mas o ESQUEMA é forçado: ver o docstring do
    módulo — em http o CKAN devolve desafio de bot com HTTP 200.
    """
    host = (cidade["fontes"].get("prefeitura_dados_abertos_host") or "").strip()
    if not host:
        raise RuntimeError(
            f"{cidade['nome']} não declara `fontes.prefeitura_dados_abertos_host`."
        )
    if HOST_ESPERADO not in host:
        raise RuntimeError(
            f"etl.psp é o pacote da PREFEITURA DE SÃO PAULO; "
            f"{cidade['nome']} aponta para `{host}`. "
            "Use o pacote da fonte correspondente (ex.: etl.pbh para BH)."
        )
    return "https://" + host.split("://", 1)[-1].rstrip("/")


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _package_show(base: str, pacote: str) -> dict:
    resp = requests.get(
        f"{base}/package_show", params={"id": pacote}, timeout=120
    )
    resp.raise_for_status()
    corpo = resp.json()
    if not corpo.get("success"):
        raise RuntimeError(f"CKAN package_show({pacote}) devolveu success=false")
    return corpo["result"]


@retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=1, min=3, max=60))
def _baixar(url: str) -> bytes:
    resp = requests.get(url, timeout=600)
    resp.raise_for_status()
    return resp.content


def _decodificar(brutos: bytes, rotulo: str) -> str:
    """Texto do CSV, testando os encodings em modo ESTRITO.

    A ordem tem cp850 ANTES de latin-1 de propósito: os dois arquivos da
    SEGES são CP850 e latin-1 decodifica qualquer byte sem exceção, então
    latin-1 antes venceria sempre e entregaria mojibake calado (ver o
    docstring do módulo). latin-1 fica de último como rede de segurança e
    imprime aviso, porque cair nela significa que o palpite errou.
    """
    for enc in ("utf-8-sig", "utf-8", "cp1252", "cp850"):
        try:
            return brutos.decode(enc)
        except UnicodeDecodeError:
            continue
    print(
        f"[etl.psp.servidores] AVISO: {rotulo} não decodifica em utf-8/cp1252/cp850; "
        "caindo em latin-1, que aceita qualquer byte — confira os acentos antes de confiar."
    )
    return brutos.decode("latin-1")


def _ler_csv(url: str, rotulo: str) -> list[dict]:
    texto = _decodificar(_baixar(url), rotulo)
    leitor = csv.DictReader(io.StringIO(texto), delimiter=";")
    return list(leitor)


def _normalizar(s: str | None) -> str:
    """Maiúsculas, sem acento e sem espaço duplo — só para CASAR os dois
    arquivos entre si. O texto que vai para o banco é sempre o original."""
    sem_acento = unicodedata.normalize("NFD", s or "")
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    return " ".join(sem_acento.upper().split())


def _valor(v: str | None) -> float:
    """"10.584,38" -> 10584.38. Formato brasileiro, ponto de milhar."""
    t = (v or "").strip()
    if not t or not _RE_VALOR.match(t):
        return 0.0
    return float(t.replace(".", "").replace(",", "."))


def _competencias_disponiveis(recursos: list[dict], regex, extrair) -> dict[tuple[int, int], str]:
    """`{(ano, mes): url_do_csv}` a partir dos nomes de arquivo.

    A competência vem do NOME, não do campo `created` do CKAN: os dois
    datasets têm reenvios fora de ordem (a competência 202603 foi criada
    depois da 202604) e `created` mais recente já não é o mês mais recente.
    O dicionário de dados de cada dataset também é publicado como .csv e
    não casa com o regex — é assim que ele fica de fora.
    """
    achados: dict[tuple[int, int], str] = {}
    for r in recursos:
        if (r.get("format") or "").strip().lower().lstrip(".") != "csv":
            continue
        nome = (r.get("url") or "").rsplit("/", 1)[-1]
        m = regex.search(nome)
        if not m:
            continue
        chave = extrair(m)
        # Reenvios da mesma competência: fica o mais recente por `created`.
        anterior = achados.get(chave)
        if anterior is None or (r.get("created") or "") > anterior[0]:
            achados[chave] = (r.get("created") or "", r["url"])
    return {k: v[1] for k, v in achados.items()}


def _mapa_orgao(linhas_ativos: list[dict]) -> tuple[dict, dict, dict]:
    """Índices que traduzem uma linha de remuneração em secretaria.

    Devolve `(por_nome_e_setor, por_setor_unico, por_nome_unico)` — as três
    tentativas, da mais específica para a mais frouxa. Ver o docstring do
    módulo para as taxas medidas de cada uma.
    """
    por_nome_setor: dict[tuple[str, str], str] = {}
    setor_para_orgaos: dict[str, set[str]] = defaultdict(set)
    nome_para_orgaos: dict[str, set[str]] = defaultdict(set)
    for r in linhas_ativos:
        orgao = (r.get("SECRET_SUBPREF") or "").strip()
        if not orgao:
            continue
        nome = _normalizar(r.get("NOME"))
        setor = _normalizar(r.get("SETOR"))
        por_nome_setor[(nome, setor)] = orgao
        setor_para_orgaos[setor].add(orgao)
        nome_para_orgaos[nome].add(orgao)
    return (
        por_nome_setor,
        {s: next(iter(o)) for s, o in setor_para_orgaos.items() if len(o) == 1},
        {n: next(iter(o)) for n, o in nome_para_orgaos.items() if len(o) == 1},
    )


def _sincronizar_quadro(client, id_municipio: str, linhas: list[dict]) -> int:
    """`servidores`: quem trabalha onde, sem nenhum valor em dinheiro.

    É um retrato do quadro ATUAL, não série histórica — a chave única não
    tem competência, então só a competência mais nova é gravada; rodar
    vários meses só reescreveria as mesmas linhas.
    """
    # Dedupe pela chave única ANTES do upsert: 3.877 das 129.430 linhas de
    # mai/2026 repetem (órgão, nome, cargo) — professor com dois vínculos, na
    # prática — e `ON CONFLICT DO UPDATE` não pode tocar a mesma linha duas
    # vezes na mesma instrução.
    por_chave: dict[tuple, dict] = {}
    for r in linhas:
        nome = (r.get("NOME") or "").strip()
        if not nome:
            continue
        orgao = (
            (r.get("SECRET_SUBPREF") or "").strip()
            or (r.get("ORGAO_EXT") or "").strip()
            or ORGAO_DESCONHECIDO
        )
        cargo = (
            (r.get("CARGO_BASICO") or "").strip()
            or (r.get("CARGO_COMISSAO") or "").strip()
            or (r.get("DESIGNACAO") or "").strip()
            or CARGO_DESCONHECIDO
        )
        por_chave[(orgao, nome, cargo)] = {
            "id_municipio": id_municipio,
            "orgao": orgao,
            "nome": nome,
            "cargo": cargo,
            "lotacao": (r.get("SETOR") or "").strip() or None,
            "vinculo": (r.get("REL_JUR_ADM") or "").strip() or None,
        }

    valores = list(por_chave.values())
    # 125 mil linhas × 6 colunas estoura o teto de 65.535 placeholders do
    # Postgres numa instrução só.
    LOTE = 5000
    for i in range(0, len(valores), LOTE):
        client.table("servidores").upsert(
            valores[i : i + LOTE], on_conflict="id_municipio,orgao,nome,cargo"
        ).execute()
    return len(valores)


def _sincronizar_folha(
    client, id_municipio: str, ano: int, mes: int, linhas: list[dict], mapa
) -> tuple[int, float, int]:
    por_nome_setor, por_setor, por_nome = mapa
    agregado: dict[str, dict] = defaultdict(lambda: {"bruto": 0.0, "vinculos": 0})
    sem_par = 0
    for r in linhas:
        nome = _normalizar(r.get("Nome completo"))
        unidade = _normalizar(r.get("Unidade"))
        orgao = (
            por_nome_setor.get((nome, unidade))
            or por_setor.get(unidade)
            or por_nome.get(nome)
        )
        if orgao is None:
            orgao = ORGAO_DESCONHECIDO
            sem_par += 1
        agregado[orgao]["bruto"] += _valor(r.get("Remuneração Bruta"))
        # Conta o VÍNCULO na folha, não a pessoa: as 268 linhas de mai/2026
        # com bruto vazio (afastados) continuam sendo vínculos ativos.
        agregado[orgao]["vinculos"] += 1

    competencia = f"{ano}-{mes:02d}-01"
    rows = [
        {
            "id_municipio": id_municipio,
            "orgao": orgao,
            "competencia": competencia,
            "total_bruto": round(v["bruto"], 2),
            "qtd_servidores": v["vinculos"],
            "fonte": FONTE_FOLHA,
        }
        for orgao, v in sorted(agregado.items())
    ]
    client.table("folha_pagamento").upsert(
        rows, on_conflict="id_municipio,orgao,competencia"
    ).execute()
    return len(rows), sum(v["bruto"] for v in agregado.values()), sem_par


def sync(id_municipio: str, meses: int = 1) -> None:
    cidade = carregar_municipio(id_municipio)
    base = _base_ckan(cidade)

    pac_ativos = _package_show(base, PACOTE_ATIVOS)
    pac_remun = _package_show(base, PACOTE_REMUNERACAO)
    comps_ativos = _competencias_disponiveis(
        pac_ativos["resources"],
        _RE_COMP_ATIVOS,
        lambda m: (int(m.group(2)), _MESES_PT[m.group(1).lower()]),
    )
    comps_remun = _competencias_disponiveis(
        pac_remun["resources"],
        _RE_COMP_REMUNERACAO,
        lambda m: (int(m.group(1)), int(m.group(2))),
    )
    if not comps_ativos or not comps_remun:
        raise RuntimeError(
            f"CKAN de SP sem CSV reconhecível: ativos={len(comps_ativos)}, "
            f"remuneração={len(comps_remun)} — o padrão de nome de arquivo mudou?"
        )

    ordenadas = sorted(comps_remun, reverse=True)[:meses]
    mais_recente_ativos = max(comps_ativos)
    print(
        f"[etl.psp.servidores] competências: ativos até "
        f"{mais_recente_ativos[0]}-{mais_recente_ativos[1]:02d} ({len(comps_ativos)} meses), "
        f"remuneração até {ordenadas[0][0]}-{ordenadas[0][1]:02d} ({len(comps_remun)} meses)"
    )

    client = get_supabase_client()
    quadro = 0
    for pos, (ano, mes) in enumerate(ordenadas):
        # O mapa de órgão vem do arquivo de ativos da MESMA competência
        # sempre que existir: uma pessoa muda de secretaria e o mapa do mês
        # errado atribuiria o salário à secretaria errada.
        chave_ativos = (ano, mes) if (ano, mes) in comps_ativos else mais_recente_ativos
        if chave_ativos != (ano, mes):
            print(
                f"[etl.psp.servidores] {ano}-{mes:02d}: sem arquivo de ativos desta "
                f"competência; usando o de {chave_ativos[0]}-{chave_ativos[1]:02d} "
                "só para mapear órgão"
            )
        ativos = _ler_csv(comps_ativos[chave_ativos], f"ativos {chave_ativos}")
        remun = _ler_csv(comps_remun[(ano, mes)], f"remuneração {ano}-{mes:02d}")

        orgaos, total, sem_par = _sincronizar_folha(
            client, id_municipio, ano, mes, remun, _mapa_orgao(ativos)
        )
        print(
            f"[etl.psp.servidores] {ano}-{mes:02d}: {orgaos} órgãos, "
            f"{len(remun)} vínculos, R$ {total:,.2f} bruto"
            + (f" ({sem_par} sem órgão)" if sem_par else "")
        )

        # `servidores` é retrato do agora: só a competência mais nova entra.
        if pos == 0:
            quadro = _sincronizar_quadro(client, id_municipio, ativos)
            print(
                f"[etl.psp.servidores] quadro de {chave_ativos[0]}-{chave_ativos[1]:02d}: "
                f"{quadro} servidores ({len(ativos)} linhas no CSV, "
                f"{len(ativos) - quadro} duplicatas de chave colapsadas)"
            )

    print(
        f"[etl.psp.servidores] id_municipio={id_municipio} "
        f"servidores={quadro}, folha_pagamento={len(ordenadas)} competência(s)"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--meses",
        type=int,
        default=1,
        help="Quantas competências retroativas agregar em folha_pagamento (padrão: 1). "
        "Cada uma baixa ~59 MB de CSV.",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.meses)
    except RuntimeError as e:
        print(f"[etl.psp.servidores] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
