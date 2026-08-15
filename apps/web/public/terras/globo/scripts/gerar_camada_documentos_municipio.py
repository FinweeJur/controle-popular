#!/usr/bin/env python3
r"""gerar_camada_documentos_municipio.py — transforma os documentos do
processo judicial da reparação de Brumadinho QUE JÁ ESTÃO PUBLICADOS em
`/paraopeba/documentos` numa camada do globo: uma feição por município de
MG, com a CONTAGEM de documentos que citam aquele município, quebrada por
tipo de documento e por processo.

Saída: dados/camadas/documentos-processo-municipios.geojson

═══ A REGRA MAIS IMPORTANTE DESTE SCRIPT: CONTA, NUNCA TEOR ═══

O GeoJSON leva `documentos_que_citam`, `documentos_por_tipo` e
`documentos_por_processo` — números. NÃO leva `citacao` (o resumo escrito
pela UFMG), NÃO leva `titulo`, NÃO leva `id` de documento, NÃO leva
`authors` (que nem existe em `documentos.ts`, ver o cabeçalho de lá).

Isso não é economia de bytes, é a regra de risco que
`docs/PLANO-INGESTAO-PARAOPEBA.md` (seção 2.4) já tinha escrito antes de
existir camada nenhuma: juntar um resumo sensível a um PINO NO MAPA aumenta
a capacidade de re-identificação mais do que o mesmo resumo solto numa
lista — a mesma lógica de `docs/FONTES-TERRITORIO-E-MINERACAO.md` (1.3)
sobre não aumentar a precisão de `remanejamento_pto`. A camada mostra
QUANTOS e DE QUE TIPO, e manda para a página que já publica a lista com o
resumo já triado (`/paraopeba/documentos`). Quem quiser o teor lê lá, com
a triagem, o link para o original e a atribuição à UFMG do lado.

═══ A BASE É A JÁ PUBLICADA, E SÓ ELA ═══

A ÚNICA entrada deste script é `apps/web/lib/paraopeba/documentos.ts` — os
471 documentos que já passaram pela régua de `lib/paraopeba/triagem.ts` e
que o portal já serve em `/paraopeba/documentos`. O script NÃO chama o
Solr da UFMG, NÃO amplia a base para os 1.293 com `places` preenchido, NÃO
toca nos 5.814 sem `places` e NÃO reprocessa os tipos catch-all
("documentos comprobatórios", "outros documentos"). Motivo, registrado
para quem for mexer aqui depois: ~90 documentos do acervo bruto (1,3%) são
de tipo explicitamente pessoal e, mesmo sem PDF, o resumo já traz iniciais
e dado de saúde/emprego de vítima
(`docs/PLANO-INTEGRACAO-BRUMADINHO.md`, seção 2.4) — e a trava geral de
dado pessoal para acervo ingerido AINDA NÃO EXISTE. Enquanto ela não
existir, esta camada é derivada só do que já é público. Ampliar a base é
outra tarefa, com outra régua, não um `if` a mais neste arquivo.

Nenhuma contagem daqui é digitada à mão: tudo sai da leitura do array de
`documentos.ts` nesta execução (inclusive os totais de cobertura, lidos de
`COBERTURA_DOCUMENTOS_PROCESSO` no mesmo arquivo, nunca redigitados).

═══ POLÍGONO, NÃO CENTROIDE ═══

A geometria é o polígono municipal de `dados/camadas/municipios-mg.geojson`
(a mesma malha do IBGE que `atos-area-protegida-municipios` e
`cfem-municipios` já usam), casado por `geocodigo` — o código IBGE de 7
dígitos que a própria `documentos.ts` já carrega em cada
`MunicipioCitado`. Nenhum centroide é calculado, nenhum ponto é inventado:
existindo polígono, é o polígono que entra. Se um dia algum geocódigo não
achar par na malha, o script AVISA e registra o município na chave
`municipios_sem_poligono` da saída — nunca some com ele em silêncio.

Cuidado ao ler o mapa: o município inteiro pintado NÃO quer dizer que o
documento fale do município inteiro, nem que o fato tenha ocorrido ali. O
polígono é a unidade de contagem (o município citado), não a extensão de
nada. O `aviso` de cada feição diz isso com todas as letras.

Uso:
    python scripts/gerar_camada_documentos_municipio.py
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

LOG = "[gerar_camada_documentos_municipio]"

DIR_GLOBO = Path(__file__).resolve().parent.parent
DIR_CAMADAS = DIR_GLOBO / "dados" / "camadas"
MUNICIPIOS_PATH = DIR_CAMADAS / "municipios-mg.geojson"
SAIDA_PATH = DIR_CAMADAS / "documentos-processo-municipios.geojson"

# apps/web/public/terras/globo -> parents[2] = apps/web
DOCUMENTOS_TS = DIR_GLOBO.parents[2] / "lib" / "paraopeba" / "documentos.ts"

PAGINA_PUBLICADA = "/paraopeba/documentos"
FONTE_ORIGINAL = "Plataforma Brumadinho UFMG (índice Solr público, campo `places`)"

# Campos que este script tem PERMISSÃO de ler de cada documento. Ler é
# diferente de publicar (`titulo` e `id` entram na conta de "quantos", nunca
# na saída), mas a lista existe para que uma mudança futura em
# `documentos.ts` não escorregue teor novo para dentro do GeoJSON sem
# alguém decidir. `citacao` NÃO está aqui: o resumo não é lido nem para
# contar — só o fato de ele ser `null` (a triagem redigiu) é medido, e isso
# se sabe sem ler o texto.
_CAMPOS_LIDOS = {"processo", "tipo", "municipios", "citacao"}

# Chaves que NUNCA podem aparecer nas propriedades da saída. Conferido de
# verdade no fim do main(), não só prometido no comentário.
_CHAVES_PROIBIDAS = {"citacao", "titulo", "id", "authors", "resumo", "summary_pt", "temas"}


def _ler_documentos_publicados() -> tuple[list[dict], dict]:
    """Lê o array `DOCUMENTOS_PROCESSO` e o objeto
    `COBERTURA_DOCUMENTOS_PROCESSO` de `documentos.ts`.

    O array é JSON puro (chaves entre aspas — o arquivo é GERADO, não
    escrito à mão), então `json.loads` dá conta sem parser de TypeScript.
    Se um dia deixar de ser JSON válido, o script para com erro em vez de
    adivinhar."""
    texto = DOCUMENTOS_TS.read_text(encoding="utf-8")

    marcador = "export const DOCUMENTOS_PROCESSO: DocumentoProcesso[] = ["
    ini = texto.find(marcador)
    if ini < 0:
        raise ValueError(f"não achei {marcador!r} em {DOCUMENTOS_TS}")
    ini += len(marcador) - 1  # inclui o '['
    fim = texto.find("\n];", ini)
    if fim < 0:
        raise ValueError("não achei o fechamento do array DOCUMENTOS_PROCESSO")
    bruto = texto[ini:fim].rstrip()
    # O gerador do arquivo deixa vírgula depois do último item -- TypeScript
    # aceita, JSON não. Tirada aqui, e só ela: nada mais do texto é reescrito.
    if bruto.endswith(","):
        bruto = bruto[:-1]
    documentos = json.loads(bruto + "]")

    # Cobertura: números que o próprio arquivo publica. Lidos, nunca
    # redigitados aqui -- se `documentos.ts` for regerado com outro corte, a
    # camada acompanha sozinha.
    bloco = re.search(
        r"COBERTURA_DOCUMENTOS_PROCESSO: CoberturaDocumentosProcesso = \{(.*?)\};",
        texto, re.S,
    )
    if not bloco:
        raise ValueError("não achei COBERTURA_DOCUMENTOS_PROCESSO em documentos.ts")
    cobertura = {
        m.group(1): float(m.group(2)) if "." in m.group(2) else int(m.group(2))
        for m in re.finditer(r"(\w+):\s*([\d.]+),", bloco.group(1))
    }
    return documentos, cobertura


def _numero_br(n: float) -> str:
    if isinstance(n, float) and not n.is_integer():
        return f"{n:.1f}".replace(".", ",")
    return f"{int(n):,}".replace(",", ".")


def main() -> None:
    if not DOCUMENTOS_TS.exists():
        print(f"{LOG} ERRO: {DOCUMENTOS_TS} não existe.", file=sys.stderr)
        sys.exit(1)

    documentos, cobertura = _ler_documentos_publicados()
    print(f"{LOG} {len(documentos)} documento(s) publicado(s) lidos de "
          f"{DOCUMENTOS_TS.relative_to(DIR_GLOBO.parents[3])}.")

    # Sentinela: a camada existe para a fatia MEDIDA que já está publicada.
    # Se o arquivo de entrada mudar de tamanho, o número que a camada
    # anuncia ("471 de 7.107") deixa de valer -- melhor parar e reler do que
    # publicar um mapa que afirma uma cobertura antiga.
    if len(documentos) != cobertura.get("publicados"):
        print(f"{LOG} ERRO: o array tem {len(documentos)} documento(s), mas "
              f"COBERTURA_DOCUMENTOS_PROCESSO.publicados diz "
              f"{cobertura.get('publicados')} -- releia documentos.ts antes de "
              f"gerar a camada.", file=sys.stderr)
        sys.exit(1)

    campos_novos = {k for d in documentos for k in d} - _CAMPOS_LIDOS - {"id", "titulo", "data", "temas", "link"}
    if campos_novos:
        print(f"{LOG} AVISO: campo(s) novo(s) em documentos.ts não previsto(s) "
              f"aqui: {sorted(campos_novos)} -- confira se algum deles é teor "
              f"antes de deixar entrar na camada.")

    # ─── Agregação por município ───
    #
    # Um documento pode citar VÁRIOS municípios (medido no acervo: é o caso
    # comum -- um mesmo laudo cita a bacia inteira). Por isso a soma das
    # contagens por município é MAIOR que o número de documentos, e a saída
    # diz isso em `aviso` -- somar município a município inventaria documento
    # que não existe, o mesmo erro que a camada de CFEM já registra.
    por_geocodigo: dict[str, dict] = {}
    nome_por_geocodigo: dict[str, str] = {}
    docs_com_municipio = 0
    for doc in documentos:
        municipios = doc.get("municipios") or []
        if not municipios:
            continue
        docs_com_municipio += 1
        for m in municipios:
            geo = m["geocodigo"]
            nome_por_geocodigo.setdefault(geo, m["nome"])
            agg = por_geocodigo.setdefault(geo, {
                "total": 0,
                "tipos": Counter(),
                "processos": Counter(),
                "redigidos": 0,
            })
            agg["total"] += 1
            agg["tipos"][doc["tipo"]] += 1
            agg["processos"][doc["processo"]] += 1
            if doc.get("citacao") is None:
                agg["redigidos"] += 1

    if docs_com_municipio != len(documentos):
        print(f"{LOG} AVISO: {len(documentos) - docs_com_municipio} documento(s) "
              f"sem município -- ficam fora da camada (a lista da página "
              f"continua com eles).")

    print(f"{LOG} {len(por_geocodigo)} município(s) citado(s); "
          f"{sum(a['total'] for a in por_geocodigo.values())} menção(ões) "
          f"documento×município sobre {docs_com_municipio} documento(s).")

    # ─── Geometria: polígono do IBGE, casado por geocódigo ───
    with open(MUNICIPIOS_PATH, encoding="utf-8") as f:
        malha = json.load(f)
    geometria_por_geocodigo = {
        feat["properties"]["geocodigo"]: feat["geometry"] for feat in malha["features"]
    }
    nome_malha_por_geocodigo = {
        feat["properties"]["geocodigo"]: feat["properties"]["nome"] for feat in malha["features"]
    }

    sem_poligono = []
    features = []
    ordenados = sorted(por_geocodigo.items(), key=lambda kv: (-kv[1]["total"], nome_por_geocodigo[kv[0]]))
    total_publicados = int(cobertura["publicados"])
    total_acervo = int(cobertura["totalAcervo"])
    pct = cobertura["percentualPublicado"]
    # Calculado, não digitado: é a fração do acervo com o campo de local
    # preenchido (a maior parte dela sem município reconhecível).
    pct_com_local = f"{cobertura['comLocalPreenchido'] / total_acervo * 100:.1f}".replace(".", ",")

    for geo, agg in ordenados:
        nome = nome_por_geocodigo[geo]
        geom = geometria_por_geocodigo.get(geo)
        if geom is None:
            print(f"{LOG} AVISO: {nome} ({geo}) não tem polígono em "
                  f"municipios-mg.geojson -- registrado em "
                  f"`municipios_sem_poligono`, não silenciado.", file=sys.stderr)
            sem_poligono.append({"nome": nome, "geocodigo": geo, "documentos_que_citam": agg["total"]})
            continue
        nome_malha = nome_malha_por_geocodigo.get(geo)
        if nome_malha and nome_malha != nome:
            print(f"{LOG} AVISO: geocódigo {geo} é {nome!r} em documentos.ts e "
                  f"{nome_malha!r} na malha do IBGE -- vale o nome da malha.")
            nome = nome_malha

        features.append({
            "type": "Feature",
            "properties": {
                "nome": nome,
                "geocodigo": geo,
                "uf": "MG",
                "documentos_que_citam": agg["total"],
                "processos_distintos": len(agg["processos"]),
                "tipos_distintos": len(agg["tipos"]),
                "documentos_por_tipo": dict(agg["tipos"].most_common()),
                "documentos_por_processo": dict(agg["processos"].most_common()),
                "resumos_redigidos_pela_triagem": agg["redigidos"],
                "o_que_esta_contagem_e": (
                    "Documentos do processo judicial da reparação de Brumadinho que CITAM "
                    "este município -- não documentos SOBRE o município, nem fatos ocorridos "
                    "nele. O vínculo é o campo de local que a própria UFMG preenche para "
                    "apoiar busca no acervo."
                ),
                "onde_ler_a_lista": PAGINA_PUBLICADA,
                "por_que_nao_tem_o_resumo_aqui": (
                    "De propósito: a camada publica contagem, nunca teor. Resumo, título e "
                    "id de documento ficam na página, onde a triagem de dado pessoal e a "
                    "atribuição à UFMG aparecem junto. Ver a docstring de "
                    "scripts/gerar_camada_documentos_municipio.py."
                ),
                "fonte": FONTE_ORIGINAL,
                "cobertura_da_camada": (
                    f"{_numero_br(total_publicados)} de {_numero_br(total_acervo)} documentos "
                    f"do acervo ({str(pct).replace('.', ',')}%) têm município identificado"
                ),
                "aviso": (
                    f"VIÉS DE COBERTURA, não geografia do dano: só {_numero_br(total_publicados)} "
                    f"dos {_numero_br(total_acervo)} documentos do acervo "
                    f"({str(pct).replace('.', ',')}%) têm município identificado -- o campo de "
                    f"local é texto livre, preenchido em {pct_com_local}% do acervo, e a maior parte do que "
                    "está lá é nome de barragem, comunidade, rio ou bacia, não município. "
                    "Este mapa mostra onde o ACERVO CITA, não onde o dano FOI: município "
                    "ausente daqui NÃO é município não atingido. "
                    "NÃO SOME as contagens entre municípios: um mesmo documento cita vários "
                    "municípios e é contado inteiro em cada um -- somar inventa documento. "
                    "O polígono é a unidade de contagem (o município citado), não a extensão "
                    "de nenhum fato."
                ),
            },
            "geometry": geom,
        })

    saida = {
        "type": "FeatureCollection",
        "name": "documentos-processo-municipios",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        # Só aparece se houver o que registrar -- as camadas irmãs deste
        # diretório têm exatamente type/name/crs/features, e chave a mais
        # vazia seria ruído. Havendo município sem polígono, ele fica AQUI,
        # visível, em vez de sumir do arquivo.
        **({"municipios_sem_poligono": sem_poligono} if sem_poligono else {}),
        "features": features,
    }

    # Trava final: nenhuma propriedade de teor escapou para a saída.
    for feat in features:
        vazando = _CHAVES_PROIBIDAS & set(feat["properties"])
        if vazando:
            print(f"{LOG} ERRO: propriedade proibida na saída: {sorted(vazando)} "
                  f"-- a camada publica contagem, não teor.", file=sys.stderr)
            sys.exit(1)

    SAIDA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SAIDA_PATH, "w", encoding="utf-8") as fh:
        json.dump(saida, fh, ensure_ascii=False, separators=(",", ": "))

    print(f"\n{LOG} === DISTRIBUIÇÃO (documentos que citam cada município) ===")
    for geo, agg in ordenados:
        print(f"{LOG} {nome_por_geocodigo[geo]:<28} {agg['total']:>4}  "
              f"({len(agg['processos'])} processo(s), {len(agg['tipos'])} tipo(s))")
    print(f"\n{LOG} {len(features)} município(s) na camada -- gravado em "
          f"{SAIDA_PATH} ({SAIDA_PATH.stat().st_size:,} bytes).")
    if sem_poligono:
        print(f"{LOG} {len(sem_poligono)} município(s) sem polígono na malha "
              f"(ficam em `municipios_sem_poligono`, fora do desenho).")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise
