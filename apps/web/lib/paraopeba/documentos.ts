// GERADO a partir do índice Solr público da Plataforma Brumadinho UFMG
// (`plataforma.projetobrumadinho.ufmg.br/solr/platform`), medido e
// desenhado em `docs/PLANO-INGESTAO-PARAOPEBA.md` (seção 2) e
// `docs/PLANO-INTEGRACAO-BRUMADINHO.md` (seções 2-3). Não recalculado pelo
// portal — o índice de origem tem 7.107 documentos do processo judicial da
// reparação; isto é a fatia que já tem MUNICÍPIO citado no campo `places`
// da própria UFMG (zero inferência de texto feita aqui) e que passou pela
// triagem de dado pessoal antes de publicar.
//
// ═══ POR QUE SÓ 6.6% DO ACERVO, E ISSO TEM DE APARECER NA TELA ═══
//
// `places` é texto livre preenchido em 1293 dos 7107
// documentos (18.2%); cruzando contra os 853 municípios de MG, só
// 471 batem (o resto é nome de barragem, comunidade, rio ou bacia — não é
// município). NUNCA apresentar este acervo como "os documentos do
// processo" — é uma fatia de 6.6%, e quem lê precisa saber.
//
// ═══ "CITA", NÃO "É SOBRE" ═══
//
// `places` marca menção no texto, não local do fato — um documento
// marcado "brumadinho-mg" pode ser sobre um evento ali, sobre pessoa
// residente lá, ou um trecho que só MENCIONA o município. Toda tela que lê
// `municipios` deve dizer "documento que CITA", nunca "documento SOBRE" ou
// "evento em".
//
// ═══ TRIAGEM DE DADO PESSOAL — REDIGE, NÃO REMOVE (a menos que o TIPO seja pessoal) ═══
//
// A régua abaixo é a mesma de `./triagem.ts` (exportada e testada em
// `triagem.test.ts`) — este arquivo é o RESULTADO de aplicá-la sobre o
// índice bruto do Solr, não uma reimplementação solta. Dois filtros, nesta
// ordem, sobre os 471 documentos:
//   1) Tipo pessoal (documento de identificação, comprovante de residência,
//      declaração de hipossuficiência) excluiria o item inteiro — medido:
//      0 destes 471 caem nesse tipo. O filtro fica no pipeline porque a
//      próxima atualização do índice pode trazer um.
//   2) Varredura de texto (`titulo`+resumo original) por CPF válido
//      (mod-11), padrão de iniciais ("L.H.M.G"), menção nomeada a
//      vítima/desaparecido ou descrição de contato pessoal (endereço/
//      telefone associado a nome/família), e tema "saúde da população" em
//      tipo catch-all ("documentos comprobatórios"/"outros documentos") —
//      qualquer um redige `citacao` para `null` e MANTÉM o item (id,
//      processo, tipo, data, município, link) — "publique só metadado e
//      link, sem o resumo", não "não publique". 35 de 471 caíram
//      aqui (achado real, não estimado — inclui um caso concreto, id
//      73161271_1, cujo resumo original anunciava "lista com nome do
//      desaparecido, endereço e telefone").
//   3) `authors`/`authors_f` do Solr NUNCA entraram neste arquivo — nem
//      redigidos: o campo simplesmente não foi coletado. Republicar
//      iniciais de autor num índice buscável do próprio portal aumentaria
//      a superfície de descoberta além do que a UFMG decidiu ao reduzir
//      nome a inicial (`docs/PLANO-INTEGRACAO-BRUMADINHO.md`, seção 3, item 4).
//
// `citacao: null` é o sinal de que a triagem redigiu — toda tela que
// renderiza `DocumentoProcesso` deve tratar `null` como "metadado e link,
// sem resumo", nunca como "resumo vazio por acidente".
//
// ═══ O LINK É O DOCUMENTO DE VERDADE, NÃO SÓ A PLATAFORMA ═══
//
// `link` aponta para `/api/static/proceedings/frag/<id>.pdf` — testado ao
// vivo (curl, 2026-08-13): devolve PDF real (`Content-Type: application/pdf`),
// tamanho e conteúdo diferentes por `id` (confirmado por checksum em dois
// ids distintos). Isto CORRIGE o link original deste arquivo
// (`/document/<id>`, que devolve o shell da SPA sem conteúdo) e o achado de
// `docs/PLANO-INTEGRACAO-BRUMADINHO.md` (seção 2.3), que testou
// `/static/proceedings/frag/<id>` SEM o prefixo `/api` e por isso recebeu
// o shell — o bundle da própria Plataforma (`SearchResultSnippet`) monta a
// URL com o prefixo `/api`, e com ele o PDF responde de verdade. Link é
// `http://`, não `https://` — mesmo limite já registrado em
// `app/[municipio]/meio-ambiente/paraopeba/page.tsx` para o site
// institucional da UFMG: o domínio não serve TLS.
//
// ═══ LICENÇA E CITAÇÃO ═══
//
// Processo judicial coletivo é público por natureza (CPC art. 189, LOMAN) —
// a Plataforma já publica o acervo. `citacao` é o resumo ESCRITO PELA UFMG
// (`summary_pt`), reproduzido como citação com atribuição — não reescrito
// como produção própria do portal. `link` aponta para o documento
// individual na origem. Nenhum item aqui tem os dois campos vazios: sem
// link, o item não entra (mesma régua do resto do portal) — `citacao`
// pode faltar (triagem), `link` nunca.
//
// ═══ UM DADO CORROMPIDO NA FONTE, CONSERTADO E DOCUMENTADO ═══
//
// O documento `bc76c364-5a77-4a3d-88ed-a87f0c4a82e5` veio do Solr com
// `attached_at: "0023-01-27T03:06:28Z"` — o "2" do ano sumiu na própria
// fonte. Três documentos irmãos (mesmo título exato, mesmo dia) têm
// `"2023-01-27T03:00:00Z"`. Corrigido para 2023-01-27 abaixo — não é
// número inventado, é a mesma data que os três irmãos já confirmam.

export interface MunicipioCitado {
  nome: string;
  /** Código IBGE de 7 dígitos. */
  geocodigo: string;
}

export interface DocumentoProcesso {
  /** Id do documento na Plataforma Brumadinho UFMG — também o nome do PDF em `link`. */
  id: string;
  /** Número do processo judicial (CNJ) a que o documento pertence. */
  processo: string;
  titulo: string;
  /** Tipo processual, como a UFMG classificou (petição, decisão, ofício...). */
  tipo: string;
  data: string | null;
  /** Município(s) que o texto do documento CITA — não necessariamente onde o fato ocorreu. */
  municipios: MunicipioCitado[];
  temas: string[];
  /** Link para o documento individual na Plataforma Brumadinho UFMG (http:// — o domínio não tem HTTPS). */
  link: string;
  /** Resumo escrito pela UFMG, citado com atribuição — nunca reescrito. `null` = triagem de dado pessoal redigiu; o item continua publicado com metadado e link. */
  citacao: string | null;
}

export interface CoberturaDocumentosProcesso {
  totalAcervo: number;
  comLocalPreenchido: number;
  comMunicipioIdentificado: number;
  publicados: number;
  resumosRedigidosPelaTriagem: number;
  percentualPublicado: number;
}

export const COBERTURA_DOCUMENTOS_PROCESSO: CoberturaDocumentosProcesso = {
  totalAcervo: 7107,
  comLocalPreenchido: 1293,
  comMunicipioIdentificado: 471,
  publicados: 471,
  resumosRedigidosPelaTriagem: 35,
  percentualPublicado: 6.6,
};

export const DOCUMENTOS_PROCESSO: DocumentoProcesso[] = [
  {
    "id": "bc76c364-5a77-4a3d-88ed-a87f0c4a82e5",
    "processo": "5095958-18.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental da Bacia do Rio Paraopeba - Capítulo 1 - Diagnóstico pretérito da bacia do rio Paraopeba.",
    "tipo": "extraprocessual",
    "data": "2023-01-27",
    "municipios": [
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/bc76c364-5a77-4a3d-88ed-a87f0c4a82e5.pdf",
    "citacao": "Esse capítulo apresenta as condições socioambientais da bacia do Rio Paraopeba antes do rompimento das barragens, permitindo configurar uma linha de base acerca da situação do ambiente abiótico e biótico (em particular, os recursos hídricos, a composição e a estrutura de sua biodiversidade e os serviços ecossistêmicos) e das condições de vida das comunidades na bacia do Rio Paraopeba, das características socioeconômicas dos municípios e do patrimônio cultural, histórico e arqueológico, previamente à data de 25 de janeiro de 2019."
  },
  {
    "id": "60346224",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "60346224 -Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-01-28",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/60346224.pdf",
    "citacao": "Parecer único nº0786757/2018, da SUPPRI/SURAM/SEMAD/EMG, referente ao pedido protocolado pela Vale para obtenção de Licença Prévia concomitante a Licença de Instalação (LP+LI) do projeto de expansão da Mina de Jangada e da Mina Córrego do Feijão."
  },
  {
    "id": "60346272",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "60346272-Decisão",
    "tipo": "decisão",
    "data": "2019-01-28",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/60346272.pdf",
    "citacao": "Decisão do juízo federal da 19ª Vara/SJMG em relação a Ação Cível Pública nº 0069758-61.2015.4.01.3400 ajuizada em 30/11/2015 pela União, IBAMA, ANA, ICMBio, DNPM, Estado de Minas Gerais, IEF, IGAM, Estado do Espírito Santo, IEMA e AGERH contra Samarco Mineração S/A, Vale S/A e BHP Billiton Brasil Ltda, em decorrência do rompimento das barragens do Fundão e de Santarém, no complexo Minerário de Germano, em Mariana-MG."
  },
  {
    "id": "60633160",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "60633160-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-01-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/60633160.pdf",
    "citacao": "Certificado de Licença Ambiental (Licença Prévia, Licença de Instalação e Licença de Operação concomitantemente) nº 007/2018, concedido pelo COPAM/SEMAD/EMG à Vale - Mina Córrego do Feijão."
  },
  {
    "id": "60633166",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "60633166-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-01-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/60633166.pdf",
    "citacao": "Parecer único nº0786757/2018 emitido pela SUPPRI/SURAM/SEMAD/EMG, referente ao pedido protocolado pela Vale para obtenção de Licença Prévia concomitante à Licença de Instalação (LP+LI) do projeto de expansão da Mina de Jangada e da Mina Córrego do Feijão."
  },
  {
    "id": "60633170",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "60633170-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-01-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/60633170.pdf",
    "citacao": "Memorando técnico apresentado pela Vale com referência a declaração de condição de estabilidade das alterações advindas da operação de reaproveitamento de rejeitos da Barragem I, emitido pela empresa VOGBR em 2011."
  },
  {
    "id": "60633177",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "60633177-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-01-30",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/60633177.pdf",
    "citacao": "Decisão do juízo federal da 19ª Vara/SJMG em relação a Ação Cível Pública ajuizada em 30/11/2015 pela União, IBAMA, ANA, ICMBio, DNPM, Estado de Minas Gerais, IEF, IGAM, Estado do Espírito Santo, IEMA e AGERH contra Samarco Mineração S/A, Vale S/A e BHP Billiton Brasil Ltda, em decorrência do rompimento das barragens do Fundão e de Santarém, no complexo Minerário de Germano, em Mariana-MG."
  },
  {
    "id": "61031766",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "61031766-Manifestação da Promotoria",
    "tipo": "manifestação da promotoria",
    "data": "2019-02-04",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/61031766.pdf",
    "citacao": "Parecer do Ministério Público do Estado de Minas Gerais acerca da competência territorial sobre a presente demanda, atendendo à intimação realizada na audiência de 29/01/2019 (ID 60549792)."
  },
  {
    "id": "61128496",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "61128496-Manifestação da Advocacia Pública",
    "tipo": "manifestação da advocacia pública",
    "data": "2019-02-05",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/61128496.pdf",
    "citacao": "Manifestação do Estado de Minas Gerais por meio da Advocacia Geral do Estado (AGE-MG), em atenção à intimação realizada na audiência de 29/01/2019 (ID 60549792), acerca da competência deste processo, considerada a possível ocorrência de dano ambiental regional."
  },
  {
    "id": "61128497",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "61128497-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-02-05",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/61128497.pdf",
    "citacao": "Relatório técnico nº 002/2019, da Diretoria de Gestão Territorial Ambiental (DGTA/SEMAD), sobre a extensão das áreas potencialmente impactadas pelo desastre da barragem B1. O parecer foi solicitado pela Procuradoria do Estado de Minas Gerais, visando instruir a manifestação da AGE sobre competência territorial (ID 61128496)."
  },
  {
    "id": "61128501",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "61128501-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-02-05",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      }
    ],
    "temas": [
      "meio ambiente",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/61128501.pdf",
    "citacao": "Capturas de tela do site da COPASA e de jornais online contendo informações sobre: abastecimento e captação de água na região do Rio Paraopeba; suspensão do sistema de Abastecimento Paraopeba operado pela concessionária Águas de Pará de Minas, responsável pelo abastecimento de água na cidade, devido ao risco de contaminação pelos rejeitos da barragem rompida em Brumadinho; suspensão pela COPASA da captação de água do Rio Paraopeba, responsável pelo abastecimento atual da capital e de outros 16 municípios."
  },
  {
    "id": "61128513",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "61128513-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-02-05",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/61128513.pdf",
    "citacao": "Captura de tela expondo consulta de guia do judiciário sobre a comarca que abrange o município de São Joaquim de Bicas."
  },
  {
    "id": "61139210",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "61139210-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-02-05",
    "municipios": [
      {
        "nome": "Governador Valadares",
        "geocodigo": "3127701"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/61139210.pdf",
    "citacao": "Decisão do Superior Tribunal de Justiça sobre Conflito de Competência nº 144.922/MG, suscitado pela Samarco, alegando a existência de decisões conflitantes entre o Juízo da 7ª Vara Cível da Comarca de Governador Valadares e o Juízo da 2ª Vara Federal da Subseção Judiciária de Governador Valadares. A questão central que envolve os pedidos realizados nas ações civis públicas objeto do conflito de competência é o prejuízo ao abastecimento de água à população valadarense, decorrente da poluição do Rio Doce ocasionada pelo rompimento da barragem de Fundão, em Mariana/MG."
  },
  {
    "id": "61139228_1",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "61139228_1-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-02-05",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/61139228_1.pdf",
    "citacao": "Ação nº 0001835-46.2019.8.13.0090, na qual o Ministério Público de Minas Gerais (MPMG) propõe pedido de Tutela Cautelar em Caráter Antecedente com pedido liminar, em face da Vale S/A. O objetivo da ação é o bloqueio das contas da Vale no valor de R$ 5 bilhões, a fim de garantir a execução de medidas emergenciais de reparação de danos ambientais."
  },
  {
    "id": "61139228_2",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "61139228_2-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-02-05",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/61139228_2.pdf",
    "citacao": "Ação nº 0001827-69.2019.8.13.0090, na qual o Ministério Público de Minas Gerais (MPMG) propõe pedido de Tutela Cautelar em Caráter Antecedente com pedido liminar, em face da Vale S/A. O objetivo da ação é o bloqueio das contas da Vale no valor de R$ 5 bilhões, a fim de garantir a reparação dos danos às vítimas atingidas no município de Brumadinho."
  },
  {
    "id": "61488301",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "61488301-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-02-08",
    "municipios": [
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      }
    ],
    "temas": [
      "meio ambiente",
      "infraestrutura",
      "saúde da população"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/61488301.pdf",
    "citacao": null
  },
  {
    "id": "62118081",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "62118081-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-02-15",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/62118081.pdf",
    "citacao": null
  },
  {
    "id": "62118089",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "62118089-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-02-15",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/62118089.pdf",
    "citacao": null
  },
  {
    "id": "62762259",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "62762259-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-02-22",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/62762259.pdf",
    "citacao": "Cronograma das atividades realizadas e previstas para a 4ª semana de desinsetização e desratização de vias públicas e fumacê em Brumadinho, Parque das Cachoeiras e Córrego do Feijão."
  },
  {
    "id": "62855762",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "62855762-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-02-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      },
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/62855762.pdf",
    "citacao": null
  },
  {
    "id": "62855857",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "62855857-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-02-25",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/62855857.pdf",
    "citacao": "Compilado de documentos juntados pelo Estado de Minas Gerais, por meio da Advocacia Geral do Estado, nos autos do processo nº 5010709-36.2019.8.13.0024, a saber: Certificado de Licença Prévia, Licença de Instalação e Licença de Operação; Captura de tela da página da web da Vale S/A com informações sobre \"Fact Sheet\" da empresa; Capturas de tela do site da Companhia de Saneamento de Minas Gerais (COPASA) e de jornais online contendo informações sobre: i) abastecimento e captação de água na região do Rio Paraopeba; ii) suspensão do sistema de Abastecimento Paraopeba operado pela concessionária Águas de Pará de Minas, responsável pelo abastecimento de água na cidade, devido ao risco de contaminação pelos rejeitos da barragem rompida em Brumadinho; iii) suspensão pela COPASA da captação de água do Rio Paraopeba, responsável pelo abastecimento atual da capital e de outros 16 municípios."
  },
  {
    "id": "63316155",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "63316155-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-03-01",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/63316155.pdf",
    "citacao": null
  },
  {
    "id": "63389899",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "63389899-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-03-06",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/63389899.pdf",
    "citacao": "Termo da audiência realizada no dia 06/02/2019 sobre: medidas emergenciais; ressarcimento dos gastos emergenciais realizados pelos serviços de atendimento de urgências do Estado de Minas Gerais; Termo de Ajustamento Preliminar; e atendimento das famílias atingidas. \n\nParticipantes: Dr. Edmundo Antônio Dias Netto Júnior (MPF); Dr. Marcos Vinícius Pereira de Castro (AGU); Dra. Carolina Godoy Leite Villaça (DPU); Dra. Sabrina Nunes Vieira (DPU); Dr. André Sperling Prado (MPMG); Dra. Andressa de Oliveira Lanchotti (MPMG); Dr. Aylton Rodrigues Magalhães (DPMG); Dr. Lyssandro Norton Siqueira (AGE-MG); Dr. Cássio Roberto dos Santos Andrade (AGE-MG); Dr. Mário Eduardo Guimarães (AGE-MG); Dr. Pedro Henrique Fernandes Carvalho (Vale); Dr. Wilson Fernandes Pimentel (Vale); e Dr. Octávio Bulcão Nascimento (Vale)."
  },
  {
    "id": "64199183",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "64199183-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-03-19",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "meio ambiente",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/64199183.pdf",
    "citacao": "Apresentação da Vale S/A de 13 de março de 2019, sobre os resultados do monitoramento da Mina do Córrego do Feijão, contendo: 1 - plano de monitoramento;2 - resultados;3 - conclusões;4 - análise de água subterrânea da bacia do Paraopeba;5 - ações para mitigação de impacto sobre o abastecimento de água no município de Pará de Minas;6 - ações para garantia do abastecimento de água para consumo humano, animal e agrícola."
  },
  {
    "id": "64199185",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "64199185-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-03-19",
    "municipios": [
      {
        "nome": "Barão de Cocais",
        "geocodigo": "3105400"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/64199185.pdf",
    "citacao": "Dados da Vale S/A sobre acompanhamento de afetados e relação de desabrigados."
  },
  {
    "id": "64199187",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "64199187-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-03-19",
    "municipios": [
      {
        "nome": "Cantagalo",
        "geocodigo": "3112059"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/64199187.pdf",
    "citacao": "Relatório da Vale S/A relativo ao Plano de Manutenção das Vias de Acessos (revisão nº 01) localizadas em Córrego do Feijão, Cantagalo, Casa Branca, Aterro Sanitário e propriedades cadastradas na Secretaria de Agricultura de Brumadinho."
  },
  {
    "id": "64199323",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "64199323-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-03-19",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/64199323.pdf",
    "citacao": "Termo de Transação e de Ajustamento de Conduta (TTAC) firmado entre a União, IBAMA, ICMBio, ANA, DNPM, FUNAI, EMG, IEF, IGAM, FEAM, EES, IEMA, IDAF, AGERH, Samarco, Vale e BHP Billiton, relativo ao rompimento da barragem de Fundão em Mariana-MG."
  },
  {
    "id": "64200055",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "64200055-Petição",
    "tipo": "petição",
    "data": "2019-03-19",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/64200055.pdf",
    "citacao": "Relatório técnico da Call Clean juntado pela Vale, relativo às atividades realizadas na 6ª semana para atendimento do \"Plano de controle de pragas e vetores sinantrópicos da região de Brumadinho-MG\". Atividades descritas: desinsetização e desratização concentradas em galerias sanitárias e vias urbanas, casas de apoio à população localizadas em Brumadinho - Sede, o Clube Aurora, e Fazenda Abrigo e algumas residências do Bairro Alberto Flores em Parque das Cachoeiras."
  },
  {
    "id": "64483224",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "64483224-Termo",
    "tipo": "termo",
    "data": "2019-03-21",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "socioeconômico",
      "saúde da população"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/64483224.pdf",
    "citacao": "Termo de Audiência realizada no dia 21/03/2019, referente aos processos nº 5010709-36.2019.8.13.0024 e 5026408-67.2019.8.13.0024. Na audiência, tratou-se das seguintes questões: informes sobre o andamento de atendimento pela Vale S/A dos pedidos de pagamento emergencial e as dificuldades enfrentadas; estabelecimento de prazo para apresentação pelas partes de atendimento ativo coletivo; comprometimento, pela Vale S/A, em apresentar acordo visando solucionar o problema da captação de água em Pará de Minas; estabelecimento de reunião entre as partes para negociação do custeio pela Vale S/A de contratações realizadas pelo Estado de Minas Gerais; autorização de transferência, em favor do Estado de Minas Gerais, de R$ 29.841.394,82, debitados das garantias deste processo, a título de ressarcimento das despesas pela Vale S/A; determinação de prazo para apresentação pelo Estado de Minas Gerais de justificativas das referidas despesas;  determinação de prazo para a Vale S/A examinar as propostas de contratação direta, pelo Estado de Minas Gerais, de exames laboratoriais e de realização de controle vetorial; estabelecimento de realização de levantamento dos produtores rurais e comerciantes que assumiram dívidas até o evento pela comissão de atingidos; intimação da Vale S/A sobre o Termo de Referência da Assessoria Técnica a ser contratada; e pedido do Ministério Público Federal de apresentação de relatório sobre a estrada que está passando dentro da mina da Vale S/A. \n\nParticipantes: representantes do Estado de Minas Gerais, da Advocacia Geral do Estado de Minas Gerais, da Vale, do Ministério Público Federal, do Ministério Público de Minas Gerais, da Defensoria Pública da União e Defensoria Pública do Estado de Minas Gerais e pessoas cadastradas previamente para a audiência."
  },
  {
    "id": "64483228",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "64483228-Termo",
    "tipo": "termo",
    "data": "2019-03-21",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "socioeconômico",
      "saúde da população"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/64483228.pdf",
    "citacao": "Termo de Audiência realizada no dia 21/03/2019, referente aos processos nº 5010709-36.2019.8 .13.0024 e 5026408-67 .2019.8.13.0024. Na audiência, tratou-se das seguintes questões: informes sobre o andamento de atendimento pela Vale S/A dos pedidos de pagamento emergencial e as dificuldades enfrentadas; estabelecimento de prazo para apresentação pelas partes de atendimento ativo coletivo; comprometimento, pela Vale S/A, em apresentar acordo visando solucionar o problema da captação de água em Pará de Minas; estabelecimento de reunião entre as partes para negociação do custeio pela Vale S/A de contratações realizadas pelo Estado de Minas Gerais; autorização de transferência, em favor do Estado de Minas Gerais, de R$ 29.841.394,82, debitados das garantias deste processo, a título de ressarcimento das despesas pela Vale S/A; determinação de prazo para apresentação pelo Estado de Minas Gerais de justificativas das referidas despesas;  determinação de prazo para a Vale S/A examinar as propostas de contratação direta, pelo Estado de Minas Gerais, de exames laboratoriais e de realização de controle vetorial; estabelecimento de realização de levantamento dos produtores rurais e comerciantes que assumiram dívidas até o evento pela comissão de atingidos; intimação da Vale S/A sobre o Termo de Referência da Assessoria Técnica a ser contratada; e pedido do Ministério Público Federal de apresentação de relatório sobre a estrada que está passando dentro da mina da Vale S/A. \n\nParticipantes: representantes do Estado de Minas Gerais, da Advocacia Geral do Estado de Minas Gerais, da Vale, do Ministério Público Federal, do Ministério Público de Minas Gerais, da Defensoria Pública da União e Defensoria Pública do Estado de Minas Gerais e pessoas cadastradas previamente para a audiência."
  },
  {
    "id": "64621625",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "64621625-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-03-22",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/64621625.pdf",
    "citacao": null
  },
  {
    "id": "65302989",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "65302989-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-03-29",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65302989.pdf",
    "citacao": null
  },
  {
    "id": "65776971",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "65776971-Petição Inicial",
    "tipo": "petição inicial",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65776971.pdf",
    "citacao": "Petição inicial do processo nº 5044954-73.2019.8.13.0024 ajuizada pelo Ministério Público de Minas Gerais. Diante do rompimento das barragens de rejeitos de mineração de propriedade da Vale S/A no município de Brumadinho-MG em 25/01/2019, o autor requer tutela antecipada em caráter antecedente em desfavor da Vale S/A, visando a reparação dos danos ambientais e a adoção de todas as medidas necessárias para que os danos não se exacerbem. \nOriginalmente tramitado, em meio físico, na Comarca de Brumadinho com a numeração 0001835-46.2019.8.13.0090. Após a distribuição da presente ação para o meio eletrônico, com a sua inclusão no PJe, recebeu a numeração 5000056-68.2019.8.13.0090. Em 04/04/2019, esse processo foi redistribuído na comarca de Belo Horizonte sob o nº 5044954-73.2019.8.13.0024."
  },
  {
    "id": "65779893",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "65779893-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65779893.pdf",
    "citacao": "Termo de Compromisso firmado entre o Ministério Público de Minas Gerais, a Vale S/A, o Município de Pará de Minas e a concessionária de saneamento básico Águas de Pará de Minas S/A (“TAC Pará de Minas”).  O objeto principal deste Termo de Ajustamento consiste na elaboração, no custeio e na execução de projeto e obras para a construção de novos sistemas de captação e de adução de água bruta sob responsabilidade da Vale, visando à recomposição do sistema de abastecimento de água do município de Pará de Minas."
  },
  {
    "id": "65853844",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "65853844-Ata de Audiência",
    "tipo": "ata de audiência",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "meio ambiente",
      "saúde da população",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65853844.pdf",
    "citacao": "Termo de Audiência, realizada em 04/04/2019, referente aos processos 5010709-36.2019.8.13.0024, 5044954-73.2019.8.13.0024 e 5026408-67.2019.8.13.0024. Tratou-se das seguintes questões: pagamentos emergenciais; cronograma das ações socioambientais; contratação da Fiocruz para avaliação epidemiológica e da Fundação Ezequiel Dias (FUNED) para acompanhamento e monitoramento sanguíneo de seres vivos para metais pesados; extensão da atuação da AECOM para auditar o cumprimento pela Vale S/A das determinações dos órgãos estaduais e do Juízo; desistência do Ministério Público do agravo de instrumento que interpôs contra a decisão que decidiu pela competência deste Juízo para apreciar os processos que estão aqui reunidos; homologação do acordo sobre fornecimento de água para o município de Pará de Minas; citação da Vale S/A em todos os termos da ação para apresentação de defesa, bem como nos autos dos processos 5010709-36.2019.8.13.0024 e 5044954-73.2019.8.13.0024; escolha da assessoria técnica aos atingidos; e negociação extrajudicial sobre a dívida dos comerciantes e produtores rurais. \n\nParticipantes: representantes do Estado de Minas Gerais, da Advocacia Geral do Estado de Minas Gerais, da Vale S/A, do Ministério Público Federal, do Ministério Público de Minas Gerais, da Advocacia-Geral da União, da Defensoria Pública Federal e da Defensoria Pública do Estado de Minas Gerais e pessoas cadastradas previamente para a audiência."
  },
  {
    "id": "65853876",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "65853876-Termo",
    "tipo": "termo",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "meio ambiente",
      "saúde da população",
      "infraestrutura",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65853876.pdf",
    "citacao": "Termo de Audiência, realizada em 04/04/2019, referente aos processos 5010709-36.2019.8.13.0024, 5044954-73.2019.8.13.0024 e 5026408-67.2019.8.13.0024. Tratou-se das seguintes questões: pagamentos emergenciais; cronograma das ações socioambientais; contratação da Fiocruz para avaliação epidemiológica e da Fundação Ezequiel Dias (FUNED) para acompanhamento e monitoramento sanguíneo de seres vivos para metais pesados; extensão da atuação da AECOM para auditar o cumprimento pela Vale S/A das determinações dos órgãos estaduais e do Juízo; desistência do Ministério Público do agravo de instrumento que interpôs contra a decisão que decidiu pela competência deste Juízo para apreciar os processos que estão aqui reunidos; homologação do acordo sobre fornecimento de água para o município de Pará de Minas; citação da Vale S/A em todos os termos da ação para apresentação de defesa, bem como nos autos dos processos 5010709-36.2019.8.13.0024 e 5044954-73.2019.8.13.0024; escolha da assessoria técnica aos atingidos; e negociação extrajudicial sobre a dívida dos comerciantes e produtores rurais. \n\nParticipantes: representantes do Estado de Minas Gerais, da Advocacia Geral do Estado de Minas Gerais, da Vale S/A, do Ministério Público Federal, do Ministério Público de Minas Gerais, da Advocacia-Geral da União, da Defensoria Pública Federal e da Defensoria Pública do Estado de Minas Gerais e pessoas cadastradas previamente para a audiência."
  },
  {
    "id": "65853889",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65853889-Ata de Audiência",
    "tipo": "ata de audiência",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "meio ambiente",
      "saúde da população",
      "infraestrutura",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65853889.pdf",
    "citacao": "Termo de Audiência realizada no dia 04/04/2019 referente aos processos nº 5044954-73.2019.8.13.0024, 5010709-36.2019.8.13.0024 e 5026408-67.2019.8.13.0024. Tratou-se das seguintes questões: pagamentos emergenciais; cronograma das ações socioambientais; contratação da Fiocruz para avaliação epidemiológica e da Fundação Ezequiel Dias (FED) para acompanhamento e monitoramento sanguíneo de seres vivos para metais pesados; extensão da atuação da AECOM para auditar o cumprimento pela Vale S/A das determinações dos órgãos estaduais e do Juízo; desistência do Ministério Público do agravo de instrumento que interpôs contra a decisão que decidiu pela competência deste Juízo para apreciar os processos que estão aqui reunidos; homologação do acordo sobre fornecimento de água para o município de Pará de Minas; citação da Vale S/A em todos os termos da ação para apresentação de defesa, bem como nos autos dos processos 5010709-36.2019.8.13.0024 e 5044954-73.2019.8.13.0024; escolha da assessoria técnica aos atingidos; e negociação extrajudicial sobre a dívida dos comerciantes e produtores rurais. \n\nParticipantes: representantes do Estado de Minas Gerais, da Advocacia Geral do Estado de Minas Gerais, da Vale S/A, do Ministério Público Federal, do Ministério Público de Minas Gerais, da Advocacia-Geral da União, da Defensoria Pública Federal, da Defensoria Pública do Estado de Minas Gerais e pessoas cadastradas previamente para a audiência."
  },
  {
    "id": "65777993_2",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65777993_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65777993_2.pdf",
    "citacao": "Inquérito Civil nº 0090.19-000011-8 instaurado pelo Ministério Público de Minas Gerais. O objetivo do inquérito é apurar os fatos que ensejaram o rompimento da barragem de rejeitos minerários localizada na Mina Córrego do Feijão - Complexo Paraopeba (Vale S/A), bem como identificar os responsáveis pelo fato e providências cabíveis para salvaguarda dos recursos naturais e das vítimas, além da responsabilização do(s) administrador(es) do empreendimento."
  },
  {
    "id": "65777993_4",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65777993_4-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65777993_4.pdf",
    "citacao": "Inquérito Civil nº MPMG-0090.16.000311-8 instaurado pelo Ministério Público de Minas Gerais, cujo objetivo é analisar a documentação das barragens Capim Branco, Barragem 1, Barragem IV, Barragem IV-A, Barragem VI, Barragem VII, Menezes I e Menezes II, de responsabilidade da Vale S/A."
  },
  {
    "id": "65777993_6",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65777993_6-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65777993_6.pdf",
    "citacao": "Compilado, juntado pelo Ministério Público de Minas Gerais, de capturas de tela e imagens, contendo: captura de tela de jornal online G1 sobre rompimento da Barragem em Brumadinho; e imagens (sem descrição)."
  },
  {
    "id": "65777993_12",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65777993_12-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65777993_12.pdf",
    "citacao": "Ata do Conselho Estadual de Política Ambiental (COPAM) da 37ª Reunião Extraordinária da Câmara de Atividades Minerárias (CMI) sobre: aprovação de ata de Reunião anterior; Processos Administrativos para exame de Licença Prévia concomitante com a Licença de instalação e a Licença de Operação; Processo Administrativo para exame de Licença Prévia concomitante com a Licença de Instalação e a licença de Operação -\"Ampliação''; Processo Administrativo para exame de Licença de  Operação \"Ampliação\"; Processo Administrativo para exame de alteração/exclusão de Condicionantes da licença Prévia concomitante com a licença de Instalação e a Licença de Operação; Processo Administrativo para exame da Licença de Operação. Dentre as decisões determinadas em reunião, destaca-se a concessão com condicionantes da continuidade das Operações da Mina de Córrego do Feijão da Vale S/A, em Brumadinho e Sarzedo/MG, com validade de 10 anos."
  },
  {
    "id": "65777993_13",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65777993_13-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65777993_13.pdf",
    "citacao": "Compilado, juntado pelo Ministério Público de Minas Gerais, de capturas de tela, contendo: captura de tela de notícias do jornal online G1 sobre alerta de chegada de rejeitos à represa de Três Marias, danos do rompimento da barragem da Vale S/A em Brumadinho e anúncio do governo federal de instalação do gabinete da crise; e apresentação da Vale S/A de 14/03/2016 sobre barragens de mineração."
  },
  {
    "id": "65777994_1",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65777994_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65777994_1.pdf",
    "citacao": "Recomendação PJ-CPPC 04/2019 do Ministério Público de Minas Gerais, para que a Vale S/A adote todas as medidas emergenciais necessárias para o controle da situação decorrente do rompimento da Barragem de Brumadinho, com vistas a minimizar os danos à saúde pública e ao meio ambiente, incluindo as ações de contenção, recolhimento e neutralização dos resíduos gerados no acidente, bem como para a recuperação das áreas impactadas e preservação do patrimônio cultural, histórico e turístico."
  },
  {
    "id": "65777994_3",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65777994_3-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Capim Branco",
        "geocodigo": "3112505"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65777994_3.pdf",
    "citacao": "Resposta da Vale S/A ao Ofício nº 506/2018 da Coordenadoria Regional das Promotorias de Justiça do Meio Ambiente das Bacias dos Rios das Velhas e Paraopeba (CRVP-MPMG). A mineradora apresenta dois DVDs contendo os documentos solicitados pelo Ministério Público de Minas Gerais (MPMG) em ofício, a saber: Planos de Segurança de Barragens atualizados (incluindo os Relatórios de Auditorias de setembro/2018 e estudo de Dam Break completo), em formato digital, relativos às estruturas de barramento: Capim Branco, Barragem 1, Barragem IV, Barragem IV-A, Barragem VI, Barragem VII, Menezes I, Menezes II."
  },
  {
    "id": "65777998_5",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65777998_5-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65777998_5.pdf",
    "citacao": "Nota técnica conjunta de 01/03/2016 do Governo Federal e dos Governos Estaduais do Espírito Santo e de Minas Gerais, na qual apresentam-se: i) a definição dos programas socioeconômicos que compõem o Termo de Transação e Ajustamento de Conduta relativo à recuperação dos impactos socioambientais e socioeconômicos do rompimento da barragem de Fundão em Mariana; e ii) a consolidação dos gastos extraordinários incorridos por seus órgãos e entidades para execução de medidas emergenciais necessárias para atendimento da população atingida e para identificação e mitigação dos danos ambientais, totalizando R$ 27.500.000,00."
  },
  {
    "id": "65777998_6",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65777998_6-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65777998_6.pdf",
    "citacao": "Notícia do jornal Valor Econômico, juntada pela Vale S/A, sobre determinação judicial de bloqueio de R$ 300.000.000,00 na conta da Samarco, após o rompimento da barragem de Fundão."
  },
  {
    "id": "65777998_7",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65777998_7-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65777998_7.pdf",
    "citacao": "Termo de Compromisso Preliminar firmado entre o Ministério Público Federal, o Ministério Público de Minas Gerais e a Samarco Mineração S/A. Constitui o objeto deste Termo de Compromisso Preliminar o estabelecimento de caução socioambiental para garantia de custeio de medidas preventivas emergenciais, mitigatórias, reparatórias ou compensatórias, sejam elas ambientais ou socioambientais decorrentes do rompimento das barragens de rejeitos sob responsabilidade da Samarco na Comarca de Mariana. No mesmo, acorda-se que a Samarco prestará garantia emergencial mínima no valor de R$ 1.000.000.000,00."
  },
  {
    "id": "65777998_8",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65777998_8-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65777998_8.pdf",
    "citacao": "Notícia do jornal Valor Econômico, juntada pela Vale S/A, sobre determinação judicial de bloqueio de R$ 500.000.000,00 na conta da Samarco, após o rompimento da barragem de Fundão."
  },
  {
    "id": "65777998_9",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65777998_9-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65777998_9.pdf",
    "citacao": "Termo de Ajustamento de Conduta, firmado entre Ministério Público Federal, Ministério Público de Minas Gerais, Ministério Público do Estado do Espírito Santo, Defensoria Pública da União, Defensoria Pública do Estado de Minas Gerais, Defensoria Pública do Estado do Espírito Santo, União, Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA), Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio), Agência Nacional das Águas (ANA), Agência Nacional de Mineração (ANM), Fundação Nacional do Índio (FUNAI), Estado de Minas Gerais, Instituto Estadual de Florestas (IEF), Instituto Mineiro de Gestão das Águas (IGAM), Fundação Estadual do Meio Ambiente (FEAM), Estado do Espírito Santo, Instituto de Meio Ambiente e Recursos Hídricos (IEMA), Instituto de Defesa Agropecuária e Florestal do Espírito Santo (IDAF), Agência Estadual de Recursos Hídricos (AGERH), Samarco Mineração S/A, Vale S/A e BHP Billiton Brasil Ltda. Os objetos do acordo são: i) a alteração do processo de governança previsto no Termo de Transação e de Ajustamento de Conduta (TTAC), para definição e execução dos programas, projetos e ações que se destinam à reparação integral dos danos decorrentes do rompimento da barragem de Fundão; ii) o aprimoramento de mecanismos de efetiva participação das pessoas atingidas pelo rompimento da Barragem de Fundão em todas as etapas e fases do TTAC e do presente acordo; e iii) o estabelecimento de um processo dc negociação visando a eventual repactuação dos programas."
  },
  {
    "id": "65778001_1",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65778001_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65778001_1.pdf",
    "citacao": "Termo de Transação e de Ajustamento de Conduta (TTAC) firmado entre a União, Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA), Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio), Agência Nacional das Águas (ANA), Departamento Nacional de Produção Mineral (DNPM), Fundação Nacional do Índio (FUNAI), Estado de Minas Gerais (EMG), Instituto Estadual de Florestas (IEF), Instituto Mineiro de Gestão das Águas (IGAM), Fundação Estadual do Meio Ambiente (FEAM), Estado do Espírito Santo (EES), Instituto de Meio Ambiente e Recursos Hídricos (IEMA), Instituto de Defesa Agropecuária e Florestal do Espírito Santo (IDAF), Agência Estadual de Recursos Hídricos (AGERH), Samarco, Vale S/A e BHP Billiton, relativo ao rompimento da barragem de Fundão em Mariana-MG."
  },
  {
    "id": "65778038_5",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65778038_5-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65778038_5.pdf",
    "citacao": "Nota técnica conjunta de 01/03/2016 do Governo Federal e dos Governos Estaduais do Espírito Santo e de Minas Gerais, na qual apresenta-se: i) a definição dos programas socioeconômicos que compõem o Termo de Transação e Ajustamento de Conduta relativo à recuperação dos impactos socioambientais e socioeconômicos do rompimento da barragem de Fundão em Mariana; e ii) a consolidação dos gastos extraordinários incorridos por seus órgãos e entidades para execução de medidas emergenciais necessárias para atendimento da população atingida e para identificação e mitigação dos danos ambientais, totalizando R$ 27.500.000,00."
  },
  {
    "id": "65778038_6",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65778038_6-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65778038_6.pdf",
    "citacao": "Notícia do jornal Valor Econômico, juntada pela Vale S/A, sobre determinação judicial de bloqueio de R$ 300.000.000,00 na conta da Samarco Mineração S/A, após o rompimento da barragem de Fundão."
  },
  {
    "id": "65778038_7",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65778038_7-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65778038_7.pdf",
    "citacao": "Termo de Compromisso Preliminar firmado entre o Ministério Público Federal, o Ministério Público de Minas Gerais e a Samarco Mineração S/A. Constitui o objeto deste Termo de Compromisso Preliminar o estabelecimento de caução socioambiental para garantia de custeio de medidas preventivas emergenciais, mitigatórias, reparatórias ou compensatórias, sejam elas ambientais ou socioambientais decorrentes do rompimento das barragens de rejeitos sob responsabilidade da Samarco na Comarca de Mariana. No mesmo, acorda-se que a Samarco prestará garantia emergencial mínima no valor de R$ 1.000.000.000,00."
  },
  {
    "id": "65778038_8",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65778038_8-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65778038_8.pdf",
    "citacao": "Notícia do jornal Valor Econômico, juntada pela Vale S/A, sobre determinação judicial de bloqueio de R$ 500.000.000,00 na conta da Samarco Mineração S/A, após o rompimento da barragem de Fundão."
  },
  {
    "id": "65778038_9",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65778038_9-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65778038_9.pdf",
    "citacao": "Termo de Ajustamento de Conduta, firmado entre Ministério Público Federal, Ministério Público de Minas Gerais, Ministério Público do Estado do Espírito Santo, Defensoria Pública da União, Defensoria Pública do Estado de Minas Gerais, Defensoria Pública do Estado do Espírito Santo, União, Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA), Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio), Agência Nacional das Águas (ANA), Agência Nacional de Mineração (ANM), Fundação Nacional do Índio (FUNAI), Estado de Minas Gerais, Instituto Estadual de Florestas (IEF), Instituto Mineiro de Gestão das Águas (IGAM), Fundação Estadual do Meio Ambiente (FEAM), Estado do Espírito Santo, Instituto de Meio Ambiente e Recursos Hídricos (IEMA), Instituto de Defesa Agropecuária e Florestal do Espírito Santo (IDAF), Agência Estadual de Recursos Hídricos (AGERH), Samarco Mineração S/A, Vale S/A e BHP Billiton Brasil Ltda.  Os objetos do acordo são: i) a alteração do processo de governança previsto no Termo de Transação e de Ajustamento Conduta (TTAC), para definição e execução dos programas, projetos e ações que se destinam à reparação integral dos danos decorrentes do rompimento da barragem de Fundão; ii) o aprimoramento de mecanismos de efetiva participação das pessoas atingidas pelo rompimento da Barragem de Fundão em todas as etapas e fases do TTAC e do presente acordo; e iii) o estabelecimento de um processo dc negociação visando a eventual repactuação dos programas."
  },
  {
    "id": "65778039_1",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65778039_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65778039_1.pdf",
    "citacao": "Termo de Transação e de Ajustamento de Conduta (TTAC) firmado entre a União,  Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA), Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio), Agência Nacional das Águas (ANA), Departamento Nacional de Produção Mineral (DNPM), Fundação Nacional do Índio (FUNAI), Estado de Minas gerais (EMG), Instituto Estadual de Florestas (IEF), Instituto Mineiro de Gestão das Águas (IGAM), Fundação Estadual do Meio Ambiente (FEAM), Estado do Espírito Santo, Instituto de Meio Ambiente e Recursos Hídricos (IEMA), Instituto de Defesa Agropecuária e Florestal do Espírito Santo (IDAF), Agência Estadual de Recursos Hídricos (AGERH), Samarco Mineração S/A, Vale S/A e BHP Billiton Brasil Ltda., relativo ao rompimento da barragem de Fundão em Mariana-MG."
  },
  {
    "id": "65779330_3",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65779330_3-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65779330_3.pdf",
    "citacao": "Compilado de imagens apresentado pelo Ministério Público de Minas Gerais contendo \"Fotos dos danos em Brumadinho\"."
  },
  {
    "id": "65779331_1",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65779331_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Nova Lima",
        "geocodigo": "3144805"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65779331_1.pdf",
    "citacao": "Boletim de Ocorrência (REDS 2019-003883264-001; REDS nº 2019-003883264-002; REDS nº 2019-003883264-003; REDS nº 2019-003883264-004; REDS nº 2019-003883264-007; REDS nº 2019-003883264-008; REDS nº 2019-003883264-009; e REDS nº 2019-003883264-010) registrado pela Polícia Militar em Nova Lima, relatando o rompimento da barragem da Mina Córrego do Feijão, de propriedade da Vale S/A em Brumadinho-MG."
  },
  {
    "id": "65779340_1",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65779340_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65779340_1.pdf",
    "citacao": "Ofícios do Ministério Público de Minas Gerais endereçados aos municípios possivelmente atingidos pelo rompimento, requisitando informações sobre: a) a existência de bens culturais relacionados ao uso do Rio Paraopeba que foram ou possam ser afetados pela passagem da pluma de minério decorrente do rompimento da barragem de Córrego do Feijão em Brumadinho; b) as medidas eventualmente necessárias a serem adotadas para proteção dos bens; e c) as providências adotadas visando à salvaguarda dos bens. Seguem em conjunto as respostas oficiadas pelos seguintes municípios: Paraopeba; Maravilhas; Curvelo; Florestal; Juatuba; Pará de Minas; Pequi; Igarapé; Mário Campos; Papagaios; e Itabirito."
  },
  {
    "id": "65780147_1",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65780147_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente",
      "saúde da população",
      "infraestrutura",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65780147_1.pdf",
    "citacao": null
  },
  {
    "id": "65780686_1",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "65780686_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-04",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/65780686_1.pdf",
    "citacao": "Relatório técnico nº 002/2019 da Diretoria de Gestão Territorial Ambiental da Secretaria Municipal de Meio Ambiente e Desenvolvimento Sustentável (SEMAD) com objetivo de avaliar as áreas potencialmente impactadas devido à ruptura da barragem B1 da Mina Córrego do Feijão, a fim de subsidiar a manifestação da Advocacia Geral do Estado (AGE) nos autos de nº 5010709-36.2019.8.13.0024. Conclui-se que a área diretamente afetada encontra-se restrita ao município de Brumadinho, enquanto a área de influência direta e/ou indireta abrange, até o momento, os municípios de Brumadinho, São Joaquim de Bicas, Mário Campos, Betim, Juatuba, Florestal, Esmeraldas e Pará de Minas, sendo, portanto, mais abrangente que o limite territorial do primeiro município citado."
  },
  {
    "id": "66238091",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "66238091-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-09",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/66238091.pdf",
    "citacao": null
  },
  {
    "id": "66692940",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "66692940-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-12",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/66692940.pdf",
    "citacao": null
  },
  {
    "id": "67233245",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "67233245-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-04-22",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/67233245.pdf",
    "citacao": null
  },
  {
    "id": "67669217",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "67669217-Petição",
    "tipo": "petição",
    "data": "2019-04-23",
    "municipios": [
      {
        "nome": "Capim Branco",
        "geocodigo": "3112505"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/67669217.pdf",
    "citacao": "Petição do Estado de Minas Gerais, por meio da Advocacia Pública do Estado, requerendo que a Vale seja obrigada a: se manifestar sobre o cumprimento das recomendações da Auditoria Externa da AECOM para garantir a segurança das estruturas remanescentes na Mina do Feijão; e juntar ao processo, no prazo de 48 horas, a declaração de condição de estabilidade da barragem Menezes II, associada ao relatório técnico que a embasou, bem como os documentos de comprovação do atendimento às recomendações da AECOM."
  },
  {
    "id": "67786032",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "67786032-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-04-26",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/67786032.pdf",
    "citacao": null
  },
  {
    "id": "68020158",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "68020158-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-04-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/68020158.pdf",
    "citacao": "Ofício nº 33/2019 do gabinete do vereador de Brumadinho, Hideraldo Santana, sugerindo que se inclua nas negociações com a Vale, como forma de compensação, a continuidade da construção da ponte sobre o Rio Paraopeba e dos viadutos I e II, próximo ao Instituto Inhotim, em Brumadinho."
  },
  {
    "id": "68073179",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "68073179-Petição",
    "tipo": "petição",
    "data": "2019-04-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      },
      {
        "nome": "Rio Manso",
        "geocodigo": "3155306"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/68073179.pdf",
    "citacao": "Petição do Estado de Minas Gerais, por meio de seu procurador, se manifestando acerca de despacho que versa sobre as ações já realizadas ou necessárias para a captação de água na cidade de Belo Horizonte, em decorrência do rompimento da barragem do Córrego do Feijão."
  },
  {
    "id": "68351753",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "68351753-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-03",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/68351753.pdf",
    "citacao": null
  },
  {
    "id": "68763861",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "68763861-Petição",
    "tipo": "petição",
    "data": "2019-05-08",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Itabirito",
        "geocodigo": "3131901"
      },
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      },
      {
        "nome": "Ouro Preto",
        "geocodigo": "3146107"
      }
    ],
    "temas": [
      "socioeconômico",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/68763861.pdf",
    "citacao": "Petição de Estado de Minas Gerais, por meio da Advocacia Geral do Estado de Minas Gerais, requerendo que a Vale S/A seja obrigada a recuperar a linha férrea entre Belo Horizonte-Itabirito-Ouro Preto-Mariana, a fim de potencializar o incremento da atividade turística de toda a região afetada pelas barragens da Vale S/A."
  },
  {
    "id": "68763864",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "68763864-Informações Prestadas",
    "tipo": "informações prestadas",
    "data": "2019-05-08",
    "municipios": [
      {
        "nome": "Itabirito",
        "geocodigo": "3131901"
      },
      {
        "nome": "Ouro Preto",
        "geocodigo": "3146107"
      },
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/68763864.pdf",
    "citacao": "Notícia do jornal online Diário do Comércio de 22/02/2019, juntada pelo Estado de Minas Gerais, sobre interdição da Rodovia BR-356, que dá acesso a Itabirito, Ouro Preto e Mariana, em função do risco de rompimento da barragem Vargem Grande, da mineradora Vale."
  },
  {
    "id": "68763865",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "68763865-Informações Prestadas",
    "tipo": "informações prestadas",
    "data": "2019-05-08",
    "municipios": [
      {
        "nome": "Itabirito",
        "geocodigo": "3131901"
      },
      {
        "nome": "Ouro Preto",
        "geocodigo": "3146107"
      },
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/68763865.pdf",
    "citacao": "Notícia do jornal online BHAZ de 21/02/2019, juntada pelo Estado de Minas Gerais, sobre interdição da BR-356, no trecho que dá acesso a Itabirito, Ouro Preto e Mariana, na Região Central de Minas, após aumento no nível de alerta de 1 para 2 da barragem Vargem Grande, da mineradora Vale S/A, em Nova Lima, na região metropolitana de Belo Horizonte."
  },
  {
    "id": "68824689",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "68824689-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-09",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "saúde da população",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/68824689.pdf",
    "citacao": null
  },
  {
    "id": "68927356",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "68927356-Ata de Audiência",
    "tipo": "ata de audiência",
    "data": "2019-05-09",
    "municipios": [
      {
        "nome": "Ouro Preto",
        "geocodigo": "3146107"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/68927356.pdf",
    "citacao": "Ata de audiência realizada no dia 09/05/2019, relativa aos processos 5010709-36.2019.8.13.0024, 5044954-73.2019.8.13.0024 e 5026408-67.2019.8.13.0024. Tratou-se das seguintes questões: proposta de atuação técnica da UFMG; construção de nova captação de água do Rio Paraopeba pela Vale S/A; necessidade de atuação para evitar desabastecimento de água na Região Metropolitana de Belo Horizonte; captação no Rio Macaúbas; entrega pela Vale S/A do Poço Profundo no Parque da Cachoeira; comportas em ensecadeiras e requerimentos feitos pelo Estado de Minas Gerais; custeamento pela Vale S/A da estrutura física para evento de escolha da Assessoria Técnica em Brumadinho; revitalização da linha férrea até Ouro Preto; pagamentos emergenciais realizados e agendados para atendimento pela Vale S/A; prorrogação de prazo para análise pela Vale S/A dos documentos de entrega coletiva; atendimento de água potável; expedição de ofício ao Defensor Público Geral do Estado e ao Procurador-Geral de Justiça com elogios à atuação, respectivamente, da Dra. Carolina Morishita e do Dr. André Sperling; expedição de alvará de R$500.000.000,00 substituídos por seguro-garantia; e negociações com a Vale S/A de dívidas decorrentes de atividade rural. \n\nParticipantes: representantes do Estado de Minas Gerais, da Advocacia Geral do Estado de Minas Gerais, do Ministério Público de Minas Gerais, da Defensoria Pública de Minas Gerais, da Vale S/A, das instituições federais cadastradas como Amici Curiae (Advocacia Geral da União, Ministério Público Federal, Defensoria Pública da União), do município de Belo Horizonte, da UFMG e da Fundação de Desenvolvimento da Pesquisa (FUNDEP) e pessoas cadastradas previamente para a audiência."
  },
  {
    "id": "68927358",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "68927358-Ata de Audiência",
    "tipo": "ata de audiência",
    "data": "2019-05-09",
    "municipios": [
      {
        "nome": "Ouro Preto",
        "geocodigo": "3146107"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/68927358.pdf",
    "citacao": "Ata de audiência realizada no dia 09/05/2019, relativa aos processos 5010709-36.2019.8.13.0024, 5044954-73.2019.8.13.0024 e 5026408-67.2019.8.13.0024. Tratou-se das seguintes questões: proposta de atuação técnica da UFMG; construção de nova captação de água do Rio Paraopeba pela Vale S/A; necessidade de atuação para evitar desabastecimento de água na Região Metropolitana de Belo Horizonte; captação no Rio Macaúbas; entrega pela Vale S/A do Poço Profundo no Parque da Cachoeira; comportas em ensecadeiras e requerimentos feitos pelo Estado de Minas Gerais; custeamento pela Vale S/A da estrutura física para evento de escolha da Assessoria Técnica em Brumadinho; revitalização da linha férrea até Ouro Preto; pagamentos emergenciais realizados e agendados para atendimento pela Vale S/A; prorrogação de prazo para análise pela Vale S/A dos documentos de entrega coletiva; atendimento de água potável; expedição de ofício ao Defensor Público Geral do Estado e ao Procurador-Geral de Justiça com elogios à atuação, respectivamente, da Dra. Carolina Morishita e do Dr. André Sperling; expedição de alvará de R$500.000.000,00 substituídos por seguro-garantia; e negociações com a Vale S/A de dívidas decorrentes de atividade rural. \n\nParticipantes: representantes do Estado de Minas Gerais, da Advocacia Geral do Estado de Minas Gerais, do Ministério Público de Minas Gerais, da Defensoria Pública de Minas Gerais, da Vale S/A, das instituições federais cadastradas como Amici Curiae (Advocacia Geral da União, Ministério Público Federal, Defensoria Pública da União), do município de Belo Horizonte, da UFMG e da Fundação de Desenvolvimento da Pesquisa (FUNDEP) e pessoas cadastradas previamente para a audiência."
  },
  {
    "id": "69060380",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "69060380-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-10",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/69060380.pdf",
    "citacao": null
  },
  {
    "id": "69996959",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "69996959-Manifestação da Defensoria Pública",
    "tipo": "manifestação da defensoria pública",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/69996959.pdf",
    "citacao": "Manifestação da Defensoria Pública do Estado de Minas Gerais, requerendo a juntada dos documentos referentes ao procedimento de escolha da entidade de assessoria técnica da Região 1 - Brumadinho."
  },
  {
    "id": "69996963",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "69996963-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/69996963.pdf",
    "citacao": "Comunicado nº 04 das Instituições de Justiça (Defensoria Pública da União, Ministério Público Federal, Ministério Público do Estado de Minas Gerais, e Defensoria Pública do Estado de Minas Gerais), responsáveis pelo Chamamento Público para o credenciamento de entidades sem fins lucrativos interessadas em prestar assessoria técnica às pessoas atingidas pelo rompimento da barragem da Mina do Córrego do Feijão. Assunto: relato da reunião do dia 19/05/2019, na qual a Associação Estadual de Defesa Ambiental e Social (AEDAS) foi escolhida para prestar assessoria técnica às pessoas atingidas na Região 1 (município de Brumadinho), por ter obtido mais de 50% dos votos, em primeira votação."
  },
  {
    "id": "70102151",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "70102151-Ata de Audiência",
    "tipo": "ata de audiência",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "infraestrutura",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70102151.pdf",
    "citacao": "Termo de Audiência realizada no dia 21/05/2019 relativa aos processos 5010709-36.2019.8.13.0024, 5044954-73.2019.8.13.0024, 5026408-67.2019.8.13.0024 e 5071521-44.2019.8.13.0024. Tratou-se das seguintes questões: \"Projeto de avaliação de necessidades pós-desastre do colapso da barragem Mina Córrego do Feijão\" apresentado pela Universidade Federal de Minas Gerais (UFMG); instituição do comitê técnico para auxílio do Juízo; distribuição por dependência desta ata de audiência para constituição de autos apartados em anexo; pedido pelas partes de oitiva das testemunhas; homologação da escolha das assessorias técnicas pelos atingidos; assessoria técnica da região II; problemas com pagamentos de indenizações emergenciais; funcionamento do posto de atendimento em Pará de Minas; cronograma de obras de captação a montante no Rio Paraopeba; cronograma detalhado de ações e obras para aumento da resiliência nos sistemas do Rio Paraopeba e Rio das Velhas; relatório de acompanhamento pela Companhia de Saneamento de Minas Gerais (COPASA) da obra para solução de captação de água na região metropolitana de Belo Horizonte; custeio pela Vale S/A da construção da captação no Rio Macaúbas; reserva hídrica da região metropolitana de Belo Horizonte; pagamento emergencial de produtores rurais; e reativação da linha férrea de Belo Horizonte a Ouro Preto. \n\nParticipantes: representantes do Estado de Minas Gerais, da Advocacia Geral do Estado de Minas Gerais, do Ministério Público de Minas Gerais, da Defensoria Pública do Estado de Minas Gerais, da Vale S/A, do Ministério Público Federal, da Defensoria Pública da União, da COPASA e da Universidade Federal de Minas Gerais e pessoas cadastradas previamente para a audiência."
  },
  {
    "id": "70102153",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "70102153-Ata de Audiência",
    "tipo": "ata de audiência",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "infraestrutura",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70102153.pdf",
    "citacao": "Termo de Audiência realizada no dia 21/05/2019 relativa aos processos 5010709-36.2019.8.13.0024, 5044954-73.2019.8.13.0024, 5026408-67.2019.8.13.0024 e 5071521-44.2019.8.13.0024. Tratou-se das seguintes questões: \"Projeto de avaliação de necessidades pós-desastre do colapso da barragem Mina Córrego do Feijão\" apresentado pela Universidade Federal de Minas Gerais (UFMG); instituição do comitê técnico para auxílio do Juízo; distribuição por dependência desta ata de audiência para constituição de autos apartados em anexo; pedido pelas partes de oitiva das testemunhas; homologação da escolha das assessorias técnicas pelos atingidos; assessoria técnica da região II; problemas com pagamentos de indenizações emergenciais; funcionamento do posto de atendimento em Pará de Minas; cronograma de obras de captação a montante no Rio Paraopeba; cronograma detalhado de ações e obras para aumento da resiliência nos sistemas do Rio Paraopeba e Rio das Velhas; relatório de acompanhamento pela Companhia de Saneamento de Minas Gerais (COPASA) da obra para solução de captação de água na região metropolitana de Belo Horizonte; custeio pela Vale S/A da construção da captação no Rio Macaúbas; reserva hídrica da região metropolitana de Belo Horizonte; pagamento emergencial de produtores rurais; e reativação da linha férrea de Belo Horizonte a Ouro Preto. \n\nParticipantes: representantes do Estado de Minas Gerais, da Advocacia Geral do Estado de Minas Gerais, do Ministério Público de Minas Gerais, da Defensoria Pública do Estado de Minas Gerais, da Vale S/A, do Ministério Público Federal, da Defensoria Pública da União, da COPASA e da Universidade Federal de Minas Gerais e pessoas cadastradas previamente para a audiência."
  },
  {
    "id": "70102986",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "70102986-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70102986.pdf",
    "citacao": "Nota técnica conjunta de 01/03/2016 do Governo Federal e dos Governos Estaduais do Espírito Santo e de Minas Gerais, na qual apresentam-se: i) a definição dos programas socioeconômicos que compõem o Termo de Transação e Ajustamento de Conduta relativo à recuperação dos impactos socioambientais e socioeconômicos do rompimento da barragem de Fundão em Mariana; e ii) a consolidação dos gastos extraordinários incorridos por seus órgãos e entidades para execução de medidas emergenciais necessárias para atendimento da população atingida e para identificação e mitigação dos danos ambientais, totalizando R$ 27.500.000,00."
  },
  {
    "id": "70103656",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "70103656-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70103656.pdf",
    "citacao": "Apresentação elaborada pela Vale S/A, sobre principais ações ambientais em andamento na Bacia do Rio Paraopeba, em que são abordadas questões referentes a monitoramento, ações de engenharia, mitigação do impacto no abastecimento de água em Pará de Minas, fornecimento de água potável e resgate de fauna."
  },
  {
    "id": "70103660",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "70103660-Contestação",
    "tipo": "contestação",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70103660.pdf",
    "citacao": "Contestação apresentada pela Vale S/A, na qual requer: i) a extinção do processo sem resolução do mérito, diante da falta de interesse de agir; ii) caso não seja acolhida pelo magistrado a extinção do processo, que se reconheça a incorreção do valor da causa com a sua consequente redução; iii) a improcedência de todos os pedidos elaborados na petição inicial; e iv) a produção de prova documental suplementar e pericial e, se necessária, a produção de prova oral."
  },
  {
    "id": "70103689",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "70103689-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70103689.pdf",
    "citacao": "Termo de Compromisso firmado entre o Ministério Público de Minas Gerais, a Vale S/A, o Município de Pará de Minas e a concessionária de saneamento básico Águas de Pará de Minas S/A (“TAC Pará de Minas”). O objeto principal deste Termo de Ajustamento consiste na elaboração, no custeio e na execução de projeto e obras para a construção de novos sistemas de captação e de adução de água bruta sob responsabilidade da Vale, visando à recomposição do sistema de abastecimento de água do município de Pará de Minas."
  },
  {
    "id": "70103690",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "70103690-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70103690.pdf",
    "citacao": null
  },
  {
    "id": "70104446",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "70104446-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70104446.pdf",
    "citacao": null
  },
  {
    "id": "70104447",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "70104447-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Barão de Cocais",
        "geocodigo": "3105400"
      },
      {
        "nome": "Itabirito",
        "geocodigo": "3131901"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70104447.pdf",
    "citacao": "Relatório em formato de apresentação elaborado pela Vale S/A e pela empresa Accenture sobre a Evolução de Obras e Reformas de Casas nas cidades de Brumadinho, Barão de Cocais, Macacos e Itabirito, São José do Paraopeba, Aranha, Piedade do Paraopeba e Casa Branca."
  },
  {
    "id": "70104449",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "70104449-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70104449.pdf",
    "citacao": "\"Plano emergencial de manejo de biodiversidade aquática (resgate/salvamento): atendimento emergencial de salvamento e coleta de carcaças\" produzido pela Vale S/A em conjunto com a empresa de engenharia CLAM, em abril de 2019. O relatório contempla as ações da CLAM, no período de 27/01 a 14/05/2019, com foco no recolhimento de carcaça dos peixes, indivíduos moribundos e agonizantes, salvamento e realocação de indivíduos vivos em situações de risco"
  },
  {
    "id": "70104455",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "70104455-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Ouro Preto",
        "geocodigo": "3146107"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70104455.pdf",
    "citacao": "Captura de tela, feita pela Vale S/A, do jornal Hoje em Dia, com notícia de 11/03/2019 de manchete: \"Carnaval de Ouro Preto tem melhor público em 5 anos, com 45 mil foliões por dia\"."
  },
  {
    "id": "70104459",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "70104459-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70104459.pdf",
    "citacao": "Termo de Compromisso Preliminar firmado entre o Ministério Público Federal, o Ministério Público de Minas Gerais e a Samarco Mineração S/A. Constitui o objeto deste Termo de Compromisso Preliminar o estabelecimento de caução socioambiental para garantia de custeio de medidas preventivas emergenciais, mitigatórias, reparatórias ou compensatórias, sejam elas ambientais ou socioambientais decorrentes do rompimento das barragens de rejeitos sob responsabilidade da Samarco na Comarca de Mariana. Acorda-se que a Samarco prestará garantia emergencial mínima no valor de R$ 1.000.000.000,00."
  },
  {
    "id": "70104462",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "70104462-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70104462.pdf",
    "citacao": "Termo de Ajustamento de Conduta, firmado entre Ministério Público Federal, Ministério Público de Minas Gerais, Ministério Público do Estado do Espírito Santo, Defensoria Pública da União, Defensoria Pública do Estado de Minas Gerais, Defensoria Pública do Estado do Espírito Santo, União, Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA), Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio), Agência Nacional das Águas (ANA), Agência Nacional de Mineração (ANM), Fundação Nacional do Índio (FUNAI), Estado de Minas Gerais, Instituto Estadual de Florestas (IEF), Instituto Mineiro de Gestão das Águas (IGAM), Fundação Estadual do Meio Ambiente (FEAM), Estado do Espírito Santo, Instituto de Meio Ambiente e Recursos Hídricos (IEMA), Instituto de Defesa Agropecuária e Florestal do Espírito Santo (IDAF), Agência Estadual de Recursos Hídricos (AGERH), Samarco Mineração S/A, Vale S/A e BHP Billiton Brasil Ltda.  Os objetos do acordo são: i) a alteração do processo de governança previsto no Termo de Transação e de Ajustamento Conduta (TTAC), para definição e execução dos programas, projetos e ações que se destinam à Recuperação integral dos danos decorrentes do rompimento da barragem de Fundão; ii) o aprimoramento de mecanismos de efetiva participação das pessoas atingidas pelo rompimento da Barragem de Fundão em todas as etapas e fases do TTAC e do presente acordo; e iii) o estabelecimento de um processo dc negociação visando a eventual repactuação dos programas."
  },
  {
    "id": "70104473",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "70104473-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "meio ambiente",
      "saúde da população",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70104473.pdf",
    "citacao": null
  },
  {
    "id": "70104846",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "70104846-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Barão de Cocais",
        "geocodigo": "3105400"
      },
      {
        "nome": "Itabirito",
        "geocodigo": "3131901"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70104846.pdf",
    "citacao": "Relatório em formato de apresentação elaborado pela Vale S/A e pela empresa Accenture sobre a Evolução de Obras e Reformas de Casas nas cidades de Brumadinho, Barão de Cocais, Macacos e Itabirito, São José do Paraopeba, Aranha, Piedade do Paraopeba e Casa Branca."
  },
  {
    "id": "70104865",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "70104865-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-21",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70104865.pdf",
    "citacao": "Nota técnica conjunta de 01/03/2016 do Governo Federal e dos Governos Estaduais do Espírito Santo e de Minas Gerais, na qual apresentam-se: i) a definição dos programas socioeconômicos que compõem o Termo de Transação e Ajustamento de Conduta relativo à recuperação dos impactos socioambientais e socioeconômicos do rompimento da barragem de Fundão em Mariana; e ii) a consolidação dos gastos extraordinários incorridos por seus órgãos e entidades para execução de medidas emergenciais necessárias para atendimento da população atingida e para identificação e mitigação dos danos ambientais, totalizando R$ 27.500.000,00."
  },
  {
    "id": "70181512",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "70181512-Petição Inicial",
    "tipo": "petição inicial",
    "data": "2019-05-22",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "infraestrutura",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70181512.pdf",
    "citacao": "Termo de Audiência realizada no dia 21/05/2019, relativa aos processos 5010709-36.2019.8.13.0024, 5044954-73.2019.8.13.0024, 5026408-67.2019.8.13.0024 e 5071521-44.2019.8.13.0024. Na audiência tratou-se das seguintes questões: \"Projeto de avaliação de necessidades pós-desastre do colapso da barragem Mina Córrego do Feijão\" apresentado pela Universidade Federal de Minas Gerais (UFMG); instituição do comitê técnico para auxílio do Juízo; distribuição por dependência desta ata de audiência para constituição de autos apartados em anexo; pedido pelas partes de oitiva das testemunhas; homologação da escolha das assessorias técnicas pelos atingidos; assessoria técnica da região II; problemas com pagamentos de indenizações emergenciais; funcionamento do posto de atendimento em Pará de Minas; cronograma de obras de captação a montante no Rio Paraopeba; cronograma detalhado de ações e obras para aumento da resiliência nos sistemas do Rio Paraopeba e Rio das Velhas; relatório de acompanhamento pela Companhia de Saneamento de Minas Gerais (COPASA) da obra para solução de captação de água na região metropolitana de Belo Horizonte; custeio pela Vale S/A da construção da captação no Rio Macaúbas; reserva hídrica da região metropolitana de Belo Horizonte; pagamento emergencial de produtores rurais; e reativação da linha férrea de Belo Horizonte a Ouro Preto. \n\n\n\nParticipantes: representantes do Estado de Minas Gerais, da Advocacia Geral do Estado de Minas Gerais, do Ministério Público de Minas Gerais, da Defensoria Pública de Minas Gerais, da Vale, do Ministério Público Federal, da Defensoria Pública da União, da COPASA e da Universidade Federal de Minas Gerais e pessoas cadastradas previamente para a audiência."
  },
  {
    "id": "70537958",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "70537958-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-24",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/70537958.pdf",
    "citacao": null
  },
  {
    "id": "71314992",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "71314992-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-05-31",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/71314992.pdf",
    "citacao": null
  },
  {
    "id": "72084224",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "72084224-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-06-07",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/72084224.pdf",
    "citacao": null
  },
  {
    "id": "73019662",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "73019662-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73019662.pdf",
    "citacao": null
  },
  {
    "id": "73013169_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013169_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013169_1.pdf",
    "citacao": "Inquérito Civil nº 0090.19-000011-8 instaurado pelo Ministério Público de Minas Gerais. O objetivo do inquérito é apurar os fatos que ensejaram o rompimento da barragem de rejeitos minerários localizada na Mina Córrego do Feijão - Complexo Paraopeba (Vale S/A), bem como identificar os responsáveis pelo fato e providências cabíveis para salvaguarda dos recursos naturais e das vítimas, além da responsabilização do(s) administrador(es) do empreendimento. Na deliberação ministerial é determinado: 1) a instauração do inquérito; 2) que proceda o contato com a Coordenadoria Regional das Promotorias de Justiça de Meio Ambiente das Bacias dos Rios das Velhas e Paraopeba e o Centro de Apoio Operacional de Meio Ambiente; 3) que proceda o contato com a Polícia Militar do Meio Ambiente; 4) que proceda a juntada de fotos e vídeos acerca do fato, como também as movimentações do SRU pertinentes aos inquéritos MPMG 0090.16.000311-8 e MPMG-0090.15.000091-8."
  },
  {
    "id": "73013169_3",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013169_3-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013169_3.pdf",
    "citacao": "Inquérito Civil nº MPMG-0090.16.000311-8 instaurado pelo Ministério Público de Minas Gerais, cujo objetivo é analisar a documentação das barragens Capim Branco, Barragem 1, Barragem IV, Barragem IV-A, Barragem VI, Barragem VII, Menezes I e Menezes II, de responsabilidade da Vale S/A."
  },
  {
    "id": "73013169_5",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013169_5-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013169_5.pdf",
    "citacao": "Compilado, juntado pelo Ministério Público de Minas Gerais, de capturas de tela e imagens, contendo captura de tela de jornal online G1 sobre rompimento da Barragem em Brumadinho e imagens (sem descrição)."
  },
  {
    "id": "73013169_11",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013169_11-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013169_11.pdf",
    "citacao": "Petição inicial do processo nº 5044954-73.2019.8.13.0024 ajuizada pelo Ministério Público de Minas Gerais. Diante do rompimento das barragens de rejeitos de mineração de propriedade da Vale S/A no município de Brumadinho-MG em 25/01/2019, o autor requer tutela antecipada em caráter antecedente em desfavor da Vale S/A, visando a reparação dos danos ambientais e a adoção de todas as medidas necessárias para que os danos não se exacerbem. O processo foi originalmente tramitado em meio físico, na Comarca de Brumadinho, com a numeração 0001835-46.2019.8.13.0090. Após a distribuição da presente ação para o meio eletrônico, com a sua inclusão no Processo Judicial Eletrônico (PJe), recebeu a numeração 5000056-68.2019.8.13.0090 e foi, posteriormente, distribuído em Belo Horizonte com a numeração 5044954-73.2019.8.13.0024."
  },
  {
    "id": "73013175_4",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013175_4-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013175_4.pdf",
    "citacao": "Nota técnica conjunta de 01/03/2016 do Governo Federal e dos Governos Estaduais do Espírito Santo e de Minas Gerais, na qual apresentam-se: i) a definição dos programas socioeconômicos que compõem o Termo de Transação e Ajustamento de Conduta relativo à recuperação dos impactos socioambientais e socioeconômicos do rompimento da barragem de Fundão em Mariana; e ii) a consolidação dos gastos extraordinários incorridos por seus órgãos e entidades para execução de medidas emergenciais necessárias para atendimento da população atingida e para identificação e mitigação dos danos ambientais, totalizando R$ 27.500.000,00."
  },
  {
    "id": "73013175_5",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013175_5-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013175_5.pdf",
    "citacao": "Notícia do jornal Valor Econômico, juntada pela Vale S/A, sobre determinação judicial de bloqueio de R$ 300.000.000,00 na conta da Samarco após o rompimento da barragem de Fundão."
  },
  {
    "id": "73013175_6",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013175_6-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013175_6.pdf",
    "citacao": "Termo de Compromisso Preliminar firmado entre o Ministério Público Federal, o Ministério Público de Minas Gerais e a Samarco Mineração S/A. Constitui o objeto deste Termo de Compromisso Preliminar o estabelecimento de caução socioambiental para garantia de custeio de medidas preventivas emergenciais, mitigatórias, reparatórias ou compensatórias, sejam elas ambientais ou socioambientais, decorrentes do rompimento das barragens de rejeitos sob responsabilidade da Samarco na Comarca de Mariana. No mesmo, acorda-se que a Samarco prestará garantia emergencial mínima no valor de R$ 1.000.000.000,00."
  },
  {
    "id": "73013175_7",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013175_7-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013175_7.pdf",
    "citacao": "Notícia do jornal Valor Econômico, juntada pela Vale S/A, sobre determinação judicial de bloqueio de R$ 500.000.000,00 na conta da Samarco Mineração S/A após o rompimento da barragem de Fundão."
  },
  {
    "id": "73013175_8",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013175_8-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013175_8.pdf",
    "citacao": "Termo de Ajustamento de Conduta, firmado entre Ministério Público Federal, Ministério Público de Minas Gerais, Ministério Público do Estado do Espírito Santo, Defensoria Pública da União, Defensoria Pública do Estado de Minas Gerais, Defensoria Pública do Estado do Espírito Santo, União, Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA), Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio), Agência Nacional das Águas (ANA), Agência Nacional de Mineração (ANM), Fundação Nacional do Índio (FUNAI), Estado de Minas Gerais, Instituto Estadual de Florestas (IEF), Instituto Mineiro de Gestão das Águas (IGAM), Fundação Estadual do Meio Ambiente (FEAM), Estado do Espírito Santo, Instituto de Meio Ambiente e Recursos Hídricos (IEMA), Instituto de Defesa Agropecuária e Florestal do Espírito Santo (IDAF), Agência Estadual de Recursos Hídricos (AGERH), Samarco Mineração S/A, Vale S/A e BHP Billiton Brasil Ltda. Os objetos do acordo são: i) a alteração do processo de governança previsto no Termo de Transação e de Ajustamento de Conduta (TTAC), para definição e execução dos programas, projetos e ações que se destinam à reparação integral dos danos decorrentes do rompimento da barragem de Fundão; ii) o aprimoramento de mecanismos de efetiva participação das pessoas atingidas pelo rompimento da Barragem de Fundão em todas as etapas e fases do TTAC e do presente acordo; e iii) o estabelecimento de um processo dc negociação visando a eventual repactuação dos programas."
  },
  {
    "id": "73013176_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013176_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013176_1.pdf",
    "citacao": "Termo de Transação e de Ajustamento de Conduta (TTAC) firmado entre União, Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA), Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio), Agência Nacional das Águas (ANA), Departamento Nacional de Produção Mineral (DNPM), Fundação Nacional do Índio (FUNAI), Estado de Minas Gerais (EMG), Instituto Estadual de Florestas (IEF), Instituto Mineiro de Gestão das Águas (IGAM), Fundação Estadual do Meio Ambiente (FEAM), Estado do Espírito Santo (EES), Instituto de Meio Ambiente e Recursos Hídricos (IEMA), Instituto de Defesa Agropecuária e Florestal do Espírito Santo (IDAF), Agência Estadual de Recursos Hídricos (AGERH), Samarco, Vale S/A e BHP Billiton, relativo ao rompimento da barragem de Fundão em Mariana-MG. O documento também contém o anexo à cláusula 03 – Lista de Ações Judiciais – e o anexo à cláusula 141 – despesas dos órgãos públicos federais."
  },
  {
    "id": "73013190_3",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013190_3-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013190_3.pdf",
    "citacao": "Nota técnica conjunta de 01/03/2016 do Governo Federal e dos Governos Estaduais do Espírito Santo e de Minas Gerais, na qual apresentam-se: i) a definição dos programas socioeconômicos que compõem o Termo de Transação e Ajustamento de Conduta relativo à recuperação dos impactos socioambientais e socioeconômicos do rompimento da barragem de Fundão em Mariana; e ii) a consolidação dos gastos extraordinários incorridos por seus órgãos e entidades para execução de medidas emergenciais necessárias para atendimento da população atingida e para identificação e mitigação dos danos ambientais, totalizando R$ 27.500.000,00."
  },
  {
    "id": "73013190_4",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013190_4-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013190_4.pdf",
    "citacao": "Notícia do jornal Valor Econômico, juntada pela Vale S/A, sobre determinação judicial de bloqueio de R$ 300.000.000,00 na conta da Samarco Mineração S/A, após o rompimento da barragem de Fundão."
  },
  {
    "id": "73013190_5",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013190_5-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013190_5.pdf",
    "citacao": "Termo de Compromisso Preliminar firmado entre o Ministério Público Federal, o Ministério Público de Minas Gerais e a Samarco Mineração S/A. Constitui o objeto deste Termo de Compromisso Preliminar o estabelecimento de caução socioambiental para garantia de custeio de medidas preventivas emergenciais, mitigatórias, reparatórias ou compensatórias, sejam elas ambientais ou socioambientais, decorrentes do rompimento das barragens de rejeitos sob responsabilidade da Samarco na Comarca de Mariana. Acorda-se que a Samarco prestará garantia emergencial mínima no valor de R$ 1.000.000.000,00."
  },
  {
    "id": "73013190_6",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013190_6-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013190_6.pdf",
    "citacao": "Notícia do jornal Valor Econômico, juntada pela Vale S/A, sobre determinação judicial de bloqueio de R$ 500.000.000,00 na conta da Samarco Mineração S/A, após o rompimento da barragem de Fundão."
  },
  {
    "id": "73013190_7",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013190_7-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013190_7.pdf",
    "citacao": "Termo de Ajustamento de Conduta, firmado entre Ministério Público Federal, Ministério Público de Minas Gerais, Ministério Público do Estado do Espírito Santo, Defensoria Pública da União, Defensoria Pública do Estado de Minas Gerais, Defensoria Pública do Estado do Espírito Santo, União, Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA), Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio), Agência Nacional das Águas (ANA), Agência Nacional de Mineração (ANM), Fundação Nacional do Índio (FUNAI), Estado de Minas Gerais, Instituto Estadual de Florestas (IEF), Instituto Mineiro de Gestão das Águas (IGAM), Fundação Estadual do Meio Ambiente (FEAM), Estado do Espírito Santo, Instituto de Meio Ambiente e Recursos Hídricos (IEMA), Instituto de Defesa Agropecuária e Florestal do Espírito Santo (IDAF), Agência Estadual de Recursos Hídricos (AGERH), Samarco Mineração S/A, Vale S/A e BHP Billiton Brasil Ltda. Os objetos do acordo são: i) a alteração do processo de governança previsto no Termo de Transação e de Ajustamento de Conduta (TTAC), para definição e execução dos programas, projetos e ações que se destinam à reparação integral dos danos decorrentes do rompimento da barragem de Fundão; ii) o aprimoramento de mecanismos de efetiva participação das pessoas atingidas pelo rompimento da Barragem de Fundão em todas as etapas e fases do TTAC e do presente acordo; e iii) o estabelecimento de um processo de negociação visando a eventual repactuação dos programas."
  },
  {
    "id": "73013191_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73013191_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-17",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73013191_1.pdf",
    "citacao": "Termo de Transação e de Ajustamento de Conduta (TTAC) firmado entre a União, Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA), Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio), Agência Nacional das Águas (ANA), Departamento Nacional de Produção Mineral (DNPM), Fundação Nacional do Índio (FUNAI), Estado de Minas Gerais (EMG), Instituto Estadual de Florestas (IEF), Instituto Mineiro de Gestão das Águas (IGAM), Fundação Estadual do Meio Ambiente (FEAM), Estado do Espírito Santo (EES), Instituto de Meio Ambiente e Recursos Hídricos (IEMA), Instituto de Defesa Agropecuária e Florestal do Espírito Santo (IDAF), Agência Estadual de Recursos Hídricos (AGERH), Samarco, Vale S/A e BHP Billiton, relativo ao rompimento da barragem de Fundão em Mariana-MG."
  },
  {
    "id": "73094686",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "73094686-Petição",
    "tipo": "petição",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Nova Lima",
        "geocodigo": "3144805"
      },
      {
        "nome": "Sabará",
        "geocodigo": "3156700"
      },
      {
        "nome": "Rio Acima",
        "geocodigo": "3154804"
      },
      {
        "nome": "Raposos",
        "geocodigo": "3153905"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73094686.pdf",
    "citacao": "Petição da Vale, em atenção ao que foi decidido na audiência do dia 21/05/2019, sobre: cronograma de obras para a construção do novo ponto de captação no Rio Paraopeba; sistemas de proteção física da captação de Bela Fama (“ETA Bela Fama”) e adequação e reforço no sistema de tratamento da ETA Bela Fama; e pedidos de indeferimentos dos pleitos de construção de interligação do sistema Paraopeba com o sistema Rio das Velhas e de uma nova captação no Rio Macaúbas, afluente do Rio Paraopeba."
  },
  {
    "id": "73160389",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160389-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160389.pdf",
    "citacao": "Relatório de vistoria apresentado pela Secretaria Municipal de Meio Ambiente do município de Igarapé em que analisa a situação do rio Paraopeba na região da Zona Rural próxima aos bairros Vila Cruz Alta e Beverly, em Igarapé-MG, após o rompimento da barragem de rejeitos. O documento também traz informações sobre o projeto ambiental \"Guardião dos Igarapés\"."
  },
  {
    "id": "73161250_7",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161250_7-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161250_7.pdf",
    "citacao": "Memória de reunião realizada pela Força-Tarefa Brumadinho do Ministério Público de Minas Gerais no dia 25/02/2019 em que participaram, dentre outros, representantes da Secretaria Municipal de Saúde de Brumadinho (SMS), das Comunidades de Pires e São Joaquim de Bicas, do Residencial Fhemig, da Defensoria Pública da União, do Ministério Público de Minas Gerais, da Vale S/A, do Movimento dos Atingidos por Barragem (MAB) e da Prefeitura de Brumadinho. Na reunião discutiram-se os seguintes pontos: 1) Balanço das ações realizadas pela Vale S/A; 2) Status da contratação de servidores temporários pelo Município e entrega dos materiais e equipamentos ajustados entre a Vale e o Município; 3) Planejamento das enchentes; 4) Assistência Psicossocial a Mário Campos; 5) Comunidade de Melo Franco; 6) Questão referente aos agricultores; 7) Situação da água de São Joaquim de Bicas; 8) Doações; e 9) Famílias que ainda se encontram em hotéis"
  },
  {
    "id": "73150131_10",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73150131_10-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73150131_10.pdf",
    "citacao": "Petição da Vale S/A, em cumprimento ao item 7 da decisão proferida no dia 26/01/2019 (ID 73013172_2), apresenta-se relatório consolidado contendo informações sobre medidas que vêm sendo adotadas em apoio aos atingidos, como também relatório atualizado dos atingidos e familiares alojados pela Vale S/A, com os respectivos locais em que estão abrigados, a fim de requerer a sua juntada. Na petição, Vale S/A também informa sobre outras questões tratadas em reuniões em continuidade às ações tomadas junto à Força Tarefa de Brumadinho, que dizem respeito: ao Termo de Acordo Psicossocial celebrado entre a Vale S/A e o município de Brumadinho; a demandas apresentadas pelos representantes da comunidades de Mário Campos, São Joaquim de Bicas e Colônia de Santa Isabel; ao abastecimento dos presídios de São Joaquim de Bicas; ao transporte escolar para os estudantes hospedados na Pousada Alta Vista; à assistência técnica aos agricultores da região; a questões específicas quanto à morada dos atingidos."
  },
  {
    "id": "73150131_12",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73150131_12-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73150131_12.pdf",
    "citacao": "Memória de reunião realizada pela Força-Tarefa Brumadinho do Ministério Público de Minas Gerais no dia 18/02/2019, em que participaram, dentre outros, os representantes do Ministério Público de Minas Gerais, da comunidade de Pires e São Joaquim de Bicas, do Movimento dos Atingidos por Barragens, da Secretaria Municipal de Saúde de Brumadinho, da Defensoria Pública da União e da Vale S/A para discutir os encaminhamentos a serem dados na defesa dos direitos humanos e sociais dos atingidos. Foram tratadas as seguintes questões: 1) Termo de ajuste firmado entre Brumadinho e Vale; 2) Formulário de cadastro de famílias; 3) Auxílio financeiro emergencial; 4) Máquinas de funcionamento na Comunidade Pires; 5) Famílias hospedadas em hotéis; 6) Agricultura; 7) Doações."
  },
  {
    "id": "73150136_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73150136_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73150136_2.pdf",
    "citacao": "Memória de reunião realizada pela Força-Tarefa Brumadinho do Ministério Público de Minas Gerais no dia 25/02/2019 em Brumadinho-MG, em que foram discutidos os seguintes pontos: 1) Balanço das ações realizadas pela Vale S/A; 2) Status da contratação de servidores temporários pelo município e entrega dos materiais e equipamentos ajustados entre a Vale e o Município; 3) Planejamento das enchentes; 4) Assistência Psicossocial a Mário Campos; 5) Comunidade de Melo Franco; 6) Questão referente aos agricultores; 7) Situação da água de São Joaquim de Bicas; 8) Doações; 9) Famílias que ainda se encontram em hotéis."
  },
  {
    "id": "73151299_3",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73151299_3-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73151299_3.pdf",
    "citacao": "Memória de reunião realizada pela Força-Tarefa Brumadinho do Ministério Público de Minas Gerais no dia 01/03/2019 em Brumadinho-MG, com a participação de representantes do Ministério Público de Minas Gerais, do município de Brumadinho-MG, da comunidade de Pires em Brumadinho-MG, do Movimento de Atingidos por Barragens (MAB), do município de São João de Bicas e da Vale S/A. Foram tratadas as seguintes questões: 1) Termo de ajuste firmado entre a empresa Vale e o Município de Brumadinho; 2) Demandas individuais apresentadas pelos representantes das comunidades presentes; 3) Melhoria na publicidade das informações; 4) Formulários para cadastramento dos atingidos; 5) Presença de psicólogos da Vale nas escolas; 6) Treinamento de evacuação realizado pela Defesa civil nas escolas; 7) Interdição da estrada de Alberto Flores; 8) Atendimento médico às comunidades quilombolas; 9) Demandas do município de São Joaquim de Bicas; 10) Demandas de citrolândia; 11) Entrega coletiva dos documentos no Córrego do Feijão, para fins de recebimento dos valores acordados no TAP; 12) Agricultores e projeto apresentado; 13) Famílias em hotéis."
  },
  {
    "id": "73151296_10",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73151296_10-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73151296_10.pdf",
    "citacao": "Relatório elaborado pela Vale S/A sobre a frente Água Agropecuária, em que apresenta informações referentes aos atendimentos executados em Betim, Colônia Santa Isabel, São Joaquim de Bicas e Mário Campos (reta do Jacaré). O documento também contém tabela com informações referentes ao fornecimento de água."
  },
  {
    "id": "73151333_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73151333_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73151333_1.pdf",
    "citacao": "Memória de reunião realizada pela Força-Tarefa Brumadinho do Ministério Público de Minas Gerais no dia 18/02/2019, em que participaram, dentre outros, os representantes do Ministério Público de Minas Gerais, da comunidade de Pires e São Joaquim de Bicas, do Movimento dos Atingidos por Barragens, da Secretaria Municipal de Saúde, da Defensoria Pública da União e da Vale S/A para discutir os encaminhamentos a serem dados na defesa dos direitos humanos e sociais dos atingidos. Tratou-se das seguintes questões: 1) Termo de ajuste firmado entre Brumadinho e Vale; 2) Formulário de cadastro de famílias; 3) Auxílio financeiro emergencial; 4) Máquinas de funcionamento na Comunidade Pires; 5) Famílias hospedadas em hotéis; 6) Agricultura; 7) Doações."
  },
  {
    "id": "73151333_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73151333_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73151333_2.pdf",
    "citacao": "Memória de reunião realizada pela Força-Tarefa Brumadinho do Ministério Público de Minas Gerais no dia 11/03/2019, em que participaram, dentre outros, os representantes do Ministério Público de Minas Gerais, da comunidade de Pires e São Conrado, do Movimento dos Atingidos por Barragens, da Câmara Municipal de Brumadinho, da Secretaria Municipal da Saúde, da Defensoria Pública da União e da Vale S/A para discutir os encaminhamentos a serem dados na defesa dos direitos humanos e sociais dos atingidos. Tratou-se das seguintes questões: 1) Demandas do Município de Mário Campos; 2) Demandas do Município de São Joaquim de Bicas; 3) Apresentação dos números de atendimento da Vale no sistema; 4) Doações; 5) Demandas da Comunidade dos Pires; 6) Apresentação do funcionamento dos COES e prestação do atendimento da saúde."
  },
  {
    "id": "73152539_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73152539_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73152539_2.pdf",
    "citacao": "Notícia do jornal Valor Econômico, juntada pela Vale S/A, sobre determinação judicial de bloqueio de R$ 300.000.000,00 na conta da Samarco Mineração S/A, após o rompimento da barragem de Fundão."
  },
  {
    "id": "73152539_3",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73152539_3-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73152539_3.pdf",
    "citacao": "Notícia do jornal Valor Econômico, juntada pela Vale S/A, sobre determinação judicial de bloqueio de R$ 500.000.000,00 na conta da Samarco Mineração S/A após o rompimento da barragem de Fundão."
  },
  {
    "id": "73152539_4",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73152539_4-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73152539_4.pdf",
    "citacao": "Termo de Compromisso Preliminar firmado entre o Ministério Público Federal, o Ministério Público de Minas Gerais e a Samarco Mineração S/A. Constitui o objeto deste Termo de Compromisso Preliminar o estabelecimento de caução socioambiental para garantia de custeio de medidas preventivas emergenciais, mitigatórias, reparatórias ou compensatórias, sejam elas ambientais ou socioambientais, decorrentes do rompimento das barragens de rejeitos sob responsabilidade da Samarco na Comarca de Mariana. No mesmo, acorda-se que a Samarco prestará garantia emergencial mínima no valor de R$ 1.000.000.000,00."
  },
  {
    "id": "73152541_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73152541_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73152541_1.pdf",
    "citacao": "Nota técnica conjunta de 01/03/2016 do Governo Federal e dos Governos Estaduais do Espírito Santo e de Minas Gerais, na qual apresentam-se: i) a definição dos programas socioeconômicos que compõem o Termo de Transação e Ajustamento de Conduta relativo à recuperação dos impactos socioambientais e socioeconômicos do rompimento da barragem de Fundão em Mariana; e ii) a consolidação dos gastos extraordinários incorridos por seus órgãos e entidades para execução de medidas emergenciais necessárias para atendimento da população atingida e para identificação e mitigação dos danos ambientais, totalizando R$ 27.500.000,00."
  },
  {
    "id": "73160382_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160382_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160382_2.pdf",
    "citacao": "Relatório elaborado pelo Centro de Referência da Assistência Social da Prefeitura de Pompéu-MG em que relata os danos causados às famílias que se encontram próximas do rio Paraopeba e/ou que dependiam da água do rio para sua sobrevivência."
  },
  {
    "id": "73160382_3",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160382_3-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      },
      {
        "nome": "Morada Nova de Minas",
        "geocodigo": "3143500"
      },
      {
        "nome": "São Gonçalo do Abaeté",
        "geocodigo": "3161700"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160382_3.pdf",
    "citacao": "Reunião realizada em 28/02/2019 com representantes dos municípios de Três Marias, Morada Nova de Minas, São Gonçalo do Abaeté, Pompéu, Felixlândia e Curvelo. Na reunião foram discutidos os impactos que sustentam a reivindicação dos municípios prejudicados. Dentre eles estão: 1) prejuízos na rede hoteleira em torno da Represa de Três Marias; 2) prejuízo para os piscicultores; 3) a incerteza da segurança da água da represa de Três Marias para a pesca, agricultura e dessedentação animal, como também a qualidade do solo às margens desse mananciais; 4) a insegurança social causada pela possível contaminação da água e da possibilidade de perda de trabalho. Sendo assim, os integrantes da reunião propõem: 1) reconhecimento judicial de que os municípios reunidos são atingidos pelo rompimento da barragem; 2) que sejam feitos estudos independentes e monitorados acerca da qualidade da água na região; 3) que sejam instalados diques de contenção a jusante da Hidrelétrica Retiro Baixo para a contenção dos rejeitos; 4) garantir uma Assessoria Técnica que funcione em prol dos municípios, de forma independente."
  },
  {
    "id": "73160382_8",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160382_8-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160382_8.pdf",
    "citacao": "Relatório de Visita Técnica elaborado pela Coordenadoria de Inclusão e Mobilização Sociais do Ministério Público de Minas Gerais realizado no Município de Felixlândia-MG, que tem por objeto o mapeamento preliminar de danos socioeconômicos decorrentes do rompimento da barragem de rejeitos na Bacia Paraopeba."
  },
  {
    "id": "73160382_10",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160382_10-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160382_10.pdf",
    "citacao": "Relatório elaborado pela Coordenadoria de Inclusão e Mobilização Sociais do Ministério Público de Minas Gerais sobre visita realizada ao bairro Taquaras, no município de Esmeraldas-MG, que tem por objeto o mapeamento preliminar de danos socioeconômicos decorrentes do rompimento da barragem de rejeitos na Bacia Paraopeba."
  },
  {
    "id": "73160382_12",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160382_12-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      }
    ],
    "temas": [
      "socioeconômico",
      "saúde da população"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160382_12.pdf",
    "citacao": null
  },
  {
    "id": "73160382_13",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160382_13-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160382_13.pdf",
    "citacao": "Relatório elaborado pela Coordenadoria de Inclusão e Mobilização Sociais do Ministério Público de Minas Gerais sobre visita realizada ao bairro Francelino no Município de Juatuba, e sobre reunião realizada no bairro Satélite, ambas com objetivo de mapeamento preliminar de danos socioeconômicos decorrentes do rompimento da barragem de rejeitos na Bacia Paraopeba."
  },
  {
    "id": "73160382_14",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160382_14-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160382_14.pdf",
    "citacao": "Relatório elaborado pela Coordenadoria de Inclusão e Mobilização Sociais do Ministério Público de Minas Gerais sobre visita realizada no Município de Papagaios, que tem como objeto o mapeamento preliminar de danos socioeconômicos decorrentes do rompimento da barragem de rejeitos na Bacia Paraopeba."
  },
  {
    "id": "73160382_20",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160382_20-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160382_20.pdf",
    "citacao": "Termo de declarações de uma das vítimas do rompimento da barragem, morador de Mário Campos, ante o Ministério Público de Minas Gerais, em que narra os fatos e relata os danos individuais causados pelo acontecimento."
  },
  {
    "id": "73160384_3",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160384_3-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160384_3.pdf",
    "citacao": "Ofício nº 38/CAO-DH/2019 emitido pelo Centro de Apoio Operacional das Promotorias de Justiça dos Direitos Humanos e Apoio Comunitário (CAO-DH) do Ministério Público de Minas Gerais à Secretaria Municipal de Administração de Brumadinho-MG, em que requisita informações acerca dos impactos já sentidos e detectados na economia regional (agricultura, pecuária, pesca, comércio e serviços) e reflexos envolvendo questões humanitárias, infraestrutura pública, dentre outros impactos."
  },
  {
    "id": "73160384_4",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160384_4-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160384_4.pdf",
    "citacao": "Ofício GABADM nº 59/2019 emitido pela Prefeitura de Brumadinho-MG, em resposta ao ofício nº 38/CAO-DH/2019, em que informa ao Ministério Público os impactos já sentidos e detectados na economia regional (agricultura, pecuária, pesca, comércio e serviços) e reflexos envolvendo questões humanitárias e infraestrutura pública, decorrentes do rompimento da barragem. A prefeitura elenca os impactos diretos no setor de turismo, comércio, infraestrutura e urbanismo, educação, meio ambiente e urbanismo, atendimento socioassistencial, agricultura, saúde e outros impactos sentidos pelo Município."
  },
  {
    "id": "73160386_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160386_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160386_1.pdf",
    "citacao": "Pesquisa trimestral realizada entre julho e setembro pela Secretaria Municipal de Turismo e Cultura de Brumadinho-MG sobre censo e taxa de ocupação de hotelaria em Brumadinho."
  },
  {
    "id": "73160386_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160386_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160386_2.pdf",
    "citacao": "Pesquisa trimestral realizada entre outubro e dezembro pela Secretaria Municipal de Turismo e Cultura de Brumadinho-MG sobre censo e taxa de ocupação de hotelaria em Brumadinho."
  },
  {
    "id": "73160386_3",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160386_3-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160386_3.pdf",
    "citacao": "Ofício nº 39/CAO-DH/2019 emitido pelo Centro de Apoio Operacional das Promotorias de Justiça dos Direitos Humanos e Apoio Comunitário (CAO-DH) do Ministério Público de Minas Gerais à Prefeitura de Mário Campos-MG, em que requisita informações acerca dos impactos já sentidos e detectados na economia regional (agricultura, pecuária, pesca, comércio e serviços) e reflexos envolvendo questões humanitárias, infraestrutura pública, dentre outros impactos."
  },
  {
    "id": "73160386_4",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160386_4-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160386_4.pdf",
    "citacao": "Ofício nº 16/2019 emitido pela Prefeitura de Mário Campos, em resposta ao Ofício nº 39/CAO-DH/2019, informando os danos ocasionados em Mário Campos em função do rompimento da barragem, dentre os quais reporta o número de vítimas desaparecidas ou com óbito já declarado, a situação dos agricultores, a qualidade da água do rio Paraopeba e os danos causados ao bens culturais. O ofício aponta para a necessidade de elaboração de um plano de recuperação da imagem da agricultura local e pavimentação da Avenida das Palmeiras, evitando que todo o trânsito passe pela região central do município de Mário Campos."
  },
  {
    "id": "73160388_3",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160388_3-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160388_3.pdf",
    "citacao": "Planejamento das Ações Emergenciais em São Joaquim de Bicas-MG elaborado pela Prefeitura do município, cujo objetivo geral é ofertar e promover serviços e Proteção Social Básica Especial para atendimento das demandas dos atingidos nos limites do Município de São Joaquim de Bicas, em consonância com as diretrizes legais da Política Nacional de Assistência Social."
  },
  {
    "id": "73160388_4",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160388_4-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160388_4.pdf",
    "citacao": "Comunicado da Secretaria Municipal de Saúde de São Joaquim de Bicas à Vale S/A em que se relatam as necessidades de adequação na rede de saúde do município, diante das novas demandas causadas pelo rompimento da barragem, e se expõe que o termo de pactuação proposto pela Vale S/A é insuficiente para atendê-las."
  },
  {
    "id": "73160388_5",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73160388_5-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73160388_5.pdf",
    "citacao": "Termo de Pactuação, proposto pela Vale S/A ao Município de São Joaquim de Bicas, de atos para assegurar reforço à saúde (atenção básica e saúde mental) e limpeza urbana emergenciais ao município."
  },
  {
    "id": "73161250_6",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161250_6-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161250_6.pdf",
    "citacao": "Memória de reunião realizada pela Força-Tarefa Brumadinho do Ministério Público de Minas Gerais  no dia 18/02/2019, em que participaram, dentre outros, os representantes do Ministério Público de Minas Gerais, da comunidade de Pires e São Joaquim de Bicas, do Movimento dos Atingidos por Barragens, da Secretaria Municipal de Saúde, da Defensoria Pública da União e da Vale S/A, para discutir os encaminhamentos a serem dados na defesa dos direitos humanos e sociais dos atingidos. Foram discutidos os seguintes pontos: 1) Termo de ajuste firmado entre Brumadinho e Vale; 2) Formulário de cadastro de famílias; 3) Auxílio financeiro emergencial; 4) Máquinas de funcionamento na Comunidade Pires; 5) Famílias hospedadas em hotéis; 6) Agricultura; 7) Doações."
  },
  {
    "id": "73161250_8",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161250_8-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "socioeconômico",
      "meio ambiente",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161250_8.pdf",
    "citacao": "Memória de reunião realizada pela Força-Tarefa Brumadinho do Ministério Público de Minas Gerais no dia 11/03/2019 entre os membros da Força Tarefa Brumadinho, em que participaram, dentre outros, os representantes do Ministério Público de Minas Gerais, da Comunidade de Pires e São Conrado, do Movimento dos Atingidos por Barragens, da Câmara Municipal de Brumadinho, da Secretaria Municipal da Saúde, da Defensoria Pública da União e da Vale S/A, para discutir os encaminhamentos a serem dados na defesa dos direitos humanos e sociais dos atingidos. Tratou-se das seguintes questões: 1) Demandas do Município de Mário Campos; 2) Demandas do Município de São Joaquim de Bicas; 3) Apresentação dos números de atendimento da Vale no sistema; 4) Doações; 5) Demandas da Comunidade de Pires; 6) Apresentação do funcionamento dos COES e prestação do atendimento da saúde."
  },
  {
    "id": "73161250_9",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161250_9-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "socioeconômico",
      "meio ambiente",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161250_9.pdf",
    "citacao": "Memória de reunião realizada pela Força-Tarefa Brumadinho do Ministério Público de Minas Gerais no dia 18/03/2019, em que participaram, dentre outros, os representantes do Ministério Público de Minas Gerais, do município de Mário Campos, do Movimento dos Atingidos por Barragens, da Amplo, da Comunidade de Pires e da Vale S/A para discutir os seguintes pontos: 1) Finalização da obra na ponte Alberto Flores; 2) Demandas apresentadas pelas atingidos da Comunidade de Pires; 3) Retorno dos encaminhamentos da reunião do dia 11/03/2019, referente às demandas apresentadas pelo Município de Mário Campos; 4) A questão dos veículos da Vale S/A estarem transitando em alta velocidade nas comunidades; 5) Informações acerca do indeferimento de auxílio emergencial por parte da Vale S/A; 6) Demanda relacionada ao fornecimento de água aos atingidos de São Joaquim de Bicas e de Mário Campos; 7) Dificuldades detectadas pelos municípios para fornecimento de comprovantes de residência; 8) Retorno da Vale em relação à instalação de um ponto de atendimento físico nos municípios de Mário Campos e São Joaquim de Bicas; e 9) Demandas apresentadas pelos moradores de Citrolândia, Betim."
  },
  {
    "id": "73161254_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161254_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico",
      "meio ambiente",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161254_1.pdf",
    "citacao": "Memória de reunião realizada pela Força-Tarefa Brumadinho do Ministério Público de Minas Gerais no dia 01/04/2019, em que participaram, dentre outros, os representantes do Ministério Público de Minas Gerais, do município de Mário Campos, do Movimento dos Atingidos por Barragens, do Presídio de São Joaquim de Bicas, do município de São Joaquim de Bicas, da Secretaria de Saúde de Brumadinho, da Prefeitura de Brumadinho, da comunidade de Pires, do Cruzeiro e de Citrolândia e da Vale S/A, para discutir os seguintes pontos: 1) Demandas iniciais apresentadas pelos atingidos; 2) Medidas tomadas em Brumadinho; 3) Medidas tomadas em São Joaquim de Bicas; 3) Medidas tomadas em Mário Campos; 4) Medidas tomadas em Mário Campos, especificamente no bairro funil; 5) Medidas tomadas em Betim, no bairro Citrolândia; 6) Doações e cestas básicas; 7) Presídio de São Joaquim de Bicas; 8) Ponte Alberto Flores; 9) Cercamento do rio; e 10) implantação de postos de atendimento físico em São Joaquim de Bicas, Mário Campos e Citrolândia."
  },
  {
    "id": "73161258_3",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161258_3-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161258_3.pdf",
    "citacao": "Inquérito Civil nº 0090.19-000011-8 instaurado pelo Ministério Público de Minas Gerais, cujo objetivo é apurar os fatos que ensejaram o rompimento da barragem de rejeitos minerários localizada na Mina Córrego do Feijão - Complexo Paraopeba (Vale S/A), bem como identificar os responsáveis pelo fato e providências cabíveis para salvaguarda dos recursos naturais e das vítimas, além da responsabilização do(s) administrador(es) do empreendimento."
  },
  {
    "id": "73161258_6",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161258_6-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161258_6.pdf",
    "citacao": "Inquérito Civil nº MPMG-0090.16.000311-8, instaurado pelo Ministério Público de Minas Gerais, cujo objetivo é analisar a documentação das barragens Capim Branco, Barragem 1, Barragem IV, Barragem IV-A, Barragem VI, Barragem VII, Menezes I e Menezes II, de responsabilidade da Vale S/A."
  },
  {
    "id": "73161258_8",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161258_8-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161258_8.pdf",
    "citacao": "Compilado, juntado pelo Ministério Público de Minas Gerais, de capturas de tela e imagens, contendo captura de tela de jornal online G1 sobre rompimento da Barragem em Brumadinho e imagens (sem descrição)."
  },
  {
    "id": "73161260_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161260_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161260_2.pdf",
    "citacao": "Inquérito Civil nº 0090.19-000011-8 instaurado pelo Ministério Público de Minas Gerais, cujo objetivo é apurar os fatos que ensejaram o rompimento da barragem de rejeitos minerários localizada na Mina Córrego do Feijão - Complexo Paraopeba (Vale S/A), bem como identificar os responsáveis pelo fato e providências cabíveis para salvaguarda dos recursos naturais e das vítimas, além da responsabilização do(s) administrador(es) do empreendimento."
  },
  {
    "id": "73161260_5",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161260_5-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161260_5.pdf",
    "citacao": "Inquérito Civil nº MPMG-0090.16.000311-8, instaurado pelo Ministério Público de Minas Gerais, cujo objetivo é analisar a documentação das barragens Capim Branco, Barragem 1, Barragem IV, Barragem IV-A, Barragem VI, Barragem VII, Menezes I e Menezes II, de responsabilidade da Vale S/A."
  },
  {
    "id": "73161260_7",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161260_7-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161260_7.pdf",
    "citacao": "Compilado, juntado pelo Ministério Público de Minas Gerais, de capturas de tela e imagens, contendo captura de tela de jornal online G1 sobre rompimento da Barragem em Brumadinho e imagens (sem descrição)."
  },
  {
    "id": "73161271_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161271_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161271_1.pdf",
    "citacao": null
  },
  {
    "id": "73161273_7",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161273_7-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161273_7.pdf",
    "citacao": "Ata de reunião realizada no dia 25/04/2019, em que se reuniram representantes da Defensoria Pública do Estado de Minas Gerais, da Defensoria Pública da União, do Ministério Público Federal, do Ministério Público de Minas Gerais, da Vale S/A e das comunidades do Córrego do Feijão, Parque das Cachoeiras, Palhanos, Melo Franco, Quintiliano, Córrego Ferreira, Pumba, Pastorinhas, Mário Campos e Casa Branca para a discussão de medidas emergenciais para atendimento de danos emergenciais aos produtores rurais e comerciantes atingidos pelo rompimento da barragem de Brumadinho."
  },
  {
    "id": "73161283_8",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161283_8-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161283_8.pdf",
    "citacao": "Relatório síntese do Ministério Público de Minas Gerais (MPMG) sobre a atuação de parte da equipe da Coordenadoria de Inclusão e Mobilização Sociais (Cimos) com relação às repercussões socioeconômicas do rompimento da barragem de rejeitos da Mina do Córrego do Feijão, no município de Brumadinho. Relata-se a participação do MPMG na reunião da comunidade/bairro Reta do Jacaré ou Reta 2 em Mário Campos, que contou com a participação de cerca de 30 atingidos, em sua maioria agricultores (oleicultores), da Empresa de Assistência Técnica e Extensão Rural do Estado de Minas Gerais (EMATER), da Secretaria de Agricultura de Mário Campos e de Militantes do Movimento dos Atingidos por Barragens (MAB), tendo sido encaminhado que: 1) a comunidade enviará uma lista de famílias que necessitam de fornecimento de água mineral/potável para solicitação à Vale S/A; e 2) a EMATER e a Prefeitura dialogarão com a comunidade para a complementação do levantamento realizado até então, com a inclusão de todas as categorias vinculadas a atividade produtiva dependente do rio Paraopeba."
  },
  {
    "id": "73161283_12",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73161283_12-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73161283_12.pdf",
    "citacao": "Relatório síntese do Ministério Público de Minas Gerais (MPMG) sobre a atuação de parte da equipe da Coordenadoria de Inclusão e Mobilização Sociais (Cimos) com relação às repercussões socioeconômicas do rompimento da barragem de rejeitos da Mina do Córrego do Feijão, no município de Brumadinho. Discorre-se acerca: 1) da reunião com o padre Renné da Paróquia de Brumadinho; e 2) da assembleia ocorrida no bairro Parque da Cachoeira."
  },
  {
    "id": "73164650_6",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73164650_6-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73164650_6.pdf",
    "citacao": "Inquérito Civil nº 0090.19-000011-8 instaurado pelo Ministério Público de Minas Gerais. O objetivo do inquérito é apurar os fatos que ensejaram o rompimento da barragem de rejeitos minerários localizada na Mina Córrego do Feijão - Complexo Paraopeba (Vale S/A), bem como identificar os responsáveis pelo fato e providências cabíveis para salvaguarda dos recursos naturais e das vítimas, além da responsabilização do(s) administrador(es) do empreendimento."
  },
  {
    "id": "73166820_4",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166820_4-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166820_4.pdf",
    "citacao": null
  },
  {
    "id": "73166820_5",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166820_5-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166820_5.pdf",
    "citacao": "Termo de pactuação, firmado entre a Vale S/A e o município de São Joaquim de Bicas, de atos para assegurar reforço à saúde (atenção básica e saúde mental) e limpeza urbana emergenciais, em decorrência da migração de pessoas para o município, após o rompimento da barragem da mina Córrego do Feijão, em que ambos acordam os compromissos assumidos por cada parte em relação ao assunto."
  },
  {
    "id": "73166821_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166821_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166821_1.pdf",
    "citacao": "Termo de pactuação, firmado entre a Vale S/A e o município de Mário Campos, de atos para assegurar reforço à saúde, assistência social, agricultura e limpeza urbana emergenciais aos atingidos pelo rompimento da barragem da mina Córrego do Feijão. Neste termo, a Vale S/A se compromete a custear: contratações temporárias de servidores para atendimento das pessoas atingidas pelo rompimento das Barragens da Vale na Mina Córrego do Feijão; aluguel de veículos e fornecimento de combustível para locomoção das equipes de saúde e psicossociais do município; aluguel de imóvel para atendimento psicossocial; fornecimento de materiais e equipamentos conforme Anexo III; despesa com limpeza de vias; e plano de comunicação para fins de promoção da agricultura no município."
  },
  {
    "id": "73166821_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166821_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166821_2.pdf",
    "citacao": "Termo de responsabilidade, firmado entre a Vale S/A e o município de Mário Campos, cujo objeto constitui a cessão, a título gratuito, de veículos pela Vale S/A ao município, com a finalidade específica de realização de transporte da Equipe de Saúde e da Equipe de Assistência Social, durante o período em que estiver vigente o Termo de Pactuação."
  },
  {
    "id": "73166826_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166826_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166826_2.pdf",
    "citacao": "Termo de Compromisso acerca da Qualidade da Água, firmado entre a União Federal e a Vale S/A, cujo objeto é a contratação e custeio, pela Vale S/A, de laboratório independente que atenda aos requisitos especificados na NBR ISO/IEC 17025:2005, com objetivo específico de atendimento provisório da demanda não suportada pelos laboratórios de saúde pública. As amostras deverão ser coletadas por agentes do sistema Único de Saúde (SUS) e o laboratório deverá ser disponibilizado à União Federal e ter capacidade analítica para amostras em soluções alternativas coletivas e individuais de abastecimento de água, cujas captações em mananciais subterrâneos estejam localizadas a uma distância de até 100 metros das margens do Rio Paraopeba."
  },
  {
    "id": "73166827_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166827_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166827_1.pdf",
    "citacao": "Termo de Compromisso firmado entre o Ministério Público de Minas Gerais, a Vale S/A, o Município de Pará de Minas e a concessionária de saneamento básico Águas de Pará de Minas S/A (“TAC Pará de Minas”). O objeto principal deste Termo de Ajustamento consiste na elaboração, no custeio e na execução de projeto e obras para a construção de novos sistemas de captação e de adução de água bruta sob responsabilidade da Vale, visando à recomposição do sistema de abastecimento de água do município de Pará de Minas."
  },
  {
    "id": "73166828_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166828_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166828_2.pdf",
    "citacao": "Nota técnica conjunta de 01/03/2016 do Governo Federal e dos Governos Estaduais do Espírito Santo e de Minas Gerais, na qual apresentam-se: i) a definição dos programas socioeconômicos que compõem o Termo de Transação e Ajustamento de Conduta relativo à recuperação dos impactos socioambientais e socioeconômicos do rompimento da barragem de Fundão em Mariana; e ii) a consolidação dos gastos extraordinários incorridos por seus órgãos e entidades para execução de medidas emergenciais necessárias para atendimento da população atingida e para identificação e mitigação dos danos ambientais, totalizando R$ 27.500.000,00."
  },
  {
    "id": "73166829_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166829_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166829_1.pdf",
    "citacao": "Notícia do jornal Valor Econômico, juntada pela Vale S/A, sobre determinação judicial de bloqueio de R$ 300.000.000,00 na conta da Samarco, após o rompimento da barragem de Fundão."
  },
  {
    "id": "73166829_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166829_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166829_2.pdf",
    "citacao": "Notícia do jornal Valor Econômico, juntada pela Vale S/A, sobre determinação judicial de bloqueio de R$ 500.000.000,00 na conta da Samarco Mineração S/A após o rompimento da barragem de Fundão."
  },
  {
    "id": "73166829_3",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166829_3-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166829_3.pdf",
    "citacao": "Termo de Compromisso Preliminar firmado entre o Ministério Público Federal, o Ministério Público de Minas Gerais e a Samarco Mineração S/A. Constitui o objeto deste Termo de Compromisso Preliminar o estabelecimento de caução socioambiental para garantia de custeio de medidas preventivas emergenciais, mitigatórias, reparatórias ou compensatórias, sejam elas ambientais ou socioambientais, decorrentes do rompimento das barragens de rejeitos sob responsabilidade da Samarco na Comarca de Mariana. No mesmo, acorda-se que a Samarco prestará garantia emergencial mínima no valor de R$ 1.000.000.000,00."
  },
  {
    "id": "73166830_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166830_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166830_1.pdf",
    "citacao": "Notícia do jornal Valor Econômico, juntada pela Vale S/A, sobre determinação judicial de bloqueio de R$ 500.000.000,00 na conta da Samarco Mineração S/A após o rompimento da barragem de Fundão."
  },
  {
    "id": "73166830_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166830_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166830_2.pdf",
    "citacao": "Termo de Ajustamento de Conduta, firmado entre Ministério Público Federal, Ministério Público de Minas Gerais, Ministério Público do Estado do Espírito Santo, Defensoria Pública da União, Defensoria Pública do Estado de Minas Gerais, Defensoria Pública do Estado do Espírito Santo, União, Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA), Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio), Agência Nacional das Águas (ANA), Agência Nacional de Mineração (ANM), Fundação Nacional do Índio (FUNAI), Estado de Minas Gerais, Instituto Estadual de Florestas (IEF), Instituto Mineiro de Gestão das Águas (IGAM), Fundação Estadual do Meio Ambiente (FEAM), Estado do Espírito Santo, Instituto de Meio Ambiente e Recursos Hídricos (IEMA), Instituto de Defesa Agropecuária e Florestal do Espírito Santo (IDAF), Agência Estadual de Recursos Hídricos (AGERH), Samarco Mineração S/A, Vale S/A e BHP Billiton Brasil Ltda. Os objetos do acordo são: i) a alteração do processo de governança previsto no Termo de Transação e de Ajustamento de Conduta (TTAC), para definição e execução dos programas, projetos e ações que se destinam à reparação integral dos danos decorrentes do rompimento da barragem de Fundão; ii) o aprimoramento de mecanismos de efetiva participação das pessoas atingidas pelo rompimento da Barragem de Fundão em todas as etapas e fases do TTAC e do presente acordo; e iii) o estabelecimento de um processo de negociação visando a eventual repactuação dos programas."
  },
  {
    "id": "73166833_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166833_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "meio ambiente",
      "saúde da população",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166833_1.pdf",
    "citacao": null
  },
  {
    "id": "73166833_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166833_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Ouro Preto",
        "geocodigo": "3146107"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166833_2.pdf",
    "citacao": "Ata de audiência, realizada no dia 09/05/2019, referente aos processos 5010709-36.2019.8.13.0024, 5044954-73.2019.8.13.0024 e 5026408-67.2019.8.13.0024 sobre: proposta de atuação técnica da Universidade Federal de Minas Gerais (UFMG); construção de nova captação de água do rio Paraopeba pela Vale S/A; necessidade de atuação para evitar desabastecimento de água na Região Metropolitana de Belo Horizonte; captação no Rio Macaúbas; entrega pela Vale S/A do Poço Profundo no Parque da Cachoeira; comportas ensecadeiras e requerimentos feitos pelo Estado de Minas Gerais; custeamento pela Vale S/A da estrutura física para evento de escolha da Assessoria Técnica em Brumadinho; revitalização da linha férrea até Ouro Preto; pagamentos emergenciais realizados e agendados para atendimento pela Vale S/A; prorrogação de prazo para análise pela Vale S/A dos documentos de entrega coletiva; atendimento de água potável; expedição de ofício ao Defensor Público Geral do Estado e ao Procurador-Geral de Justiça com elogios à atuação, respectivamente, da Dra. Carolina Morishita e do Dr. André Sperling; expedição de alvará de R$500.000.000,00 substituídos por seguro-garantia; e negociações com a Vale S/A de dívidas decorrentes de atividade rural. \n\nParticipantes: representantes do Estado de Minas Gerais, da Advocacia Geral do Estado de Minas Gerais, do Ministério Público de Minas Gerais, da Defensoria Pública do Estado de Minas Gerais, da Vale S/A, das instituições federais cadastradas como Amici Curiae (Advocacia Geral da União, Ministério Público Federal, Defensoria Pública da União), do município de Belo Horizonte, da UFMG e da Fundação de Desenvolvimento da Pesquisa (FUNDEP) e pessoas cadastradas previamente para a audiência."
  },
  {
    "id": "73166835_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73166835_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-18",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "infraestrutura",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73166835_1.pdf",
    "citacao": "Termo de Audiência, realizada no dia 21/05/2019, relativa aos processos 5010709-36.2019.8.13.0024, 5044954-73.2019.8.13.0024, 5026408-67.2019.8.13.0024 e 5071521-44.2019.8.13.0024. Tratou-se das seguintes questões: \"Projeto de avaliação de necessidades pós-desastre do colapso da barragem Mina Córrego do Feijão\" apresentado pela Universidade Federal de Minas Gerais (UFMG); instituição do comitê técnico para auxílio do Juízo; distribuição por dependência desta ata de audiência para constituição de autos apartados em anexo; pedido pelas partes de oitiva das testemunhas; homologação da escolha das assessorias técnicas pelos atingidos; assessoria técnica da região II; problemas com pagamentos de indenizações emergenciais; funcionamento do posto de atendimento em Pará de Minas; cronograma de obras de captação a montante no rio Paraopeba; cronograma detalhado de ações e obras para aumento da resiliência nos sistemas do rio Paraopeba e Rio das Velhas; relatório de acompanhamento pela Companhia de Saneamento de Minas Gerais (COPASA) da obra para solução de captação de água na região metropolitana de Belo Horizonte; custeio pela Vale S/A da construção da captação no Rio Macaúbas; reserva hídrica da região metropolitana de Belo Horizonte; pagamento emergencial de produtores rurais; e reativação da linha férrea de Belo Horizonte a Ouro Preto. \n\nParticipantes: representantes do Estado de Minas Gerais, da Advocacia Geral do Estado de Minas Gerais, do Ministério Público de Minas Gerais, da Defensoria Pública do Estado de Minas Gerais, da Vale S/A, do Ministério Público Federal, da Defensoria Pública da União, da COPASA e da Universidade Federal de Minas Gerais e pessoas cadastradas previamente para a audiência."
  },
  {
    "id": "73229806_6",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73229806_6-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-19",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73229806_6.pdf",
    "citacao": "Relatório de vistoria nº 118/2019 da Prefeitura Municipal de Brumadinho cujos objetivos são: a verificação de possíveis danos estruturais à edificação; a verificação de perda material, móveis, etc; a verificação da distância da edificação aos rejeitos; e a verificação aparente de contaminação de áreas de agricultura e agropecuária, mau cheiro e toxicidade no ambiente. Conclui-se, com base nas constatações e registros, que os danos foram totais, tendo sido a residência totalmente inundada pelos rejeitos e parte da edificação completamente destruída, comprometendo todo o restante da estrutura. O documento está acompanhado do registro de atendimento realizado pela Prefeitura e Defesa Civil de Brumadinho."
  },
  {
    "id": "73229807_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73229807_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-19",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73229807_1.pdf",
    "citacao": "Relatório de vistoria  nº 119/2019 da Prefeitura Municipal de Brumadinho cujos objetivos são: a verificação de possíveis danos estruturais à edificação; a verificação de perda material, móveis, etc; a verificação da distância da edificação aos rejeitos; e a verificação aparente de contaminação de áreas de agricultura e agropecuária, mau cheiro e toxicidade no ambiente. Conclui-se, com base nas constatações e registros, que os danos foram totais, tendo sido a residência totalmente inundada pelos rejeitos, encontrando-se apenas escombros próximos ao local. O documento está acompanhado do registro de atendimento realizado pela Prefeitura e Defesa Civil de Brumadinho."
  },
  {
    "id": "73229807_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73229807_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-19",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73229807_2.pdf",
    "citacao": "Relatório de vistoria nº 120/2019 da Prefeitura Municipal de Brumadinho nº 120/2019 cujos objetivos são: a verificação de possíveis danos estruturais à edificação; a verificação de perda material, móveis, etc; a verificação da distância da edificação aos rejeitos; e a verificação aparente de contaminação de áreas de agricultura e agropecuária, mau cheiro e toxicidade no ambiente. Conclui-se, com base nas constatações e registros, que os danos foram totais, tendo sido a residência totalmente inundada pelos rejeitos, encontrando-se apenas escombros próximos ao local. O documento está acompanhado do registro de atendimento realizado pela Prefeitura e Defesa Civil de Brumadinho."
  },
  {
    "id": "73229809_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73229809_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-19",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73229809_1.pdf",
    "citacao": "Relatório de vistoria nº 121/2019 da Prefeitura Municipal de Brumadinho cujos objetivos são: a verificação de possíveis danos estruturais à edificação; a verificação de perda material, móveis, etc; a verificação da distância da edificação aos rejeitos; e a verificação aparente de contaminação de áreas de agricultura e agropecuária, mau cheiro e toxicidade no ambiente. Conclui-se, com base nas constatações e registros, que apareceram trincas em algumas paredes da casa e houve destelhamento parcial da garagem devido à proximidade da edificação à área de manobras de pouso e aterrissagem das aeronaves. Ademais, acrescenta-se que, com a força do vento oriundo das hélices dos helicópteros, houve desprendimento de parte do forro da sala. O documento está acompanhado do registro de atendimento realizado pela Prefeitura e Defesa Civil de Brumadinho."
  },
  {
    "id": "73229809_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73229809_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-19",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73229809_2.pdf",
    "citacao": "Relatório de vistoria nº 122/2019 da Prefeitura Municipal de Brumadinho cujos objetivos são: a verificação de possíveis danos estruturais à edificação; a verificação de perda material, móveis, etc; a verificação da distância da edificação aos rejeitos; e a verificação aparente de contaminação de áreas de agricultura e agropecuária, mau cheiro e toxicidade no ambiente. Conclui-se, com base nas constatações e registros, que visualmente os rejeitos da lama não atingiram o local, estando localizados a aproximadamente 100 metros de distância da residência. Ademais, acrescenta-se que durante a vistoria técnica não foi constatado nenhum odor oriundo do rejeito da barragem. O documento está acompanhado do registro de atendimento realizado pela Prefeitura e Defesa Civil de Brumadinho."
  },
  {
    "id": "73229810_1",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73229810_1-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-19",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73229810_1.pdf",
    "citacao": "Relatório de vistoria nº 123/2019 da Prefeitura Municipal de Brumadinho cujos objetivos são: a verificação de possíveis danos estruturais à edificação; a verificação de perda material, móveis, etc; a verificação da distância da edificação aos rejeitos; e a verificação aparente de contaminação de áreas de agricultura e agropecuária, mau cheiro e toxicidade no ambiente. Conclui-se, com base nas constatações e registros, que visualmente os rejeitos da lama não atingiram o local, estando localizados a aproximadamente 135 metros de distância da residência. Ademais, acrescenta-se que durante a vistoria técnica não foi constatado nenhum odor oriundo do rejeito da barragem. O documento está acompanhado do registro de atendimento realizado pela Prefeitura e Defesa Civil de Brumadinho."
  },
  {
    "id": "73229816_5",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73229816_5-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-19",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73229816_5.pdf",
    "citacao": "Relatório síntese do Ministério Público de Minas Gerais (MPMG) sobre a atuação de parte da equipe da Coordenadoria de Inclusão e Mobilização Sociais (Cimos) com relação às repercussões socioeconômicas do rompimento da barragem de rejeitos da Mina do Córrego do Feijão, no município de Brumadinho. Relata-se a participação do MPMG na reunião da comunidade/bairro Reta do Jacaré ou Reta 2 em Mário Campos, que contou com a participação de cerca de 30 atingidos, em sua maioria agricultores (oleicultores), da Empresa de Assistência Técnica e Extensão Rural do Estado de Minas Gerais (EMATER), da Secretaria de Agricultura de Mário Campos e de Militantes do Movimento dos Atingidos por Barragens (MAB), tendo sido encaminhado que: 1) a comunidade enviará uma lista de famílias que necessitam de fornecimento de água mineral/potável para solicitação à Vale S/A; e 2) a EMATER e a Prefeitura dialogarão com a comunidade para a complementação do levantamento realizado até então, com a inclusão de todas as categorias vinculadas à atividade produtiva dependente do rio Paraopeba."
  },
  {
    "id": "73229816_9",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73229816_9-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-19",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73229816_9.pdf",
    "citacao": "Relatório síntese do Ministério Público de Minas Gerais (MPMG) sobre a atuação de parte da equipe da Coordenadoria de Inclusão e Mobilização Sociais (Cimos) com relação às repercussões socioeconômicas do rompimento da barragem de rejeitos da Mina do Córrego do Feijão, no município de Brumadinho. No relatório, discorre-se acerca: 1) da reunião com o padre Renné da Paróquia de Brumadinho; e 2) da assembleia ocorrida no bairro Parque da Cachoeira."
  },
  {
    "id": "73229834_9",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73229834_9-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-19",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73229834_9.pdf",
    "citacao": "Relatório síntese do Ministério Público de Minas Gerais (MPMG) sobre a atuação de parte da equipe da Coordenadoria de Inclusão e Mobilização Sociais (Cimos) com relação às repercussões socioeconômicas do rompimento da barragem de rejeitos da Mina do Córrego do Feijão, no município de Brumadinho. Discorre o relatório acerca da presença do MPMG na reunião da comunidade/bairro Reta do Jacaré ou Reta 2 em Mário Campos, que contou com a participação de cerca de 30 (trinta) atingidos, em sua maioria agricultores (oleicultores), da Empresa de Assistência Técnica e Extensão Rural do Estado de Minas Gerais (EMATER), da Secretaria de Agricultura de Mário Campos e de Militantes do Movimento dos Atingidos por Barragens (MAB), tendo sido encaminhado que: 1) a comunidade enviará uma lista de famílias que necessitam de fornecimento de água mineral/potável para solicitação à Vale S/A; e 2) a EMATER e a Prefeitura dialogarão com a comunidade para a complementação do levantamento realizado até então, com a inclusão de todas as categorias vinculadas a atividade produtiva dependente do rio Paraopeba."
  },
  {
    "id": "73229835_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73229835_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-19",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73229835_2.pdf",
    "citacao": "Relatório síntese do Ministério Público de Minas Gerais (MPMG) sobre a atuação de parte da equipe da Coordenadoria de Inclusão e Mobilização Sociais (Cimos) com relação às repercussões socioeconômicas do rompimento da barragem de rejeitos da Mina do Córrego do Feijão, no município de Brumadinho. Discorre o relatório acerca: 1) da reunião com o padre Renné da Paróquia de Brumadinho; e 2) da assembleia ocorrida no bairro Parque da Cachoeira."
  },
  {
    "id": "73249651_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "73249651_2-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2019-06-19",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "saúde da população",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/73249651_2.pdf",
    "citacao": null
  },
  {
    "id": "9ccae791-f910-439e-8c5c-c4415090933a",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Balanço da Reparação Junho 2019",
    "tipo": "extraprocessual",
    "data": "2019-06-28",
    "municipios": [
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Cantagalo",
        "geocodigo": "3112059"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/9ccae791-f910-439e-8c5c-c4415090933a.pdf",
    "citacao": "Desde o rompimento da Barragem I, na Mina Córrego do Feijão, em Brumadinho, a Vale tem equipes dedicadas 24 horas por dia e está disponibilizando todos os recursos necessários para reparar os impactos causados. A empresa tem prestado todo o apoio para minimizar o impacto na vida das pessoas que perderam ou tiveram que sair de suas residências devido ao rompimento da barragem. A empresa também coletou amostras de rejeitos em mais de 46 pontos na bacia do ribeirão Ferro-Carvão (inclusive dentro da barragem B1) e 28 amostras ao longo do rio Paraopeba. O monitoramento avalia os efeitos das ações de mitigação em curso para atuar com maior eficácia na redução dos impactos."
  },
  {
    "id": "28044671-7189-48f2-b21c-9e5e7c5a994e",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Balanço da Reparação Junho 2019",
    "tipo": "extraprocessual",
    "data": "2019-06-28",
    "municipios": [
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/28044671-7189-48f2-b21c-9e5e7c5a994e.pdf",
    "citacao": "Desde o rompimento da Barragem I, na Mina Córrego do Feijão, em Brumadinho, a Vale tem equipes dedicadas 24 horas por dia e está disponibilizando todos os recursos necessários para reparar os impactos causados. A empresa tem prestado todo o apoio para minimizar o impacto na vida das pessoas que perderam ou tiveram que sair de suas residências devido ao rompimento da barragem. A empresa também coletou amostras de rejeitos em mais de 46 pontos na bacia do ribeirão Ferro-Carvão (inclusive dentro da barragem B1) e 28 amostras ao longo do rio Paraopeba. O monitoramento avalia os efeitos das ações de mitigação em curso para atuar com maior eficácia na redução dos impactos."
  },
  {
    "id": "74175341",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "74175341-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-06-28",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/74175341.pdf",
    "citacao": null
  },
  {
    "id": "75021522",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "75021522-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-05",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/75021522.pdf",
    "citacao": null
  },
  {
    "id": "75223381",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "75223381-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-08",
    "municipios": [
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/75223381.pdf",
    "citacao": "Comunicado nº10/2019 das Instituições de Justiça (Defensoria Pública da União, Ministério Público Federal, Ministério Público do Estado de Minas Gerais e Defensoria Pública do Estado de Minas Gerais), responsáveis pelo Chamamento Público para o credenciamento de entidades sem fins lucrativos interessadas em prestar assessoria técnica às pessoas atingidas pelo rompimento da barragem da Mina do Córrego do Feijão. Assunto: relato da reunião do dia 07/07/2019, na qual a entidade Núcleo de Assessoria às Comunidades Atingidas por Barragens (NACAB) foi escolhida para prestar assessoria técnica às pessoas atingidas na Região 3 (municípios de Esmeraldas, Florestal, Pará de Minas, São José da Varginha, Fortuna de Minas, Papagaios, Maravilhas, Paraopeba, Pequi e Caetanópolis), por ter obtido mais de 50% dos votos, em primeira votação."
  },
  {
    "id": "75223385",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "75223385-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-08",
    "municipios": [
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/75223385.pdf",
    "citacao": "Comunicado nº 09/2019 da Defensoria Pública da União, do Ministério Público Federal, do Ministério Público do Estado de Minas Gerais e da Defensoria Pública do Estado de Minas Gerais, relativo ao Chamamento Público para credenciamento de entidades sem fins lucrativos interessadas em prestar assessoria técnica às pessoas atingidas pelo rompimento da barragem da Mina do Córrego do Feijão, ocorrido em Brumadinho. Assunto: realização das apresentações das entidades credenciadas para a Região 3 (municípios de Esmeraldas, Florestal, Pará de Minas, São José da Varginha, Fortuna de Minas, Papagaios, Maravilhas, Paraopeba, Pequi e Caetanópolis) e respectiva escolha no dia 07 de julho de 2019."
  },
  {
    "id": "75223386",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "75223386-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-08",
    "municipios": [
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/75223386.pdf",
    "citacao": "Comunicado nº 07/2019 da Defensoria Pública da União, do Ministério Público Federal, do Ministério Público do Estado de Minas Gerais e da Defensoria Pública do Estado de Minas Gerais, relativo ao Chamamento Público para credenciamento de entidades sem fins lucrativos interessadas em prestar assessoria técnica às pessoas atingidas pelo rompimento da barragem da Mina do Córrego do Feijão, ocorrido em Brumadinho. Assunto: Divulgação da lista preliminar das comissões de pessoas/comunidades atingidas formadas na Região 3."
  },
  {
    "id": "75233460",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "75233460-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-08",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/75233460.pdf",
    "citacao": "Termo de Compromisso firmado entre o Ministério Público de Minas Gerais, a Vale S/A, o Município de Pará de Minas e a concessionária de saneamento básico Águas de Pará de Minas S/A (“TAC Pará de Minas”). O objeto principal deste Termo de Ajustamento consiste na elaboração, no custeio e na execução de projeto e obras para a construção de novos sistemas de captação e de adução de água bruta sob responsabilidade da Vale, visando à recomposição do sistema de abastecimento de água do município de Pará de Minas."
  },
  {
    "id": "75233465",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "75233465-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-08",
    "municipios": [
      {
        "nome": "Mariana",
        "geocodigo": "3140001"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/75233465.pdf",
    "citacao": "Nota técnica conjunta de 01/03/2016 do Governo Federal e dos Governos Estaduais do Espírito Santo e de Minas Gerais, na qual apresentam-se: i) a definição dos programas socioeconômicos que compõem o Termo de Transação e Ajustamento de Conduta relativo à recuperação dos impactos socioambientais e socioeconômicos do rompimento da barragem de Fundão em Mariana; e ii) a consolidação dos gastos extraordinários incorridos por seus órgãos e entidades para execução de medidas emergenciais necessárias para atendimento da população atingida e para identificação e mitigação dos danos ambientais, totalizando R$ 27.500.000,00."
  },
  {
    "id": "75241979",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "75241979-Manifestação da Advocacia Pública",
    "tipo": "manifestação da advocacia pública",
    "data": "2019-07-08",
    "municipios": [
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/75241979.pdf",
    "citacao": "Manifestação da Defensoria Pública do Estado de Minas Gerais, apresentando e requerendo a juntada de lista preliminar e não exaustiva, construída de forma comunitária, de atingidos das comunidades do município de Juatuba que necessitam de fornecimento de água para consumo humano."
  },
  {
    "id": "75241982",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "75241982-Juntada",
    "tipo": "juntada",
    "data": "2019-07-08",
    "municipios": [
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/75241982.pdf",
    "citacao": "Lista preliminar, construída de forma comunitária, de atingidos das comunidades do município de Juatuba que necessitam de fornecimento de água para consumo humano, juntada pela Defensoria Pública do Estado de Minas Gerais."
  },
  {
    "id": "75941360",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "75941360-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-12",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/75941360.pdf",
    "citacao": null
  },
  {
    "id": "76763693",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "76763693-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-19",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/76763693.pdf",
    "citacao": null
  },
  {
    "id": "77528767",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "77528767-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-26",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/77528767.pdf",
    "citacao": null
  },
  {
    "id": "77570487",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "77570487-Manifestação da Defensoria Pública",
    "tipo": "manifestação da defensoria pública",
    "data": "2019-07-28",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/77570487.pdf",
    "citacao": "Manifestação da Defensoria Pública de Minas Gerais requerendo a juntada de documentos referentes à escolha da entidade de assessoria técnica da Região 4. Requer-se também que a representante da entidade escolhida, Instituto Guaicuy, seja cadastrada e autorizada a acompanhar a audiência do dia 05/08/2019."
  },
  {
    "id": "77570993",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "77570993-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-28",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/77570993.pdf",
    "citacao": "Lista atualizada de entidades credenciadas para a Região 4 (Municípios de Pompéu e Curvelo), publicada pelas Instituições de Justiça (Defensoria Pública da União, Ministério Público Federal, Ministério Público do Estado de Minas Gerais e Defensoria Pública do Estado de Minas Gerais) responsáveis pelo Chamamento Público para o credenciamento de entidades sem fins lucrativos interessadas em prestar assessoria técnica às pessoas atingidas pelo rompimento da barragem da Mina do Córrego do Feijão."
  },
  {
    "id": "77570994",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "77570994-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-28",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/77570994.pdf",
    "citacao": "Convocação elaborada pela Defensoria Pública da União, pelo Ministério Público Federal, pelo Ministério Público de Minas Gerais e pela Defensoria Pública do Estado de Minas Gerais para apresentação das entidades credenciadas da região 4, no dia 14 de julho de 2019, no Auditório do CEFET-MG, em Curvelo."
  },
  {
    "id": "77570996",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "77570996-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-28",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/77570996.pdf",
    "citacao": "Comunicado nº 12/2019 das Instituições de Justiça (Defensoria Pública da União, Ministério Público Federal, Ministério Público do Estado de Minas Gerais e Defensoria Pública do Estado de Minas Gerais) responsáveis pelo Chamamento Público para o credenciamento de entidades sem fins lucrativos interessadas em prestar assessoria técnica às pessoas atingidas pelo rompimento da barragem da Mina do Córrego do Feijão. Divulga-se a escolha da entidade Instituto Guaicuy para prestar assessoria técnica às pessoas atingidas na Região 4 (municípios de Pompéu e Curvelo), por ter obtido mais de 50% dos votos, em segundo turno de votação."
  },
  {
    "id": "77570997",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "77570997-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-28",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/77570997.pdf",
    "citacao": "Comunicado nº 11/2019 da Defensoria Pública da União, do Ministério Público Federal, do Ministério Público do Estado de Minas Gerais e da Defensoria Pública do Estado de Minas Gerais, relativo ao Chamamento Público para credenciamento de entidades sem fins lucrativos interessadas em prestar assessoria técnica às pessoas atingidas pelo rompimento da barragem da Mina do Córrego do Feijão, ocorrido em Brumadinho. Assunto: realização das apresentações das entidades credenciadas para a Região 4 (municípios de Pompéu e Curvelo) e respectiva escolha, no dia 14 de julho de 2019, no Auditório do Centro Federal de Educação Tecnológica de Minas Gerais (CEFET-MG) em Curvelo."
  },
  {
    "id": "77570998",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "77570998-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-07-28",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/77570998.pdf",
    "citacao": "Comunicado nº 08/2019 da Defensoria Pública da União, do Ministério Público Federal, do Ministério Público do Estado de Minas Gerais e da Defensoria Pública do Estado de Minas Gerais, relativo ao Chamamento Público para credenciamento de entidades sem fins lucrativos interessadas em prestar assessoria técnica às pessoas atingidas pelo rompimento da barragem da Mina do Córrego do Feijão, ocorrido em Brumadinho. Neste comunicado, divulga-se lista preliminar de comissões de pessoas/comunidades atingidas da Região 4."
  },
  {
    "id": "78362212",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "78362212-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-08-02",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/78362212.pdf",
    "citacao": null
  },
  {
    "id": "79298410",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "79298410-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-08-09",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/79298410.pdf",
    "citacao": null
  },
  {
    "id": "80131508",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "80131508-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-08-16",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "saúde da população",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/80131508.pdf",
    "citacao": null
  },
  {
    "id": "80188317",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "80188317-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-08-19",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/80188317.pdf",
    "citacao": "Plano de trabalho para prestação de assessoria técnica independente na Região 1 (município de Brumadinho), desenvolvido pela Associação Estadual de Defesa Ambiental e Social (AEDAS)."
  },
  {
    "id": "80188324",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "80188324-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-08-19",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/80188324.pdf",
    "citacao": "Comprovante do Ministério Público do Estado de Minas Gerais de encaminhamento (via e-mail) à Vale S/A em 07/08/2019 do plano de trabalho para prestação de assessoria técnica independente na Região 1 (município de Brumadinho) desenvolvido pela Associação Estadual de Defesa Ambiental e Social (AEDAS)."
  },
  {
    "id": "80313070",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "80313070-Estudo técnico",
    "tipo": "estudo técnico",
    "data": "2019-08-19",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/80313070.pdf",
    "citacao": "Parecer nº 720/2019 da Assessoria Multidisciplinar da Procuradoria Federal dos Direitos do Cidadão do Ministério Público Federal. Ementa: relatório do trabalho realizado em Belo Horizonte, Brumadinho e São Joaquim de Bicas, relacionado aos direitos dos atingidos ou vítimas do rompimento da barragem de rejeitos da Vale S/A (Córrego do Feijão)."
  },
  {
    "id": "80315265",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "80315265-Estudo Técnico",
    "tipo": "estudo técnico",
    "data": "2019-08-19",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/80315265.pdf",
    "citacao": "Parecer nº 720/2019 da Assessoria Multidisciplinar da Procuradoria Federal dos Direitos do Cidadão do Ministério Público Federal. Ementa: relatório do trabalho realizado em Belo Horizonte, Brumadinho e São Joaquim de Bicas, relacionado aos direitos dos atingidos ou vítimas do rompimento da barragem de rejeitos da Vale S/A (Córrego do Feijão)."
  },
  {
    "id": "80331182",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "80331182-Relatório Técnico",
    "tipo": "relatório técnico",
    "data": "2019-08-19",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/80331182.pdf",
    "citacao": "Parecer nº 720/2019 da Assessoria Multidisciplinar da Procuradoria Federal dos Direitos do Cidadão do Ministério Público Federal. Ementa: relatório do trabalho realizado em Belo Horizonte, Brumadinho e S. Joaquim de Bicas, relacionado aos direitos dos atingidos ou vítimas do rompimento da barragem de rejeitos da Vale S/A (Córrego do Feijão)."
  },
  {
    "id": "80315291",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "80315291-Estudo técnico",
    "tipo": "estudo técnico",
    "data": "2019-08-19",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/80315291.pdf",
    "citacao": "Parecer nº 720/2019 da Assessoria Multidisciplinar da Procuradoria Federal dos Direitos do Cidadão do Ministério Público Federal. Ementa: relatório do trabalho realizado em Belo Horizonte, Brumadinho e São Joaquim de Bicas, relacionado aos direitos dos atingidos ou vítimas do rompimento da barragem de rejeitos da Vale S/A (Córrego do Feijão)."
  },
  {
    "id": "85215612",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "85215612-Petição",
    "tipo": "petição",
    "data": "2019-09-23",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85215612.pdf",
    "citacao": "Nota Técnica nº 69/2019 da Coordenadoria das Promotorias de Justiça de Defesa do Patrimônio Cultural e Turístico do Ministério Público de Minas Gerais cujo objetivo é analisar a existência/ocorrência de bens culturais nos municípios localizados no Rio Paraopeba que foram impactados pela lama de rejeitos de mineração decorrentes do rompimento da Barragem do Córrego do Feijão. Os município analisados são São Joaquim de Bicas, Mário Campos, Betim, Igarapé, Juatuba, Florestal, Pará de Minas, Esmeraldas, São José da Varginha, Pequi, Fortuna de Minas, Maravilhas, Papagaios, Inhaúma, Paraopeba, Curvelo, Pompéu e Felixlândia."
  },
  {
    "id": "85215614",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "85215614-Petição",
    "tipo": "petição",
    "data": "2019-09-23",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85215614.pdf",
    "citacao": "Ofício nº 003/2019 do Município de Pompéu-MG à Coordenadoria das Promotorias de Justiça de Defesa do Patrimônio Cultural e Turístico, em resposta ao ofício nº 183/2019, informando que no município não há nenhum bem cultural de nenhuma natureza (tombado, inventariado ou registrado) às margens do Rio Paraopeba. O único bem que havia, o sobrado do Laranjo, já foi transferido para dentro da sede do município no ano de 2010."
  },
  {
    "id": "85215615",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "85215615-Petição",
    "tipo": "petição",
    "data": "2019-09-23",
    "municipios": [
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85215615.pdf",
    "citacao": "Ofício nº 005/2019 da Prefeitura Municipal de São José da Varginha-MG à Coordenadoria das Promotorias de Justiça de Defesa do Patrimônio Cultural e Turístico, em resposta ao ofício nº 185/2019 que solicita que se informe a existência de bens culturais relacionados ao Rio Paraopeba que foram ou possam ser afetados pela passagem de pluma de minério decorrente do rompimento da barragem de Córrego do Feijão em Brumadinho, bem como informar as medidas eventualmente necessárias a serem adotadas para a proteção dos bens. Informa-se que o município foi diretamente afetado, uma vez que a água não pode mais ser captada, afetando a agricultura, a criação de gado e a pesca. Informa-se também que nenhum outro bem inventariado ou tomado foi atingido no município."
  },
  {
    "id": "85215616",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "85215616-Petição",
    "tipo": "petição",
    "data": "2019-09-23",
    "municipios": [
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85215616.pdf",
    "citacao": "Ofício nº 09/2019 da Prefeitura Municipal de Fortuna de Minas-MG à Coordenadoria das Promotorias de Justiça de Defesa do Patrimônio Cultural e Turístico, em resposta ao ofício nº 174/2019, informando que no município não há nenhum bem cultural às margens do Rio Paraopeba, que não há medidas a serem tomadas, visto a ausência de bens, e que não foram levantadas providências devido à falta de necessidade."
  },
  {
    "id": "85215617",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "85215617-Petição",
    "tipo": "petição",
    "data": "2019-09-23",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85215617.pdf",
    "citacao": "Ofício nº 11/2019/SEDUCT/PMSJB da Prefeitura Municipal de São Joaquim de Bicas-MG à Coordenadoria das Promotorias de Justiça de Defesa do Patrimônio Cultural e Turístico, em resposta ao Ofício nº 184/2019, informando os bens culturais danificados pelo rompimento da barragem do Complexo Paraopeba II. São eles: a) Estação Ferroviária Fecho do Funil; b) Residência situada próximo ao Rio Paraopeba; c) Ponte Pênsil. Informa ainda que a Estação Ferroviária Fecho Funil encontra-se em situação precária, necessitando reformas, e que são realizadas vistorias periódicas pelo setor de proteção do Patrimônio Cultural e pelo Conselho Municipal de Cultura e do Patrimônio Ambiental e Cultural de Contagem (COMPAC)."
  },
  {
    "id": "85215618",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "85215618-Petição",
    "tipo": "petição",
    "data": "2019-09-23",
    "municipios": [
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85215618.pdf",
    "citacao": "Ofício nº 011/2019/DCP da Prefeitura Municipal de Esmeraldas-MG à Coordenadoria das Promotorias de Justiça de Defesa do Patrimônio Cultural e Turístico, informando que não há bens inventariados e/ou tombados no entorno do Rio Paraopeba no município de Esmeraldas, que foram ou possam ser afetados pela passagem de pluma de minério decorrente do rompimento da barragem de Córrego do Feijão em Brumadinho."
  },
  {
    "id": "85215619",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "85215619-Petição",
    "tipo": "petição",
    "data": "2019-09-23",
    "municipios": [
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85215619.pdf",
    "citacao": "Ofício nº 106/2019 da Prefeitura Municipal de Betim-MG à Coordenadoria das Promotorias de Justiça de Defesa do Patrimônio Cultural e Turístico, em resposta ao ofício nº 169/2019, informando que existe bem natural e paisagístico em ameaça, seja ele o Conjunto Paisagístico da Travessia da Balsa do Rio Paraopeba, de propriedade da Fundação Hospitalar Estado de Minas Gerais (FHEMIG), que transporta diariamente grande número de moradores locais e visitantes e é usado também durante a festa da Irmandade Nossa Senhora do Rosário da Colônia."
  },
  {
    "id": "85215620",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "85215620-Petição",
    "tipo": "petição",
    "data": "2019-09-23",
    "municipios": [
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85215620.pdf",
    "citacao": "Ofício nº 07/2019 da Prefeitura Municipal de Felixlândia-MG à Coordenadoria das Promotorias de Justiça de Defesa do Patrimônio Cultural e Turístico, em resposta ao ofício nº 172/2019, encaminhando a ata de reunião do Conselho Municipal de Patrimônio Cultural, que indica e discorre sobre os danos causados ao patrimônio e bens culturais tombados ou inventariados, em decorrência do rompimento da barragem do Córrego do Feijão, como também quais seriam as medidas eventualmente necessárias e quais estão sendo tomadas para a proteção dos bens do município."
  },
  {
    "id": "85215621",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "85215621-Petição",
    "tipo": "petição",
    "data": "2019-09-23",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85215621.pdf",
    "citacao": "Ofício nº 048/2019 da Agência de Desenvolvimento Regional do Circuito Turístico Veredas do Paraopeba, em resposta ao ofício nº 425/2019, que visa a apuração dos danos ocasionados ao patrimônio cultural regional atingido em decorrência do rompimento da Barragens do Complexo do Paraopeba II. Aponta-se que: 1) o município de Brumadinho sofreu redução vertiginosa no turismo; 2) houve mudança no perfil do público ocupante do setor de hotelaria e pousadas, que agora se constitui basicamente em operários e funcionários de empresas prestadoras de serviços em operação no município; 3) há projeto elaborado pela Associação de Turismo de Brumadinho e Região (ATBR) para o reaquecimento do turismo, acatado pela Vale S/A e em execução; 4) a Vale S/A possui projeto relacionado ao reaquecimento do turismo, relativo à Campanha ABRACE Brumadinho. \nAnexo: Plano integrado de Apoio ao Turismo apresentado pela Associação de Turismo de Brumadinho e Região (ATBR) para o reaquecimento do turismo na região."
  },
  {
    "id": "85215634",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "85215634-Petição",
    "tipo": "petição",
    "data": "2019-09-23",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85215634.pdf",
    "citacao": "Ofício nº 1588/2019/DIVAP IPHAN-MG/IPHAN-MG-IPHAN do Instituto do Patrimônio Histórico e Artístico Nacional (IPHAN) em resposta ao ofício nº 457/2019 da Coordenadoria das Promotorias de Justiça de Defesa do Patrimônio Cultural e Turístico do Ministério Público de Minas Gerais, encaminhando o diagnóstico realizado pela Superintendência do IPHAN quanto aos sítios arqueológicos afetados e suas fichas de cadastro."
  },
  {
    "id": "85215635",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "85215635-Petição",
    "tipo": "petição",
    "data": "2019-09-23",
    "municipios": [
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85215635.pdf",
    "citacao": "Ofício GAB.PR nº 157/2019 do Instituto Estadual do Patrimônio Histórico e Artístico de Minas Gerais, requerendo dilação do prazo para concluir a resposta ao ofício nº 189/2019, que encaminha requisição de informações quanto à existência de bens culturais, medidas necessárias para proteção e providências deste Instituto para salvaguarda dos bens nos municípios de Betim, Curvelo, Esmeraldas, Felixlândia, Florestal, Fortuna de Minas, Paraopeba, Pequi, Pompéu, São Joaquim de Bicas e São José da Varginha, que estão no curso da mancha da lama decorrente do rompimento das barragens do Complexo Paraopeba II."
  },
  {
    "id": "85215639",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "85215639-Petição",
    "tipo": "petição",
    "data": "2019-09-23",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85215639.pdf",
    "citacao": "Relatório de vistoria em cavernas no município de Brumadinho organizado pelo Centro Nacional de Pesquisa e Conservação de Cavernas (CECAV) do Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio). Conclui-se, no relatório, que o nível do Rio Paraopeba não sofreu alteração suficiente para atingir o interior das cavidades vistoriadas. Entretanto, sazonalmente, estas cavernas podem ser inundadas pelas águas deste rio. Enquanto os rejeitos estiverem passíveis de remobilização pela água, configuram risco potencial de impactos negativos às cavernas. O relatório também conclui que o impacto já ocorrido na área de influência das cavernas é notório, cabendo aos órgãos competentes a aplicação das penalidades previstas na legislação vigente e o monitoramento de possíveis impactos oriundos do aumento do nível do Rio Paraopeba."
  },
  {
    "id": "85498202_3",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "85498202_3-Petição",
    "tipo": "petição",
    "data": "2019-09-24",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "infraestrutura",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85498202_3.pdf",
    "citacao": "Termo de Declarações do representante da Comissão de atingidos do bairro Primavera, em São Joaquim de Bicas, apresentado pelo Ministério Público de Minas Gerais (MPMG), sobre o fornecimento de água no bairro, relatando a constante falta de água e a cobrança irregular nas contas de água pela Companhia de Saneamento de Minas Gerais (COPASA), tendo em vista que o ar trazido pelos canos da companhia está sendo contabilizado pelos hidrômetros."
  },
  {
    "id": "85632506",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "85632506-Petição",
    "tipo": "petição",
    "data": "2019-09-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85632506.pdf",
    "citacao": "Petição de juntada, apresentada pelo Ministério Público de Minas Gerais (MPMG), do plano de trabalho da Associação Estadual de Defesa Ambiental e Social (AEDAS), para prestação de assessoria técnica independente na região 1 – município de Brumadinho (versão final)."
  },
  {
    "id": "85632509",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "85632509-Petição",
    "tipo": "petição",
    "data": "2019-09-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/85632509.pdf",
    "citacao": "Carta da Associação Estadual de Defesa Ambiental e Social (AEDAS) acerca da entrega do Plano de trabalho de assessoria técnica aos atingidos e atingidas  - Região 1 - Brumadinho."
  },
  {
    "id": "4c3c5cb1-0856-4548-9637-a1ae9df42a2d",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Balanço da Reparação Setembro 2019",
    "tipo": "extraprocessual",
    "data": "2019-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Cantagalo",
        "geocodigo": "3112059"
      },
      {
        "nome": "Nova Lima",
        "geocodigo": "3144805"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Barão de Cocais",
        "geocodigo": "3105400"
      },
      {
        "nome": "Ouro Preto",
        "geocodigo": "3146107"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/4c3c5cb1-0856-4548-9637-a1ae9df42a2d.pdf",
    "citacao": "O Balanço da Reparação apresenta as ações da Vale para minimizar o impacto causado pelo rompimento da Barragem B1. Em sua segunda edição, a publicação mostra a evolução do trabalho nas frentes social, ambiental e de obras em Brumadinho e ao longo do Rio Paraopeba. Essa edição também contempla o trabalho para segurança das barragens e prevenção de riscos, apresentando o processo de descaracterização das estruturas a montante."
  },
  {
    "id": "3fbf9af2-d38a-468d-bde1-1b57d99e8836",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Balanço da Reparação Setembro 2019",
    "tipo": "extraprocessual",
    "data": "2019-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/3fbf9af2-d38a-468d-bde1-1b57d99e8836.pdf",
    "citacao": "O presente Balanço da Reparação apresenta as ações  desenvolvidas pela Vale entre janeiro e agosto de 2019 para minimizar o impacto causado pelo rompimento da Barragem B1. Em sua segunda edição, a publicação mostra a evolução do trabalho nas frentes social, ambiental e de obras em Brumadinho e ao longo do Rio Paraopeba. Essa edição também contempla o trabalho para segurança das barragens e prevenção de riscos, apresentando o processo de descaracterização das estruturas a montante."
  },
  {
    "id": "86472562",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "86472562-Manifestação da Defensoria Pública",
    "tipo": "manifestação da defensoria pública",
    "data": "2019-10-01",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/86472562.pdf",
    "citacao": "Manifestação da Defensoria Pública do Estado de Minas Gerais (DPMG) sobre o Plano de Trabalho apresentado pela assessoria técnica escolhida pela Região 1, qual seja, a Associação Estadual de Defesa Ambiental e Social (AEDAS). Nesta petição, requer-se a homologação do plano de trabalho, com a subsequente contratação e liberação de alvará para execução dos trabalhos da AEDAS."
  },
  {
    "id": "86881461",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "86881461-Petição",
    "tipo": "petição",
    "data": "2019-10-02",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/86881461.pdf",
    "citacao": "Petição apresentada pelo Ministério Público de Minas Gerais (MPMG), pelo Ministério Público Federal (MPF) e pela Defensoria Pública da União sobre o Plano de Trabalho elaborado pela Associação Estadual de Defesa Ambiental e Social (AEDAS). Nesta petição requer-se: (i) a juntada de Parecer Técnico em anexo; e (ii) a homologação integral do Plano de Trabalho, tendo em vista a sua adequação total às regras do Termo de Referência, e do Edital de Chamamento Público, bem como sua total pertinência e adequação ao fim ao qual se destina."
  },
  {
    "id": "89887067_8",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "89887067_8-Petição",
    "tipo": "petição",
    "data": "2019-10-23",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/89887067_8.pdf",
    "citacao": "Ofício nº 497/2019/Bacia do Paraopeba do Ministério Público de Minas Gerais (MPMG) à Vale S/A requisitando informações acerca das providências adotadas para atendimento das demandas apresentadas por morador do município de São Joaquim de Bicas/MG, relacionadas ao fornecimento de água."
  },
  {
    "id": "89887067_9",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "89887067_9-Petição",
    "tipo": "petição",
    "data": "2019-10-23",
    "municipios": [
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/89887067_9.pdf",
    "citacao": "Ofício nº 527/2019/Bacia do Paraopeba do Ministério Público de Minas Gerais (MPMG) à Vale S/A requisitando informações acerca das providências adotadas para atendimento das demandas apresentadas por morador de Cachoeira do Choro, no município de Curvelo/MG, relacionadas ao fornecimento de água."
  },
  {
    "id": "89887067_10",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "89887067_10-Petição",
    "tipo": "petição",
    "data": "2019-10-23",
    "municipios": [
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/89887067_10.pdf",
    "citacao": "Ofício nº 526/2019/Bacia do Paraopeba do Ministério Público de Minas Gerais (MPMG) à Vale S/A requisitando informações acerca das providências adotadas para atendimento das demandas apresentadas por moradora do município de Esmeraldas/MG, relacionadas ao fornecimento de água."
  },
  {
    "id": "89887068_3",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "89887068_3-Petição",
    "tipo": "petição",
    "data": "2019-10-23",
    "municipios": [
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/89887068_3.pdf",
    "citacao": "Ofício nº 533/2019/Bacia do Paraopeba do Ministério Público de Minas Gerais (MPMG) à Vale S/A requisitando informações acerca das providências adotadas para atendimento das demandas apresentadas por morador da Fazenda Alto Grande, no município de Paraopeba/MG, relacionadas ao fornecimento de água, bem como ao fornecimento de ração para animais."
  },
  {
    "id": "89887068_4",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "89887068_4-Petição",
    "tipo": "petição",
    "data": "2019-10-23",
    "municipios": [
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/89887068_4.pdf",
    "citacao": "Ofício nº 541/2019/Bacia do Paraopeba do Ministério Público de Minas Gerais (MPMG) à Vale S/A requisitando informações acerca das providências adotadas para atendimento das demandas apresentadas por morador do município de Curvelo/MG, relacionadas ao fornecimento de água."
  },
  {
    "id": "89887068_5",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "89887068_5-Petição",
    "tipo": "petição",
    "data": "2019-10-23",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/89887068_5.pdf",
    "citacao": "Ofício nº 543/2019/Bacia do Paraopeba do Ministério Público de Minas Gerais (MPMG) à Vale S/A requisitando informações acerca das providências adotadas para atendimento das demandas apresentadas por morador da Fazenda Retiro, Sítio Novilha Brava, próximo ao município de Pompéu/MG, relacionadas ao fornecimento de água, bem como ao fornecimento de ração para animais."
  },
  {
    "id": "89887068_7",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "89887068_7-Petição",
    "tipo": "petição",
    "data": "2019-10-23",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/89887068_7.pdf",
    "citacao": "Ofício nº 561/2019/Bacia do Paraopeba do Ministério Público de Minas Gerais (MPMG) à Vale S/A requisitando informações acerca das providências adotadas para atendimento das demandas apresentadas por moradores do Sítio Novilha Brava, na área rural do município de Pompéu/MG,  relacionadas ao fornecimento de água, bem como ao fornecimento de ração para animais."
  },
  {
    "id": "91287484",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "91287484-Petição",
    "tipo": "petição",
    "data": "2019-11-01",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/91287484.pdf",
    "citacao": "Petição da Defensoria Pública da União (DPU), do Ministério Público Federal (MPF), do Ministério Público de Minas Gerais (MPMG) e da Defensoria Pública do Estado de Minas Gerais (DPMG) acerca dos argumentos trazidos pela parte Ré, a Vale S/A. O documento é referente ao Plano de Trabalho da Associação Estadual de Defesa Ambiental e Social (AEDAS), com a finalidade de (i) refutar as teses apresentadas pela Ré; e (ii) trazer argumentos sólidos capazes de formar a convicção deste juízo acerca do direito à Assessoria Técnica Independente (ATI) como meio adequado para se obter o necessário equilíbrio entre as partes no processo de reparação integral dos danos causados."
  },
  {
    "id": "91289398",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "91289398-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-11-01",
    "municipios": [
      {
        "nome": "Rio Doce",
        "geocodigo": "3155009"
      },
      {
        "nome": "Santa Cruz do Escalvado",
        "geocodigo": "3157401"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/91289398.pdf",
    "citacao": "Termo de Acordo para disponibilização de Assessoria Técnica Independente nos municípios de Rio Doce/MG, Santa Cruz do Escalvado/MG e Distrito de Xopotó, firmado entre a Fundação Renova, o Centro Alternativo de Formação Popular Rosa Fortini, a Comissão de Atingidos dos municípios de Rio Doce/MG, Santa Cruz do Escalvado/MG e Distrito de Xopotó (distrito pertencente ao município de Ponte Nova/MG), o Ministério Público Federal (MPF) e o Ministério Público de Minas Gerais (MPMG), tendo por objeto estabelecer as regras mínimas acerca do compromisso assumido pela Fundação, junto à Comissão, de custear a disponibilização de assessoria técnica independente às pessoas residentes nos municípios mencionados que foram atingidas pelo rompimento da Barragem de Fundão, assim como estabelecer as condições para a prestação da referida assessoria."
  },
  {
    "id": "91289412",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "91289412-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-11-01",
    "municipios": [
      {
        "nome": "Rio Doce",
        "geocodigo": "3155009"
      },
      {
        "nome": "Santa Cruz do Escalvado",
        "geocodigo": "3157401"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/91289412.pdf",
    "citacao": "Projeto de Assessoria Técnica aos atingidos(as) pela barragem de rejeitos de Fundão nos municípios de Rio Doce, Santa Cruz do Escalvado e Xopotó (Distrito de Ponte Nova) no Estado De Minas Gerais, elaborado pelo Centro Alternativo de Formação Popular Rosa Fortini, com o objetivo de possibilitar a efetiva participação e informação em todos os processos de decisão e cumprimento da reparação de perdas e danos vivenciados pelas famílias ou pessoas atingidas pelo rompimento da barragem de Fundão, envolvendo as localidades acima mencionadas."
  },
  {
    "id": "96291199",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "96291199-Manifestação da Defensoria Pública",
    "tipo": "manifestação da defensoria pública",
    "data": "2019-12-05",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/96291199.pdf",
    "citacao": "Manifestação da Defensoria Pública do Estado de Minas Gerais e do Ministério público do Estado de Minas Gerais em que se requer o fornecimento de água para consumo humano pela requerida, Vale S/A, conforme demanda dimensionada pela direção das unidades prisionais de São Joaquim de Bicas, em todas as oportunidades em que houver redução da vazão, interrupção do fornecimento ou outros potenciais prejuízos causados pelo rompimento da barragem e/ou obras e medidas emergenciais em sua decorrência."
  },
  {
    "id": "96291207",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "96291207-Ofício",
    "tipo": "ofício",
    "data": "2019-12-05",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/96291207.pdf",
    "citacao": "Ofício s/nº da Penitenciária Professor Jason Soares Albergaria, em São Joaquim de Bicas, em resposta ao Ofício nº 02 da Defensoria Pública do Estado de Minas Gerais (DPMG), sobre o fornecimento e qualidade da água."
  },
  {
    "id": "96291208",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "96291208-Ofício",
    "tipo": "ofício",
    "data": "2019-12-05",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/96291208.pdf",
    "citacao": "Ofício nº 93/2019 do Presídio de São Joaquim de Bicas II, em resposta ao Ofício nº 03 da Defensoria Pública do Estado de Minas Gerais (DPMG), sobre o fornecimento e qualidade da água."
  },
  {
    "id": "96291211",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "96291211-Ofício",
    "tipo": "ofício",
    "data": "2019-12-05",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/96291211.pdf",
    "citacao": "Ofício da COPASA nº 383/2019, encaminhado à diretoria do Presídio de São Joaquim de Bicas, informando sobre a falta de água na região do presídio e bairros adjacentes."
  },
  {
    "id": "97263615",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "97263615-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2019-12-12",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/97263615.pdf",
    "citacao": "Memorando IGAM/DPLR.nº53/2019, em atenção ao ofício 9857324, conforme demonstra a Relação de Usuários (9881166), onde se informa que não foi identificado usuário de recursos hídricos, devidamente regularizado, cuja finalidade de uso seja abastecimento de água de presídios na comarca de Brumadinho."
  },
  {
    "id": "98493629",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "98493629-Manifestação da Promotoria",
    "tipo": "manifestação da promotoria",
    "data": "2019-12-19",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/98493629.pdf",
    "citacao": "Carta da AECOM nº 60612553-ACM-DM-ZZ-LT-PM-004/2019 sobre o potencial impacto no abastecimento de água para os presídios das comarcas de Brumadinho e Igarapé, em decorrência ao rompimento das barragens B-I, B-IV, B-IV-A da Mina Córrego do Feijão, em Brumadinho/MG. Considera-se não haver nexo causal entre o rompimento das barragens B-I, B-IV e B-IV-A e o impacto na qualidade de água fornecida para os presídios."
  },
  {
    "id": "a8bdfd01-1a8c-4bc7-b44c-a949fe7a9fe2",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Balanço da Reparação Dezembro 2019",
    "tipo": "extraprocessual",
    "data": "2019-12-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Nova Lima",
        "geocodigo": "3144805"
      },
      {
        "nome": "São Francisco",
        "geocodigo": "3161106"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "Barão de Cocais",
        "geocodigo": "3105400"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/a8bdfd01-1a8c-4bc7-b44c-a949fe7a9fe2.pdf",
    "citacao": "A Vale permanece empenhada no avanço ágil da reparação ambiental da bacia hidrográfica do rio Paraopeba e de seu entorno. O Balanço da Reparação apresenta as ações da Vale para minimizar o impacto causado pelo rompimento da Barragem B1. Em sua terceira edição, a publicação destaca a recuperação do rio Paraopeba e as ações para tratamento e garantia de fornecimento de água nas áreas impactadas. A reparação nas frentes social e de obras emergenciais e a evolução do processo de descaracterização das barragens a montante também são apresentadas. Sabemos que há muito o que fazer. Vamos continuar fazendo e prestando contas à sociedade."
  },
  {
    "id": "7147b0b4-7fbe-4a7b-ab4f-ef77e0b0934d",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Balanço da Reparação Dezembro 2019",
    "tipo": "extraprocessual",
    "data": "2019-12-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/7147b0b4-7fbe-4a7b-ab4f-ef77e0b0934d.pdf",
    "citacao": "A Vale permanece empenhada no avanço ágil da reparação ambiental da bacia hidrográfica do rio Paraopeba e de seu entorno. O Balanço da Reparação apresenta as ações da Vale para minimizar o impacto causado pelo rompimento da Barragem B1. Em sua terceira edição, a publicação destaca a recuperação do rio Paraopeba e as ações para tratamento e garantia de fornecimento de água nas áreas impactadas. A reparação nas frentes social e de obras emergenciais e a evolução do processo de descaracterização das barragens a montante também são apresentadas. Sabemos que há muito o que fazer. Vamos continuar fazendo e prestando contas à sociedade"
  },
  {
    "id": "99459108",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "99459108-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-01-10",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/99459108.pdf",
    "citacao": "Comunicado nº 094/2019 da COPASA, em resposta ao ofício nº 922/2019 da Advocacia Geral do Estado (AGE), sobre abastecimento de água no presídio de São Joaquim de Bicas, paralisação de captação de água no Rio Paraopeba e abastecimento de água no presídio Jason Soares Albergaria e em outros situados em Brumadinho-MG e região"
  },
  {
    "id": "104372573",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "104372573-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2020-02-13",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/104372573.pdf",
    "citacao": "Plano de Trabalho apresentado pela Associação Estadual de Defesa Ambiental e Social (AEDAS) de Assessoria Técnica aos atingidos na região 2 (municípios de Mário Campos, São Joaquim de Bicas, Betim, Igarapé e Juatuba) para a democratização das decisões relativas à Recuperação integral das perdas e danos geradas pelo rompimento da Barragem B-I e soterramento das barragens B-I e B-IVA da Mina do Córrego do Feijão da Empresa Vale S/A. O objetivo do Plano é subsidiar e impulsionar uma proposta de Plano de Recuperação Integral das perdas e danos sofridos pelas famílias atingidas em razão do rompimento da barragem na região 2, a partir da promoção da participação efetiva e garantia do acesso à informação."
  },
  {
    "id": "104372574",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "104372574-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2020-02-13",
    "municipios": [
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/104372574.pdf",
    "citacao": "Plano de Trabalho elaborado pelo Núcleo de Assessoria às Comunidades Atingidas por Barragens (NACAB) como assessoria técnica independente para a Recuperação integral de danos aos atingidos pelo desastre da Vale S/A. O Plano tem o objetivo de assessorar as pessoas e comunidades dos municípios da Região 3, para que possam participar qualificadamente dos processos de definição e implantação monitorada dos planos, programas e ações necessários à Recuperação integral das perdas e danos que sofreram em razão do rompimento da barragem B-I e soterramentos das barragens B-IV e B-IV-A da mina do Córrego do Feijão da empresa Vale S/A."
  },
  {
    "id": "104372575",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "104372575-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2020-02-13",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/104372575.pdf",
    "citacao": "Plano de Trabalho de Assessoria Técnica apresentado pelo Instituto Guaicuy às comunidades da região 4 (Pompéu-MG e Curvelo-MG) atingidas pelo rompimento da Barragem B-I e soterramento das barragens B-I e B-IVA da Mina do Córrego do Feijão da Empresa Vale S/A. O objetivo do Plano é apresentar as formas e as ações que serão desenvolvidas pela Instituto Guaicuy durante as atividades de Assessoria Técnica na Região 4, bem como garantir de modo transdisciplinar o direito à informação, inclusive técnica, às pessoas atingidas, em linguagem adequada às características socioculturais e particularidades locais, possibilitando a participação informada nos processos de Recuperação integral dos danos decorrentes do rompimento da barragem em Brumadinho."
  },
  {
    "id": "104372576",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "104372576-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2020-02-13",
    "municipios": [
      {
        "nome": "São Gonçalo do Abaeté",
        "geocodigo": "3161700"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      },
      {
        "nome": "Morada Nova de Minas",
        "geocodigo": "3143500"
      },
      {
        "nome": "Biquinhas",
        "geocodigo": "3107000"
      },
      {
        "nome": "Paineiras",
        "geocodigo": "3146404"
      },
      {
        "nome": "Martinho Campos",
        "geocodigo": "3140506"
      },
      {
        "nome": "Abaeté",
        "geocodigo": "3100203"
      },
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/104372576.pdf",
    "citacao": "Plano de Trabalho de Assessoria Técnica apresentado pelo Instituto Guaicuy às comunidades da área 5 - municípios banhados pelo lago da Usina Hidrelétrica de Três Marias (São Gonçalo do Abaeté, Felixlândia, Morada Nova de Minas, Biquinhas, Paineiras, Martinho Campos, Abaeté e Três Marias) - atingidas pelo rompimento da Barragem B-I e soterramento das barragens B-I e B-IVA da Mina do Córrego do Feijão da Empresa Vale S/A. O objetivo do Plano é apresentar as formas e as ações que serão desenvolvidas pela Instituto Guaicuy, durante as atividades de Assessoria Técnica na Região 5, bem como garantir de modo transdisciplinar o direito à informação, inclusive técnica, às pessoas atingidas, em linguagem adequada às características socioculturais e particularidades locais, possibilitando a participação informada nos processos de Recuperação integral dos danos decorrentes do rompimento da barragem em Brumadinho."
  },
  {
    "id": "106851817",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "106851817-Petição",
    "tipo": "petição",
    "data": "2020-03-03",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/106851817.pdf",
    "citacao": "Petição da Vale S/A que, em atendimento ao determinado na audiência de 13/02/20, apresenta as obras viárias em andamento em Brumadinho e relatório de intervenções viárias, contendo os projetos desta natureza que estão sendo elaborados e/ou executados pela Vale S/A em Brumadinho (doc.1), a fim de requerer a sua juntada. Requer-se também a juntada da inclusa apresentação sobre as demais medidas de contenção e Recuperação que estão sendo realizadas pela Companhia no Município de Brumadinho (doc. 3)."
  },
  {
    "id": "104375063",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "104375063-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2020-03-13",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/104375063.pdf",
    "citacao": "Plano de Trabalho apresentado pela Associação Estadual de Defesa Ambiental e Social (AEDAS) de Assessoria Técnica aos atingidos na região 2 (municípios de Mário Campos, São Joaquim de Bicas, Betim, Igarapé e Juatuba) para a democratização das decisões relativas à reparação integral das perdas e danos geradas pelo rompimento da Barragem B-I e soterramento das barragens B-I e B-IVA da Mina do Córrego do Feijão da Empresa Vale S/A. O objetivo do Plano é subsidiar e impulsionar uma proposta de Plano de Reparação Integral das perdas e danos sofridos pelas famílias atingidas em razão do rompimento da barragem na região 2, a partir da promoção da participação efetiva e garantia do acesso à informação."
  },
  {
    "id": "104375065",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "104375065-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2020-03-13",
    "municipios": [
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/104375065.pdf",
    "citacao": "Plano de Trabalho elaborado pelo Núcleo de Assessoria às Comunidades Atingidas por Barragens (NACAB) como assessoria técnica independente para a reparação integral de danos aos atingidos pelo desastre da Vale S/A. O Plano tem o objetivo de assessorar as pessoas e comunidades dos municípios da Região 3, para que possam participar qualificadamente dos processos de definição e implantação monitorada dos planos, programas e ações necessários à reparação integral das perdas e danos que sofreram em razão do rompimento da barragem B-I e soterramentos das barragens B-IV e B-IV-A da mina do Córrego do Feijão da empresa Vale S/A."
  },
  {
    "id": "104375066",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "104375066-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2020-03-13",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/104375066.pdf",
    "citacao": "Plano de Trabalho de Assessoria Técnica apresentado pelo Instituto Guaicuy às comunidades da região 4 (Pompéu-MG e Curvelo-MG) atingidas pelo rompimento da Barragem B-I e soterramento das barragens B-I e B-IVA da Mina do Córrego do Feijão da Empresa Vale S/A. O objetivo do Plano é apresentar as formas e as ações que serão desenvolvidas pela Instituto Guaicuy durante as atividades de Assessoria Técnica na Região 4, bem como garantir de modo transdisciplinar o direito à informação, inclusive técnica, às pessoas atingidas, em linguagem adequada às características socioculturais e particularidades locais, possibilitando a participação informada nos processos de reparação integral dos danos decorrentes do rompimento da barragem em Brumadinho."
  },
  {
    "id": "104375067",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "104375067-Outros Documentos",
    "tipo": "outros documentos",
    "data": "2020-03-13",
    "municipios": [
      {
        "nome": "São Gonçalo do Abaeté",
        "geocodigo": "3161700"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      },
      {
        "nome": "Morada Nova de Minas",
        "geocodigo": "3143500"
      },
      {
        "nome": "Biquinhas",
        "geocodigo": "3107000"
      },
      {
        "nome": "Paineiras",
        "geocodigo": "3146404"
      },
      {
        "nome": "Martinho Campos",
        "geocodigo": "3140506"
      },
      {
        "nome": "Abaeté",
        "geocodigo": "3100203"
      },
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/104375067.pdf",
    "citacao": "Plano de Trabalho de Assessoria Técnica apresentado pelo Instituto Guaicuy às comunidades da área 5 - municípios banhados pelo lago da Usina Hidrelétrica de Três Marias (São Gonçalo do Abaeté, Felixlândia, Morada Nova de Minas, Biquinhas, Paineiras, Martinho Campos, Abaeté e Três Marias) - atingidas pelo rompimento da Barragem B-I e soterramento das barragens B-I e B-IVA da Mina do Córrego do Feijão da Empresa Vale S/A. O objetivo do Plano é apresentar as formas e as ações que serão desenvolvidas pela Instituto Guaicuy, durante as atividades de Assessoria Técnica na Região 5, bem como garantir de modo transdisciplinar o direito à informação, inclusive técnica, às pessoas atingidas, em linguagem adequada às características socioculturais e particularidades locais, possibilitando a participação informada nos processos de reparação integral dos danos decorrentes do rompimento da barragem em Brumadinho."
  },
  {
    "id": "110434000",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "110434000-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-03-31",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/110434000.pdf",
    "citacao": "Ofício nº 59/2020 do Departamento de Edificações e Estradas de Rodagem (DER) do Estado de Minas Gerais, em resposta ao Despacho 306 (12532337), informando que não há óbice por parte do DER/MG quanto à proposta apresentada pela Vale S/A (12297588). Esclarece também que os segmentos contemplados na proposta são municipais, não circunscritos à mencionada Autarquia. Por isso, sugere a consulta à Prefeitura Municipal de Brumadinho."
  },
  {
    "id": "110434874",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "110434874-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-03-31",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/110434874.pdf",
    "citacao": "Ofício nº 59/2020 do Departamento de Edificações e Estradas de Rodagem (DER) do Estado de Minas Gerais, em resposta ao Despacho 306 (12532337), informando que não há óbice por parte do DER/MG quanto à proposta apresentada pela Vale S/A (12297588). Esclarece também que os segmentos contemplados na proposta são municipais, não circunscritos à mencionada Autarquia. Por isso, sugere a consulta à Prefeitura Municipal de Brumadinho."
  },
  {
    "id": "117272936",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "117272936-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-05-26",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/117272936.pdf",
    "citacao": "Plano de Trabalho apresentado pela Associação Estadual de Defesa Ambiental e Social (AEDAS) de Assessoria Técnica aos atingidos na região 2 (municípios de Mário Campos, São Joaquim de Bicas, Betim, Igarapé e Juatuba) para a democratização das decisões relativas à reparação integral das perdas e danos gerados pelo rompimento da Barragem B-I e soterramento das barragens B-I e B-IVA da Mina do Córrego do Feijão da Empresa Vale S/A. O objetivo do Plano é subsidiar e impulsionar uma proposta de Plano de Reparação Integral das perdas e danos sofridos pelas famílias atingidas em razão do rompimento da barragem na região 2, a partir da promoção da participação efetiva e garantia do acesso à informação."
  },
  {
    "id": "117272937",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "117272937-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-05-26",
    "municipios": [
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/117272937.pdf",
    "citacao": "Plano de Trabalho elaborado pelo Núcleo de Assessoria às Comunidades Atingidas por Barragens (NACAB) como assessoria técnica independente para a reparação integral de danos aos atingidos pelo desastre da Vale S/A. O Plano tem o objetivo de assessorar as pessoas e comunidades dos municípios da Região 3, para que possam participar qualificadamente dos processos de definição e implantação monitorada dos planos, programas e ações necessários à reparação integral das perdas e danos que sofreram em razão do rompimento da barragem B-I e soterramentos das barragens B-IV e B-IV-A da mina do Córrego do Feijão da empresa Vale S/A."
  },
  {
    "id": "117272938",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "117272938-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-05-26",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/117272938.pdf",
    "citacao": "Plano de Trabalho de Assessoria Técnica apresentado pelo Instituto Guaicuy às comunidades da região 4 (Pompéu-MG e Curvelo-MG) atingidas pelo rompimento da Barragem B-I e soterramento das barragens B-I e B-IVA da Mina do Córrego do Feijão da Empresa Vale S/A. O objetivo do Plano é apresentar as formas e as ações que serão desenvolvidas pela Instituto Guaicuy durante as atividades de Assessoria Técnica na Região 4, bem como garantir de modo transdisciplinar o direito à informação, inclusive técnica, às pessoas atingidas, em linguagem adequada às características socioculturais e particularidades locais, possibilitando a participação informada nos processos de reparação integral dos danos decorrentes do rompimento da barragem em Brumadinho."
  },
  {
    "id": "117272941",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "117272941-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-05-26",
    "municipios": [
      {
        "nome": "São Gonçalo do Abaeté",
        "geocodigo": "3161700"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      },
      {
        "nome": "Morada Nova de Minas",
        "geocodigo": "3143500"
      },
      {
        "nome": "Biquinhas",
        "geocodigo": "3107000"
      },
      {
        "nome": "Paineiras",
        "geocodigo": "3146404"
      },
      {
        "nome": "Martinho Campos",
        "geocodigo": "3140506"
      },
      {
        "nome": "Abaeté",
        "geocodigo": "3100203"
      },
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/117272941.pdf",
    "citacao": "Plano de Trabalho de Assessoria Técnica apresentado pelo Instituto Guaicuy às comunidades da área 5 - municípios banhados pelo lago da Usina Hidrelétrica de Três Marias (São Gonçalo do Abaeté, Felixlândia, Morada Nova de Minas, Biquinhas, Paineiras, Martinho Campos, Abaeté e Três Marias) - atingidas pelo rompimento da Barragem B-I e soterramento das barragens B-I e B-IVA da Mina do Córrego do Feijão da Empresa Vale S/A. O objetivo do Plano é apresentar as formas e as ações que serão desenvolvidas pelo Instituto Guaicuy durante as atividades de Assessoria Técnica na Região 5, bem como garantir de modo transdisciplinar o direito à informação, inclusive técnica, às pessoas atingidas, em linguagem adequada às características socioculturais e particularidades locais, possibilitando a participação informada nos processos de reparação integral dos danos decorrentes do rompimento da barragem em Brumadinho."
  },
  {
    "id": "120007813",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "120007813-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-06-15",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/120007813.pdf",
    "citacao": "Plano de Trabalho de Assessoria Técnica apresentado pelo Instituto Guaicuy às comunidades da Região 4 (Pompéu-MG e Curvelo-MG) atingidas pelo rompimento da Barragem B-I e soterramento das barragens B-I e B-IVA da Mina do Córrego do Feijão da Empresa Vale S/A. O objetivo do Plano é apresentar as formas e as ações que serão desenvolvidas pelo Instituto Guaicuy durante as atividades de Assessoria Técnica na Região 4, bem como garantir, de modo transdisciplinar, o direito à informação, inclusive técnica, às pessoas atingidas, em linguagem adequada às características socioculturais e particularidades locais, possibilitando a participação informada nos processos de mobilização social, inclusive para a produção de prova técnica de identificação e mensuração dos danos decorrentes do rompimento da barragem em Brumadinho."
  },
  {
    "id": "120007815",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "120007815-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-06-15",
    "municipios": [
      {
        "nome": "São Gonçalo do Abaeté",
        "geocodigo": "3161700"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      },
      {
        "nome": "Morada Nova de Minas",
        "geocodigo": "3143500"
      },
      {
        "nome": "Biquinhas",
        "geocodigo": "3107000"
      },
      {
        "nome": "Martinho Campos",
        "geocodigo": "3140506"
      },
      {
        "nome": "Abaeté",
        "geocodigo": "3100203"
      },
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/120007815.pdf",
    "citacao": "Plano de Trabalho de Assessoria Técnica apresentado pelo Instituto Guaicuy às comunidades da Área 5 – municípios banhados pelo lago da UHE de Três Marias (São Gonçalo do Abaeté, Felixlândia, Morada Nova de Minas, Biquinhas, Paineiras, Martinho Campos, Abaeté e Três Marias) – atingidas pelo rompimento da Barragem B-I e soterramento das barragens B-I e B-IVA da Mina do Córrego do Feijão da Empresa Vale S/A. O objetivo do Plano é apresentar as formas e as ações que serão desenvolvidas pelo Instituto Guaicuy durante as atividades de Assessoria Técnica na Região 5, bem como garantir, de modo transdisciplinar, o direito à informação, inclusive técnica, às pessoas atingidas, em linguagem adequada às características socioculturais e particularidades locais, possibilitando a participação informada nos processos de mobilização social, inclusive para a produção de prova técnica de identificação e mensuração dos danos decorrentes do rompimento da barragem em Brumadinho."
  },
  {
    "id": "120007818",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "120007818-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-06-15",
    "municipios": [
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/120007818.pdf",
    "citacao": "Plano de Trabalho elaborado pelo Núcleo de Assessoria às Comunidades Atingidas por Barragens (NACAB) como assessoria técnica independente para a reparação integral de danos aos atingidos pelo desastre da Vale S/A. O Plano tem o objetivo de assessorar as pessoas e comunidades dos municípios da Região 3, para que possam participar qualificadamente dos processos de levantamento de evidências, definição e implantação monitorada dos planos, programas e ações necessários à reparação integral das perdas e danos que sofreram em razão do rompimento da barragem B-I e soterramentos das barragens B-IV e B-IV-A da mina do Córrego do Feijão da empresa Vale S/A."
  },
  {
    "id": "121100289",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "121100289-Manifestação da Defensoria Pública",
    "tipo": "manifestação da defensoria pública",
    "data": "2020-06-22",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/121100289.pdf",
    "citacao": "Petição do Ministério Público de Minas Gerais (MPMG), da Defensoria Pública do Estado de Minas Gerais (DPMG), do Ministério Público Federal (MPF) e da Defensoria Pública da União (DPU) sobre o fornecimento de água pela Vale S/A para os atingidos pelo rompimento da barragem da Mina Córrego do Feijão, alegando que a Vale desrespeita a decisão judicial que lhe determinou fornecer água para as atividades produtivas em qualidade adequada e quantidade suficiente às necessidades apresentadas pelas pessoas atingidas que a ela solicitarem. Apresenta-se tabela com a demanda de água dos atingidos por localidade, bem como os locais onde a Vale provisiona água aos demandantes. Requer-se a imediata determinação à Vale S/A de que seja fornecida, sob pena de multa, água potável para consumo e uso humano, com qualidade, frequência e regularidade adequadas (150 L por pessoa), aos territórios de Brumadinho, Betim, Mário Campos, São Joaquim de Bicas, Região 03 e Região 04, nos termos da decisão de ID 70610802; e que seja aplicada imediata multa cominatória em caso de descumprimento, em valor a ser arbitrado pelo Juízo, devida desde o dia de cada prática infracional até efetivo desembolso."
  },
  {
    "id": "84ff9b63-675c-4db2-8bfb-e0e0f7a1a25a",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Balanço da Reparação Junho 2020",
    "tipo": "extraprocessual",
    "data": "2020-06-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Barão de Cocais",
        "geocodigo": "3105400"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      },
      {
        "nome": "Itabira",
        "geocodigo": "3131703"
      },
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      },
      {
        "nome": "São Francisco",
        "geocodigo": "3161106"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/84ff9b63-675c-4db2-8bfb-e0e0f7a1a25a.pdf",
    "citacao": "Ações a longo prazo: estamos perto de lançar o Plano de Reparação Integral (PRI) de Brumadinho e calha do Paraopeba, que contemplará todas as iniciativas que irão orientar o trabalho de reparação e compensação nos próximos anos. Meio ambiente: lançamos o Marco Zero, projeto-piloto para reabilitar a calhao ribeirão Ferro-Carvão e restaurar a vegetação nativa, contribuindo também para a recuperação do rio Paraopeba. A Associação dos Familiares de Vítimas e Atingidos pelo Rompimento da Barragem Mina Córrego do Feijão (Avabrum), em Brumadinho, escolheu o projeto do arquiteto Gustavo Penna para o Memorial que será construído no município. Concluímos as obras de interligação dos dois sistemas de abastecimento da Copasa na Região Metropolitana de Belo Horizonte: o sistema do Paraopeba e o sistema do rio das Velhas. Realizamos uma ampla consulta pública para que os próprios moradores de Barão de Cocais sugerissem os projetos que irão compor o Plano de Compensação da Vale para o município. Combate à Covid-19: nós também ajudamos a sociedade brasileira, o povo mineiro e as comunidades de Brumadinho e municípios realocando as pessoas de suas casas preventivamente."
  },
  {
    "id": "b72d8f10-391d-43f4-8846-554be23cbe04",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Balanço da Reparação Junho 2020",
    "tipo": "extraprocessual",
    "data": "2020-06-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/b72d8f10-391d-43f4-8846-554be23cbe04.pdf",
    "citacao": "Neste Balanço do primeiro semestre de 2020 são apresentadas as ações a longo prazo do Plano de Reparação Integral (PRI) de Brumadinho e calha do Paraopeba, que contemplará todas as iniciativas que irão orientar o trabalho de reparação e compensação nos próximos anos; as iniciativas para recuperação do Meio ambiente, por meio do lançamento do Marco Zero, projeto-piloto para reabilitar a calha do ribeirão Ferro-Carvão e restaurar a vegetação nativa, contribuindo também para a recuperação do rio Paraopeba; conclusão das obras de interligação dos dois sistemas de abastecimento da Copasa na Região Metropolitana de Belo Horizonte: o sistema do Paraopeba e o sistema do rio das Velhas. Ainda, a Associação dos Familiares de Vítimas e Atingidos pelo Rompimento da Barragem Mina Córrego do Feijão (Avabrum), em Brumadinho, escolheu o projeto do arquiteto Gustavo Penna para o Memorial que será construído no município."
  },
  {
    "id": "239886835",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "239886835-Petição",
    "tipo": "petição",
    "data": "2020-08-04",
    "municipios": [
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/239886835.pdf",
    "citacao": "Petição da Defensoria Pública da União (DPU), do Ministério Público Federal (MPF), do Ministério Público de Minas Gerais (MPMG) e da Defensoria Pública do Estado de Minas Gerais (DPMG) sobre a inclusão da comunidade Shopping da Minhoca no rol de territórios com direito ao pagamento emergencial judicialmente acordado, ao argumento de que o setor técnico especializado do MPMG concluiu pela existência de sério comprometimento da renda das famílias e pessoas que compõem a comunidade, em decorrência do desastre da Vale ocorrido em Brumadinho, gerando, por consequência, a obrigação desta de paralisar/mitigar/impedir os efeitos do comprometimento da renda. Requer-se 1) que seja determinada à Vale S/A a obrigação de pagar auxílio econômico provisório a todas as pessoas que compõem a rede do Shopping da Minhoca e o valor correspondente a uma cesta básica do Dieese por família; 2) o reconhecimento de que a obrigação é devida desde o dia 25/01/2019, em razão da perda de renda ter ocorrido desde o rompimento; e 3) a manutenção do pagamento do auxílio econômico provisório até a conclusão dos estudos e pesquisas realizados pelo Comitê Técnico-Científico."
  },
  {
    "id": "446888432_1",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888432_1-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888432_1.pdf",
    "citacao": "Ofício nº 005/2020 do Município de Pompeu, em resposta ao ofício nº 078/2020 do Ministério Público de Minas Gerais, informando não ter sido constatado no município nenhum novo prejuízo ao patrimônio cultural além dos já constatados pelo Laudo Técnico 069/2019. Além disso, considera-se que as medidas reparatórias propostas pelo Estado têm sido suficientes."
  },
  {
    "id": "446888432_2",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888432_2-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888432_2.pdf",
    "citacao": "Ofício s/n do Município de Inhaúma, em resposta ao ofício nº 075/2020 do Ministério Público de Minas Gerais (MPMG), identificando a inserção do município na bacia do Paraopeba e no Circuito Turístico das Grutas. Embora sem constatações de prejuízo direto no município, solicita-se sua inclusão nos levantamentos realizados pelo MPMG e demais entidades envolvidas, por se tratar de município circundado por municípios que sofreram danos decorrentes do rompimento da barragem da Vale em Brumadinho."
  },
  {
    "id": "446888432_3",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888432_3-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888432_3.pdf",
    "citacao": "Ofício nº 003/2020 do Município de Igarapé, em resposta ao ofício nº 065/2020 do Ministério Público de Minas Gerais esclarecendo que, em relação aos danos ao patrimônio cultural no município, constatou-se a queda das atividades turísticas que fomentam a preservação do patrimônio cultural imaterial e o risco à fruição do Conjunto Natural e Paisagístico da Pedra Grande de Igarapé, bem cultural tombado pela municipalidade. No que se refere às medidas propostas pelo Estado, recomenda-se atenção especial à salvaguarda do Conjunto Natural e Paisagístico da Pedra Grande de Igarapé, de propriedade da mineradora Usiminas."
  },
  {
    "id": "446683399",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446683399-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446683399.pdf",
    "citacao": "Ofício nº 209/2020 do Ministério Público de Minas Gerais, endereçado ao Município de Brumadinho, solicitando informações sobre eventual plano ou projeto de recuperação do turismo na região, desenvolvido ou financiado por recursos da Vale S/A."
  },
  {
    "id": "446873437",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "446873437-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446873437.pdf",
    "citacao": "Ofício nº 209/2020 do Ministério Público de Minas Gerais, endereçado ao Município de Brumadinho, solicitando informações sobre eventual plano ou projeto de recuperação do turismo na região, desenvolvido ou financiado por recursos da Vale S/A."
  },
  {
    "id": "446888400",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888400-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888400.pdf",
    "citacao": "Certidão do Ministério Público de Minas Gerais de realização de reunião, no dia 05/05/2020, destinada à apresentação dos anteprojetos arquitetônicos para o \"Espaço de memória em homenagem às vítimas do rompimento da Barragem de Córrego do Feijão\", desenvolvidos pelos escritórios convidados pela Vale S/A, sendo eles: Bernardes Arquitetura, Gustavo Penna Arquiteto e Associados, Rizoma Arquitetura e MACh arquitetos."
  },
  {
    "id": "446888401",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888401-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888401.pdf",
    "citacao": "Certidão do Ministério Público de Minas Gerais de realização de reunião, no dia 10/06/2020, na qual tratou-se da expografia e do conteúdo do “Espaço de memória em homenagem às vítimas do rompimento da Barragem de Córrego do Feijão” a ser construído pela Vale S/A em Brumadinho-MG."
  },
  {
    "id": "446888409",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888409-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888409.pdf",
    "citacao": "Ofício nº 061/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Turismo e Cultura de Brumadinho-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888410",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888410-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888410.pdf",
    "citacao": "Ofício nº 062/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de São Joaquim de Bicas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888411",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888411-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888411.pdf",
    "citacao": "Ofício nº 063/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Mário Campos-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888412",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888412-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888412.pdf",
    "citacao": "Ofício nº 064/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Betim-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888413",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888413-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888413.pdf",
    "citacao": "Ofício nº 065/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Igarapé-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888414",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888414-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888414.pdf",
    "citacao": "Ofício nº 066/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Juatuba-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888415",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888415-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888415.pdf",
    "citacao": "Ofício nº 067/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Florestal-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888416",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888416-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888416.pdf",
    "citacao": "Ofício nº 068/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Pará de Minas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888417",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888417-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888417.pdf",
    "citacao": "Ofício nº 069/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Esmeraldas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888418",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888418-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888418.pdf",
    "citacao": "Ofício nº 070/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de São José da Varginha-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888419",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888419-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888419.pdf",
    "citacao": "Ofício nº 071/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Pequi-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888420",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888420-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888420.pdf",
    "citacao": "Ofício nº 072/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Fortuna de Minas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888421",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888421-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888421.pdf",
    "citacao": "Ofício nº 073/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Maravilhas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888422",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888422-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888422.pdf",
    "citacao": "Ofício nº 074/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Papagaios-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888423",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888423-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888423.pdf",
    "citacao": "Ofício nº 075/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Inhaúma-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888424",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888424-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888424.pdf",
    "citacao": "Ofício nº 076/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Paraopeba-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888425",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888425-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888425.pdf",
    "citacao": "Ofício nº 077/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Curvelo-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888426",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888426-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888426.pdf",
    "citacao": "Ofício nº 078/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Pompeu-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888427",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888427-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888427.pdf",
    "citacao": "Ofício nº 079/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Felixlândia-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888428",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888428-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Cachoeira da Prata",
        "geocodigo": "3109600"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888428.pdf",
    "citacao": "Ofício nº 082/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Cachoeira da Prata-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888429",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888429-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888429.pdf",
    "citacao": "Ofício nº 083/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Caetanópolis-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888430",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888430-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Ibirité",
        "geocodigo": "3129806"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888430.pdf",
    "citacao": "Ofício nº 084/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Ibirité-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "446888431",
    "processo": "5044954-73.2019.8.13.0024",
    "titulo": "446888431-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/446888431.pdf",
    "citacao": "Ofício nº 085/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Três Marias-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163394",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163394-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163394.pdf",
    "citacao": "Certidão do Ministério Público de Minas Gerais de realização de reunião, no dia 05/05/2020, destinada à apresentação dos anteprojetos arquitetônicos para o \"Espaço de memória em homenagem às vítimas do rompimento da Barragem de Córrego do Feijão\", desenvolvidos pelos escritórios convidados pela Vale S/A, sendo eles: Bernardes Arquitetura, Gustavo Penna Arquiteto e Associados, Rizoma Arquitetura e MACh arquitetos."
  },
  {
    "id": "447163395",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163395-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163395.pdf",
    "citacao": "Certidão do Ministério Público de Minas Gerais de realização de reunião, no dia 10/06/2020, na qual tratou-se da expografia e do conteúdo do “Espaço de memória em homenagem às vítimas do rompimento da Barragem de Córrego do Feijão”, a ser construído pela Vale S/A em Brumadinho-MG."
  },
  {
    "id": "447163402",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163402-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163402.pdf",
    "citacao": "Ofício nº 061/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Turismo e Cultura de Brumadinho-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163403",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163403-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163403.pdf",
    "citacao": "Ofício nº 062/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de São Joaquim de Bicas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163404",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163404-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163404.pdf",
    "citacao": "Ofício nº 063/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Mário Campos-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163405",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163405-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163405.pdf",
    "citacao": "Ofício nº 064/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Betim-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163406",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163406-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163406.pdf",
    "citacao": "Ofício nº 065/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Igarapé-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163407",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163407-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163407.pdf",
    "citacao": "Ofício nº 066/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Juatuba-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163408",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163408-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163408.pdf",
    "citacao": "Ofício nº 067/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Florestal-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163409",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163409-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163409.pdf",
    "citacao": "Ofício nº 068/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Pará de Minas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163410",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163410-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163410.pdf",
    "citacao": "Ofício nº 069/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Esmeraldas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163411",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163411-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163411.pdf",
    "citacao": "Ofício nº 070/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de São José da Varginha-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163412",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163412-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163412.pdf",
    "citacao": "Ofício nº 071/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Pequi-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163413",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163413-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163413.pdf",
    "citacao": "Ofício nº 072/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Fortuna de Minas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163414",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163414-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163414.pdf",
    "citacao": "Ofício nº 073/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Maravilhas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163415",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163415-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163415.pdf",
    "citacao": "Ofício nº 074/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Papagaios-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163416",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163416-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163416.pdf",
    "citacao": "Ofício nº 075/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Inhaúma-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163417",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163417-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163417.pdf",
    "citacao": "Ofício nº 076/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Paraopeba-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163418",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163418-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163418.pdf",
    "citacao": "Ofício nº 077/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Curvelo-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163419",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163419-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163419.pdf",
    "citacao": "Ofício nº 078/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Pompéu-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163420",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163420-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163420.pdf",
    "citacao": "Ofício nº 079/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Felixlândia-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163421",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163421-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Cachoeira da Prata",
        "geocodigo": "3109600"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163421.pdf",
    "citacao": "Ofício nº 082/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Cachoeira da Prata-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163422",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163422-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163422.pdf",
    "citacao": "Ofício nº 083/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Caetanópolis-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163423",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163423-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Ibirité",
        "geocodigo": "3129806"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163423.pdf",
    "citacao": "Ofício nº 084/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Ibirité-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163424",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163424-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163424.pdf",
    "citacao": "Ofício nº 085/2020 do Ministério Público de Minas Gerais, enviado via e-mail à Secretaria Municipal de Cultura de Três Marias-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019;e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447163425",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163425-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163425.pdf",
    "citacao": "Ofício nº 005/2020 do Município de Pompéu, em resposta ao ofício nº 078/2020 do Ministério Público de Minas Gerais, informando não ter sido constatado no município nenhum novo prejuízo ao patrimônio cultural além dos já constatados pelo Laudo Técnico 069/2019. Além disso, considera-se que as medidas reparatórias propostas pelo Estado têm sido suficientes."
  },
  {
    "id": "447163468",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447163468-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163468.pdf",
    "citacao": "Ofício nº 209/2020 do Ministério Público de Minas Gerais, endereçado ao Município de Brumadinho, solicitando informações sobre eventual plano ou projeto de recuperação do turismo na região, desenvolvido ou financiado por recursos da Vale S/A."
  },
  {
    "id": "447188487",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447188487-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447188487.pdf",
    "citacao": "Ofício nº 209/2020 do Ministério Público de Minas Gerais endereçado ao Município de Brumadinho, solicitando informações sobre eventual plano ou projeto de recuperação do turismo na região, desenvolvido ou financiado por recursos da Vale S/A."
  },
  {
    "id": "447208410",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208410-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208410.pdf",
    "citacao": "Certidão do Ministério Público de Minas Gerais de realização de reunião, no dia 05/05/2020, destinada à apresentação dos anteprojetos arquitetônicos para o \"Espaço de memória em homenagem às vítimas do rompimento da Barragem de Córrego do Feijão\", desenvolvidos pelos escritórios convidados pela Vale S/A, sendo eles: Bernardes Arquitetura, Gustavo Penna Arquiteto e Associados, Rizoma Arquitetura e MACh arquitetos."
  },
  {
    "id": "447208411",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208411-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208411.pdf",
    "citacao": "Certidão do Ministério Público de Minas Gerais de realização de reunião, no dia 10/06/2020, na qual tratou-se da expografia e do conteúdo do “Espaço de memória em homenagem às vítimas do rompimento da Barragem de Córrego do Feijão” a ser construído pela Vale S/A em Brumadinho-MG."
  },
  {
    "id": "447208418",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208418-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208418.pdf",
    "citacao": "Ofício nº 061/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Turismo e Cultura de Brumadinho-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208419",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208419-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208419.pdf",
    "citacao": "Ofício nº 062/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de São Joaquim de Bicas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208420",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208420-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208420.pdf",
    "citacao": "Ofício nº 063/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Mário Campos-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208421",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208421-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208421.pdf",
    "citacao": "Ofício nº 064/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Betim-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208422",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208422-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208422.pdf",
    "citacao": "Ofício nº 065/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Igarapé-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208423",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208423-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208423.pdf",
    "citacao": "Ofício nº 066/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Juatuba-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208424",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208424-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208424.pdf",
    "citacao": "Ofício nº 067/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Florestal-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208425",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208425-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208425.pdf",
    "citacao": "Ofício nº 068/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Pará de Minas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208426",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208426-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208426.pdf",
    "citacao": "Ofício nº 069/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Esmeraldas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208427",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208427-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208427.pdf",
    "citacao": "Ofício nº 070/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de São José da Varginha-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208428",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208428-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208428.pdf",
    "citacao": "Ofício nº 071/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Pequi-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208429",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208429-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208429.pdf",
    "citacao": "Ofício nº 072/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Fortuna de Minas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208430",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208430-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208430.pdf",
    "citacao": "Ofício nº 073/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Maravilhas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208431",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208431-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208431.pdf",
    "citacao": "Ofício nº 074/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Papagaios-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208432",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208432-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208432.pdf",
    "citacao": "Ofício nº 075/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Inhaúma-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208433",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208433-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208433.pdf",
    "citacao": "Ofício nº 076/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Paraopeba-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208434",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208434-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208434.pdf",
    "citacao": "Ofício nº 077/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Curvelo-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208435",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208435-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208435.pdf",
    "citacao": "Ofício nº 078/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Pompeu-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208436",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208436-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208436.pdf",
    "citacao": "Ofício nº 079/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Felixlândia-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208437",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208437-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Cachoeira da Prata",
        "geocodigo": "3109600"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208437.pdf",
    "citacao": "Ofício nº 082/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Cachoeira da Prata-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208438",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208438-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208438.pdf",
    "citacao": "Ofício nº 083/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Caetanópolis-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208439",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208439-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Ibirité",
        "geocodigo": "3129806"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208439.pdf",
    "citacao": "Ofício nº 084/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Ibirité-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208440",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208440-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208440.pdf",
    "citacao": "Ofício nº 085/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Três Marias-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447208441",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208441-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208441.pdf",
    "citacao": "Ofício nº 005/2020 do Município de Pompeu, em resposta ao ofício nº 078/2020 do Ministério Público de Minas Gerais, informando não ter sido constatado no município nenhum novo prejuízo ao patrimônio cultural além dos já constatados pelo Laudo Técnico 069/2019. Além disso, considera-se que as medidas reparatórias propostas pelo Estado têm sido suficientes."
  },
  {
    "id": "447268410",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268410-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268410.pdf",
    "citacao": "Certidão do Ministério Público de Minas Gerais de realização de reunião, no dia 05/05/2020, destinada à apresentação dos anteprojetos arquitetônicos para o \"Espaço de memória em homenagem às vítimas do rompimento da Barragem de Córrego do Feijão\", desenvolvidos pelos escritórios convidados pela Vale S/A, sendo eles: Bernardes Arquitetura, Gustavo Penna Arquiteto e Associados, Rizoma Arquitetura e MACh arquitetos."
  },
  {
    "id": "447268411",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268411-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268411.pdf",
    "citacao": "Certidão do Ministério Público de Minas Gerais de realização de reunião, no dia 10/06/2020, na qual tratou-se da expografia e do conteúdo do “Espaço de memória em homenagem às vítimas do rompimento da Barragem de Córrego do Feijão” a ser construído pela Vale S/A em Brumadinho-MG."
  },
  {
    "id": "447268418",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268418-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268418.pdf",
    "citacao": "Ofício nº 061/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Turismo e Cultura de Brumadinho-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268419",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268419-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268419.pdf",
    "citacao": "Ofício nº 062/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de São Joaquim de Bicas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268420",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268420-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268420.pdf",
    "citacao": "Ofício nº 063/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Mário Campos-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268421",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268421-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268421.pdf",
    "citacao": "Ofício nº 064/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Betim-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268422",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268422-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268422.pdf",
    "citacao": "Ofício nº 065/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Igarapé-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268423",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268423-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268423.pdf",
    "citacao": "Ofício nº 066/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Juatuba-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268424",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268424-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268424.pdf",
    "citacao": "Ofício nº 067/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Florestal-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268425",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268425-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268425.pdf",
    "citacao": "Ofício nº 068/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Pará de Minas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268426",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268426-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268426.pdf",
    "citacao": "Ofício nº 069/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Esmeraldas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268427",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268427-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268427.pdf",
    "citacao": "Ofício nº 070/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de São José da Varginha-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268428",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268428-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268428.pdf",
    "citacao": "Ofício nº 071/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Pequi-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268429",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268429-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268429.pdf",
    "citacao": "Ofício nº 072/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Fortuna de Minas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268430",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268430-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268430.pdf",
    "citacao": "Ofício nº 073/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Maravilhas-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268431",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268431-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268431.pdf",
    "citacao": "Ofício nº 074/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Papagaios-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268432",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268432-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268432.pdf",
    "citacao": "Ofício nº 075/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Inhaúma-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268433",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268433-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268433.pdf",
    "citacao": "Ofício nº 076/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Paraopeba-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268434",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268434-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268434.pdf",
    "citacao": "Ofício nº 077/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Curvelo-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268435",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268435-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268435.pdf",
    "citacao": "Ofício nº 078/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Pompéu-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268436",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268436-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268436.pdf",
    "citacao": "Ofício nº 079/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Felixlândia-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268437",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268437-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Cachoeira da Prata",
        "geocodigo": "3109600"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268437.pdf",
    "citacao": "Ofício nº 082/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Cachoeira da Prata-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268438",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268438-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268438.pdf",
    "citacao": "Ofício nº 083/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Caetanópolis-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268439",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268439-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Ibirité",
        "geocodigo": "3129806"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268439.pdf",
    "citacao": "Ofício nº 084/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Ibirité-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268440",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268440-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268440.pdf",
    "citacao": "Ofício nº 085/2020 do Ministério Público de Minas Gerais, enviado via email à Secretaria Municipal de Cultura de Três Marias-MG, solicitando que seja esclarecido: 1. Se foram constatados novos danos ao patrimônio cultural, para além dos já especificados no laudo técnico n° 069/2019; e 2. Se as medidas reparatórias e compensatórias propostas pelo Estado nos Ofícios n° 785/2019 e 554/2019 são suficientes para os danos identificados no município."
  },
  {
    "id": "447268441",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268441-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268441.pdf",
    "citacao": "Ofício nº 005/2020 do Município de Pompéu, em resposta ao ofício nº 078/2020 do Ministério Público de Minas Gerais, informando não ter sido constatado no município nenhum novo prejuízo ao patrimônio cultural além dos já constatados pelo Laudo Técnico 069/2019. Além disso, considera-se que as medidas reparatórias propostas pelo Estado têm sido suficientes."
  },
  {
    "id": "447163425_2",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163425_2-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163425_2.pdf",
    "citacao": "Ofício s/n do Município de Inhaúma, em resposta ao ofício nº 075/2020 do Ministério Público de Minas Gerais (MPMG), identificando a inserção do município na bacia do Paraopeba e no Circuito Turístico das Grutas. Embora sem constatações de prejuízo direto no município, solicita-se sua inclusão nos levantamentos realizados pelo MPMG e demais entidades envolvidas, por se tratar de município circundado por municípios que sofreram danos decorrentes do rompimento da barragem da Vale em Brumadinho."
  },
  {
    "id": "447163425_3",
    "processo": "5010709-36.2019.8.13.0024",
    "titulo": "447163425_3-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447163425_3.pdf",
    "citacao": "Ofício nº 003/2020 do Município de Igarapé, em resposta ao ofício nº 065/2020 do Ministério Público de Minas Gerais esclarecendo que, em relação aos danos ao patrimônio cultural no município, constatou-se a queda das atividades turísticas que fomentam a preservação do patrimônio cultural imaterial e o risco à fruição do Conjunto Natural e Paisagístico da Pedra Grande de Igarapé, bem cultural tombado pela municipalidade. No que se refere às medidas propostas pelo Estado, recomenda-se atenção especial à salvaguarda do Conjunto Natural e Paisagístico da Pedra Grande de Igarapé, de propriedade da mineradora Usiminas."
  },
  {
    "id": "447208441_2",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208441_2-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208441_2.pdf",
    "citacao": "Ofício s/n do Município de Inhaúma, em resposta ao ofício nº 075/2020 do Ministério Público de Minas Gerais (MPMG), identificando a inserção do município na bacia do Paraopeba e no Circuito Turístico das Grutas. Embora sem constatações de prejuízo direto no município, solicita-se sua inclusão nos levantamentos realizados pelo MPMG e demais entidades envolvidas, por se tratar de município circundado por municípios que sofreram danos decorrentes do rompimento da barragem da Vale em Brumadinho."
  },
  {
    "id": "447208441_3",
    "processo": "5087481-40.2019.8.13.0024",
    "titulo": "447208441_3-Documentos comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447208441_3.pdf",
    "citacao": "Ofício nº 003/2020 do Município de Igarapé, em resposta ao ofício nº 065/2020 do Ministério Público de Minas Gerais esclarecendo que, em relação aos danos ao patrimônio cultural no município, constatou-se a queda das atividades turísticas que fomentam a preservação do patrimônio cultural imaterial e o risco à fruição do Conjunto Natural e Paisagístico da Pedra Grande de Igarapé, bem cultural tombado pela municipalidade. No que se refere às medidas propostas pelo Estado, recomenda-se atenção especial à salvaguarda do Conjunto Natural e Paisagístico da Pedra Grande de Igarapé, de propriedade da mineradora Usiminas."
  },
  {
    "id": "447188484_2",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447188484_2-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447188484_2.pdf",
    "citacao": "Matéria veiculada do site vale.com que noticia a assinatura do termo de doação para projetos de turismo nos municípios de Brumadinho, Igarapé, Juatuba, Mário Campos e São Joaquim de Bicas."
  },
  {
    "id": "447228393_2",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447228393_2-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447228393_2.pdf",
    "citacao": "Lista de Presença da Gerência de Fomento Econômico da Vale S/A, relativa ao encontro realizado em 20/12/2019 no Hotel Ville de Montagne."
  },
  {
    "id": "447268441_2",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268441_2-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268441_2.pdf",
    "citacao": "Ofício s/n do Município de Inhaúma, em resposta ao ofício nº 075/2020 do Ministério Público de Minas Gerais (MPMG), identificando a inserção do município na bacia do Paraopeba e no Circuito Turístico das Grutas. Embora sem constatações de prejuízo direto no município, solicita-se sua inclusão nos levantamentos realizados pelo MPMG e demais entidades envolvidas, por se tratar de município circundado por municípios que sofreram danos decorrentes do rompimento da barragem da Vale em Brumadinho."
  },
  {
    "id": "447268441_3",
    "processo": "5026408-67.2019.8.13.0024",
    "titulo": "447268441_3-Documentos Comprobatórios",
    "tipo": "documentos comprobatórios",
    "data": "2020-08-25",
    "municipios": [
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/447268441_3.pdf",
    "citacao": "Ofício nº 003/2020 do Município de Igarapé, em resposta ao ofício nº 065/2020 do Ministério Público de Minas Gerais esclarecendo que, em relação aos danos ao patrimônio cultural no município, constatou-se a queda das atividades turísticas que fomentam a preservação do patrimônio cultural imaterial e o risco à fruição do Conjunto Natural e Paisagístico da Pedra Grande de Igarapé, bem cultural tombado pela municipalidade. No que se refere às medidas propostas pelo Estado, recomenda-se atenção especial à salvaguarda do Conjunto Natural e Paisagístico da Pedra Grande de Igarapé, de propriedade da mineradora Usiminas."
  },
  {
    "id": "af85631d-a1db-459e-b795-4c9e0b0a4a5c",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Balanço da Reparação Setembro 2020",
    "tipo": "extraprocessual",
    "data": "2020-09-30",
    "municipios": [
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Itabirito",
        "geocodigo": "3131901"
      },
      {
        "nome": "Ouro Preto",
        "geocodigo": "3146107"
      },
      {
        "nome": "Barão de Cocais",
        "geocodigo": "3105400"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "Nova Lima",
        "geocodigo": "3144805"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/af85631d-a1db-459e-b795-4c9e0b0a4a5c.pdf",
    "citacao": "Continuidade das ações do Plano de Reparação Integral (PRI) com projetos estruturantes para o desenvolvimento sustentável da região impactada. Ações de cunho socioeconômico através da formulação de propostas de soluções estratégicas voltadas para a transformação e desenvolvimento de Brumadinho. Resultados de estudos de monitoramento do rio Paraopeba, que dá sinais de recuperação, rumo à condição anterior ao rompimento da Barragem 1, na Mina Córrego do Feijão, em Brumadinho (MG), em janeiro de 2019. Atualização do status das obras sociais e de infraestrutura urbana que foram definidas a partir da escuta ativa da voz das comunidades e da parceria com o poder público. Nossos esforços para melhorar as condições de vida dos atingidos e devolver a normalidade às comunidades evacuadas, através de ações respeitosas e canais contínuos de escuta e resposta, contribuindo, ainda, com a sustentabilidade econômica dos territórios."
  },
  {
    "id": "a1f0ad32-8334-434e-92f2-8caba8b55425",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Balanço da Reparação Setembro 2020",
    "tipo": "extraprocessual",
    "data": "2020-11-20",
    "municipios": [
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/a1f0ad32-8334-434e-92f2-8caba8b55425.pdf",
    "citacao": "Apresenta a continuidade das ações do Plano de Reparação Integral (PRI) com projetos estruturantes para o desenvolvimento sustentável da região impactada, bem como, as ações de cunho socioeconômico voltadas para a transformação e desenvolvimento de Brumadinho. Destaca que resultados de estudos de monitoramento do rio Paraopeba, dá sinais de recuperação, rumo à condição anterior ao rompimento da Barragem 1, na Mina Córrego do Feijão, em Brumadinho (MG), em janeiro de 2019. Atualiza o status das obras sociais e de infraestrutura urbana que foram definidas a partir da escuta ativa da voz das comunidades e da parceria com o poder público, bem como esforços para melhorar as condições de vida dos atingidos e devolver a normalidade às comunidades evacuadas, através de ações respeitosas e canais contínuos de escuta e resposta, contribuindo, ainda, com a sustentabilidade econômica dos territórios."
  },
  {
    "id": "1637069830",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "1637069830-Documento de Comprovação",
    "tipo": "documento de comprovação",
    "data": "2020-12-02",
    "municipios": [
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/1637069830.pdf",
    "citacao": "Relatório do acompanhamento das visitas da Vale S/A relacionadas à água na região 5, realizadas nas comunidades de Ribeiro Manso, Lago dos Cisnes e Naútico Tucunaré localizadas no municípios de Felixlândia. Diante das demandas apresentadas, recomenda-se: 1. Instalação de poços artesianos com filtros para a comunidade de Ribeiro Manso; 2. Fornecimento de água mineral para dessedentação humana, higiene pessoal e preparo de alimentos, em todas as comunidades; 3. Água de qualidade em quantidade suficiente para higiene pessoal, lavagem de roupas e demais usos domésticos de todas as comunidades; 4. Água bruta também em qualidade e quantidade suficientes para a produção rural na comunidade de Ribeiro Manso; 5. Instalação de estrutura para o abastecimento de água pela COPASA custeada pela Vale S/A, assim como fornecimento de água mineral para consumo humano, higiene pessoal e preparo de alimentos, solicitado pela comunidade de Lago dos Cisnes; 6. Análise de metais e metalóides nos poços coletivos, Represa Três Marias e seus afluentes, na comunidade Lago dos Cisnes; e 7. Fornecimento de água mineral para as famílias em Náutico Tucunaré e análise da qualidade da água em relação inclusive a metais e metalóides."
  },
  {
    "id": "1637069831",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "1637069831-Documento de Comprovação",
    "tipo": "documento de comprovação",
    "data": "2020-12-02",
    "municipios": [
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/1637069831.pdf",
    "citacao": "Cartas remetidas ao juízo e à Vale S/A pelas comunidades atingidas da região 4, a saber: 1. Angueretá, Condomínio Encontro das Águas e Cachoeira do Choro, localizadas no município de Curvelo; 2. Recanto do Laranjo e Fazenda Retiro do Laranjo, Região do Baú e Fazendinhas Baú, Novilha Brava e Campo Alegre e PA Queima-Fogo, localizadas no município de Pompéu. Apresenta-se compilado de demandas relacionadas ao fornecimento de água para consumo humano e animal, a saber: fornecimento de água potável; instalação de caixas d'água; implementação de poços artesianos; e realização e divulgação de análises técnicas independentes sobre a qualidade da água. Ademais, apresentam-se outras reivindicações, como o cumprimento de medidas sanitárias em razão da COVID-19, a melhoria das vias danificadas em função do aumento do tráfego e a adequação das propagandas realizadas pela empresa."
  },
  {
    "id": "1826989980",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "1826989980-Documento de Comprovação",
    "tipo": "documento de comprovação",
    "data": "2020-12-18",
    "municipios": [
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/1826989980.pdf",
    "citacao": "Plano de Trabalho elaborado pelo Núcleo de Assessoria às Comunidades Atingidas por Barragens (NACAB) como assessoria técnica independente para a reparação integral de danos aos atingidos pelo desastre da Vale S/A. O Plano tem o objetivo de assessorar as pessoas e comunidades dos municípios da Região 3, para que possam participar qualificadamente dos processos de levantamento de evidências, definição e implantação monitorada dos planos, programas e ações necessários à reparação integral das perdas e danos que sofreram em razão do rompimento da barragem B-I e soterramentos das barragens B-IV e B-IV-A da mina do Córrego do Feijão da empresa Vale S/A."
  },
  {
    "id": "7180400b-e2ce-4347-b0bc-bedaabbc352b",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Balanço da Reparação Dezembro 2020",
    "tipo": "extraprocessual",
    "data": "2020-12-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Conselheiro Lafaiete",
        "geocodigo": "3118304"
      },
      {
        "nome": "Barão de Cocais",
        "geocodigo": "3105400"
      },
      {
        "nome": "Itabirito",
        "geocodigo": "3131901"
      },
      {
        "nome": "Ouro Preto",
        "geocodigo": "3146107"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/7180400b-e2ce-4347-b0bc-bedaabbc352b.pdf",
    "citacao": "Ações voltadas para gerar mais qualidade de vida e emprego para os moradores de Brumadinho, através de projetos sociais que transformam a realidade local e geram mais dinamismo para a economia. Programas de assistência aos atingidos e depoimentos de pessoas das comunidades que participam dos diversos projetos que estão em andamento em parceria com institutos e municípios. Ações voltadas para a restauração florestal, proteção de animais silvestres, peixes e espécies vegetais, além do constante monitoramento da qualidade da água e estudos de avaliação de risco à saúde humana. Atualização do status das obras sociais e de infraestrutura urbana que foram definidas a partir da escuta ativa da voz das comunidades e da parceria com o poder público. Atualização das ações voltadas para devolver a normalidade às comunidades evacuadas em Barão de Cocais, Conselheiro Lafaiete, Itabirito, Macacos e Ouro Preto, contribuindo, ainda, com a sustentabilidade econômica dos territórios."
  },
  {
    "id": "433a71d5-01de-47d2-bec3-b7406638fcd2",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Balanço da Reparação Dezembro 2020",
    "tipo": "extraprocessual",
    "data": "2020-12-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/433a71d5-01de-47d2-bec3-b7406638fcd2.pdf",
    "citacao": "Este documento apresenta o andamento das ações de reparação desenvolvidas pela Vale de outubro até dezembro de 2020. São ações voltadas para gerar mais qualidade de vida e emprego para os moradores de Brumadinho, através de projetos sociais que transformam a realidade local e geram mais dinamismo para a economia, assim como, ações do Programa de assistência aos atingidos com depoimentos de pessoas das comunidades que participam dos diversos projetos que estão em andamento em parceria com institutos e municípios. Descreve ainda ações voltadas para a restauração florestal, proteção de animais silvestres, peixes e espécies vegetais, além do constante monitoramento da qualidade da água e estudos de avaliação de risco à saúde humana. Por fim, traz a atualização do status das obras sociais e de infraestrutura urbana que foram definidas a partir da escuta ativa da voz das comunidades e da parceria com o poder público."
  },
  {
    "id": "2288636428",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "2288636428-Documento de Comprovação",
    "tipo": "documento de comprovação",
    "data": "2021-02-10",
    "municipios": [
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      }
    ],
    "temas": [
      "trâmites processuais"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/2288636428.pdf",
    "citacao": "Relatórios Técnicos da equipe de Supervisão Agropecuária da Diretoria de Reparação e Desenvolvimento da Bacia do Rio Paraopeba da Vale S/A no qual analisa-se a elegibilidade das propriedades rurais para atendimentos de fornecimento de água para consumo humano ou in natura."
  },
  {
    "id": "92f9b2b4-7db0-4898-ac74-7e67d89bdf6c",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Balanço da Reparação Resumo Trimestral Abril 2021",
    "tipo": "extraprocessual",
    "data": "2021-04-30",
    "municipios": [
      {
        "nome": "Barão de Cocais",
        "geocodigo": "3105400"
      },
      {
        "nome": "Conselheiro Lafaiete",
        "geocodigo": "3118304"
      },
      {
        "nome": "Itabirito",
        "geocodigo": "3131901"
      },
      {
        "nome": "Nova Lima",
        "geocodigo": "3144805"
      },
      {
        "nome": "Ouro Preto",
        "geocodigo": "3146107"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Tabuleiro",
        "geocodigo": "3167905"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/92f9b2b4-7db0-4898-ac74-7e67d89bdf6c.pdf",
    "citacao": "O Resumo Trimestral do Balanço da Reparação reúne, de maneira objetiva, as principais ações realizadas pela Diretoria Especial de Reparação e Desenvolvimento da Vale em Brumadinho, municípios da calha do rio Paraopeba e territórios evacuados após a mudança nos padrões de segurança das nossas barragens. Nesta edição, destacamos as principais entregas e projetos lançados no primeiro trimestre de 2021 em cada uma das áreas da Reparação."
  },
  {
    "id": "714a7082-1d68-47f6-aaf4-01c46665de29",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Balanço da Reparação Resumo Trimestral Abril 2021",
    "tipo": "extraprocessual",
    "data": "2021-04-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/714a7082-1d68-47f6-aaf4-01c46665de29.pdf",
    "citacao": "Este Balanço apresenta o resumo trimestral das medidas de reparação do meio ambiente e das pessoas desenvolvidas entre janeiro e março de 2021 .  Desde ações voltadas para gerar mais qualidade de vida e emprego para os moradores de Brumadinho, através de projetos sociais que transformam a realidade local e geram mais dinamismo para a economia, passando pelos Programas de assistência aos atingidos, com depoimentos de pessoas das comunidades que participam dos diversos projetos que estão em andamento em parceria com institutos e municípios, até ações voltadas para a restauração florestal, proteção de animais silvestres, peixes e espécies vegetais, além do constante monitoramento da qualidade da água e estudos de avaliação de risco à saúde humana. É apresentado ainda a atualização do status das obras sociais e de infraestrutura urbana que foram definidas a partir da escuta ativa da voz das comunidades e da parceria com o poder público."
  },
  {
    "id": "dbe1dfd6-1df8-4e08-a1a2-e45470d43b26",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Balanço da Reparação Junho 2021",
    "tipo": "extraprocessual",
    "data": "2021-06-30",
    "municipios": [
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Barão de Cocais",
        "geocodigo": "3105400"
      },
      {
        "nome": "Conselheiro Lafaiete",
        "geocodigo": "3118304"
      },
      {
        "nome": "Itabirito",
        "geocodigo": "3131901"
      },
      {
        "nome": "Nova Lima",
        "geocodigo": "3144805"
      },
      {
        "nome": "Ouro Preto",
        "geocodigo": "3146107"
      },
      {
        "nome": "Tabuleiro",
        "geocodigo": "3167905"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Santa Bárbara",
        "geocodigo": "3157203"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/dbe1dfd6-1df8-4e08-a1a2-e45470d43b26.pdf",
    "citacao": "Evolução de projetos que potencializam as vocações locais e promovem o desenvolvimento dos municípios. Programas de assistência aos atingidos e de desenvolvimento social das comunidades e evolução dos acordos cíveis e trabalhistas. Ações voltadas para a recuperação integral do meio ambiente – proteção da fauna, revegetação, cuidado coma biodiversidade. Andamento de obras em Brumadinho e região e entregas de equipamentos de infraestrutura urbana construídos ou revitalizados pela Vale, com foco na melhoria da qualidade de vida das comunidades. Atualização das ações voltadas para amparar e viabilizar o retorno à normalidade pelas comunidades evacuadas em Barão de Cocais, Conselheiro Lafaiete, Itabirito, Macacos (Nova Lima) e Antônio Pereira (Ouro Preto). Além de projetos de compensação com foco na sustentabilidade econômica dos municípios."
  },
  {
    "id": "4f6d39b1-80fd-4279-9269-80a3d1bcb7d7",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Balanço da Reparação Junho 2021",
    "tipo": "extraprocessual",
    "data": "2021-06-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Morada Nova de Minas",
        "geocodigo": "3143500"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/4f6d39b1-80fd-4279-9269-80a3d1bcb7d7.pdf",
    "citacao": "Neste Balanço do primeiro semestre de 2021 é apresentado a evolução de projetos que potencializam as vocações locais e promovem o desenvolvimento dos municípios; os Programas de assistência aos atingidos e de desenvolvimento social das comunidades e evolução dos acordos cíveis e trabalhistas; as ações voltadas para a recuperação integral do meio ambiente; o andamento de obras em Brumadinho e região e entregas de equipamentos de infraestrutura urbana construídos ou revitalizados pela Vale, além de projetos de compensação com foco na sustentabilidade econômica dos municípios."
  },
  {
    "id": "89b1da8d-d323-49eb-b046-1ec2be60a196",
    "processo": "5095958-18.2020.8.13.0024",
    "titulo": "DIRETRIZES GERAIS DE RECUPERAÇÃO SUSTENTÁVEL PARA A BACIA DO RIBEIRÃO FERRO-CARVÃO - PARTE 1 - ANÁLISE MULTICRITÉRIO",
    "tipo": "extraprocessual",
    "data": "2021-10-01",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/89b1da8d-d323-49eb-b046-1ec2be60a196.pdf",
    "citacao": "Apresenta a primeira parte do relatório de Diretrizes Gerais de Recuperação Sustentável para a Bacia do Ribeirão Ferro-Carvão (versão preliminar), que se refere a metodologia de análise multicritérios (MCA), proposta pela Vale para a recuperação sustentável dos compartimentos do Ribeirão Ferro-Carvão impactados pelo rompimento da B-I na área da mancha de rejeitos. São apresentados também as premissas que norteiam o processo de recuperação sustentável da área impactada pelo rompimento da barragem, especificamente nos compartimentos que contemplam a calha fluvial do ribeirão Ferro-Carvão, incluindo nestas o Plano Plurianual de Manejo de Rejeitos que apresenta a sequência de limpeza das áreas e consequentemente de possibilidade de recuperação. Também são definidos alguns dos possíveis critérios sociais, ambientais e técnicos que irão embasar a análise para a tomada de decisão em relação às alternativas de solução de recuperação ambiental."
  },
  {
    "id": "084415d2-ace4-4f8b-a0e1-e41252d10dcb",
    "processo": "5095960-85.2020.8.13.0024",
    "titulo": "DIRETRIZES GERAIS DE RECUPERAÇÃO SUSTENTÁVEL PARA A BACIA DO RIBEIRÃO FERRO-CARVÃO - PARTE 1 - ANÁLISE MULTICRITÉRIO",
    "tipo": "extraprocessual",
    "data": "2021-10-01",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/084415d2-ace4-4f8b-a0e1-e41252d10dcb.pdf",
    "citacao": "Apresenta a primeira parte do relatório de Diretrizes Gerais de Recuperação Sustentável para a Bacia do Ribeirão Ferro-Carvão, que se refere a metodologia de análise multicritérios (MCA), proposta pela Vale para a recuperação sustentável dos compartimentos do Ribeirão Ferro-Carvão impactados pelo rompimento da B-I na área da mancha de rejeitos. São apresentados também as premissas que norteiam o processo de recuperação sustentável da área impactada pelo rompimento da barragem, especificamente nos compartimentos que contemplam a calha fluvial do ribeirão Ferro-Carvão, incluindo nestas o Plano Plurianual de Manejo de Rejeitos que apresenta a sequência de limpeza das áreas e consequentemente de possibilidade de recuperação. Também são definidos alguns dos possíveis critérios sociais, ambientais e técnicos que irão embasar a análise para a tomada de decisão em relação às alternativas de solução de recuperação ambiental."
  },
  {
    "id": "057836d2-7884-4d42-880d-20a4d614d8c3",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Balanço da Reparação Dezembro 2021",
    "tipo": "extraprocessual",
    "data": "2021-12-10",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Morada Nova de Minas",
        "geocodigo": "3143500"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico",
      "infraestrutura",
      "saúde da população"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/057836d2-7884-4d42-880d-20a4d614d8c3.pdf",
    "citacao": "Neste Balanço da Reparação referente ao segundo semestre de 2021 são apresentadas as ações de reparação e desenvolvimento executadas pela Vale nas áreas impactadas pelo rompimento da Barragem B1. Nessa edição, dá-se ênfase aos projetos de capacitação, apoio ao empreendedorismo e fomento ao turismo local que possibilitam o fortalecimento de cadeias produtivas existentes e contribuem para aumentar a renda familiar da população e diversificar a economia, bem como ações que tem como objetivo ir além da  reparação financeira, através de projetos estruturantes em saúde, educação, cidadania e  ações que possam auxiliar as famílias em seus  processos de ressignificação de suas vidas. Também são apresentadas ações de reparação ambiental que seguem  avançando com o uso de técnicas inovadoras e sustentáveis, para o reflorestamento de Brumadinho e para o bem-estar dos animais  silvestres na região. São também apresentadas, as obras sociais e de infraestrutura urbana, que são parte do processo de compensação dos impactos. Tais obras são definidas a partir da escuta ativa das comunidades e da parceria com o poder  público, com foco na melhoria da qualidade de vida e do bem-estar coletivo."
  },
  {
    "id": "797aeb25-1b0a-4e2f-9212-29b273fa40fd",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Balanço da Reparação Dezembro 2021",
    "tipo": "extraprocessual",
    "data": "2021-12-10",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Inhaúma",
        "geocodigo": "3131000"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Morada Nova de Minas",
        "geocodigo": "3143500"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/797aeb25-1b0a-4e2f-9212-29b273fa40fd.pdf",
    "citacao": "Neste Balanço da Reparação referente ao segundo semestre de 2021 são apresentadas as ações de reparação e desenvolvimento executadas pela Vale nas áreas impactadas pelo rompimento da Barragem B1. Nessa edição, dá-se ênfase aos projetos de capacitação, apoio ao empreendedorismo e fomento ao turismo local que possibilitam o fortalecimento de cadeias produtivas existentes e contribuem para aumentar a renda familiar da população e diversificar a economia, bem como ações que tem como objetivo ir além da reparação financeira, através de projetos estruturantes em saúde, educação, cidadania e ações que possam auxiliar as famílias em seus processos de ressignificação de suas vidas. Também são apresentadas ações de reparação ambiental que seguem avançando com o uso de técnicas inovadoras e sustentáveis, para o reflorestamento de Brumadinho e para o bem-estar dos animais silvestres na região. São também apresentadas, as obras sociais e de infraestrutura urbana, que são parte do processo de compensação dos impactos. Tais obras são definidas a partir da escuta ativa das comunidades e da parceria com o poder público, com foco na melhoria da qualidade de vida e do bem-estar coletivo."
  },
  {
    "id": "884e0f78-dce2-444f-968a-7f38b57bf66d",
    "processo": "5095958-18.2020.8.13.0024",
    "titulo": "PLANO INTEGRADO DE ABASTECIMENTO DE ÁGUA NA BACIA DO RIO PARAOPEBA",
    "tipo": "extraprocessual",
    "data": "2022-02-01",
    "municipios": [
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/884e0f78-dce2-444f-968a-7f38b57bf66d.pdf",
    "citacao": "Este documento apresenta a versão 23 (Fevereiro de 2022) do Plano Integrado de Abastecimento de Água na Bacia do Rio Paraopeba, contendo as diretrizes adotadas em cada uma das frentes de atuação e a descrição das ações corretivas emergenciais e preventivas em execução pela Vale de fornecimento de água às propriedades rurais, residências e municípios, cujos abastecimentos foram afetados pelo rompimento da Barragem B1, em especial pela proibição de captação de água no rio Paraopeba."
  },
  {
    "id": "41c22217-5292-4336-9c76-007ded46f8d9",
    "processo": "5095960-85.2020.8.13.0024",
    "titulo": "PLANO INTEGRADO DE ABASTECIMENTO DE ÁGUA NA BACIA DO RIO PARAOPEBA",
    "tipo": "extraprocessual",
    "data": "2022-02-01",
    "municipios": [
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      }
    ],
    "temas": [
      "infraestrutura",
      "saúde da população",
      "socioeconômico",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/41c22217-5292-4336-9c76-007ded46f8d9.pdf",
    "citacao": "Este documento apresenta a versão 23 (Fevereiro de 2022) do Plano Integrado de Abastecimento de Água na Bacia do Rio Paraopeba, contendo as diretrizes adotadas em cada uma das frentes de atuação e a descrição das ações corretivas emergenciais e preventivas em execução pela Vale de fornecimento de água às propriedades rurais, residências e municípios, cujos abastecimentos foram afetados pelo rompimento da Barragem B1, em especial pela proibição de captação de água no rio Paraopeba."
  },
  {
    "id": "51602a8c-50b7-4e2b-8a6b-ec6f208d21f2",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "INFORMAÇÕES SOBRE PAGAMENTO EMERGENCIAL - VALE",
    "tipo": "extraprocessual",
    "data": "2022-02-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Bonfim",
        "geocodigo": "3108107"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Moeda",
        "geocodigo": "3142304"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Rio Manso",
        "geocodigo": "3155306"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/51602a8c-50b7-4e2b-8a6b-ec6f208d21f2.pdf",
    "citacao": "Apresenta a síntese dos dados referentes aos Pagamentos Emergenciais efetuados pela Vale S.A, por município, em razão do rompimento da Barragem B1 - Mina Córrego do Feijão, Brumadinho-MG, dentre as medidas emergenciais decorrentes do rompimento adotadas pela Companhia, para conhecimento e consideração do Perito – Comitê Técnico Científico da Universidade Federal de Minas Gerais, no âmbito do processo cível nº 5071521-44.2019.8.13.0024. \nO pagamento emergencial foi efetuado pela Vale conforme critérios de elegibilidade estabelecidos judicialmente , entre abril de 2019 até outubro de 2021, quando ocorreu a transferência para o Programa de Transferência de Renda, conforme previsto nos termos do Acordo de Reparação Integral, firmado em fevereiro de 2021, entre o Governo de Minas Gerais, Instituições de Justiça e a Vale."
  },
  {
    "id": "9a2ef0de-87a1-43b2-b473-0a7526671c48",
    "processo": "5095958-18.2020.8.13.0024",
    "titulo": "INFORMAÇÕES SOBRE PAGAMENTO EMERGENCIAL - VALE",
    "tipo": "extraprocessual",
    "data": "2022-02-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Bonfim",
        "geocodigo": "3108107"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Moeda",
        "geocodigo": "3142304"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Rio Manso",
        "geocodigo": "3155306"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/9a2ef0de-87a1-43b2-b473-0a7526671c48.pdf",
    "citacao": "Apresenta a síntese dos dados referentes aos Pagamentos Emergenciais efetuados pela Vale S.A, por município, em razão do rompimento da Barragem B1 - Mina Córrego do Feijão, Brumadinho-MG, dentre as medidas emergenciais decorrentes do rompimento adotadas pela Companhia, para conhecimento e consideração do Perito – Comitê Técnico Científico da Universidade Federal de Minas Gerais, no âmbito do processo cível nº 5071521-44.2019.8.13.0024.\nO pagamento emergencial foi efetuado pela Vale conforme critérios de elegibilidade estabelecidos judicialmente , entre abril de 2019 até outubro de 2021, quando ocorreu a transferência para o Programa de Transferência de Renda, conforme previsto nos termos do Acordo de Reparação Integral, firmado em fevereiro de 2021, entre o Governo de Minas Gerais, Instituições de Justiça e a Vale."
  },
  {
    "id": "2f3fa029-d41f-4510-b3cf-0ef9301a40f0",
    "processo": "5095958-18.2020.8.13.0024",
    "titulo": "INFORMAÇÕES SOBRE MEDIDAS EMERGENCIAIS DE FORNECIMENTO DE ÁGUA E DE FORNECIMENTO DE ALIMENTAÇÃO ANIMAL - VALE",
    "tipo": "extraprocessual",
    "data": "2022-03-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/2f3fa029-d41f-4510-b3cf-0ef9301a40f0.pdf",
    "citacao": "Este documento apresenta informações e dados consolidados referentes as ações de fornecimento e garantia de acesso à água potável e de fornecimento de alimentação animal efetuadas pela Vale S.A, em razão do rompimento da Barragem B1 - Mina Córrego do Feijão, em Brumadinho-MG, dentre as medidas emergenciais decorrentes do rompimento adotadas pela Companhia, para conhecimento e consideração do Perito – Comitê Técnico Científico da Universidade Federal de Minas Gerais, no âmbito do processo cível nº 5071521-44.2019.8.13.0024.\nPor fim, são apresentados anexos, o “Plano de Assistência Agropecuária Emergencial da Bacia do Paraopeba” e o “Plano de Monitoramento e Controle de Qualidade Alimentação Animal\", ambos documentos elaborados pela Vale, e norteadores das ações de assistência agropecuária executadas pela Vale, visando o reestabelecimento da produção agrícola e pecuária nas propriedades afetadas pelo rompimento."
  },
  {
    "id": "baf2197e-701e-47e8-a478-08650c58dd5b",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "INFORMAÇÕES SOBRE MEDIDAS EMERGENCIAIS DE FORNECIMENTO DE ÁGUA E DE FORNECIMENTO DE ALIMENTAÇÃO ANIMAL - VALE",
    "tipo": "extraprocessual",
    "data": "2022-03-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      }
    ],
    "temas": [
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/baf2197e-701e-47e8-a478-08650c58dd5b.pdf",
    "citacao": "Este documento apresenta informações e dados consolidados referentes as ações de fornecimento e garantia de acesso à água potável e de fornecimento de alimentação animal efetuadas pela Vale S.A, em razão do rompimento da Barragem B1 - Mina Córrego do Feijão, em Brumadinho-MG, dentre as medidas emergenciais decorrentes do rompimento adotadas pela Companhia, para conhecimento e consideração do Perito – Comitê Técnico Científico da Universidade Federal de Minas Gerais, no âmbito do processo cível nº 5071521-44.2019.8.13.0024. Por fim, são apresentados anexos, o “Plano de Assistência Agropecuária Emergencial da Bacia do Paraopeba” e o “Plano de Monitoramento e Controle de Qualidade Alimentação Animal\", ambos documentos elaborados pela Vale, e norteadores das ações de assistência agropecuária executadas pela Vale, visando o reestabelecimento da produção agrícola e pecuária nas propriedades afetadas pelo rompimento."
  },
  {
    "id": "64500b1a-886e-4387-ab38-58828d4c3d0a",
    "processo": "5095960-85.2020.8.13.0024",
    "titulo": "Relatório Anual do Plano de Controle Ambiental das Obras Emergenciais - Programas Ambientais do Meio Socioeconômico",
    "tipo": "extraprocessual",
    "data": "2022-03-29",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/64500b1a-886e-4387-ab38-58828d4c3d0a.pdf",
    "citacao": "O presente relatório anual tem por objetivo atualizar o status de efetivação das atividades vinculadas aos programas ambientais do meio socioeconômico, estabelecidos no Plano de Controle Ambiental (PCA) das Obras Emergenciais para o período de 1º de janeiro de 2021 a 31 de dezembro de 2021. O Plano de Controle Ambiental (PCA) integra, juntamente com o Estudo de Impacto Ambiental (EIA), o processo de licenciamento ambiental corretivo das obras emergenciais decorrentes do rompimento das barragens B1, B4 e B-4A da mina Córrego do Feijão, ocorrido em 25 de janeiro de 2019. Os programas que integram o presente relatório são: Plano de Comunicação e Relacionamento com a Comunidade, Programa de Conscientização Ambiental do Trabalhador  e Programa de Sinalização e Controle de Tráfego.\nO relatório consiste na apresentação das metodologias utilizadas para as ações propostas e na demonstração dos resultados das atividades realizadas. No item de considerações finais é apresentada a avaliação sobre o cumprimento dos objetivos e metas estabelecidos.\t\nEsses programas são executados pela Vale, e a Arcadis Brasil foi contratada para assessorar e consolidar os relatórios de atividades previstas no Plano de Controle Ambiental (PCA)."
  },
  {
    "id": "9d739823-2f2c-4af8-89c4-87aa17c1051b",
    "processo": "5095958-18.2020.8.13.0024",
    "titulo": "Relatório Anual do Plano de Controle Ambiental das Obras Emergenciais - Programas Ambientais do Meio Socioeconômico",
    "tipo": "extraprocessual",
    "data": "2022-03-29",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      }
    ],
    "temas": [
      "infraestrutura",
      "socioeconômico",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/9d739823-2f2c-4af8-89c4-87aa17c1051b.pdf",
    "citacao": "O presente relatório anual tem por objetivo atualizar o status de efetivação das atividades vinculadas aos programas ambientais do meio socioeconômico, estabelecidos no Plano de Controle Ambiental (PCA) das Obras Emergenciais para o período de 1º de janeiro de 2021 a 31 de dezembro de 2021. O Plano de Controle Ambiental (PCA) integra, juntamente com o Estudo de Impacto Ambiental (EIA), o processo de licenciamento ambiental corretivo das obras emergenciais decorrentes do rompimento das barragens B1, B4 e B-4A da mina Córrego do Feijão, ocorrido em 25 de janeiro de 2019. Os programas que integram o presente relatório são: Plano de Comunicação e Relacionamento com a Comunidade, Programa de Conscientização Ambiental do Trabalhador  e Programa de Sinalização e Controle de Tráfego.\nO relatório consiste na apresentação das metodologias utilizadas para as ações propostas e na demonstração dos resultados das atividades realizadas. No item de considerações finais é apresentada a avaliação sobre o cumprimento dos objetivos e metas estabelecidos.\t\nEsses programas são executados pela Vale, e a Arcadis Brasil foi contratada para assessorar e consolidar os relatórios de atividades previstas no Plano de Controle Ambiental (PCA)."
  },
  {
    "id": "4a60b57e-69f6-4464-a875-cf82160f9105",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Relatório Anual do Plano de Controle Ambiental das Obras Emergenciais - Programas Ambientais do Meio Socioeconômico",
    "tipo": "extraprocessual",
    "data": "2022-03-29",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/4a60b57e-69f6-4464-a875-cf82160f9105.pdf",
    "citacao": "O presente relatório anual tem por objetivo atualizar o status de efetivação das atividades vinculadas aos programas ambientais do meio socioeconômico, estabelecidos no Plano de Controle Ambiental (PCA) das Obras Emergenciais para o período de 1º de janeiro de 2021 a 31 de dezembro de 2021. O Plano de Controle Ambiental (PCA) integra, juntamente com o Estudo de Impacto Ambiental (EIA), o processo de licenciamento ambiental corretivo das obras emergenciais decorrentes do rompimento das barragens B1, B4 e B-4A da mina Córrego do Feijão, ocorrido em 25 de janeiro de 2019. Os programas que integram o presente relatório são: Plano de Comunicação e Relacionamento com a Comunidade, Programa de Conscientização Ambiental do Trabalhador  e Programa de Sinalização e Controle de Tráfego.\nO relatório consiste na apresentação das metodologias utilizadas para as ações propostas e na demonstração dos resultados das atividades realizadas. No item de considerações finais é apresentada a avaliação sobre o cumprimento dos objetivos e metas estabelecidos.\t\nEsses programas são executados pela Vale, e a Arcadis Brasil foi contratada para assessorar e consolidar os relatórios de atividades previstas no Plano de Controle Ambiental (PCA)."
  },
  {
    "id": "2d2fafdf-514d-437a-b786-510c07b8c7d9",
    "processo": "5095960-85.2020.8.13.0024",
    "titulo": "Relatório Anual do Plano de Controle Ambiental das Obras Emergenciais . Relatório Ambiental Simplificado - Disposição de Rejeito em Cava  - Programas Ambientais do Meio Físico.",
    "tipo": "extraprocessual",
    "data": "2022-03-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Cantagalo",
        "geocodigo": "3112059"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/2d2fafdf-514d-437a-b786-510c07b8c7d9.pdf",
    "citacao": "O presente relatório tem por objetivo atualizar o status de efetivação das atividades vinculadas aos Programas Ambientais do Meio Físico estabelecidos no Plano de Controle Ambiental (PCA) das Obras Emergenciais para o período de 01/01/2021 a 31/10/2021. O referido Plano de Controle Ambiental (PCA), elaborado em maio de 2019, integra, juntamente com o Estudo de Impacto Ambiental (EIA), o processo de licenciamento ambiental corretivo das obras emergenciais decorrentes da ruptura da Barragem B-I da Mina Córrego do Feijão, ocorrida em 25/01/2019. O Relatório Anual Simplificado (RAS), integra o processo de Licenciamento Ambiental Simplificado (LAS) da atividade de disposição de rejeito em cava.\nRegistra-se que, no âmbito do PCA e do LAS/RAS, existem diversas empresas atuando de forma integrada, com responsabilidades específicas. Dessa forma, o presente relatório constitui-se como um documento integrador de resultados fornecidos dos trabalhos executados por diversas empresas no que corresponde ao Meio Físico.\nO detalhamento das metodologias, resultados e discussões pormenorizadas constam nos relatórios temáticos disponibilizados nos anexos do presente documento, de modo que os Capítulos que se sucedem representam uma síntese técnica dos principais resultados."
  },
  {
    "id": "c1996fb3-5939-48df-9a8d-5cdcd042d5ff",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Relatório Anual do Plano de Controle Ambiental das Obras Emergenciais . Relatório Ambiental Simplificado - Disposição de Rejeito em Cava  - Programas Ambientais do Meio Físico.",
    "tipo": "extraprocessual",
    "data": "2022-03-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Cantagalo",
        "geocodigo": "3112059"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/c1996fb3-5939-48df-9a8d-5cdcd042d5ff.pdf",
    "citacao": "O presente relatório tem por objetivo atualizar o status de efetivação das atividades vinculadas aos Programas Ambientais do Meio Físico estabelecidos no Plano de Controle Ambiental (PCA) das Obras Emergenciais para o período de 01/01/2021 a 31/10/2021. O referido Plano de Controle Ambiental (PCA), elaborado em maio de 2019, integra, juntamente com o Estudo de Impacto Ambiental (EIA), o processo de licenciamento ambiental corretivo das obras emergenciais decorrentes da ruptura da Barragem B-I da Mina Córrego do Feijão, ocorrida em 25/01/2019. O Relatório Anual Simplificado (RAS), integra o processo de Licenciamento Ambiental Simplificado (LAS) da atividade de disposição de rejeito em cava.\nRegistra-se que, no âmbito do PCA e do LAS/RAS, existem diversas empresas atuando de forma integrada, com responsabilidades específicas. Dessa forma, o presente relatório constitui-se como um documento integrador de resultados fornecidos dos trabalhos executados por diversas empresas no que corresponde ao Meio Físico.\nO detalhamento das metodologias, resultados e discussões pormenorizadas constam nos relatórios temáticos disponibilizados nos anexos do presente documento, de modo que os Capítulos que se sucedem representam uma síntese técnica dos principais resultados."
  },
  {
    "id": "2fcb4224-841e-41b7-a834-51a8181269be",
    "processo": "5095960-85.2020.8.13.0024",
    "titulo": "Relatório Anual do Plano de Controle Ambiental das Obras Emergenciais - Programas Ambientais do Meio Biótico",
    "tipo": "extraprocessual",
    "data": "2022-03-31",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/2fcb4224-841e-41b7-a834-51a8181269be.pdf",
    "citacao": "O presente relatório trata-se de um reporte consolidado acerca das atividades realizadas no âmbito dos Programas Ambientais do Meio Biótico estabelecidos no PCA Obras Emergenciais,que integra processo de licenciamento ambiental corretivo das obras emergenciais decorrentes da ruptura das Barragens B1, B4 e B4-A do Complexo Paraopeba II da Mina de Córrego do Feijão.. Nesse relatório, em específico, foram consolidadas as principais informações e resultados obtidos entre janeiro e dezembro de 2021, em conformidade com as diretrizes estabelecidas no Plano de Controle Ambiental (PCA) no que se refere aos dados do Meio Biótico.\t\t\t\t\t\nEssencial sublinhar que dentro dos referidos programas deste relatório há diversas frentes e empresas atuando de forma integrada, com responsabilidades específicas. Dessa forma, o presente relatório e os futuros constituir-se-ão de documentos integradores de resultados fornecidos por esta rede integrada e respectivas ações.\t\t\t\t\t\nCom os resultados obtidos dos monitoramentos podem ser estabelecidas novas estratégias mais assertivas, assim como conclusões integradas dos resultados com o que foi proposto nos programas."
  },
  {
    "id": "0c7b5c97-9492-433c-87b4-542800144dd6",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Relatório Anual do Plano de Controle Ambiental das Obras Emergenciais - Programas Ambientais do Meio Biótico",
    "tipo": "extraprocessual",
    "data": "2022-03-31",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "meio ambiente",
      "infraestrutura"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/0c7b5c97-9492-433c-87b4-542800144dd6.pdf",
    "citacao": "O presente relatório trata-se de um reporte consolidado acerca das atividades realizadas no âmbito dos Programas Ambientais do Meio Biótico estabelecidos no PCA Obras Emergenciais,que integra processo de licenciamento ambiental corretivo das obras emergenciais decorrentes da ruptura das Barragens B1, B4 e B4-A do Complexo Paraopeba II da Mina de Córrego do Feijão.. Nesse relatório, em específico, foram consolidadas as principais informações e resultados obtidos entre janeiro e dezembro de 2021, em conformidade com as diretrizes estabelecidas no Plano de Controle Ambiental (PCA) no que se refere aos dados do Meio Biótico.\t\t\t\t\t\nEssencial sublinhar que dentro dos referidos programas deste relatório há diversas frentes e empresas atuando de forma integrada, com responsabilidades específicas. Dessa forma, o presente relatório e os futuros constituir-se-ão de documentos integradores de resultados fornecidos por esta rede integrada e respectivas ações.\t\t\t\t\t\nCom os resultados obtidos dos monitoramentos podem ser estabelecidas novas estratégias mais assertivas, assim como conclusões integradas dos resultados com o que foi proposto nos programas."
  },
  {
    "id": "ecbea76d-8c7b-459b-a3d9-e2a554145b8e",
    "processo": "5095958-18.2020.8.13.0024",
    "titulo": "Relatório Anual do Plano de Controle Ambiental das Obras Emergenciais - Programas Ambientais do Meio Biótico",
    "tipo": "extraprocessual",
    "data": "2022-03-31",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Belo Horizonte",
        "geocodigo": "3106200"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/ecbea76d-8c7b-459b-a3d9-e2a554145b8e.pdf",
    "citacao": "O presente relatório trata-se de um reporte consolidado acerca das atividades realizadas no âmbito dos Programas Ambientais do Meio Biótico estabelecidos no PCA Obras Emergenciais,que integra processo de licenciamento ambiental corretivo das obras emergenciais decorrentes da ruptura das Barragens B1, B4 e B4-A do Complexo Paraopeba II da Mina de Córrego do Feijão.. Nesse relatório, em específico, foram consolidadas as principais informações e resultados obtidos entre janeiro e dezembro de 2021, em conformidade com as diretrizes estabelecidas no Plano de Controle Ambiental (PCA) no que se refere aos dados do Meio Biótico.\t\t\t\t\t\nEssencial sublinhar que dentro dos referidos programas deste relatório há diversas frentes e empresas atuando de forma integrada, com responsabilidades específicas. Dessa forma, o presente relatório e os futuros constituir-se-ão de documentos integradores de resultados fornecidos por esta rede integrada e respectivas ações.\t\t\t\t\t\nCom os resultados obtidos dos monitoramentos podem ser estabelecidas novas estratégias mais assertivas, assim como conclusões integradas dos resultados com o que foi proposto nos programas."
  },
  {
    "id": "fde9d8d8-f85d-4cb8-946c-2fab92450047",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Balanço da Reparação Junho 2022",
    "tipo": "extraprocessual",
    "data": "2022-07-08",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Mateus Leme",
        "geocodigo": "3140704"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Abaeté",
        "geocodigo": "3100203"
      },
      {
        "nome": "São Gonçalo do Abaeté",
        "geocodigo": "3161700"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Biquinhas",
        "geocodigo": "3107000"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Paineiras",
        "geocodigo": "3146404"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/fde9d8d8-f85d-4cb8-946c-2fab92450047.pdf",
    "citacao": "Neste Balanço da Reparação referente ao primeiro semestre de 2022 são apresentadas as ações de reparação executadas pela Vale nas áreas impactadas pelo rompimento da Barragem B1. Nessa edição, dá-se ênfase as obrigações e os compromissos definidos no Acordo de Reparação Integral, por meio dos projetos integrantes dos Programas de Reparação Socioeconômica, Programa de Reparação Socioambiental, e Programa de Mobilidade e Programa de Fortalecimento do Serviço. \nSão apresentados ainda, os resultados de ações executadas pela Vale em razão do rompimento, tais  como de monitoramento de qualidade da água e sedimentos da Bacia do Rio Paraopeba,  soluções definitivas e emergenciais adotadas para garantia de abastecimento de água a população,  entregas emergenciais em propriedades rurais, indenizações extrajudiciais firmadas, apoio psicossocial, execução do Programa Ciclo Saúde e de obras sociais e de infraestrutura nos municípios. Por fim, são apresentadas ações voltadas ao desenvolvimento econômico dos municípios, por meio de capacitação profissional, apoio ao empreendedorismo local, fortalecimento do turismo, entre outras ações."
  },
  {
    "id": "4e06a555-4059-4fd5-a7b0-983aa593a1e0",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Balanço da Reparação Junho 2022",
    "tipo": "extraprocessual",
    "data": "2022-07-08",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Papagaios",
        "geocodigo": "3146909"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Mateus Leme",
        "geocodigo": "3140704"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      },
      {
        "nome": "Sarzedo",
        "geocodigo": "3165537"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Abaeté",
        "geocodigo": "3100203"
      },
      {
        "nome": "São Gonçalo do Abaeté",
        "geocodigo": "3161700"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Biquinhas",
        "geocodigo": "3107000"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Paineiras",
        "geocodigo": "3146404"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/4e06a555-4059-4fd5-a7b0-983aa593a1e0.pdf",
    "citacao": "Neste Balanço da Reparação referente ao primeiro semestre de 2022 são apresentadas as ações de reparação executadas pela Vale nas áreas impactadas pelo rompimento da Barragem B1. Nessa edição, dá-se ênfase as obrigações e os compromissos definidos no Acordo de Reparação Integral, por meio dos projetos integrantes dos Programas de Reparação Socioeconômica, Programa de Reparação Socioambiental, e Programa de Mobilidade e Programa de Fortalecimento do Serviço. São apresentados ainda, os resultados de ações executadas pela Vale em razão do rompimento, tais como de monitoramento de qualidade da água e sedimentos da Bacia do Rio Paraopeba, soluções definitivas e emergenciais adotadas para garantia de abastecimento de água a população, entregas emergenciais em propriedades rurais, indenizações extrajudiciais firmadas, apoio psicossocial, execução do Programa Ciclo Saúde e de obras sociais e de infraestrutura nos municípios. Por fim, são apresentadas ações voltadas ao desenvolvimento econômico dos municípios, por meio de capacitação profissional, apoio ao empreendedorismo local, fortalecimento do turismo, entre outras ações"
  },
  {
    "id": "19907a47-5c2e-4c71-abc1-e8a79d9063e4",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "INFORMAÇÕES SOBRE TAP-E PATAXÓ - VALE",
    "tipo": "extraprocessual",
    "data": "2022-07-19",
    "municipios": [
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      }
    ],
    "temas": [
      "socioeconômico",
      "trâmites processuais",
      "meio ambiente",
      "saúde da população"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/19907a47-5c2e-4c71-abc1-e8a79d9063e4.pdf",
    "citacao": "Apresenta-se o Termo de Ajuste Preliminar Extrajudicial (TAP-E)  firmado entre o Ministério Público Federal, FUNAI e a Vale S.A, em favor do povo indígena Pataxó e Pataxó Hã Hã Hãe, em razão do rompimento da Barragem B1 - Mina Córrego do Feijão, em Brumadinho-MG, assim como, o Primeiro e Segundo Aditivos ao TAP-E.\nO presente TAP-E e Aditivos representam um conjunto de compromissos assumidos pela Vale S.A, a partir da implementação de medidas emergenciais voltadas ao povo indígena supracitado. Dentre as obrigações legais assumidas pela Vale por meio do TAP, estão o pagamento mensal emergencial aos indígenas, contratação de assessoria técnica independente, contratação de consultoria socioeconômica para elaboração de diagnóstico de impactos do rompimento e Plano de Reparação Integral, realização de um diagnóstico de saúde e garantia de assistência à saúde complementar ao poder público, dentre outras obrigações previstas."
  },
  {
    "id": "61583bac-c1a8-4c47-8352-712a46ae8f71",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Informações sobre Acordos de Indenização Extrajudicial para reparação dos danos individuais materiais e morais decorrentes do rompimento da Barragem da Mina de Córrego do Feijão",
    "tipo": "extraprocessual",
    "data": "2022-10-24",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/61583bac-c1a8-4c47-8352-712a46ae8f71.pdf",
    "citacao": "Este documento tem por objetivo apresentar informações e dados consolidados de maio de 2019 a agosto de 2023, referentes aos acordos de indenizações individuais extrajudiciais celebrados entre a Vale e os impactados, em razão do rompimento da barragem BI, da Mina Córrego do Feijão, em Brumadinho (MG), a partir das premissas e parâmetros estabelecidos no Termo de Compromisso (TC), celebrado entre a Defensoria Pública do Estado de Minas Gerais e a Vale S.A."
  },
  {
    "id": "d43c7633-debc-432c-a074-c4c229529e51",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "MEDIDAS DE ASSISTÊNCIA HUMANITÁRIA E REPARAÇÃO- HABITAÇÃO - VALE",
    "tipo": "extraprocessual",
    "data": "2022-11-21",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/d43c7633-debc-432c-a074-c4c229529e51.pdf",
    "citacao": "Apresenta-se por meio deste documento, informações e dados consolidados referentes às medidas adotadas pela Vale S.A no eixo temático da habitação, a fim de garantir a assistência humanitária emergencial e o direito à moradia das pessoas atingidas pelo rompimento da Barragem B1 - Mina Córrego do Feijão, em Brumadinho-MG. São apresentados o número de famílias assistidas em moradia temporária e em moradia definitiva até o mês de setembro/22, bem como, o número de atendimentos efetuados até julho/2022 por meio das ações pós-indenizatórias desenvolvidas no Programa de Assistência Integral aos Atingidos (PAIA)."
  },
  {
    "id": "88ef1d1f-f908-4c12-aac3-b35c10a43327",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "INFORMAÇÕES SOBRE MEDIDAS DE ASSISTÊNCIA HUMANITÁRIA - HABITAÇÃO - VALE",
    "tipo": "extraprocessual",
    "data": "2022-11-21",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/88ef1d1f-f908-4c12-aac3-b35c10a43327.pdf",
    "citacao": "Apresenta-se por meio deste documento, informações e dados consolidados referentes às medidas adotadas pela Vale S.A no eixo temático da habitação, a fim de garantir a assistência humanitária emergencial e o direito à moradia das pessoas atingidas pelo rompimento da Barragem B1 - Mina Córrego do Feijão, em Brumadinho-MG. São apresentados o número de famílias assistidas em moradia temporária e em moradia definitiva até o mês de setembro/22, bem como, o número de atendimentos efetuados até julho/2022 por meio das ações pós-indenizatórias desenvolvidas no Programa de Assistência Integral aos Atingidos (PAIA)."
  },
  {
    "id": "3bfa9515-2074-454b-b982-078d5ebcec68",
    "processo": "5095958-18.2020.8.13.0024",
    "titulo": "INFORMAÇÕES SOBRE MEDIDAS DE ASSISTÊNCIA HUMANITÁRIA - HABITAÇÃO - VALE",
    "tipo": "extraprocessual",
    "data": "2022-11-21",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/3bfa9515-2074-454b-b982-078d5ebcec68.pdf",
    "citacao": "Apresenta-se por meio deste documento, informações e dados consolidados referentes às medidas adotadas pela Vale S.A no eixo temático da habitação, a fim de garantir a assistência humanitária emergencial e o direito à moradia das pessoas atingidas pelo rompimento da Barragem B1 - Mina Córrego do Feijão, em Brumadinho-MG. São apresentados o número de famílias assistidas em moradia temporária e em moradia definitiva até o mês de setembro/22, bem como, o número de atendimentos efetuados até julho/2022 por meio das ações pós-indenizatórias desenvolvidas no Programa de Assistência Integral aos Atingidos (PAIA)."
  },
  {
    "id": "3936e285-0a6e-4e36-9f24-0137a3125000",
    "processo": "5095958-18.2020.8.13.0024",
    "titulo": "INFORMAÇÕES SOBRE MEDIDAS ADOTADAS JUNTO ÀS COMUNIDADES QUILOMBOLAS - VALE",
    "tipo": "extraprocessual",
    "data": "2022-12-05",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/3936e285-0a6e-4e36-9f24-0137a3125000.pdf",
    "citacao": "Apresenta-se neste documento, em síntese, as medidas emergenciais e de reparação adotadas pela Vale S.A. junto às comunidades quilombolas, em decorrência do rompimento da Barragem BI – Mina Córrego do Feijão, em Brumadinho/MG. Desse modo, são descritas as ações efetivadas até o momento nas seguintes comunidades remanescentes de quilombo – CRQ’s : i) Ribeirão; ii) Sapé, iii) Marinhos e iv) Rodrigues, situadas no território de Brumadinho, e nas CRQs: i) Pontinha, ii) Beira Córrego e iii) Retiro dos Moreiras, localizadas no território de abrangência da Bacia do Paraopeba."
  },
  {
    "id": "5181d851-4dab-449b-8917-ecddcc961850",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Balanço da Reparação Dezembro 2022",
    "tipo": "extraprocessual",
    "data": "2022-12-07",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/5181d851-4dab-449b-8917-ecddcc961850.pdf",
    "citacao": "Neste Balanço da Reparação referente ao segundo semestre de 2022 são apresentadas as ações de reparação executadas pela Vale nas áreas impactadas pelo rompimento da Barragem B1. Nessa edição, dá-se ênfase as obrigações e os compromissos definidos no Acordo de Reparação Integral, onde são apresentados o andamento dos projetos integrantes dos Programas de Reparação Socioeconômica, Programa de Reparação Socioambiental, e Programa de Mobilidade e Programa de Fortalecimento do Serviço Público, dentre outras obrigações do Acordo. São apresentados ainda, os resultados de algumas iniciativas que tiveram início no momento emergencial e que seguem em execução. São ações voltadas para abastecimento, tratamento e monitoramento de água, de cuidados com os animais, além de projetos sociais e de apoio aos atingidos, desenvolvimento socioeconômico e obras sociais e de infraestrutura urbana."
  },
  {
    "id": "71772831-d0c4-42b4-bfef-6160e6bbfa49",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Balanço da Reparação Dezembro 2022",
    "tipo": "extraprocessual",
    "data": "2022-12-07",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/71772831-d0c4-42b4-bfef-6160e6bbfa49.pdf",
    "citacao": "Neste Balanço da Reparação referente ao segundo semestre de 2022 são apresentadas as ações de reparação executadas pela Vale nas áreas impactadas pelo rompimento da Barragem B1. Nessa edição, dá-se ênfase as obrigações e os compromissos definidos no Acordo de Reparação Integral, onde são apresentados o andamento dos projetos integrantes dos Programas de Reparação Socioeconômica, Programa de Reparação Socioambiental, e Programa de Mobilidade e Programa de Fortalecimento do Serviço Público, dentre outras obrigações do Acordo. São apresentados ainda, os resultados de algumas iniciativas que tiveram início no momento emergencial e que seguem em execução. São ações voltadas para abastecimento, tratamento e monitoramento de água, de cuidados com os animais, além de projetos sociais e de apoio aos atingidos, desenvolvimento socioeconômico e obras sociais e de infraestrutura urbana."
  },
  {
    "id": "5029fbe6-6cc4-4525-b891-e029834fbd4b",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "INFORMAÇÕES SOBRE MEDIDAS ADOTADAS JUNTO ÀS  COMUNIDADES QUILOMBOLAS  - VALE",
    "tipo": "extraprocessual",
    "data": "2022-12-07",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/5029fbe6-6cc4-4525-b891-e029834fbd4b.pdf",
    "citacao": "Apresenta-se neste documento, em síntese, as medidas emergenciais e de reparação adotadas pela Vale S.A. junto às comunidades quilombolas, em decorrência do rompimento da Barragem BI – Mina Córrego do Feijão, em Brumadinho/MG. Desse modo, são descritas as ações efetivadas até o momento nas seguintes comunidades remanescentes de quilombo – CRQ’s : i) Ribeirão; ii) Sapé, iii) Marinhos e iv) Rodrigues,  situadas no território de Brumadinho, e nas CRQs:  i) Pontinha, ii) Beira Córrego e iii) Retiro dos Moreiras, localizadas no território de abrangência da Bacia do Paraopeba."
  },
  {
    "id": "51ebaa2d-0d24-4993-9e86-6682b27f3692",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "INFORMAÇÕES SOBRE MEDIDAS ADOTADAS JUNTO ÀS COMUNIDADES QUILOMBOLAS - VALE - COMPLETO",
    "tipo": "extraprocessual",
    "data": "2022-12-14",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/51ebaa2d-0d24-4993-9e86-6682b27f3692.pdf",
    "citacao": "Apresenta-se neste documento, em síntese, as medidas emergenciais e de reparação adotadas pela Vale S.A. junto às comunidades quilombolas, em decorrência do rompimento da Barragem BI – Mina Córrego do Feijão, em Brumadinho/MG. Desse modo, são descritas as ações efetivadas até o momento nas seguintes comunidades remanescentes de quilombo – CRQ’s : i) Ribeirão; ii) Sapé, iii) Marinhos e iv) Rodrigues, situadas no território de Brumadinho, e nas CRQs: i) Pontinha, ii) Beira Córrego e iii) Retiro dos Moreiras, localizadas no território de abrangência da Bacia do Paraopeba."
  },
  {
    "id": "3193f755-2d69-4ef1-b1c4-8100920429b2",
    "processo": "5095960-85.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental da Bacia do Rio Paraopeba - Capítulo 1 - Diagnóstico pretérito da bacia do rio Paraopeba.",
    "tipo": "extraprocessual",
    "data": "2023-01-27",
    "municipios": [
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/3193f755-2d69-4ef1-b1c4-8100920429b2.pdf",
    "citacao": "Esse capítulo apresenta as condições socioambientais da bacia do Rio Paraopeba antes do rompimento das barragens, permitindo configurar uma linha de base acerca da situação do ambiente abiótico e biótico (em particular, os recursos hídricos, a composição e a estrutura de sua biodiversidade e os serviços ecossistêmicos) e das condições de vida das comunidades na bacia do Rio Paraopeba, das características socioeconômicas dos municípios e do patrimônio cultural, histórico e arqueológico, previamente à data de 25 de janeiro de 2019."
  },
  {
    "id": "86045bf3-d475-4f59-9dde-8282a902535d",
    "processo": "5036162-96.2020.8.13.0024",
    "titulo": "Diagnóstico pretérito da bacia do rio Paraopeba",
    "tipo": "extraprocessual",
    "data": "2023-01-27",
    "municipios": [
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/86045bf3-d475-4f59-9dde-8282a902535d.pdf",
    "citacao": "Esse capítulo apresenta as condições socioambientais da bacia do Rio Paraopeba antes do rompimento das barragens, permitindo configurar uma linha de base acerca da situação do ambiente abiótico e biótico (em particular, os recursos hídricos, a composição e a estrutura de sua biodiversidade e os serviços ecossistêmicos) e das condições de vida das comunidades na bacia do Rio Paraopeba, das características socioeconômicas dos municípios e do patrimônio cultural, histórico e arqueológico, previamente à data de 25 de janeiro de 2019."
  },
  {
    "id": "c68faf32-4f96-4480-aab1-4c5602ffc63c",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Diagnóstico pretérito da bacia do rio Paraopeba",
    "tipo": "extraprocessual",
    "data": "2023-01-27",
    "municipios": [
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/c68faf32-4f96-4480-aab1-4c5602ffc63c.pdf",
    "citacao": "Esse capítulo apresenta as condições socioambientais da bacia do Rio Paraopeba antes do rompimento das barragens, permitindo configurar uma linha de base acerca da situação do ambiente abiótico e biótico (em particular, os recursos hídricos, a composição e a estrutura de sua biodiversidade e os serviços ecossistêmicos) e das condições de vida das comunidades na bacia do Rio Paraopeba, das características socioeconômicas dos municípios e do patrimônio cultural, histórico e arqueológico, previamente à data de 25 de janeiro de 2019."
  },
  {
    "id": "61984593-13ba-456a-b0be-0bc39c111cbb",
    "processo": "5036254-74.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental da Bacia do Rio Paraopeba - Capítulo 1 - Diagnóstico pretérito da bacia do rio Paraopeba.",
    "tipo": "extraprocessual",
    "data": "2023-01-27",
    "municipios": [
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/61984593-13ba-456a-b0be-0bc39c111cbb.pdf",
    "citacao": "Esse capítulo apresenta as condições socioambientais da bacia do Rio Paraopeba antes do rompimento das barragens, permitindo configurar uma linha de base acerca da situação do ambiente abiótico e biótico (em particular, os recursos hídricos, a composição e a estrutura de sua biodiversidade e os serviços ecossistêmicos) e das condições de vida das comunidades na bacia do Rio Paraopeba, das características socioeconômicas dos municípios e do patrimônio cultural, histórico e arqueológico, previamente à data de 25 de janeiro de 2019."
  },
  {
    "id": "b32e9319-8e3d-4cf9-9cc1-61b6f520312b",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental da Bacia do Rio Paraopeba - Capítulo 1 - Diagnóstico pretérito da bacia do rio Paraopeba.",
    "tipo": "extraprocessual",
    "data": "2023-01-27",
    "municipios": [
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/b32e9319-8e3d-4cf9-9cc1-61b6f520312b.pdf",
    "citacao": "Esse capítulo apresenta as condições socioambientais da bacia do Rio Paraopeba antes do rompimento das barragens, permitindo configurar uma linha de base acerca da situação do ambiente abiótico e biótico (em particular, os recursos hídricos, a composição e a estrutura de sua biodiversidade e os serviços ecossistêmicos) e das condições de vida das comunidades na bacia do Rio Paraopeba, das características socioeconômicas dos municípios e do patrimônio cultural, histórico e arqueológico, previamente à data de 25 de janeiro de 2019."
  },
  {
    "id": "83d86064-f553-420d-bc1b-09b032715f3e",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Síntese das medidas de reparação e  compensação efetuadas pela Vale no  âmbito do Turismo",
    "tipo": "extraprocessual",
    "data": "2023-05-18",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      }
    ],
    "temas": [
      "infraestrutura",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/83d86064-f553-420d-bc1b-09b032715f3e.pdf",
    "citacao": "Apresenta-se, neste documento, uma síntese das medidas de reparação socioeconômica implementadas pela Vale S.A em razão do rompimento da Barragem B1, da Mina Córrego do Feijão, em Brumadinho (MG), direcionadas ao fortalecimento e fomento do setor de “Turismo” nos territórios de Brumadinho e da Bacia do Paraopeba."
  },
  {
    "id": "db131f75-fadf-44ca-a0bd-1cd3c7c8a101",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Síntese das Medidas Adotadas pela Vale no Âmbito da Segurança Pública e Defesa Civil",
    "tipo": "extraprocessual",
    "data": "2023-06-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/db131f75-fadf-44ca-a0bd-1cd3c7c8a101.pdf",
    "citacao": "Desde o rompimento da Barragem BI, localizada na Mina Córrego do Feijão, em Brumadinho, em janeiro de 2019, a Vale S.A. (Vale) tem realizado um conjunto de iniciativas e ações compensatórias e reparatórias decorrentes deste evento. Este relatório tem por objetivo apresentar informações técnicas consolidadas e evidências de execução das medidas adotadas pela Vale no âmbito da Segurança Pública e Defesa Civil, contribuindo para os trabalhos periciais, bem como para conhecimento de eventuais outros interessados."
  },
  {
    "id": "8c1fa0fa-6551-4260-89cf-2e4bb2a0bde2",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Síntese das Medidas de Reparação e Compensação Adotadas pela Vale no Âmbito da Educação",
    "tipo": "extraprocessual",
    "data": "2023-08-14",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Abaeté",
        "geocodigo": "3100203"
      },
      {
        "nome": "Betim",
        "geocodigo": "3106705"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      },
      {
        "nome": "Curvelo",
        "geocodigo": "3120904"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      },
      {
        "nome": "Felixlândia",
        "geocodigo": "3125705"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Fortuna de Minas",
        "geocodigo": "3126406"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Juatuba",
        "geocodigo": "3136652"
      },
      {
        "nome": "Maravilhas",
        "geocodigo": "3139706"
      },
      {
        "nome": "Mateus Leme",
        "geocodigo": "3140704"
      },
      {
        "nome": "Morada Nova de Minas",
        "geocodigo": "3143500"
      },
      {
        "nome": "Paineiras",
        "geocodigo": "3146404"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Pompéu",
        "geocodigo": "3152006"
      },
      {
        "nome": "São Gonçalo do Abaeté",
        "geocodigo": "3161700"
      },
      {
        "nome": "São Joaquim de Bicas",
        "geocodigo": "3162922"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      }
    ],
    "temas": [
      "infraestrutura",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/8c1fa0fa-6551-4260-89cf-2e4bb2a0bde2.pdf",
    "citacao": "Apresenta-se uma síntese das medidas de reparação socioeconômica implementadas pela Vale S.A em razão do rompimento da Barragem BI, localizada na Mina Córrego do Feijão, em Brumadinho (MG), relacionadas ao eixo da Educação.\nDesde o rompimento da barragem, em janeiro de 2019, a Vale vem realizando uma série de iniciativas voltadas à Educação, dentre ações emergenciais, e de compensação, visando garantir emergencialmente o apoio social à população atingida, bem como, promover ações compensatórias para melhoria da infraestrutura educacional da rede pública de ensino, mediante execução de obras e serviços em escolas e creches, doações de bens e equipamentos, além do desenvolvimento de projetos de investimento voluntário em Educação Financeira. \nEstas iniciativas foram ampliadas com o Acordo Judicial de Reparação Integral (AJRI), firmado entre a Vale, o Estado de Minas Gerais, e as instituições de justiça (MPMG, DPMG e MPF) em 04 de fevereiro de 2021, visando a reparação integral de todos os danos coletivos e difusos decorrentes do referido rompimento."
  },
  {
    "id": "59d1cfc4-b4cc-4a05-ab0c-c49419a74058",
    "processo": "5095960-85.2020.8.13.0024",
    "titulo": "PLANO DE RECUPERAÇÃO DE ÁREAS DEGRADADAS - CAP. 3 - PLANO DE REPARAÇÃO SOCIOAMBIENTAL",
    "tipo": "extraprocessual",
    "data": "2023-08-31",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/59d1cfc4-b4cc-4a05-ab0c-c49419a74058.pdf",
    "citacao": "Apresenta o capítulo 3 (Plano de Ação para Remediação, Reparação e Restauração dos Impactos  - Plano de Recuperação de Áreas Degradadas -PRAD) protocolado em agosto de 2023, pertencente ao Plano de Reparação Socioambiental."
  },
  {
    "id": "7d24af3c-83cc-49f1-83fe-5078a9747949",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Medidas Adotadas pela Vale no Âmbito do Saneamento",
    "tipo": "extraprocessual",
    "data": "2023-09-11",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      },
      {
        "nome": "Mário Campos",
        "geocodigo": "3140159"
      },
      {
        "nome": "Pará de Minas",
        "geocodigo": "3147105"
      },
      {
        "nome": "São José da Varginha",
        "geocodigo": "3163102"
      },
      {
        "nome": "Caetanópolis",
        "geocodigo": "3109907"
      },
      {
        "nome": "Paraopeba",
        "geocodigo": "3147402"
      },
      {
        "nome": "Florestal",
        "geocodigo": "3126000"
      },
      {
        "nome": "Biquinhas",
        "geocodigo": "3107000"
      },
      {
        "nome": "Três Marias",
        "geocodigo": "3169356"
      },
      {
        "nome": "Pequi",
        "geocodigo": "3149606"
      },
      {
        "nome": "Igarapé",
        "geocodigo": "3130101"
      },
      {
        "nome": "Esmeraldas",
        "geocodigo": "3124104"
      }
    ],
    "temas": [
      "infraestrutura",
      "saúde da população",
      "socioeconômico",
      "meio ambiente"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/7d24af3c-83cc-49f1-83fe-5078a9747949.pdf",
    "citacao": "Apresenta-se, neste documento, as medidas implementadas pela Vale S.A em razão do rompimento da Barragem BI, da Mina Córrego do Feijão, em Brumadinho (MG), relacionadas ao tema do Saneamento até o mês de agosto de 2023, para conhecimento das partes interessadas e consideração do Perito – Comitê Técnico Científico da Universidade Federal de Minas Gerais – no âmbito do processo cível nº 5071521-44.2019.8.13.0024"
  },
  {
    "id": "4fd96567-12a8-4b96-a257-a341bdb590a1",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Informações sobre Acordos de Indenização Extrajudicial para reparação dos danos individuais materiais e morais decorrentes do rompimento da Barragem da Mina de Córrego do Feijão",
    "tipo": "extraprocessual",
    "data": "2023-09-27",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/4fd96567-12a8-4b96-a257-a341bdb590a1.pdf",
    "citacao": "Este documento tem por objetivo apresentar informações e dados consolidados de maio de 2019 a agosto de 2023, referentes aos acordos de indenizações individuais extrajudiciais celebrados entre a Vale e os impactados, em razão do rompimento da barragem BI, da Mina Córrego do Feijão, em Brumadinho (MG), a partir das premissas e parâmetros estabelecidos no Termo de Compromisso (TC), celebrado entre a Defensoria Pública do Estado de Minas Gerais e a Vale S.A."
  },
  {
    "id": "2f160f8b-ec9e-4ebe-8fae-3e32ea58d99e",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Dia a dia da Reparação Vale - Novembro de 2023",
    "tipo": "extraprocessual",
    "data": "2023-11-17",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/2f160f8b-ec9e-4ebe-8fae-3e32ea58d99e.pdf",
    "citacao": "Apresenta as ações de reparação da Vale em razão do rompimento da barragem BI, da Mina de Córrego do Feijão, situada em Brumadinho,  até novembro de 2023. Dentre elas, as ações de atendimento humanitário, as ações emergenciais, de indenizações e apoio aos atingidos, do Programa de Referência da Família, para garantia de água para todos, ações no âmbito da agropecuária, de segurança hídrica de Belo Horizonte e RMBH, do Programa Ciclo Saúde, de ressignificação de Córrego do Feijão, do Programa de Fomento ao Turismo Sustentável de Brumadinho, do Programa de Fomento à Agricultura, das obras sociais e de infraestrutura e obras de compensação. Além disso, no âmbito do Acordo Judicial de Reparação Integral apresenta-se as medidas de reparação socioambiental e socioeconômica, e por fim os avanços em termos de segurança de barragem."
  },
  {
    "id": "200aaa74-8c68-4c8d-9d5b-f5c94af39dea",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Dia a dia da Reparação Vale - Novembro de 2023",
    "tipo": "extraprocessual",
    "data": "2023-11-17",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/200aaa74-8c68-4c8d-9d5b-f5c94af39dea.pdf",
    "citacao": "Apresenta as ações de reparação da Vale em razão do rompimento da barragem BI, da Mina de Córrego do Feijão, situada em Brumadinho, até novembro de 2023. Dentre elas, as ações de atendimento humanitário, as ações emergenciais, de indenizações e apoio aos atingidos, do Programa de Referência da Família, ações para garantia de água para todos, no âmbito da agropecuária, de segurança hídrica de Belo Horizonte e RMBH, do Programa Ciclo Saúde, de ressignificação de Córrego do Feijão, do Programa de Fomento ao Turismo Sustentável de Brumadinho, do Programa de Fomento à Agricultura, das obras sociais e de infraestrutura e obras de compensação. Além disso, no âmbito do Acordo Judicial de Reparação Integral apresenta-se as medidas de reparação socioambiental e socioeconômica, e por fim os avanços em termos de segurança de barragem."
  },
  {
    "id": "6ad4f9f5-2693-4a7c-8470-e2c63c426b7a",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Síntese das medidas de reparação e compensação realizadas pela Vale no âmbito da Saúde",
    "tipo": "extraprocessual",
    "data": "2024-01-15",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "saúde da população"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/6ad4f9f5-2693-4a7c-8470-e2c63c426b7a.pdf",
    "citacao": "O presente documento consiste em um memorial síntese das ações adotadas pela Vale S.A. no âmbito da “Saúde\" no contexto da reparação de danos decorrentes do rompimento da barragem BI, localizada na Mina Córrego do Feijão, em Brumadinho. Para a produção deste memorial síntese, foram analisados 225 documentos relativos às ações de reparação, mitigação ou compensação promovidas pela Vale S.A. (Vale) no setor saúde, dos quais se dá por meio deste, a publicização das evidências de tais iniciativas e cumprimento de compromissos."
  },
  {
    "id": "b41c248e-42fc-4cd7-917d-443b6f86fdb2",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Síntese das medidas de reparação e compensação realizadas pela Vale no âmbito da Saúde",
    "tipo": "extraprocessual",
    "data": "2024-01-31",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "saúde da população"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/b41c248e-42fc-4cd7-917d-443b6f86fdb2.pdf",
    "citacao": "O presente documento consiste em um memorial síntese das ações adotadas pela Vale S.A. no âmbito da “Saúde\" no contexto da reparação de danos decorrentes do rompimento da barragem BI, localizada na Mina Córrego do Feijão, em Brumadinho. Para a produção deste memorial síntese, foram analisados 225 documentos relativos às ações de reparação, mitigação ou compensação promovidas pela Vale S.A. (Vale) no setor saúde, dos quais se recomenda a publicização das evidências de tais iniciativas."
  },
  {
    "id": "ff76e231-cdf5-4cd4-ae59-f298e2418610",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Informações sobre as medidas de fomento à produção agropecuária e outras ações correlacionadas realizadas pela Vale – dados consolidados até dezembro/2023",
    "tipo": "extraprocessual",
    "data": "2024-09-04",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/ff76e231-cdf5-4cd4-ae59-f298e2418610.pdf",
    "citacao": "Apresenta informações consolidadas referentes às medidas adotadas pela Vale S.A de fomento à produção agropecuária e outras correlacionadas, a fim de garantir o reestabelecimento e ampliação da capacidade produtiva e geração de renda nos estabelecimentos agropecuários dos municípios atingidos pelo rompimento da Barragem B1 – Mina Córrego do Feijão, em Brumadinho-MG."
  },
  {
    "id": "97db6eca-3c33-4987-9a27-74c54a2540f6",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Informações sobre as medidas de fomento à produção agropecuária e outras ações correlacionadas realizadas pela Vale – dados consolidados até dezembro/2023",
    "tipo": "extraprocessual",
    "data": "2024-09-04",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/97db6eca-3c33-4987-9a27-74c54a2540f6.pdf",
    "citacao": "Apresenta informações consolidadas referentes às medidas adotadas pela Vale S.A de fomento à produção agropecuária e outras correlacionadas, a fim de garantir o reestabelecimento e ampliação da capacidade produtiva e geração de renda nos estabelecimentos agropecuários dos municípios atingidos pelo rompimento da Barragem B1 – Mina Córrego do Feijão, em Brumadinho-MG."
  },
  {
    "id": "dcad6018-7bc0-429a-95a3-b20c0eafee02",
    "processo": "5095960-85.2020.8.13.0024",
    "titulo": "Informações sobre as medidas de fomento à produção agropecuária e outras ações correlacionadas realizadas pela Vale – dados consolidados até dezembro/2023",
    "tipo": "extraprocessual",
    "data": "2024-09-04",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/dcad6018-7bc0-429a-95a3-b20c0eafee02.pdf",
    "citacao": "Apresenta-se a seguir, informações consolidadas referentes às medidas adotadas pela Vale S.A de fomento à produção agropecuária e outras correlacionadas, a fim de garantir o reestabelecimento e ampliação da capacidade produtiva e geração de renda nos estabelecimentos agropecuários dos municípios atingidos pelo rompimento da Barragem B1 – Mina Córrego do Feijão, em Brumadinho-MG."
  },
  {
    "id": "9a84c023-a63f-4336-af18-2b95c7786db6",
    "processo": "5036162-96.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos. Parte 2",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/9a84c023-a63f-4336-af18-2b95c7786db6.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "6fcca1de-9a3c-4ec9-8a63-f3b060cddefb",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos. Parte 2",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/6fcca1de-9a3c-4ec9-8a63-f3b060cddefb.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "4de71383-86f0-406c-bed3-24bd3e5f0d4e",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos. Parte 2",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/4de71383-86f0-406c-bed3-24bd3e5f0d4e.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "a2964da9-cff9-4f74-9dcf-3261794c71a0",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos. Parte 1",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/a2964da9-cff9-4f74-9dcf-3261794c71a0.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "7df50ea1-195a-431e-b846-b69e94627dcf",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos. Parte 4",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/7df50ea1-195a-431e-b846-b69e94627dcf.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "9bd90e81-c74a-41ea-9ef5-87f6be3244ef",
    "processo": "5036162-96.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos. Parte 1",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/9bd90e81-c74a-41ea-9ef5-87f6be3244ef.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "d73fcb50-3495-474e-a13c-d15917fad4db",
    "processo": "5036162-96.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos. Parte 3",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/d73fcb50-3495-474e-a13c-d15917fad4db.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "297308d1-0f4a-4499-a19c-4a48f4540277",
    "processo": "5036162-96.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos. Parte 4",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/297308d1-0f4a-4499-a19c-4a48f4540277.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "7d0819a8-7dab-4370-8d0d-daa1e7a62358",
    "processo": "5036162-96.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos. Parte 5",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/7d0819a8-7dab-4370-8d0d-daa1e7a62358.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "66add0b7-853d-4816-91c2-3988eb45bb70",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos.",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/66add0b7-853d-4816-91c2-3988eb45bb70.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "895ba310-dcaf-4106-a22d-954b90124bac",
    "processo": "5036296-26.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos.",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/895ba310-dcaf-4106-a22d-954b90124bac.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "332d3494-5a72-4875-804b-8b6ab8e068d9",
    "processo": "5095958-18.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental da Bacia do Rio Paraopeba - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos.",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/332d3494-5a72-4875-804b-8b6ab8e068d9.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "43666196-5f4e-4993-8597-a8ededfbd554",
    "processo": "5095960-85.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental da Bacia do Rio Paraopeba - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos.",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/43666196-5f4e-4993-8597-a8ededfbd554.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "8ac27224-e501-4ddc-b7fd-163cff25c34c",
    "processo": "5071521-44.2019.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental da Bacia do Rio Paraopeba - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos.",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/8ac27224-e501-4ddc-b7fd-163cff25c34c.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "afa8e812-afd8-4e09-bef6-62b9635382b2",
    "processo": "5036162-96.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos.",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/afa8e812-afd8-4e09-bef6-62b9635382b2.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "0261ec26-9f97-4af0-a93f-660a3f4603b0",
    "processo": "5036254-74.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental da Bacia do Rio Paraopeba - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos.",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/0261ec26-9f97-4af0-a93f-660a3f4603b0.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
  {
    "id": "5efd2f53-e07e-485e-8e0d-bd23ca94dd02",
    "processo": "5036162-96.2020.8.13.0024",
    "titulo": "Plano de Reparação Socioambiental - Capítulo 2 - Caracterização pós-rompimento e avaliação de impactos.",
    "tipo": "extraprocessual",
    "data": "2024-09-30",
    "municipios": [
      {
        "nome": "Brumadinho",
        "geocodigo": "3109006"
      }
    ],
    "temas": [
      "infraestrutura",
      "meio ambiente",
      "saúde da população",
      "socioeconômico"
    ],
    "link": "http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/5efd2f53-e07e-485e-8e0d-bd23ca94dd02.pdf",
    "citacao": "O Capítulo 2 do Plano de Reparação Socioambiental da Bacia do Rio Paraopeba tem por objetivo caracterizar o rompimento das barragens B1, B4 e B4-A, o cenário socioambiental pós-rompimento e, com base na comparação deste com o cenário pré-rompimento (apresentado no Capítulo 1), identificar e avaliar os impactos deste rompimento. O presente Capítulo inicia-se com o detalhamento do rompimento das barragens B1, B4 e B4-A da Mina Córrego do Feijão e efeitos das chuvas de 2019/2020, caracterizando-se as condições ambientais e sociais após a data de 25 de janeiro de 2019 e eventos das chuvas e 2019/2020. A coleta e análise de dados deste diagnóstico foi ancorada em base de dados oficiais e nos relatórios das diversas empresas de consultoria que monitoram os componentes afetados desde o dia do rompimento. Foram e estão sendo feitos diversos estudos específicos, monitoramentos e reportes de ações emergenciais que serviram de informação para se compreender os efeitos do rompimento das barragens sobre cada componente analisado. Ressalta-se que o diagnóstico pós rompimento também é composto por dados coletados em locais não afetados pelos rejeitos, de modo a se obter informações em “áreas de referência”, dando subsídios para os processos de identificação e avaliação dos impactos. No que diz respeito ao diagnóstico pós-rompimento, após uma série de discussões técnicas realizadas por meio de conference call entre 26 de maio a 25 de junho 2020, com o Sisema e MP-MG/AECOM, ficou convencionado que a revisão da versão de 2020 (versão 1) do Plano de Reparação da Bacia do Rio Paraopeba seria baseada na análise de dados de um ano, portanto, um ciclo hidrológico completo. Para a temática de águas superficiais, subterrâneas e sedimentos a data de corte acordada com o Igam foi de março de 2020, conforme documentos e dados utilizados. Para o meio biótico, em comum acordo com o IEF, a data de corte ficou delimitada para o mês de abril de 2020. Conforme acordado em reunião realizada em 16/12/2021 entre o Sisema, MP-MG/Aecom e Vale S/A, em geral, a data de corte para a versão 2 foi mantida, conforme exposto anteriormente. Cabe ressaltar que, diferentemente dos critérios adotados em estudos ambientais para licenciamento de empreendimentos, ou em estudos sociais, em que usualmente se adota uma única área de estudo para todos os temas, neste caso, a área de estudo dos diagnósticos foi diferenciada, de acordo com as diversas áreas temáticas, embora o foco do Plano de Reparação seja a sub-bacia do ribeirão Ferro-Carvão e a bacia do rio Paraopeba."
  },
];
