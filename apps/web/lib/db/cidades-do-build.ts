// GERADO POR `scripts/gerar-cidades.mts` — NÃO EDITE À MÃO.
// Regenerado a cada `npm run prebuild`. Ver o cabeçalho do script para por
// que a lista é congelada no build em vez de consultada no runtime.
import type { Cidade, IdMunicipio } from "@/lib/db/queries/municipios";

const LINHAS: (Omit<Cidade, "id_municipio"> & { id_municipio: string })[] =
  [
    {
      "id_municipio": "3103405",
      "slug": "aracuai",
      "nome": "Araçuaí",
      "uf": "MG",
      "cnpj_prefeitura": "17963083000117",
      "dominio": "controlepopular.br/aracuai",
      "lat": -16.8484,
      "lng": -42.0662,
      "branding": {
        "nome_portal": "Controle Popular Araçuaí"
      },
      "fontes": {
        "paraopeba": false,
        "camara_host": "https://sapl.aracuai.mg.leg.br/",
        "citrolandia": false,
        "cnpj_camara": "26201996000197",
        "legislatura": {
          "fim": 2028,
          "inicio": 2025,
          "ordinal": 24
        },
        "datasus_6dig": "310340",
        "defesa_civil": false,
        "rotas_legadas": false,
        "camara_coletor": "sapl",
        "camara_sistema": "SAPL",
        "diario_oficial": "https://www.diariomunicipal.com.br/amm-mg/",
        "links_uteis_mg": true,
        "sic_prefeitura": "https://www.aracuai.mg.gov.br/transparencia/e-sic",
        "camara_cadeiras": 11,
        "prefeitura_host": "https://www.aracuai.mg.gov.br/",
        "legislacao_fonte": "camara_sapl",
        "vereadores_fonte": "sapl",
        "camara_proposicoes": false,
        "estado_municipios_count": 853,
        "legislacao_municipal_host": "https://sapl.aracuai.mg.leg.br/",
        "prefeitura_transparencia_host": "https://aracuai-mg.portaltp.com.br/",
        "prefeitura_transparencia_sistema": "portaltp"
      }
    },
    {
      "id_municipio": "3106200",
      "slug": "bh",
      "nome": "Belo Horizonte",
      "uf": "MG",
      "cnpj_prefeitura": "18715383000140",
      "dominio": "controlepopular.br/bh",
      "lat": -19.9167,
      "lng": -43.9345,
      "branding": {
        "slug": "bh",
        "nome_portal": "Controle Popular BH"
      },
      "fontes": {
        "ouvidoria": "https://prefeitura.pbh.gov.br/ouvidoria",
        "paraopeba": false,
        "sic_camara": "https://www.cmbh.mg.gov.br/participe/fale-com-a-camara",
        "camara_host": "https://www.cmbh.mg.gov.br/",
        "citrolandia": false,
        "cnpj_camara": "17316563000196",
        "cnpjs_orgao": [
          "18715383000140",
          "07252975000156",
          "17316563000196",
          "16692121000181",
          "16673998000125",
          "07276220000191"
        ],
        "datasus_6dig": "310620",
        "defesa_civil": false,
        "camara_render": "html",
        "rotas_legadas": false,
        "diario_oficial": "https://dom-web.pbh.gov.br/",
        "links_uteis_mg": true,
        "prefeitura_grp": true,
        "sic_prefeitura": "https://prefeitura.pbh.gov.br/lei-de-acesso-a-informacao",
        "prefeitura_host": "https://prefeitura.pbh.gov.br",
        "cnpjs_orgao_detalhe": {
          "07252975000156": "FUNDACAO MUNICIPAL DE CULTURA",
          "07276220000191": "FUNDACAO DE PARQUES MUNICIPAIS E ZOOBOTANICA",
          "16673998000125": "SUPERINTENDENCIA DE LIMPEZA URBANA",
          "16692121000181": "HOSPITAL METROPOLITANO ODILON BEHRENS - HOB",
          "17316563000196": "BELO HORIZONTE CAMARA MUNICIPAL",
          "18715383000140": "MUNICIPIO DE BELO HORIZONTE"
        },
        "diario_oficial_coletor": "https://api-dom.pbh.gov.br/api/",
        "estado_municipios_count": 853,
        "cnpjs_orgao_atualizado_em": "2026-09-23",
        "prefeitura_dados_abertos_api": "ckan",
        "prefeitura_dados_abertos_host": "https://ckan.pbh.gov.br/api/3/action/"
      }
    },
    {
      "id_municipio": "3106705",
      "slug": "betim",
      "nome": "Betim",
      "uf": "MG",
      "cnpj_prefeitura": "18715391000196",
      "dominio": "controlepopular.br/betim",
      "lat": -19.9681,
      "lng": -44.1983,
      "branding": {
        "nome_portal": "Controle Popular Betim"
      },
      "fontes": {
        "ouvidoria": "https://www.betim.mg.gov.br/portal/secretarias-paginas/85/conhecendo-a-ouvidoria/",
        "paraopeba": true,
        "sic_camara": "https://www.camarabetim.mg.gov.br/LAI/LeiAcesso",
        "camara_host": "https://camarabetim.mg.gov.br/",
        "citrolandia": true,
        "datasus_6dig": "310670",
        "camara_render": "spa",
        "rotas_legadas": true,
        "diario_oficial": "https://www.betim.mg.gov.br/portal/diario-oficial/",
        "links_uteis_mg": true,
        "sic_prefeitura": "https://www.betim.mg.gov.br/portal/sic",
        "prefeitura_host": "https://www.betim.mg.gov.br",
        "estado_municipios_count": 853,
        "prefeitura_transparencia_api": "REST",
        "prefeitura_transparencia_host": "http://servicos.betim.mg.gov.br/transparencia/"
      }
    },
    {
      "id_municipio": "3109006",
      "slug": "brumadinho",
      "nome": "Brumadinho",
      "uf": "MG",
      "cnpj_prefeitura": null,
      "dominio": "controlepopular.br/brumadinho",
      "lat": -20.1428,
      "lng": -44.2,
      "branding": {
        "nome_portal": "Controle Popular Brumadinho"
      },
      "fontes": {
        "paraopeba": true,
        "citrolandia": false,
        "datasus_6dig": "310900",
        "rotas_legadas": false,
        "links_uteis_mg": true,
        "estado_municipios_count": 853
      }
    },
    {
      "id_municipio": "3121605",
      "slug": "diamantina",
      "nome": "Diamantina",
      "uf": "MG",
      "cnpj_prefeitura": "17754136000190",
      "dominio": "controlepopular.br/diamantina",
      "lat": -18.2441,
      "lng": -43.6006,
      "branding": {
        "nome_portal": "Controle Popular Diamantina"
      },
      "fontes": {
        "paraopeba": false,
        "camara_host": "https://cmdiamantina.mg.gov.br/",
        "citrolandia": false,
        "cnpj_camara": "20209557000144",
        "legislatura": {
          "fim": 2028,
          "inicio": 2025
        },
        "datasus_6dig": "312160",
        "defesa_civil": false,
        "rotas_legadas": false,
        "camara_coletor": "syssolution",
        "camara_sistema": "SysSolution",
        "diario_oficial": "https://www.diariomunicipal.com.br/amm-mg/",
        "links_uteis_mg": true,
        "sic_prefeitura": "https://www.diamantina.mg.gov.br/portal/",
        "camara_cadeiras": 13,
        "prefeitura_host": "https://www.diamantina.mg.gov.br/",
        "legislacao_fonte": "camara_syssolution",
        "vereadores_fonte": "syssolution",
        "sigpub_entidade_camara": "21672",
        "estado_municipios_count": 853,
        "legislacao_municipal_host": "https://cmdiamantina.mg.gov.br/",
        "sigpub_entidade_prefeitura": "905",
        "prefeitura_transparencia_host": "https://portaltransp.com.br",
        "prefeitura_transparencia_param": "pdmt",
        "prefeitura_transparencia_sistema": "portaltransp",
        "prefeitura_transparencia_fornecedor": "portaltransp"
      }
    },
    {
      "id_municipio": "3127701",
      "slug": "governador-valadares",
      "nome": "Governador Valadares",
      "uf": "MG",
      "cnpj_prefeitura": null,
      "dominio": "controlepopular.br/governador-valadares",
      "lat": -18.8575,
      "lng": -41.9439,
      "branding": {
        "nome_portal": "Controle Popular Governador Valadares"
      },
      "fontes": {
        "paraopeba": false,
        "citrolandia": false,
        "datasus_6dig": "312770",
        "rotas_legadas": false,
        "links_uteis_mg": true,
        "estado_municipios_count": 853
      }
    },
    {
      "id_municipio": "3131307",
      "slug": "ipatinga",
      "nome": "Ipatinga",
      "uf": "MG",
      "cnpj_prefeitura": null,
      "dominio": "controlepopular.br/ipatinga",
      "lat": -19.4678,
      "lng": -42.5369,
      "branding": {
        "nome_portal": "Controle Popular Ipatinga"
      },
      "fontes": {
        "paraopeba": false,
        "citrolandia": false,
        "datasus_6dig": "313130",
        "rotas_legadas": false,
        "links_uteis_mg": true,
        "estado_municipios_count": 853
      }
    },
    {
      "id_municipio": "3134004",
      "slug": "itinga",
      "nome": "Itinga",
      "uf": "MG",
      "cnpj_prefeitura": "18348748000145",
      "dominio": "controlepopular.br/itinga",
      "lat": -16.6067,
      "lng": -41.7702,
      "branding": {
        "nome_portal": "Controle Popular Itinga"
      },
      "fontes": {
        "paraopeba": false,
        "sic_camara": "https://www.camaraitinga.mg.gov.br/esic",
        "camara_host": "https://www.camaraitinga.mg.gov.br/",
        "citrolandia": false,
        "cnpj_camara": "26222059000118",
        "legislatura": {
          "fim": 2028,
          "inicio": 2025
        },
        "datasus_6dig": "313400",
        "defesa_civil": false,
        "rotas_legadas": false,
        "camara_coletor": "simplesystem",
        "camara_sistema": "Simple System",
        "links_uteis_mg": true,
        "sic_prefeitura": "https://www.itinga.mg.gov.br/esic",
        "camara_cadeiras": 11,
        "prefeitura_host": "https://www.itinga.mg.gov.br/",
        "legislacao_fonte": "camara_simplesystem",
        "vereadores_fonte": "tse",
        "camara_proposicoes": true,
        "estado_municipios_count": 853,
        "prefeitura_transparencia_host": "https://cidadesmg.com.br/portaltransparencia",
        "camara_simplesystem_categorias": {
          "LEIS": 581,
          "EDITAIS": 592,
          "DECRETOS": 574,
          "MOÇÕES": 586,
          "PORTARIAS": 573,
          "REUNIÕES": 601,
          "CONVÊNIOS": 580,
          "LICITAÇOES": 572,
          "INDICAÇÕES": 595,
          "RESOLUÇÕES": 575,
          "LEI ORGÂNICA": 578,
          "PROPOSIÇÕES": 597,
          "REQUERIMENTOS": 585,
          "LEI 12.527/2011": 590,
          "LEI 14.129/2021": 591,
          "PLANO PLURIANUAL": 583,
          "PROJETOS DE LEIS": 600,
          "CONVÊNIO FEDERAL": 589,
          "REGIMENTO INTERNO": 587,
          "CONVÊNIO ESTADUAL": 588,
          "DOCUMENTOS OFICIAIS": 594,
          "LEIS COMPLEMENTARES": 577,
          "PRESTAÇÃO DE CONTAS": 579,
          "EMENTA DA LEI ORGANICA": 584,
          "PEDIDOS DE PROVIDÊNCIAS": 596,
          "LEIS ORÇAMENTARIAS ANUAIS": 582,
          "LEI DE DIRETRIZES ORÇAMENTÁRIAS": 593
        },
        "prefeitura_transparencia_param": "Itinga",
        "prefeitura_transparencia_sistema": "cidadesmg",
        "prefeitura_transparencia_fornecedor": "cidadesmg"
      }
    },
    {
      "id_municipio": "3136702",
      "slug": "juiz-de-fora",
      "nome": "Juiz de Fora",
      "uf": "MG",
      "cnpj_prefeitura": null,
      "dominio": "controlepopular.br/juiz-de-fora",
      "lat": -21.6889,
      "lng": -43.3444,
      "branding": {
        "nome_portal": "Controle Popular Juiz de Fora"
      },
      "fontes": {
        "paraopeba": false,
        "citrolandia": false,
        "datasus_6dig": "313670",
        "rotas_legadas": false,
        "links_uteis_mg": true,
        "estado_municipios_count": 853
      }
    },
    {
      "id_municipio": "3167103",
      "slug": "serro",
      "nome": "Serro",
      "uf": "MG",
      "cnpj_prefeitura": null,
      "dominio": "controlepopular.br/serro",
      "lat": -18.605,
      "lng": -43.3789,
      "branding": {
        "nome_portal": "Controle Popular Serro"
      },
      "fontes": {
        "paraopeba": false,
        "citrolandia": false,
        "datasus_6dig": "316710",
        "rotas_legadas": false,
        "links_uteis_mg": true,
        "estado_municipios_count": 853
      }
    },
    {
      "id_municipio": "3170206",
      "slug": "uberlandia",
      "nome": "Uberlândia",
      "uf": "MG",
      "cnpj_prefeitura": null,
      "dominio": "controlepopular.br/uberlandia",
      "lat": -18.9189,
      "lng": -48.2769,
      "branding": {
        "nome_portal": "Controle Popular Uberlândia"
      },
      "fontes": {
        "paraopeba": false,
        "citrolandia": false,
        "datasus_6dig": "317020",
        "rotas_legadas": false,
        "links_uteis_mg": true,
        "estado_municipios_count": 853
      }
    },
    {
      "id_municipio": "3550308",
      "slug": "sp",
      "nome": "São Paulo",
      "uf": "SP",
      "cnpj_prefeitura": "46395000000139",
      "dominio": "controlepopular.br/sp",
      "lat": -23.5505,
      "lng": -46.6333,
      "branding": {
        "slug": "sp",
        "nome_portal": "Controle Popular SP"
      },
      "fontes": {
        "ouvidoria": "https://prefeitura.sp.gov.br/w/servico/ouvidoria",
        "paraopeba": false,
        "sic_camara": "https://www.saopaulo.sp.leg.br/transparencia/lei-de-acesso-informacao/",
        "camara_host": "https://www.saopaulo.sp.leg.br/",
        "citrolandia": false,
        "cnpj_camara": "50176288000128",
        "legislatura": {
          "fim": 2028,
          "inicio": 2025
        },
        "datasus_6dig": "355030",
        "defesa_civil": false,
        "camara_render": "html",
        "rotas_legadas": false,
        "diario_oficial": "https://diariooficial.prefeitura.sp.gov.br/",
        "links_uteis_mg": false,
        "sic_prefeitura": "https://esic.prefeitura.sp.gov.br/",
        "prefeitura_host": "https://capital.sp.gov.br",
        "obras_abertas_host": "https://obrasabertas.prefeitura.sp.gov.br/",
        "estado_municipios_count": 645,
        "legislacao_municipal_host": "https://legislacao.prefeitura.sp.gov.br/",
        "prefeitura_dados_abertos_api": "ckan",
        "prefeitura_dados_abertos_host": "http://dados.prefeitura.sp.gov.br/api/3/action/"
      }
    }
  ];

export const CIDADES_DO_BUILD: Cidade[] = LINHAS.map((l) => ({
  ...l,
  id_municipio: l.id_municipio as IdMunicipio,
}));
