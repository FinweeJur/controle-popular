/**
 * O catálogo de destinos do assistente de navegação: para onde o portal
 * sabe levar alguém, e com que palavras a pessoa pede cada lugar.
 *
 * ═══ POR QUE ELE É UMA CONSTANTE DE MÓDULO, E NUNCA UMA PROP ═══
 *
 * Este arquivo é importado DIRETO pelo componente de cliente
 * (`app/assistente/AssistenteNavegacao.tsx`), nunca passado pela página
 * como prop. A diferença não é estilo, é o teto de 25 MiB por asset do
 * Cloudflare Workers, e ela já travou um deploy: `docs/HANDOFF-PAYLOAD-
 * LEGISLACAO.md` mede `/ambiental/legislacao` entregando o corpus como
 * prop de componente de cliente e gerando um `.cache` de 35,5 MiB a partir
 * de 4,7 MiB de texto real — **7,5× de inflação**, porque o payload vai
 * embutido DUAS vezes (HTML e RSC flight) e cada linha repete o nome de
 * todos os campos.
 *
 * Constante importada por um módulo `"use client"` não paga nada disso:
 * entra UMA vez no chunk JS, minificada e servida com gzip, e não aparece
 * no `.cache` da rota. É o mesmo motivo pelo qual `CIDADES_DO_BUILD`
 * (`lib/db/cidades-do-build.ts`) é módulo e não prop.
 *
 * ═══ POR QUE O CATÁLOGO NÃO SAI DO ÍNDICE DA `/busca` ═══
 *
 * O plano (`docs/PLANO-2026-08-15.md`, N8) supunha que "a lista de rotas e
 * municípios já existe no índice estático da `/busca`". Ela existe lá, mas
 * misturada a 8.979 DOCUMENTOS. O tamanho medido daquele índice, registrado
 * no commit `1ce7f77` contra o Postgres local: docs 3.614 KB + vocabulário
 * 1.188 KB + formas 264 KB = **~5,0 MB não comprimidos**, e o vocabulário
 * cresceu depois (11.561 → 31.375 lexemas, commit `b086743`).
 *
 * Baixar 5 MB para descobrir que "saúde em BH" é `/bh/saude` seria pagar o
 * acervo inteiro por uma tabela de rotas. O catálogo abaixo faz esse
 * trabalho com 241 destinos derivados de 6 cidades × 33 sufixos + 43
 * rotas gerais, e cabe no chunk. O índice da `/busca` continua sendo o
 * caminho certo para procurar DOCUMENTO — e é por isso que ele é carregado
 * sob demanda, e só quando a pessoa pede (ver `lib/assistente/documentos.ts`).
 *
 * ═══ REGRA EDITORIAL: O ASSISTENTE NAVEGA, NÃO AFIRMA ═══
 *
 * Nenhum campo aqui guarda dado (valor, contagem, data). Só título de
 * página e caminho. Onde a resposta precisar citar algo, ela linka a
 * página — a mesma disciplina de `lib/chat-comum.ts:REGRAS_COMUNS`, que
 * proíbe o modelo de escrever número.
 */

import { CIDADES_DO_BUILD } from "@/lib/db/cidades-do-build";
import type { ZonaId } from "@/lib/zonas";

/** Um lugar do portal para onde o assistente sabe levar. */
export interface Destino {
  /** Caminho ABSOLUTO. Vai em `<a href>` cru, nunca no `<Link>` de zona —
   *  o wrapper de `lib/link-zona.tsx` prefixaria a zona atual e geraria
   *  `/congresso/bh/saude`. Mesma armadilha que o cabeçalho de
   *  `lib/zonas.ts` registra já ter acontecido três vezes. */
  href: string;
  /** O que o botão diz. É o nome da PÁGINA, não uma frase sobre o dado. */
  titulo: string;
  /** Cidade, quando o destino é de cidade. Vira o "· Betim" do botão. */
  contexto?: string;
  zona: ZonaId;
}

/**
 * Entrada crua do catálogo: um destino mais as palavras que o pedem.
 *
 * `termos` são escritos SEM acento e em minúscula de propósito — é a forma
 * que `separarPalavras()` (de `lib/busca/normalizar.ts`, a mesma função que
 * a `/busca` usa no navegador) produz a partir do que a pessoa digita.
 * Escrever "saúde" aqui criaria um termo que nunca casa, e o modo de falha
 * seria silencioso: o botão simplesmente não apareceria.
 *
 * Termo com espaço é FRASE e exige sequência contígua ("meio ambiente" não
 * casa com "ambiente meio"). É o que faz "meio ambiente" ganhar de
 * "ambiente" na ordenação, sem precisar de peso escrito à mão.
 */
export interface EntradaCatalogo {
  sufixo: string;
  titulo: string;
  termos: string[];
}

/**
 * Rotas de CIDADE, por sufixo. Expandidas por `CIDADES_DO_BUILD` (6 hoje) na
 * hora da consulta, não pré-montadas: 6 × 33 = 198 objetos que existiriam no
 * chunk sem ninguém nunca olhar a maioria. Expandir custa um laço sobre 33
 * entradas por consulta — medido abaixo de 1 ms, ver `navegacao.test.ts`.
 *
 * Ficaram DE FORA, deliberadamente: `/admin` (área logada), `/zap` e
 * `/zap-betim` (fluxo de captação), `/privacidade` e `/sobre` de cidade
 * (existem em versão geral). Assistente que oferece painel administrativo
 * para quem perguntou de saúde erra o público.
 */
export const SUFIXOS_DE_CIDADE: EntradaCatalogo[] = [
  { sufixo: "", titulo: "Página inicial da cidade", termos: ["cidade", "inicio", "portal", "home"] },
  { sufixo: "/saude", titulo: "Saúde", termos: ["saude", "hospital", "posto de saude", "ubs", "sus"] },
  { sufixo: "/educacao", titulo: "Educação", termos: ["educacao", "escola", "creche", "ensino"] },
  { sufixo: "/economia", titulo: "Economia", termos: ["economia", "emprego", "renda", "pib"] },
  { sufixo: "/social", titulo: "Assistência social", termos: ["social", "assistencia social", "cras", "bolsa"] },
  { sufixo: "/seguranca", titulo: "Segurança", termos: ["seguranca", "policia", "crime", "violencia"] },
  { sufixo: "/clima", titulo: "Clima e risco", termos: ["clima", "chuva", "tempo", "temperatura", "alagamento"] },
  { sufixo: "/defesa-civil", titulo: "Defesa Civil", termos: ["defesa civil", "defesa", "sirene", "evacuacao"] },
  { sufixo: "/infraestrutura", titulo: "Infraestrutura", termos: ["infraestrutura", "obra", "obras", "asfalto", "saneamento"] },
  { sufixo: "/mineracao", titulo: "Mineração", termos: ["mineracao", "mina", "minerio", "lavra"] },
  { sufixo: "/agro", titulo: "Agropecuária", termos: ["agro", "agropecuaria", "agricultura", "rural", "lavoura"] },
  { sufixo: "/terras", titulo: "Terras e função social", termos: ["terra", "terras", "mapa", "imovel", "gleba", "fundiario"] },
  { sufixo: "/meio-ambiente", titulo: "Meio ambiente", termos: ["meio ambiente", "ambiental", "ambiente", "poluicao"] },
  { sufixo: "/meio-ambiente/autuacoes", titulo: "Autuações ambientais", termos: ["autuacao", "autuacoes", "multa ambiental", "infracao ambiental"] },
  { sufixo: "/meio-ambiente/barragens", titulo: "Barragens", termos: ["barragem", "barragens", "rejeito", "dique"] },
  { sufixo: "/prefeitura", titulo: "Prefeitura", termos: ["prefeitura", "prefeito", "executivo"] },
  { sufixo: "/prefeitura/contratos", titulo: "Contratos da Prefeitura", termos: ["contrato", "contratos", "fornecedor", "fornecedores"] },
  { sufixo: "/prefeitura/licitacoes", titulo: "Licitações", termos: ["licitacao", "licitacoes", "pregao", "edital"] },
  { sufixo: "/prefeitura/despesas", titulo: "Despesas", termos: ["despesa", "despesas", "gasto", "gastos", "orcamento"] },
  { sufixo: "/prefeitura/diarias", titulo: "Diárias", termos: ["diaria", "diarias", "viagem"] },
  { sufixo: "/prefeitura/obras", titulo: "Obras", termos: ["obra", "obras"] },
  { sufixo: "/prefeitura/servidores", titulo: "Servidores", termos: ["servidor", "servidores", "salario", "folha", "concurso"] },
  { sufixo: "/prefeitura/legislacao", titulo: "Leis municipais", termos: ["lei", "leis", "legislacao", "decreto", "norma"] },
  { sufixo: "/camara", titulo: "Câmara Municipal", termos: ["camara", "vereador", "vereadores", "legislativo"] },
  { sufixo: "/camara/proposicoes", titulo: "Proposições da Câmara", termos: ["proposicao", "proposicoes", "projeto de lei", "pl"] },
  { sufixo: "/camara/votacoes", titulo: "Votações da Câmara", termos: ["votacao", "votacoes", "voto", "votos"] },
  { sufixo: "/camara/comissoes", titulo: "Comissões da Câmara", termos: ["comissao", "comissoes"] },
  { sufixo: "/emendas", titulo: "Emendas parlamentares", termos: ["emenda", "emendas"] },
  { sufixo: "/servicos", titulo: "Serviços ao cidadão", termos: ["servico", "servicos", "atendimento", "protocolo"] },
  { sufixo: "/coleta-lixo", titulo: "Coleta de lixo", termos: ["lixo", "coleta", "reciclagem", "entulho"] },
  { sufixo: "/plantao-farmacias", titulo: "Farmácias de plantão", termos: ["farmacia", "farmacias", "plantao", "remedio"] },
  { sufixo: "/postos-combustivel", titulo: "Postos de combustível", termos: ["posto", "postos", "combustivel", "gasolina", "etanol"] },
  { sufixo: "/noticias", titulo: "Notícias", termos: ["noticia", "noticias", "imprensa"] },
];

/**
 * Rotas GERAIS — as que não têm cidade. São escritas uma a uma porque cada
 * uma tem um nome editorial próprio: derivar o título do caminho daria
 * "Funcaosocialterra", e o cabeçalho de `lib/zonas.ts` já registra por que
 * rótulo de navegação não se fabrica por cirurgia de string.
 */
export const ROTAS_GERAIS: (EntradaCatalogo & { zona: ZonaId })[] = [
  { sufixo: "/", titulo: "Início do Controle Popular", termos: ["inicio", "home", "principal", "capa"], zona: "cidades" },
  { sufixo: "/busca", titulo: "Busca no acervo", termos: ["busca", "buscar", "procurar", "pesquisar", "pesquisa"], zona: "cidades" },
  { sufixo: "/sobre", titulo: "Sobre o projeto", termos: ["sobre", "quem somos", "projeto"], zona: "cidades" },
  { sufixo: "/termos", titulo: "Termos de uso", termos: ["termo", "termos", "uso", "privacidade", "lgpd"], zona: "cidades" },
  { sufixo: "/dados/populares", titulo: "Dados populares", termos: ["dados", "dado", "base", "download"], zona: "cidades" },

  { sufixo: "/congresso", titulo: "Congresso Nacional", termos: ["congresso", "federal", "camara dos deputados", "senado"], zona: "congresso" },
  { sufixo: "/congresso/proposicoes", titulo: "Proposições federais", termos: ["proposicao federal", "projeto de lei federal", "pl federal"], zona: "congresso" },
  { sufixo: "/congresso/parlamentares", titulo: "Parlamentares", termos: ["parlamentar", "parlamentares", "deputado", "deputados", "senador", "senadores"], zona: "congresso" },
  { sufixo: "/congresso/bancadas", titulo: "Bancadas", termos: ["bancada", "bancadas", "partido", "partidos"], zona: "congresso" },
  { sufixo: "/congresso/comissoes", titulo: "Comissões do Congresso", termos: ["comissao federal", "comissoes do congresso"], zona: "congresso" },
  { sufixo: "/congresso/votacoes", titulo: "Votações do Congresso", termos: ["votacao federal", "voto nominal"], zona: "congresso" },
  { sufixo: "/congresso/agenda", titulo: "Agenda do Congresso", termos: ["agenda", "pauta", "sessao"], zona: "congresso" },
  { sufixo: "/congresso/alertas", titulo: "Alertas do Congresso", termos: ["alerta", "alertas"], zona: "congresso" },
  { sufixo: "/congresso/bons-exemplos", titulo: "Bons exemplos", termos: ["bons exemplos", "bom exemplo"], zona: "congresso" },
  { sufixo: "/congresso/metodologia", titulo: "Metodologia do Congresso", termos: ["metodologia", "rubrica", "criterio"], zona: "congresso" },

  { sufixo: "/judiciario", titulo: "Judiciário", termos: ["judiciario", "justica", "tribunal", "tribunais"], zona: "judiciario" },
  { sufixo: "/judiciario/tribunais", titulo: "Tribunais superiores", termos: ["stf", "stj", "tst", "tribunal superior"], zona: "judiciario" },
  { sufixo: "/judiciario/indicacoes", titulo: "Indicações", termos: ["indicacao", "indicacoes", "sabatina"], zona: "judiciario" },
  { sufixo: "/judiciario/vagas", titulo: "Vagas nos tribunais", termos: ["vaga", "vagas", "cadeira", "aposentadoria"], zona: "judiciario" },
  { sufixo: "/judiciario/metodologia", titulo: "Metodologia do Judiciário", termos: ["metodologia do judiciario"], zona: "judiciario" },
  { sufixo: "/judiciario/sobre", titulo: "Sobre o Judiciário", termos: ["sobre o judiciario"], zona: "judiciario" },

  { sufixo: "/ambiental", titulo: "Meio ambiente em Minas", termos: ["ambiental estadual", "meio ambiente minas", "minas gerais"], zona: "ambiental" },
  { sufixo: "/ambiental/licenciamento", titulo: "Licenciamento ambiental", termos: ["licenciamento", "licenca", "licencas"], zona: "ambiental" },
  { sufixo: "/ambiental/barragens", titulo: "Barragens de Minas", termos: ["barragem de minas", "barragens de minas"], zona: "ambiental" },
  { sufixo: "/ambiental/copam", titulo: "COPAM", termos: ["copam", "conselho de politica ambiental"], zona: "ambiental" },
  { sufixo: "/ambiental/legislacao", titulo: "Legislação ambiental", termos: ["legislacao ambiental", "lei ambiental"], zona: "ambiental" },
  { sufixo: "/ambiental/patrimonio-cultural", titulo: "Patrimônio cultural", termos: ["patrimonio", "tombamento", "tombado"], zona: "ambiental" },
  { sufixo: "/ambiental/direito-critico", titulo: "Direito crítico", termos: ["direito critico"], zona: "ambiental" },

  { sufixo: "/funcaosocialterra", titulo: "Função social da terra", termos: ["funcao social", "terra devoluta", "terras devolutas"], zona: "terras" },
  // Título sem o "3D" que o resto do repo usa: a regra de "nenhum título
  // afirma dado" é testada por ausência de dígito (`navegacao.test.ts`), e
  // abrir exceção para um dígito que é nome enfraqueceria a regra que pega
  // os dígitos que são contagem. O botão não perde nada sem ele.
  { sufixo: "/funcaosocialterra/mapa", titulo: "Mapa das terras (globo)", termos: ["mapa", "globo", "mapa das terras"], zona: "terras" },
  { sufixo: "/funcaosocialterra/alertas", titulo: "Alertas de terras", termos: ["alerta de terra", "alertas de terras"], zona: "terras" },

  { sufixo: "/paraopeba", titulo: "Bacia do Paraopeba", termos: ["paraopeba", "brumadinho", "bacia"], zona: "paraopeba" },
  { sufixo: "/paraopeba/entenda", titulo: "Entenda o caso Paraopeba", termos: ["entenda"], zona: "paraopeba" },
  { sufixo: "/paraopeba/auxilio", titulo: "Auxílio e reparação", termos: ["auxilio", "reparacao", "indenizacao"], zona: "paraopeba" },
  { sufixo: "/paraopeba/biblioteca", titulo: "Biblioteca do Paraopeba", termos: ["biblioteca"], zona: "paraopeba" },
  { sufixo: "/paraopeba/documentos", titulo: "Documentos do Paraopeba", termos: ["documento", "documentos"], zona: "paraopeba" },
  { sufixo: "/paraopeba/linha-do-tempo", titulo: "Linha do tempo", termos: ["linha do tempo", "cronologia"], zona: "paraopeba" },
  { sufixo: "/paraopeba/quem-atua", titulo: "Quem atua no Paraopeba", termos: ["quem atua", "atores"], zona: "paraopeba" },
  { sufixo: "/paraopeba/clipping", titulo: "Clipping do Paraopeba", termos: ["clipping"], zona: "paraopeba" },

  { sufixo: "/direitos-em-movimento", titulo: "Direitos em movimento", termos: ["direitos em movimento", "direito", "direitos"], zona: "cidades" },
  { sufixo: "/direitos-em-movimento/denuncia", titulo: "Fazer uma denúncia", termos: ["denuncia", "denunciar", "reclamacao"], zona: "cidades" },
  { sufixo: "/direitos-em-movimento/informacao", titulo: "Pedido de informação (LAI)", termos: ["lai", "acesso a informacao", "pedido de informacao"], zona: "cidades" },
  { sufixo: "/direitos-em-movimento/ajuda", titulo: "Onde buscar ajuda", termos: ["ajuda", "defensoria", "ministerio publico"], zona: "cidades" },
];

/**
 * Apelidos de cidade, além do slug e do nome oficial.
 *
 * Existe porque ninguém digita "Belo Horizonte" numa caixa de busca: digita
 * "BH". O slug já cobre `bh` e `sp` (as duas cidades cujo slug foi fixado
 * antes do código, ver `slugDaCidade` em `lib/db/queries/municipios.ts`); o
 * que falta é o caminho inverso — quem escreve o nome por extenso, e quem
 * escreve o apelido falado.
 *
 * NÃO é lista de cidades atendidas: essa é `CIDADES_DO_BUILD`, e uma chave
 * aqui que não exista lá simplesmente nunca casa.
 */
export const APELIDOS_DE_CIDADE: Record<string, string[]> = {
  bh: ["beaga", "belorizonte", "capital mineira"],
  sp: ["sampa", "sao paulo capital", "capital paulista"],
  betim: [],
  aracuai: [],
  diamantina: [],
  itinga: [],
};

/** As cidades que o assistente conhece — sem banco, congeladas no build. */
export const CIDADES = CIDADES_DO_BUILD;
