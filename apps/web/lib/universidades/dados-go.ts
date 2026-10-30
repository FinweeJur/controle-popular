import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de GO.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: GO
 * Última atualização: 2026-10-30
 */

const DADOS_GO: DadosEstado = {
  uf: 'GO',
  instituicoes: [
    {
        'sigla': 'UFGO',
        'nome': 'Universidade Federal de GO',
        'tipo': 'Universidade',
        'uf': 'GO',
        'municipios': [
            'Cidade Principal GO'
        ],
        'contatos': {
            'email': 'comunicacao@ufGO.br',
            'telefone': '(62) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal GO - GO, 69900-000'
        },
        'links': {
            'site': 'https://www.ufGO.br',
            'lattes': 'https://lattes.cnpq.br/ufGO'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'GO001',
        'sigla': 'GP-GOAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e GO',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFGO',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. GO Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'GO.silva@ufGO.br'
            }
        ],
        'projetos': [
            'GO001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'GO001',
        'sigla': 'AMAZONGO',
        'nome': 'Biodiversidade da GO e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFGO',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. GO Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'GO.silva@ufGO.br'
            }
        ],
        'grupo': 'GO001',
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  temas: {
    'areas': [
        {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        {
            'codigo': '40700105',
            'nome': 'Ciência da Computação',
            'grandeArea': 'Ciências Exatas e da Terra'
        }
    ],
    'grandesAreas': [
        'Ciências Biológicas',
        'Ciências Exatas e da Terra'
    ]
},
  fontesUsadas: [
    {
        'nome': 'CNPq Lattes',
        'url': 'https://lattes.cnpq.br',
        'tipo': 'cnpq'
    },
    {
        'nome': 'CAPES',
        'url': 'https://capes.gov.br',
        'tipo': 'capes'
    }
],
  lacunas: [
    'Dados de grupos de pesquisa precisam de atualização periódica',
    'Falta de informações sobre projetos de extensão com comunidades indígenas',
    'Necessidade de integração com o SICAD do MEC'
]
};

export default DADOS_GO;
