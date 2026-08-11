r"""etl.apis.snisb_barragens — barragens cadastradas no **SNISB** (Sistema
Nacional de Informações sobre Segurança de Barragens), por município, via o
FeatureServer público da ANA/SNIRH.

Fonte: `https://www.snirh.gov.br/arcgis/rest/services/IG/SNISB/FeatureServer/0`
— ArcGIS REST, sem chave e sem login, `maxRecordCount` pequeno (pagina por
`resultOffset`). Item espelho equivalente em
`https://portal1.snirh.gov.br/server/rest/services/SNISB_MapaInterativo2023/MapServer/0`
(mesmos números, mesmo dado, hostname diferente).

POR QUE ESTA FONTE EXISTE ALÉM DA FEAM E DO DASHBOARD DA ANM (já documentados
em `docs/ambiental/F0-discovery.md` §5). As duas fontes já usadas no projeto
cobrem só barragem de MINERAÇÃO (FEAM: rejeitos/resíduos de MG; ANM: mineração
nacional). Depois da Lei 14.066/2020 a fiscalização de barragem no Brasil é
dividida por FINALIDADE — mineração fica com a ANM, abastecimento/irrigação/
contenção de cheia fica com a ANA/órgãos estaduais de água (IGAM em MG),
hidrelétrica fica com a ANEEL — e o SNISB é o cadastro NACIONAL CONSOLIDADO que
cruza todos esses reguladores. Medido ao vivo em 2026-08-09: **1.871 barragens
em MG** (IGAM 1.523 + ANEEL 277 + ANA 71) que não aparecem nem na FEAM nem no
dashboard da ANM — inclusive a BARRAGEM VARGEM DAS FLORES, da COPASA, que
abastece água em Betim.

═══ AS ARMADILHAS MEDIDAS AO VIVO (2026-08-09) ═══

1. **NÃO HÁ CÓDIGO IBGE DE MUNICÍPIO NESTA FONTE** — só `ING_NM_MUNICIPIO`
   (nome) e `ING_SG_UFMUNICIPIO` (sigla, 2 letras). Mesma lacuna já vista no
   `mun_solic` do WFS estadual (`F0-discovery.md` §1.2). O filtro server-side
   (`where=`) é só por UF (ASCII, sem risco de acento); o casamento por NOME de
   município acontece em código, normalizado (maiúsculo, sem acento, espaço
   único) — nunca comparado direto na query.

2. **`NIVEL_PERIGO` (o semáforo Normal/Atenção/Alerta/Emergência) ESTÁ VAZIO EM
   ~97% DAS LINHAS**, nacional e em MG. Não é falha de coleta — é o estado real
   da fonte. Este módulo NÃO substitui a FEAM como fonte de DCE/nível de
   emergência das barragens de mineração; contribui o que só ele tem:
   `categoria_risco`/`dano_potencial`/`possui_pae`/`possui_plano_seguranca`
   das barragens não-minerárias, que ESSAS vêm bem preenchidas.

3. **`BAR_DT_CADASTRO` VEM EM EPOCH MILISSEGUNDOS**, não string de data — campo
   ArcGIS `esriFieldTypeDate`. Passar o inteiro cru para uma coluna `date`
   gravaria um número absurdo sem erro.

4. **`where=1=1` FUNCIONA AQUI** (diferente do dashboard da ANM em
   `geo.anm.gov.br`, que devolve 403 nesse caso por assinatura de WAF) — mas
   este módulo nunca precisa dele: sempre filtra por UF.

5. **TRÊS NÚMEROS DIFERENTES PARA "BARRAGENS DE MINERAÇÃO EM MG"**: FEAM 249,
   WFS IDE-Sisema 259, SNISB (linhas atribuídas à ANM) 320. Não reconciliado —
   ver nota na migration `0049_snisb_barragens.sql`. Este módulo não tenta
   resolver isso; grava o que o SNISB diz, com `orgao_fiscalizador` para quem
   quiser comparar depois.

6. **CONTAGEM DE MUNICÍPIO PODE FICAR ARTIFICIALMENTE BAIXA (NUNCA ALTA)** se o
   nome na fonte tiver uma variação que o normalizador não previu — como não
   há código IBGE para cruzar, um "zero barragens" aqui não é 100% garantido
   ser zero de verdade. `--sondar` sem `--nome-municipio` lista todos os nomes
   de município vistos na UF, exatamente para essa conferência manual.

═══ 2026-08-11: DE "UMA CIDADE POR VEZ" PARA "UMA UF INTEIRA" ═══

Até aqui `sync(id_municipio)` exigia a cidade em `municipios` (6 linhas — as
do portal): `carregar_municipio` abortava para qualquer outra, e era ESSE
abort — não a FK desta tabela — que travava a cobertura em 52 das 2.212
barragens de MG. A migration `0057_ref_municipios_mg.sql` soltou a FK de
`municipios` e criou `ref_municipios_mg` (as ~853 cidades de MG + as cidades
do portal fora de MG, como São Paulo, que já tinham dado gravado). `sync()`
não recebe mais `--id-municipio`: recebe `--uf` (default `MG`, o alvo desta
mudança) e resolve o `id_municipio` de CADA barragem pelo nome que a própria
ANA grafa (`ING_NM_MUNICIPIO`), contra `ref_municipios_mg`.

O SNISB é nacional (armadilha 5), mas o catálogo novo só cobre MG (+ o
grandfather de São Paulo) — rodar `--uf` diferente de `MG`/`SP` resolve
poucas ou nenhuma barragem hoje, e o módulo AVISA em vez de fingir sucesso.
Ampliar o catálogo para as 5.570 cidades do Brasil é decisão de escopo maior
que esta migration, deliberadamente fora dela (ver o commit desta mudança).

═══ O QUE ESTE MÓDULO ESCREVE ═══

`snisb_barragens` — uma linha por (município, barragem), chave natural
`codigo_snisb` (BAR_CD_SNISB, da própria ANA), para as linhas cujo município
casou com confiança contra `ref_municipios_mg`
(`etl.common.resolver_municipio_mg`). Refresh total por município resolvido,
com o guarda de redução de `refresh_completo_seguro` (`ao_reduzir="skip"`:
uma cidade com redução não aborta as outras da mesma rodada).

Uso:

    python -m etl.apis.snisb_barragens --sondar --nome-municipio Betim
    python -m etl.apis.snisb_barragens --sondar   # sem nome: lista município da UF (MG por padrão)
    python -m etl.apis.snisb_barragens           # sincroniza toda a UF (MG por padrão)
    python -m etl.apis.snisb_barragens --uf SP
"""
import argparse
import datetime as dt
import sys
import unicodedata
from decimal import Decimal

import requests

from etl.common import get_supabase_client, refresh_completo_seguro, resolver_municipio_mg

LOG = "[etl.apis.snisb_barragens]"

FEATURESERVER = "https://www.snirh.gov.br/arcgis/rest/services/IG/SNISB/FeatureServer/0"
TIMEOUT = 60
PAGE_SIZE = 1000
_UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

# `ref_municipios_mg` (migration 0057) só cobre MG (+ grandfather de cidade
# do portal fora de MG) — é a UF que esta mudança destrava, por isso é o
# padrão. Ver a nota "DE 'UMA CIDADE POR VEZ' PARA 'UMA UF INTEIRA'" no topo
# do módulo antes de rodar com outra UF.
UF_PADRAO = "MG"

CAMPOS = [
    "BAR_CD_SNISB", "BAR_NM_NOME", "NM_EMPREENDEDOR", "USO_PRINCIPAL", "USO_COMPLEMENTAR",
    "ING_NM_MUNICIPIO", "ING_SG_UFMUNICIPIO", "ORG_NM_ORGANIZACAO", "CATEGORIA_RISCO",
    "DANO_POTENCIAL", "NIVEL_PERIGO", "REGULADA_PELO_PNSB", "POSSUI_PAE",
    "POSSUI_PLANO_SEGURANCA", "POSSUI_REVISAO_PERIODICA", "BARRAGEM_AUTUADA", "COMPLETUDE",
    "ING_NM_TRECHO", "BAR_NU_CAP_TOTAL_RESERV", "BAR_NU_LATITUDE", "BAR_NU_LONGITUDE",
    "BAR_DT_CADASTRO",
]


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = _UA
    return s


def _consultar_uf(sessao: requests.Session, uf: str) -> list[dict]:
    """Todas as barragens do SNISB na UF, paginado por `resultOffset`
    (armadilha 1: o filtro por nome de município NÃO entra aqui)."""
    linhas: list[dict] = []
    offset = 0
    while True:
        r = sessao.get(
            FEATURESERVER + "/query",
            params={
                "where": f"UPPER(ING_SG_UFMUNICIPIO)='{uf}'",
                "outFields": ",".join(CAMPOS),
                "f": "json",
                "resultOffset": offset,
                "resultRecordCount": PAGE_SIZE,
            },
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        corpo = r.json()
        if "error" in corpo:
            raise RuntimeError(f"{LOG} ArcGIS devolveu erro: {corpo['error']}")
        pagina = [f["attributes"] for f in corpo.get("features", [])]
        linhas.extend(pagina)
        if len(pagina) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return linhas


# ─────────────────────────── parsers de campo ─────────────────────────


def _vazio_para_none(v):
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def _dec(v) -> str | None:
    """`esriFieldTypeDouble` -> string decimal fiel (evita artefato de float,
    mesmo motivo já documentado em `etl.apis.tce_mg._num`). `None` -> `None`."""
    if v is None:
        return None
    return str(Decimal(str(v)))


def _epoch_ms_para_data(v) -> str | None:
    """`esriFieldTypeDate` vem em epoch milissegundos (armadilha 3), não texto."""
    if v is None:
        return None
    return dt.datetime.fromtimestamp(v / 1000, tz=dt.timezone.utc).date().isoformat()


def _normalizar(s: str) -> str:
    base = unicodedata.normalize("NFD", s or "")
    sem_acento = "".join(c for c in base if unicodedata.category(c) != "Mn")
    return " ".join(sem_acento.upper().split())


def _pertence_ao_municipio(linha: dict, nome_municipio: str) -> bool:
    return _normalizar(linha.get("ING_NM_MUNICIPIO") or "") == _normalizar(nome_municipio)


def _parse_barragem(linha: dict) -> dict:
    """Sem `id_municipio` — quem chama resolve o município (por nome, contra
    `ref_municipios_mg`) e preenche essa chave depois, só nas linhas que
    casaram com confiança."""
    return {
        "codigo_snisb": linha.get("BAR_CD_SNISB"),
        "nome": _vazio_para_none(linha.get("BAR_NM_NOME")),
        "empreendedor": _vazio_para_none(linha.get("NM_EMPREENDEDOR")),
        "uso_principal": _vazio_para_none(linha.get("USO_PRINCIPAL")),
        "uso_complementar": _vazio_para_none(linha.get("USO_COMPLEMENTAR")),
        "orgao_fiscalizador": _vazio_para_none(linha.get("ORG_NM_ORGANIZACAO")),
        "categoria_risco": _vazio_para_none(linha.get("CATEGORIA_RISCO")),
        "dano_potencial": _vazio_para_none(linha.get("DANO_POTENCIAL")),
        "nivel_perigo": _vazio_para_none(linha.get("NIVEL_PERIGO")),
        "regulada_pnsb": _vazio_para_none(linha.get("REGULADA_PELO_PNSB")),
        "possui_pae": _vazio_para_none(linha.get("POSSUI_PAE")),
        "possui_plano_seguranca": _vazio_para_none(linha.get("POSSUI_PLANO_SEGURANCA")),
        "possui_revisao_periodica": _vazio_para_none(linha.get("POSSUI_REVISAO_PERIODICA")),
        "barragem_autuada": _vazio_para_none(linha.get("BARRAGEM_AUTUADA")),
        "completude": _vazio_para_none(linha.get("COMPLETUDE")),
        "curso_dagua": _vazio_para_none(linha.get("ING_NM_TRECHO")),
        "capacidade_reservatorio": _dec(linha.get("BAR_NU_CAP_TOTAL_RESERV")),
        "latitude": _dec(linha.get("BAR_NU_LATITUDE")),
        "longitude": _dec(linha.get("BAR_NU_LONGITUDE")),
        "data_cadastro": _epoch_ms_para_data(linha.get("BAR_DT_CADASTRO")),
        "municipio_fonte": _vazio_para_none(linha.get("ING_NM_MUNICIPIO")),
        "uf_fonte": _vazio_para_none(linha.get("ING_SG_UFMUNICIPIO")),
    }


# ─────────────────────────────── coleta ────────────────────────────────


def coletar(uf: str, nome_municipio: str) -> list[dict]:
    """Filtra a UF por UM nome de município (usado por `--sondar
    --nome-municipio`). Não resolve `id_municipio` — é só leitura/inspeção."""
    sessao = _sessao()
    todas = _consultar_uf(sessao, uf)
    return [_parse_barragem(linha) for linha in todas if _pertence_ao_municipio(linha, nome_municipio)]


def coletar_e_resolver_uf(client, uf: str) -> tuple[list[dict], list[tuple[str, int]]]:
    """Todas as barragens do SNISB na UF, cada uma com `id_municipio`
    RESOLVIDO contra `ref_municipios_mg` (`etl.common.resolver_municipio_mg`).

    Devolve `(linhas_casadas, sem_match)` — mesmo contrato de
    `etl.apis.feam_barragens.coletar_e_resolver_estado`. As linhas que não
    bateram com confiança NÃO entram em `linhas_casadas`."""
    sessao = _sessao()
    todas = _consultar_uf(sessao, uf)

    casadas: list[dict] = []
    sem_match: dict[str, int] = {}
    for linha in todas:
        nome_fonte = linha.get("ING_NM_MUNICIPIO")
        resolvido = resolver_municipio_mg(client, nome_fonte)
        if resolvido is None:
            chave = nome_fonte or "(sem município)"
            sem_match[chave] = sem_match.get(chave, 0) + 1
            continue
        registro = _parse_barragem(linha)
        registro["id_municipio"] = resolvido["id_ibge"]
        casadas.append(registro)

    return casadas, sorted(sem_match.items(), key=lambda kv: -kv[1])


# ─────────────────────────────── sondar ────────────────────────────────


def sondar(uf: str, nome_municipio: str | None) -> None:
    """Sem tocar em `municipios`/`ref_municipios_mg` nem gravar (funciona
    com o banco fora do ar). Sem `--nome-municipio`, lista os município da
    UF para conferência manual — é o mesmo espírito da armadilha 6."""
    sessao = _sessao()
    todas = _consultar_uf(sessao, uf)
    print(f"{LOG} UF={uf} — {len(todas)} barragem(ns) na UF — SEM GRAVAR, SEM LER O BANCO")

    if not nome_municipio:
        contagem: dict[str, int] = {}
        for linha in todas:
            m = linha.get("ING_NM_MUNICIPIO") or "(sem município)"
            contagem[m] = contagem.get(m, 0) + 1
        print(f"{LOG} sem --nome-municipio: top 15 municípios da UF (confira o seu na lista):")
        for m, n in sorted(contagem.items(), key=lambda kv: -kv[1])[:15]:
            print(f"       {m:<30} {n}")
        return

    linhas = [_parse_barragem(l) for l in todas if _pertence_ao_municipio(l, nome_municipio)]
    print(f"\n{LOG} {nome_municipio}: {len(linhas)} barragem(ns)")
    for b in linhas:
        print(f"       {(b['nome'] or '(sem nome)'):<40} uso={b['uso_principal']!r:<32} "
              f"orgão={b['orgao_fiscalizador']!r} risco={b['categoria_risco']!r}/dano={b['dano_potencial']!r} "
              f"PAE={b['possui_pae']!r}")


# ──────────────────────────────── sync ─────────────────────────────────


def sync(uf: str, *, permitir_reducao: bool) -> None:
    """Sincroniza a UF INTEIRA — a fonte já filtra server-side por UF, então
    não há por-cidade para pedir (mesma razão de `feam_barragens.sync`)."""
    if uf != "MG":
        print(f"{LOG} AVISO: ref_municipios_mg cobre MG (+ grandfather de cidade do "
              f"portal fora de MG) — rodar --uf {uf} tende a resolver poucas ou "
              f"nenhuma barragem. Ver a nota no topo do módulo.")
    client = get_supabase_client()
    print(f"{LOG} UF={uf}: baixando e resolvendo município de cada barragem contra ref_municipios_mg...")
    linhas, sem_match = coletar_e_resolver_uf(client, uf)
    if sem_match:
        total_sem_match = sum(n for _, n in sem_match)
        print(f"{LOG} {total_sem_match} barragem(ns) em {len(sem_match)} nome(s) de município "
              f"SEM MATCH CONFIÁVEL (limiar de similaridade não atingido) — NÃO gravadas:")
        for nome, n in sem_match[:20]:
            print(f"       {nome:<40} {n}")
    _gravar(linhas, permitir_reducao)


def _gravar(linhas: list[dict], permitir_reducao: bool) -> None:
    if not linhas:
        # A maioria dos municípios pequenos legitimamente não tem barragem
        # cadastrada no SNISB — refresh total com lista vazia apagaria TODA
        # a tabela.
        print(f"{LOG} nada coletado/casado — NÃO apago o que já existe.")
        return
    client = get_supabase_client()
    por_municipio: dict[str, list[dict]] = {}
    for linha in linhas:
        por_municipio.setdefault(linha["id_municipio"], []).append(linha)

    gravados = 0
    for id_municipio, linhas_da_cidade in por_municipio.items():
        # `ao_reduzir="skip"`: uma cidade cuja rodada trouxe menos barragens
        # que o banco já tem NÃO pode abortar a sincronização das outras
        # cidades da mesma rodada.
        escreveu = refresh_completo_seguro(
            client,
            "snisb_barragens",
            {"id_municipio": id_municipio},
            linhas_da_cidade,
            permitir_reducao=permitir_reducao,
            ao_reduzir="skip",
            rotulo="etl.apis.snisb_barragens",
        )
        if escreveu:
            gravados += len(linhas_da_cidade)
    print(f"{LOG} snisb_barragens: {gravados} linha(s) gravada(s) em {len(por_municipio)} município(s).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--uf", default=UF_PADRAO, help="sigla de 2 letras (default: MG)")
    parser.add_argument("--permitir-reducao", action="store_true")
    parser.add_argument("--sondar", action="store_true", help="consulta e relata, NÃO grava, NÃO lê o banco")
    parser.add_argument("--nome-municipio", help="só com --sondar: filtra pelo nome (a fonte não tem código IBGE)")
    args = parser.parse_args()

    try:
        uf = args.uf.strip().upper()
        if args.sondar:
            sondar(uf, args.nome_municipio)
        else:
            sync(uf, permitir_reducao=args.permitir_reducao)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
