r"""etl.apis.tce_mg — contratos municipais do **TCE-MG**, via os dados abertos
do SICOM (Sistema Informatizado de Contas dos Municípios).

POR QUE ESTE COLETOR EXISTE. Itinga parou de publicar no PNCP em jan/2024 e
por isso aparece com ZERO contrato lá — o que é dado real, não falha. Mas
presta contas ao TCE-MG normalmente: ~130-190 contratos por ano no SICOM,
INCLUSIVE em 2024-2025. O dinheiro não parou; só a divulgação no portal
nacional parou. Este módulo traz esses contratos para a MESMA tabela
`contratos` que o front-end já renderiza, marcados com `fonte='tce_mg_sicom'`
para nunca colidir com o PNCP (ver migration 0045).

═══ A FONTE, MAPEADA AO VIVO (2026-08-07) ═══

O portal `dadosabertos.tce.mg.gov.br` é uma SPA Angular sobre uma API atrás de
um proxy WSO2. O bloqueio que a fez parecer inacessível por meses era só o
formato do cabeçalho — não o captcha:

    Authorization: Bearer 3ab85573-...        (o bearer PÚBLICO, hardcoded no JS)
    AuthorizationProxy: token <JWT-de-sessão>  (a palavra "token", NÃO "Bearer")

O JWT nasce de um captcha (`login/captcha.jsf`) e expira em ~1h, então a via
recorrente é o cache local (ver abaixo) alimentado por um humano, OU um pedido
formal pela Ouvidoria. Fluxo da API, uma vez autenticado:

  buscarDetalhesCategorias?municipio=<nome>&categoria=contrato&origem=SICOM&exercicio=<ano>
      -> {arquivoList: [{seqArquivo, nomeArquivo, tamanhoBytes}]}
  baixarArquivo/<seqArquivo>
      -> {nomeArquivo, bytesConteudo}  # bytesConteudo é BASE64 de um ZIP
  o ZIP se chama SICOM.<ano>.<cod_ibge>.contrato.zip e contém CSVs `;`-delimitados.

═══ AS ARMADILHAS MEDIDAS ═══

1. **O TOKEN É DE SESSÃO E EXPIRA EM ~1h.** Este módulo lê preferencialmente
   do CACHE em disco (`--cache`), populado com o token vivo por um humano. A
   série 2015-2026 das três cidades dos Vales já está em `X:\DevCoder\.tce-cache\`
   (fora do git), com `manifesto.json`. O modo `--api` existe, mas depende de
   um token que dura menos que a coleta de muitas cidades.

2. **O FORNECEDOR NÃO ESTÁ EM `contratos.csv`.** Aquele CSV traz o SIGNATÁRIO
   (um agente público), não quem ganhou. O contratado está em
   `contContrato.csv`, ligado por `seq_contrato`: `num_doc_credor` (CNPJ) e
   `dsc_nome_credor`. Sem o join, todo contrato entraria SEM fornecedor — o
   campo que mais importa numa tela de transparência. Aqui o join é feito e,
   se faltar o contratado de um `seq_contrato`, o log diz quantos.

3. **VALOR É DECIMAL EM REAIS, com `.` de separador decimal** ("403076.6"),
   NÃO centavos e NÃO com separador de milhar. Ler como centavos dividiria
   tudo por 100. A fonte tem outliers reais (um contrato de bilhões numa
   cidade pequena é erro de digitação DELA); gravamos fiel e não "consertamos".

4. **DATA É `YYYYMMDD` colado** ("20241203"), não ISO. `""`, `"0"` e
   `"00000000"` são "sem data" e viram None — passá-los adiante gravaria
   1970 ou estouraria o parse.

5. **`cod_municipio` VEM EM CADA LINHA e no nome do ZIP.** É o guarda de
   identidade (mesmo do caso Betim/SP): se qualquer linha trouxer um código
   diferente do que se pediu, o módulo ABORTA em vez de gravar contrato de uma
   cidade com o id de outra. O código do SICOM é o próprio IBGE, então a
   conferência é direta.

═══ O QUE ESTE MÓDULO ESCREVE ═══

`contratos`, upsert por `(id_municipio, fonte, chave_fonte)` com
`fonte='tce_mg_sicom'` e `chave_fonte=seq_contrato`. NÃO usa refresh total:
contrato é registro histórico imutável — reprocessar atualiza no lugar.

Uso:

    # ler o cache e só RELATAR o que gravaria (não toca no banco):
    python -m etl.apis.tce_mg --id-municipio 3134004 --cache X:/DevCoder/.tce-cache --dry-run
    # idem, todas as cidades do cache:
    python -m etl.apis.tce_mg --cache X:/DevCoder/.tce-cache --dry-run --todas
    # gravar de verdade (quando o banco voltar):
    python -m etl.apis.tce_mg --id-municipio 3134004 --cache X:/DevCoder/.tce-cache
"""
import argparse
import base64
import csv
import datetime as dt
import io
import json
import os
import re
import sys
import zipfile
from decimal import Decimal, InvalidOperation

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    upsert_com_colunas_opcionais,
)
from etl.temas import classificar_contrato

LOG = "[etl.apis.tce_mg]"

# Valor de `contratos.fonte` deste coletor. Chave de MÁQUINA: é por ela que o
# upsert isola as linhas do TCE das do PNCP (migration 0045).
FONTE = "tce_mg_sicom"

# Bearer PÚBLICO, lido do bundle JS do portal. Não é segredo — vai hardcoded
# no JavaScript que qualquer visitante baixa. Sozinho não autentica (ver
# armadilha 1); é a metade fixa do par de cabeçalhos.
BEARER = "3ab85573-29ed-3918-8fcd-9af980367c5b"
API_BASE = "https://arabiasaudita.tce.mg.gov.br:8443/TCEMG-proxy-web/publico/wso2amgw/dados-abertos/"
CATEGORIA = "contrato"


# ─────────────────────────── parsers de campo ────────────────────────


def _num(texto: str | None) -> str | None:
    """"403076.6" -> "403076.6" (validado como Decimal); "", "0" ok.

    Devolve STRING porque a coluna é `numeric` e o cliente psycopg do projeto
    escreve numeric como string (ver armadilha 1 de [[controle_popular_monorepo]]).
    Levanta se vier algo que não é número — melhor barrar do que gravar lixo.
    """
    s = (texto or "").strip()
    if not s:
        return None
    try:
        return str(Decimal(s))
    except InvalidOperation:
        raise RuntimeError(f"valor não numérico onde se esperava número: {texto!r}")


def _data(texto: str | None) -> str | None:
    """"20241203" -> "2024-12-03". "", "0", "00000000" -> None (armadilha 4)."""
    s = (texto or "").strip()
    if not s or set(s) <= {"0"} or len(s) != 8 or not s.isdigit():
        return None
    try:
        return dt.date(int(s[:4]), int(s[4:6]), int(s[6:8])).isoformat()
    except ValueError:
        return None


def _status(vigencia_fim: str | None) -> str:
    if not vigencia_fim:
        return "ativo"
    return "encerrado" if vigencia_fim < dt.date.today().isoformat() else "ativo"


def _limpar_codigo(dsc: str | None) -> str | None:
    """"3 - LOCAÇÃO" -> "LOCAÇÃO". Os campos `dsc_*` do SICOM vêm com o código
    numérico grudado na descrição; a tela quer só o rótulo."""
    s = (dsc or "").strip()
    if not s or s == "-":
        return None
    m = re.match(r"^\s*\d+\s*-\s*(.+)$", s)
    return (m.group(1) if m else s).strip() or None


# ─────────────────────────── leitura do ZIP ──────────────────────────


def _csv(zf: zipfile.ZipFile, sufixo: str) -> list[dict]:
    """Lê a subtabela `<...>.<sufixo>.csv` do ZIP como lista de dicts."""
    nome = next((n for n in zf.namelist() if n.endswith(f".{sufixo}.csv")), None)
    if not nome:
        return []
    texto = zf.read(nome).decode("utf-8", errors="replace")
    return list(csv.DictReader(io.StringIO(texto), delimiter=";"))


def _parse_contratos(zip_bytes: bytes, id_municipio: str, ano: int) -> list[dict]:
    """Um ZIP `SICOM.<ano>.<cod>.contrato.zip` -> linhas da tabela `contratos`.

    Faz o join contratos×contContrato (armadilha 2) e a conferência de
    identidade (armadilha 5). Função PURA — é o que o `--dry-run` testa contra
    o cache sem tocar em banco nenhum.
    """
    zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    contratos = _csv(zf, "contratos")
    contratados = _csv(zf, "contContrato")

    # ARMADILHA 5: identidade. Nenhuma linha pode ser de outra cidade.
    for c in contratos:
        cod = (c.get("cod_municipio") or "").strip()
        if cod and cod != id_municipio:
            raise RuntimeError(
                f"{FONTE}: contrato com cod_municipio={cod!r} num arquivo de "
                f"{id_municipio!r}. Recuso gravar — seria contrato de uma cidade com o "
                "id de outra (mesmo modo de falha do caso Betim/SP)."
            )

    # ARMADILHA 2: o contratado (fornecedor) sai de contContrato, por seq_contrato.
    fornecedor: dict[str, dict] = {}
    for cc in contratados:
        seq = (cc.get("seq_contrato") or "").strip()
        if seq and seq not in fornecedor:
            fornecedor[seq] = cc

    linhas: list[dict] = []
    sem_fornecedor = 0
    for c in contratos:
        seq = (c.get("seq_contrato") or "").strip()
        if not seq:
            continue
        forn = fornecedor.get(seq)
        if not forn:
            sem_fornecedor += 1
        objeto = (c.get("dsc_objetocontrato") or "").strip() or None
        vig_fim = _data(c.get("dat_fimvigencia"))
        # `raw`: guardo as duas linhas de origem. É o que permite reabrir um
        # contrato específico e conferir campo a campo sem re-baixar o ZIP.
        raw = {"contratos": c, "contContrato": forn}
        linhas.append(
            {
                "id_municipio": id_municipio,
                "fonte": FONTE,
                "chave_fonte": seq,
                "numero_contrato": (c.get("num_contrato") or "").strip() or None,
                "ano": int((c.get("num_ano_contrato") or "").strip() or ano),
                "orgao_cnpj": None,  # SICOM identifica órgão por código, não CNPJ.
                "orgao_nome": None,  # nome mora em orgao.zip; enriquecimento futuro.
                "unidade_nome": None,
                "categoria": _limpar_codigo(c.get("dsc_naturezaobjeto")),
                "tipo": _limpar_codigo(c.get("dsc_tipo_processo")),
                "objeto": objeto,
                "fornecedor_cnpj": (forn.get("num_doc_credor") or "").strip() or None if forn else None,
                "fornecedor_nome": (forn.get("dsc_nome_credor") or "").strip() or None if forn else None,
                "valor_inicial": _num(c.get("vlr_contrato")),
                "valor_global": _num(c.get("vlr_contrato")),
                "data_assinatura": _data(c.get("dat_assinatura")),
                "vigencia_inicio": _data(c.get("dat_iniciovigencia")),
                "vigencia_fim": vig_fim,
                "status": _status(vig_fim),
                "link_fonte": "https://dadosabertos.tce.mg.gov.br/",
                "raw": raw,
                "temas": classificar_contrato(None, objeto),
            }
        )
    if sem_fornecedor:
        print(
            f"{LOG} {ano}: {sem_fornecedor} de {len(contratos)} contrato(s) sem contratado "
            "em contContrato — gravados sem fornecedor (a fonte não ligou o seq_contrato)."
        )
    return linhas


# ─────────────────────── de onde vêm os ZIPs ─────────────────────────


def _iter_cache(cache_dir: str, id_municipio: str):
    """Yields (ano, zip_bytes) dos ZIPs de contrato da cidade, do cache local.

    O nome é `SICOM.<ano>.<cod>.contrato.zip`. O `manifesto.json` existe mas
    não é necessário: o nome do arquivo já carrega ano e código.
    """
    padrao = re.compile(rf"^SICOM\.(\d{{4}})\.{re.escape(id_municipio)}\.contrato\.zip$")
    achou = False
    for nome in sorted(os.listdir(cache_dir)):
        m = padrao.match(nome)
        if not m:
            continue
        achou = True
        with open(os.path.join(cache_dir, nome), "rb") as f:
            yield int(m.group(1)), f.read()
    if not achou:
        raise RuntimeError(
            f"{FONTE}: nenhum ZIP de contrato de {id_municipio} em {cache_dir!r}. "
            "Alimente o cache com um token vivo (ver docstring) ou confira o id."
        )


def _iter_api(token: str, id_municipio: str, nome_municipio: str):
    """Yields (ano, zip_bytes) buscando na API ao vivo. Só serve com token
    de sessão fresco (armadilha 1); mantido para o cron via Ouvidoria."""
    import requests  # local: o caminho de cache não precisa de rede.

    headers = {
        "Authorization": f"Bearer {BEARER}",
        "AuthorizationProxy": f"token {token}",
        "Origin": "https://dadosabertos.tce.mg.gov.br",
    }
    for ano in range(2015, dt.date.today().year + 1):
        r = requests.get(
            API_BASE + "dadosAbertos/buscarDetalhesCategorias",
            headers=headers,
            params={"municipio": nome_municipio, "categoria": CATEGORIA,
                    "origem": "SICOM", "exercicio": str(ano)},
            timeout=120, verify=False,
        )
        if not r.ok:
            continue
        for arq in (r.json().get("arquivoList") or []):
            rr = requests.get(API_BASE + f"dadosAbertos/baixarArquivo/{arq['seqArquivo']}",
                              headers=headers, timeout=300, verify=False)
            if rr.ok:
                yield ano, base64.b64decode(rr.json()["bytesConteudo"])


# ─────────────────────────── coleta e carga ──────────────────────────


def coletar(cidade: dict, origem_iter) -> list[dict]:
    id_municipio = cidade["id_municipio"]
    linhas: list[dict] = []
    anos: list[int] = []
    for ano, zip_bytes in origem_iter:
        do_ano = _parse_contratos(zip_bytes, id_municipio, ano)
        anos.append(ano)
        linhas.extend(do_ano)
    if anos:
        print(f"{LOG} {cidade['nome']} ({id_municipio}): {len(linhas)} contrato(s) "
              f"em {len(anos)} ano(s) [{min(anos)}-{max(anos)}].")
    return linhas


def _relatar(cidade: dict, linhas: list[dict]) -> None:
    """--dry-run: prova que o parse funcionou, sem tocar no banco."""
    if not linhas:
        print(f"{LOG} {cidade['nome']}: nada parseado."); return
    com_forn = sum(1 for l in linhas if l["fornecedor_cnpj"] or l["fornecedor_nome"])
    com_valor = sum(1 for l in linhas if l["valor_inicial"] not in (None, "0"))
    total = sum(Decimal(l["valor_inicial"]) for l in linhas if l["valor_inicial"])
    por_ano: dict[int, int] = {}
    for l in linhas:
        por_ano[l["ano"]] = por_ano.get(l["ano"], 0) + 1
    print(f"{LOG}   {len(linhas)} contratos | {com_forn} com fornecedor | "
          f"{com_valor} com valor | soma vlr_contrato R$ {total:,.2f}")
    print(f"{LOG}   por ano: " + ", ".join(f"{a}:{n}" for a, n in sorted(por_ano.items())))
    ex = next((l for l in linhas if l["fornecedor_nome"] and l["objeto"]), linhas[0])
    print(f"{LOG}   exemplo: {ex['ano']} nº{ex['numero_contrato']} "
          f"R$ {Decimal(ex['valor_inicial'] or 0):,.2f} — {ex['fornecedor_nome']} — "
          f"{(ex['objeto'] or '')[:60]}")


def sync(cidade: dict, origem_iter, *, dry_run: bool) -> list[dict]:
    linhas = coletar(cidade, origem_iter)
    if dry_run:
        _relatar(cidade, linhas)
        return linhas
    if not linhas:
        print(f"{LOG} {cidade['nome']}: nada coletado — não escrevo.")
        return linhas
    client = get_supabase_client()
    # Upsert (não refresh total): contrato é histórico imutável e o dedup é por
    # (id_municipio, fonte, chave_fonte) — a chave que a migration 0045 criou.
    # `temas` é coluna opcional (pode não ter migration ainda) — daí o helper.
    upsert_com_colunas_opcionais(
        client, "contratos", linhas, ["temas"],
        on_conflict="id_municipio,fonte,chave_fonte",
    )
    print(f"{LOG} {cidade['nome']}: {len(linhas)} contrato(s) gravado(s) (fonte={FONTE}).")
    return linhas


def _cidades_no_cache(cache_dir: str) -> list[str]:
    ids = set()
    for nome in os.listdir(cache_dir):
        m = re.match(r"^SICOM\.\d{4}\.(\d{7})\.contrato\.zip$", nome)
        if m:
            ids.add(m.group(1))
    return sorted(ids)


def _cidade_offline(cache_dir: str, id_municipio: str) -> dict:
    """Uma `cidade` mínima SEM tocar no banco — para o `--dry-run` funcionar
    com o Neon fora do ar. O nome sai do `manifesto.json` do cache (cosmético);
    o que importa para o parse é o `id_municipio`, que vem do nome do ZIP."""
    nome = id_municipio
    caminho = os.path.join(cache_dir, "manifesto.json")
    if os.path.exists(caminho):
        try:
            man = json.load(open(caminho, encoding="utf-8"))
            nome = next((m["cidade"] for m in man if m.get("id_municipio") == id_municipio), nome)
        except Exception:
            pass
    return {"id_municipio": id_municipio, "nome": nome}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--cache", help="diretório do cache local de ZIPs do TCE")
    parser.add_argument("--api", action="store_true", help="buscar na API ao vivo (exige --token-file)")
    parser.add_argument("--token-file", help="arquivo com o JWT de sessão (modo --api)")
    parser.add_argument("--dry-run", action="store_true", help="parseia e relata, NÃO grava")
    parser.add_argument("--todas", action="store_true", help="com --cache: todas as cidades do cache")
    args = parser.parse_args()

    try:
        if args.api:
            if not args.token_file:
                raise RuntimeError("--api exige --token-file com o JWT de sessão.")
            token = open(args.token_file, encoding="utf-8").read().strip()
            cidade = carregar_municipio(args.id_municipio)
            sync(cidade, _iter_api(token, cidade["id_municipio"], cidade["nome"]), dry_run=args.dry_run)
        else:
            if not args.cache:
                raise RuntimeError("informe --cache <dir> (ou --api --token-file).")
            ids = _cidades_no_cache(args.cache) if args.todas else [args.id_municipio]
            for idm in ids:
                # No --dry-run não tocamos no banco (o Neon pode estar fora, que
                # é justamente quando se testa contra o cache). A carga real
                # carrega a cidade do banco, que valida o id de quebra.
                cidade = _cidade_offline(args.cache, idm) if args.dry_run else carregar_municipio(idm)
                sync(cidade, _iter_cache(args.cache, idm), dry_run=args.dry_run)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
