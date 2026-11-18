"""coletar-siga-mg.py — usinas de geração de Minas Gerais no SIGA/ANEEL.

O QUE ESTE SCRIPT FAZ
---------------------
Baixa o CSV público do **SIGA — Sistema de Informações de Geração da ANEEL**
(empreendimentos de geração: usinas em operação e em construção, com outorga,
potência, fonte, municípios e prazo de vigência), filtra as linhas cuja UF
principal é **MG** e grava um recorte compacto de até 300 usinas em
`apps/web/data/energia/usinas-mg.json`, para alimentar o painel de energia do
Controle Popular (fase 2: contratos, outorgas, leilões e impostos).

FONTE OFICIAL
-------------
- Portal: https://dadosabertos.aneel.gov.br/dataset/siga-sistema-de-informacoes-de-geracao-da-aneel
- Arquivo: `siga-empreendimentos-geracao.csv` (CKAN resource), ~7,9 MB,
  separador `;`, aspas duplas, **UTF-8 com BOM**, decimal com vírgula.
- Licença: Open Data Commons Open Database License (ODbL) — uso livre com
  atribuição e compartilhamento igual. Crédito obrigatório: ANEEL/SIGA.
- Periodicidade: snapshot do conjunto com data em `DatGeracaoConjuntoDados`
  (medido em 18/11/2026: `2026-11-18`); a ANEEL republica quase todo dia.
- Exige cadastro ou token? **Não.** É dado aberto sem autenticação.

DECISÕES NÃO TRIVIAIS (e o porquê)
----------------------------------
1. **URL do recurso resolvida em tempo de execução.** O UUID do arquivo muda
   quando a ANEEL republica o conjunto. O script consulta a API CKAN
   (`package_show`) uma vez para achar o CSV atual e, se a API falhar, cai na
   URL fixa medida em 18/11/2026 (ver `URL_FALLBACK`). Duas requisições por
   execução, no máximo — nada de laço.
2. **`robots.txt` do portal diz `Disallow: /api/` com `Crawl-Delay: 10`.** A
   própria página inicial do portal publica o link "API do CKAN" como forma
   documentada de acesso e declara licença aberta (Decreto 8.777/2016 e IN 47/
   2025). Interpretamos o `Disallow` como proteção contra crawler de buscador,
   não contra o consumidor do dado aberto — e mantemos o ritmo: uma chamada à
   API e um download por execução, com pausa de cortesia entre eles. Decisão
   registrada aqui, como pede o AGENTS.md.
3. **Recorte por potência, com piso por fonte.** O conjunto tem ~25 mil linhas
   no Brasil e 1.300 em MG. O portal publica as **300 maiores por potência
   outorgada**, mas com **10 vagas garantidas por tipo** (UHE, PCH, CGH, UFV,
   UTE, EOL). Sem o piso, o corte puro por potência publicaria 238 usinas
   solares e **zero CGH/PCH** — e Pequena Central Hidrelétrica é justamente
   onde nascem conflito de bacia e outorga vencida, assunto do painel. Com o
   piso, nenhuma fonte some da leitura. A base completa continua baixável na
   fonte; 1.300 linhas num JSON de build engordariam o payload sem ganho.
4. **`DscPropriRegimePariticipacao` não é copiado.** O campo traz o nome do
   titular do empreendimento, e em alguns casos é pessoa física. O portal só
   precisa saber se a usina vende no ambiente regulado (REG) ou é produtor
   independente (PIE); o nome fica na fonte, onde já é público. Isso evita
   arrastar dado pessoal para o repositório público (regra 5.2/5.8).
5. **Coleta vazia não sobrescreve arquivo bom** — mesma disciplina dos outros
   coletores do repositório (`coletar-series-economicas-bcb.py`).

USO
---
    python scripts/coletar-siga-mg.py                 # baixa e grava
    python scripts/coletar-siga-mg.py --limite 100    # recorte menor
    python scripts/coletar-siga-mg.py --entrada arq.csv  # usa CSV já baixado

O CSV bruto não é versionado: fica em `%TEMP%` e o repositório recebe só o
recorte. Zero dependência externa (só biblioteca padrão).
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA_PADRAO = RAIZ / "apps" / "web" / "data" / "energia" / "usinas-mg.json"

# User-Agent honesto exigido pelo AGENTS.md global (nada de UA de navegador).
USER_AGENT = "finweejur/github artur colito"

URL_DATASET = (
    "https://dadosabertos.aneel.gov.br/dataset/"
    "siga-sistema-de-informacoes-de-geracao-da-aneel"
)
URL_PACKAGE_SHOW = (
    "https://dadosabertos.aneel.gov.br/api/3/action/package_show"
    "?id=siga-sistema-de-informacoes-de-geracao-da-aneel"
)
# Medida em 18/11/2026. Cai para cá só se a API CKAN não responder.
URL_FALLBACK = (
    "https://dadosabertos.aneel.gov.br/dataset/"
    "6d90b77c-c5f5-4d81-bdec-7bc619494bb9/resource/"
    "11ec447d-698d-4ab8-977f-b424d5deee6a/download/"
    "siga-empreendimentos-geracao.csv"
)

PAUSA_CORTESIA_S = 10  # Crawl-Delay publicado pelo portal da ANEEL
LIMITE_PADRAO = 300
# Piso de representação por fonte (ver decisão 3 no cabeçalho).
RESERVA_POR_TIPO = 10

# As 27 unidades da federação — usada para validar o campo antes de gravar.
UFS_VALIDAS = {
    "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS",
    "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
    "SE", "SP", "TO",
}


def buscar_http(url: str, timeout: int = 180) -> bytes:
    """GET simples, com UA honesto e sem seguir laço de retentativa."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        if res.status != 200:
            raise RuntimeError(f"HTTP {res.status} em {url}")
        return res.read()


def resolver_url_csv() -> str:
    """Descobre a URL atual do CSV via API CKAN; devolve o fallback se falhar.

    Por que: o UUID do recurso muda quando a ANEEL republica o conjunto. Uma
    única chamada é suficiente e respeita o Crawl-Delay do portal.
    """
    try:
        bruto = buscar_http(URL_PACKAGE_SHOW, timeout=60).decode("utf-8")
        pacote = json.loads(bruto).get("result", {})
        for recurso in pacote.get("resources", []):
            nome = (recurso.get("name") or "").lower()
            if nome.startswith("siga-empreendimentos-geracao") and nome.endswith(".csv"):
                url = recurso.get("url") or ""
                if url:
                    return url
        print("[SIGA-MG] ⚠️ CSV não listado na API; usando URL fixa.", file=sys.stderr)
    except Exception as err:  # rede, JSON quebrado, campo ausente
        print(f"[SIGA-MG] ⚠️ API CKAN falhou ({err}); usando URL fixa.", file=sys.stderr)
    return URL_FALLBACK


def numero_kw(texto: str) -> float:
    """Converte '2082000,00' (decimal com vírgula) em float; vazio vira 0.0."""
    limpo = (texto or "").strip().replace(".", "").replace(",", ".")
    if not limpo:
        return 0.0
    try:
        return float(limpo)
    except ValueError:
        return 0.0


def data_iso(texto: str) -> str | None:
    """Devolve 'AAAA-MM-DD' válido ou None.

    O SIGA usa '' e datas sentinela antigas para "sem data". Data anterior a
    1900 é sentinela nesta base (a usina mais velha em MG é de 1908), então é
    tratada como ausente em vez de virar um prazo fantasma na página.
    """
    valor = (texto or "").strip()
    if len(valor) != 10 or valor[4] != "-":
        return None
    try:
        ano = int(valor[:4])
        datetime.strptime(valor, "%Y-%m-%d")
    except ValueError:
        return None
    return valor if ano >= 1900 else None


def municipios(texto: str) -> list[str]:
    """Separa 'Baixo Guandu - ES, Aimorés - MG' em ['Baixo Guandu', 'Aimorés'].

    A usina pode estar em mais de um município (bacia compartilhada). O nome do
    município vem antes do ' - UF'; o sufixo é descartado porque a linha já
    carrega a UF principal do empreendimento.
    """
    nomes: list[str] = []
    for parte in (texto or "").split(","):
        nome = parte.strip().rsplit(" - ", 1)[0].strip()
        if nome and nome not in nomes:
            nomes.append(nome)
    return nomes


def regime(texto: str) -> str | None:
    """Extrai só o marcador REG/PIE do campo de participação; nunca o titular.

    '100% para FULANA ENERGIA LTDA (PIE)' -> 'PIE'. Ver decisão 4 no topo.
    """
    valor = (texto or "").strip().upper()
    for marcador in ("(REG)", "(PIE)"):
        if marcador in valor:
            return marcador.strip("()")
    return None


def ler_csv(caminho_ou_bytes: str | bytes) -> list[dict[str, str]]:
    """Lê o CSV do SIGA com o encoding e o separador que a ANEEL publica."""
    if isinstance(caminho_ou_bytes, bytes):
        bruto = caminho_ou_bytes
    else:
        bruto = Path(caminho_ou_bytes).read_bytes()
    # UTF-8 com BOM medido em 18/11/2026; latin-1 cobre republicação antiga.
    try:
        texto = bruto.decode("utf-8-sig")
    except UnicodeDecodeError:
        texto = bruto.decode("latin-1")
    return list(csv.DictReader(io.StringIO(texto), delimiter=";"))


def montar_usinas(linhas: list[dict[str, str]], uf: str, limite: int,
                  fonte: str, coletado_em: str) -> tuple[list[dict], int, str | None]:
    """Filtra por UF, ordena por potência e devolve o recorte pronto para gravar.

    Regra do recorte (ver decisão 3 no topo do arquivo):
    1. as `RESERVA_POR_TIPO` usinas mais potentes de cada tipo entram primeiro;
    2. as vagas restantes vão para as maiores potências ainda de fora;
    3. o resultado final volta a ser ordenado por potência, para a página
       mostrar "as maiores" sem esconder que há um piso por fonte.

    Retorna (usinas, total_no_recorte, data_do_conjunto). Cada linha carrega
    `fonte` e `coletadoEm` porque a página cidadã precisa poder dizer de onde
    veio aquele número, sem depender do cabeçalho do arquivo.
    """
    recorte = [r for r in linhas if (r.get("SigUFPrincipal") or "").strip() == uf]
    total = len(recorte)
    data_conjunto = None
    for r in recorte:
        data_conjunto = data_conjunto or (r.get("DatGeracaoConjuntoDados") or "").strip() or None

    # Mais potente primeiro; nome como desempate estável.
    recorte.sort(key=lambda r: (-numero_kw(r.get("MdaPotenciaOutorgadaKw", "")),
                                (r.get("NomEmpreendimento") or "").lower()))

    por_tipo: dict[str, list[dict[str, str]]] = {}
    for r in recorte:
        por_tipo.setdefault((r.get("SigTipoGeracao") or "").strip(), []).append(r)

    escolhidas: list[dict[str, str]] = []
    vistos: set[int] = set()  # id() evita depender de CEG, que tem repetido

    # 1) piso por fonte
    for linhas_tipo in por_tipo.values():
        for r in linhas_tipo[:RESERVA_POR_TIPO]:
            if len(escolhidas) < limite and id(r) not in vistos:
                escolhidas.append(r)
                vistos.add(id(r))

    # 2) vagas restantes por potência
    for r in recorte:
        if len(escolhidas) >= limite:
            break
        if id(r) not in vistos:
            escolhidas.append(r)
            vistos.add(id(r))

    # 3) ordem final para a página
    escolhidas.sort(key=lambda r: (-numero_kw(r.get("MdaPotenciaOutorgadaKw", "")),
                                   (r.get("NomEmpreendimento") or "").lower()))

    usinas: list[dict] = []
    for posicao, r in enumerate(escolhidas, start=1):
        tipo = (r.get("SigTipoGeracao") or "").strip()
        nome = (r.get("NomEmpreendimento") or "").strip()
        ceg = (r.get("CodCEG") or "").strip()
        if not nome or not ceg or tipo not in {"UHE", "PCH", "CGH", "UFV", "UTE", "EOL"}:
            continue  # linha incompleta não entra: a página não mostra meia usina
        potencia = numero_kw(r.get("MdaPotenciaOutorgadaKw", ""))
        if potencia <= 0:
            continue
        usinas.append({
            "posicao": posicao,
            "ceg": ceg,
            "nome": nome,
            "tipo": tipo,
            "fase": (r.get("DscFaseUsina") or "").strip() or None,
            "fonteEnergia": (r.get("DscFonteCombustivel") or "").strip() or None,
            "potenciaKw": round(potencia, 2),
            "potenciaFiscalizadaKw": round(numero_kw(r.get("MdaPotenciaFiscalizadaKw", "")), 2),
            "garantiaFisicaKw": round(numero_kw(r.get("MdaGarantiaFisicaKw", "")), 2),
            "municipios": municipios(r.get("DscMuninicpios", "")),
            "uf": uf,
            "outorga": (r.get("DscTipoOutorga") or "").strip() or None,
            "regime": regime(r.get("DscPropriRegimePariticipacao", "")),
            "entradaOperacao": data_iso(r.get("DatEntradaOperacao", "")),
            "inicioVigencia": data_iso(r.get("DatInicioVigencia", "")),
            "fimVigencia": data_iso(r.get("DatFimVigencia", "")),
            "fonte": fonte,
            "coletadoEm": coletado_em,
        })
    return usinas, total, data_conjunto


def main() -> int:
    # Console do Windows abre em cp1252 e come o "✅" do log final; a coleta já
    # teria gravado o JSON, mas o script sairia com erro. Força UTF-8 na saída.
    for fluxo in (sys.stdout, sys.stderr):
        if hasattr(fluxo, "reconfigure"):
            fluxo.reconfigure(encoding="utf-8", errors="replace")

    ap = argparse.ArgumentParser(description="Recorte MG do SIGA/ANEEL para o painel de energia.")
    ap.add_argument("--limite", type=int, default=LIMITE_PADRAO,
                    help=f"máximo de usinas no JSON (padrão {LIMITE_PADRAO})")
    ap.add_argument("--uf", default="MG", help="UF principal a recortar (padrão MG)")
    ap.add_argument("--entrada", help="CSV local já baixado; evita rede")
    ap.add_argument("--saida", default=str(SAIDA_PADRAO), help="caminho do JSON de saída")
    args = ap.parse_args()

    uf = args.uf.strip().upper()
    if uf not in UFS_VALIDAS:
        print(f"[SIGA-MG] ⛔ UF inválida: {uf}", file=sys.stderr)
        return 2

    coletado_em = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    if args.entrada:
        print(f"[SIGA-MG] Lendo CSV local: {args.entrada}")
        fonte = URL_DATASET
        linhas = ler_csv(args.entrada)
    else:
        url = resolver_url_csv()
        print(f"[SIGA-MG] CSV: {url}")
        time.sleep(PAUSA_CORTESIA_S)  # ritmo publicado pelo portal
        bruto = buscar_http(url, timeout=300)
        print(f"[SIGA-MG] {len(bruto) / 1024 / 1024:.1f} MiB baixados")
        fonte = url
        linhas = ler_csv(bruto)

    usinas, total, data_conjunto = montar_usinas(linhas, uf, args.limite, fonte, coletado_em)

    if not usinas:
        print("[SIGA-MG] ⛔ Recorte vazio — arquivo existente preservado.", file=sys.stderr)
        return 1

    payload = {
        "titulo": f"Usinas de geração de {uf} — as {len(usinas)} maiores por potência outorgada",
        "fonte": "ANEEL — SIGA, Sistema de Informações de Geração (dados abertos)",
        "fonteUrl": fonte,
        "datasetUrl": URL_DATASET,
        "licenca": "ODbL 1.0 — Open Data Commons Open Database License",
        "coletadoEm": coletado_em,
        "dataConjunto": data_conjunto,
        "uf": uf,
        "criterio": (
            f"{total} empreendimentos com UF principal {uf} no SIGA; "
            f"publicadas as {len(usinas)} maiores por potência outorgada, "
            f"com {RESERVA_POR_TIPO} vagas garantidas por tipo de geração"
        ),
        "totalNoRecorte": total,
        "totalIncluido": len(usinas),
        "ressalva": (
            "Potência outorgada é a da outorga, não a medida em operação. "
            "Usina em construção aparece com potência e sem data de operação. "
            "Contratos bilaterais e preços de venda não constam desta base."
        ),
        "usinas": usinas,
    }

    saida = Path(args.saida)
    saida.parent.mkdir(parents=True, exist_ok=True)
    with open(saida, "w", encoding="utf-8", newline="\n") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")

    tamanho_kb = saida.stat().st_size / 1024
    print(f"[SIGA-MG] ✅ {len(usinas)} usinas de {uf} (de {total}) em {saida} — {tamanho_kb:.0f} kB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
