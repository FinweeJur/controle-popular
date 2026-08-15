r"""etl.apis.inmet_avisos — avisos de risco meteorológico ATIVOS do INMET,
geolocalizados por município.

Primeira fatia de `docs/PLANO-BASES-CLIMA-E-RISCO.md` §4 — o item que dá o
"agora" que nenhuma das outras fontes de clima do plano dá (AdaptaBrasil é
índice de 2015; BATER é Censo 2010; MapBiomas é série anual).

Fonte: `https://apiprevmet3.inmet.gov.br/avisos/ativos`, sem autenticação.
Licença: **domínio público**, confirmada na própria resposta do INMET
(`<copyright>public domain</copyright>` no XML de `/avisos/rss`, com o texto
legal "O conteudo deste site, podera ser reproduzido desde que citada a
fonte"). Citar "INMET — Aviso Meteorológico" é o suficiente.

═══ ESTA RODADA É SÓ LEITURA — NÃO GRAVA ═══

Só existe `--sondar`. A tabela `inmet_avisos` (DDL pronta no plano §4) NÃO
entra nesta rodada por escopo declarado: o AdaptaBrasil é que leva
coletor + tabela + carga aqui. Um `sync()` que gravasse numa tabela
inexistente falharia na cara; um `sync()` vazio mentiria. Fica a leitura,
que já é o que prova o endpoint, o parsing e o cruzamento com MG — e é o
passo que faltava para a persistência ser mecânica na próxima rodada.

Dado VIVO: muda por hora. Quando virar tabela, é job periódico (a cada
hora), nunca ETL único.

═══ ARMADILHAS MEDIDAS AO VIVO (2026-08-15) ═══

1. **`municipios` e `geocodes` são STRING, não lista.** O plano descreve
   `municipios` como "lista com nome + código IBGE embutido" — na resposta
   real é um texto único, separado por vírgula, no formato
   `"Abadia dos Dourados - MG (3100104),Abaeté - MG (3100203),..."` (74.908
   caracteres no maior aviso de hoje). `geocodes` é o mesmo texto só com os
   códigos. Tratar como lista estoura ou, pior, itera caractere a caractere.

2. **`poligono` é uma string com JSON dentro**, não um objeto — precisa de
   um `json.loads` a mais para virar GeoJSON.

3. **`hoje` e `futuro` se sobrepõem.** Hoje: 11 entradas, **9 avisos
   distintos** — 28030 e 28042 aparecem nos dois blocos, com o mesmo
   `id_aviso` e o mesmo `id_sequencia`. Somar os dois blocos conta aviso
   duas vezes; a chave real é `id_aviso` (e `id_sequencia` diz qual é a
   versão mais recente de um aviso alterado).

4. **A data vem com fuso e a hora vem separada, sem fuso.** `data_inicio` é
   `"2026-08-14T00:00:00.000Z"` (meia-noite UTC) e `hora_inicio` é `"10:00"`
   à parte. Colar as duas e chamar de UTC desloca o aviso em 3 h. Este
   módulo mostra a janela como a fonte escreve, sem inventar fuso — resolver
   isso é requisito da migration que ainda não existe, não deste relatório.

5. **O `User-Agent` de navegador NÃO é obrigatório hoje.** O plano registrou
   conexão recusada sem UA; medido em 2026-08-15, o endpoint devolveu
   HTTP 200 (466.361 bytes) sem UA nenhum, com UA de `python-requests` e com
   o UA do projeto. O UA do projeto é mandado do mesmo jeito (educação e
   rastreabilidade), mas quem depurar não deve procurar aqui a causa de uma
   falha de rede.

Uso:

    python -m etl.apis.inmet_avisos --sondar
    python -m etl.apis.inmet_avisos --sondar --uf SP
    python -m etl.apis.inmet_avisos --sondar --detalhar   # riscos e instruções na íntegra
"""
import argparse
import json
import sys

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

LOG = "[etl.apis.inmet_avisos]"

URL_AVISOS = "https://apiprevmet3.inmet.gov.br/avisos/ativos"
TIMEOUT = 90
_UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

# Prefixo do código IBGE por UF — é assim que se separa "os municípios deste
# aviso que ficam em MG" sem depender do nome (que vem grafado com sufixo
# " - UF" e acento, e casá-lo por texto seria reinventar
# `resolver_municipio_mg` para um dado que já traz o código).
PREFIXO_IBGE_UF = {
    "RO": "11", "AC": "12", "AM": "13", "RR": "14", "PA": "15", "AP": "16", "TO": "17",
    "MA": "21", "PI": "22", "CE": "23", "RN": "24", "PB": "25", "PE": "26", "AL": "27",
    "SE": "28", "BA": "29", "MG": "31", "ES": "32", "RJ": "33", "SP": "35", "PR": "41",
    "SC": "42", "RS": "43", "MS": "50", "MT": "51", "GO": "52", "DF": "53",
}
UF_PADRAO = "MG"


@retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=1, min=2, max=30))
def _baixar() -> tuple[dict, int]:
    r = requests.get(URL_AVISOS, headers={"User-Agent": _UA}, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json(), len(r.content)


def _lista_de_csv(txt) -> list[str]:
    """Armadilha 1: `municipios`/`geocodes` chegam como STRING separada por
    vírgula. Aceita lista também, para o dia em que a fonte mudar de forma
    sem avisar."""
    if txt is None:
        return []
    if isinstance(txt, list):
        return [str(x).strip() for x in txt if str(x).strip()]
    return [p.strip() for p in str(txt).split(",") if p.strip()]


def _poligono(bruto):
    """Armadilha 2: `poligono` é string com JSON dentro."""
    if not bruto:
        return None
    if isinstance(bruto, (dict, list)):
        return bruto
    try:
        return json.loads(bruto)
    except (TypeError, ValueError):
        return None


def _janela(aviso: dict) -> str:
    """Armadilha 4: a data traz fuso (Z) e a hora vem separada, sem fuso.
    Mostrado como a fonte escreve — este módulo não inventa timezone."""
    di = (aviso.get("data_inicio") or "")[:10]
    df = (aviso.get("data_fim") or "")[:10]
    return f"{di} {aviso.get('hora_inicio') or '??:??'} → {df} {aviso.get('hora_fim') or '??:??'}"


def coletar() -> tuple[list[dict], dict]:
    """Devolve `(avisos, meta)`.

    `avisos` já vem deduplicado por `id_aviso` (armadilha 3), com os campos
    normalizados e a lista de geocodes separada. `meta` traz o que foi
    medido na chamada (bytes, contagem por bloco) — número medido, não
    estimado.
    """
    corpo, bytes_recebidos = _baixar()
    if not isinstance(corpo, dict):
        raise RuntimeError(f"{LOG} resposta não é objeto {{hoje, futuro}}: {type(corpo).__name__}")

    blocos = {"hoje": corpo.get("hoje") or [], "futuro": corpo.get("futuro") or []}
    por_id: dict[str, dict] = {}
    for nome_bloco, itens in blocos.items():
        for a in itens:
            id_aviso = str(a.get("id_aviso") or a.get("id") or "").strip()
            if not id_aviso:
                continue
            geocodes = _lista_de_csv(a.get("geocodes"))
            registro = por_id.get(id_aviso)
            if registro is None:
                registro = {
                    "id_aviso": id_aviso,
                    "id_sequencia": a.get("id_sequencia"),
                    "tipo": (a.get("descricao") or "").strip(),
                    "severidade": (a.get("severidade") or "").strip(),
                    "cor": a.get("aviso_cor"),
                    "janela": _janela(a),
                    "data_inicio": a.get("data_inicio"),
                    "hora_inicio": a.get("hora_inicio"),
                    "data_fim": a.get("data_fim"),
                    "hora_fim": a.get("hora_fim"),
                    "estados": _lista_de_csv(a.get("estados")),
                    "geocodes": geocodes,
                    "municipios": _lista_de_csv(a.get("municipios")),
                    "riscos": a.get("riscos") or [],
                    "instrucoes": a.get("instrucoes") or [],
                    "poligono": _poligono(a.get("poligono")),
                    "encerrado": bool(a.get("encerrado")),
                    "alterado": bool(a.get("alterado")),
                    "blocos": [nome_bloco],
                }
                por_id[id_aviso] = registro
                continue
            # Mesmo aviso nos dois blocos: fica a sequência mais alta (a
            # versão mais recente de um aviso alterado), e o bloco é somado.
            registro["blocos"].append(nome_bloco)
            if (a.get("id_sequencia") or 0) > (registro.get("id_sequencia") or 0):
                registro["id_sequencia"] = a.get("id_sequencia")
                registro["geocodes"] = geocodes
                registro["janela"] = _janela(a)

    meta = {
        "bytes": bytes_recebidos,
        "entradas_hoje": len(blocos["hoje"]),
        "entradas_futuro": len(blocos["futuro"]),
        "avisos_distintos": len(por_id),
    }
    return list(por_id.values()), meta


def _geocodes_da_uf(aviso: dict, uf: str) -> list[str]:
    prefixo = PREFIXO_IBGE_UF[uf]
    return [g for g in aviso["geocodes"] if g.startswith(prefixo)]


def sondar(uf: str, detalhar: bool) -> None:
    avisos, meta = coletar()
    print(
        f"{LOG} {URL_AVISOS} — {meta['bytes']} bytes; "
        f"{meta['entradas_hoje']} entrada(s) em `hoje` + {meta['entradas_futuro']} em `futuro` "
        f"= {meta['avisos_distintos']} aviso(s) distinto(s) por id_aviso."
    )
    na_uf = [a for a in avisos if _geocodes_da_uf(a, uf)]
    print(f"{LOG} {len(na_uf)} de {len(avisos)} aviso(s) cobrem pelo menos um município de {uf}.")
    for a in sorted(avisos, key=lambda x: (not _geocodes_da_uf(x, uf), x["tipo"])):
        do_uf = _geocodes_da_uf(a, uf)
        marca = f"{len(do_uf)} mun. em {uf}" if do_uf else f"NENHUM em {uf}"
        print(
            f"{LOG} aviso {a['id_aviso']} (seq {a['id_sequencia']}, {'+'.join(a['blocos'])}) "
            f"| {a['tipo']} | {a['severidade']} | {a['janela']} "
            f"| {len(a['geocodes'])} municípios no total, {marca}"
        )
        if a["poligono"]:
            tipo_geo = a["poligono"].get("type") if isinstance(a["poligono"], dict) else "?"
            print(f"         polígono: {tipo_geo}")
        if do_uf and detalhar:
            nomes = [m for m in a["municipios"] if f" - {uf} (" in m]
            print(f"         exemplos em {uf}: {', '.join(nomes[:5])}")
            for risco in a["riscos"]:
                print(f"         risco: {risco}")
            for instrucao in a["instrucoes"]:
                print(f"         instrução: {instrucao.strip()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sondar",
        action="store_true",
        help="único modo desta rodada: lê e relata, NÃO grava (a tabela `inmet_avisos` não existe ainda)",
    )
    parser.add_argument("--uf", default=UF_PADRAO, choices=sorted(PREFIXO_IBGE_UF))
    parser.add_argument("--detalhar", action="store_true", help="mostra riscos e instruções do INMET")
    args = parser.parse_args()
    if not args.sondar:
        print(
            f"{LOG} este módulo só tem --sondar nesta rodada (ver o cabeçalho: a tabela "
            "`inmet_avisos` do plano §4 ainda não foi criada).",
            file=sys.stderr,
        )
        sys.exit(2)
    try:
        sondar(args.uf, args.detalhar)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
