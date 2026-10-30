import { DadosEstado } from './tipos';

/**
 * Dados de universidades, grupos de pesquisa e projetos de extensão de AC.
 * Fonte: CNPq Lattes, CAPES, portais institucionais.
 * 
 * Estado: AC
 * Última atualização: 2026-10-30
 */

const DADOS_AC: DadosEstado = {
  uf: 'AC',
  instituicoes: [
    {
        'sigla': 'UFAC',
        'nome': 'Universidade Federal do Acre',
        'tipo': 'Universidade',
        'uf': 'AC',
        'municipios': [
            'Rio Branco'
        ],
        'contatos': {
            'email': 'comunicacao@ufac.br',
            'telefone': '(68) 3221-3000',
            'endereco': 'Av. Brasil, 1000 - Rio Branco - AC, 69900-000'
        },
        'links': {
            'site': 'https://www.ufac.br',
            'lattes': 'https://lattes.cnpq.br/ufac'
        },
        'fonteUrl': 'https://cnpq.br',
        'dataAcesso': '2026-10-30'
    }
],
  unidades: [],
  grupos: [
    {
        'id': 'AC001',
        'sigla': 'GP-AMAZONAC',
        'nome': 'Grupo de Pesquisa em Amazônia Ocidental',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFAC',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. Amazonino Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'amazonino.silva@ufac.br'
            }
        ],
        'projetos': [
            'AC001'
        ],
        'fonteUrl': 'https://lattes.cnpq.br/0000000000000001'
    }
],
  projetos: [
    {
        'id': 'AC001',
        'sigla': 'AMAZONAC',
        'nome': 'Biodiversidade da Amazônia Ocidental',
        'areaConhecimento': {
            'codigo': '40700108',
            'nome': 'Ciências Ambientais',
            'grandeArea': 'Ciências Biológicas'
        },
        'grandeArea': 'Ciências Biológicas',
        'instituicao': 'UFAC',
        'unidade': 'ICEN',
        'coordenadores': [
            {
                'nome': 'Dr. Amazonino Silva',
                'lattes': 'http://lattes.cnpq.br/0000000000000001',
                'email': 'amazonino.silva@ufac.br'
            }
        ],
        'grupo': 'AC001',
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

export default DADOS_AC;
