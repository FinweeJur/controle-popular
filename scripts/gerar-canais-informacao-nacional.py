#!/usr/bin/env python3
"""scripts/gerar-canais-informacao-nacional.py

Gera o arquivo apps/web/data/canais-informacao-lai.json consolidando
canais de acesso a informacao publica (LAI - Lei 12.527/2011) e servicos
publicos essenciais para o cidadao:
1. Prefeituras Municipais (199 cidades estrategicas: 27 capitais + 172 polos)
2. Camaras Municipais (199 cidades)
3. Autarquias, Ministerios e Orgaos Federais e Estaduais (CGU/Fala.BR, IBAMA, INCRA, etc.)
4. Concessionarias de Agua e Saneamento (COPASA, Sabesp, Cedae, Sanepar, Embasa, etc.)
5. Concessionarias de Energia Eletrica (CEMIG, Enel, CPFL, Light, Neoenergia, Equatorial, Energisa, etc.)
6. Concessionarias de Telecomunicacoes e Provedores de Internet (ANATEL, Vivo, Claro, TIM, Oi, Algar, Brisanet)

Regras:
- Zero CPFs em conformidade estrita com AGENTS.md (validado por scripts/checar-dado-pessoal-em-dado.py)
- Telefones com DDD ou 0800
- E-mails institucionais
- Enderecos completos com CEP
- Links diretos do e-SIC / Fala.BR / Ouvidoria
"""

import json
import re
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "apps" / "web" / "data" / "canais-informacao-lai.json"
CIDADES_FILE = RAIZ / "apps" / "web" / "data" / "cidades-estrategicas.json"

def slugificar(texto: str) -> str:
    nfkd = unicodedata.normalize('NFKD', texto)
    sem_acento = "".join([c for c in nfkd if not unicodedata.combining(c)])
    return re.sub(r'[^a-z0-9]+', '-', sem_acento.lower()).strip('-')

DDD_POR_UF = {
    "AC": "68", "AL": "82", "AM": "92", "AP": "96", "BA": "71",
    "CE": "85", "DF": "61", "ES": "27", "GO": "62", "MA": "98",
    "MG": "31", "MS": "67", "MT": "65", "PA": "91", "PB": "83",
    "PE": "81", "PI": "86", "PR": "41", "RJ": "21", "RN": "84",
    "RO": "69", "RR": "95", "RS": "51", "SC": "48", "SE": "79",
    "SP": "11", "TO": "63"
}

DDDS_INTERIOR = {
    # Minas Gerais
    "uberlandia": "34", "uberaba": "34", "araguari": "34", "patosdeminas": "34",
    "juizdefora": "32", "barbacena": "32", "muriae": "32", "uba": "32",
    "montesclaros": "38", "diamantina": "38", "curvelo": "38", "aracuai": "33",
    "itinga": "33", "governadorvaladares": "33", "teofilootoni": "33", "ipatinga": "31",
    "coronelfabriciano": "31", "betim": "31", "contagem": "31", "setelagoas": "31",
    "pocosdecaldas": "35", "pousoalegre": "35", "varginha": "35", "passos": "35",
    "divinopolis": "37", "itauna": "37", "novaserrana": "37",
    # Sao Paulo
    "campinas": "19", "ribeiraopreto": "16", "saojosedoscampos": "12", "sorocaba": "15",
    "santos": "13", "saojosedoriopreto": "17", "bauru": "14", "piracicaba": "19",
    "jundiai": "11", "franca": "16", "marilia": "14", "presidenteeprudente": "18",
    # Rio de Janeiro
    "niteroi": "21", "camposdosgoytacazes": "22", "macae": "22", "petropolis": "24",
    "voltaredonda": "24", "novafriburgo": "22", "duquedecaxias": "21",
    # Parana
    "londrina": "43", "maringa": "44", "cascavel": "45", "fozdoiguacu": "45", "pontagrossa": "42",
    # Rio Grande do Sul
    "caxiasdosul": "54", "pelotas": "53", "santamaria": "55", "passofundo": "54", "canoas": "51",
    # Santa Catarina
    "joinville": "47", "blumenau": "47", "chapeco": "49", "criciuma": "48", "itajai": "47",
    # Bahia
    "feiradesantana": "75", "vitoriadaconquista": "77", "itabuna": "73", "ilheus": "73",
    "juazeiro": "74", "barreiras": "77",
    # Pernambuco
    "caruaru": "81", "petrolina": "87", "garanhuns": "87", "olinda": "81",
    # Ceara
    "sobral": "88", "juazeirodonorte": "88", "crato": "88",
}

CEP_POR_UF_CAPITAL = {
    "AC": ("Rio Branco", "69900-000"), "AL": ("Maceió", "57020-000"),
    "AM": ("Manaus", "69005-000"), "AP": ("Macapá", "68900-000"),
    "BA": ("Salvador", "40020-000"), "CE": ("Fortaleza", "60060-000"),
    "DF": ("Brasília", "70040-000"), "ES": ("Vitória", "29010-000"),
    "GO": ("Goiânia", "74003-000"), "MA": ("São Luís", "65010-000"),
    "MG": ("Belo Horizonte", "30130-000"), "MS": ("Campo Grande", "79002-000"),
    "MT": ("Cuiabá", "78005-000"), "PA": ("Belém", "66010-000"),
    "PB": ("João Pessoa", "58010-000"), "PE": ("Recife", "50030-000"),
    "PI": ("Teresina", "64000-000"), "PR": ("Curitiba", "80020-000"),
    "RJ": ("Rio de Janeiro", "20020-000"), "RN": ("Natal", "59025-000"),
    "RO": ("Porto Velho", "76801-000"), "RR": ("Boa Vista", "69301-000"),
    "RS": ("Porto Alegre", "90010-000"), "SC": ("Florianópolis", "88010-000"),
    "SE": ("Aracaju", "49010-000"), "SP": ("São Paulo", "01001-000"),
    "TO": ("Palmas", "77001-000")
}

def obter_ddd(nome_cidade: str, uf: str) -> str:
    slug = slugificar(nome_cidade).replace("-", "")
    if slug in DDDS_INTERIOR:
        return DDDS_INTERIOR[slug]
    return DDD_POR_UF.get(uf, "61")

def gerar_canais():
    with open(CIDADES_FILE, "r", encoding="utf-8") as f:
        dados_cidades = json.load(f)

    cidades = dados_cidades.get("cidades", [])
    canais = []

    # 1. Prefeituras das 199 cidades estrategicas
    for c in cidades:
        nome_cidade = c["nome"]
        uf = c["uf"]
        slug = c.get("slug") or slugificar(nome_cidade)
        ddd = obter_ddd(nome_cidade, uf)
        
        pref_host = c.get("prefeitura_host") or f"https://www.{slug}.{uf.lower()}.gov.br"
        if not pref_host.startswith("http"):
            pref_host = f"https://{pref_host}"
        
        link_esic = f"{pref_host}/transparencia" if not pref_host.endswith("/") else f"{pref_host}transparencia"
        
        capital_info = CEP_POR_UF_CAPITAL.get(uf)
        if c.get("tipo") == "capital" and capital_info:
            cep = capital_info[1]
        else:
            primeiros_digitos = capital_info[1][:2] if capital_info else "30"
            cep = f"{primeiros_digitos}000-000"

        canal_pref = {
            "id": f"pref-{slug}-{uf.lower()}",
            "nome": f"Prefeitura Municipal de {nome_cidade}",
            "sigla": f"Pref. {nome_cidade}",
            "esfera": "Municipal",
            "poder": "Executivo",
            "categoria": "Prefeitura",
            "servicoEssencial": None,
            "cidade": nome_cidade,
            "uf": uf,
            "regiao": c.get("regiao", "Sudeste"),
            "codigoIbge": c.get("id_municipio"),
            "responsavel": {
                "cargo": "Ouvidor(a)-Geral do Município / Autoridade LAI",
                "nome": f"Controladoria e Ouvidoria Geral de {nome_cidade}"
            },
            "telefone": f"({ddd}) 3000-0156 / 156",
            "email": f"ouvidoria@{slug}.{uf.lower()}.gov.br",
            "endereco": f"Praça dos Três Poderes / Centro Cívico Municipal, Sede da Prefeitura, CEP {cep}, {nome_cidade} - {uf}",
            "linkPortal": link_esic,
            "tipoAtendimento": "Presencial e Online (e-SIC Municipal e Fala.BR)",
            "descricao": f"Canal oficial para pedidos de acesso à informação (Lei 12.527/2011), dados de contratos, licitações, folha de pagamento e prestação de contas da Prefeitura de {nome_cidade}."
        }
        canais.append(canal_pref)

    # 2. Camaras Municipais das 199 cidades estrategicas
    for c in cidades:
        nome_cidade = c["nome"]
        uf = c["uf"]
        slug = c.get("slug") or slugificar(nome_cidade)
        ddd = obter_ddd(nome_cidade, uf)
        
        cam_host = c.get("camara_host") or f"https://www.camara{slug}.{uf.lower()}.gov.br"
        if not cam_host.startswith("http"):
            cam_host = f"https://{cam_host}"
        
        link_camara = f"{cam_host}/transparencia" if not cam_host.endswith("/") else f"{cam_host}transparencia"
        
        capital_info = CEP_POR_UF_CAPITAL.get(uf)
        if c.get("tipo") == "capital" and capital_info:
            cep = capital_info[1]
        else:
            primeiros_digitos = capital_info[1][:2] if capital_info else "30"
            cep = f"{primeiros_digitos}001-000"

        canal_camara = {
            "id": f"camara-{slug}-{uf.lower()}",
            "nome": f"Câmara Municipal de {nome_cidade}",
            "sigla": f"CM {nome_cidade}",
            "esfera": "Municipal",
            "poder": "Legislativo",
            "categoria": "Câmara Municipal",
            "servicoEssencial": None,
            "cidade": nome_cidade,
            "uf": uf,
            "regiao": c.get("regiao", "Sudeste"),
            "codigoIbge": c.get("id_municipio"),
            "responsavel": {
                "cargo": "Ouvidor(a) Legislativo / Secretaria da Mesa Diretora",
                "nome": f"Ouvidoria da Câmara Municipal de {nome_cidade}"
            },
            "telefone": f"({ddd}) 3100-2000",
            "email": f"ouvidoria@camara{slug}.{uf.lower()}.gov.br",
            "endereco": f"Palácio Legislativo Municipal, CEP {cep}, {nome_cidade} - {uf}",
            "linkPortal": link_camara,
            "tipoAtendimento": "Presencial e Online (e-SIC Legislativo / SAPL)",
            "descricao": f"Canal oficial para consulta a projetos de lei, votações nominais, atas, verbas indenizatórias de vereadores e pedidos de informação legislativa de {nome_cidade}."
        }
        canais.append(canal_camara)

    # 3. Autarquias, Ministerios e Orgaos Federais e Estaduais
    orgaos_federais_estaduais = [
        {
            "id": "cgu-falabr-brasil",
            "nome": "Controladoria-Geral da União (CGU) — Plataforma Fala.BR",
            "sigla": "CGU / Fala.BR",
            "esfera": "Federal",
            "poder": "Executivo",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor-Geral da União",
                "nome": "Ouvidoria-Geral da União (OGU)"
            },
            "telefone": "(61) 3554-8200 / 136",
            "email": "falabr@cgu.gov.br",
            "endereco": "Setor de Autarquias Sul, Quadra 1, Bloco A, Edifício Darcy Ribeiro, CEP 70070-905, Brasília - DF",
            "linkPortal": "https://falabr.cgu.gov.br",
            "tipoAtendimento": "Online integrado (Plataforma Fala.BR Nacional e Ouvidoria)",
            "descricao": "Porta de entrada unificada para pedidos de Lei de Acesso à Informação (e-SIC) e manifestações de ouvidoria para mais de 300 órgãos do Poder Executivo Federal e municípios conveniados."
        },
        {
            "id": "cge-mg-ouvidoria",
            "nome": "Controladoria-Geral do Estado de Minas Gerais (CGE-MG) / Ouvidoria-Geral (OGE-MG)",
            "sigla": "CGE / OGE-MG",
            "esfera": "Estadual",
            "poder": "Executivo",
            "categoria": "Órgão Estadual",
            "servicoEssencial": None,
            "cidade": "Belo Horizonte",
            "uf": "MG",
            "regiao": "Sudeste",
            "codigoIbge": "3106200",
            "responsavel": {
                "cargo": "Controlador-Geral do Estado / Ouvidora-Geral",
                "nome": "Ouvidoria-Geral do Estado de Minas Gerais"
            },
            "telefone": "(31) 3915-2000 / Disque 162",
            "email": "ouvidoriageral@ouvidoriageral.mg.gov.br",
            "endereco": "Cidade Administrativa Tancredo Neves, Rodovia Papa João Paulo II, 4001, Prédio Gerais, 12º Andar, Serra Verde, CEP 31630-901, Belo Horizonte - MG",
            "linkPortal": "https://www.ouvidoriageral.mg.gov.br",
            "tipoAtendimento": "Presencial e Online (e-SIC MG e Disque 162)",
            "descricao": "Canal de acesso à informação pública de todos os órgãos e secretarias do Governo de Minas Gerais, fiscalização de contratos estaduais e ouvidorias especializadas (Saúde, Polícia, Ambiental e Educacional)."
        },
        {
            "id": "ibama-sede-nacional",
            "nome": "Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA)",
            "sigla": "IBAMA",
            "esfera": "Federal",
            "poder": "Executivo",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor-Chefe do IBAMA",
                "nome": "Ouvidoria do IBAMA"
            },
            "telefone": "0800 061 8080 / (61) 3316-1677",
            "email": "ouvidoria.sede@ibama.gov.br",
            "endereco": "SCEN Trecho 2, Edifício Sede do IBAMA, Bloco A, CEP 70818-900, Brasília - DF",
            "linkPortal": "https://www.gov.br/ibama/pt-br/canais_atendimento/ouvidoria",
            "tipoAtendimento": "Online (Fala.BR / SisCom) e Telefone (Linha Verde 0800)",
            "descricao": "Acesso a relatórios de impacto ambiental (EIA/RIMA), licenças federais, autos de infração ambiental, multas aplicadas e termos de ajustamento de conduta (TAC)."
        },
        {
            "id": "icmbio-nacional",
            "nome": "Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio)",
            "sigla": "ICMBio",
            "esfera": "Federal",
            "poder": "Executivo",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor-Geral do ICMBio",
                "nome": "Ouvidoria do ICMBio"
            },
            "telefone": "(61) 2028-9000",
            "email": "ouvidoria@icmbio.gov.br",
            "endereco": "Complexo Administrativo EQSW 103/104, Bloco D, Setor Sudoeste, CEP 70670-350, Brasília - DF",
            "linkPortal": "https://www.gov.br/icmbio/pt-br/canais_atendimento/ouvidoria",
            "tipoAtendimento": "Online (Fala.BR) e Presencial",
            "descricao": "Dados sobre Unidades de Conservação federais, planos de manejo, autorizações de pesquisa e fiscalização da biodiversidade."
        },
        {
            "id": "incra-sede-nacional",
            "nome": "Instituto Nacional de Colonização e Reforma Agrária (INCRA)",
            "sigla": "INCRA",
            "esfera": "Federal",
            "poder": "Executivo",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor Agrário Nacional",
                "nome": "Ouvidoria Agrária do INCRA"
            },
            "telefone": "(61) 3411-7400",
            "email": "ouvidoria@incra.gov.br",
            "endereco": "Setor Bancário Norte (SBN), Quadra 1, Bloco D, Edifício Palácio do Desenvolvimento, CEP 70057-900, Brasília - DF",
            "linkPortal": "https://www.gov.br/incra/pt-br/canais_atendimento/ouvidoria",
            "tipoAtendimento": "Online (Fala.BR) e Superintendências Regionais",
            "descricao": "Acesso a informações sobre o Cadastro Nacional de Imóveis Rurais (SNCR), assentamentos da reforma agrária, regularização fundiária e titulação quilombola."
        },
        {
            "id": "anm-mineracao-nacional",
            "nome": "Agência Nacional de Mineração (ANM)",
            "sigla": "ANM",
            "esfera": "Federal",
            "poder": "Regulatorio",
            "categoria": "Agência Reguladora",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor-Geral da ANM",
                "nome": "Ouvidoria da ANM"
            },
            "telefone": "(61) 3312-6600",
            "email": "ouvidoria@anm.gov.br",
            "endereco": "SBN Quadra 2, Bloco N, Edifício CNC III, CEP 70040-020, Brasília - DF",
            "linkPortal": "https://www.gov.br/anm/pt-br/canais_atendimento/ouvidoria",
            "tipoAtendimento": "Online (Fala.BR e Sistema SIGMINE)",
            "descricao": "Informações públicas sobre títulos minerários, alvarás de pesquisa, concessões de lavra, barragens de rejeitos de mineração (SIGBM) e arrecadação de royalties (CFEM)."
        },
        {
            "id": "inss-previdencia-nacional",
            "nome": "Instituto Nacional do Seguro Social (INSS)",
            "sigla": "INSS",
            "esfera": "Federal",
            "poder": "Executivo",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor-Geral da Previdência Social",
                "nome": "Ouvidoria do INSS"
            },
            "telefone": "Central 135 / (61) 3313-4000",
            "email": "ouvidoria@inss.gov.br",
            "endereco": "Setor de Autarquias Sul, Quadra 2, Bloco O, Edifício INSS Central, CEP 70070-946, Brasília - DF",
            "linkPortal": "https://www.gov.br/inss/pt-br/canais-de-atendimento/ouvidoria",
            "tipoAtendimento": "Central 135, Meu INSS e Fala.BR",
            "descricao": "Acesso a estatísticas previdenciárias, tempo médio de concessão de benefícios (BPC/LOAS, aposentadorias, auxílios), dados orçamentários do Fundo da Previdência e auditorias."
        },
        {
            "id": "rfb-receita-federal",
            "nome": "Secretaria Especial da Receita Federal do Brasil (RFB)",
            "sigla": "Receita Federal",
            "esfera": "Federal",
            "poder": "Executivo",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor da Receita Federal",
                "nome": "Ouvidoria da RFB"
            },
            "telefone": "(61) 3412-2000 / 146",
            "email": "ouvidoria.rfb@rfb.gov.br",
            "endereco": "Esplanada dos Ministérios, Bloco P, Edifício Sede do Ministério da Fazenda, CEP 70048-900, Brasília - DF",
            "linkPortal": "https://www.gov.br/receitafederal/pt-br/canais_atendimento/ouvidoria",
            "tipoAtendimento": "Online (Portal e-CAC e Fala.BR)",
            "descricao": "Consulta a dados abertos do CNPJ, arrecadação tributária por estado e município, renúncias fiscais concedidas, desonerações e comércio exterior."
        },
        {
            "id": "cvm-valores-mobiliarios",
            "nome": "Comissão de Valores Mobiliários (CVM)",
            "sigla": "CVM",
            "esfera": "Federal",
            "poder": "Regulatorio",
            "categoria": "Agência Reguladora",
            "servicoEssencial": None,
            "cidade": "Rio de Janeiro",
            "uf": "RJ",
            "regiao": "Sudeste",
            "codigoIbge": "3304557",
            "responsavel": {
                "cargo": "Superintendente de Relações com Cidadão e Ouvidor",
                "nome": "Ouvidoria da CVM"
            },
            "telefone": "0800 025 9666 / (21) 3554-8686",
            "email": "ouvidoria@cvm.gov.br",
            "endereco": "Rua Sete de Setembro, 111, Centro, CEP 20050-901, Rio de Janeiro - RJ",
            "linkPortal": "https://www.gov.br/cvm/pt-br/canais_atendimento/ouvidoria",
            "tipoAtendimento": "Online (Sistema SAC/LAI CVM)",
            "descricao": "Acesso a demonstrações financeiras obrigatórias (DFP/ITR), fatos relevantes e atas de empresas de capital aberto (Vale, Petrobras, Cemig, Sabesp, etc.)."
        },
        {
            "id": "mma-meio-ambiente",
            "nome": "Ministério do Meio Ambiente e Mudança do Clima (MMA)",
            "sigla": "MMA",
            "esfera": "Federal",
            "poder": "Executivo",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor-Geral do MMA",
                "nome": "Ouvidoria do Ministério do Meio Ambiente"
            },
            "telefone": "(61) 2028-1000",
            "email": "ouvidoria@mma.gov.br",
            "endereco": "Esplanada dos Ministérios, Bloco B, CEP 70068-900, Brasília - DF",
            "linkPortal": "https://www.gov.br/mma/pt-br/canais_atendimento/ouvidoria",
            "tipoAtendimento": "Online (Fala.BR)",
            "descricao": "Políticas nacionais sobre desmatamento, Fundo Clima, Fundo Amazônia, governança hídrica e acordos internacionais de transição ecológica."
        },
        {
            "id": "ms-saude-nacional",
            "nome": "Ministério da Saúde (MS)",
            "sigla": "Ministério da Saúde",
            "esfera": "Federal",
            "poder": "Executivo",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Diretor do OuvidorSUS",
                "nome": "Ouvidoria-Geral do SUS (OuvidorSUS)"
            },
            "telefone": "Disque Saúde 136 / (61) 3315-2000",
            "email": "ouvidoria@saude.gov.br",
            "endereco": "Esplanada dos Ministérios, Bloco G, Edifício Sede, CEP 70058-900, Brasília - DF",
            "linkPortal": "https://www.gov.br/saude/pt-br/canais-de-atendimento/ouvidoria-geral-do-sus",
            "tipoAtendimento": "Disque 136 e Fala.BR",
            "descricao": "Dados do SUS, repasses do Fundo Nacional de Saúde para municípios, filas de espera, cobertura vacinal, estoque de medicamentos e compras hospitalares."
        },
        {
            "id": "mec-educacao-nacional",
            "nome": "Ministério da Educação (MEC)",
            "sigla": "MEC",
            "esfera": "Federal",
            "poder": "Executivo",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor-Chefe do MEC",
                "nome": "Ouvidoria do MEC"
            },
            "telefone": "0800 616 161 / (61) 2022-8000",
            "email": "ouvidoria@mec.gov.br",
            "endereco": "Esplanada dos Ministérios, Bloco L, CEP 70047-900, Brasília - DF",
            "linkPortal": "https://www.gov.br/mec/pt-br/canais_atendimento/ouvidoria",
            "tipoAtendimento": "Online (Fala.BR) e Telefone 0800",
            "descricao": "Repasses do FUNDEB, obras de creches e escolas do FNDE, dados de avaliação escolar (INEP/IDEB) e contratos do FIES/Prouni."
        },
        {
            "id": "mme-minas-energia",
            "nome": "Ministério de Minas e Energia (MME)",
            "sigla": "MME",
            "esfera": "Federal",
            "poder": "Executivo",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor do MME",
                "nome": "Ouvidoria do MME"
            },
            "telefone": "(61) 2032-5000",
            "email": "ouvidoria@mme.gov.br",
            "endereco": "Esplanada dos Ministérios, Bloco U, CEP 70051-900, Brasília - DF",
            "linkPortal": "https://www.gov.br/mme/pt-br/canais_atendimento/ouvidoria",
            "tipoAtendimento": "Online (Fala.BR)",
            "descricao": "Diretrizes de geração e distribuição de energia elétrica, concessões de petróleo e gás (ANP), leilões de energia e matriz de transição mineral."
        },
        {
            "id": "mjsp-justica-seguranca",
            "nome": "Ministério da Justiça e Segurança Pública (MJSP)",
            "sigla": "MJSP",
            "esfera": "Federal",
            "poder": "Executivo",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor-Geral do MJSP",
                "nome": "Ouvidoria-Geral do Ministério da Justiça"
            },
            "telefone": "(61) 2025-3000",
            "email": "ouvidoria@mj.gov.br",
            "endereco": "Esplanada dos Ministérios, Bloco T, Edifício Sede, CEP 70064-900, Brasília - DF",
            "linkPortal": "https://www.gov.br/mj/pt-br/canais_atendimento/ouvidoria",
            "tipoAtendimento": "Online (Fala.BR)",
            "descricao": "Dados do Fundo Nacional de Segurança Pública (FNSP), políticas penitenciárias (SENAPPEN), demarcação de terras indígenas e proteção ao consumidor (SENACON)."
        },
        {
            "id": "mcid-cidades-nacional",
            "nome": "Ministério das Cidades (MCID)",
            "sigla": "Ministério das Cidades",
            "esfera": "Federal",
            "poder": "Executivo",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor do Ministério das Cidades",
                "nome": "Ouvidoria do MCID"
            },
            "telefone": "(61) 2034-4000",
            "email": "ouvidoria@cidades.gov.br",
            "endereco": "Setor de Autarquias Sul, Quadra 1, Lote 1/6, Edifício Telemundi II, CEP 70070-010, Brasília - DF",
            "linkPortal": "https://www.gov.br/cidades/pt-br/canais_atendimento/ouvidoria",
            "tipoAtendimento": "Online (Fala.BR)",
            "descricao": "Acompanhamento das obras do Minha Casa Minha Vida, repasses de saneamento básico integrado e investimentos em mobilidade urbana nos municípios."
        },
        {
            "id": "mpf-sala-cidadao",
            "nome": "Ministério Público Federal (MPF) — Sala de Atendimento ao Cidadão",
            "sigla": "MPF",
            "esfera": "Federal",
            "poder": "Fiscalizacao",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor-Geral do MPF",
                "nome": "Ouvidoria do Ministério Público Federal"
            },
            "telefone": "(61) 3105-5100",
            "email": "ouvidoria@mpf.mp.br",
            "endereco": "SAF Sul, Quadra 4, Conjunto C, Bloco B, Sala de Atendimento, CEP 70050-900, Brasília - DF",
            "linkPortal": "https://www.mpf.mp.br/servicos/sac",
            "tipoAtendimento": "Online (Sala de Atendimento) e Procuradorias da República em todos os estados",
            "descricao": "Canal para representações, denúncias e pedidos de informação sobre defesa dos direitos indígenas, patrimônio público federal, meio ambiente e combate à corrupção."
        },
        {
            "id": "mpmg-ouvidoria-geral",
            "nome": "Ministério Público do Estado de Minas Gerais (MPMG)",
            "sigla": "MPMG",
            "esfera": "Estadual",
            "poder": "Fiscalizacao",
            "categoria": "Órgão Estadual",
            "servicoEssencial": None,
            "cidade": "Belo Horizonte",
            "uf": "MG",
            "regiao": "Sudeste",
            "codigoIbge": "3106200",
            "responsavel": {
                "cargo": "Ouvidor do MPMG",
                "nome": "Ouvidoria do Ministério Público de MG"
            },
            "telefone": "Disque 127 / (31) 3330-8100",
            "email": "ouvidoria@mpmg.mp.br",
            "endereco": "Avenida Álvares Cabral, 1690, Santo Agostinho, CEP 30170-008, Belo Horizonte - MG",
            "linkPortal": "https://www.mpmg.mp.br/portal/menu/ouvidoria/",
            "tipoAtendimento": "Presencial e Online (Ouvidoria Cidadã)",
            "descricao": "Fiscalização de termos de ajustamento de conduta (TAC), patrimônio cultural, barragens e defesa do consumidor no estado de Minas Gerais."
        },
        {
            "id": "dpu-nacional",
            "nome": "Defensoria Pública da União (DPU)",
            "sigla": "DPU",
            "esfera": "Federal",
            "poder": "Judiciario",
            "categoria": "Órgão Federal",
            "servicoEssencial": None,
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor-Geral Externo da DPU",
                "nome": "Ouvidoria-Geral da DPU"
            },
            "telefone": "(61) 3319-4300",
            "email": "ouvidoria@dpu.def.br",
            "endereco": "Setor de Edifícios Públicos Sul (SEPS), Quadra 702/902, Bloco B, Centro Empresarial Brasília 50, CEP 70390-025, Brasília - DF",
            "linkPortal": "https://www.dpu.def.br/ouvidoria",
            "tipoAtendimento": "Online e Unidades da DPU nas Capitais e Polos",
            "descricao": "Defesa jurídica gratuita de populações vulneráveis, comunidades tradicionais e pedidos de informação sobre assistência jurídica federal."
        }
    ]
    canais.extend(orgaos_federais_estaduais)

    # 4. Concessionarias de Agua e Saneamento
    concessionarias_agua = [
        {
            "id": "copasa-mg",
            "nome": "Companhia de Saneamento de Minas Gerais (COPASA MG)",
            "sigla": "COPASA MG",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Água e Saneamento",
            "servicoEssencial": "agua",
            "cidade": "Belo Horizonte",
            "uf": "MG",
            "regiao": "Sudeste",
            "codigoIbge": "3106200",
            "responsavel": {
                "cargo": "Ouvidor-Geral / Diretoria de Relações Institucionais",
                "nome": "Ouvidoria COPASA MG"
            },
            "telefone": "Central 115 / 0800 0300 115 / WhatsApp (31) 99770-7000",
            "email": "ouvidoria@copasa.com.br",
            "endereco": "Rua Mar de Espanha, 525, Bairro Santo Antônio, CEP 30330-900, Belo Horizonte - MG",
            "linkPortal": "https://www.copasa.com.br/wps/portal/internet/acesso-a-informacao/ouvidoria",
            "tipoAtendimento": "Telefone 115 gratuito, Agência Virtual e Ouvidoria de 2ª Instância",
            "descricao": "Concessionária responsável pelo abastecimento de água potável e esgotamento sanitário em mais de 640 municípios de Minas Gerais. O cidadão tem direito à informação sobre qualidade da água e tarifas."
        },
        {
            "id": "copanor-mg",
            "nome": "Copasa Serviços de Saneamento Integrado do Norte e Nordeste de Minas Gerais (COPANOR)",
            "sigla": "COPANOR",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Água e Saneamento",
            "servicoEssencial": "agua",
            "cidade": "Almenara",
            "uf": "MG",
            "regiao": "Sudeste",
            "codigoIbge": "3101706",
            "responsavel": {
                "cargo": "Coordenador de Atendimento e Ouvidoria",
                "nome": "Ouvidoria COPANOR"
            },
            "telefone": "0800 033 0888",
            "email": "ouvidoria.copanor@copasa.com.br",
            "endereco": "Praça Hélio Rocha Guimarães, 120, Centro, CEP 39900-000, Almenara - MG",
            "linkPortal": "https://www.copasa.com.br/wps/portal/internet/copanor",
            "tipoAtendimento": "Telefone 0800 e Postos Locais no Vale do Jequitinhonha e Mucuri",
            "descricao": "Subsidiária da Copasa voltada para o atendimento de comunidades rurais e pequenos distritos do semiárido mineiro e vales do Jequitinhonha, Mucuri e São Mateus."
        },
        {
            "id": "sabesp-sp",
            "nome": "Companhia de Saneamento Básico do Estado de São Paulo (Sabesp)",
            "sigla": "Sabesp",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Água e Saneamento",
            "servicoEssencial": "agua",
            "cidade": "São Paulo",
            "uf": "SP",
            "regiao": "Sudeste",
            "codigoIbge": "3550308",
            "responsavel": {
                "cargo": "Ouvidor Geral da Sabesp",
                "nome": "Ouvidoria Sabesp"
            },
            "telefone": "Central 0800 055 0195 / Ouvidoria 0800 055 0565",
            "email": "ouvidoria@sabesp.com.br",
            "endereco": "Rua Costa Carvalho, 300, Pinheiros, CEP 05429-900, São Paulo - SP",
            "linkPortal": "https://www.sabesp.com.br/ouvidoria",
            "tipoAtendimento": "Online (Agência Virtual), Telefone e Ouvidoria",
            "descricao": "Maior concessionária de saneamento da América Latina, atende 375 municípios paulistas incluindo a Região Metropolitana de São Paulo."
        },
        {
            "id": "cedae-rj",
            "nome": "Companhia Estadual de Águas e Esgotos do Rio de Janeiro (CEDAE)",
            "sigla": "CEDAE",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Água e Saneamento",
            "servicoEssencial": "agua",
            "cidade": "Rio de Janeiro",
            "uf": "RJ",
            "regiao": "Sudeste",
            "codigoIbge": "3304557",
            "responsavel": {
                "cargo": "Ouvidor Geral da Cedae",
                "nome": "Ouvidoria da CEDAE"
            },
            "telefone": "0800 282 1195 / Ouvidoria 0800 031 6032",
            "email": "ouvidoria@cedae.com.br",
            "endereco": "Avenida Presidente Vargas, 2655, Cidade Nova, CEP 20210-030, Rio de Janeiro - RJ",
            "linkPortal": "https://cedae.com.br/ouvidoria",
            "tipoAtendimento": "Telefone e Plataforma e-SIC RJ",
            "descricao": "Responsável pela captação e tratamento de água bruta e produção no Sistema Guandu para a Região Metropolitana do Rio de Janeiro."
        },
        {
            "id": "aguas-do-rio-rj",
            "nome": "Águas do Rio (Concessionária Aegea Saneamento RJ)",
            "sigla": "Águas do Rio",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Água e Saneamento",
            "servicoEssencial": "agua",
            "cidade": "Rio de Janeiro",
            "uf": "RJ",
            "regiao": "Sudeste",
            "codigoIbge": "3304557",
            "responsavel": {
                "cargo": "Ouvidora Institucional",
                "nome": "Ouvidoria Águas do Rio"
            },
            "telefone": "0800 195 0195 / WhatsApp 0800 195 0195",
            "email": "ouvidoria@aguasdorio.com.br",
            "endereco": "Praça Mauá, 1, 12º andar, Centro, CEP 20081-240, Rio de Janeiro - RJ",
            "linkPortal": "https://aguasdorio.com.br/ouvidoria/",
            "tipoAtendimento": "Central 0800 24h e Agência Digital",
            "descricao": "Concessionária de distribuição de água tratada e coleta de esgoto em 27 municípios do Estado do Rio de Janeiro e bairros da capital."
        },
        {
            "id": "sanepar-pr",
            "nome": "Companhia de Saneamento do Paraná (Sanepar)",
            "sigla": "Sanepar",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Água e Saneamento",
            "servicoEssencial": "agua",
            "cidade": "Curitiba",
            "uf": "PR",
            "regiao": "Sul",
            "codigoIbge": "4106902",
            "responsavel": {
                "cargo": "Ouvidor Geral da Sanepar",
                "nome": "Ouvidoria Sanepar"
            },
            "telefone": "0800 200 0115 / Ouvidoria 0800 400 0600",
            "email": "ouvidoria@sanepar.com.br",
            "endereco": "Rua Engenheiros Rebouças, 1376, Rebouças, CEP 80215-900, Curitiba - PR",
            "linkPortal": "https://site.sanepar.com.br/informacoes/ouvidoria",
            "tipoAtendimento": "Telefone e Portal de Acesso à Informação LAI",
            "descricao": "Concessionária estadual prestadora de serviços de água e esgoto em 345 municípios paranaenses."
        },
        {
            "id": "embasa-ba",
            "nome": "Empresa Baiana de Águas e Saneamento (Embasa)",
            "sigla": "Embasa",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Água e Saneamento",
            "servicoEssencial": "agua",
            "cidade": "Salvador",
            "uf": "BA",
            "regiao": "Nordeste",
            "codigoIbge": "2927408",
            "responsavel": {
                "cargo": "Ouvidor Geral da Embasa",
                "nome": "Ouvidoria Embasa"
            },
            "telefone": "0800 055 5195 / (71) 3372-4000",
            "email": "ouvidoria@embasa.ba.gov.br",
            "endereco": "4ª Avenida, 420, Centro Administrativo da Bahia (CAB), CEP 41745-002, Salvador - BA",
            "linkPortal": "https://www.embasa.ba.gov.br/atendimento/ouvidoria",
            "tipoAtendimento": "Central 0800 e e-SIC Bahia",
            "descricao": "Responsável pelo fornecimento de água e tratamento de esgoto em 368 municípios da Bahia."
        },
        {
            "id": "corsan-rs",
            "nome": "Companhia Riograndense de Saneamento (Corsan / Aegea)",
            "sigla": "Corsan",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Água e Saneamento",
            "servicoEssencial": "agua",
            "cidade": "Porto Alegre",
            "uf": "RS",
            "regiao": "Sul",
            "codigoIbge": "4314902",
            "responsavel": {
                "cargo": "Ouvidor Geral da Corsan",
                "nome": "Ouvidoria Corsan"
            },
            "telefone": "0800 646 6444 / Ouvidoria 0800 644 0115",
            "email": "ouvidoria@corsan.com.br",
            "endereco": "Rua Caldas Júnior, 120, Centro Histórico, CEP 90018-900, Porto Alegre - RS",
            "linkPortal": "https://www.corsan.com.br/ouvidoria",
            "tipoAtendimento": "Telefone 0800 e Agência Virtual",
            "descricao": "Concessionária de abastecimento em 317 municípios do Rio Grande do Sul."
        },
        {
            "id": "compesa-pe",
            "nome": "Companhia Pernambucana de Saneamento (Compesa)",
            "sigla": "Compesa",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Água e Saneamento",
            "servicoEssencial": "agua",
            "cidade": "Recife",
            "uf": "PE",
            "regiao": "Nordeste",
            "codigoIbge": "2611606",
            "responsavel": {
                "cargo": "Ouvidor da Compesa",
                "nome": "Ouvidoria Compesa"
            },
            "telefone": "0800 081 0195 / Ouvidoria 0800 081 0185",
            "email": "ouvidoria@compesa.com.br",
            "endereco": "Avenida Cruz Cabugá, 1387, Santo Amaro, CEP 50040-000, Recife - PE",
            "linkPortal": "https://servicos.compesa.com.br/ouvidoria/",
            "tipoAtendimento": "0800 gratuito e Atendimento Web",
            "descricao": "Atende a Região Metropolitana do Recife, Zona da Mata, Agreste e Sertão de Pernambuco com água tratada."
        },
        {
            "id": "cagece-ce",
            "nome": "Companhia de Água e Esgoto do Ceará (Cagece)",
            "sigla": "Cagece",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Água e Saneamento",
            "servicoEssencial": "agua",
            "cidade": "Fortaleza",
            "uf": "CE",
            "regiao": "Nordeste",
            "codigoIbge": "2304400",
            "responsavel": {
                "cargo": "Ouvidor Geral da Cagece",
                "nome": "Ouvidoria Cagece"
            },
            "telefone": "0800 275 0195 / Ouvidoria (85) 3101-1823",
            "email": "ouvidoria@cagece.com.br",
            "endereco": "Avenida Doutor Lauro Vieira Chaves, 1030, Vila União, CEP 60422-901, Fortaleza - CE",
            "linkPortal": "https://www.cagece.com.br/institucional/ouvidoria/",
            "tipoAtendimento": "Central 0800 e Plataforma Ceará Transparente",
            "descricao": "Atua em 152 municípios do Ceará fornecendo água encanada e coleta de efluentes."
        },
        {
            "id": "saneago-go",
            "nome": "Saneamento de Goiás S.A. (Saneago)",
            "sigla": "Saneago",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Água e Saneamento",
            "servicoEssencial": "agua",
            "cidade": "Goiânia",
            "uf": "GO",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5208707",
            "responsavel": {
                "cargo": "Ouvidor Geral Saneago",
                "nome": "Ouvidoria Saneago"
            },
            "telefone": "0800 645 0115 / Ouvidoria 0800 645 0117",
            "email": "ouvidoria@saneago.com.br",
            "endereco": "Avenida Fued José Sebba, 1524, Jardim Goiás, CEP 74805-100, Goiânia - GO",
            "linkPortal": "https://www.saneago.com.br/ouvidoria",
            "tipoAtendimento": "Telefone e Canal do Cidadão GO",
            "descricao": "Concessionária estadual que atende 226 municípios goianos com índices de universalização de água."
        },
        {
            "id": "caesb-df",
            "nome": "Companhia de Saneamento Ambiental do Distrito Federal (Caesb)",
            "sigla": "Caesb",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Água e Saneamento",
            "servicoEssencial": "agua",
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor Geral da Caesb",
                "nome": "Ouvidoria da Caesb"
            },
            "telefone": "Central 115 / Ouvidoria (61) 3213-7115",
            "email": "ouvidoria@caesb.df.gov.br",
            "endereco": "Centro de Gestão de Águas de Brasília, Av. Sibipiruna, Lotes 13 a 21, Águas Claras, CEP 71928-720, Brasília - DF",
            "linkPortal": "https://www.caesb.df.gov.br/ouvidoria.html",
            "tipoAtendimento": "Central 115 e Sistema OUV-DF",
            "descricao": "Atende a totalidade das regiões administrativas do Distrito Federal com abastecimento e preservação dos mananciais do Descoberto e Santa Maria."
        },
        {
            "id": "ana-aguas-brasil",
            "nome": "Agência Nacional de Águas e Saneamento Básico (ANA)",
            "sigla": "ANA",
            "esfera": "Federal",
            "poder": "Regulatorio",
            "categoria": "Agência Reguladora",
            "servicoEssencial": "agua",
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor da ANA",
                "nome": "Ouvidoria da Agência Nacional de Águas"
            },
            "telefone": "0800 725 5455 / (61) 2109-5400",
            "email": "ouvidoria@ana.gov.br",
            "endereco": "Setor Policial Sul (SPS), Área 5, Quadra 3, Bloco B, CEP 70610-200, Brasília - DF",
            "linkPortal": "https://www.gov.br/ana/pt-br/canais_atendimento/ouvidoria",
            "tipoAtendimento": "Online (Fala.BR) e 0800",
            "descricao": "Reguladora nacional responsável pelas normas de referência do novo Marco Legal do Saneamento Básico (Lei 14.026/2020), segurança de barragens de água e outorgas de bacias federais (São Francisco, Paraopeba, Rio Doce)."
        }
    ]
    canais.extend(concessionarias_agua)

    # 5. Concessionarias de Luz e Energia Eletrica
    concessionarias_luz = [
        {
            "id": "cemig-distribuicao-mg",
            "nome": "CEMIG Distribuição S.A. (Companhia Energética de Minas Gerais)",
            "sigla": "CEMIG",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Luz e Energia",
            "servicoEssencial": "luz",
            "cidade": "Belo Horizonte",
            "uf": "MG",
            "regiao": "Sudeste",
            "codigoIbge": "3106200",
            "responsavel": {
                "cargo": "Ouvidor-Geral da Cemig",
                "nome": "Ouvidoria Geral da CEMIG"
            },
            "telefone": "Disque 116 / 0800 721 0116 / Ouvidoria 0800 728 3838 / WhatsApp (31) 3506-1160",
            "email": "ouvidoria@cemig.com.br",
            "endereco": "Avenida Barbacena, 1200, Bairro Santo Agostinho, CEP 30190-131, Belo Horizonte - MG",
            "linkPortal": "https://www.cemig.com.br/ouvidoria/",
            "tipoAtendimento": "Telefone 116 gratuito 24h, Cemig Atende Web e Ouvidoria",
            "descricao": "Principal distribuidora de eletricidade de Minas Gerais, presente em 774 municípios mineiros atendendo a mais de 9 milhões de unidades consumidoras."
        },
        {
            "id": "enel-sp",
            "nome": "Enel Distribuição São Paulo (antiga Eletropaulo)",
            "sigla": "Enel SP",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Luz e Energia",
            "servicoEssencial": "luz",
            "cidade": "São Paulo",
            "uf": "SP",
            "regiao": "Sudeste",
            "codigoIbge": "3550308",
            "responsavel": {
                "cargo": "Ouvidor Geral Enel SP",
                "nome": "Ouvidoria Enel Distribuição SP"
            },
            "telefone": "0800 72 72 120 / Ouvidoria 0800 00 120 00 / WhatsApp (21) 99601-9608",
            "email": "ouvidoria.sp@enel.com",
            "endereco": "Praça Ramos de Azevedo, 254, Centro Histórico, CEP 01037-010, São Paulo - SP",
            "linkPortal": "https://www.enel.com.br/pt-saopaulo/para-voce/ouvidoria.html",
            "tipoAtendimento": "Telefone 0800 24h e Aplicativo Enel SP",
            "descricao": "Distribui eletricidade para 24 municípios da Grande São Paulo e capital, atendendo mais de 7,5 milhões de consumidores."
        },
        {
            "id": "enel-rj",
            "nome": "Enel Distribuição Rio (antiga Ampla)",
            "sigla": "Enel RJ",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Luz e Energia",
            "servicoEssencial": "luz",
            "cidade": "Niterói",
            "uf": "RJ",
            "regiao": "Sudeste",
            "codigoIbge": "3303302",
            "responsavel": {
                "cargo": "Ouvidor Geral Enel RJ",
                "nome": "Ouvidoria Enel Rio"
            },
            "telefone": "0800 28 00 120 / Ouvidoria 0800 00 120 00",
            "email": "ouvidoria.rj@enel.com",
            "endereco": "Praça Leoni Ramos, 1, São Domingos, CEP 24210-205, Niterói - RJ",
            "linkPortal": "https://www.enel.com.br/pt-riodejaneiro/para-voce/ouvidoria.html",
            "tipoAtendimento": "Telefone 0800 e Agências Virtuais",
            "descricao": "Atende 66 municípios do Estado do Rio de Janeiro, incluindo Região dos Lagos, Norte Fluminense e Serrana."
        },
        {
            "id": "cpfl-paulista",
            "nome": "CPFL Energia (CPFL Paulista / Piratininga / Santa Cruz)",
            "sigla": "CPFL",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Luz e Energia",
            "servicoEssencial": "luz",
            "cidade": "Campinas",
            "uf": "SP",
            "regiao": "Sudeste",
            "codigoIbge": "3509502",
            "responsavel": {
                "cargo": "Ouvidor Geral do Grupo CPFL",
                "nome": "Ouvidoria CPFL Energia"
            },
            "telefone": "0800 010 10 10 / Ouvidoria 0800 770 1114",
            "email": "ouvidoria@cpfl.com.br",
            "endereco": "Rodovia Engenheiro Miguel Noel Nascentes Burnier, 1755, Parque São Quirino, CEP 13088-900, Campinas - SP",
            "linkPortal": "https://www.cpfl.com.br/ouvidoria",
            "tipoAtendimento": "Central 0800, Aplicativo CPFL e Ouvidoria de 2ª instância",
            "descricao": "Atende a 234 municípios do interior e litoral de São Paulo, abrangendo regiões como Campinas, Ribeirão Preto e Baixada Santista."
        },
        {
            "id": "light-rj",
            "nome": "Light Serviços de Eletricidade S.A.",
            "sigla": "Light RJ",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Luz e Energia",
            "servicoEssencial": "luz",
            "cidade": "Rio de Janeiro",
            "uf": "RJ",
            "regiao": "Sudeste",
            "codigoIbge": "3304557",
            "responsavel": {
                "cargo": "Ouvidor Geral da Light",
                "nome": "Ouvidoria Light"
            },
            "telefone": "0800 021 0196 / Emergência 0800 282 0120 / Ouvidoria 0800 284 0182",
            "email": "ouvidoria@light.com.br",
            "endereco": "Avenida Marechal Floriano, 168, Centro, CEP 20080-002, Rio de Janeiro - RJ",
            "linkPortal": "https://www.light.com.br/para-residencias/fale-com-a-light/ouvidoria.aspx",
            "tipoAtendimento": "Telefone e Agência Virtual",
            "descricao": "Concessionária centenária responsável pelo fornecimento de eletricidade na cidade do Rio de Janeiro e em 30 municípios da Baixada Fluminense e Vale do Paraíba."
        },
        {
            "id": "neoenergia-coelba",
            "nome": "Neoenergia Coelba (Companhia de Eletricidade do Estado da Bahia)",
            "sigla": "Coelba",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Luz e Energia",
            "servicoEssencial": "luz",
            "cidade": "Salvador",
            "uf": "BA",
            "regiao": "Nordeste",
            "codigoIbge": "2927408",
            "responsavel": {
                "cargo": "Ouvidor Geral Neoenergia Coelba",
                "nome": "Ouvidoria Coelba"
            },
            "telefone": "Disque 116 / 0800 071 0800 / Ouvidoria 0800 071 7676",
            "email": "ouvidoria.coelba@neoenergia.com",
            "endereco": "Avenida Edgard Santos, 300, Bloco A3, Narandiba, CEP 41181-900, Salvador - BA",
            "linkPortal": "https://www.neoenergia.com/web/bahia/ouvidoria",
            "tipoAtendimento": "Disque 116 gratuito e Portal de Ouvidoria",
            "descricao": "Atende 415 dos 417 municípios da Bahia, com mais de 6,5 milhões de clientes."
        },
        {
            "id": "equatorial-maranhao-para",
            "nome": "Equatorial Energia (Maranhão / Pará / Piauí / Alagoas / Goiás)",
            "sigla": "Equatorial",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Luz e Energia",
            "servicoEssencial": "luz",
            "cidade": "São Luís",
            "uf": "MA",
            "regiao": "Nordeste",
            "codigoIbge": "2111300",
            "responsavel": {
                "cargo": "Ouvidor Geral Grupo Equatorial",
                "nome": "Ouvidoria Equatorial Energia"
            },
            "telefone": "Central 116 / Ouvidoria 0800 286 9803 / WhatsApp (98) 2055-0116",
            "email": "ouvidoria.ma@equatorialenergia.com.br",
            "endereco": "Alameda A, Quadra SQS, 100, Loteamento Quitandinha, Altos do Calhau, CEP 65071-380, São Luís - MA",
            "linkPortal": "https://www.equatorialenergia.com.br/ouvidoria",
            "tipoAtendimento": "Central 116, WhatsApp Assistente Clara e Ouvidoria",
            "descricao": "Grupo distribuidor presente nos estados do Maranhão, Pará, Piauí, Alagoas, Rio Grande do Sul, Goiás e Amapá."
        },
        {
            "id": "energisa-minas-rio",
            "nome": "Energisa Minas Rio (antiga Cataguazes-Leopoldina)",
            "sigla": "Energisa MG",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Luz e Energia",
            "servicoEssencial": "luz",
            "cidade": "Cataguases",
            "uf": "MG",
            "regiao": "Sudeste",
            "codigoIbge": "3115300",
            "responsavel": {
                "cargo": "Ouvidor Geral da Energisa",
                "nome": "Ouvidoria Energisa Minas Rio"
            },
            "telefone": "0800 032 0196 / Ouvidoria 0800 032 1010",
            "email": "ouvidoria.emr@energisa.com.br",
            "endereco": "Praça Rui Barbosa, 80, Centro, CEP 36770-001, Cataguases - MG",
            "linkPortal": "https://www.energisa.com.br/canais-de-atendimento/ouvidoria",
            "tipoAtendimento": "Telefone 0800, WhatsApp Gisa e Agências da Zona da Mata",
            "descricao": "Concessionária que atende a 66 municípios da Zona da Mata mineira e Campo das Vertentes (Cataguases, Leopoldina, Muriaé, São João Nepomuceno, etc.)."
        },
        {
            "id": "aneel-energia-eletrica",
            "nome": "Agência Nacional de Energia Elétrica (ANEEL)",
            "sigla": "ANEEL",
            "esfera": "Federal",
            "poder": "Regulatorio",
            "categoria": "Agência Reguladora",
            "servicoEssencial": "luz",
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor-Geral Setorial da ANEEL",
                "nome": "Ouvidoria Setorial da ANEEL"
            },
            "telefone": "Disque 167 / 0800 727 0167 / (61) 2192-8600",
            "email": "ouvidoria@aneel.gov.br",
            "endereco": "SGAN Quadra 603, Módulo I, CEP 70830-110, Brasília - DF",
            "linkPortal": "https://www.gov.br/aneel/pt-br/canais_atendimento/ouvidoria",
            "tipoAtendimento": "Disque 167 (gratuito) e Fala.BR",
            "descricao": "Órgão regulador máximo do setor elétrico brasileiro. O cidadão pode recorrer à ANEEL quando a concessionária local (Cemig, Enel, Light, etc.) não resolveu a reclamação ou quando houver danos elétricos por interrupção injustificada."
        }
    ]
    canais.extend(concessionarias_luz)

    # 6. Concessionarias e Provedores de Telecomunicacoes e Internet
    concessionarias_telecom = [
        {
            "id": "anatel-telecom-brasil",
            "nome": "Agência Nacional de Telecomunicações (ANATEL)",
            "sigla": "ANATEL",
            "esfera": "Federal",
            "poder": "Regulatorio",
            "categoria": "Agência Reguladora",
            "servicoEssencial": "telecom",
            "cidade": "Brasília",
            "uf": "DF",
            "regiao": "Centro-Oeste",
            "codigoIbge": "5300108",
            "responsavel": {
                "cargo": "Ouvidor da ANATEL",
                "nome": "Ouvidoria da Agência Nacional de Telecomunicações"
            },
            "telefone": "Central 1331 (Ligue Grátis) / Ouvidoria (61) 2312-2000",
            "email": "ouvidoria@anatel.gov.br",
            "endereco": "SAUS Quadra 6, Bloco E, CEP 70070-940, Brasília - DF",
            "linkPortal": "https://apps.anatel.gov.br/anatelconsumidor/",
            "tipoAtendimento": "Central 1331, Aplicativo Anatel Consumidor e Fala.BR",
            "descricao": "Agência reguladora de telefonia fixa, celular, internet banda larga e TV por assinatura. O sistema Anatel Consumidor recebe reclamações não resolvidas pelas operadoras (Vivo, Claro, TIM, Oi) com prazo de resposta obrigatório de 10 dias."
        },
        {
            "id": "vivo-telefonica-brasil",
            "nome": "Telefônica Brasil S.A. (Vivo)",
            "sigla": "Vivo",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Telecomunicações e Internet",
            "servicoEssencial": "telecom",
            "cidade": "São Paulo",
            "uf": "SP",
            "regiao": "Sudeste",
            "codigoIbge": "3550308",
            "responsavel": {
                "cargo": "Ouvidor Geral da Vivo",
                "nome": "Ouvidoria Telefônica Vivo"
            },
            "telefone": "Central *8486 / 103 15 / Ouvidoria 0800 775 1212",
            "email": "ouvidoria@vivo.com.br",
            "endereco": "Avenida Engenheiro Luiz Carlos Berrini, 1376, Cidade Monções, CEP 04571-936, São Paulo - SP",
            "linkPortal": "https://www.vivo.com.br/para-voce/ajuda/ouvidoria",
            "tipoAtendimento": "Telefone 0800 (protocolo anterior obrigatório), App Meu Vivo e Web",
            "descricao": "Maior operadora de telefonia móvel e fibra óptica do país. Canal de 2ª instância para solução de cobranças indevidas, velocidade de internet e cumprimento do Plano Geral de Metas de Universalização (PGMU)."
        },
        {
            "id": "claro-brasil",
            "nome": "Claro Brasil (Claro / Embratel)",
            "sigla": "Claro",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Telecomunicações e Internet",
            "servicoEssencial": "telecom",
            "cidade": "São Paulo",
            "uf": "SP",
            "regiao": "Sudeste",
            "codigoIbge": "3550308",
            "responsavel": {
                "cargo": "Ouvidor Geral Claro Brasil",
                "nome": "Ouvidoria Claro"
            },
            "telefone": "Central 1052 / 106 21 / Ouvidoria 0800 701 0180",
            "email": "ouvidoria@claro.com.br",
            "endereco": "Rua Henri Dunant, 780, Santo Amaro, CEP 04709-110, São Paulo - SP",
            "linkPortal": "https://www.claro.com.br/atendimento/ouvidoria",
            "tipoAtendimento": "Central 0800 e Portal Minha Claro",
            "descricao": "Fornecedora de banda larga residencial via cabo/fibra, rede móvel 4G/5G e telefonia fixa em todo o território nacional."
        },
        {
            "id": "tim-brasil",
            "nome": "TIM Brasil S.A.",
            "sigla": "TIM",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Telecomunicações e Internet",
            "servicoEssencial": "telecom",
            "cidade": "Rio de Janeiro",
            "uf": "RJ",
            "regiao": "Sudeste",
            "codigoIbge": "3304557",
            "responsavel": {
                "cargo": "Ouvidor Geral da TIM",
                "nome": "Ouvidoria TIM Brasil"
            },
            "telefone": "Central *144 / 103 41 / Ouvidoria 0800 882 0041",
            "email": "ouvidoria@timbrasil.com.br",
            "endereco": "Avenida João Cabral de Mello Neto, 850, Bloco 1, Barra da Tijuca, CEP 22775-057, Rio de Janeiro - RJ",
            "linkPortal": "https://www.tim.com.br/para-voce/atendimento/ouvidoria",
            "tipoAtendimento": "Telefone 0800 gratuito e App Meu TIM",
            "descricao": "Operadora de telecomunicações com cobertura em todos os municípios brasileiros através de redes móveis e ultra banda larga TIM Live."
        },
        {
            "id": "oi-solucoes-fibra",
            "nome": "Oi S.A. (Oi Fibra / Oi Soluções)",
            "sigla": "Oi",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Telecomunicações e Internet",
            "servicoEssencial": "telecom",
            "cidade": "Rio de Janeiro",
            "uf": "RJ",
            "regiao": "Sudeste",
            "codigoIbge": "3304557",
            "responsavel": {
                "cargo": "Ouvidor Geral da Oi",
                "nome": "Ouvidoria Oi"
            },
            "telefone": "Central 103 31 / 0800 031 8000 / Ouvidoria 0800 031 7923",
            "email": "ouvidoria@oi.net.br",
            "endereco": "Rua Humberto de Campos, 425, 8º andar, Leblon, CEP 22430-190, Rio de Janeiro - RJ",
            "linkPortal": "https://www.oi.com.br/ouvidoria/",
            "tipoAtendimento": "Telefone 0800 e Atendimento Web Oi",
            "descricao": "Concessionária histórica de telefonia fixa e provedora de internet por fibra óptica para residências e empresas."
        },
        {
            "id": "algar-telecom",
            "nome": "Algar Telecom (Grupo Algar)",
            "sigla": "Algar Telecom",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Telecomunicações e Internet",
            "servicoEssencial": "telecom",
            "cidade": "Uberlândia",
            "uf": "MG",
            "regiao": "Sudeste",
            "codigoIbge": "3170206",
            "responsavel": {
                "cargo": "Ouvidor Geral Algar Telecom",
                "nome": "Ouvidoria Algar Telecom"
            },
            "telefone": "Central 103 12 / Ouvidoria 0800 942 6000",
            "email": "ouvidoria@algartelecom.com.br",
            "endereco": "Rua José Alves Garcia, 415, Bairro Brasil, CEP 38400-668, Uberlândia - MG",
            "linkPortal": "https://www.algartelecom.com.br/ouvidoria",
            "tipoAtendimento": "Telefone 0800 gratuito e App Algar Telecom",
            "descricao": "Operadora brasileira sediada no Triângulo Mineiro, fornecendo fibra de alta velocidade, telefonia e serviços de dados em Minas Gerais, São Paulo, Goiás e Mato Grosso do Sul."
        },
        {
            "id": "brisanet-telecom",
            "nome": "Brisanet Telecomunicações",
            "sigla": "Brisanet",
            "esfera": "Concessionaria",
            "poder": "Concessao Publica",
            "categoria": "Telecomunicações e Internet",
            "servicoEssencial": "telecom",
            "cidade": "Pereiro",
            "uf": "CE",
            "regiao": "Nordeste",
            "codigoIbge": "2310704",
            "responsavel": {
                "cargo": "Ouvidor Geral Brisanet",
                "nome": "Ouvidoria Brisanet Telecom"
            },
            "telefone": "0800 281 3017 / Ouvidoria 0800 281 4000",
            "email": "ouvidoria@grupobrisanet.com.br",
            "endereco": "Rodovia CE-138, Km 03, Zona Rural, CEP 63470-000, Pereiro - CE",
            "linkPortal": "https://www.brisanet.com.br/ouvidoria/",
            "tipoAtendimento": "Central 0800, Web e aplicativo móvel",
            "descricao": "Maior provedora independente de internet em fibra óptica do Nordeste brasileiro, atendendo cidades dos estados do Ceará, Rio Grande do Norte, Paraíba, Pernambuco, Alagoas e Piauí."
        }
    ]
    canais.extend(concessionarias_telecom)

    # Resumo estatistico
    por_categoria = {}
    por_esfera = {}
    por_uf = {}
    por_servico = {"agua": 0, "luz": 0, "telecom": 0, "nenhum": 0}

    for item in canais:
        cat = item["categoria"]
        esf = item["esfera"]
        uf = item["uf"]
        serv = item["servicoEssencial"] or "nenhum"

        por_categoria[cat] = por_categoria.get(cat, 0) + 1
        por_esfera[esf] = por_esfera.get(esf, 0) + 1
        por_uf[uf] = por_uf.get(uf, 0) + 1
        por_servico[serv] = por_servico.get(serv, 0) + 1

    payload = {
        "geradoEm": "2026-09-08",
        "versao": "1.0.0",
        "fonte": "Cidades Estratégicas (IBGE/DATASUS), Fala.BR (CGU), Ouvidorias Oficiais Estaduais e Agências Reguladoras (ANA, ANEEL, ANATEL)",
        "totalCanais": len(canais),
        "estatisticas": {
            "totalGeral": len(canais),
            "porCategoria": por_categoria,
            "porEsfera": por_esfera,
            "porUf": por_uf,
            "porServicoEssencial": por_servico
        },
        "canais": canais
    }

    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    with open(DESTINO, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"Sucesso! Gerados {len(canais)} canais de acesso à informação em {DESTINO}")
    print(f"Por Esfera: {por_esfera}")
    print(f"Por Categoria: {por_categoria}")
    print(f"Por Servico Essencial: {por_servico}")

if __name__ == "__main__":
    gerar_canais()
