r"""etl.apis.ibama_fiscalizacao — autos de infração e embargos ambientais do
**IBAMA**, por município, via o catálogo de dados abertos
`dadosabertos.ibama.gov.br` (CKAN).

Fonte: dois datasets CKAN, cada um um ZIP de CSV `;`-delimitado, sem chave e
sem login:

  * `fiscalizacao-auto-de-infracao` — autuações/multas, 1977→hoje, um arquivo
    por ano dentro do zip (48 arquivos em 2026-08-09).
  * `fiscalizacao-termo-de-embargo` — áreas/atividades embargadas, um único
    CSV com todo o histórico.

Os dois se ligam por `CD_TERMOS_EMBARGOS` (auto) ↔ `NUM_TAD` (embargo) e por
`SEQ_AUTO_INFRACAO` — testado ao vivo em 2026-08-09, 4 de 4 casamentos.

POR QUE BAIXAR O ARQUIVO NACIONAL INTEIRO E NÃO CONSULTAR SÓ O MUNICÍPIO. Ao
contrário da ANM (`geo.anm.gov.br`, `where=`) ou do SNISB
(`etl.apis.snisb_barragens`), este portal não tem filtro server-side — é
download de arquivo estático. Os dois ZIPs somados (~170 MB) são pequenos o
bastante para baixar por completo a cada rodada; o filtro por município
acontece em código, lendo um arquivo do zip por vez (nunca o zip inteiro em
memória, nem o CSV inteiro de uma vez).

═══ AS ARMADILHAS MEDIDAS AO VIVO (2026-08-09) ═══

1. **ENCODING É UTF-8 DE VERDADE.** Ao contrário do padrão ASP.NET legado já
   visto na ANM, o CSV do IBAMA é UTF-8 correto. `apparent_encoding`/sniffing
   é desnecessário e arriscado — decodificação fixada em utf-8.

2. **O CSV TEM CAMPO DE TEXTO LONGO COM `;` DENTRO DE ASPAS**
   (`FUNDAMENTACAO_MULTA`, `DES_TAD`), e alguns excedem o limite default do
   módulo `csv` do Python (131.072 bytes) — `csv.field_size_limit()` maior é
   obrigatório, ou o parser explode no meio do arquivo.

3. **IDS INTEIROS VÊM COM `.0` GRUDADO EM VÁRIAS COLUNAS DO EMBARGO**
   (`SEQ_AUTO_INFRACAO`, `SEQ_TAD` como string). `int(float(valor))` resolve;
   comparação de string ingênua contra a chave do outro dataset (sem `.0`)
   falha em silêncio.

4. **COORDENADA MUDA DE SEPARADOR DECIMAL ENTRE OS DOIS DATASETS.**
   `NUM_LONGITUDE_AUTO`/`NUM_LATITUDE_AUTO` (autos) vêm com VÍRGULA decimal
   (`"-44,18722222223"`); `NUM_LONGITUDE_TAD`/`NUM_LATITUDE_TAD` (embargo) vêm
   com PONTO (`"-44.21323611112"`) — mesmo órgão, mesmo portal, dois formatos.
   Confirmado lendo os dois arquivos lado a lado, não é palpite. O parser de
   coordenada aqui trata os dois casos.

5. **VALOR MONETÁRIO PODE VIR EM FORMATO BRASILEIRO** (milhar com `.`, decimal
   com `,`) — mesma lógica de `.replace(".", "").replace(",", ".")` já usada
   em `etl.apis.anm_cfem`.

6. **CPF/CNPJ EM CLARO, SEM REDAÇÃO, NOS DOIS DATASETS** — ao lado de nome
   completo, endereço e coordenada exata. Mesmo "Risco 1" já documentado para
   o WFS de licenciamento estadual (`docs/ambiental/F0-discovery.md` §1.3).
   Formato de serialização difere entre datasets (autos: `096.948.166-70`;
   embargo: `09685268614`) — gravado fiel ao que cada fonte publica.

7. **CAIXA INCONSISTENTE EM `MUNICIPIO`** (`BETIM` no auto, `Betim` no
   embargo). Nunca facetar pelo texto — a chave é sempre `COD_MUNICIPIO`
   (IBGE, 7 dígitos), já confirmado bater com o código do IBGE em ambos.

8. **METADADO DO CKAN MENTE SOBRE FRESCOR E COBERTURA.** O dataset de embargo
   se declara "atualização diária", mas o `Last-Modified` real do arquivo (e o
   campo `ULTIMA_ATUALIZACAO_RELATORIO` de toda linha) pode ficar meses
   parado — conferir a data, não o texto do catálogo. Da mesma forma, a
   cobertura "desde 1980" declarada nas `extras` já foi vista errada (o zip
   real trouxe `auto_infracao_1977.csv`).

9. **A URL DO ARQUIVO NÃO É HARDCODED.** Resolvida a cada rodada via
   `package_show` do CKAN — é o uso pretendido da API (não scraping), e
   protege contra o recurso ser re-hospedado noutra URL.

═══ O QUE ESTE MÓDULO NÃO PROVA ═══

`COD_MUNICIPIO` é o município onde o AUTO foi lavrado, não necessariamente
onde o dano ambiental ocorreu (pode ser uma barreira rodoviária de fiscalização
de transporte). A tela não pode alegar "dano ambiental em <cidade>" só por uma
linha aqui — olhar `tipo_infracao`/`descricao_infracao`.

═══ O QUE ESTE MÓDULO ESCREVE ═══

- `ibama_autos_infracao` — uma linha por (município, auto de infração).
- `ibama_embargos` — uma linha por (município, termo de embargo).

Ambas por refresh total filtrado por `id_municipio`, com o guarda de redução
de `refresh_completo_seguro`.

Uso:

    python -m etl.apis.ibama_fiscalizacao --id-municipio 3106705 --sondar
    python -m etl.apis.ibama_fiscalizacao --id-municipio 3106705
    python -m etl.apis.ibama_fiscalizacao --id-municipio 3106705 --partes embargos
"""
import argparse
import csv
import io
import sys
import unicodedata
import zipfile
from decimal import Decimal, InvalidOperation

import requests

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    refresh_completo_seguro,
)

LOG = "[etl.apis.ibama_fiscalizacao]"

CKAN_BASE = "https://dadosabertos.ibama.gov.br/api/3/action/"
PACOTE_AUTOS = "fiscalizacao-auto-de-infracao"
PACOTE_EMBARGOS = "fiscalizacao-termo-de-embargo"
SUFIXO_AUTOS = "auto_infracao_csv.zip"
SUFIXO_EMBARGOS = "termo_embargo_csv.zip"

TIMEOUT = 60
DOWNLOAD_TIMEOUT = 300
_UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

csv.field_size_limit(2_000_000)  # armadilha 2: campo de justificativa longo estoura o default (131072)


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = _UA
    return s


def _resolver_zip(sessao: requests.Session, pacote: str, sufixo: str) -> str:
    """URL do recurso ZIP do pacote CKAN cujo nome termina em `sufixo`.

    Nunca hardcoded (armadilha 9): o pacote tem dezenas de recursos (CSV/XML/
    JSON x várias subtabelas) e só um é a tabela raiz que este módulo lê.
    """
    r = sessao.get(CKAN_BASE + "package_show", params={"id": pacote}, timeout=TIMEOUT)
    r.raise_for_status()
    corpo = r.json()
    if not corpo.get("success"):
        raise RuntimeError(f"{LOG} CKAN não achou o pacote {pacote!r}: {corpo}")
    for rec in corpo["result"]["resources"]:
        url = rec.get("url") or ""
        if url.endswith(sufixo):
            return url
    raise RuntimeError(
        f"{LOG} pacote {pacote!r} não tem recurso terminando em {sufixo!r} — "
        "o CKAN pode ter renomeado o arquivo; confira package_show manualmente."
    )


def _baixar(sessao: requests.Session, url: str) -> bytes:
    head = sessao.head(url, timeout=TIMEOUT, allow_redirects=True)
    tamanho = head.headers.get("Content-Length")
    rotulo_tamanho = f"~{int(tamanho) / 1_048_576:.0f} MB" if tamanho else "tamanho desconhecido"
    print(f"{LOG} baixando {url} ({rotulo_tamanho})...")
    r = sessao.get(url, timeout=DOWNLOAD_TIMEOUT)
    r.raise_for_status()
    return r.content


def _linhas_do_zip(zip_bytes: bytes, municipio: str):
    """Itera as linhas (dict) de TODOS os CSVs do zip cujo COD_MUNICIPIO bate —
    um arquivo por vez (o zip de autos tem 48 anos; nunca carregar tudo)."""
    zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    for nome in sorted(n for n in zf.namelist() if n.endswith(".csv")):
        with zf.open(nome) as f:
            texto = io.TextIOWrapper(f, encoding="utf-8", errors="replace")  # armadilha 1
            for linha in csv.DictReader(texto, delimiter=";", quotechar='"'):
                if (linha.get("COD_MUNICIPIO") or "").strip() == municipio:
                    yield linha


# ─────────────────────────── parsers de campo ─────────────────────────


def _vazio_para_none(v: str | None) -> str | None:
    s = (v or "").strip()
    return s or None


def _seq(v: str | None) -> int | None:
    """`"2130685.0"` -> `2130685` (armadilha 3). Vazio -> None."""
    s = (v or "").strip()
    if not s:
        return None
    try:
        return int(float(s))
    except ValueError:
        raise RuntimeError(f"sequencial não numérico onde se esperava id: {v!r}")


def _num(v: str | None) -> str | None:
    """`"1.500,00"` -> `"1500.00"` (formato brasileiro, armadilha 5). Vazio -> None."""
    s = (v or "").strip()
    if not s:
        return None
    try:
        return str(Decimal(s.replace(".", "").replace(",", ".")))
    except InvalidOperation:
        raise RuntimeError(f"valor não numérico onde se esperava número: {v!r}")


def _coord(v: str | None) -> str | None:
    """Aceita separador decimal por vírgula OU ponto (armadilha 4). Vazio -> None."""
    s = (v or "").strip()
    if not s:
        return None
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return str(Decimal(s))
    except InvalidOperation:
        raise RuntimeError(f"coordenada não numérica: {v!r}")


# ──────────────────────────── linha -> dict ────────────────────────────


def _parse_auto(linha: dict, id_municipio: str) -> dict:
    return {
        "id_municipio": id_municipio,
        "seq_auto_infracao": _seq(linha.get("SEQ_AUTO_INFRACAO")),
        "numero_auto": _vazio_para_none(linha.get("NUM_AUTO_INFRACAO")),
        "tipo_auto": _vazio_para_none(linha.get("TIPO_AUTO")),
        "tipo_multa": _vazio_para_none(linha.get("TIPO_MULTA")),
        "valor_multa": _num(linha.get("VAL_AUTO_INFRACAO")),
        "gravidade": _vazio_para_none(linha.get("GRAVIDADE_INFRACAO")),
        "data_fato": _vazio_para_none(linha.get("DT_FATO_INFRACIONAL")),
        "data_lavratura": _vazio_para_none(linha.get("DAT_HORA_AUTO_INFRACAO")),
        "codigo_infracao": _vazio_para_none(linha.get("COD_INFRACAO")),
        "descricao_infracao": _vazio_para_none(linha.get("DES_INFRACAO")),
        "tipo_infracao": _vazio_para_none(linha.get("TIPO_INFRACAO")),
        "infrator_tipo_pessoa": _vazio_para_none(linha.get("TP_PESSOA_INFRATOR")),
        "infrator_nome": _vazio_para_none(linha.get("NOME_INFRATOR")),
        "infrator_cpf_cnpj": _vazio_para_none(linha.get("CPF_CNPJ_INFRATOR")),
        "latitude": _coord(linha.get("NUM_LATITUDE_AUTO")),
        "longitude": _coord(linha.get("NUM_LONGITUDE_AUTO")),
        "local_infracao": _vazio_para_none(linha.get("DES_LOCAL_INFRACAO")),
        "numero_termo_embargo": _vazio_para_none(linha.get("CD_TERMOS_EMBARGOS")),
        "municipio_fonte": _vazio_para_none(linha.get("MUNICIPIO")),
        "uf_fonte": _vazio_para_none(linha.get("UF")),
        "atualizado_em": _vazio_para_none(linha.get("ULTIMA_ATUALIZACAO_RELATORIO")),
    }


def _parse_embargo(linha: dict, id_municipio: str) -> dict:
    return {
        "id_municipio": id_municipio,
        "seq_tad": _seq(linha.get("SEQ_TAD")),
        "numero_tad": _vazio_para_none(linha.get("NUM_TAD")),
        "data_embargo": _vazio_para_none(linha.get("DAT_EMBARGO")),
        "embargado_nome": _vazio_para_none(linha.get("NOME_EMBARGADO")),
        "embargado_cpf_cnpj": _vazio_para_none(linha.get("CPF_CNPJ_EMBARGADO")),
        "descricao": _vazio_para_none(linha.get("DES_TAD")),
        "localizacao": _vazio_para_none(linha.get("DES_LOCALIZACAO")),
        "latitude": _coord(linha.get("NUM_LATITUDE_TAD")),
        "longitude": _coord(linha.get("NUM_LONGITUDE_TAD")),
        "area_embargada": _num(linha.get("QTD_AREA_EMBARGADA")),
        "tipo_area": _vazio_para_none(linha.get("TIPO_AREA")),
        "situacao_desembargo": _vazio_para_none(linha.get("SIT_DESEMBARGO")),
        "data_desembargo": _vazio_para_none(linha.get("DAT_DESEMBARGO")),
        "seq_auto_infracao": _seq(linha.get("SEQ_AUTO_INFRACAO")),
        "numero_auto_infracao": _vazio_para_none(linha.get("NUM_AUTO_INFRACAO")),
        "municipio_fonte": _vazio_para_none(linha.get("MUNICIPIO")),
        "uf_fonte": _vazio_para_none(linha.get("UF")),
        "atualizado_em": _vazio_para_none(linha.get("ULTIMA_ATUALIZACAO_RELATORIO")),
    }


def _normalizar(s: str) -> str:
    base = unicodedata.normalize("NFD", s or "")
    sem_acento = "".join(c for c in base if unicodedata.category(c) != "Mn")
    return " ".join(sem_acento.upper().split())


def _conferir_identidade(linhas: list[dict], cidade: dict, tabela: str) -> None:
    """Confere que o texto MUNICIPIO que a fonte devolveu bate com o que
    `municipios` diz para este id. Não há round-trip de formulário como na ANM
    (armadilha 7 já cobre a caixa inconsistente); a prova é o texto que a
    própria linha carrega, normalizado antes de comparar.
    """
    esperado = _normalizar(cidade["nome"])
    for linha in linhas:
        achado = _normalizar(linha.get("municipio_fonte") or "")
        if achado and achado != esperado:
            raise RuntimeError(
                f"{LOG} linha com COD_MUNICIPIO={cidade['id_municipio']} mas "
                f"MUNICIPIO={linha.get('municipio_fonte')!r} — `municipios` diz "
                f"{cidade['nome']!r}. Recuso gravar em {tabela}: é o mesmo modo de "
                "falha do caso Betim/São Paulo."
            )


# ─────────────────────────────── coleta ────────────────────────────────


def coletar_autos(id_municipio: str) -> list[dict]:
    """Armadilha 10 (achada ao vivo em 2026-08-09, rodando sync de verdade pela
    primeira vez): pelo menos 1 linha de Betim tem `SEQ_AUTO_INFRACAO` vazio —
    `NUM_AUTO_INFRACAO` nessas usa uma numeração alfanumérica nova (ex.:
    `16L1JUFB`), não a sequencial numérica antiga que é a chave natural da
    tabela (`(id_municipio, seq_auto_infracao)`, `NOT NULL`). Gravar cru
    aborta o INSERT inteiro em lote (`NotNullViolation`) e derruba linhas boas
    junto — já aconteceu: 44 de 2.844 ficaram de fora numa rodada real. Pular
    e avisar é melhor que travar a tabela inteira por causa de 1 linha sem
    chave; a fonte não documenta esse novo formato, então não há regra de
    conversão confiável para reconstruir o sequencial a partir dele."""
    sessao = _sessao()
    url = _resolver_zip(sessao, PACOTE_AUTOS, SUFIXO_AUTOS)
    zip_bytes = _baixar(sessao, url)
    linhas: list[dict] = []
    pulados: list[str] = []
    for linha in _linhas_do_zip(zip_bytes, id_municipio):
        parsed = _parse_auto(linha, id_municipio)
        if parsed["seq_auto_infracao"] is None:
            pulados.append(parsed["numero_auto"] or "(sem número)")
            continue
        linhas.append(parsed)
    if pulados:
        print(f"{LOG} ATENÇÃO: {len(pulados)} linha(s) sem SEQ_AUTO_INFRACAO (chave natural) "
              f"PULADA(S), não gravadas — numero_auto: {pulados[:10]}"
              + (f" e mais {len(pulados) - 10}" if len(pulados) > 10 else ""))
    return linhas


def coletar_embargos(id_municipio: str) -> list[dict]:
    """Mesma guarda da armadilha 10 de `coletar_autos`, aplicada a `SEQ_TAD`
    (chave natural de `ibama_embargos`) — não observada ao vivo ainda, mas o
    mesmo formato de fonte pode repetir o gap."""
    sessao = _sessao()
    url = _resolver_zip(sessao, PACOTE_EMBARGOS, SUFIXO_EMBARGOS)
    zip_bytes = _baixar(sessao, url)
    linhas: list[dict] = []
    pulados: list[str] = []
    for linha in _linhas_do_zip(zip_bytes, id_municipio):
        parsed = _parse_embargo(linha, id_municipio)
        if parsed["seq_tad"] is None:
            pulados.append(parsed["numero_tad"] or "(sem número)")
            continue
        linhas.append(parsed)
    if pulados:
        print(f"{LOG} ATENÇÃO: {len(pulados)} linha(s) sem SEQ_TAD (chave natural) "
              f"PULADA(S), não gravadas — numero_tad: {pulados[:10]}"
              + (f" e mais {len(pulados) - 10}" if len(pulados) > 10 else ""))
    return linhas


# ─────────────────────────────── sondar ────────────────────────────────


def sondar(id_municipio: str, partes: set[str]) -> None:
    """Baixa, filtra e relata — sem tocar em `municipios` nem no banco. É o
    modo que funciona com a Neon fora do ar (HTTP 402, ver docs do worktree)."""
    print(f"{LOG} {id_municipio} — SEM GRAVAR, SEM LER `municipios`")

    autos: list[dict] = []
    if "autos" in partes:
        autos = coletar_autos(id_municipio)
        print(f"\n{LOG} autos de infração: {len(autos)} linha(s)")
        if autos:
            por_tipo: dict[str, int] = {}
            for a in autos:
                t = a["tipo_infracao"] or "(sem tipo)"
                por_tipo[t] = por_tipo.get(t, 0) + 1
            total = sum(Decimal(a["valor_multa"]) for a in autos if a["valor_multa"])
            municipios_vistos = {a["municipio_fonte"] for a in autos if a["municipio_fonte"]}
            print(f"       município(s) que a fonte ecoou: {municipios_vistos}")
            print(f"       soma de valor_multa: R$ {total:,.2f}")
            for tipo, n in sorted(por_tipo.items(), key=lambda kv: -kv[1])[:5]:
                print(f"       {tipo:<40} {n}")

    embargos: list[dict] = []
    if "embargos" in partes:
        embargos = coletar_embargos(id_municipio)
        print(f"\n{LOG} embargos: {len(embargos)} linha(s)")
        if embargos:
            municipios_vistos = {e["municipio_fonte"] for e in embargos if e["municipio_fonte"]}
            print(f"       município(s) que a fonte ecoou: {municipios_vistos}")

    if autos and embargos:
        chaves_embargo = {e["numero_tad"] for e in embargos if e["numero_tad"]}
        casados = sum(1 for a in autos if a["numero_termo_embargo"] in chaves_embargo)
        print(f"\n{LOG} junção auto->embargo (CD_TERMOS_EMBARGOS = NUM_TAD): "
              f"{casados} de {len(autos)} auto(s) têm embargo correspondente nesta coleta")


# ──────────────────────────────── sync ─────────────────────────────────


def sync(id_municipio: str, partes: set[str], *, permitir_reducao: bool) -> None:
    cidade = carregar_municipio(id_municipio)
    print(f"{LOG} {cidade['nome']}-{cidade['uf']} ({id_municipio})")

    if "autos" in partes:
        linhas = coletar_autos(id_municipio)
        _conferir_identidade(linhas, cidade, "ibama_autos_infracao")
        _gravar("ibama_autos_infracao", cidade, linhas, permitir_reducao)

    if "embargos" in partes:
        linhas = coletar_embargos(id_municipio)
        _conferir_identidade(linhas, cidade, "ibama_embargos")
        _gravar("ibama_embargos", cidade, linhas, permitir_reducao)


def _gravar(tabela: str, cidade: dict, linhas: list[dict], permitir_reducao: bool) -> None:
    if not linhas:
        # A maioria dos municípios não tem nenhuma autuação/embargo do IBAMA —
        # isso é dado real. Refresh total com lista vazia apagaria histórico
        # sem esta guarda (mesma armadilha 6 do `anm_cfem`).
        print(f"{LOG} {tabela}: nada coletado para {cidade['nome']} — NÃO apago o que já existe.")
        return
    client = get_supabase_client()
    refresh_completo_seguro(
        client,
        tabela,
        {"id_municipio": cidade["id_municipio"]},
        linhas,
        permitir_reducao=permitir_reducao,
        rotulo="etl.apis.ibama_fiscalizacao",
    )
    print(f"{LOG} {tabela}: {len(linhas)} linha(s) gravada(s).")


PARTES_VALIDAS = {"autos", "embargos"}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--partes", default="autos,embargos",
                        help=f"lista por vírgula: {sorted(PARTES_VALIDAS)}")
    parser.add_argument("--permitir-reducao", action="store_true")
    parser.add_argument("--sondar", action="store_true", help="baixa e relata, NÃO grava, NÃO lê o banco")
    args = parser.parse_args()

    partes = {p.strip() for p in args.partes.split(",") if p.strip()}
    invalidas = partes - PARTES_VALIDAS
    if invalidas:
        print(f"{LOG} ABORT: parte(s) desconhecida(s): {sorted(invalidas)}", file=sys.stderr)
        sys.exit(1)

    try:
        if args.sondar:
            sondar(args.id_municipio, partes)
        else:
            sync(args.id_municipio, partes, permitir_reducao=args.permitir_reducao)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
