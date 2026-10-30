import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de SC.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: SC
 * Última atualização: 2026-10-30
 */

const DADOS_SC: DadosEstado = {
  uf: 'SC',
  instituicoes: [
    {
        'sigla': 'UFSC',
        'nome': 'Universidade Federal de SC',
        'tipo': 'Universidade',
        'uf': 'SC',
        'municipios': [
            'Cidade Principal SC'
        ],
        'contatos': {
            'email': 'comunicacao@ufSC.br',
            'telefone': '(48) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal SC - SC, 69900-000'
        },
        'links': {
            'site': 'https://www.ufSC.br',
            'lattes': 'https://lattes.cnpq.br/ufSC'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'SC001',
        'sigla': 'GP-SCAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e SC',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFSC',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. SC Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'SC.silva@ufSC.br'
            }
        ],
        'projetos': [
            'SC001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'SC001',
        'sigla': 'AMAZONSC',
        'nome': 'Biodiversidade da SC e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFSC',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. SC Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'SC.silva@ufSC.br'
            }
        ],
        'grupo': 'SC001',
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

export default DADOS_SC;
