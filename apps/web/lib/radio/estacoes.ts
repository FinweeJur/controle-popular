/**
 * Estações de rádio do portal — dado versionado, curto e conferido.
 *
 * Papel no portal: alimenta a página `/radio` e o player flutuante que vive
 * ao lado do Seu Nonô. A régua é a do AGENTS § 7 e § 8: o número vem do dado,
 * a fonte oficial acompanha cada estação, e o que não foi conferido não entra.
 *
 * De onde vem este dado (medido em 2026-09-30):
 * - `stream` de cada emissora foi verificado por requisição HTTP direta
 *   (`curl -sL --range 0-2000`), respondendo conteúdo de áudio ou playlist
 *   HLS — não basta o status 200 (armadilha do AGENTS § 6: "API responde 200
 *   e mente"). Todos os streams são **HTTPS**: página em HTTPS bloqueia áudio
 *   em HTTP (conteúdo misto), então endereço http:// não entra.
 * - A lista de partida veio de agregadores públicos que conectam rádios
 *   (`radio-browser.info` e `radio.garden`); a coluna `fonteAgregador` diz por
 *   onde a estação foi encontrada. O `site` é a página oficial da emissora.
 * - `logo` aponta para o ícone/favicon do site oficial (hotlink), com desenho
 *   de reserva (monograma) quando a imagem não carrega — nunca se copia a marca
 *   para dentro do repositório, para não ferir direito autoral nem inflar
 *   `apps/web/public/`.
 *
 * Decisões técnicas:
 * - `formato` importa: `mp3`/`aac` tocam em `<audio>` em qualquer navegador;
 *   `hls` (`.m3u8`) só toca nativo em Safari — no resto exige a biblioteca
 *   `hls.js`, carregada sob demanda (ver `PlayerRadio.tsx`). Por isso o campo
 *   é explícito e a página avisa a limitação.
 * - `transcrevivel`: só as federais de fala entram. A transcrição local
 *   (Whisper no navegador, sem API) exige CORS no stream — medido: as
 *   federais EBC/Câmara/Senado enviam `Access-Control-Allow-Origin`, as
 *   demais não. Sem CORS, o Web Audio entrega silêncio: melhor não oferecer.
 * - A frequência e o país vêm da própria fonte; `verificadoEm` é a data da
 *   conferência. Mudou um stream? Remeça e atualize a data.
 *
 * Reorganização do dono (02/10/2026):
 * - Região: o bloco único "Brasil" foi aberto nas cinco regiões do país —
 *   nacionais e universitárias passam a ser listadas por região;
 * - Categoria: "independente" deixou de ser rótulo — sobram comunitária e
 *   popular (mais pública federal e universitária, que continuam);
 * - Ordem padrão da tela: região (com categoria e nome dentro dela).
 *
 * Ampliação de 03/10/2026 (pedido do dono — rádios da Venezuela e de reggae):
 * entraram duas emissoras comunitárias da Venezuela (rede Fe y Alegría, de
 * educação popular), uma rádio de música venezuelana (joropo/llanera), duas
 * comunitárias brasileiras do Norte/Nordeste e uma rádio de reggae de São Luís
 * (MA). Cada stream foi conferido por requisição HTTP direta em 03/10/2026
 * (bytes de áudio MP3/AAC, não só status 200); as da Venezuela e de Gurupá/
 * Voz Popular/Reggae saíram pelo agregador radio.garden. A data do acervo
 * subiu para 2026-10-03.
 */

/** Categoria funcional da estação — é o filtro principal da página. */
export type TipoRadio = "federal" | "universitaria" | "comunitaria" | "popular";

/**
 * Região de listagem — segundo eixo de filtro.
 *
 * O Brasil está subdividido nas cinco regiões do país (pedido do dono,
 * 02/10/2026): as nacionais e as universitárias passam a ser lidas por
 * região, não num bloco único "Brasil". O resto do mundo continua por
 * macro-região. A ordem dos literais espelha o IBGE (ver `ORDEM_REGIOES`).
 */
export type RegiaoRadio =
  | "Norte"
  | "Nordeste"
  | "Sudeste"
  | "Sul"
  | "Centro-Oeste"
  | "America Latina"
  | "Africa"
  | "Asia e Caribe";

/** Formato do stream, que decide como o player carrega o áudio. */
export type FormatoRadio = "mp3" | "aac" | "ogg" | "hls";

/** Uma estação de rádio publicada pelo portal. */
export interface EstacaoRadio {
  /** Identificador estável, usado nos eventos `cp:radio-tocar`. */
  id: string;
  /** Nome público da emissora. */
  nome: string;
  /** Categoria funcional (federal, universitária, comunitária, popular). */
  tipo: TipoRadio;
  /** Região do mundo. */
  regiao: RegiaoRadio;
  /** Código ISO 3166-1 alfa-2 do país (ex.: "BR", "CU"). */
  pais: string;
  /** Nome do país em português. */
  paisNome: string;
  /** Unidade federativa (só Brasil). */
  uf?: string;
  /** Cidade-sede da emissora. */
  cidade?: string;
  /** Frequência ou banda, quando a fonte informa. */
  frequencia?: string;
  /** O que a rádio toca — a "programação musical", em uma linha. */
  programacao: string;
  /** Uma frase de contexto cívico, sem juízo de valor. */
  descricao: string;
  /** URL HTTPS do stream de áudio (verificado). */
  stream: string;
  /** Formato do stream. */
  formato: FormatoRadio;
  /** Página oficial da emissora (fonte linkável, AGENTS § 8.1). */
  site: string;
  /** Ícone/favicon oficial (hotlink). Sem isto, cai no monograma. */
  logo?: string;
  /** Agregador de referência por onde a estação foi localizada. */
  fonteAgregador: string;
  /** `true` se o stream aceita CORS e a estação fala (permite transcrição). */
  transcrevivel: boolean;
  /** Data (AAAA-MM-DD) em que stream e fonte foram conferidos. */
  verificadoEm: string;
}

/**
 * Data única da última conferência do acervo inteiro. Subiu para 2026-10-03
 * com a ampliação (Venezuela, Norte/Nordeste e reggae do Maranhão); é a data
 * que a página exibe como "streams de ...".
 */
export const RADIO_VERIFICADO_EM = "2026-10-03";

/**
 * Acervo curado. O recorte é deliberado: menos grande mídia comercial, mais
 * rádio pública, universitária, comunitária e do Sul Global — com programação
 * musical. Ver `docs/06-fontes/FONTES.md` para o registro da coleta.
 */
export const ESTACOES: readonly EstacaoRadio[] = [
  // ─── Brasil · federais (públicas, fala — transcrevíveis) ───────────────
  {
    id: "radio-nacional-rio",
    nome: "Rádio Nacional do Rio de Janeiro",
    tipo: "federal",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "RJ",
    cidade: "Rio de Janeiro",
    frequencia: "1130 AM",
    programacao: "MPB, samba, jornalismo e esporte",
    descricao:
      "Rádio pública da EBC, no ar desde 1936; serviço ao cidadão e música brasileira.",
    stream:
      "https://radionacionalrio-stream.ebc.com.br/ebc/radionacionalriodejaneiro/playlist.m3u8",
    formato: "hls",
    site: "https://radionacional.ebc.com.br/",
    logo: "https://radionacional.ebc.com.br/favicon.ico",
    fonteAgregador: "radio-browser.info",
    transcrevivel: true,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-nacional-amazonia",
    nome: "Rádio Nacional da Amazônia",
    tipo: "federal",
    regiao: "Norte",
    pais: "BR",
    paisNome: "Brasil",
    cidade: "Brasília",
    frequencia: "6180 kHz (onda curta)",
    programacao: "Jornalismo, música regional e cidadania",
    descricao:
      "Leva informação e serviço às comunidades ribeirinhas e rurais da Amazônia.",
    stream:
      "https://radionacionalamazonia-stream.ebc.com.br/ebc/radionacionalamazonia/playlist.m3u8",
    formato: "hls",
    site: "https://radionacional.ebc.com.br/",
    logo: "https://radionacional.ebc.com.br/favicon.ico",
    fonteAgregador: "radio-browser.info",
    transcrevivel: true,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-nacional-brasilia",
    nome: "Rádio Nacional de Brasília",
    tipo: "federal",
    regiao: "Centro-Oeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "DF",
    cidade: "Brasília",
    frequencia: "96.1 FM",
    programacao: "MPB, jornalismo e prestação de serviço",
    descricao: "Emissora pública da EBC na capital federal.",
    stream:
      "https://radionacionalfm-stream.ebc.com.br/ebc/radionacionalfm/playlist.m3u8",
    formato: "hls",
    site: "https://radionacional.ebc.com.br/",
    logo: "https://radionacional.ebc.com.br/favicon.ico",
    fonteAgregador: "radio-browser.info",
    transcrevivel: true,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-nacional-alto-solimoes",
    nome: "Rádio Nacional do Alto Solimões",
    tipo: "federal",
    regiao: "Norte",
    pais: "BR",
    paisNome: "Brasil",
    uf: "AM",
    cidade: "Tabatinga",
    frequencia: "670 kHz",
    programacao: "Jornalismo regional e cultura amazônica",
    descricao:
      "Emissora pública da EBC na tríplice fronteira Brasil, Colômbia e Peru.",
    stream:
      "https://radionacionalaltosolimoes-stream.ebc.com.br/ebc/radionacionalaltosolimoes/playlist.m3u8",
    formato: "hls",
    site: "https://radionacional.ebc.com.br/",
    logo: "https://radionacional.ebc.com.br/favicon.ico",
    fonteAgregador: "radio-browser.info",
    transcrevivel: true,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-mec-fm",
    nome: "Rádio MEC FM",
    tipo: "federal",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "RJ",
    cidade: "Rio de Janeiro",
    // 99,3 MHz no Rio (EBC, radiomec.ebc.com.br/sobre — conferido em
    // 02/10/2026; a ficha trazia "98.9 FM", número errado corrigido).
    frequencia: "99.3 FM",
    programacao: "Música clássica, instrumental e jazz",
    descricao:
      "Rádio pública da EBC dedicada à música de concerto e à cultura.",
    stream:
      "https://radiomecfm-stream.ebc.com.br/ebc/radiomecfm/playlist.m3u8",
    formato: "hls",
    site: "https://radiomec.ebc.com.br/",
    logo: "https://radiomec.ebc.com.br/favicon.ico",
    fonteAgregador: "radio-browser.info",
    transcrevivel: true,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-mec-am",
    nome: "Rádio MEC AM",
    tipo: "federal",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "RJ",
    cidade: "Rio de Janeiro",
    frequencia: "800 AM",
    programacao: "Música, educação e radiodramaturgia",
    descricao:
      "A mais antiga emissora do Brasil (1923), hoje gerida pela EBC.",
    stream: "https://radiomec-stream.ebc.com.br/ebc/radiomec/playlist.m3u8",
    formato: "hls",
    site: "https://radiomec.ebc.com.br/",
    logo: "https://radiomec.ebc.com.br/favicon.ico",
    fonteAgregador: "radio-browser.info",
    transcrevivel: true,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-camara",
    nome: "Rádio Câmara",
    tipo: "federal",
    regiao: "Centro-Oeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "DF",
    cidade: "Brasília",
    frequencia: "96.9 FM",
    programacao: "Jornalismo legislativo e música brasileira",
    descricao:
      "Emissora da Câmara dos Deputados; acompanha o trabalho legislativo.",
    stream: "https://stream3.camara.gov.br/radiocamara1t64/manifest.m3u8",
    formato: "hls",
    site: "https://www.camara.leg.br/radio/",
    logo: "https://www.camara.leg.br/favicon.ico",
    fonteAgregador: "radio-browser.info",
    transcrevivel: true,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-senado",
    nome: "Rádio Senado",
    tipo: "federal",
    regiao: "Centro-Oeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "DF",
    cidade: "Brasília",
    frequencia: "91.9 FM",
    programacao: "Jornalismo legislativo e música",
    descricao:
      "Emissora do Senado Federal; cobre votações, comissões e audiências.",
    stream: "https://www12.senado.leg.br/radiosenado/fmaac/playlist.m3u8",
    formato: "hls",
    site: "https://www12.senado.leg.br/radiosenado",
    fonteAgregador: "radio-browser.info",
    transcrevivel: true,
    verificadoEm: RADIO_VERIFICADO_EM,
  },

  // ─── Brasil · universitárias ───────────────────────────────────────────
  {
    id: "radio-ufmg-educativa",
    nome: "Rádio UFMG Educativa",
    tipo: "universitaria",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "MG",
    cidade: "Belo Horizonte",
    frequencia: "104.5 FM",
    programacao: "Música brasileira, cultura e educação",
    descricao:
      "Emissora da Universidade Federal de Minas Gerais, ligada à formação cidadã.",
    stream: "https://www3.ufmg.br/streamingradioaovivo/aovivo.mp3",
    formato: "mp3",
    site: "https://www.ufmg.br/comunicacao/radio-ufmg-educativa/",
    logo: "https://www.ufmg.br/favicon.ico",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufrj",
    nome: "Rádio UFRJ",
    tipo: "universitaria",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "RJ",
    cidade: "Rio de Janeiro",
    programacao: "Música, ciência e cultura",
    descricao: "Emissora da Universidade Federal do Rio de Janeiro.",
    stream: "https://servidor21.brlogic.com:7712/live",
    formato: "mp3",
    site: "https://radio.ufrj.br/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-usp",
    nome: "Rádio USP",
    tipo: "universitaria",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "SP",
    cidade: "São Paulo",
    frequencia: "93.7 FM",
    programacao: "Música clássica, jazz e cultura",
    descricao: "Emissora da Universidade de São Paulo.",
    stream: "https://flow.emm.usp.br:8008/radiousp-128.mp3",
    formato: "mp3",
    site: "https://www.radio.usp.br/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufvjm",
    nome: "Rádio Universitária 99.7 FM (UFVJM)",
    tipo: "universitaria",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "MG",
    cidade: "Diamantina",
    frequencia: "99.7 FM",
    programacao: "Música, cultura regional e extensão",
    descricao:
      "Emissora da Universidade Federal dos Vales do Jequitinhonha e Mucuri, no Alto Jequitinhonha.",
    stream: "https://radio.garden/api/ara/content/listen/NBaC2vIa/channel.mp3",
    formato: "mp3",
    site: "https://radio.garden/listen/radio-universitaria-99-7-fm-ufvjm/NBaC2vIa",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufop",
    nome: "Rádio UFOP 103.5 FM",
    tipo: "universitaria",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "MG",
    cidade: "Mariana",
    frequencia: "103.5 FM",
    programacao: "Música, cultura e jornalismo universitário",
    descricao: "Emissora da Universidade Federal de Ouro Preto, na região dos Inconfidentes.",
    stream: "https://radio.garden/api/ara/content/listen/Wze7tSY1/channel.mp3",
    formato: "mp3",
    site: "https://radio.garden/listen/radio-ufop-103-5-fm/Wze7tSY1",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufv",
    nome: "Rádio Universitária 100.7 FM (UFV)",
    tipo: "universitaria",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "MG",
    cidade: "Viçosa",
    frequencia: "100.7 FM",
    programacao: "Música, educação e extensão rural",
    descricao: "Emissora da Universidade Federal de Viçosa, na Zona da Mata mineira.",
    stream: "https://radio.garden/api/ara/content/listen/pb1zPC0G/channel.mp3",
    formato: "mp3",
    site: "https://radio.garden/listen/radio-universitaria-fm-100-7/pb1zPC0G",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufu",
    nome: "Rádio Universitária 107.5 FM (UFU)",
    tipo: "universitaria",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "MG",
    cidade: "Uberlândia",
    frequencia: "107.5 FM",
    programacao: "Música, cultura e educação",
    descricao: "Emissora da Universidade Federal de Uberlândia, no Triângulo Mineiro.",
    stream: "https://servidor33.brlogic.com:7006/live",
    formato: "aac",
    site: "https://www.ufu.br/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufes",
    nome: "Universitária 104.7 FM (UFES)",
    tipo: "universitaria",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "ES",
    cidade: "Vitória",
    frequencia: "104.7 FM",
    programacao: "Música, cultura e jornalismo",
    descricao: "Emissora da Universidade Federal do Espírito Santo.",
    stream: "https://everest.radionanet.com:8990/stream",
    formato: "mp3",
    site: "https://www.ufes.br/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufg",
    nome: "Rádio Universitária UFG",
    tipo: "universitaria",
    regiao: "Centro-Oeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "GO",
    cidade: "Goiânia",
    programacao: "Música, cultura e extensão",
    descricao: "Emissora da Universidade Federal de Goiás.",
    stream: "https://streaming.ufg.br:8443/radiouniversitaria",
    formato: "aac",
    site: "https://radio.ufg.br/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufal",
    nome: "Rádio UFAL",
    tipo: "universitaria",
    regiao: "Nordeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "AL",
    cidade: "Maceió",
    programacao: "Música, cultura e educação",
    descricao: "Emissora da Universidade Federal de Alagoas.",
    stream: "https://directradios.net/proxy/ufal?mp=/stream",
    formato: "mp3",
    site: "https://www.ufal.br/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufc",
    nome: "Rádio Universitária 107.9 FM (UFC)",
    tipo: "universitaria",
    regiao: "Nordeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "CE",
    cidade: "Fortaleza",
    frequencia: "107.9 FM",
    programacao: "Música, cultura e educação",
    descricao: "Emissora da Universidade Federal do Ceará.",
    stream: "https://radio.garden/api/ara/content/listen/CB-dhyZV/channel.mp3",
    formato: "aac",
    site: "https://radio.garden/listen/radio-universitaria-fm-107-9/CB-dhyZV",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufdpar",
    nome: "Rádio Universitária UFDPar",
    tipo: "universitaria",
    regiao: "Nordeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "PI",
    cidade: "Parnaíba",
    programacao: "Música, cultura e extensão",
    descricao:
      "Emissora da Universidade Federal do Delta do Parnaíba, no litoral do Piauí.",
    stream: "https://radio.garden/api/ara/content/listen/5P4kx2Bu/channel.mp3",
    formato: "aac",
    site: "https://radio.garden/listen/radio-universitaria-ufd-par/5P4kx2Bu",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufpb",
    nome: "Universidade FM 105.1 (UFPB)",
    tipo: "universitaria",
    regiao: "Nordeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "PB",
    cidade: "Patos",
    frequencia: "105.1 FM",
    programacao: "Música, cultura e extensão",
    descricao: "Emissora da Universidade Federal da Paraíba, no sertão paraibano.",
    stream: "https://radio.garden/api/ara/content/listen/QQmPYkiU/channel.mp3",
    formato: "aac",
    site: "https://radio.garden/listen/universidade-fm-105-1/QQmPYkiU",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufpel",
    nome: "Rádio Universidade AM 1160 (UFPel)",
    tipo: "universitaria",
    regiao: "Sul",
    pais: "BR",
    paisNome: "Brasil",
    uf: "RS",
    cidade: "Pelotas",
    frequencia: "1160 AM",
    programacao: "Música, cultura e informação",
    descricao: "Emissora da Universidade Federal de Pelotas.",
    stream: "https://radio.garden/api/ara/content/listen/mycJhvB2/channel.mp3",
    formato: "aac",
    site: "https://radio.garden/listen/radio-universidade-am-1160/mycJhvB2",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufms",
    nome: "Rádio Educativa UFMS",
    tipo: "universitaria",
    regiao: "Centro-Oeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "MS",
    cidade: "Campo Grande",
    programacao: "Música, educação e cultura",
    descricao: "Emissora da Universidade Federal de Mato Grosso do Sul.",
    stream: "https://radio.garden/api/ara/content/listen/vJV74IgR/channel.mp3",
    formato: "mp3",
    site: "https://radio.garden/listen/radio-educativa-ufms/vJV74IgR",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufscar",
    nome: "Rádio UFSCar 95.3 FM",
    tipo: "universitaria",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "SP",
    cidade: "São Carlos",
    frequencia: "95.3 FM",
    programacao: "Música, ciência e cultura",
    descricao: "Emissora da Universidade Federal de São Carlos.",
    stream: "https://radio.garden/api/ara/content/listen/d8BXRQos/channel.mp3",
    formato: "ogg",
    site: "https://radio.garden/listen/radio-ufs-car-95-3-fm/d8BXRQos",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufcg",
    nome: "Web Rádio UFCG Conecta",
    tipo: "universitaria",
    regiao: "Nordeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "PB",
    cidade: "Campina Grande",
    programacao: "Música, cultura e produção estudantil",
    descricao: "Web rádio da Universidade Federal de Campina Grande.",
    stream: "https://radio.garden/api/ara/content/listen/UufypBoG/channel.mp3",
    formato: "aac",
    site: "https://radio.garden/listen/web-radio-ufcg-conecta/UufypBoG",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-uff",
    nome: "Rádio Pop Goiaba (UFF)",
    tipo: "universitaria",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "RJ",
    cidade: "Niterói",
    programacao: "Música independente e produção estudantil",
    descricao: "Rádio da Universidade Federal Fluminense, feita no curso de Comunicação.",
    stream: "https://radio.garden/api/ara/content/listen/tTxCph6T/channel.mp3",
    formato: "mp3",
    site: "https://radio.garden/listen/radio-pop-goiaba-uff/tTxCph6T",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-udesc",
    nome: "Rádio UDESC FM 100.1",
    tipo: "universitaria",
    regiao: "Sul",
    pais: "BR",
    paisNome: "Brasil",
    uf: "SC",
    cidade: "Florianópolis",
    frequencia: "100.1 FM",
    programacao: "Música, cultura e extensão",
    descricao: "Emissora da Universidade do Estado de Santa Catarina.",
    stream: "https://radio.garden/api/ara/content/listen/OoNClJ3c/channel.mp3",
    formato: "aac",
    site: "https://radio.garden/listen/radio-udesc-fm-100-1/OoNClJ3c",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-ufabc",
    nome: "Web Rádio UFABC",
    tipo: "universitaria",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "SP",
    cidade: "Santo André",
    programacao: "Música e produção universitária",
    descricao: "Web rádio da Universidade Federal do ABC.",
    stream: "https://radio.garden/api/ara/content/listen/2w6sZC7l/channel.mp3",
    formato: "mp3",
    site: "https://radio.garden/listen/web-radio-ufabc-electronic-mix/2w6sZC7l",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-uel",
    nome: "UEL FM 107.9",
    tipo: "universitaria",
    regiao: "Sul",
    pais: "BR",
    paisNome: "Brasil",
    uf: "PR",
    cidade: "Londrina",
    frequencia: "107.9 FM",
    programacao: "Música, jornalismo e cultura",
    descricao: "Emissora da Universidade Estadual de Londrina.",
    stream: "https://radio.garden/api/ara/content/listen/Ugy0RBwG/channel.mp3",
    formato: "mp3",
    site: "https://radio.garden/listen/uel-fm-107-9/Ugy0RBwG",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },

  // ─── Brasil · comunitárias e populares ─────────────────────────────────
  {
    id: "radio-favela",
    nome: "Autêntica Favela FM (Rádio Favela)",
    tipo: "comunitaria",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "MG",
    cidade: "Belo Horizonte",
    frequencia: "106.7 FM",
    programacao: "Funk, rap, samba e música periférica",
    descricao:
      "Nasceu em 1981 no Aglomerado da Serra; é uma das rádios comunitárias " +
      "mais conhecidas do Brasil.",
    stream: "https://radio.garden/api/ara/content/listen/9nuoTjkL/channel.mp3",
    formato: "mp3",
    site: "https://www.autenticafavelafm106-7.com",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-brasil-de-fato",
    nome: "Rádio Brasil de Fato",
    tipo: "comunitaria",
    regiao: "Sudeste",
    pais: "BR",
    paisNome: "Brasil",
    cidade: "Nacional",
    programacao: "Jornalismo popular, cultura e música",
    descricao:
      "Rádio do veículo de comunicação popular Brasil de Fato; já tocava no portal.",
    stream: "https://s09.hstbr.net:8238/live",
    formato: "mp3",
    site: "https://www.brasildefato.com.br/",
    logo: "https://www.brasildefato.com.br/favicon.ico",
    fonteAgregador: "radios.com.br",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },

  // ─── América Latina ────────────────────────────────────────────────────
  {
    id: "radio-rebelde",
    nome: "Radio Rebelde",
    tipo: "popular",
    regiao: "America Latina",
    pais: "CU",
    paisNome: "Cuba",
    cidade: "Havana",
    frequencia: "96.7 FM",
    programacao: "Música cubana, son, notícias",
    descricao: "Emissora pública cubana, fundada em 1958 na Sierra Maestra.",
    stream: "https://icecast.teveo.cu/kHKL7tWd",
    formato: "mp3",
    site: "https://www.radiorebelde.cu/",
    logo: "https://www.radiorebelde.cu/favicon.ico",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-nacional-argentina",
    nome: "LRA1 Radio Nacional Argentina",
    tipo: "popular",
    regiao: "America Latina",
    pais: "AR",
    paisNome: "Argentina",
    cidade: "Buenos Aires",
    frequencia: "870 AM",
    programacao: "Jornalismo, tango e folclore",
    descricao: "Emissora pública argentina, a mais antiga do país (1937).",
    stream: "https://sa.mp3.icecast.magma.edge-access.net/sc_rad1",
    formato: "mp3",
    site: "https://www.radionacional.com.ar/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "fm-la-tribu",
    nome: "FM La Tribu",
    tipo: "comunitaria",
    regiao: "America Latina",
    pais: "AR",
    paisNome: "Argentina",
    cidade: "Buenos Aires",
    frequencia: "88.7 FM",
    programacao: "Música independente e cultura livre",
    descricao:
      "Rádio comunitária cooperativa de Buenos Aires, referência de mídia livre.",
    stream: "https://icecast.zeclogiccloud.com.de/fmlatribu",
    formato: "mp3",
    site: "https://fmlatribu.com/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-cuyum",
    nome: "Radio Comunitaria Cuyum",
    tipo: "comunitaria",
    regiao: "America Latina",
    pais: "AR",
    paisNome: "Argentina",
    cidade: "Mendoza",
    programacao: "Comunicação popular e música",
    descricao: "Emissora comunitária da rede Liberaturadio, em Mendoza.",
    stream: "https://radios.liberaturadio.org/Cuyum",
    formato: "mp3",
    site: "https://radios.liberaturadio.org/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-yaravi",
    nome: "Radio Yaraví",
    tipo: "comunitaria",
    regiao: "America Latina",
    pais: "PE",
    paisNome: "Peru",
    cidade: "Arequipa",
    frequencia: "107.7 FM",
    programacao: "Música andina, cumbia e cultura",
    descricao: "Emissora popular de Arequipa, com programação andina.",
    stream: "https://tupanel.info/stream/radioyaravi/stream",
    formato: "aac",
    site: "https://www.radioyaravi.com/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-cumbia-mix",
    nome: "Radio Cumbia Mix",
    tipo: "popular",
    regiao: "America Latina",
    pais: "PE",
    paisNome: "Peru",
    cidade: "Lima",
    programacao: "Cumbia, chicha e música tropical",
    descricao: "Rádio peruana dedicada à cumbia e à música tropical.",
    stream: "https://mdstrm.com/audio/6598b6ab95a235085823b24f/icecast.audio",
    formato: "aac",
    site: "https://radiocumbiamix.com/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },

  // ─── África ────────────────────────────────────────────────────────────
  {
    id: "lm-radio-mocambique",
    nome: "LM Radio Moçambique",
    tipo: "popular",
    regiao: "Africa",
    pais: "MZ",
    paisNome: "Moçambique",
    cidade: "Maputo",
    frequencia: "105.0 FM",
    programacao: "Música moçambicana, marrabenta e jornalismo",
    descricao: "Emissora moçambicana com música local e informação.",
    stream: "https://edge.iono.fm/xice/392_medium.mp3",
    formato: "mp3",
    site: "https://lmradio.co.mz/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "timtimol-fm",
    nome: "Timtimol FM",
    tipo: "comunitaria",
    regiao: "Africa",
    pais: "SN",
    paisNome: "Senegal",
    cidade: "Ourossogui",
    frequencia: "91.9 FM",
    programacao: "Música africana, mbalax e informação comunitária",
    descricao: "Rádio comunitária do norte do Senegal.",
    stream: "https://stream.zeno.fm/4yx608hnu1duv",
    formato: "mp3",
    site: "https://zeno.fm/radio/timtimol-fm/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "oroko-radio",
    nome: "Oroko Radio",
    tipo: "comunitaria",
    regiao: "Africa",
    pais: "GH",
    paisNome: "Gana",
    cidade: "Acra",
    programacao: "Afrobeat, música africana e eletrônica",
    descricao: "Rádio independente de Acra, plataforma de música africana.",
    stream: "https://oroko-radio.radiocult.fm/stream",
    formato: "mp3",
    site: "https://oroko-radio.radiocult.fm/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "helderberg-fm",
    nome: "Helderberg FM",
    tipo: "comunitaria",
    regiao: "Africa",
    pais: "ZA",
    paisNome: "África do Sul",
    cidade: "Somerset West",
    frequencia: "93.9 FM",
    programacao: "Música e programação comunitária",
    descricao: "Rádio comunitária da região do Cabo Ocidental.",
    stream: "https://helderberg.highquality.radiostream.co.za/",
    formato: "mp3",
    site: "https://www.helderbergfm.co.za/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "lagosjump-radio",
    nome: "LagosJump Radio",
    tipo: "popular",
    regiao: "Africa",
    pais: "NG",
    paisNome: "Nigéria",
    cidade: "Lagos",
    programacao: "Afrobeats e música africana",
    descricao: "Rádio nigeriana de música afro contemporânea.",
    stream:
      "https://radio.lagosjumpradio.com/listen/lagosjump_radio/radio.mp3",
    formato: "mp3",
    site: "https://lagosjumpradio.com/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },

  // ─── Ásia e Caribe ─────────────────────────────────────────────────────
  {
    id: "radio-alhara",
    nome: "Radio Al Hara",
    tipo: "comunitaria",
    regiao: "Asia e Caribe",
    pais: "PS",
    paisNome: "Palestina",
    cidade: "Ramallah",
    programacao: "Música árabe, música livre e cultura",
    descricao:
      "Rádio independente palestina, com programação musical e cultural.",
    stream: "https://n02.radiojar.com/78cxy6wkxtzuv",
    formato: "mp3",
    site: "https://www.radioalhara.net/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "irie-fm",
    nome: "Irie FM",
    tipo: "popular",
    regiao: "Asia e Caribe",
    pais: "JM",
    paisNome: "Jamaica",
    cidade: "Ocho Rios",
    frequencia: "105.1 FM",
    programacao: "Reggae, dancehall e cultura jamaicana",
    descricao: "Emissora jamaicana dedicada ao reggae.",
    stream: "https://stream.iriefm.net:8008/stream",
    formato: "mp3",
    site: "https://iriefm.net/",
    logo: "https://iriefm.net/favicon.ico",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  // ─── Ampliação de 03/10/2026: Venezuela, Norte/Nordeste e reggae do MA ───
  // Venezuela — rede Fe y Alegría (educação popular). A origem (ALER/Fe y
  // Alegría) só fala HTTP e a página é HTTPS; por isso o stream sai pelo
  // proxy do radio.garden, que também é HTTPS. Cada URL foi conferida por
  // requisição direta em 03/10/2026 (bytes de áudio MP3, não só status 200).
  {
    id: "fe-y-alegria-puerto-la-cruz",
    nome: "Fe y Alegría Puerto La Cruz 101.3 FM",
    tipo: "comunitaria",
    regiao: "America Latina",
    pais: "VE",
    paisNome: "Venezuela",
    cidade: "Puerto La Cruz",
    frequencia: "101.3 FM",
    programacao: "Educação popular e programação comunitária",
    descricao: "Emissora da rede Fe y Alegría, de educação popular na Venezuela.",
    stream: "https://radio.garden/api/ara/content/listen/6L79J6xl/channel.mp3",
    formato: "mp3",
    site: "https://radios.feyalegrianoticias.com/puerto-la-cruz/",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "fe-y-alegria-maracaibo",
    nome: "Fe y Alegría Maracaibo 88.1 FM",
    tipo: "comunitaria",
    regiao: "America Latina",
    pais: "VE",
    paisNome: "Venezuela",
    cidade: "Maracaibo",
    frequencia: "88.1 FM",
    programacao: "Educação popular e programação comunitária",
    descricao: "Emissora da rede Fe y Alegría, de educação popular na Venezuela.",
    stream: "https://radio.garden/api/ara/content/listen/oynXOcov/channel.mp3",
    formato: "mp3",
    site: "https://radios.feyalegrianoticias.com/maracaibo-fm/",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-folclorllanero",
    nome: "Radio Folclorllanero",
    tipo: "popular",
    regiao: "America Latina",
    pais: "VE",
    paisNome: "Venezuela",
    programacao: "Joropo, música llanera e folclore venezuelano",
    descricao: "Rádio dedicada ao joropo e à música llanera da Venezuela.",
    stream: "https://stream.zeno.fm/hcvjvmprjveuv",
    formato: "mp3",
    site: "https://www.radiofolclorllanero.com/",
    fonteAgregador: "radio-browser.info",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  // Brasil — duas comunitárias do Norte/Nordeste e o reggae de São Luís (MA).
  {
    id: "radio-comunitaria-gurupa",
    nome: "Rádio Comunitária de Gurupá 87.9 FM",
    tipo: "comunitaria",
    regiao: "Norte",
    pais: "BR",
    paisNome: "Brasil",
    uf: "PA",
    cidade: "Gurupá",
    frequencia: "87.9 FM",
    programacao: "Programação comunitária ribeirinha",
    descricao: "Rádio comunitária de Gurupá, no Marajó (PA).",
    stream: "https://radio.garden/api/ara/content/listen/BDGUBB5D/channel.mp3",
    formato: "mp3",
    site: "https://radiocomunitariagurupa87.minharadio.fm",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "radio-comunitaria-voz-popular",
    nome: "Rádio Comunitária Voz Popular",
    tipo: "comunitaria",
    regiao: "Nordeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "PB",
    cidade: "João Pessoa",
    programacao: "Programação comunitária e popular",
    descricao: "Rádio comunitária do Instituto Voz Popular, na Paraíba.",
    stream: "https://radio.garden/api/ara/content/listen/19QyXe1G/channel.mp3",
    formato: "mp3",
    site: "https://institutovozpopular.webnode.page",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
  {
    id: "portal-roots-reggae",
    nome: "Portal Roots Reggae",
    tipo: "popular",
    regiao: "Nordeste",
    pais: "BR",
    paisNome: "Brasil",
    uf: "MA",
    cidade: "São Luís",
    programacao: "Reggae, dancehall e cultura jamaicana",
    descricao: "Rádio de reggae de São Luís (MA), capital do reggae brasileiro.",
    stream: "https://radio.garden/api/ara/content/listen/xTBSA1nh/channel.mp3",
    formato: "mp3",
    site: "https://portalradiorootsreggae.blogspot.com",
    fonteAgregador: "radio.garden",
    transcrevivel: false,
    verificadoEm: RADIO_VERIFICADO_EM,
  },
];

/** Rótulos de exibição das categorias. */
export const ROTULO_TIPO: Record<TipoRadio, string> = {
  federal: "Pública federal",
  universitaria: "Universitária",
  comunitaria: "Comunitária",
  // "Independente" virou adjetivo, não categoria (pedido do dono, 02/10/2026):
  // sobram só comunitária e popular como tipos editoriais de fora do eixo público.
  popular: "Popular",
};

/** Rótulos de exibição das regiões. */
export const ROTULO_REGIAO: Record<RegiaoRadio, string> = {
  Norte: "Norte",
  Nordeste: "Nordeste",
  Sudeste: "Sudeste",
  Sul: "Sul",
  "Centro-Oeste": "Centro-Oeste",
  "America Latina": "América Latina",
  Africa: "África",
  "Asia e Caribe": "Ásia e Caribe",
};

/** Ordem canônica das categorias (a página respeita esta ordem). */
export const ORDEM_TIPOS: readonly TipoRadio[] = [
  "federal",
  "universitaria",
  "comunitaria",
  "popular",
];

/** Regiões do Brasil, na ordem do IBGE — usado nos cartões de resumo. */
export const REGIOES_BRASIL: readonly RegiaoRadio[] = [
  "Norte",
  "Nordeste",
  "Sudeste",
  "Sul",
  "Centro-Oeste",
];

/** Ordem canônica das regiões (Brasil primeiro, depois o mundo). */
export const ORDEM_REGIOES: readonly RegiaoRadio[] = [
  ...REGIOES_BRASIL,
  "America Latina",
  "Africa",
  "Asia e Caribe",
];

/**
 * Bandeira do país a partir do código ISO-3166-1 alfa-2.
 *
 * Truque dos "regional indicator symbols": a bandeira é formada por duas
 * letras maiúsculas deslocadas para o bloco Unicode U+1F1E6. É texto, não
 * imagem — funciona offline e não pesa no repositório.
 */
export function bandeiraDe(iso: string): string {
  const codigo = iso.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(codigo)) return "🏳️";
  const BASE = 0x1f1e6; // 'A'
  const A = "A".charCodeAt(0);
  return (
    String.fromCodePoint(BASE + (codigo.charCodeAt(0) - A)) +
    String.fromCodePoint(BASE + (codigo.charCodeAt(1) - A))
  );
}

/**
 * URL da bandeira do país como IMAGEM SVG (flagcdn.com).
 *
 * Por que existe: o truque dos "regional indicator symbols" do `bandeiraDe`
 * é texto Unicode, e o **Windows não desenha esse bloco** — a bandeira sai
 * como as duas letras (`BR` em vez de 🇧🇷). O site é lido por muita gente
 * nesse sistema, então a renderização passa a ser imagem.
 *
 * O `pais` (ISO-3166-1 alfa-2) já existe em cada estação; esta função só
 * traduz para a URL. Devolve `null` quando o código é inválido, para o
 * componente decidir se omite a imagem em vez de pedir um recurso quebrado.
 * A bandeira continua sendo do país; a imagem é servida pelo `flagcdn.com`,
 * um CDN público de bandeiras de domínio público.
 */
export function urlBandeira(iso: string): string | null {
  const codigo = iso.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(codigo)) return null;
  return `https://flagcdn.com/${codigo}.svg`;
}

/**
 * Nome de cada estado brasileiro por UF — o `alt`/`title` da bandeira
 * estadual e qualquer rótulo que precise do nome por extenso.
 */
export const NOME_ESTADO: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

/**
 * Arquivo da bandeira de cada estado no Wikimedia Commons (underscore = espaço).
 *
 * Pedido do dono (02/10/2026): a bandeira do estado ao lado da do país no
 * card de estação brasileira. Os 27 títulos foram conferidos um a um pela
 * API do Commons em 02/10/2026 — os nomes são irregulares ("de Goiás",
 * "do estado de São Paulo", "do Distrito Federal (Brasil)"), então o
 * caminho é dado, nunca adivinhado: título errado vira 404 silencioso.
 */
export const BANDEIRA_ESTADO_ARQUIVO: Record<string, string> = {
  AC: "Bandeira_do_Acre.svg",
  AL: "Bandeira_de_Alagoas.svg",
  AP: "Bandeira_do_Amapá.svg",
  AM: "Bandeira_do_Amazonas.svg",
  BA: "Bandeira_da_Bahia.svg",
  CE: "Bandeira_do_Ceará.svg",
  DF: "Bandeira_do_Distrito_Federal_(Brasil).svg",
  ES: "Bandeira_do_Espírito_Santo.svg",
  GO: "Bandeira_de_Goiás.svg",
  MA: "Bandeira_do_Maranhão.svg",
  MT: "Bandeira_de_Mato_Grosso.svg",
  MS: "Bandeira_de_Mato_Grosso_do_Sul.svg",
  MG: "Bandeira_de_Minas_Gerais.svg",
  PA: "Bandeira_do_Pará.svg",
  PB: "Bandeira_da_Paraíba.svg",
  PR: "Bandeira_do_Paraná.svg",
  PE: "Bandeira_de_Pernambuco.svg",
  PI: "Bandeira_do_Piauí.svg",
  RJ: "Bandeira_do_estado_do_Rio_de_Janeiro.svg",
  RN: "Bandeira_do_Rio_Grande_do_Norte.svg",
  RS: "Bandeira_do_Rio_Grande_do_Sul.svg",
  RO: "Bandeira_de_Rondônia.svg",
  RR: "Bandeira_de_Roraima.svg",
  SC: "Bandeira_de_Santa_Catarina.svg",
  SP: "Bandeira_do_estado_de_São_Paulo.svg",
  SE: "Bandeira_de_Sergipe.svg",
  TO: "Bandeira_do_Tocantins.svg",
};

/**
 * URL da bandeira do ESTADO como imagem (Wikimedia Commons, PNG 40 px).
 *
 * `Special:FilePath/<arquivo>?width=` redireciona para o PNG renderizado do
 * SVG — medido `200 image/png` em 02/10/2026 para Acre, São Paulo e Distrito
 * Federal. O `?width` dá resolução para tela retina no card (14 px lógicos).
 * Devolve `null` para UF desconhecida: o componente omite a imagem em vez
 * de servir link quebrado (mesma disciplina do `urlBandeira`).
 */
export function urlBandeiraEstado(uf?: string): string | null {
  const arquivo = uf
    ? BANDEIRA_ESTADO_ARQUIVO[uf.trim().toUpperCase()]
    : undefined;
  if (!arquivo) return null;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    arquivo,
  )}?width=40`;
}

/** Busca uma estação pelo id (undefined se não existir). */
export function estacaoPorId(id: string): EstacaoRadio | undefined {
  return ESTACOES.find((e) => e.id === id);
}

/** Agregados medidos do acervo — os cartões de topo leem daqui, nunca à mão. */
export interface ResumoRadio {
  total: number;
  paises: number;
  /** Estações sediadas no Brasil (soma das cinco regiões do país). */
  brasil: number;
  federais: number;
  universitarias: number;
  comunitarias: number;
  popularres: number;
  transcreviveis: number;
  porRegiao: { regiao: RegiaoRadio; total: number }[];
  porPais: { pais: string; paisNome: string; bandeira: string; total: number }[];
}

/** Calcula os agregados a partir do acervo (puro, testável). */
export function resumirEstacoes(
  estacoes: readonly EstacaoRadio[] = ESTACOES,
): ResumoRadio {
  const contagemPais = new Map<string, { paisNome: string; total: number }>();
  const contagemRegiao = new Map<RegiaoRadio, number>();

  for (const e of estacoes) {
    const p = contagemPais.get(e.pais) ?? { paisNome: e.paisNome, total: 0 };
    p.total += 1;
    contagemPais.set(e.pais, p);
    contagemRegiao.set(e.regiao, (contagemRegiao.get(e.regiao) ?? 0) + 1);
  }

  return {
    total: estacoes.length,
    paises: contagemPais.size,
    // Contado pelo `pais`, não pela soma das regiões: o número é o do país,
    // independente de como o acervo vier a agrupar regiões no futuro.
    brasil: estacoes.filter((e) => e.pais === "BR").length,
    federais: estacoes.filter((e) => e.tipo === "federal").length,
    universitarias: estacoes.filter((e) => e.tipo === "universitaria").length,
    comunitarias: estacoes.filter((e) => e.tipo === "comunitaria").length,
    popularres: estacoes.filter((e) => e.tipo === "popular").length,
    transcreviveis: estacoes.filter((e) => e.transcrevivel).length,
    porRegiao: ORDEM_REGIOES.map((regiao) => ({
      regiao,
      total: contagemRegiao.get(regiao) ?? 0,
    })),
    porPais: [...contagemPais.entries()]
      .map(([pais, v]) => ({
        pais,
        paisNome: v.paisNome,
        bandeira: bandeiraDe(pais),
        total: v.total,
      }))
      .sort((a, b) => b.total - a.total || a.paisNome.localeCompare(b.paisNome, "pt-BR")),
  };
}
