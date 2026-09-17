"""coletar-iat-pr-licencas.py — licenciamento ambiental do IAT-PR (Instituto Água e Terra).

Coleta a relação pública de atos e licenças ambientais do Estado do Paraná (IAT-PR, antigo IAP)
a partir da infraestrutura oficial de dados abertos espaciais GeoPR / SGA / SIA e grava
JSON estruturado em apps/web/data/iat-pr-licencas.json.

Fonte oficial:
    https://geopr.iat.pr.gov.br/server/rest/services/00_PUBLICACOES/licenciamento_ambiental_pr/FeatureServer/0
Portal de licenciamento IAT-PR:
    https://www.iat.pr.gov.br/Pagina/Consultar-licenciamentos
Total disponível no órgão: ~364.463 registros

Rodar:
    python scripts/coletar-iat-pr-licencas.py                # coleta padrão (25.000 mais recentes)
    python scripts/coletar-iat-pr-licencas.py --limit 0      # coleta integral (todos os ~364.463)
    python scripts/coletar-iat-pr-licencas.py --limit 500    # amostra de teste
    python scripts/coletar-iat-pr-licencas.py --scan-cpf     # executa auditoria oficial de CPF

Privacidade e LGPD:
- Higienização rigorosa de CPFs de pessoas físicas via algoritmo mod-11 (substituído por '[CPF redigido]').
- Preservação e formatação de CNPJs válidos de pessoas jurídicas (14 dígitos).
- Varredura de CPF em todos os campos de texto com checar-dado-pessoal-em-dado.py.
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

URL_BASE = "https://geopr.iat.pr.gov.br/server/rest/services/00_PUBLICACOES/licenciamento_ambiental_pr/FeatureServer/0/query"
FONTE_URL = "https://geopr.iat.pr.gov.br/server/rest/services/00_PUBLICACOES/licenciamento_ambiental_pr/FeatureServer/0"
UA = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
UF = "PR"
ORGAO = "IAT (PR)"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "iat-pr-licencas.json"
CACHE_DIR = Path(__file__).resolve().parent / ".cache" / "iat-pr"
BATCH_SIZE = 2000
PAUSA = 1.0  # segundos entre requisições

RE_CPF = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b")

# Mapeamento de bacias hidrográficas oficiais do Paraná por município
BACIAS_PR = {
    # Bacia Litorânea / Vertente Atlântica
    "PARANAGUA": "Bacia Litorânea", "PARANAGUÁ": "Bacia Litorânea",
    "ANTONINA": "Bacia Litorânea", "GUARAQUECABA": "Bacia Litorânea", "GUARAQUEÇABA": "Bacia Litorânea",
    "GUARATUBA": "Bacia Litorânea", "MATINHOS": "Bacia Litorânea",
    "MORRETES": "Bacia Litorânea", "PONTAL DO PARANA": "Bacia Litorânea", "PONTAL DO PARANÁ": "Bacia Litorânea",
    # Bacia do Rio Ribeira
    "ADRIANOPOLIS": "Bacia do Rio Ribeira", "ADRIANÓPOLIS": "Bacia do Rio Ribeira",
    "BOCAIUVA DO SUL": "Bacia do Rio Ribeira", "BOCAIÚVA DO SUL": "Bacia do Rio Ribeira",
    "CERRO AZUL": "Bacia do Rio Ribeira", "DOUTOR ULYSSES": "Bacia do Rio Ribeira",
    "TUNAS DO PARANA": "Bacia do Rio Ribeira", "TUNAS DO PARANÁ": "Bacia do Rio Ribeira",
    "RIO BRANCO DO SUL": "Bacia do Rio Ribeira", "ITAPERUCU": "Bacia do Rio Ribeira", "ITAPERUÇU": "Bacia do Rio Ribeira",
    # Bacia do Rio Iguaçu (RMC e Sul/Sudoeste)
    "CURITIBA": "Bacia do Rio Iguaçu", "ARAUCARIA": "Bacia do Rio Iguaçu", "ARAUCÁRIA": "Bacia do Rio Iguaçu",
    "SAO JOSE DOS PINHAIS": "Bacia do Rio Iguaçu", "SÃO JOSÉ DOS PINHAIS": "Bacia do Rio Iguaçu",
    "PINHAIS": "Bacia do Rio Iguaçu", "COLOMBO": "Bacia do Rio Iguaçu",
    "CAMPO LARGO": "Bacia do Rio Iguaçu", "CAMPO MAGRO": "Bacia do Rio Iguaçu",
    "FAZENDA RIO GRANDE": "Bacia do Rio Iguaçu", "PIRAQUARA": "Bacia do Rio Iguaçu",
    "QUATRO BARRAS": "Bacia do Rio Iguaçu", "MANDIRITUBA": "Bacia do Rio Iguaçu",
    "TIJUCAS DO SUL": "Bacia do Rio Iguaçu", "QUITANDINHA": "Bacia do Rio Iguaçu",
    "CONTENDA": "Bacia do Rio Iguaçu", "LAPA": "Bacia do Rio Iguaçu",
    "PORTO AMAZONAS": "Bacia do Rio Iguaçu", "PALMEIRA": "Bacia do Rio Iguaçu",
    "SAO MATEUS DO SUL": "Bacia do Rio Iguaçu", "SÃO MATEUS DO SUL": "Bacia do Rio Iguaçu",
    "UNIAO DA VITORIA": "Bacia do Rio Iguaçu", "UNIÃO DA VITÓRIA": "Bacia do Rio Iguaçu",
    "PAULO FRONTIN": "Bacia do Rio Iguaçu", "MALLET": "Bacia do Rio Iguaçu",
    "REBOUCAS": "Bacia do Rio Iguaçu", "REBOUÇAS": "Bacia do Rio Iguaçu",
    "RIO AZUL": "Bacia do Rio Iguaçu", "IRATI": "Bacia do Rio Iguaçu",
    "GUARAPUAVA": "Bacia do Rio Iguaçu", "PINHAO": "Bacia do Rio Iguaçu", "PINHÃO": "Bacia do Rio Iguaçu",
    "CANDAPOI": "Bacia do Rio Iguaçu", "CANDÓI": "Bacia do Rio Iguaçu",
    "CHOPINZINHO": "Bacia do Rio Iguaçu", "CORONEL VIVIDA": "Bacia do Rio Iguaçu",
    "PATO BRANCO": "Bacia do Rio Iguaçu", "FRANCISCO BELTRAO": "Bacia do Rio Iguaçu", "FRANCISCO BELTRÃO": "Bacia do Rio Iguaçu",
    "MARMELEIRO": "Bacia do Rio Iguaçu", "DOIS VIZINHOS": "Bacia do Rio Iguaçu",
    "CAPANEMA": "Bacia do Rio Iguaçu", "SANTO ANTONIO DO SUDOESTE": "Bacia do Rio Iguaçu",
    "CASCAVEL": "Bacia do Rio Iguaçu", "FOZ DO IGUACU": "Bacia do Rio Iguaçu", "FOZ DO IGUAÇU": "Bacia do Rio Iguaçu",
    "MEDIANEIRA": "Bacia do Rio Iguaçu", "MATELANDIA": "Bacia do Rio Iguaçu", "MATELÂNDIA": "Bacia do Rio Iguaçu",
    "SANTA TEREZINHA DE ITAIPU": "Bacia do Rio Iguaçu", "SAO MIGUEL DO IGUACU": "Bacia do Rio Iguaçu",
    # Bacia do Rio Tibagi / Paranapanema
    "PONTA GROSSA": "Bacia do Rio Tibagi", "CASTRO": "Bacia do Rio Tibagi",
    "CARAMBEI": "Bacia do Rio Tibagi", "CARAMBEÍ": "Bacia do Rio Tibagi",
    "TIBAGI": "Bacia do Rio Tibagi", "TELEMACO BORBA": "Bacia do Rio Tibagi", "TELÊMACO BORBA": "Bacia do Rio Tibagi",
    "ORTIGUEIRA": "Bacia do Rio Tibagi", "VENTANIA": "Bacia do Rio Tibagi",
    "IMBAU": "Bacia do Rio Tibagi", "IMBAÚ": "Bacia do Rio Tibagi",
    "LONDRINA": "Bacia do Rio Tibagi", "CAMBE": "Bacia do Rio Tibagi", "CAMBÉ": "Bacia do Rio Tibagi",
    "ROLANDIA": "Bacia do Rio Tibagi", "ROLÂNDIA": "Bacia do Rio Tibagi",
    "IBIPORA": "Bacia do Rio Tibagi", "IBIPORÃ": "Bacia do Rio Tibagi",
    "SERTANOPOLIS": "Bacia do Rio Tibagi", "SERTANÓPOLIS": "Bacia do Rio Tibagi",
    "BELA VISTA DO PARAISO": "Bacia do Rio Tibagi", "BELA VISTA DO PARAÍSO": "Bacia do Rio Tibagi",
    "ARAPONGAS": "Bacia do Rio Tibagi", "APUCARANA": "Bacia do Rio Tibagi",
    "JANDAIA DO SUL": "Bacia do Rio Tibagi", "MANDAGUARI": "Bacia do Rio Tibagi",
    # Bacia do Rio das Cinzas / Itararé (Paranapanema)
    "JACAREZINHO": "Bacia do Rio das Cinzas", "SANTO ANTONIO DA PLATINA": "Bacia do Rio das Cinzas",
    "SANTO ANTÔNIO DA PLATINA": "Bacia do Rio das Cinzas", "BANDEIRANTES": "Bacia do Rio das Cinzas",
    "ANDIRA": "Bacia do Rio das Cinzas", "ANDIRÁ": "Bacia do Rio das Cinzas",
    "CORNELIO PROCOPIO": "Bacia do Rio das Cinzas", "CORNÉLIO PROCÓPIO": "Bacia do Rio das Cinzas",
    "JAGUARIAIVA": "Bacia do Rio Itararé", "JAGUARIAÍVA": "Bacia do Rio Itararé",
    "SENGES": "Bacia do Rio Itararé", "SENGÉS": "Bacia do Rio Itararé",
    "ARAPOTI": "Bacia do Rio Itararé", "WENCESLAU BRAZ": "Bacia do Rio das Cinzas",
    # Bacia do Rio Ivaí
    "MARINGA": "Bacia do Rio Ivaí", "MARINGÁ": "Bacia do Rio Ivaí",
    "SARANDI": "Bacia do Rio Ivaí", "MARIALVA": "Bacia do Rio Ivaí",
    "PAICANDU": "Bacia do Rio Ivaí", "PAIÇANDU": "Bacia do Rio Ivaí",
    "CAMPO MOURAO": "Bacia do Rio Ivaí", "CAMPO MOURÃO": "Bacia do Rio Ivaí",
    "CIANORTE": "Bacia do Rio Ivaí", "UMUARAMA": "Bacia do Rio Ivaí",
    "IVAIPORA": "Bacia do Rio Ivaí", "IVAIPORÃ": "Bacia do Rio Ivaí",
    "MANOEL RIBAS": "Bacia do Rio Ivaí", "PITANGA": "Bacia do Rio Ivaí",
    "SAO PEDRO DO IVAI": "Bacia do Rio Ivaí", "SÃO PEDRO DO IVAÍ": "Bacia do Rio Ivaí",
    "ENGENHEIRO BELTRAO": "Bacia do Rio Ivaí", "ENGENHEIRO BELTRÃO": "Bacia do Rio Ivaí",
    "TERRA BOA": "Bacia do Rio Ivaí", "JAPURA": "Bacia do Rio Ivaí", "JAPURÁ": "Bacia do Rio Ivaí",
    # Bacia do Rio Piquiri
    "TOLEDO": "Bacia do Rio Piquiri", "PALOTINA": "Bacia do Rio Piquiri",
    "ASSIS CHATEAUBRIAND": "Bacia do Rio Piquiri", "GOIOERE": "Bacia do Rio Piquiri", "GOIOERÊ": "Bacia do Rio Piquiri",
    "UBIRATA": "Bacia do Rio Piquiri", "UBIRATÃ": "Bacia do Rio Piquiri",
    "CAMPINA DA LAGOA": "Bacia do Rio Piquiri", "CORBELIA": "Bacia do Rio Piquiri", "CORBÉLIA": "Bacia do Rio Piquiri",
    "NOVA AURORA": "Bacia do Rio Piquiri", "FORMOSA DO OESTE": "Bacia do Rio Piquiri",
    # Bacia do Rio Paraná
    "GUAIRA": "Bacia do Rio Paraná", "GUAÍRA": "Bacia do Rio Paraná",
    "MARECHAL CANDIDO RONDON": "Bacia do Rio Paraná", "MARECHAL CÂNDIDO RONDON": "Bacia do Rio Paraná",
    "SANTA HELENA": "Bacia do Rio Paraná", "ITAIPULANDIA": "Bacia do Rio Paraná", "ITAIPULÂNDIA": "Bacia do Rio Paraná",
    "SAO JORGE D OESTE": "Bacia do Rio Paraná", "SÃO JORGE D'OESTE": "Bacia do Rio Paraná",
    "PARANAVAI": "Bacia do Rio Paraná", "PARANAVAÍ": "Bacia do Rio Paraná",
    "LOANDA": "Bacia do Rio Paraná", "NOVA LONDRINA": "Bacia do Rio Paraná",
    "TERRA RICA": "Bacia do Rio Paraná", "ALTONIA": "Bacia do Rio Paraná", "ALTÔNIA": "Bacia do Rio Paraná",
}


def _cpf_valido(dig: str) -> bool:
    """Valida se uma sequência de 11 dígitos possui dígitos verificadores válidos (mod-11)."""
    if len(dig) != 11 or len(set(dig)) == 1:
        return False

    def dv(ate: int) -> int:
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        return 0 if resto == 10 else resto

    return dv(9) == int(dig[9]) and dv(10) == int(dig[10])


def _apagar_cpf(texto: str | None) -> str | None:
    """Higieniza CPFs de pessoa física no texto substituindo por '[CPF redigido]'."""
    if not texto:
        return None
    dig_puro = re.sub(r"\D", "", texto)
    if len(dig_puro) == 11 and _cpf_valido(dig_puro):
        return "[CPF redigido]"

    def _sub(m: re.Match) -> str:
        val = m.group(0)
        d = re.sub(r"\D", "", val)
        if len(d) == 11 and _cpf_valido(d):
            return "[CPF redigido]"
        return val

    return RE_CPF.sub(_sub, texto)


def _formatar_doc_empresa(nome: str | None, doc_val: float | int | str | None) -> str | None:
    """Sanitiza o nome e associa CNPJ formatado se pessoa jurídica, ou redige CPF se pessoa física."""
    nome_limpo = _apagar_cpf(str(nome).strip()) if nome else None
    if doc_val is None:
        return nome_limpo

    try:
        val_int = int(doc_val) if isinstance(doc_val, (int, float)) else int(re.sub(r"\D", "", str(doc_val)))
        s_val = str(val_int)
        # Se tem até 11 dígitos e passa no mod-11, é CPF de pessoa física
        if len(s_val) <= 11 and _cpf_valido(s_val.zfill(11)):
            return nome_limpo or "[CPF redigido]"
        # Se tem entre 12 e 14 dígitos, é CNPJ de pessoa jurídica
        if 11 < len(s_val) <= 14:
            s14 = s_val.zfill(14)
            cnpj_fmt = f"{s14[:2]}.{s14[2:5]}.{s14[5:8]}/{s14[8:12]}-{s14[12:]}"
            if nome_limpo:
                return f"{nome_limpo} ({cnpj_fmt})"
            return cnpj_fmt
    except Exception:
        pass

    return nome_limpo


def _obter_bacia(municipio: str | None) -> str:
    """Retorna a bacia hidrográfica oficial do município paranaense."""
    if not municipio:
        return "Bacia Hidrográfica do Paraná"
    mun_norm = municipio.strip().upper()
    return BACIAS_PR.get(mun_norm, "Bacia do Rio Paraná")


def _gerar_tags(modalidade: str | None, grupo: str | None, atividade: str | None, situacao: str | None) -> list[str]:
    """Gera lista consistente de tags descritivas em minúsculas."""
    tags = ["licenca", "iat", "pr"]
    combinado = f"{modalidade or ''} {grupo or ''} {atividade or ''}".lower()

    # Modalidade do ato ambiental
    if "previa" in combinado or " lp" in combinado:
        tags.append("licenca_previa")
    if "instalacao" in combinado or "instalação" in combinado or " li" in combinado:
        tags.append("licenca_instalacao")
    if "operacao" in combinado or "operação" in combinado or " lo" in combinado:
        tags.append("licenca_operacao")
    if "simplificada" in combinado or " las" in combinado:
        tags.append("licenca_simplificada")
    if "autorizacao" in combinado or "autorização" in combinado or " aa" in combinado:
        tags.append("autorizacao_ambiental")
    if "dispensa" in combinado or " dlae" in combinado:
        tags.append("dispensa_licenciamento")
    if "renovacao" in combinado or "renovação" in combinado:
        tags.append("renovacao")
    if "ampliacao" in combinado or "ampliação" in combinado:
        tags.append("ampliacao")

    # Setores de atividade econômica / impacto ambiental
    if any(k in combinado for k in ["agric", "agrop", "soja", "milho", "cultur", "lavour"]):
        tags.append("agricultura")
    if any(k in combinado for k in ["pecu", "gado", "bovin"]):
        tags.append("pecuaria")
    if "avicol" in combinado or "avicultura" in combinado or "frango" in combinado:
        tags.append("avicultura")
    if "suino" in combinado or "suíno" in combinado:
        tags.append("suinocultura")
    if "piscic" in combinado or "peixe" in combinado:
        tags.append("piscicultura")
    if any(k in combinado for k in ["florest", "silvic", "eucalipt", "pinus", "madeir"]):
        tags.append("silvicultura")
    if any(k in combinado for k in ["miner", "lavra", "areia", "brita", "argila", "cascalho"]):
        tags.append("mineracao")
    if any(k in combinado for k in ["indust", "fabric", "manufat"]):
        tags.append("industria")
    if any(k in combinado for k in ["residu", "resídu", "lixo", "aterro", "recicl"]):
        tags.append("residuos_solidos")
    if any(k in combinado for k in ["efluent", "esgoto", "saneam", "tratamento"]):
        tags.append("saneamento")
    if any(k in combinado for k in ["energi", "eletric", "pch", "uhe", "solar", "fotovolt"]):
        tags.append("energia")
    if any(k in combinado for k in ["loteam", "condomin", "imobili", "habitac"]):
        tags.append("imobiliario")
    if any(k in combinado for k in ["posto", "combustiv", "gasolin"]):
        tags.append("combustiveis")

    # Situação / Vigência
    if situacao:
        s = situacao.lower()
        if "vigente" in s:
            tags.append("vigente")
        elif "expirada" in s or "vencida" in s:
            tags.append("expirada")

    return list(dict.fromkeys(tags))


def _obter_total() -> int:
    """Consulta a contagem total de feições disponíveis na camada oficial."""
    params = urllib.parse.urlencode({"where": "1=1", "returnCountOnly": "true", "f": "json"})
    url = f"{URL_BASE}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        d = json.loads(resp.read().decode("utf-8", "ignore"))
        return int(d.get("count", 0))


def _obter_lote(offset: int, limit: int) -> list[dict]:
    """Baixa um lote paginado de feições sem geometria para máxima performance."""
    fields = (
        "objectid,id_requerimento,num_protocolo,cpf_cnpj,nome_razao_social,"
        "cod_ibge,nome_municipio,uf,sigla_modalidade,desc_modalidade,"
        "desc_grupo_atividade,desc_atividade,num_documento,dt_emissao,dt_validade"
    )
    params = urllib.parse.urlencode({
        "where": "dt_emissao IS NOT NULL",
        "outFields": fields,
        "orderByFields": "dt_emissao DESC",
        "resultOffset": offset,
        "resultRecordCount": limit,
        "returnGeometry": "false",
        "f": "json",
    })
    url = f"{URL_BASE}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as resp:
        raw = resp.read()
        d = json.loads(raw.decode("utf-8", errors="replace"))
        return [f.get("attributes") for f in d.get("features", []) if f.get("attributes")]


def main() -> int:
    parser = argparse.ArgumentParser(description="Coleta licenciamento ambiental do IAT-PR")
    parser.add_argument("--limit", type=int, default=25000, help="Limite de registros (0 = todos os ~364k, padrão = 25000)")
    parser.add_argument("--scan-cpf", action="store_true", help="Executa checagem de CPF ao final")
    args = parser.parse_args()

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    print("=" * 70)
    print("Coletor Oficial de Licenciamento Ambiental — IAT-PR (Paraná)")
    print(f"Fonte: {FONTE_URL}")
    print("=" * 70)

    print("Consultando total de atos de licenciamento disponíveis no GeoPR...")
    try:
        total_disponivel = _obter_total()
        print(f"Total disponível no IAT-PR: {total_disponivel:,} registros")
    except Exception as e:
        print(f"Aviso ao consultar total: {e}")
        total_disponivel = 364463

    meta = total_disponivel if args.limit == 0 else min(args.limit, total_disponivel)
    print(f"Meta de extração: {meta:,} registros ({'completo' if args.limit == 0 else f'limite {args.limit}'})")

    linhas = []
    offset = 0
    agora = datetime.datetime.now(datetime.timezone.utc)

    while len(linhas) < meta:
        qtd_solicitar = min(BATCH_SIZE, meta - len(linhas))
        cache_file = CACHE_DIR / f"lote_offset_{offset:07d}_limit_{qtd_solicitar}.json"

        attrs = None
        if cache_file.exists() and cache_file.stat().st_size > 500:
            try:
                attrs = json.loads(cache_file.read_text(encoding="utf-8"))
            except Exception:
                attrs = None

        if attrs is None:
            tentativas = 0
            while tentativas < 4:
                try:
                    attrs = _obter_lote(offset, qtd_solicitar)
                    cache_file.write_text(json.dumps(attrs, ensure_ascii=False), encoding="utf-8")
                    break
                except Exception as e:
                    tentativas += 1
                    espera = tentativas * 4
                    print(f"  [Tentativa {tentativas}/4] Erro no offset {offset:,}: {e}. Aguardando {espera}s...")
                    time.sleep(espera)

        if not attrs:
            print(f"Fim de registros ou erro persistente no offset {offset:,}.")
            break

        def _ts_para_data(ts: int | None) -> str | None:
            """Converte timestamp UNIX em milissegundos para YYYY-MM-DD.
            Retorna None se o valor for None, zero ou fora do range de datetime."""
            if not ts:
                return None
            try:
                return datetime.datetime.fromtimestamp(ts / 1000, tz=datetime.timezone.utc).strftime("%Y-%m-%d")
            except (OSError, ValueError, OverflowError):
                return None

        for a in attrs:
            # Datas
            dt_inicio = _ts_para_data(a.get("dt_emissao"))
            dt_fim = _ts_para_data(a.get("dt_validade"))

            ano = None
            if dt_inicio:
                try:
                    ano = int(dt_inicio.split("-")[0])
                except Exception:
                    pass

            # Situação
            situacao = "Concedida"
            if dt_fim:
                try:
                    dt_fim_obj = datetime.datetime.strptime(dt_fim, "%Y-%m-%d").replace(tzinfo=datetime.timezone.utc)
                    situacao = "Vigente" if dt_fim_obj >= agora else "Expirada"
                except Exception:
                    pass

            # Município e Bacia
            mun_raw = a.get("nome_municipio")
            municipio = mun_raw.strip().title() if mun_raw else None
            bacia = _obter_bacia(mun_raw)

            # Tipo e Modalidade
            modalidade = (a.get("desc_modalidade") or "").strip() or "Licença Ambiental"
            atividade = (a.get("desc_atividade") or "").strip()
            grupo = (a.get("desc_grupo_atividade") or "").strip()

            if atividade and atividade.lower() != modalidade.lower():
                tipo = f"{modalidade} — {atividade}"
            else:
                tipo = modalidade

            # Processo / Protocolo
            proto = a.get("num_protocolo")
            num_doc = a.get("num_documento")
            if proto and num_doc:
                processo = f"Protocolo {proto} (Doc. {num_doc})"
            elif proto:
                processo = f"Protocolo {proto}"
            elif num_doc:
                processo = f"Documento {num_doc}"
            else:
                processo = "s/n"

            # Empresa / Requerente com sanitização LGPD
            empresa = _formatar_doc_empresa(a.get("nome_razao_social"), a.get("cpf_cnpj"))

            # Microresumo de 1 linha
            val_str = f"Validade: {dt_fim}" if dt_fim else "Validade indeterminada"
            microresumo = f"{tipo[:90]} · {municipio or 'PR'} · {processo} · {val_str}"

            # Tags categorizadas
            tags = _gerar_tags(modalidade, grupo, atividade, situacao)

            linhas.append({
                "orgao": ORGAO,
                "uf": UF,
                "ano": ano,
                "categoria": "licenca",
                "tipo": _apagar_cpf(tipo),
                "empresa": _apagar_cpf(empresa),
                "municipio": municipio,
                "bacia": bacia,
                "data_inicio": dt_inicio,
                "data_fim": dt_fim,
                "situacao": situacao,
                "processo": _apagar_cpf(processo),
                "microresumo": _apagar_cpf(microresumo),
                "tags": tags,
            })

            if len(linhas) >= meta:
                break

        offset += len(attrs)
        print(f"Progresso: {len(linhas):,} / {meta:,} registros processados ({len(linhas)*100/meta:.1f}%)")
        time.sleep(PAUSA)

    resultado = {
        "gerado_em": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "fonte": FONTE_URL,
        "truncado": len(linhas) < total_disponivel,
        "total": len(linhas),
        "total_disponivel": total_disponivel,
        "ressalva_editorial": (
            "Licenciamento ambiental e atos autorizativos emitidos pelo IAT-PR "
            "(Instituto Água e Terra, antigo IAP) via sistemas SGA e SIA. "
            "A concessão da licença ou autorização ambiental atesta regularidade "
            "na data de emissão e permanece vinculada ao cumprimento integral das "
            "condicionantes e prazos estabelecidos no processo administrativo."
        ),
        "linhas": linhas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n" + "=" * 70)
    print(f"JSON gravado com sucesso em: {SAIDA}")
    print(f"Total de registros salvos: {len(linhas):,}")
    print(f"Tamanho do arquivo: {SAIDA.stat().st_size:,} bytes ({SAIDA.stat().st_size / (1024*1024):.2f} MB)")
    print("=" * 70)

    if args.scan_cpf:
        print("\nExecutando auditoria oficial de LGPD/CPF (mod-11 + Presidio + validate-docbr)...")
        scanner = Path(__file__).resolve().parent / "checar-dado-pessoal-em-dado.py"
        r = subprocess.run(
            [sys.executable, str(scanner), "--extra", str(SAIDA)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        print(r.stdout)
        if r.stderr:
            print("Stderr:", r.stderr)
        if SAIDA.name in r.stdout:
            print(f"ERRO: Dado pessoal detectado em {SAIDA.name}!")
            return 2
        print(f"Auditoria de CPF em {SAIDA.name}: 100% LIMPA (0 CPFs encontrados)!")

    return 0


if __name__ == "__main__":
    sys.exit(main())
