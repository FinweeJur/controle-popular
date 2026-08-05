"""etl.camaras.votacoes_betim — votação nominal da Câmara de Betim.

    python -m etl.camaras.votacoes_betim --id-municipio 3106705
    python -m etl.camaras.votacoes_betim --id-municipio 3106705 --limite 20

A Câmara de Betim publica o voto INDIVIDUAL, com horário do registro no
painel eletrônico — mas só em PDF, um por votação, atrás de uma cadeia de
quatro passos. Nenhum deles precisa de navegador; o módulo de proposições
usa Playwright, e aqui não é preciso.

CADEIA (verificada ao vivo em 2026-08-04):

  1. GET /Materia/BuscaAvancada
     Só para pegar o cookie de sessão e o `__RequestVerificationToken` do
     input escondido. Sem esse token o passo 2 devolve página vazia.
  2. GET /Materia/BuscaAvancadaListagem?...&__RequestVerificationToken=...
     HTML parcial com os links `Materia/DadosMateria/{materiaId}`. É o mesmo
     endpoint que o JS da casa chama por AJAX.
  3. GET /Materia/VotacaoMateria?materiaId={id}
     A aba "Votação" da matéria, também HTML parcial. Traz uma linha por
     votação, e é de onde sai o `votacaoId`.
  4. GET /Reports/VotacaoMateria?id={votacaoId}
     O PDF com o voto de cada vereador.

═══ ARMADILHAS MEDIDAS ═══

**O site é ASP.NET atrás de WAF sensível a fingerprint de TLS** — cliente
comum leva bloqueio. `curl_cffi` com `impersonate="chrome"`, como no resto do
projeto.

**O PDF TEM camada de texto** — `fitz` extrai direto, sem OCR. O layout de
três colunas sai como linhas alternadas nome→voto→horário, então o parser lê
em trios. Não vale a pena tentar coordenada: o report engine mantém a ordem.

**"Não votou" e "Ausente" NÃO são voto, e não são a mesma coisa.** O painel
distingue quem estava presente e não registrou (`Não votou`) de quem nem
estava (`Ausente`). Os dois são gravados como estão — jogá-los fora
esconderia a abstenção de fato, e fundi-los apagaria a diferença entre não
comparecer e comparecer e se omitir. É a mesma distinção que o "Quem Foi
Quem" faz ao separar o amarelo (ausência/abstenção) do verde e do vermelho.

**Um PDF por votação: isto é I/O, não CPU.** Betim tem ~929 matérias na
legislatura corrente e nem toda tem votação. `--limite` existe para rodar um
pedaço; sem ele, a coleta é longa e deve ir para segundo plano.
"""
import argparse
import re
import sys
import unicodedata

import fitz
from curl_cffi import requests

from etl.common import carregar_municipio, fetch_all, get_supabase_client

BASE = "https://legislativo.camarabetim.mg.gov.br"
HOST_ESPERADO = "legislativo.camarabetim.mg.gov.br"
FONTE = "Câmara de Betim — Resultado da votação (painel eletrônico)"
# 20 = legislatura 2025-2028; 4 = Projeto de Lei.
LEGISLATURA_ID = 20

# O que o painel imprime na coluna "Voto". As duas últimas NÃO são voto —
# ver a armadilha no topo.
VOTOS_CONHECIDOS = {"Sim", "Não", "Abstenção", "Não votou", "Ausente", "Branco"}

_sessao = requests.Session(impersonate="chrome")
_sessao.headers.update({"Referer": f"{BASE}/Materia/BuscaAvancada"})


def _slug_nome(nome: str | None) -> str:
    t = unicodedata.normalize("NFKD", nome or "")
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^A-Z0-9 ]+", " ", t.upper()).strip()


def _token() -> str:
    """Cookie de sessão + `__RequestVerificationToken`. Ver passo 1."""
    html = _sessao.get(f"{BASE}/Materia/BuscaAvancada", timeout=90).text
    m = re.search(r'name="__RequestVerificationToken"[^>]*value="([^"]+)"', html)
    if not m:
        raise RuntimeError(
            "não achei __RequestVerificationToken em /Materia/BuscaAvancada — "
            "a página mudou; sem ele a busca devolve vazio e a coleta ficaria "
            "em zero sem erro."
        )
    return m.group(1)


def _ids_de_materias(token: str, limite: int | None) -> list[str]:
    """Passo 2: os `materiaId` da legislatura corrente."""
    ids: list[str] = []
    pagina = 1
    while True:
        url = (
            f"{BASE}/Materia/BuscaAvancadaListagem?pagina={pagina}"
            f"&Legislatura={LEGISLATURA_ID}&Numero=&Ano=&TipoMateriaId=4&AssuntoId=-1"
            f"&AutoresId=&SituacaoMateria=-4&FlagTramitando=-1&SituacaoFinalMateria=-4"
            f"&ExibirPareceres=False&PesquisarNoTexto=False&DataRecebimentoInicio="
            f"&DataRecebimentoFim=&Texto=&__RequestVerificationToken={token}"
        )
        html = _sessao.get(
            url, headers={"X-Requested-With": "XMLHttpRequest"}, timeout=120
        ).text
        achados = re.findall(r"Materia/DadosMateria/(\d+)", html)
        novos = [i for i in dict.fromkeys(achados) if i not in ids]
        if not novos:
            break
        ids.extend(novos)
        if limite and len(ids) >= limite:
            return ids[:limite]
        pagina += 1
        if pagina > 200:  # teto de segurança; a casa tem ~929 matérias
            print("[votacoes_betim] AVISO: parei em 200 páginas de busca.")
            break
    return ids


def _votacoes_da_materia(materia_id: str) -> list[dict]:
    """Passo 3: as votações de uma matéria (id, reunião, turno, resultado)."""
    html = _sessao.get(
        f"{BASE}/Materia/VotacaoMateria?materiaId={materia_id}",
        headers={"X-Requested-With": "XMLHttpRequest"},
        timeout=90,
    ).text
    out = []
    for m in re.finditer(r"/Reports/VotacaoMateria\?id=(\d+)", html):
        out.append({"votacao_id": m.group(1), "materia_id": materia_id})
    return list({v["votacao_id"]: v for v in out}.values())


def _parse_pdf(conteudo: bytes) -> dict:
    """Cabeçalho + trios (nome, voto, horário) do PDF do painel."""
    doc = fitz.open(stream=conteudo, filetype="pdf")
    linhas = [l.strip() for l in doc[0].get_text().splitlines() if l.strip()]
    doc.close()

    cab: dict[str, str | None] = {"reuniao": None, "materia": None, "tipo": None, "turno": None}
    for i, l in enumerate(linhas):
        if "REUNIÃO" in l.upper() and cab["reuniao"] is None:
            cab["reuniao"] = l
        elif l == "Matéria:" and i + 1 < len(linhas):
            cab["materia"] = linhas[i + 1]
        elif l == "Tipo:" and i + 1 < len(linhas):
            cab["tipo"] = linhas[i + 1]
        elif l == "Turno:" and i + 1 < len(linhas):
            cab["turno"] = linhas[i + 1]

    # A tabela começa depois do cabeçalho de colunas.
    try:
        inicio = linhas.index("Horário") + 1
    except ValueError:
        return {**cab, "votos": []}

    votos = []
    i = inicio
    while i + 1 < len(linhas):
        nome, voto = linhas[i], linhas[i + 1]
        if voto not in VOTOS_CONHECIDOS:
            # Rodapé ou quebra de layout: para em vez de inventar par.
            break
        horario = linhas[i + 2] if i + 2 < len(linhas) else None
        votos.append({"nome": nome, "voto": voto, "horario": horario})
        i += 3
    return {**cab, "votos": votos}


def _data_da_reuniao(texto: str | None) -> str | None:
    if not texto:
        return None
    m = re.search(r"(\d{2})/(\d{2})/(\d{4})", texto)
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else None


def sync(id_municipio: str, limite: int | None = None) -> tuple[int, int]:
    cidade = carregar_municipio(id_municipio)
    if id_municipio != "3106705":
        raise RuntimeError(
            f"etl.camaras.votacoes_betim é da Câmara de Betim; {cidade['nome']} "
            f"({id_municipio}) tem outra fonte."
        )

    client = get_supabase_client()
    vereadores = fetch_all(
        lambda: client.table("vereadores")
        .select("id, nome, nome_urna")
        .eq("id_municipio", id_municipio)
    )
    por_nome: dict[str, str] = {}
    for v in vereadores:
        for campo in ("nome_urna", "nome"):
            chave = _slug_nome(v.get(campo))
            if chave:
                por_nome.setdefault(chave, v["id"])

    token = _token()
    materias = _ids_de_materias(token, limite)
    print(f"[votacoes_betim] {len(materias)} matérias na legislatura {LEGISLATURA_ID}")

    n_votacoes = n_votos = sem_casar = 0
    for k, materia_id in enumerate(materias, 1):
        try:
            votacoes = _votacoes_da_materia(materia_id)
        except Exception as e:
            print(f"  [erro] matéria {materia_id}: {type(e).__name__}")
            continue
        for v in votacoes:
            url_pdf = f"{BASE}/Reports/VotacaoMateria?id={v['votacao_id']}"
            try:
                resp = _sessao.get(url_pdf, timeout=120)
                if resp.status_code != 200 or not resp.content.startswith(b"%PDF"):
                    continue
                dados = _parse_pdf(resp.content)
            except Exception as e:
                print(f"  [erro] pdf {v['votacao_id']}: {type(e).__name__}")
                continue
            if not dados["votos"]:
                continue

            linha = {
                "id_municipio": id_municipio,
                "id_externo": v["votacao_id"],
                "data": _data_da_reuniao(dados["reuniao"]),
                "sessao": dados["reuniao"],
                "tipo_votacao": dados["tipo"],
                "materia": dados["materia"],
                "resultado": None,
                "notas": dados["turno"],
                "link_fonte": url_pdf,
            }
            client.table("votacoes_camara").upsert(
                [linha], on_conflict="id_municipio,id_externo"
            ).execute()
            salva = (
                client.table("votacoes_camara")
                .select("id")
                .eq("id_municipio", id_municipio)
                .eq("id_externo", v["votacao_id"])
                .execute()
                .data
            )
            if not salva:
                continue
            uuid_votacao = salva[0]["id"]

            por_chave: dict[tuple, dict] = {}
            for voto in dados["votos"]:
                vid = por_nome.get(_slug_nome(voto["nome"]))
                if vid is None:
                    sem_casar += 1
                por_chave[(uuid_votacao, vid, voto["nome"], voto["voto"])] = {
                    "id_municipio": id_municipio,
                    "votacao_id": uuid_votacao,
                    "vereador_id": vid,
                    "nome_fonte": voto["nome"],
                    "partido_fonte": None,
                    "voto": voto["voto"],
                    "origem": "nominal",
                }
            linhas_voto = list(por_chave.values())
            client.table("votos_camara").upsert(
                linhas_voto, on_conflict="votacao_id,vereador_id,nome_fonte,voto"
            ).execute()
            n_votacoes += 1
            n_votos += len(linhas_voto)

        if k % 25 == 0:
            print(f"  {k}/{len(materias)} matérias — {n_votacoes} votações, {n_votos} votos")

    print(f"[votacoes_betim] total={n_votacoes} votações, {n_votos} votos")
    if sem_casar:
        print(
            f"[votacoes_betim] AVISO: {sem_casar} voto(s) sem vereador casado "
            f"(gravados com vereador_id nulo)."
        )
    return n_votacoes, n_votos


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    # Sem default de cidade: ver scripts/conferir_defaults_de_cidade.py.
    ap.add_argument("--id-municipio", required=True)
    ap.add_argument("--limite", type=int, default=None, help="quantas matérias no máximo")
    a = ap.parse_args()
    try:
        sync(a.id_municipio, a.limite)
    except RuntimeError as e:
        print(f"[votacoes_betim] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
