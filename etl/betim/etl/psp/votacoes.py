"""etl.psp.votacoes — votação nominal da Câmara Municipal de São Paulo.

    python -m etl.psp.votacoes --id-municipio 3550308
    python -m etl.psp.votacoes --id-municipio 3550308 --desde 2012
    python -m etl.psp.votacoes --id-municipio 3550308 --ano 2025

A CMSP publica um XML por ANO, em dados abertos, no Azure Blob:

    https://splegispdarmazenamento.blob.core.windows.net/containersip/VOTACOES_{ANO}.xml

É a fonte mais fácil deste projeto: um GET por ano cobre o ano inteiro, sem
paginação, sem chave, sem sessão, e FORA do WAF da Câmara (o blob não exige
User-Agent de navegador, ao contrário do WordPress de `saopaulo.sp.leg.br`).
Melhor ainda, traz `IDParlamentar` — a MESMA chave que já está em
`vereadores.id_externo`, então o maior risco de um ETL de votação, que é
casar voto com pessoa, já vem resolvido pela fonte.

═══ QUATRO ARMADILHAS, TODAS MEDIDAS ═══

1. **O arquivo tem BOM.** Passe BYTES ao lxml (`etree.fromstring(r.content)`).
   Decodificar para `str` antes faz o parser reclamar de declaração de
   encoding, e a mensagem não diz "BOM".

2. **`<VotoContrario>` também é voto individual, e é fácil perder.** A
   votação simbólica não abre painel, mas a casa registra quem votou contra
   num filho separado, com o nome dentro de UM atributo
   (`Partido_Vereador="RUTE COSTA - PL"`) e SEM IDParlamentar. São 504
   ocorrências só em 2025. E isso não é resíduo histórico: a votação nominal
   despencou — em 2026 são 10 nominais contra 271 VotoContrario. Um coletor
   que só lesse `<Vereador>` jogaria fora quase toda a dissidência registrada
   dos anos recentes, sem erro nenhum.

3. **O placar declarado NÃO reconcilia com as linhas** em ~25% das votações
   nominais (sobra tipicamente uma linha). `Presentes` também não é a
   contagem de linhas. Por isso os dois são gravados como fatos separados —
   ver o comentário da migration 0041. NUNCA derive um do outro.

4. **`Voto` nem sempre é Sim/Não/Abstenção.** Na eleição da Mesa vota-se EM
   ALGUÉM, e o atributo vira o nome do candidato ("Jose Americo (PT)"). Por
   isso a coluna não tem CHECK: uma lista fechada quebraria a carga inteira
   por causa de uma sessão solene.

O casamento por `IDParlamentar` cobre 171/171 parlamentares distintos da
série 2012-2026. `VotoContrario`, que não tem a chave, casa por NOME
normalizado — e o que não casar fica com `vereador_id` nulo em vez de ser
descartado: o voto continua sendo um fato mesmo quando não sabemos de quem é.
"""
import argparse
import re
import sys
import unicodedata
from datetime import date

import requests
from lxml import etree

from etl.common import carregar_municipio, fetch_all, get_supabase_client

BASE = "https://splegispdarmazenamento.blob.core.windows.net/containersip"
FONTE = "CMSP — Votações em dados abertos (XML anual)"
# A série começa em 2012; antes disso não há arquivo.
PRIMEIRO_ANO = 2012
HOST_ESPERADO = "splegispdarmazenamento.blob.core.windows.net"


def _slug_nome(nome: str | None) -> str:
    """Maiúscula sem acento e sem pontuação, para casar nome de fonte.

    `VotoContrario` traz "RUTE COSTA - PL" e o cadastro traz "Rute Costa".
    Comparar cru não casa nenhum dos dois lados.
    """
    t = unicodedata.normalize("NFKD", nome or "")
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^A-Z0-9 ]+", " ", t.upper()).strip()


def _int(valor: str | None) -> int | None:
    try:
        return int(valor) if valor not in (None, "") else None
    except ValueError:
        return None


def _data(texto: str | None) -> str | None:
    """"17/06/2026" -> "2026-06-17"."""
    if not texto:
        return None
    m = re.match(r"(\d{2})/(\d{2})/(\d{4})", texto.strip())
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else None


def _baixar_ano(ano: int) -> bytes | None:
    url = f"{BASE}/VOTACOES_{ano}.xml"
    if HOST_ESPERADO not in url:
        raise RuntimeError(f"host inesperado em {url}")
    resp = requests.get(url, timeout=180)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    # BYTES, não `.text`: o arquivo tem BOM. Ver armadilha 1.
    return resp.content


def sync(id_municipio: str, desde: int, ate: int) -> tuple[int, int]:
    cidade = carregar_municipio(id_municipio)
    # A fonte é da CMSP; rodá-la para outra cidade gravaria votação de São
    # Paulo com o id de outro município — a mesma falha silenciosa que
    # `conferir_defaults_de_cidade.py` existe para impedir.
    if id_municipio != "3550308":
        raise RuntimeError(
            f"etl.psp.votacoes é da Câmara de São Paulo; {cidade['nome']} "
            f"({id_municipio}) tem outra fonte de votação."
        )

    client = get_supabase_client()

    # Índices de casamento: por id externo (nominal) e por nome (VotoContrario).
    vereadores = fetch_all(
        lambda: client.table("vereadores")
        .select("id, id_externo, nome, nome_urna")
        .eq("id_municipio", id_municipio)
    )
    por_id_externo = {str(v["id_externo"]): v["id"] for v in vereadores if v.get("id_externo")}
    por_nome: dict[str, str] = {}
    for v in vereadores:
        for campo in ("nome_urna", "nome"):
            chave = _slug_nome(v.get(campo))
            if chave:
                por_nome.setdefault(chave, v["id"])

    total_votacoes = 0
    total_votos = 0
    sem_casar_nominal = 0
    sem_casar_contrario = 0

    for ano in range(desde, ate + 1):
        conteudo = _baixar_ano(ano)
        if conteudo is None:
            print(f"[etl.psp.votacoes] {ano}: sem arquivo (404)")
            continue
        raiz = etree.fromstring(conteudo)

        linhas_votacao: list[dict] = []
        # (id_externo, dados do voto) — o uuid da votação só existe depois do
        # upsert, então os votos são resolvidos numa segunda passada.
        pendentes: list[tuple[str, dict]] = []

        for sessao in raiz.iter("Sessao"):
            data_sessao = _data(sessao.get("Data"))
            nome_sessao = sessao.get("Nome")
            for v in sessao.iter("Votacao"):
                id_externo = v.get("VotacaoID")
                if not id_externo:
                    continue
                linhas_votacao.append(
                    {
                        "id_municipio": id_municipio,
                        "id_externo": id_externo,
                        "data": data_sessao,
                        "sessao": nome_sessao,
                        "tipo_votacao": v.get("TipoVotacao"),
                        "materia": v.get("Materia"),
                        "ementa": v.get("Ementa"),
                        "resultado": v.get("Resultado"),
                        "presentes": _int(v.get("Presentes")),
                        "placar_sim": _int(v.get("Sim")),
                        "placar_nao": _int(v.get("Nao")),
                        "placar_abstencao": _int(v.get("Abstencao")),
                        "placar_branco": _int(v.get("Branco")),
                        "notas": v.get("NotasRodape"),
                        "link_fonte": f"{BASE}/VOTACOES_{ano}.xml",
                    }
                )

                for ver in v.iter("Vereador"):
                    voto = ver.get("Voto")
                    if not voto:
                        continue
                    pendentes.append(
                        (
                            id_externo,
                            {
                                "vereador_id": por_id_externo.get(str(ver.get("IDParlamentar"))),
                                "nome_fonte": ver.get("Nome"),
                                "partido_fonte": ver.get("Partido"),
                                "voto": voto,
                                "origem": "nominal",
                            },
                        )
                    )

                # Ver armadilha 2: dissidência em votação simbólica.
                for vc in v.iter("VotoContrario"):
                    bruto = vc.get("Partido_Vereador") or ""
                    nome, _, partido = bruto.rpartition(" - ")
                    nome = (nome or bruto).strip()
                    pendentes.append(
                        (
                            id_externo,
                            {
                                "vereador_id": por_nome.get(_slug_nome(nome)),
                                "nome_fonte": nome or None,
                                "partido_fonte": (partido or "").strip() or None,
                                "voto": "Não",
                                "origem": "voto_contrario",
                            },
                        )
                    )

        if not linhas_votacao:
            print(f"[etl.psp.votacoes] {ano}: nenhuma votação no arquivo")
            continue

        for i in range(0, len(linhas_votacao), 500):
            client.table("votacoes_camara").upsert(
                linhas_votacao[i : i + 500], on_conflict="id_municipio,id_externo"
            ).execute()

        salvas = {
            l["id_externo"]: l["id"]
            for l in fetch_all(
                lambda: client.table("votacoes_camara")
                .select("id, id_externo")
                .eq("id_municipio", id_municipio)
            )
        }

        votos = []
        for id_externo, dados in pendentes:
            uuid_votacao = salvas.get(id_externo)
            if not uuid_votacao:
                continue
            if dados["vereador_id"] is None:
                if dados["origem"] == "nominal":
                    sem_casar_nominal += 1
                else:
                    sem_casar_contrario += 1
            votos.append({"id_municipio": id_municipio, "votacao_id": uuid_votacao, **dados})

        # DEDUPE ANTES DE GRAVAR, pela mesma chave natural do índice.
        #
        # `ON CONFLICT DO UPDATE` do Postgres recusa o lote inteiro com
        # "cannot affect row a second time" se a MESMA chave aparecer duas
        # vezes na mesma instrução — e aqui aparece: o vereador que vota
        # "Não" no painel pode constar também como `<VotoContrario>` da mesma
        # votação, e a fonte repete linha em alguns casos. É a mesma
        # armadilha que `etl/pncp/licitacoes.py` já registra.
        #
        # O último ganha, e isso é seguro porque chave igual significa
        # literalmente a mesma afirmação (mesma votação, mesma pessoa, mesmo
        # voto) — não há informação a escolher entre as duas.
        por_chave: dict[tuple, dict] = {}
        for v in votos:
            por_chave[(v["votacao_id"], v["vereador_id"], v["nome_fonte"], v["voto"])] = v
        votos = list(por_chave.values())

        for i in range(0, len(votos), 1000):
            client.table("votos_camara").upsert(
                votos[i : i + 1000], on_conflict="votacao_id,vereador_id,nome_fonte,voto"
            ).execute()

        nominais = sum(1 for l in linhas_votacao if l["tipo_votacao"] == "Nominal")
        print(
            f"[etl.psp.votacoes] {ano}: {len(linhas_votacao)} votações "
            f"({nominais} nominais), {len(votos)} votos"
        )
        total_votacoes += len(linhas_votacao)
        total_votos += len(votos)

    print(f"[etl.psp.votacoes] total={total_votacoes} votações, {total_votos} votos")
    # Voto sem vereador casado NÃO é descartado, mas TEM de aparecer: se este
    # número cresce, o cadastro de vereadores ficou para trás da votação.
    if sem_casar_nominal or sem_casar_contrario:
        print(
            f"[etl.psp.votacoes] AVISO: {sem_casar_nominal} voto(s) nominais e "
            f"{sem_casar_contrario} voto(s) contrários sem vereador casado "
            f"(gravados com vereador_id nulo)."
        )
    return total_votacoes, total_votos


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    # Sem default de cidade: ver scripts/conferir_defaults_de_cidade.py.
    ap.add_argument("--id-municipio", required=True)
    ap.add_argument("--desde", type=int, default=None, help=f"primeiro ano (padrão: {PRIMEIRO_ANO})")
    ap.add_argument("--ate", type=int, default=None, help="último ano (padrão: ano atual)")
    ap.add_argument("--ano", type=int, default=None, help="atalho para --desde X --ate X")
    a = ap.parse_args()
    if a.ano:
        desde = ate = a.ano
    else:
        desde = a.desde or PRIMEIRO_ANO
        ate = a.ate or date.today().year
    try:
        sync(a.id_municipio, desde, ate)
    except RuntimeError as e:
        print(f"[etl.psp.votacoes] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
