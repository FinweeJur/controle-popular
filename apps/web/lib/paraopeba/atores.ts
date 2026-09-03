// GERADO a partir de `painel-paraopeba.html` (`docs/PLANO-INGESTAO-PARAOPEBA.md`
// mede a estrutura da fonte). Dado histórico/institucional — não recalculado
// pelo portal, atualiza por commit quando a fonte mudar.
//
// `INST_DATA` do painel — quem atua na reparação: 18 órgãos e organizações,
// do Judiciário ao movimento social.
//
// ═══ POR QUE ISTO É O GANHO MAIOR DA INGESTÃO ═══
//
// `docs/PLANO-INGESTAO-PARAOPEBA.md` (seção 1.4) mediu: 16 destes 18 não
// existem em `lib/betim/redeProtecao.ts` de forma alguma — são quem atende
// quem foi atingido de verdade (as três ATIs: AEDAS, NACAB, Instituto
// Guaicuy) e quem decide o processo (TJMG, STF, STJ, MPF, MPMG, DPMG). Os
// outros dois (MPMG, DPMG) já têm entrada genérica em `redeProtecao.ts` —
// aqui aparecem de novo porque a atuação DESCRITA é específica do caso
// Brumadinho, não o canal de denúncia genérico.

export type CategoriaAtor = "judiciario" | "mp" | "gestora" | "mov" | "pub";

export const CATEGORIA_ATOR_LABEL: Record<CategoriaAtor, string> = {
  "judiciario": "Judiciário",
  "mp": "Ministério Público e Defensoria",
  "gestora": "Gestora do programa de repasses",
  "mov": "Movimento social e assessoria técnica (ATIs)",
  "pub": "Poder público"
};

export interface ContatoAtor {
  tipo: string;
  label: string;
  href: string;
}

export interface AtorReparacao {
  categoria: CategoriaAtor;
  /** Papel dentro da categoria, como o painel-fonte descreveu (ex.: "Tribunal de Justiça — MG"). */
  papelNoPainel: string;
  nome: string;
  atuacao: string;
  contatos: ContatoAtor[];
  nota?: string;
}

export const ATORES_REPARACAO: AtorReparacao[] = [
  {
    "categoria": "judiciario",
    "papelNoPainel": "Tribunal de Justiça — MG",
    "nome": "TJMG — 2ª Vara da Fazenda Pública e Autarquias",
    "atuacao": "Instância de 1º e 2º grau responsável pelas ações de reparação. Juiz Murilo Sílvio de Abreu na 2ª Vara; 19ª Câmara Cível julga os agravos; Presidente Corrêa Júnior julgou a Reclamação da Vale.",
    "contatos": [
      {
        "tipo": "web",
        "label": "tjmg.jus.br",
        "href": "https://www.tjmg.jus.br"
      },
      {
        "tipo": "mail",
        "label": "imprensa@tjmg.jus.br",
        "href": "mailto:imprensa@tjmg.jus.br"
      },
      {
        "tipo": "phone",
        "label": "(31) 3306-3920",
        "href": "tel:3133063920"
      }
    ],
    "nota": "Processo de referência: 5063550-95.2025.8.13.0024 | Agravo: 1.0000.25.106323-6/001"
  },
  {
    "categoria": "judiciario",
    "papelNoPainel": "Supremo Tribunal Federal",
    "nome": "STF — ADPF 1314",
    "atuacao": "Ministro Gilmar Mendes é relator da ADPF 1314, ajuizada pelo Ibram, que pede suspensão das decisões do TJMG sobre o Novo Auxílio Emergencial. MPMG pediu ingresso como amicus curiae em maio de 2026.",
    "contatos": [
      {
        "tipo": "web",
        "label": "portal.stf.jus.br",
        "href": "https://portal.stf.jus.br"
      },
      {
        "tipo": "web",
        "label": "Acompanhar ADPF 1314",
        "href": "https://portal.stf.jus.br/processos/detalhe.asp?incidente=7594030"
      }
    ]
  },
  {
    "categoria": "judiciario",
    "papelNoPainel": "Superior Tribunal de Justiça",
    "nome": "STJ — Recursos Especiais da Vale",
    "atuacao": "A Vale recorreu ao STJ com Recurso Especial (REsp) contra a decisão do TJMG, além do Recurso Extraordinário no STF.",
    "contatos": [
      {
        "tipo": "web",
        "label": "stj.jus.br",
        "href": "https://www.stj.jus.br"
      }
    ]
  },
  {
    "categoria": "mp",
    "papelNoPainel": "Ministério Público de Minas Gerais",
    "nome": "MPMG — Procuradoria de Justiça",
    "atuacao": "Parte no Acordo de Reparação de 2021 e no colegiado fiscal do programa de repasses. Manifestou-se favoravelmente ao Novo Auxílio e pediu ingresso como amicus curiae na ADPF 1314 no STF (mai/2026).",
    "contatos": [
      {
        "tipo": "web",
        "label": "mpmg.mp.br",
        "href": "https://www.mpmg.mp.br"
      },
      {
        "tipo": "web",
        "label": "Ouvidoria",
        "href": "https://www.mpmg.mp.br/ouvidoria"
      }
    ]
  },
  {
    "categoria": "mp",
    "papelNoPainel": "Ministério Público Federal",
    "nome": "MPF — Procuradoria Regional",
    "atuacao": "Parte no Acordo de Reparação de 2021. Compõe o colegiado fiscal junto ao MPMG e à DPMG.",
    "contatos": [
      {
        "tipo": "web",
        "label": "mpf.mp.br",
        "href": "https://www.mpf.mp.br"
      }
    ]
  },
  {
    "categoria": "mp",
    "papelNoPainel": "Defensoria Pública — MG",
    "nome": "DPMG — Defensoria Pública do Estado de Minas Gerais",
    "atuacao": "Parte no Acordo de Reparação e no colegiado fiscal. Atua na defesa das pessoas atingidas que necessitam de assistência jurídica gratuita.",
    "contatos": [
      {
        "tipo": "web",
        "label": "defensoria.mg.def.br",
        "href": "https://defensoria.mg.def.br"
      },
      {
        "tipo": "phone",
        "label": "Disque Defensoria: 129",
        "href": "tel:129"
      }
    ]
  },
  {
    "categoria": "gestora",
    "papelNoPainel": "Gestora do programa de repasses",
    "nome": "FGV — Fundação Getulio Vargas",
    "atuacao": "Responsável pelos pagamentos mensais até o 5º dia útil, manutenção do cadastro e prestação de contas. Confirmou capacidade operacional até jul/2026.",
    "contatos": [
      {
        "tipo": "web",
        "label": "fgv.br",
        "href": "https://portal.fgv.br"
      },
      {
        "tipo": "web",
        "label": "Portal do beneficiário",
        "href": "https://login-ptr.fgv.br"
      },
      {
        "tipo": "phone",
        "label": "0800 032 8022",
        "href": "tel:08000328022"
      }
    ],
    "nota": "Para dúvidas: pagamentoptr@fgv.br | Ouvidoria: ptr.fgv.br/form/ouvidoria"
  },
  {
    "categoria": "mov",
    "papelNoPainel": "Movimento social de base",
    "nome": "MAB — Movimento dos Atingidos por Barragens",
    "atuacao": "Principal organização de mobilização das comunidades atingidas. Articula protestos, ações judiciais coletivas e comunicação pública.",
    "contatos": [
      {
        "tipo": "web",
        "label": "mab.org.br",
        "href": "https://mab.org.br"
      },
      {
        "tipo": "mail",
        "label": "comunicacao@mabnacional.org.br",
        "href": "mailto:comunicacao@mabnacional.org.br"
      }
    ]
  },
  {
    "categoria": "mov",
    "papelNoPainel": "Assessoria técnica — Regiões 1 e 2",
    "nome": "AEDAS",
    "atuacao": "ATI eleita pelas pessoas atingidas das Regiões 1 e 2 da Bacia do Paraopeba. Suporte técnico e jurídico às comunidades no processo de reparação.",
    "contatos": [
      {
        "tipo": "web",
        "label": "aedasmg.org",
        "href": "https://aedasmg.org"
      }
    ]
  },
  {
    "categoria": "mov",
    "papelNoPainel": "Assessoria técnica — Região 3",
    "nome": "NACAB — Núcleo de Assessoria às Comunidades Atingidas por Barragens",
    "atuacao": "ATI da Região 3 da Bacia do Paraopeba. Publica o boletim 'Reparação' e acompanha os processos judiciais.",
    "contatos": [
      {
        "tipo": "web",
        "label": "nacab.org.br",
        "href": "https://nacab.org.br"
      }
    ]
  },
  {
    "categoria": "mov",
    "papelNoPainel": "Comunicação das comunidades",
    "nome": "Instituto Guaicuy",
    "atuacao": "Comunicação e assessoria jurídica às comunidades atingidas. Mantém o Painel da Reparação.",
    "contatos": [
      {
        "tipo": "web",
        "label": "guaicuy.org.br",
        "href": "https://guaicuy.org.br"
      },
      {
        "tipo": "mail",
        "label": "comunicacao@guaicuy.org.br",
        "href": "mailto:comunicacao@guaicuy.org.br"
      }
    ]
  },
  {
    "categoria": "mov",
    "papelNoPainel": "Autora da ação civil pública",
    "nome": "ABA — Associação Brasileira dos Atingidos por Grandes Empreendimentos",
    "atuacao": "Propôs, junto à Ascotélite e ao IEM, a Ação Civil Pública que resultou nas decisões de 1ª e 2ª instância sobre o Novo Auxílio.",
    "contatos": [
      {
        "tipo": "web",
        "label": "Contato via MAB",
        "href": "https://mab.org.br/contato"
      }
    ]
  },
  {
    "categoria": "mov",
    "papelNoPainel": "Co-autora da ação civil pública",
    "nome": "Ascotélite — Associação Comunitária do Bairro Cidade Satélite",
    "atuacao": "Representa moradores do bairro Cidade Satélite em Brumadinho. Co-autora da ação civil pública.",
    "contatos": [
      {
        "tipo": "mail",
        "label": "cont.alvesjg@gmail.com",
        "href": "mailto:cont.alvesjg@gmail.com"
      }
    ],
    // Achado em 2026-08-14 no Mapa das OSC (IPEA, cadastro federal de
    // organizações da sociedade civil por CNPJ), não na fonte original do
    // painel-paraopeba. CNPJ 00.251.566/0001-96, endereço registrado: Av.
    // Bernardo Mascarenhas, Cidade Satélite, Juatuba/MG, CEP 35675-000 —
    // Juatuba, não Brumadinho, mas o bairro é o mesmo citado na atuação.
    // Telefone do cadastro ("3103535801") tem um dígito a mais que um
    // fixo de BH/região deveria ter -- não virou `tel:` por isso. Confirme
    // por e-mail antes de tratar como canal validado.
    "nota": "E-mail e CNPJ do Mapa das OSC (IPEA) — não confirmados por contato direto com a associação."
  },
  {
    "categoria": "mov",
    "papelNoPainel": "Co-autora da ação civil pública",
    "nome": "IEM — Instituto Esperança Maria",
    "atuacao": "Co-autor da ação civil pública que garantiu o Novo Auxílio Emergencial.",
    "contatos": [
      {
        "tipo": "web",
        "label": "Contato via MAB",
        "href": "https://mab.org.br/contato"
      }
    ],
    // Nenhum telefone/e-mail/site institucional encontrado em 2026-08-14
    // (mesma lacuna da ABA acima, que já usava este mesmo desvio). O IEM
    // atua em Belo Horizonte ao lado do MAB nesta ação -- não é o canal
    // oficial do IEM, é o mesmo atalho já aceito para a ABA.
    "nota": "Canal direto não encontrado — usa o mesmo desvio via MAB já adotado para a ABA."
  },
  {
    "categoria": "pub",
    "papelNoPainel": "Poder executivo municipal",
    "nome": "Prefeitura de Brumadinho",
    "atuacao": "O município habilitou-se como assistente litisconsorcial das associações de atingidos no TJMG e atuou no STF: reuniu-se com o ministro Gilmar Mendes em abril de 2026 com dados de saúde e renda local. A Prefeitura também acionou judicialmente a FGV em dezembro de 2025 por atrasos no pagamento do NAE.",
    "contatos": [
      {
        "tipo": "web",
        "label": "brumadinho.mg.gov.br",
        "href": "https://www.brumadinho.mg.gov.br"
      }
    ]
  },
  {
    "categoria": "pub",
    "papelNoPainel": "Poder Legislativo federal",
    "nome": "Câmara dos Deputados",
    "atuacao": "Advocacia da Câmara apresentou ao min. Gilmar Mendes defesa técnica da PNAB na ADPF 1314.",
    "contatos": [
      {
        "tipo": "web",
        "label": "camara.leg.br",
        "href": "https://www.camara.leg.br"
      }
    ]
  },
  {
    "categoria": "pub",
    "papelNoPainel": "Advocacia-Geral da União",
    "nome": "AGU — Advocacia-Geral da União",
    "atuacao": "Em 7 de maio de 2026, o setor de Contencioso da AGU manifestou-se na ADPF 1314 pedindo ao STF que rejeite a ação do Ibram e reconhecendo a aplicabilidade da PNAB a danos em curso. Em 14 de maio, a própria AGU — pela sua Consultoria-Geral, em nome da Presidência da República — enviou posição oposta, defendendo irretroatividade absoluta da PNAB, criando divergência interna no governo.",
    "contatos": [
      {
        "tipo": "web",
        "label": "agu.gov.br",
        "href": "https://www.agu.gov.br"
      }
    ],
    "nota": "As duas manifestações da AGU têm posições contraditórias e estão sob apreciação do min. Gilmar Mendes na ADPF 1314."
  },
  {
    "categoria": "pub",
    "papelNoPainel": "Presidência da República",
    "nome": "Presidência da República",
    "atuacao": "Em 2023, vetou o trecho da PNAB que autorizava sua aplicação a casos ocorridos antes da lei. Em maio de 2026, a AGU — pela sua Consultoria-Geral, em nome da Presidência — defendeu essa irretroatividade no STF (ADPF 1314), contrariando o setor de Contencioso da própria AGU.",
    "contatos": [
      {
        "tipo": "web",
        "label": "gov.br",
        "href": "https://www.gov.br"
      }
    ]
  }
];
