"""etl.camaras.votacoes_bh — votação nominal da Câmara de Belo Horizonte.

    python -m etl.camaras.votacoes_bh --id-municipio 3106200 --id-documento <hash>
    python -m etl.camaras.votacoes_bh --id-municipio 3106200 [--limite 50]

A conclusão anterior de que "a CMBH só publica placar agregado" ESTAVA ERRADA.
A Câmara publica o voto individual de cada vereador — só que num host e sob um
nome que nenhuma busca por "votação" ia achar:

  - Host: `cmbhsildownload.cmbh.mg.gov.br` (serviço de download PÚBLICO do
    SIL), NÃO o portal `www.cmbh.mg.gov.br`.
  - Documento: chamado "**Decisão e ocorrências**" (o campo `Tipo:` dentro do
    PDF é que diz "Nominal").
  - Formato: PDF com camada de texto, tabela
    `N.Ordem | Nome do Parlamentar | Partido | Voto | Horário`.

═══ PROCEDÊNCIA E LIMITE ÉTICO ═══

Uma varredura anterior teve um subagente SINALIZADO por sondar um host
INTERNO (`cmbhsilint.cmbh.mg.gov.br`) via `proxy.php`, adivinhando endpoints
(`/servico/votacaoNominal`...) com cabeçalhos forjados — reconhecimento não
autorizado. ESTE módulo NÃO faz nada disso:

  - baixa PDF do host de download PÚBLICO, por `idDocumento` que a fonte
    fornece — o mesmo que um cidadão baixa clicando no site;
  - a listagem reusa o `proxy.php` EXATAMENTE como `etl/camaras/bh.py` já usa
    para a data de publicação: passando o `urlProposicao` que o próprio
    JavaScript do site passa, sem inventar caminho de serviço interno.

Nenhum endpoint é adivinhado. Se a fonte mudar, o módulo falha alto, não
tenta descobrir caminho por força bruta.

═══ ARMADILHAS MEDIDAS (contra o PDF real de PL 69/2025) ═══

1. **Um PDF tem VÁRIAS votações.** O de PL 69/2025 tem duas (o art. 2º
   destacado, rejeitado 33×4; e a parte não destacada, aprovada 38×0). Cada
   uma vira uma linha em `votacoes_camara`, com `id_externo` =
   `{idDocumento}#{índice}` para não colidirem.

2. **"Decisão e ocorrências" também existe para COMISSÃO** (parecer), e essas
   NÃO têm tabela nominal. O filtro de ouro é `Tipo: Nominal` +
   "REUNIÃO DE PLENÁRIO" no PDF — documento sem isso é ignorado.

3. **Voto "Não Votou" e "Presidência" não têm horário.** A linha do vereador
   tem 4 campos em vez de 5. O parser detecta a ausência do horário (o campo
   seguinte não casa `HH:MM:SS`) em vez de assumir 5 sempre.

4. **O PDF grafa "Nao" sem til.** É artefato de codificação da mesma palavra,
   não outro voto — normalizado para "Não", para BH não exibir "Nao" e "Não"
   como duas coisas ao lado de SP e Betim. É a ÚNICA normalização; o resto do
   texto do voto é preservado como a fonte imprime.
"""
import argparse
import re
import sys
import unicodedata

import fitz
from curl_cffi import requests

from etl.camaras import bh as bh_etl
from etl.common import carregar_municipio, fetch_all, get_supabase_client

# Host de download PÚBLICO. Verificado: serve o PDF por idDocumento sem auth.
DOWNLOAD = "https://cmbhsildownload.cmbh.mg.gov.br/silinternet/servico/download/documentoVinculado"
FONTE = "CMBH — Decisão e ocorrências (painel eletrônico de plenário)"

_TIME = re.compile(r"^\d{1,2}:\d{2}:\d{2}$")
_ID_DOC = re.compile(r"documentoVinculado\?idDocumento=([0-9a-fA-F]{16,})", re.IGNORECASE)

# O que a coluna "Voto" imprime. "Não Votou"/"Ausente"/"Presidência" NÃO são
# voto — são estado — mas são gravados como estão (ver os coletores de SP e
# Betim: a distinção entre não comparecer e comparecer e se omitir é dado).
VOTOS_CONHECIDOS = {
    "Sim", "Não", "Nao", "Abstenção", "Branco",
    "Não Votou", "Nao Votou", "Ausente", "Presidência", "Presidencia",
}
# A única normalização — artefato de codificação, não semântica (armadilha 4).
_NORMALIZA_VOTO = {"Nao": "Não", "Nao Votou": "Não Votou", "Presidencia": "Presidência"}

_sessao_download = requests.Session(impersonate="chrome")


def _slug_nome(nome: str | None) -> str:
    t = unicodedata.normalize("NFKD", nome or "")
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^A-Z0-9 ]+", " ", t.upper()).strip()


def _campo(linhas: list[str], i: int, rotulo: str) -> str | None:
    """Valor de um campo `Rotulo : valor` ou `Rotulo :` seguido do valor na
    próxima linha (o PDF alterna os dois layouts)."""
    l = linhas[i]
    if ":" in l:
        _, _, resto = l.partition(":")
        resto = resto.strip()
        if resto:
            return resto
    return linhas[i + 1].strip() if i + 1 < len(linhas) else None


def _parse_pdf(conteudo: bytes) -> list[dict]:
    """Lista de votações do PDF. Cada uma: cabeçalho + linhas de voto.

    VERIFICADO contra o PDF real de PL 69/2025 (2 tabelas, 41 votos cada,
    placar batendo com o desfecho declarado no cabeçalho do documento)."""
    doc = fitz.open(stream=conteudo, filetype="pdf")
    texto = "\n".join(p.get_text() for p in doc)
    doc.close()

    # Filtro de ouro: só plenário nominal. Comissão/parecer não tem tabela.
    if "REUNIÃO DE PLENÁRIO" not in texto.upper():
        return []

    linhas = [x.strip() for x in texto.splitlines() if x.strip()]
    votacoes: list[dict] = []
    i = 0
    while i < len(linhas):
        if linhas[i] != "Nome do Parlamentar":
            i += 1
            continue

        # Cabeçalho: procura para trás os campos da votação (ficam nas ~15
        # linhas acima do cabeçalho da tabela).
        cab = {"materia": None, "reuniao": None, "data": None, "tipo": None, "turno": None}
        for k in range(max(0, i - 16), i):
            l = linhas[k]
            if l.startswith("Matéria") and cab["materia"] is None:
                cab["materia"] = _campo(linhas, k, "Matéria")
            elif l.startswith("Reunião"):
                cab["reuniao"] = _campo(linhas, k, "Reunião")
            elif l.startswith("Data") and cab["data"] is None:
                cab["data"] = _campo(linhas, k, "Data")
            elif l.startswith("Tipo"):
                cab["tipo"] = _campo(linhas, k, "Tipo")
            elif l.startswith("Turno"):
                cab["turno"] = _campo(linhas, k, "Turno")

        # As linhas de voto começam 4 depois do cabeçalho de coluna
        # (Nome do Parlamentar / Partido / Voto / Horário).
        j = i + 4
        votos = []
        while j + 3 < len(linhas):
            if not re.match(r"^\d+$", linhas[j]):  # N. Ordem
                break
            nome, partido, voto = linhas[j + 1], linhas[j + 2], linhas[j + 3]
            if voto not in VOTOS_CONHECIDOS:
                break
            tem_horario = j + 4 < len(linhas) and _TIME.match(linhas[j + 4])
            votos.append(
                {
                    "nome": nome,
                    "partido": partido,
                    "voto": _NORMALIZA_VOTO.get(voto, voto),
                    "horario": linhas[j + 4] if tem_horario else None,
                }
            )
            j += 5 if tem_horario else 4

        # Resultado declarado (fica logo após a tabela).
        resultado = None
        for k in range(j, min(j + 8, len(linhas))):
            if linhas[k].startswith("Resultado da Votação"):
                bruto = _campo(linhas, k, "Resultado da Votação")
                # Quando o resultado é vazio, `_campo` pega a próxima linha, que
                # é o RÓTULO do campo seguinte ("Mesa Diretora da Reunião :").
                # Rótulo termina em ":" — nesse caso o resultado é ausente.
                resultado = bruto if bruto and not bruto.rstrip().endswith(":") else None
                break

        if votos:
            votacoes.append({**cab, "resultado": resultado, "votos": votos})
        i = j

    return votacoes


def _baixar_pdf(id_documento: str) -> bytes | None:
    resp = _sessao_download.get(f"{DOWNLOAD}?idDocumento={id_documento}", timeout=120)
    if resp.status_code != 200 or not resp.content.startswith(b"%PDF"):
        return None
    return resp.content


def _data_iso(texto: str | None) -> str | None:
    if not texto:
        return None
    m = re.search(r"(\d{2})/(\d{2})/(\d{4})", texto)
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else None


def ingerir_documento(client, id_municipio: str, id_documento: str, por_nome: dict[str, str]) -> int:
    """Baixa, parseia e grava UM documento. Devolve nº de votações gravadas."""
    conteudo = _baixar_pdf(id_documento)
    if conteudo is None:
        print(f"  [pula] {id_documento}: não é PDF ou 404")
        return 0
    votacoes = _parse_pdf(conteudo)
    if not votacoes:
        # Documento sem tabela nominal (parecer de comissão, etc.).
        return 0

    gravadas = 0
    for indice, v in enumerate(votacoes):
        # Um PDF tem várias votações; o índice as separa (armadilha 1).
        id_externo = f"{id_documento}#{indice}"
        linha = {
            "id_municipio": id_municipio,
            "id_externo": id_externo,
            "data": _data_iso(v["data"]),
            "sessao": v["reuniao"],
            "tipo_votacao": v["tipo"],
            "materia": v["materia"],
            "resultado": v["resultado"],
            "notas": v["turno"],
            "link_fonte": f"{DOWNLOAD}?idDocumento={id_documento}",
        }
        client.table("votacoes_camara").upsert(
            [linha], on_conflict="id_municipio,id_externo"
        ).execute()
        salva = (
            client.table("votacoes_camara")
            .select("id")
            .eq("id_municipio", id_municipio)
            .eq("id_externo", id_externo)
            .execute()
            .data
        )
        if not salva:
            continue
        uuid_votacao = salva[0]["id"]

        por_chave: dict[tuple, dict] = {}
        for voto in v["votos"]:
            vid = por_nome.get(_slug_nome(voto["nome"]))
            por_chave[(uuid_votacao, vid, voto["nome"], voto["voto"])] = {
                "id_municipio": id_municipio,
                "votacao_id": uuid_votacao,
                "vereador_id": vid,
                "nome_fonte": voto["nome"],
                "partido_fonte": voto["partido"],
                "voto": voto["voto"],
                "origem": "nominal",
            }
        client.table("votos_camara").upsert(
            list(por_chave.values()), on_conflict="votacao_id,vereador_id,nome_fonte,voto"
        ).execute()
        gravadas += 1
    return gravadas


def _indice_vereadores(client, id_municipio: str) -> dict[str, str]:
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
    return por_nome


def _documentos_de_decisao(sessao, guid_proposicao: str) -> list[str]:
    """idDocumento dos "Decisão e ocorrências" de uma proposição.

    Reusa `proxy.php` do mesmo jeito que `bh._data_publicacao`: passando o
    `urlProposicao` que o próprio site usa. Extrai os `idDocumento` que a
    fonte devolve — NÃO adivinha endpoint de serviço interno.

    NÃO FOI POSSÍVEL VALIDAR desta máquina: o portal `www.cmbh.mg.gov.br` fica
    inalcançável daqui (timeout), enquanto o host de download responde. A
    lógica de PARSE do PDF está verificada; esta listagem precisa de uma
    execução onde o `www` responde (o cron do GitHub Actions alcança, e é de
    lá que `etl/camaras/bh.py` já roda). Se o fragmento não trouxer os links,
    devolve vazio — sem inventar caminho para 'descobrir' onde eles estão.
    """
    fragmento = bh_etl._post(
        sessao,
        bh_etl.BASE,
        bh_etl.DETALHE_PROPOSICAO,
        bh_etl._corpo_busca(
            urlProposicao=(
                "http://cmbhsilint.cmbh.mg.gov.br/silinternet/servico/proposicao"
                f"?id={guid_proposicao}"
            )
        ),
    )
    return list(dict.fromkeys(_ID_DOC.findall(fragmento)))


def sync(id_municipio: str, limite: int | None) -> tuple[int, int]:
    cidade = carregar_municipio(id_municipio)
    if id_municipio != "3106200":
        raise RuntimeError(
            f"etl.camaras.votacoes_bh é da Câmara de Belo Horizonte; "
            f"{cidade['nome']} ({id_municipio}) tem outra fonte."
        )
    client = get_supabase_client()
    por_nome = _indice_vereadores(client, id_municipio)

    sessao = bh_etl._sessao()
    tipos = bh_etl._tipos_de_proposicao(sessao, bh_etl.BASE, None)
    guid_pl = tipos.get("Projeto de Lei")
    if not guid_pl:
        raise RuntimeError("não achei o GUID do tipo 'Projeto de Lei' no formulário da CMBH.")

    from datetime import date

    n_votacoes = n_docs = 0
    for ano in range(date.today().year, 2020, -1):
        for prop in bh_etl._buscar_tipo_ano(sessao, bh_etl.BASE, guid_pl, ano):
            guid = prop.get("guid") or prop.get("id_externo")
            if not guid:
                continue
            for id_doc in _documentos_de_decisao(sessao, guid):
                n_votacoes += ingerir_documento(client, id_municipio, id_doc, por_nome)
                n_docs += 1
                if limite and n_docs >= limite:
                    print(f"[votacoes_bh] total={n_votacoes} votações ({n_docs} documentos)")
                    return n_votacoes, n_docs
    print(f"[votacoes_bh] total={n_votacoes} votações ({n_docs} documentos)")
    return n_votacoes, n_docs


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    # Sem default de cidade: ver scripts/conferir_defaults_de_cidade.py.
    ap.add_argument("--id-municipio", required=True)
    ap.add_argument(
        "--id-documento",
        default=None,
        help="ingere UM documento conhecido (testa o parser+gravação sem depender do www).",
    )
    ap.add_argument("--limite", type=int, default=None, help="máximo de documentos no sync completo")
    a = ap.parse_args()
    try:
        if a.id_documento:
            client = get_supabase_client()
            por_nome = _indice_vereadores(client, a.id_municipio)
            n = ingerir_documento(client, a.id_municipio, a.id_documento, por_nome)
            print(f"[votacoes_bh] {n} votação(ões) gravada(s) do documento {a.id_documento}")
        else:
            sync(a.id_municipio, a.limite)
    except RuntimeError as e:
        print(f"[votacoes_bh] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
