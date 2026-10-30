import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de TO.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: TO
 * Última atualização: 2026-10-30
 */

const DADOS_TO: DadosEstado = {
  uf: 'TO',
  instituicoes: [
    {
        'sigla': 'UFTO',
        'nome': 'Universidade Federal de TO',
        'tipo': 'Universidade',
        'uf': 'TO',
        'municipios': [
            'Cidade Principal TO'
        ],
        'contatos': {
            'email': 'comunicacao@ufTO.br',
            'telefone': '(63) 3221-3000',
            'endereco': 'Av. Principal, 1000 - Cidade Principal TO - TO, 69900-000'
        },
        'links': {
            'site': 'https://www.ufTO.br',
            'lattes': 'https://lattes.cnpq.br/ufTO'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'TO001',
        'sigla': 'GP-TOAMAZON',
        'nome': 'Grupo de Pesquisa em Amazônia e TO',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFTO',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. TO Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'TO.silva@ufTO.br'
            }
        ],
        'projetos': [
            'TO001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'TO001',
        'sigla': 'AMAZONTO',
        'nome': 'Biodiversidade da TO e Região',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFTO',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. TO Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'TO.silva@ufTO.br'
            }
        ],
        'grupo': 'TO001',
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

export default DADOS_TO;
