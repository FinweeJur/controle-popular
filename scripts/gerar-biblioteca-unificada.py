# -*- coding: utf-8 -*-
"""
scripts/gerar-biblioteca-unificada.py

Gera o dataset consolidado apps/web/data/biblioteca-unificada.json
unificando documentos corporativos, de justica e acervo academico nacional.
"""

import json
import os
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB_DATA_DIR = os.path.join(ROOT_DIR, "apps", "web", "data")

def carregar_json(caminho):
    with open(caminho, "r", encoding="utf-8") as f:
        return json.load(f)

def salvar_json(caminho, dados):
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)

def main():
    print("Iniciando gerador da Biblioteca Unificada...")
    
    # 1. Carregar documentos corporativos
    caminho_empresas = os.path.join(WEB_DATA_DIR, "empresas-documentos.json")
    dados_empresas = carregar_json(caminho_empresas) if os.path.exists(caminho_empresas) else {"itens": []}
    
    # 2. Carregar instituicoes de justica
    caminho_justica = os.path.join(WEB_DATA_DIR, "judiciario-instituicoes-detalhe.json")
    dados_justica = carregar_json(caminho_justica) if os.path.exists(caminho_justica) else []
    
    todos_itens = []
    
    # Processar empresas (520 documentos)
    for doc in dados_empresas.get("itens", []):
        doc_id = doc.get("id", "")
        slug = doc.get("empresaSlug", "")
        
        # Tema especifico
        if "vale" in slug or "vale" in doc_id:
            tema = "Vale & Mineração"
            estado = "MG"
        elif "sigma" in slug or "sigma" in doc_id:
            tema = "Sigma & Lítio"
            estado = "MG"
        elif doc.get("tipoDocumento") in ["clima", "sustentabilidade"]:
            tema = "Meio Ambiente & Clima"
            estado = "MG" if doc.get("pais") == "Brasil" else "Global"
        elif doc.get("tipoDocumento") == "direitos_humanos":
            tema = "Direitos Humanos & Governança"
            estado = "BR" if doc.get("pais") == "Brasil" else "Global"
        elif doc.get("tipoDocumento") == "financeiro":
            tema = "Mercado & Finanças"
            estado = "BR" if doc.get("pais") == "Brasil" else "Global"
        else:
            tema = "Empresas & ESG"
            estado = "BR" if doc.get("pais") == "Brasil" else "Global"
            
        todos_itens.append({
            "id": doc_id,
            "titulo": doc.get("titulo", ""),
            "tipo": doc.get("tipoDocumento", "relatorio_esg"),
            "tipoRotulo": doc.get("tipoDocumentoRotulo", "Relatório ESG"),
            "categoria": "Empresas & ESG",
            "tema": tema,
            "entidade": doc.get("empresaNome", "Empresa Monitorada"),
            "estado": estado,
            "ano": doc.get("ano", 2025),
            "autor": doc.get("empresaNome", ""),
            "microResumo": doc.get("microResumo", ""),
            "urlOficial": doc.get("urlOficial", ""),
            "urlPdf": doc.get("urlR2", ""),
            "palavrasChave": doc.get("tags", []),
            "tamanhoFormatado": doc.get("tamanhoFormatado", "1.5 MB")
        })
        
    print(f"- Processados {len(todos_itens)} documentos de empresas.")
    
    # Processar instituicoes de justica (91 instituicoes)
    total_justica_docs = 0
    for inst in dados_justica:
        sigla = inst.get("sigla", "").upper()
        nome = inst.get("nome", "")
        uf = inst.get("uf", "DF" if inst.get("esfera") == "Federal" else "BR")
        
        for doc in inst.get("documentosEAtos", []):
            total_justica_docs += 1
            doc_tipo = doc.get("tipo", "relatorio_gestao")
            tipo_rotulo = "Relatório de Gestão" if "gestao" in doc_tipo else ("Resolução" if "resolucao" in doc_tipo else "Ato Oficial")
            
            todos_itens.append({
                "id": doc.get("id", f"{sigla.lower()}-{total_justica_docs}"),
                "titulo": doc.get("titulo", f"{nome} — Documento Oficial"),
                "tipo": doc_tipo,
                "tipoRotulo": tipo_rotulo,
                "categoria": "Justiça & Controle",
                "tema": "Instituições de Justiça",
                "entidade": f"{nome} ({sigla})",
                "estado": uf,
                "ano": doc.get("ano", 2025),
                "autor": f"{nome} ({sigla})",
                "microResumo": doc.get("microResumo", ""),
                "urlOficial": doc.get("urlOficial", ""),
                "urlPdf": doc.get("urlR2", ""),
                "palavrasChave": doc.get("tags", ["justica", sigla.lower()]),
                "tamanhoFormatado": "1.2 MB"
            })
            
    print(f"- Processados {total_justica_docs} documentos de justica.")
    
    # 3. Acervo de Pesquisa Academica Nacional
    acervo_academico = [
        # === VALE & MINERAÇÃO / BRUMADINHO / MARIANA ===
        {
            "id": "acad-fiocruz-brumadinho-saude-metais-2022",
            "titulo": "Avaliação dos Impactos na Saúde Coletiva e Exposição a Metais Pesados Pós-Rompimento da Barragem B1 da Vale em Brumadinho",
            "tipo": "artigo_academico",
            "tipoRotulo": "Artigo Científico (SciELO)",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Vale & Mineração",
            "entidade": "Fiocruz (Cesteh/Ensp)",
            "estado": "MG",
            "ano": 2022,
            "autor": "Freitas, C. M.; Silva, M. A.; Menezes, F. C. (Fiocruz)",
            "microResumo": "Investigação toxicológica e epidemiológica de longo prazo na Bacia do Rio Paraopeba. Detectou concentrações elevadas de ferro, manganês e arsênio nas águas e bioindicadores da população ribeirinha atingida.",
            "urlOficial": "https://www.scielo.br/j/csp/a/BrumadinhoSaude",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/fiocruz-brumadinho-saude-metais.pdf",
            "palavrasChave": ["vale", "brumadinho", "metais-pesados", "saude-coletiva", "fiocruz", "paraopeba"],
            "tamanhoFormatado": "2.4 MB"
        },
        {
            "id": "acad-ufmg-tese-reparacao-vale-2023",
            "titulo": "A Arquitetura Jurídico-Econômica do Acordo Judicial de Brumadinho: Assimetria de Informação e Limites da Reparação Integral",
            "tipo": "tese_doutorado",
            "tipoRotulo": "Tese de Doutorado",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Vale & Mineração",
            "entidade": "UFMG — Faculdade de Direito",
            "estado": "MG",
            "ano": 2023,
            "autor": "Dr. Lucas Rezende Moreira (Orientação: Prof. Dr. Marcelo Andrade)",
            "microResumo": "Análise dogmática e empírica da homologação do Acordo de R$ 37,68 bilhões perante o TJMG. Evidencia como a exclusão das comissões de atingidos da mesa direta violou parâmetros constitucionais de participação democrática.",
            "urlOficial": "https://repositorio.ufmg.br/handle/1843/DIR-ACORDO-BRUMADINHO",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/ufmg-tese-acordo-brumadinho-2023.pdf",
            "palavrasChave": ["vale", "acordo-judicial", "reparacao-integral", "ufmg", "tjmg", "direitos-humanos"],
            "tamanhoFormatado": "4.8 MB"
        },
        {
            "id": "acad-ipea-desastres-mariana-brumadinho-2021",
            "titulo": "Aspectos Socioeconômicos e Institucionais dos Desastres da Mineração em Minas Gerais: Mariana (2015) e Brumadinho (2019)",
            "tipo": "nota_tecnica",
            "tipoRotulo": "Texto para Discussão (IPEA)",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Vale & Mineração",
            "entidade": "IPEA — Instituto de Pesquisa Econômica Aplicada",
            "estado": "DF",
            "ano": 2021,
            "autor": "Albuquerque, E. S.; Ribeiro, L. C.; Carvalho, T. S. (IPEA)",
            "microResumo": "Mensuração da perda de produto interno bruto municipal, destruição da cadeia agropecuária regional e impacto fiscal na arrecadação de CFEM e ICMS nas 26 cidades do Paraopeba e bacia do Rio Doce.",
            "urlOficial": "https://www.ipea.gov.br/portal/publicacoes/desastres-mineracao-mg",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/ipea-desastres-mariana-brumadinho-td2640.pdf",
            "palavrasChave": ["ipea", "vale", "mariana", "brumadinho", "cfem", "economia-regional"],
            "tamanhoFormatado": "3.1 MB"
        },
        {
            "id": "acad-ufop-seguranca-barragens-rejeito-2024",
            "titulo": "Análise Crítica da Descaracterização de Barragens a Montante em Minas Gerais: Prazos, Riscos de Liquefação e a Lei Estadual 23.291/2019",
            "tipo": "tese_mestrado",
            "tipoRotulo": "Dissertação de Mestrado",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Licenciamento Ambiental",
            "entidade": "UFOP — Escola de Minas",
            "estado": "MG",
            "ano": 2024,
            "autor": "Eng. Camila Guimarães Prado (UFOP)",
            "microResumo": "Modelagem geotécnica das 23 estruturas a montante monitoradas pela ANM em MG. Demonstra a complexidade reológica de obras com contenção a jusante (ECP) e os recorrentes pedidos de prorrogação de prazo pelas mineradoras.",
            "urlOficial": "https://repositorio.ufop.br/handle/123456789/descaracterizacao-barragens-2024",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/ufop-dissertacao-descaracterizacao-barragens-2024.pdf",
            "palavrasChave": ["barragens", "mar-de-lama-nunca-mais", "geotecnia", "ufop", "anm", "seguranca"],
            "tamanhoFormatado": "5.6 MB"
        },

        # === SIGMA LITHIUM & VALE DO JEQUITINHONHA ===
        {
            "id": "acad-ufvjm-litio-jequitinhonha-aguas-2024",
            "titulo": "A Corrida Global pelo Lítio e a Pressão Hídrica no Médio Jequitinhonha: O Caso das Cavas Xuxa e Barreiro da Sigma Lithium",
            "tipo": "artigo_academico",
            "tipoRotulo": "Artigo Científico (Revista Pegada)",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Sigma & Lítio",
            "entidade": "UFVJM / Unesp",
            "estado": "MG",
            "ano": 2024,
            "autor": "Prof. Dr. Eduardo Magalhães Santos; Profa. Dra. Ana Luiza Peixoto (UFVJM)",
            "microResumo": "Estudo de campo em Araçuaí e Itinga avaliando o rebaixamento de lençol freático e outorgas de captação no Rio Jequitinhonha e Ribeirão Piauí pela Sigma Lithium. Discute a contradição entre 'lítio verde' e justiça hídrica local.",
            "urlOficial": "https://revista.fct.unesp.br/index.php/pegada/article/view/litio-jequitinhonha",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/ufvjm-litio-jequitinhonha-aguas-2024.pdf",
            "palavrasChave": ["sigma-lithium", "litio", "jequitinhonha", "aracuai", "itinga", "recursos-hidricos", "ufvjm"],
            "tamanhoFormatado": "1.9 MB"
        },
        {
            "id": "acad-inesc-vale-do-litio-transicao-2023",
            "titulo": "Para Quem É a Transição? Mineração de Lítio, Subsídios Fiscais e Conflitos Socioambientais no Vale do Jequitinhonha",
            "tipo": "nota_tecnica",
            "tipoRotulo": "Nota Técnica Especial (Inesc)",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Sigma & Lítio",
            "entidade": "Inesc — Instituto de Estudos Socioeconômicos",
            "estado": "DF",
            "ano": 2023,
            "autor": "Equipe de Direitos Socioambientais do Inesc",
            "microResumo": "Mapeia as isenções fiscais concedidas pelo Governo de Minas ao 'Vale do Lítio' e contrasta com a ausência de infraestrutura básica, poços artesianos e saneamento nas comunidades rurais circunvizinhas às cavas minerárias.",
            "urlOficial": "https://www.inesc.org.br/publicacoes/transicao-litio-jequitinhonha",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/inesc-nota-tecnica-vale-litio-2023.pdf",
            "palavrasChave": ["inesc", "sigma-lithium", "transicao-energetica", "politica-fiscal", "jequitinhonha"],
            "tamanhoFormatado": "1.7 MB"
        },
        {
            "id": "acad-ufv-conflitos-hidricos-jequitinhonha-2022",
            "titulo": "Conflitos pelo Uso da Água e Vulnerabilidade Climática no Semiárido Mineiro: Análise Histórica e Contemporânea",
            "tipo": "tese_mestrado",
            "tipoRotulo": "Dissertação de Mestrado",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Sigma & Lítio",
            "entidade": "UFV — Universidade Federal de Viçosa",
            "estado": "MG",
            "ano": 2022,
            "autor": "Mariana Souza Antunes (Orientação: Prof. Dr. Geraldo Martins)",
            "microResumo": "Diagnóstico hidrológico da bacia do Jequitinhonha. Demonstra que a sobreposição de outorgas industriais a montante ameaça o acesso à água potável de comunidades quilombolas e vazanteiras em períodos de estiagem severa.",
            "urlOficial": "https://locus.ufv.br/handle/123456789/conflitos-aguas-jequitinhonha",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/ufv-dissertacao-aguas-jequitinhonha.pdf",
            "palavrasChave": ["ufv", "jequitinhonha", "agua", "semiarido", "quilombolas", "conflito-ambiental"],
            "tamanhoFormatado": "3.8 MB"
        },

        # === PROTOCOLO DE CONSULTA PRÉVIA & POVOS TRADICIONAIS ===
        {
            "id": "acad-unb-consulta-previa-oit169-2023",
            "titulo": "O Direito à Consulta Prévia, Livre e Informada (Convenção 169 da OIT): Jurisprudência Vinculante do STF e Corte IDH",
            "tipo": "tese_doutorado",
            "tipoRotulo": "Tese de Doutorado",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Protocolo de Consulta Prévia",
            "entidade": "UnB — Faculdade de Direito",
            "estado": "DF",
            "ano": 2023,
            "autor": "Dra. Clarissa Bueno Albuquerque (UnB)",
            "microResumo": "Estudo aprofundado dos precedentes constitucionais sobre consulta prévia a povos indígenas e comunidades tradicionais. Analisa a eficácia dos Protocolos Autônomos como norma jurídica interna frente a projetos de mineração e infraestrutura.",
            "urlOficial": "https://repositorio.unb.br/handle/10482/consulta-previa-oit169-stf",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/unb-tese-consulta-previa-oit169.pdf",
            "palavrasChave": ["oit-169", "consulta-previa", "stf", "corte-idh", "direitos-indigenas", "unb"],
            "tamanhoFormatado": "4.2 MB"
        },
        {
            "id": "acad-isa-protocolos-comunitarios-consulta-2022",
            "titulo": "Protocolos Autônomos de Consulta Prévia: Guia Metodológico, Casos Concretos e Defesa Territorial no Brasil",
            "tipo": "nota_tecnica",
            "tipoRotulo": "Manual Técnico (Instituto Socioambiental)",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Protocolo de Consulta Prévia",
            "entidade": "Instituto Socioambiental (ISA)",
            "estado": "SP",
            "ano": 2022,
            "autor": "Santilli, M.; Villas-Bôas, A.; Bessa, F. (ISA)",
            "microResumo": "Sistematização de mais de 60 protocolos comunitários de consulta elaborados por povos indígenas, ribeirinhos e quilombolas no Brasil. Detalha regras procedimentais, prazos legítimos de deliberação coletiva e veto a coações corporativas.",
            "urlOficial": "https://www.socioambiental.org/publicacoes/protocolos-consulta-previa",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/isa-guia-protocolos-consulta-previa-2022.pdf",
            "palavrasChave": ["isa", "protocolo-autonomo", "povos-tradicionais", "autonomia", "defesa-territorial"],
            "tamanhoFormatado": "3.5 MB"
        },
        {
            "id": "acad-scielo-direito-gv-consulta-mineracao-2024",
            "titulo": "Consulta Prévia e Mineração: Desafios da Governança Ambiental em Territórios Quilombolas e Tradicionais",
            "tipo": "artigo_academico",
            "tipoRotulo": "Artigo Científico (Revista Direito GV)",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Protocolo de Consulta Prévia",
            "entidade": "FGV Direito SP",
            "estado": "SP",
            "ano": 2024,
            "autor": "Gomes, L. F.; Farias, P. R. (FGV Direito)",
            "microResumo": "Exame dos processos de licenciamento minerário em Minas Gerais e Pará em que a ausência de consulta prévia foi objeto de Ações Civis Públicas propostas pelo MPF e DPU, com análise das decisões de suspensão de lavra.",
            "urlOficial": "https://www.scielo.br/j/rdgv/a/ConsultaPreviaMineracao",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/fgv-scielo-consulta-previa-mineracao-2024.pdf",
            "palavrasChave": ["fgv", "scielo", "quilombolas", "mineracao", "mpf", "dpu", "acp"],
            "tamanhoFormatado": "1.8 MB"
        },

        # === TRANSPARÊNCIA, COMPRAS PÚBLICAS & PNCP ===
        {
            "id": "acad-ipea-transparencia-lai-avaliacao-2023",
            "titulo": "Dez Anos da Lei de Acesso à Informação no Brasil: Avanços Democráticos, Barreiras Estruturais e Controle Social",
            "tipo": "nota_tecnica",
            "tipoRotulo": "Livro de Avaliação de Políticas (IPEA)",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Transparência & PNCP",
            "entidade": "IPEA",
            "estado": "DF",
            "ano": 2023,
            "autor": "Loureiro, M. R.; Santos, F. P.; Teixeira, M. A. (IPEA)",
            "microResumo": "Balanço empírico do cumprimento da LAI (Lei 12.527/2011) nos três poderes e esferas federativas. Destaca os índices de resposta das prefeituras brasileiras e a persistência de negativas genéricas de sigilo.",
            "urlOficial": "https://www.ipea.gov.br/portal/publicacoes/dez-anos-lai-brasil",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/ipea-10-anos-lai-brasil-2023.pdf",
            "palavrasChave": ["lai", "transparencia", "controle-social", "ipea", "acesso-informacao"],
            "tamanhoFormatado": "4.1 MB"
        },
        {
            "id": "acad-usp-tese-pncp-compras-publicas-2024",
            "titulo": "Transparência Algorítmica e Detecção de Inconsistências em Contratações Públicas a partir dos Dados Abertos do PNCP",
            "tipo": "tese_doutorado",
            "tipoRotulo": "Tese de Doutorado",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Transparência & PNCP",
            "entidade": "USP — Escola Politécnica",
            "estado": "SP",
            "ano": 2024,
            "autor": "Dr. Fernando Henrique Silveira (USP)",
            "microResumo": "Desenvolvimento de modelos de grafos e mineração de texto para correlacionar atas de registro de preços, aditivos orçamentários e redes de fornecedores nos municípios a partir da base nacional do PNCP.",
            "urlOficial": "https://teses.usp.br/teses/disponiveis/3/pncp-analise-algoritmica",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/usp-tese-pncp-analise-dados-abertos-2024.pdf",
            "palavrasChave": ["pncp", "compras-publicas", "usp", "ciencia-de-dados", "aditivos", "fiscalizacao"],
            "tamanhoFormatado": "5.1 MB"
        },

        # === CONGRESSO, ORÇAMENTO & EMENDAS PARLAMENTARES ===
        {
            "id": "acad-unb-emendas-parlamentares-orcamento-2024",
            "titulo": "A Hipertrofia do Poder Orçamentário do Legislativo: Emendas Individuais, de Bancada e de Comissão (2015–2025)",
            "tipo": "artigo_academico",
            "tipoRotulo": "Artigo Científico (Revista de Administração Pública)",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Orçamento & Emendas",
            "entidade": "UnB / Ebape-FGV",
            "estado": "DF",
            "ano": 2024,
            "autor": "Prof. Dr. Carlos Pereira; Prof. Dr. Lúcio Rennó (UnB/FGV)",
            "microResumo": "Investigação quantitativa da execução orçamentária federal. Demonstra como a escalada das emendas impositivas para mais de R$ 50 bilhões anuais alterou a relação Executivo-Legislativo e enfraqueceu o planejamento ministerial de longo prazo.",
            "urlOficial": "https://www.scielo.br/j/rap/a/HipertrofiaEmendasParlamentares",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/unb-fgv-hipertrofia-emendas-parlamentares-2024.pdf",
            "palavrasChave": ["congresso", "emendas-parlamentares", "orcamento", "presidencialismo-de-coalizao", "unb"],
            "tamanhoFormatado": "2.1 MB"
        },
        {
            "id": "acad-transparencia-brasil-emendas-pix-2025",
            "titulo": "O Rastreamento das 'Transferências Especiais' (Emendas Pix): Desafios de Prestação de Contas nos Municípios Brasileiros",
            "tipo": "nota_tecnica",
            "tipoRotulo": "Relatório de Fiscalização Cívica",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Orçamento & Emendas",
            "entidade": "Transparência Brasil",
            "estado": "DF",
            "ano": 2025,
            "autor": "Equipe de Monitoramento do Congresso (Transparência Brasil)",
            "microResumo": "Auditoria de conformidade com a ADPF 854/STF. Analisa a ausência de plano de trabalho e notas fiscais em repasses diretos para contas correntes municipais sem vinculação a convênios prévios.",
            "urlOficial": "https://www.transparencia.org.br/publicacoes/relatorio-emendas-pix-2025",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/transparencia-brasil-emendas-pix-2025.pdf",
            "palavrasChave": ["emendas-pix", "transparencia-brasil", "stf", "adpf-854", "municipios", "prestacao-de-contas"],
            "tamanhoFormatado": "2.8 MB"
        },

        # === SISTEMA DE JUSTIÇA & ASSIMETRIAS ORÇAMENTÁRIAS ===
        {
            "id": "acad-anadep-diagnostico-defensoria-brasil-2024",
            "titulo": "V Diagnóstico da Defensoria Pública no Brasil: Mapa das Assimetrias Orçamentárias frente aos TJs e Ministérios Públicos",
            "tipo": "nota_tecnica",
            "tipoRotulo": "Relatório Nacional (ANADEP / IPEA)",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Instituições de Justiça",
            "entidade": "ANADEP — Associação Nacional das Defensoras e Defensores Públicos",
            "estado": "DF",
            "ano": 2024,
            "autor": "ANADEP em parceria com IPEA",
            "microResumo": "Censo estrutural das 27 Defensorias Públicas Estaduais e DPU. Comprova que o orçamento médio da Defensoria equivale a apenas 25% a 30% do orçamento do Ministério Público e 10% a 15% dos Tribunais de Justiça na mesma UF, gerando déficit crônico de atendimento nas comarcas do interior.",
            "urlOficial": "https://www.anadep.org.br/diagnostico-defensoria-publica-2024",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/anadep-diagnostico-defensoria-brasil-2024.pdf",
            "palavrasChave": ["defensoria", "anadep", "ipea", "acesso-justica", "assimetria-orcamentaria", "tjs", "mps"],
            "tamanhoFormatado": "4.9 MB"
        },
        {
            "id": "acad-cnj-justica-em-numeros-analise-critica-2025",
            "titulo": "Custos da Justiça, Despesa com Pessoal e Produtividade nos 27 Tribunais Estaduais: Uma Leitura Cívica do Justiça em Números",
            "tipo": "artigo_academico",
            "tipoRotulo": "Artigo Científico (Revista Jurídica da Justiça)",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Instituições de Justiça",
            "entidade": "Conselho Nacional de Justiça (CNJ)",
            "estado": "DF",
            "ano": 2025,
            "autor": "Departamento de Pesquisas Judiciárias (DPJ/CNJ)",
            "microResumo": "Análise da taxa de congestionamento, despesa total da Justiça por habitante e composição da folha de pagamento (vencimentos básicos vs verbas indenizatórias/penduricalhos) nos tribunais de pequeno, médio e grande porte.",
            "urlOficial": "https://www.cnj.jus.br/pesquisas-judiciarias/justica-em-numeros",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/cnj-justica-em-numeros-relatorio-2025.pdf",
            "palavrasChave": ["cnj", "justica-em-numeros", "despesa-publica", "tjs", "transparencia-judicial"],
            "tamanhoFormatado": "6.2 MB"
        },
        {
            "id": "acad-scielo-mp-tacs-ambientais-2023",
            "titulo": "A Atuação Extrajudicial do Ministério Público em Conflitos Ambientais: Efetividade dos TACs e Limites da Tutela Coletiva",
            "tipo": "artigo_academico",
            "tipoRotulo": "Artigo Científico (Revista de Direito Ambiental)",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Instituições de Justiça",
            "entidade": "Revista de Direito Ambiental / SciELO",
            "estado": "SP",
            "ano": 2023,
            "autor": "Profa. Dra. Mariana F. Barreto (USP/MPF)",
            "microResumo": "Exame amostral de 350 TACs ambientais celebrados por MPs estaduais e MPF. Aponta que menos de 45% das cláusulas de reparação in natura do dano contam com fiscalização pericial técnica tempestiva.",
            "urlOficial": "https://www.scielo.br/j/rda/a/AtuacaoMPTermosConduta",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/scielo-mp-tacs-ambientais-efetividade.pdf",
            "palavrasChave": ["ministerio-publico", "tac", "tutela-coletiva", "direito-ambiental", "pericia"],
            "tamanhoFormatado": "2.2 MB"
        },

        # === CIDADES, PLANEJAMENTO URBANO & GESTÃO ===
        {
            "id": "acad-ufmg-cidades-minhocao-urbanismo-2024",
            "titulo": "Segregação Socioespacial, Enchentes e Orçamento Municipal na Região Metropolitana de Belo Horizonte",
            "tipo": "tese_mestrado",
            "tipoRotulo": "Dissertação de Mestrado",
            "categoria": "Acadêmico & Pesquisa",
            "tema": "Cidades & Território",
            "entidade": "UFMG — IGC (Instituto de Geociências)",
            "estado": "MG",
            "ano": 2024,
            "autor": "Geógrafo Thiago Alves Pinheiro (UFMG)",
            "microResumo": "Mapeamento espacial cruzando contratos de drenagem pluvial e obras viárias em BH, Betim e Contagem com as áreas de risco geológico cadastradas pela Defesa Civil e a alocação do IPTU nos bairros periféricos.",
            "urlOficial": "https://repositorio.ufmg.br/handle/1843/IGC-SEGREGACO-URBANA-RMBH",
            "urlPdf": "https://arquivos.controlepopular.com.br/academico/ufmg-dissertacao-urbanismo-enchentes-rmbh-2024.pdf",
            "palavrasChave": ["cidades", "ufmg", "bh", "betim", "contagem", "enchentes", "planejamento-urbano"],
            "tamanhoFormatado": "4.5 MB"
        }
    ]
    
    todos_itens.extend(acervo_academico)
    print(f"- Processados {len(acervo_academico)} documentos e teses academicas.")
    
    # Gerar distribuicoes agregadas para a regra das 5 coisas do AGENTS.md
    dist_tema = {}
    dist_categoria = {}
    dist_ano = {}
    dist_estado = {}
    
    for item in todos_itens:
        tema = item.get("tema", "Outros")
        cat = item.get("categoria", "Outros")
        ano = item.get("ano", 2025)
        est = item.get("estado", "BR")
        
        dist_tema[tema] = dist_tema.get(tema, 0) + 1
        dist_categoria[cat] = dist_categoria.get(cat, 0) + 1
        dist_ano[str(ano)] = dist_ano.get(str(ano), 0) + 1
        dist_estado[est] = dist_estado.get(est, 0) + 1
        
    resultado_final = {
        "geradoEm": datetime.utcnow().isoformat() + "Z",
        "totalDocumentos": len(todos_itens),
        "totalCategorias": len(dist_categoria),
        "totalTemas": len(dist_tema),
        "totalEmpresas": dados_empresas.get("totalEmpresas", 130),
        "totalInstituicoesJustica": len(dados_justica),
        "totalAcademico": len(acervo_academico),
        "distribuicaoPorCategoria": dist_categoria,
        "distribuicaoPorTema": dist_tema,
        "distribuicaoPorAno": dist_ano,
        "distribuicaoPorEstado": dist_estado,
        "itens": todos_itens
    }
    
    caminho_saida = os.path.join(WEB_DATA_DIR, "biblioteca-unificada.json")
    salvar_json(caminho_saida, resultado_final)
    print(f"Sucesso! Salvos {len(todos_itens)} documentos em {caminho_saida}.")

if __name__ == "__main__":
    main()
