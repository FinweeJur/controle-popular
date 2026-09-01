/**
 * Memória e cultura das cidades — o bloco "Já aconteceu aqui" do painel
 * municipal (`app/[municipio]/page.tsx`).
 *
 * Origem: proposta de copy v6 (`docs/planos/PLANO-COPY-VOZ.md`), pedido
 * do dono em 02/09/2026 — lembrar no portal das cidades o que já
 * aconteceu lá: princípios, coragem, força, alegrias e cultura, sem
 * pesar o clima.
 *
 * ⟲ 02/09, copy v7.1 (mesmo plano): BH ganha a herança do poema
 * "Herança", do acervo do projeto — Curral del Rey, as greves (CEMIG
 * 2015, professores 2011, metalúrgicos 68) e o desejo do "igual pra
 * igual"; Araçuaí e Itinga ganham a saudação do poema "Passado e
 * futuro" (o povo que luta e sonha no Vale, "de forma risonha"). A
 * PEDIDO DO DONO, Itinga NÃO cita "birra e teimosia": o trecho
 * escolhido é "construindo um novo dia, uma boa utopia". Os versos são
 * do acervo do próprio projeto; nenhum fato novo foi inventado para
 * enfeitar cartão.
 *
 * MESMA FILOSOFIA DO `zonas.ts`: copy em UM lugar, lida por qualquer
 * página. Duplicar o texto em cada `[municipio]` garantiria deriva — a
 * correção de um fato histórico teria de ser feita em seis arquivos, e
 * alguém faria em cinco.
 *
 * GUARDA EDITORIAL (da proposta, e da régua do AGENTS.md): marco
 * histórico só publica com fonte local fechada. `memoria: null` = a
 * linha de memória NÃO renderiza e o cartão sai só com a cultura —
 * cidade sem fonte confirmada nunca ganha marco inventado para
 * enfeitar cartão.
 *
 * Checagem de 02/09/2026:
 * - SP (Anhangabaú, Diretas 1984) e BH (Praça da Estação, 1984; greves
 *   CEMIG 2015 / professores 2011 / metalúrgicos 68; Clube da Esquina;
 *   Conceição Evaristo cresceu em BH): fato consolidado.
 * - Diamantina (Estrada Real, Chica da Silva, JK, vesperatas): fato
 *   consolidado.
 * - Betim, Araçuaí e Itinga: `memoria: null` até fechar fonte local
 *   no padrão do repo. A candidata de Betim — "Betim também é bacia
 *   do Paraopeba: a reparação passa por aqui" (Santa Izabel, distrito
 *   às margens do rio, reportado pelo Brasil de Fato em 24/01/2025) —
 *   está registrada na proposta, esperando a fonte.
 */

export interface MemoriaCidade {
  /** Marco histórico com ano, nome ou lugar. `null` = sem fonte fechada
   *  — o cartão renderiza só a cultura. */
  memoria: string | null;
  /** Cultura viva — o que continua acontecendo na cidade. */
  cultura: string;
}

const MEMORIA_CIDADES: Record<string, MemoriaCidade> = {
  sp: {
    memoria:
      "Em 1984, o Vale do Anhangabaú juntou mais de um milhão de pessoas de rosto pintado pedindo voto direto — a maior festa cívica do país.",
    cultura:
      "Cidade que vive de encontro: feira, bixiga, periferia que dita ritmo pro Brasil inteiro. E foi na favela do Canindé que Carolina Maria de Jesus escreveu Quarto de Despejo — o diário de uma favelada traduzido no mundo inteiro.",
  },
  bh: {
    // ⟲ 02/09, v7.1: a herança do poema "Herança" (acervo do projeto)
    // entra na linha de memória — Curral del Rey e as greves, todos
    // fatos consolidados, e a Praça da Estação fecha como antes.
    memoria:
      "Quando ainda era Curral del Rey, já teve resistência — e o grito ecoa até hoje: a greve da CEMIG em 2015, a dos professores em 2011, os metalúrgicos de 68. Em 1984, a Praça da Estação encheu de gente pedindo o voto direto — BH entrou na frente das Diretas.",
    cultura:
      "E uns anos antes, o Clube da Esquina tinha ensinado o país inteiro a cantar Minas. BH também é a cidade onde Conceição Evaristo cresceu — a escrevivência também é mineira. Até que um dia seja banal: o povo, no mando da capital, de igual pra igual.",
  },
  diamantina: {
    memoria:
      "Por aqui passou o ouro e o diamante da Estrada Real — e daqui saíram Chica da Silva e JK, dois jeitos muito mineiros de fazer história.",
    cultura:
      "Nas vesperatas, a cidade inteira canta da sacada, como canta há gerações.",
  },
  betim: {
    // PENDENTE de fonte local fechada — ver cabeçalho deste arquivo.
    memoria: null,
    cultura:
      "No fim do dia, o congado e a festa do rosário lembram que força também é festa.",
  },
  aracuai: {
    // PENDENTE de fonte local fechada — ver cabeçalho deste arquivo.
    // ⟲ 02/09, v7.1: a saudação risonha do poema "Passado e futuro"
    // (acervo do projeto) fecha a linha de cultura.
    memoria: null,
    cultura:
      "O Vale do Jequitinhonha molda barro e memória: as ceramistas daqui são reconhecidas mundo afora, e a festa do rosário segue de pé. É o povo que luta e sonha no Vale — e sonha risonho.",
  },
  itinga: {
    // PENDENTE de fonte local fechada — ver cabeçalho deste arquivo.
    // ⟲ 02/09, v7.1, A PEDIDO DO DONO: sem "birra e teimosia" aqui —
    // o trecho do poema do Vale é "construindo um novo dia, uma boa
    // utopia". ("Birra e teimosia" segue no plano só como verso-cunho
    // do capítulo Terras.)
    memoria: null,
    cultura:
      "No coração do Vale, o rosário e a folia de reis seguem vivos — cultura que nunca pediu licença. E o poema do Vale aponta o amanhã: construindo um novo dia, uma boa utopia.",
  },
};

/** A memória da cidade, ou `null` para cidade sem cartão definido. */
export function memoriaDaCidade(slug: string): MemoriaCidade | null {
  return MEMORIA_CIDADES[slug] ?? null;
}
