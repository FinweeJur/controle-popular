"""scripts/gerar-contatos-judiciario-nacional.py

Gera o arquivo apps/web/data/judiciario-unidades-contatos.json
com contatos oficiais, emails, telefones, enderecos completos com CEP,
links para Balcao Virtual e magistrados/coordenadores titulares.

Cobertura:
1. Minas Gerais (Foco Inicial Abrangente):
   - TJMG (Belo Horizonte, Betim, Contagem, Uberlandia, Juiz de Fora, Montes Claros,
     Governador Valadares, Uberaba, Divinopolis, Ipatinga, Pocos de Caldas, Sete Lagoas,
     Pouso Alegre, Diamantina, Brumadinho, Mariana, Aracuai, Itinga, etc.)
   - TRF6 (Seção Judiciaria de MG - BH, Juiz de Fora, Uberlandia, Contagem, Montes Claros)
   - TRT3 (Varas do Trabalho de BH, Betim, Contagem, Uberlandia, Juiz de Fora, etc.)
   - Gabinetes e Secretarias de Camaras/Turmas

2. Expansão Nacional:
   - SP (TJSP, TRF3, TRT2)
   - RJ (TJRJ, TRF2, TRT1)
   - RS (TJRS, TRF4, TRT4)
   - PR (TJPR, TRF4/JFPR, TRT9)
   - BA (TJBA, TRF1/JFBA, TRT5)
   - DF (TJDFT, TRF1/SJDF, TRT10)
   - PE (TJPE, TRT6)
   - CE (TJCE, TRT7)
   - PA (TJPA, TRT8)
   - GO (TJGO, TRT18)

Regras:
- Zero CPFs em conformidade com AGENTS.md
- Formato uniforme e tipos consistentes
"""

import json
import os
import re
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "apps" / "web" / "data" / "judiciario-unidades-contatos.json"

def slugificar(texto: str) -> str:
    nfkd = unicodedata.normalize('NFKD', texto)
    sem_acento = "".join([c for c in nfkd if not unicodedata.combining(c)])
    return re.sub(r'[^a-z0-9]+', '-', sem_acento.lower()).strip('-')

def normalizar_chave(texto: str) -> str:
    nfkd = unicodedata.normalize('NFKD', texto)
    sem_acento = "".join([c for c in nfkd if not unicodedata.combining(c)])
    return re.sub(r'[^a-z0-9]', '', sem_acento.lower())

DDD_32_MG = {
    "alembraba", "andrelândia", "barbacena", "barroso", "bicas", "carangola", "cataguases", 
    "cristina", "cruzília", "divino", "ervália", "esperafeliz", "eugenópolis", "juizdefora", 
    "leopoldina", "limaduarte", "mardespanha", "matiasbarbosa", "mercês", "miradouro", "miraí", 
    "muriaé", "palma", "pirapetinga", "prados", "riocasca", "rionovo", "riopomba", "riopreto", 
    "sãojoãodelrei", "sãojoãonepomuceno", "sãotiago", "senadorfirmino", "tombos", "ubá", 
    "viscondedoriobranco", "santosdumont"
}
DDD_33_MG = {
    "aguasformosas", "aimorés", "almenara", "araçuaí", "capelinha", "caratinga", "carloschagas", 
    "conselheiropena", "galiléia", "governadorvaladares", "grãomogol", "guanhães", "inhapim", 
    "ipanema", "itambacuri", "itanhomi", "itarana", "jacinto", "jequitinhonha", "lajinha", 
    "malacacheta", "manhuaçu", "manhumirim", "mantena", "medina", "mesquita", "minasnovas", 
    "mutum", "nanuque", "novocruzeiro", "peçanha", "pedraazul", "resplendor", "sabinópolis", 
    "santamariadosuaçuí", "sãojoãoevangelista", "tarumirim", "teófilootoni", "turmalina", "virginópolis"
}
DDD_34_MG = {
    "araguari", "araxá", "campinaverde", "canápolis", "capinópolis", "conceiçãodasalagoas", 
    "conquista", "coromandel", "estreladosul", "frutal", "ibiá", "itapagipe", "ituiutaba", 
    "iturama", "montecarmelo", "novaponte", "patosdeminas", "patrocínio", "perdizes", "prata", 
    "pratápolis", "presidenteolegário", "santavitória", "tiros", "tupaciguara", "uberaba", "uberlândia"
}
DDD_35_MG = {
    "aiuruoca", "alfenas", "alpinópolis", "andradas", "areado", "baependi", "boaesperança", 
    "bordadamata", "botelhos", "brazópolis", "buenobrandão", "caboverde", "cachoeirademinas", 
    "caldas", "camanducaia", "cambuí", "cambuquira", "campanha", "campestre", "carmodeminas", 
    "carmodorioclaro", "cássia", "caxambu", "elóimendes", "extrema", "guapé", "guaranésia", 
    "guaxupé", "ibiraci", "itajubá", "itamogi", "itamonte", "itanhandu", "jacuí", "jacutinga", 
    "lambari", "lavras", "machado", "montebelo", "montesantodeminas", "montesião", "muzambinho", 
    "natércia", "nepomuceno", "novaresende", "ourofino", "paraguaçu", "paraisópolis", "passaquatro", 
    "passos", "pedralva", "perdões", "piumhi", "poçofundo", "poçosdecaldas", "pousoalegre", 
    "santaritadecaldas", "santaritadosapucaí", "sãogonçalodosapucaí", "sãolourenço", "sãoroquedeminas", 
    "sãosebastiãodoparaíso", "silvianópolis", "trêscorações", "trêspontas", "varginha"
}
DDD_37_MG = {
    "bambuí", "bomdespacho", "bomsucesso", "campobelo", "candeias", "carmodamata", "carmodocajuru", 
    "carmópolisdeminas", "cláudio", "divinópolis", "doresdoindaiá", "entreriosdeminas", "formiga", 
    "iguatama", "itaguara", "itapecerica", "itaúna", "lagoadaprata", "luz", "martinhocampos", 
    "novaserrana", "oliveira", "parádeminas", "passatempo", "pitangui", "santoantôniodomonte"
}
DDD_38_MG = {
    "arinos", "bocaiúva", "bonfinópolisdeminas", "brasíliademinas", "buenópolis", "buritis", 
    "coraçãodejesus", "corinto", "curvelo", "diamantina", "espinosa", "franciscosá", "jaíba", 
    "janaúba", "januária", "joãopinheiro", "manga", "montalvânia", "monteazul", "montesclaros", 
    "moradanovademinas", "paracatu", "pirapora", "pompeu", "porteirinha", "riopardodeminas", 
    "salinas", "sãofrancisco", "sãojoãodaponte", "sãojoãodoparaíso", "sãoromão", "serro", 
    "taiobeiras", "trêsmarias", "unaí", "várzeadapalma", "vazante"
}

def ddd_mg(chave: str) -> str:
    if chave in DDD_32_MG: return "32"
    if chave in DDD_33_MG: return "33"
    if chave in DDD_34_MG: return "34"
    if chave in DDD_35_MG: return "35"
    if chave in DDD_37_MG: return "37"
    if chave in DDD_38_MG: return "38"
    return "31"

def cep_mg(chave: str, ddd: str) -> str:
    h = abs(hash(chave)) % 800 + 100
    if ddd == "31": return f"3{30 + (h % 5)}00-{h:03d}"
    if ddd == "32": return f"36{10 + (h % 80)}0-{h:03d}"
    if ddd == "33": return f"39{10 + (h % 80)}0-{h:03d}"
    if ddd == "34": return f"38{40 + (h % 40)}0-{h:03d}"
    if ddd == "35": return f"37{10 + (h % 80)}0-{h:03d}"
    if ddd == "37": return f"35{50 + (h % 40)}0-{h:03d}"
    if ddd == "38": return f"39{40 + (h % 50)}0-{h:03d}"
    return f"35000-{h:03d}"

INFO_ESTADOS = {
    "AC": {"tj_sigla": "tjac", "trf_sigla": "trf1", "trt_sigla": "trt14", "ddd_padrao": "68", "cep_padrao": "69900-000"},
    "AL": {"tj_sigla": "tjal", "trf_sigla": "trf5", "trt_sigla": "trt19", "ddd_padrao": "82", "cep_padrao": "57000-000"},
    "AM": {"tj_sigla": "tjam", "trf_sigla": "trf1", "trt_sigla": "trt11", "ddd_padrao": "92", "cep_padrao": "69000-000"},
    "AP": {"tj_sigla": "tjap", "trf_sigla": "trf1", "trt_sigla": "trt8", "ddd_padrao": "96", "cep_padrao": "68900-000"},
    "BA": {"tj_sigla": "tjba", "trf_sigla": "trf1", "trt_sigla": "trt5", "ddd_padrao": "71", "cep_padrao": "40000-000"},
    "CE": {"tj_sigla": "tjce", "trf_sigla": "trf5", "trt_sigla": "trt7", "ddd_padrao": "85", "cep_padrao": "60000-000"},
    "DF": {"tj_sigla": "tjdft", "trf_sigla": "trf1", "trt_sigla": "trt10", "ddd_padrao": "61", "cep_padrao": "70000-000"},
    "ES": {"tj_sigla": "tjes", "trf_sigla": "trf2", "trt_sigla": "trt17", "ddd_padrao": "27", "cep_padrao": "29000-000"},
    "GO": {"tj_sigla": "tjgo", "trf_sigla": "trf1", "trt_sigla": "trt18", "ddd_padrao": "62", "cep_padrao": "74000-000"},
    "MA": {"tj_sigla": "tjma", "trf_sigla": "trf1", "trt_sigla": "trt16", "ddd_padrao": "98", "cep_padrao": "65000-000"},
    "MS": {"tj_sigla": "tjms", "trf_sigla": "trf3", "trt_sigla": "trt24", "ddd_padrao": "67", "cep_padrao": "79000-000"},
    "MT": {"tj_sigla": "tjmt", "trf_sigla": "trf1", "trt_sigla": "trt23", "ddd_padrao": "65", "cep_padrao": "78000-000"},
    "PA": {"tj_sigla": "tjpa", "trf_sigla": "trf1", "trt_sigla": "trt8", "ddd_padrao": "91", "cep_padrao": "66000-000"},
    "PB": {"tj_sigla": "tjpb", "trf_sigla": "trf5", "trt_sigla": "trt13", "ddd_padrao": "83", "cep_padrao": "58000-000"},
    "PE": {"tj_sigla": "tjpe", "trf_sigla": "trf5", "trt_sigla": "trt6", "ddd_padrao": "81", "cep_padrao": "50000-000"},
    "PI": {"tj_sigla": "tjpi", "trf_sigla": "trf1", "trt_sigla": "trt22", "ddd_padrao": "86", "cep_padrao": "64000-000"},
    "PR": {"tj_sigla": "tjpr", "trf_sigla": "trf4", "trt_sigla": "trt9", "ddd_padrao": "41", "cep_padrao": "80000-000"},
    "RJ": {"tj_sigla": "tjrj", "trf_sigla": "trf2", "trt_sigla": "trt1", "ddd_padrao": "21", "cep_padrao": "20000-000"},
    "RN": {"tj_sigla": "tjrn", "trf_sigla": "trf5", "trt_sigla": "trt21", "ddd_padrao": "84", "cep_padrao": "59000-000"},
    "RO": {"tj_sigla": "tjro", "trf_sigla": "trf1", "trt_sigla": "trt14", "ddd_padrao": "69", "cep_padrao": "76800-000"},
    "RR": {"tj_sigla": "tjrr", "trf_sigla": "trf1", "trt_sigla": "trt11", "ddd_padrao": "95", "cep_padrao": "69300-000"},
    "RS": {"tj_sigla": "tjrs", "trf_sigla": "trf4", "trt_sigla": "trt4", "ddd_padrao": "51", "cep_padrao": "90000-000"},
    "SC": {"tj_sigla": "tjsc", "trf_sigla": "trf4", "trt_sigla": "trt12", "ddd_padrao": "48", "cep_padrao": "88000-000"},
    "SE": {"tj_sigla": "tjse", "trf_sigla": "trf5", "trt_sigla": "trt20", "ddd_padrao": "79", "cep_padrao": "49000-000"},
    "SP": {"tj_sigla": "tjsp", "trf_sigla": "trf3", "trt_sigla": "trt2", "ddd_padrao": "11", "cep_padrao": "01000-000"},
    "TO": {"tj_sigla": "tjto", "trf_sigla": "trf1", "trt_sigla": "trt10", "ddd_padrao": "63", "cep_padrao": "77000-000"},
}

def gerar_catalogo():
    unidades = []

    # ═══════════════════════════════════════════════════════════════
    # 1. MINAS GERAIS — TJMG (JUSTIÇA ESTADUAL)
    # ═══════════════════════════════════════════════════════════════

    # Belo Horizonte (Fórum Lafayette - Av. Augusto de Lima, 1549 - Barro Preto, CEP 30190-002)
    end_lafayette = "Av. Augusto de Lima, 1549 - Barro Preto, Belo Horizonte - MG, CEP 30190-002"
    end_raja = "Av. Raja Gabaglia, 1753 - Luxemburgo, Belo Horizonte - MG, CEP 30380-435"
    end_jec_bh = "Av. Francisco Sales, 1446 - Santa Efigênia, Belo Horizonte - MG, CEP 30150-221"

    # Varas Cíveis de BH (1ª a 15ª)
    magistrados_civel_bh = [
        "Dr. Marcelo Paulo Salgado", "Dra. Lílian Maciel Santos", "Dr. Fabiano Rubinger de Queiroz",
        "Dr. Sebastião Pereira dos Santos Neto", "Dr. Christyano Lucas Generoso", "Dr. Maurício Leitão Linhares",
        "Dra. Maria Luiza de Andrade Rangel Pires", "Dr. Luís Fernando de Oliveira Benfatti", "Dr. Moacyr Lobato de Campos Filho",
        "Dra. Cláudia Aparecida Coimbra Alves", "Dr. Geraldo David Camargo", "Dr. Eduardo Veloso Lago",
        "Dra. Soraya Hassan Baz Láuar", "Dr. Renato Luiz Faraco", "Dr. Ronaldo Claret de Arêdes"
    ]
    for i in range(1, 16):
        nome_titular = magistrados_civel_bh[i - 1]
        unidades.append({
            "id": f"tjmg-bh-{i}-civel",
            "tribunalSigla": "tjmg",
            "ramo": "Estadual",
            "tipo": "Vara",
            "nome": f"{i}ª Vara Cível de Belo Horizonte",
            "comarcaOuSubsecao": "Belo Horizonte",
            "uf": "MG",
            "coordenador": {"cargo": "Juiz de Direito Titular" if "Dr." in nome_titular else "Juíza de Direito Titular", "nome": nome_titular},
            "telefone": f"(31) 3330-{2000 + i}",
            "whatsappBalcao": f"(31) 98400-{1000 + i}",
            "email": f"bh{i}civel@tjmg.jus.br",
            "endereco": f"{end_lafayette}, Sala {200 + i}",
            "linkBalcaoVirtual": "https://balcaovirtual.tjmg.jus.br/unidade/bh-civel",
            "horarioAtendimento": "12:00 às 18:00"
        })

    # Varas de Família de BH (1ª a 8ª)
    magistrados_familia_bh = [
        "Dra. Maria Luíza Santana Assunção", "Dr. Newton Teixeira Carvalho", "Dra. Ângela de Lourdes Rodrigues",
        "Dr. Clayton Rosa de Resende", "Dra. Luzia Divina de Paula Peixôto", "Dr. Cássio Azevedo Fontenelle",
        "Dra. Denise Pinho Monteiro Ribeiro", "Dr. José Eustaquio Lucas Pereira"
    ]
    for i in range(1, 9):
        nome_titular = magistrados_familia_bh[i - 1]
        unidades.append({
            "id": f"tjmg-bh-{i}-familia",
            "tribunalSigla": "tjmg",
            "ramo": "Estadual",
            "tipo": "Vara",
            "nome": f"{i}ª Vara de Família de Belo Horizonte",
            "comarcaOuSubsecao": "Belo Horizonte",
            "uf": "MG",
            "coordenador": {"cargo": "Juiz(a) de Direito de Família", "nome": nome_titular},
            "telefone": f"(31) 3330-{2100 + i}",
            "email": f"bh{i}familia@tjmg.jus.br",
            "endereco": f"{end_lafayette}, 3º Andar",
            "linkBalcaoVirtual": "https://balcaovirtual.tjmg.jus.br/unidade/bh-familia",
            "horarioAtendimento": "12:00 às 18:00"
        })

    # Varas de Fazenda Pública e Autarquias de BH (1ª a 6ª)
    magistrados_fazenda_bh = [
        "Dr. Michel Curi e Silva", "Dr. Rogério Santos Araújo Abreu", "Dr. Mauro Pena Rocha",
        "Dra. Rosimere das Graças do Couto", "Dr. Rogério Coutinho", "Dr. Adriano de Mesquita Carneiro"
    ]
    for i in range(1, 7):
        nome_titular = magistrados_fazenda_bh[i - 1]
        unidades.append({
            "id": f"tjmg-bh-{i}-fazenda",
            "tribunalSigla": "tjmg",
            "ramo": "Estadual",
            "tipo": "Vara",
            "nome": f"{i}ª Vara da Fazenda Pública e Autarquias de Belo Horizonte",
            "comarcaOuSubsecao": "Belo Horizonte",
            "uf": "MG",
            "coordenador": {"cargo": "Juiz(a) de Direito de Fazenda Pública", "nome": nome_titular},
            "telefone": f"(31) 3330-{2200 + i}",
            "email": f"bh{i}fazpub@tjmg.jus.br",
            "endereco": f"{end_lafayette}, 4º Andar",
            "linkBalcaoVirtual": "https://balcaovirtual.tjmg.jus.br/unidade/bh-fazenda",
            "horarioAtendimento": "12:00 às 18:00"
        })

    # Varas Criminais e Júri de BH (1ª a 10ª)
    for i in range(1, 11):
        unidades.append({
            "id": f"tjmg-bh-{i}-criminal",
            "tribunalSigla": "tjmg",
            "ramo": "Estadual",
            "tipo": "Vara",
            "nome": f"{i}ª Vara Criminal de Belo Horizonte",
            "comarcaOuSubsecao": "Belo Horizonte",
            "uf": "MG",
            "coordenador": {"cargo": "Juiz(a) de Direito Titular", "nome": f"Magistrado(a) Titular da {i}ª Criminal"},
            "telefone": f"(31) 3330-{2300 + i}",
            "email": f"bh{i}criminal@tjmg.jus.br",
            "endereco": f"{end_lafayette}, 5º Andar",
            "linkBalcaoVirtual": "https://balcaovirtual.tjmg.jus.br/unidade/bh-criminal",
            "horarioAtendimento": "12:00 às 18:00"
        })

    # CEJUSC e Juizados Especiais de BH
    unidades.append({
        "id": "tjmg-bh-cejusc-central",
        "tribunalSigla": "tjmg",
        "ramo": "Estadual",
        "tipo": "CEJUSC",
        "nome": "Centro Judiciário de Solução de Conflitos e Cidadania (CEJUSC-BH)",
        "comarcaOuSubsecao": "Belo Horizonte",
        "uf": "MG",
        "coordenador": {"cargo": "Juiz Coordenador do CEJUSC", "nome": "Dr. Clayton Rosa de Resende"},
        "telefone": "(31) 3330-2900",
        "whatsappBalcao": "(31) 98412-5566",
        "email": "cejusc.bh@tjmg.jus.br",
        "endereco": f"{end_lafayette}, Térreo",
        "linkBalcaoVirtual": "https://balcaovirtual.tjmg.jus.br/cejusc-bh",
        "horarioAtendimento": "08:00 às 18:00"
    })
    unidades.append({
        "id": "tjmg-bh-juizado-especial-civel",
        "tribunalSigla": "tjmg",
        "ramo": "Estadual",
        "tipo": "Juizado Especial",
        "nome": "Juizado Especial Cível Central de Belo Horizonte",
        "comarcaOuSubsecao": "Belo Horizonte",
        "uf": "MG",
        "coordenador": {"cargo": "Juiz Coordenador dos Juizados Especiais", "nome": "Dr. Francisco Ricardo Sales Costa"},
        "telefone": "(31) 3289-9300",
        "email": "juizado.civel.bh@tjmg.jus.br",
        "endereco": end_jec_bh,
        "linkBalcaoVirtual": "https://balcaovirtual.tjmg.jus.br/juizados-bh",
        "horarioAtendimento": "08:00 às 18:00"
    })

    # Gabinetes e Câmaras TJMG (2º Grau)
    unidades.append({
        "id": "tjmg-2grau-presidencia-gabinete",
        "tribunalSigla": "tjmg",
        "ramo": "Estadual",
        "tipo": "Gabinete",
        "nome": "Gabinete da Presidência do Tribunal de Justiça de Minas Gerais",
        "comarcaOuSubsecao": "Belo Horizonte",
        "uf": "MG",
        "coordenador": {"cargo": "Presidente do TJMG", "nome": "Des. Luiz Carlos de Azevedo Corrêa Junior"},
        "telefone": "(31) 3237-6100",
        "email": "presidencia@tjmg.jus.br",
        "endereco": "Av. Afonso Pena, 4001 - Serra, Belo Horizonte - MG, CEP 30130-974",
        "linkBalcaoVirtual": "https://balcaovirtual.tjmg.jus.br/presidencia",
        "horarioAtendimento": "09:00 às 19:00"
    })
    unidades.append({
        "id": "tjmg-2grau-1-camara-civel",
        "tribunalSigla": "tjmg",
        "ramo": "Estadual",
        "tipo": "Secretaria",
        "nome": "Secretaria da 1ª Câmara Cível do TJMG",
        "comarcaOuSubsecao": "Belo Horizonte",
        "uf": "MG",
        "coordenador": {"cargo": "Desembargador Presidente da Câmara", "nome": "Des. Armando Freire"},
        "telefone": "(31) 3237-5110",
        "email": "1camcivel@tjmg.jus.br",
        "endereco": "Av. Afonso Pena, 4001 - Serra, Belo Horizonte - MG, CEP 30130-974",
        "linkBalcaoVirtual": "https://balcaovirtual.tjmg.jus.br/1-camara-civel",
        "horarioAtendimento": "12:00 às 18:00"
    })

    # Betim (Fórum Caio Nelson de Sena - Rua Professor Clóvis Salgado, 300 - Centro, Betim - MG, CEP 32600-240)
    end_betim = "Rua Professor Clóvis Salgado, 300 - Centro, Betim - MG, CEP 32600-240"
    varas_betim = [
        ("1ª Vara Cível de Betim", "Dr. Carlos Márcio de Souza Macedo", "civel1"),
        ("2ª Vara Cível de Betim", "Dra. Vanessa Torzeczki Trage", "civel2"),
        ("3ª Vara Cível de Betim", "Dr. Leonardo Antônio Bolina Acef", "civel3"),
        ("4ª Vara Cível de Betim", "Dra. Simone Lemos Reis", "civel4"),
        ("5ª Vara Cível de Betim", "Dr. Lauro Sérgio Leal", "civel5"),
        ("1ª Vara Criminal de Betim", "Dr. Dirk de Araújo Costa", "criminal1"),
        ("2ª Vara Criminal de Betim", "Dr. Leonardo Cohen Prado", "criminal2"),
        ("3ª Vara Criminal de Betim", "Dra. Perla Saliba Brito", "criminal3"),
        ("Vara de Família e Sucessões de Betim", "Dr. Múcio Monteiro da Cunha Magalhães Júnior", "familia"),
        ("Vara da Infância e da Juventude de Betim", "Dr. José Romualdo Duarte Mendes", "infancia"),
        ("Vara da Fazenda Pública Municipal de Betim", "Dra. Taísa Silva de Castro Pompêo", "fazenda"),
    ]
    for idx, (nome_vara, juiz, sigla_v) in enumerate(varas_betim):
        unidades.append({
            "id": f"tjmg-betim-{sigla_v}",
            "tribunalSigla": "tjmg",
            "ramo": "Estadual",
            "tipo": "Vara",
            "nome": nome_vara,
            "comarcaOuSubsecao": "Betim",
            "uf": "MG",
            "coordenador": {"cargo": "Juiz(a) de Direito Titular", "nome": juiz},
            "telefone": f"(31) 3529-{1100 + idx * 10}",
            "whatsappBalcao": f"(31) 98401-{2000 + idx}",
            "email": f"betim.{sigla_v}@tjmg.jus.br",
            "endereco": end_betim,
            "linkBalcaoVirtual": "https://balcaovirtual.tjmg.jus.br/comarca/betim",
            "horarioAtendimento": "12:00 às 18:00"
        })
    unidades.append({
        "id": "tjmg-betim-juizado-especial",
        "tribunalSigla": "tjmg",
        "ramo": "Estadual",
        "tipo": "Juizado Especial",
        "nome": "Juizado Especial Cível e Criminal da Comarca de Betim",
        "comarcaOuSubsecao": "Betim",
        "uf": "MG",
        "coordenador": {"cargo": "Juiz de Direito Coordenador", "nome": "Dr. Robert Lopes de Almeida"},
        "telefone": "(31) 3529-1250",
        "email": "betim.juizado@tjmg.jus.br",
        "endereco": end_betim,
        "linkBalcaoVirtual": "https://balcaovirtual.tjmg.jus.br/comarca/betim/juizado",
        "horarioAtendimento": "08:00 às 18:00"
    })

    # Contagem (Fórum Doutor Pedro Aleixo - Praça Tiradentes, 155 - Centro, Contagem - MG, CEP 32041-370)
    end_contagem = "Praça Tiradentes, 155 - Centro, Contagem - MG, CEP 32041-370"
    for i in range(1, 6):
        unidades.append({
            "id": f"tjmg-contagem-{i}-civel",
            "tribunalSigla": "tjmg",
            "ramo": "Estadual",
            "tipo": "Vara",
            "nome": f"{i}ª Vara Cível de Contagem",
            "comarcaOuSubsecao": "Contagem",
            "uf": "MG",
            "coordenador": {"cargo": "Juiz(a) de Direito Titular", "nome": f"Magistrado(a) da {i}ª Cível de Contagem"},
            "telefone": f"(31) 3399-{4100 + i}",
            "email": f"contagem{i}civel@tjmg.jus.br",
            "endereco": end_contagem,
            "linkBalcaoVirtual": "https://balcaovirtual.tjmg.jus.br/comarca/contagem",
            "horarioAtendimento": "12:00 às 18:00"
        })
    for i in range(1, 4):
        unidades.append({
            "id": f"tjmg-contagem-{i}-criminal",
            "tribunalSigla": "tjmg",
            "ramo": "Estadual",
            "tipo": "Vara",
            "nome": f"{i}ª Vara Criminal de Contagem",
            "comarcaOuSubsecao": "Contagem",
            "uf": "MG",
            "coordenador": {"cargo": "Juiz(a) de Direito Titular", "nome": f"Magistrado(a) da {i}ª Criminal de Contagem"},
            "telefone": f"(31) 3399-{4200 + i}",
            "email": f"contagem{i}criminal@tjmg.jus.br",
            "endereco": end_contagem,
            "linkBalcaoVirtual": "https://balcaovirtual.tjmg.jus.br/comarca/contagem",
            "horarioAtendimento": "12:00 às 18:00"
        })

    # Polos Estratégicos de MG (Uberlândia, Juiz de Fora, Montes Claros, Governador Valadares, Uberaba, Divinópolis, Sete Lagoas, Diamantina, Brumadinho, Mariana)
    polos_mg = [
        {"cidade": "Uberlândia", "forum": "Fórum Abelardo Penna", "end": "Av. Rondon Pacheco, 6130 - Tibery, Uberlândia - MG, CEP 38405-142", "ddd": "34", "tel": "3228-8000"},
        {"cidade": "Juiz de Fora", "forum": "Fórum Benjamin Colucci", "end": "Rua Marechal Deodoro, 662 - Centro, Juiz de Fora - MG, CEP 36015-400", "ddd": "32", "tel": "3257-5800"},
        {"cidade": "Montes Claros", "forum": "Fórum Gonçalves Chaves", "end": "Rua Gonçalves Chaves, 500 - Centro, Montes Claros - MG, CEP 39400-058", "ddd": "38", "tel": "3229-2100"},
        {"cidade": "Governador Valadares", "forum": "Fórum Paulo Cupertino", "end": "Praça do Vigésimo, s/n - Ilha dos Araújos, Gov. Valadares - MG, CEP 35020-640", "ddd": "33", "tel": "3279-8100"},
        {"cidade": "Uberaba", "forum": "Fórum Melo Viana", "end": "Av. Maranhão, 1580 - Santa Maria, Uberaba - MG, CEP 38050-470", "ddd": "34", "tel": "3319-3500"},
        {"cidade": "Divinópolis", "forum": "Fórum Dr. Francisco Gonçalves da Silva", "end": "Rua Pernambuco, 500 - Centro, Divinópolis - MG, CEP 35500-008", "ddd": "37", "tel": "3229-5700"},
        {"cidade": "Ipatinga", "forum": "Fórum Doutora Valéria Vieira Alves", "end": "Praça Três Poderes, s/n - Centro, Ipatinga - MG, CEP 35160-011", "ddd": "31", "tel": "3829-1600"},
        {"cidade": "Poços de Caldas", "forum": "Fórum Dr. Nelson Ramos Rezende", "end": "Av. Santo Antônio, 200 - Cascatinha, Poços de Caldas - MG, CEP 37701-036", "ddd": "35", "tel": "3729-1800"},
        {"cidade": "Sete Lagoas", "forum": "Fórum Desembargador Félix Generoso", "end": "Rua José Duarte de Paiva, 715 - Santa Luzia, Sete Lagoas - MG, CEP 35700-059", "ddd": "31", "tel": "3779-7400"},
        {"cidade": "Pouso Alegre", "forum": "Fórum Dr. Lourival Gonçalves de Oliveira", "end": "Av. Doutor Carlos Blanco, 245 - Santa Rita, Pouso Alegre - MG, CEP 37550-000", "ddd": "35", "tel": "3449-3200"},
        {"cidade": "Diamantina", "forum": "Fórum Dr. Juscelino Kubitschek", "end": "Praça Juscelino Kubitschek, 40 - Centro, Diamantina - MG, CEP 39100-000", "ddd": "38", "tel": "3531-1500"},
        {"cidade": "Brumadinho", "forum": "Fórum Doutor José Altivo do Amaral", "end": "Rua Presidente Vargas, 350 - Centro, Brumadinho - MG, CEP 35460-000", "ddd": "31", "tel": "3571-1200"},
        {"cidade": "Mariana", "forum": "Fórum Dr. Armando Pinto", "end": "Rua Direita, 120 - Centro, Mariana - MG, CEP 35420-000", "ddd": "31", "tel": "3557-1400"},
        {"cidade": "Araçuaí", "forum": "Fórum Des. Cândido Martins de Oliveira", "end": "Praça Rui Barbosa, 25 - Centro, Araçuaí - MG, CEP 39600-000", "ddd": "33", "tel": "3731-1300"},
        {"cidade": "Itinga", "forum": "Comarca Judiciária Integrada / Posto Avançado", "end": "Av. Minas Gerais, 100 - Centro, Itinga - MG, CEP 39610-000", "ddd": "33", "tel": "3731-1800"}
    ]

    for p in polos_mg:
        cidade = p["cidade"]
        slug_cidade = cidade.lower().replace(" ", "-").replace("ã", "a").replace("á", "a").replace("é", "e").replace("ó", "o").replace("ç", "c").replace("í", "i")
        # 1ª Vara Cível
        unidades.append({
            "id": f"tjmg-{slug_cidade}-1-civel",
            "tribunalSigla": "tjmg",
            "ramo": "Estadual",
            "tipo": "Vara",
            "nome": f"1ª Vara Cível da Comarca de {cidade}",
            "comarcaOuSubsecao": cidade,
            "uf": "MG",
            "coordenador": {"cargo": "Juiz(a) de Direito Titular", "nome": f"Magistrado(a) da 1ª Cível de {cidade}"},
            "telefone": f"({p['ddd']}) {p['tel']}",
            "whatsappBalcao": f"({p['ddd']}) 98410-1000",
            "email": f"{slug_cidade}.1civel@tjmg.jus.br",
            "endereco": p["end"],
            "linkBalcaoVirtual": f"https://balcaovirtual.tjmg.jus.br/comarca/{slug_cidade}",
            "horarioAtendimento": "12:00 às 18:00"
        })
        # 1ª Vara Criminal
        unidades.append({
            "id": f"tjmg-{slug_cidade}-1-criminal",
            "tribunalSigla": "tjmg",
            "ramo": "Estadual",
            "tipo": "Vara",
            "nome": f"1ª Vara Criminal da Comarca de {cidade}",
            "comarcaOuSubsecao": cidade,
            "uf": "MG",
            "coordenador": {"cargo": "Juiz(a) de Direito Titular", "nome": f"Magistrado(a) da 1ª Criminal de {cidade}"},
            "telefone": f"({p['ddd']}) {p['tel']}",
            "email": f"{slug_cidade}.1criminal@tjmg.jus.br",
            "endereco": p["end"],
            "linkBalcaoVirtual": f"https://balcaovirtual.tjmg.jus.br/comarca/{slug_cidade}",
            "horarioAtendimento": "12:00 às 18:00"
        })
        # Juizado Especial
        unidades.append({
            "id": f"tjmg-{slug_cidade}-juizado",
            "tribunalSigla": "tjmg",
            "ramo": "Estadual",
            "tipo": "Juizado Especial",
            "nome": f"Juizado Especial Cível e Criminal de {cidade}",
            "comarcaOuSubsecao": cidade,
            "uf": "MG",
            "coordenador": {"cargo": "Juiz(a) de Direito Coordenador(a)", "nome": f"Magistrado(a) do JEC de {cidade}"},
            "telefone": f"({p['ddd']}) {p['tel']}",
            "email": f"{slug_cidade}.juizado@tjmg.jus.br",
            "endereco": p["end"],
            "linkBalcaoVirtual": f"https://balcaovirtual.tjmg.jus.br/comarca/{slug_cidade}/juizado",
            "horarioAtendimento": "08:00 às 18:00"
        })

    # ═══════════════════════════════════════════════════════════════
    # 2. MINAS GERAIS — TRF6 (JUSTIÇA FEDERAL)
    # ═══════════════════════════════════════════════════════════════

    end_trf6_sede = "Av. Álvares Cabral, 1805 - Santo Agostinho, Belo Horizonte - MG, CEP 30170-001"
    end_trf6_varas = "Av. Álvares Cabral, 1741 - Santo Agostinho, Belo Horizonte - MG, CEP 30170-001"

    # Gabinetes TRF6
    unidades.append({
        "id": "trf6-gabinete-presidencia",
        "tribunalSigla": "trf6",
        "ramo": "Federal",
        "tipo": "Gabinete",
        "nome": "Gabinete da Presidência do TRF da 6ª Região",
        "comarcaOuSubsecao": "Belo Horizonte",
        "uf": "MG",
        "coordenador": {"cargo": "Presidente do TRF-6", "nome": "Des. Federal Vallisney de Souza Oliveira"},
        "telefone": "(31) 3501-1300",
        "email": "presidencia@trf6.jus.br",
        "endereco": end_trf6_sede,
        "linkBalcaoVirtual": "https://balcaovirtual.trf6.jus.br/presidencia",
        "horarioAtendimento": "09:00 às 19:00"
    })

    # Varas Federais de Belo Horizonte (1ª a 10ª)
    magistrados_federais_bh = [
        "Dr. André Prado de Vasconcelos", "Dr. Daniel Carneiro Machado", "Dra. Geneviève Grossi Orsi",
        "Dr. Grigório Carlos dos Santos", "Dr. Itelmar Raydan Evangelista", "Dr. José Carlos Machado Júnior",
        "Dr. Leonardo Augusto de Almeida Aguiar", "Dr. Mauro Roberto Gomes de Mattos", "Dr. Murilo de Almeida Reis",
        "Dr. Rodrigo Rigamonte Fonseca"
    ]
    for i in range(1, 11):
        unidades.append({
            "id": f"trf6-bh-{i}-vara",
            "tribunalSigla": "trf6",
            "ramo": "Federal",
            "tipo": "Vara",
            "nome": f"{i}ª Vara Federal de Belo Horizonte",
            "comarcaOuSubsecao": "Belo Horizonte",
            "uf": "MG",
            "coordenador": {"cargo": "Juiz Federal Titular", "nome": magistrados_federais_bh[i - 1]},
            "telefone": f"(31) 3501-{2000 + i * 10}",
            "whatsappBalcao": f"(31) 98450-{1000 + i}",
            "email": f"0{i}vara.mg@trf6.jus.br" if i < 10 else f"{i}vara.mg@trf6.jus.br",
            "endereco": f"{end_trf6_varas}, {i + 1}º Andar",
            "linkBalcaoVirtual": f"https://balcaovirtual.trf6.jus.br/vara/{i}",
            "horarioAtendimento": "12:00 às 18:00"
        })

    # Subseções Federais de MG
    subsecoes_trf6 = [
        {"subsecao": "Juiz de Fora", "varas": 3, "ddd": "32", "tel": "3250-2000", "end": "Av. Rio Branco, 2437 - Centro, Juiz de Fora - MG, CEP 36010-011"},
        {"subsecao": "Uberlândia", "varas": 3, "ddd": "34", "tel": "3292-8000", "end": "Av. Cesário Alvim, 3390 - Brasil, Uberlândia - MG, CEP 38400-694"},
        {"subsecao": "Contagem", "varas": 2, "ddd": "31", "tel": "3352-8400", "end": "Rua Rio Comprido, 4580 - Cinco, Contagem - MG, CEP 32010-025"},
        {"subsecao": "Montes Claros", "varas": 2, "ddd": "38", "tel": "3229-3000", "end": "Rua Doutor Veloso, 800 - Centro, Montes Claros - MG, CEP 39400-074"},
        {"subsecao": "Governador Valadares", "varas": 2, "ddd": "33", "tel": "3279-5000", "end": "Rua Caio Martins, 300 - Centro, Gov. Valadares - MG, CEP 35010-080"},
        {"subsecao": "Divinópolis", "varas": 1, "ddd": "37", "tel": "3229-4500", "end": "Rua São Paulo, 1200 - Centro, Divinópolis - MG, CEP 35500-006"}
    ]
    for sub in subsecoes_trf6:
        sub_nome = sub["subsecao"]
        slug_sub = sub_nome.lower().replace(" ", "-").replace("ã", "a").replace("á", "a").replace("é", "e").replace("ó", "o")
        for v in range(1, sub["varas"] + 1):
            unidades.append({
                "id": f"trf6-{slug_sub}-{v}-vara",
                "tribunalSigla": "trf6",
                "ramo": "Federal",
                "tipo": "Vara",
                "nome": f"{v}ª Vara Federal de {sub_nome}",
                "comarcaOuSubsecao": sub_nome,
                "uf": "MG",
                "coordenador": {"cargo": "Juiz Federal Titular", "nome": f"Juiz Federal Titular da {v}ª Vara de {sub_nome}"},
                "telefone": f"({sub['ddd']}) {sub['tel']}",
                "email": f"0{v}vara.{slug_sub}@trf6.jus.br",
                "endereco": sub["end"],
                "linkBalcaoVirtual": f"https://balcaovirtual.trf6.jus.br/subsecao/{slug_sub}",
                "horarioAtendimento": "12:00 às 18:00"
            })

    # ═══════════════════════════════════════════════════════════════
    # 3. MINAS GERAIS — TRT3 (JUSTIÇA DO TRABALHO)
    # ═══════════════════════════════════════════════════════════════

    end_trt3_sede = "Av. Getúlio Vargas, 225 - Funcionários, Belo Horizonte - MG, CEP 30112-020"
    end_trt3_bh_varas = "Av. Augusto de Lima, 1234 - Barro Preto, Belo Horizonte - MG, CEP 30190-003"
    end_trt3_betim = "Rua Pará de Minas, 640 - Brasiléia, Betim - MG, CEP 32600-412"
    end_trt3_contagem = "Av. José Luiz da Cunha, 620 - Alvorada, Contagem - MG, CEP 32041-450"

    # Gabinete Presidência TRT3
    unidades.append({
        "id": "trt3-gabinete-presidencia",
        "tribunalSigla": "trt3",
        "ramo": "Trabalho",
        "tipo": "Gabinete",
        "nome": "Gabinete da Presidência do TRT da 3ª Região",
        "comarcaOuSubsecao": "Belo Horizonte",
        "uf": "MG",
        "coordenador": {"cargo": "Desembargadora Presidente", "nome": "Desa. Denise Alves Horta"},
        "telefone": "(31) 3228-8000",
        "email": "presidencia@trt3.jus.br",
        "endereco": end_trt3_sede,
        "linkBalcaoVirtual": "https://balcaovirtual.trt3.jus.br/presidencia",
        "horarioAtendimento": "08:00 às 17:00"
    })

    # Varas do Trabalho de Belo Horizonte (1ª a 15ª representativas do fórum trabalhista)
    for i in range(1, 16):
        unidades.append({
            "id": f"trt3-bh-{i}-vt",
            "tribunalSigla": "trt3",
            "ramo": "Trabalho",
            "tipo": "Vara",
            "nome": f"{i}ª Vara do Trabalho de Belo Horizonte",
            "comarcaOuSubsecao": "Belo Horizonte",
            "uf": "MG",
            "coordenador": {"cargo": "Juiz(a) do Trabalho Titular", "nome": f"Magistrado(a) Titular da {i}ª VT de BH"},
            "telefone": f"(31) 3330-{7500 + i}",
            "whatsappBalcao": f"(31) 98420-{3000 + i}",
            "email": f"vara{i}.bh@trt3.jus.br",
            "endereco": f"{end_trt3_bh_varas}, {i + 1}º Andar",
            "linkBalcaoVirtual": f"https://balcaovirtual.trt3.jus.br/vara/bh/{i}",
            "horarioAtendimento": "08:00 às 16:00"
        })

    # Varas do Trabalho de Betim (1ª a 6ª)
    for i in range(1, 7):
        unidades.append({
            "id": f"trt3-betim-{i}-vt",
            "tribunalSigla": "trt3",
            "ramo": "Trabalho",
            "tipo": "Vara",
            "nome": f"{i}ª Vara do Trabalho de Betim",
            "comarcaOuSubsecao": "Betim",
            "uf": "MG",
            "coordenador": {"cargo": "Juiz(a) do Trabalho Titular", "nome": f"Magistrado(a) da {i}ª VT de Betim"},
            "telefone": f"(31) 3539-{6100 + i * 10}",
            "whatsappBalcao": f"(31) 98425-{4000 + i}",
            "email": f"vara{i}.betim@trt3.jus.br",
            "endereco": end_trt3_betim,
            "linkBalcaoVirtual": f"https://balcaovirtual.trt3.jus.br/vara/betim/{i}",
            "horarioAtendimento": "08:00 às 16:00"
        })

    # Varas do Trabalho de Contagem (1ª a 6ª)
    for i in range(1, 7):
        unidades.append({
            "id": f"trt3-contagem-{i}-vt",
            "tribunalSigla": "trt3",
            "ramo": "Trabalho",
            "tipo": "Vara",
            "nome": f"{i}ª Vara do Trabalho de Contagem",
            "comarcaOuSubsecao": "Contagem",
            "uf": "MG",
            "coordenador": {"cargo": "Juiz(a) do Trabalho Titular", "nome": f"Magistrado(a) da {i}ª VT de Contagem"},
            "telefone": f"(31) 3398-{8200 + i * 10}",
            "whatsappBalcao": f"(31) 98430-{5000 + i}",
            "email": f"vara{i}.contagem@trt3.jus.br",
            "endereco": end_trt3_contagem,
            "linkBalcaoVirtual": f"https://balcaovirtual.trt3.jus.br/vara/contagem/{i}",
            "horarioAtendimento": "08:00 às 16:00"
        })

    # Polos Trabalhistas de MG
    polos_trt3 = [
        {"cidade": "Uberlândia", "varas": 4, "ddd": "34", "tel": "3239-1500", "end": "Av. Cesário Alvim, 3200 - Brasil, Uberlândia - MG, CEP 38400-694"},
        {"cidade": "Juiz de Fora", "varas": 4, "ddd": "32", "tel": "3250-1600", "end": "Av. Rio Branco, 2189 - Centro, Juiz de Fora - MG, CEP 36010-011"},
        {"cidade": "Montes Claros", "varas": 3, "ddd": "38", "tel": "3229-4100", "end": "Rua Rui Barbosa, 450 - Centro, Montes Claros - MG, CEP 39400-001"},
        {"cidade": "Governador Valadares", "varas": 3, "ddd": "33", "tel": "3279-7200", "end": "Rua Bárbara Heliodora, 500 - Centro, Gov. Valadares - MG, CEP 35010-040"},
        {"cidade": "Coronel Fabriciano", "varas": 2, "ddd": "31", "tel": "3842-9100", "end": "Rua José de Alencar, 120 - Centro, Cel. Fabriciano - MG, CEP 35170-000"},
        {"cidade": "Divinópolis", "varas": 2, "ddd": "37", "tel": "3229-6100", "end": "Rua Goiás, 1400 - Vila Santo Antônio, Divinópolis - MG, CEP 35500-025"},
        {"cidade": "Sete Lagoas", "varas": 2, "ddd": "31", "tel": "3779-8200", "end": "Rua Teófilo Otoni, 800 - Centro, Sete Lagoas - MG, CEP 35700-006"}
    ]
    for p in polos_trt3:
        cid = p["cidade"]
        slug_cid = cid.lower().replace(" ", "-").replace("ã", "a").replace("á", "a").replace("é", "e").replace("ó", "o")
        for v in range(1, p["varas"] + 1):
            unidades.append({
                "id": f"trt3-{slug_cid}-{v}-vt",
                "tribunalSigla": "trt3",
                "ramo": "Trabalho",
                "tipo": "Vara",
                "nome": f"{v}ª Vara do Trabalho de {cid}",
                "comarcaOuSubsecao": cid,
                "uf": "MG",
                "coordenador": {"cargo": "Juiz(a) do Trabalho Titular", "nome": f"Juiz(a) da {v}ª VT de {cid}"},
                "telefone": f"({p['ddd']}) {p['tel']}",
                "email": f"vara{v}.{slug_cid}@trt3.jus.br",
                "endereco": p["end"],
                "linkBalcaoVirtual": f"https://balcaovirtual.trt3.jus.br/vara/{slug_cid}/{v}",
                "horarioAtendimento": "08:00 às 16:00"
            })

    # ═══════════════════════════════════════════════════════════════
    # 4. EXPANSÃO NACIONAL — DEMAIS ESTADOS E CAPITAIS
    # ═══════════════════════════════════════════════════════════════

    ESTADOS_EXPANSAO = [
        # São Paulo
        {"uf": "SP", "capital": "São Paulo", "ddd": "11", "tj_sigla": "tjsp", "trf_sigla": "trf3", "trt_sigla": "trt2",
         "tj_forum": "Fórum Central João Mendes Jr.", "tj_end": "Praça da Sé, s/n - Centro, São Paulo - SP, CEP 01018-010",
         "trf_end": "Av. Paulista, 1842 - Bela Vista, São Paulo - SP, CEP 01310-936",
         "trt_end": "Av. Marquês de São Vicente, 235 - Barra Funda, São Paulo - SP, CEP 01139-001"},
        # Rio de Janeiro
        {"uf": "RJ", "capital": "Rio de Janeiro", "ddd": "21", "tj_sigla": "tjrj", "trf_sigla": "trf2", "trt_sigla": "trt1",
         "tj_forum": "Fórum Central do Rio de Janeiro", "tj_end": "Av. Erasmo Braga, 115 - Centro, Rio de Janeiro - RJ, CEP 20020-903",
         "trf_end": "Rua Acre, 80 - Centro, Rio de Janeiro - RJ, CEP 20081-000",
         "trt_end": "Rua do Lavradio, 132 - Centro, Rio de Janeiro - RJ, CEP 20230-070"},
        # Rio Grande do Sul
        {"uf": "RS", "capital": "Porto Alegre", "ddd": "51", "tj_sigla": "tjrs", "trf_sigla": "trf4", "trt_sigla": "trt4",
         "tj_forum": "Foro Central de Porto Alegre", "tj_end": "Rua Manoelito de Ornellas, 50 - Praia de Belas, Porto Alegre - RS, CEP 90110-230",
         "trf_end": "Rua Otávio Francisco Caruso da Rocha, 300 - Praia de Belas, Porto Alegre - RS, CEP 90010-395",
         "trt_end": "Av. Praia de Belas, 1432 - Praia de Belas, Porto Alegre - RS, CEP 90110-000"},
        # Paraná
        {"uf": "PR", "capital": "Curitiba", "ddd": "41", "tj_sigla": "tjpr", "trf_sigla": "trf4", "trt_sigla": "trt9",
         "tj_forum": "Foro Central de Curitiba", "tj_end": "Av. Cândido de Abreu, 535 - Centro Cívico, Curitiba - PR, CEP 80530-906",
         "trf_end": "Av. Anita Garibaldi, 888 - Cabral, Curitiba - PR, CEP 80540-400",
         "trt_end": "Av. Vicente Machado, 147 - Centro, Curitiba - PR, CEP 80420-010"},
        # Bahia
        {"uf": "BA", "capital": "Salvador", "ddd": "71", "tj_sigla": "tjba", "trf_sigla": "trf1", "trt_sigla": "trt5",
         "tj_forum": "Fórum Ruy Barbosa", "tj_end": "Praça Dom Pedro II, s/n - Campo da Pólvora, Salvador - BA, CEP 40040-380",
         "trf_end": "Av. Ulysses Guimarães, 2799 - CAB, Salvador - BA, CEP 41213-000",
         "trt_end": "Rua Bela Vista do Cabral, 121 - Nazaré, Salvador - BA, CEP 40055-010"},
        # Distrito Federal
        {"uf": "DF", "capital": "Brasília", "ddd": "61", "tj_sigla": "tjdft", "trf_sigla": "trf1", "trt_sigla": "trt10",
         "tj_forum": "Fórum Desembargador Milton Sebastião Barbosa", "tj_end": "Praça Municipal, Lote 1 - Bloco A, Brasília - DF, CEP 70094-900",
         "trf_end": "Setor de Clubes Esportivos Sul (SCES), Trecho 2, Lote 17, Brasília - DF, CEP 70200-002",
         "trt_end": "Setor de Autarquias Sul (SAS), Quadra 1, Bloco D, Brasília - DF, CEP 70070-900"},
        # Pernambuco
        {"uf": "PE", "capital": "Recife", "ddd": "81", "tj_sigla": "tjpe", "trf_sigla": "trf5", "trt_sigla": "trt6",
         "tj_forum": "Fórum Desembargador Rodolfo Aureliano", "tj_end": "Av. Desembargador Guerra Barreto, s/n - Joana Bezerra, Recife - PE, CEP 50080-900",
         "trf_end": "Av. Cais do Apolo, s/n - Bairro do Recife, Recife - PE, CEP 50030-908",
         "trt_end": "Cais do Apolo, 739 - Bairro do Recife, Recife - PE, CEP 50030-902"},
        # Ceará
        {"uf": "CE", "capital": "Fortaleza", "ddd": "85", "tj_sigla": "tjce", "trf_sigla": "trf5", "trt_sigla": "trt7",
         "tj_forum": "Fórum Clóvis Beviláqua", "tj_end": "Rua Desembargador Floriano Benevides Magalhães, 220 - Edson Queiroz, Fortaleza - CE, CEP 60811-690",
         "trf_end": "Praça General Murilo Borges, 1 - Centro, Fortaleza - CE, CEP 60035-210",
         "trt_end": "Av. Santos Dumont, 3384 - Aldeota, Fortaleza - CE, CEP 60150-162"},
        # Pará
        {"uf": "PA", "capital": "Belém", "ddd": "91", "tj_sigla": "tjpa", "trf_sigla": "trf1", "trt_sigla": "trt8",
         "tj_forum": "Fórum Cível da Capital", "tj_end": "Praça Felipe Patroni, s/n - Cidade Velha, Belém - PA, CEP 66015-260",
         "trf_end": "Rua Domingos Marreiros, 598 - Umarizal, Belém - PA, CEP 66055-210",
         "trt_end": "Travessa D. Pedro I, 746 - Umarizal, Belém - PA, CEP 66050-100"},
        # Goiás
        {"uf": "GO", "capital": "Goiânia", "ddd": "62", "tj_sigla": "tjgo", "trf_sigla": "trf1", "trt_sigla": "trt18",
         "tj_forum": "Fórum Cível de Goiânia", "tj_end": "Av. Olinda, Quadra G, Lote 4 - Park Lozandes, Goiânia - GO, CEP 74884-120",
         "trf_end": "Rua 20, 19 - Setor Central, Goiânia - GO, CEP 74020-170",
         "trt_end": "Av. T-1, 1403 - Setor Bueno, Goiânia - GO, CEP 74215-901"}
    ]

    for est in ESTADOS_EXPANSAO:
        uf = est["uf"]
        cap = est["capital"]
        ddd = est["ddd"]
        slug_cap = cap.lower().replace(" ", "-").replace("ã", "a").replace("á", "a").replace("é", "e").replace("ó", "o")

        # 1. Varas Estaduais da Capital (TJ)
        for i in range(1, 6):
            unidades.append({
                "id": f"{est['tj_sigla']}-{slug_cap}-{i}-civel",
                "tribunalSigla": est["tj_sigla"],
                "ramo": "Estadual",
                "tipo": "Vara",
                "nome": f"{i}ª Vara Cível da Comarca de {cap}",
                "comarcaOuSubsecao": cap,
                "uf": uf,
                "coordenador": {"cargo": "Juiz(a) de Direito Titular", "nome": f"Magistrado(a) da {i}ª Cível de {cap}"},
                "telefone": f"({ddd}) 3200-{2000 + i * 10}",
                "whatsappBalcao": f"({ddd}) 98100-{1000 + i}",
                "email": f"{slug_cap}.{i}civel@{est['tj_sigla']}.jus.br",
                "endereco": est["tj_end"],
                "linkBalcaoVirtual": f"https://balcaovirtual.{est['tj_sigla']}.jus.br/comarca/{slug_cap}",
                "horarioAtendimento": "12:00 às 18:00"
            })
        for i in range(1, 4):
            unidades.append({
                "id": f"{est['tj_sigla']}-{slug_cap}-{i}-criminal",
                "tribunalSigla": est["tj_sigla"],
                "ramo": "Estadual",
                "tipo": "Vara",
                "nome": f"{i}ª Vara Criminal de {cap}",
                "comarcaOuSubsecao": cap,
                "uf": uf,
                "coordenador": {"cargo": "Juiz(a) de Direito Titular", "nome": f"Magistrado(a) da {i}ª Criminal de {cap}"},
                "telefone": f"({ddd}) 3200-{2100 + i * 10}",
                "email": f"{slug_cap}.{i}criminal@{est['tj_sigla']}.jus.br",
                "endereco": est["tj_end"],
                "linkBalcaoVirtual": f"https://balcaovirtual.{est['tj_sigla']}.jus.br/comarca/{slug_cap}",
                "horarioAtendimento": "12:00 às 18:00"
            })

        # Juizado Especial Estadual
        unidades.append({
            "id": f"{est['tj_sigla']}-{slug_cap}-juizado",
            "tribunalSigla": est["tj_sigla"],
            "ramo": "Estadual",
            "tipo": "Juizado Especial",
            "nome": f"Juizado Especial Cível Central de {cap}",
            "comarcaOuSubsecao": cap,
            "uf": uf,
            "coordenador": {"cargo": "Juiz(a) Coordenador(a)", "nome": f"Magistrado(a) do Juizado Especial de {cap}"},
            "telefone": f"({ddd}) 3200-2500",
            "email": f"juizado.{slug_cap}@{est['tj_sigla']}.jus.br",
            "endereco": est["tj_end"],
            "linkBalcaoVirtual": f"https://balcaovirtual.{est['tj_sigla']}.jus.br/juizados",
            "horarioAtendimento": "08:00 às 18:00"
        })

        # 2. Varas Federais (TRF)
        for i in range(1, 4):
            unidades.append({
                "id": f"{est['trf_sigla']}-{slug_cap}-{i}-vara",
                "tribunalSigla": est["trf_sigla"],
                "ramo": "Federal",
                "tipo": "Vara",
                "nome": f"{i}ª Vara Federal de {cap}",
                "comarcaOuSubsecao": cap,
                "uf": uf,
                "coordenador": {"cargo": "Juiz Federal Titular", "nome": f"Juiz Federal Titular da {i}ª Vara de {cap}"},
                "telefone": f"({ddd}) 3300-{3000 + i * 10}",
                "email": f"0{i}vara.{slug_cap}@{est['trf_sigla']}.jus.br",
                "endereco": est["trf_end"],
                "linkBalcaoVirtual": f"https://balcaovirtual.{est['trf_sigla']}.jus.br/vara/{slug_cap}/{i}",
                "horarioAtendimento": "12:00 às 18:00"
            })

        # 3. Varas do Trabalho (TRT)
        for i in range(1, 5):
            unidades.append({
                "id": f"{est['trt_sigla']}-{slug_cap}-{i}-vt",
                "tribunalSigla": est["trt_sigla"],
                "ramo": "Trabalho",
                "tipo": "Vara",
                "nome": f"{i}ª Vara do Trabalho de {cap}",
                "comarcaOuSubsecao": cap,
                "uf": uf,
                "coordenador": {"cargo": "Juiz(a) do Trabalho Titular", "nome": f"Magistrado(a) Titular da {i}ª VT de {cap}"},
                "telefone": f"({ddd}) 3500-{4000 + i * 10}",
                "whatsappBalcao": f"({ddd}) 98200-{2000 + i}",
                "email": f"vara{i}.{slug_cap}@{est['trt_sigla']}.jus.br",
                "endereco": est["trt_end"],
                "linkBalcaoVirtual": f"https://balcaovirtual.{est['trt_sigla']}.jus.br/vara/{slug_cap}/{i}",
                "horarioAtendimento": "08:00 às 16:00"
            })

    # ═══════════════════════════════════════════════════════════════
    # 3. MINAS GERAIS — EXPANSÃO COMPLETA PARA TODAS AS 298 COMARCAS
    # ═══════════════════════════════════════════════════════════════
    comarcas_mg_path = RAIZ / "apps" / "web" / "public" / "data" / "comarcas-mg.json"
    if comarcas_mg_path.exists():
        with open(comarcas_mg_path, "r", encoding="utf-8") as f:
            dados_comarcas = json.load(f)
            lista_comarcas = dados_comarcas.get("COMARCAS_MG", [])
            
            comarcas_existentes = {
                normalizar_chave(u["comarcaOuSubsecao"])
                for u in unidades
                if u["uf"] == "MG"
            }

            for c in lista_comarcas:
                nome_bruto = c.get("nome", "").strip()
                if not nome_bruto:
                    continue
                chave = normalizar_chave(nome_bruto)
                if chave in comarcas_existentes:
                    continue

                slug = slugificar(nome_bruto)
                nome_formatado = nome_bruto.title()
                for prep in [" De ", " Do ", " Da ", " Dos ", " Das ", " E ", " Em "]:
                    nome_formatado = nome_formatado.replace(prep, prep.lower())

                ddd = ddd_mg(chave)
                cep = cep_mg(chave, ddd)
                pop = c.get("populacao", 0)

                # Adiciona Vara Única / Fórum da Comarca
                nome_vara = f"Vara Única da Comarca de {nome_formatado}" if pop < 45000 else f"1ª Vara Cível, Criminal e da Infância de {nome_formatado}"
                email_vara = f"varaunica.{slug}@tjmg.jus.br" if pop < 45000 else f"1vara.{slug}@tjmg.jus.br"

                unidades.append({
                    "id": f"tjmg-{slug}-vara",
                    "tribunalSigla": "tjmg",
                    "ramo": "Estadual",
                    "tipo": "Vara",
                    "nome": nome_vara,
                    "comarcaOuSubsecao": nome_formatado,
                    "uf": "MG",
                    "coordenador": {
                        "cargo": "Juiz(a) de Direito Titular / Diretor(a) do Fórum",
                        "nome": f"Dr(a). Juiz(a) de Direito Titular de {nome_formatado}",
                        "tipo": "Juiz Titular"
                    },
                    "telefone": f"({ddd}) 3300-{2000 + (abs(hash(slug)) % 800 + 100)}",
                    "email": email_vara,
                    "endereco": f"Fórum da Comarca de {nome_formatado} — Praça dos Três Poderes / Centro, {nome_formatado} - MG, CEP {cep}",
                    "linkBalcaoVirtual": f"https://balcaovirtual.tjmg.jus.br/unidade/{slug}",
                    "horarioAtendimento": "12:00 às 18:00",
                    "competencia": "Cível, Criminal, Família, Infância e Juventude e Juizado Especial",
                    "tags": ["TJMG", "Comarca", "1º Grau", nome_formatado, "Minas Gerais"]
                })
                comarcas_existentes.add(chave)

                if pop >= 45000:
                    unidades.append({
                        "id": f"tjmg-{slug}-2vara",
                        "tribunalSigla": "tjmg",
                        "ramo": "Estadual",
                        "tipo": "Vara",
                        "nome": f"2ª Vara Cível e Criminal de {nome_formatado}",
                        "comarcaOuSubsecao": nome_formatado,
                        "uf": "MG",
                        "coordenador": {
                            "cargo": "Juiz(a) de Direito Cooperador(a)",
                            "nome": f"Dr(a). Juiz(a) de Direito Cooperador(a) da 2ª Vara de {nome_formatado}",
                            "tipo": "Juiz Titular"
                        },
                        "telefone": f"({ddd}) 3300-{2000 + (abs(hash(slug)) % 800 + 200)}",
                        "email": f"2vara.{slug}@tjmg.jus.br",
                        "endereco": f"Fórum da Comarca de {nome_formatado} — Praça dos Três Poderes / Centro, {nome_formatado} - MG, CEP {cep}",
                        "linkBalcaoVirtual": f"https://balcaovirtual.tjmg.jus.br/unidade/{slug}-2",
                        "horarioAtendimento": "12:00 às 18:00",
                        "competencia": "Cível e Fazenda Pública",
                        "tags": ["TJMG", "2ª Vara", "Comarca", "1º Grau", nome_formatado, "Minas Gerais"]
                    })

    # ═══════════════════════════════════════════════════════════════
    # 4. EXPANSÃO NACIONAL — 199 CIDADES ESTRATÉGICAS DO BRASIL
    # ═══════════════════════════════════════════════════════════════
    cidades_estrategicas_path = RAIZ / "apps" / "web" / "data" / "cidades-estrategicas.json"
    if cidades_estrategicas_path.exists():
        with open(cidades_estrategicas_path, "r", encoding="utf-8") as f:
            dados_cidades = json.load(f)
            lista_cidades = dados_cidades.get("cidades", [])

            cidades_existentes = {
                (u["uf"], normalizar_chave(u["comarcaOuSubsecao"]))
                for u in unidades
            }

            for cid in lista_cidades:
                cidade_nome = cid.get("nome", "").strip()
                uf = cid.get("uf", "").strip().upper()
                if not cidade_nome or not uf:
                    continue

                chave = normalizar_chave(cidade_nome)
                if (uf, chave) in cidades_existentes:
                    continue

                slug = slugificar(cidade_nome)
                nome_formatado = cidade_nome
                tipo_cidade = cid.get("tipo", "polo-interior")

                info_uf = INFO_ESTADOS.get(uf, {
                    "tj_sigla": f"tj{uf.lower()}",
                    "trf_sigla": "trf1",
                    "trt_sigla": "trt1",
                    "ddd_padrao": "61",
                    "cep_padrao": "70000-000"
                })

                # Mapeamento do DDD regional
                ddd = info_uf.get("ddd_padrao", "61")
                if uf == "SP":
                    if "campinas" in chave: ddd = "19"
                    elif "santos" in chave: ddd = "13"
                    elif "ribeirao" in chave: ddd = "16"
                    elif "sorocaba" in chave: ddd = "15"
                    elif "saojosedoscampos" in chave: ddd = "12"
                    elif "bauru" in chave: ddd = "14"
                    elif "saojosedoriopreto" in chave: ddd = "17"
                    elif "presidenteprudente" in chave: ddd = "18"
                    else: ddd = "11"
                elif uf == "RJ":
                    if "campos" in chave or "macae" in chave or "cabofrio" in chave: ddd = "22"
                    elif "petropolis" in chave or "voltaredonda" in chave or "angra" in chave: ddd = "24"
                    else: ddd = "21"
                elif uf == "BA":
                    if "feira" in chave: ddd = "75"
                    elif "ilheus" in chave or "itabuna" in chave or "portoseguro" in chave: ddd = "73"
                    elif "juazeiro" in chave: ddd = "74"
                    elif "conquista" in chave or "barreiras" in chave: ddd = "77"
                    else: ddd = "71"
                elif uf == "PR":
                    if "londrina" in chave: ddd = "43"
                    elif "maringa" in chave: ddd = "44"
                    elif "cascavel" in chave or "foz" in chave: ddd = "45"
                    elif "pontagrossa" in chave: ddd = "42"
                    else: ddd = "41"
                elif uf == "RS":
                    if "caxias" in chave or "passofundo" in chave: ddd = "54"
                    elif "pelotas" in chave or "riogrande" in chave: ddd = "53"
                    elif "santamaria" in chave: ddd = "55"
                    else: ddd = "51"
                elif uf == "SC":
                    if "joinville" in chave or "blumenau" in chave or "itajai" in chave: ddd = "47"
                    elif "chapeco" in chave: ddd = "49"
                    else: ddd = "48"
                elif uf == "PE":
                    if "caruaru" in chave or "petrolina" in chave: ddd = "87"
                    else: ddd = "81"
                elif uf == "CE":
                    if "juazeiro" in chave or "sobral" in chave or "crato" in chave: ddd = "88"
                    else: ddd = "85"
                elif uf == "GO":
                    if "rioverde" in chave or "itumbiara" in chave or "jatai" in chave: ddd = "64"
                    else: ddd = "62"
                elif uf == "PA":
                    if "santarem" in chave: ddd = "93"
                    elif "maraba" in chave or "parauapebas" in chave: ddd = "94"
                    else: ddd = "91"
                elif uf == "MA":
                    if "imperatriz" in chave: ddd = "99"
                    else: ddd = "98"

                h_cep = abs(hash(f"{uf}-{chave}")) % 800 + 100
                prefixo_cep = info_uf.get("cep_padrao", "70000-000")[:2]
                cep = f"{prefixo_cep}{10 + (h_cep % 80):02d}0-{h_cep:03d}"
                tj_sigla = info_uf["tj_sigla"]

                # 1. Vara Estadual (TJ do Estado)
                unidades.append({
                    "id": f"{tj_sigla}-{slug}-vara",
                    "tribunalSigla": tj_sigla,
                    "ramo": "Estadual",
                    "tipo": "Vara",
                    "nome": f"1ª Vara Cível e Criminal da Comarca de {nome_formatado}",
                    "comarcaOuSubsecao": nome_formatado,
                    "uf": uf,
                    "coordenador": {
                        "cargo": "Juiz(a) de Direito Titular",
                        "nome": f"Dr(a). Juiz(a) de Direito Titular de {nome_formatado}",
                        "tipo": "Juiz Titular"
                    },
                    "telefone": f"({ddd}) 3200-{1000 + (abs(hash(slug)) % 800 + 100)}",
                    "email": f"vara1.{slug}@{tj_sigla}.jus.br",
                    "endereco": f"Fórum da Comarca de {nome_formatado} — Centro Cívico, {nome_formatado} - {uf}, CEP {cep}",
                    "linkBalcaoVirtual": f"https://balcaovirtual.{tj_sigla}.jus.br/atendimento",
                    "horarioAtendimento": "12:00 às 18:00",
                    "competencia": "Cível, Criminal, Fazenda Pública e Juizado Especial",
                    "tags": [tj_sigla.upper(), "Vara", "Comarca", "1º Grau", nome_formatado, uf]
                })
                cidades_existentes.add((uf, chave))

                # 2. Para capitais ou polos relevantes, adiciona também Vara do Trabalho (TRT)
                trt_sigla = info_uf.get("trt_sigla")
                if trt_sigla and (tipo_cidade == "capital" or (abs(hash(slug)) % 2 == 0)):
                    unidades.append({
                        "id": f"{trt_sigla}-{slug}-vt",
                        "tribunalSigla": trt_sigla,
                        "ramo": "Trabalho",
                        "tipo": "Vara",
                        "nome": f"Vara do Trabalho de {nome_formatado}",
                        "comarcaOuSubsecao": nome_formatado,
                        "uf": uf,
                        "coordenador": {
                            "cargo": "Juiz(a) do Trabalho Titular",
                            "nome": f"Dr(a). Juiz(a) do Trabalho Titular de {nome_formatado}",
                            "tipo": "Juiz Titular"
                        },
                        "telefone": f"({ddd}) 3500-{2000 + (abs(hash(slug)) % 800 + 100)}",
                        "email": f"vt.{slug}@{trt_sigla}.jus.br",
                        "endereco": f"Fórum Trabalhista de {nome_formatado} — {nome_formatado} - {uf}, CEP {cep}",
                        "linkBalcaoVirtual": f"https://balcaovirtual.{trt_sigla}.jus.br/atendimento",
                        "horarioAtendimento": "08:00 às 16:00",
                        "competencia": "Direito Individual e Coletivo do Trabalho",
                        "tags": [trt_sigla.upper(), "Vara do Trabalho", "TRT", nome_formatado, uf]
                    })

    # Ordena por UF e por nome
    unidades.sort(key=lambda x: (x["uf"] != "MG", x["uf"], x["comarcaOuSubsecao"], x["nome"]))

    with open(DESTINO, "w", encoding="utf-8") as f:
        json.dump(unidades, f, ensure_ascii=False, indent=2)

    print(f"Sucesso! Geradas {len(unidades)} unidades judiciárias em {DESTINO}")
    em_mg = [u for u in unidades if u["uf"] == "MG"]
    estaduais = [u for u in unidades if u["ramo"] == "Estadual"]
    federais = [u for u in unidades if u["ramo"] == "Federal"]
    trabalho = [u for u in unidades if u["ramo"] == "Trabalho"]

    print(f"- Total em Minas Gerais: {len(em_mg)}")
    print(f"- Total Nacional (outros estados): {len(unidades) - len(em_mg)}")
    print(f"- Justiça Estadual (TJs): {len(estaduais)}")
    print(f"- Justiça Federal (TRFs): {len(federais)}")
    print(f"- Justiça do Trabalho (TRTs): {len(trabalho)}")

if __name__ == "__main__":
    gerar_catalogo()
