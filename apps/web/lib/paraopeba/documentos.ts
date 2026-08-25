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


/** Array externalizado para `public/data/documentos-paraopeba.json`. */
import { lerDocumentosProcesso } from "./documentos-dados";
export const DOCUMENTOS_PROCESSO: DocumentoProcesso[] = lerDocumentosProcesso();
