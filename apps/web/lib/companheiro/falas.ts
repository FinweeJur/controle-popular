/**
 * @file falas.ts
 * @description Catálogo de FALAS do companheiro Seu Nonô, uma lista por pet.
 *
 * PAPEL NO PORTAL
 * ---------------
 * O companheiro flutuante (`app/components/CompanheiroFlutuante.tsx`) mostra,
 * uma vez por sessão e por volta dos 2 minutos de permanência, um balão de fala
 * ALEATÓRIA do pet ATIVO (`pets[0]`). Este módulo é a única fonte dessas falas:
 * o componente não escreve texto de bicho, ele sorteia daqui.
 *
 * A chave do mapa é o `slug` do Petdex — o mesmo de `companheiroPets.ts` e o
 * mesmo salvo no `localStorage` (`cp_pet`). `FALAS_PADRAO` cobre slug novo que
 * apareça na folha antes de ganhar fala própria: um pet desconhecido nunca
 * fica mudo, só usa a fala genérica.
 *
 * O arquivo também guarda as falas de RÁDIO (`FALAS_RADIO`), disparadas quando
 * o leitor escolhe uma estação no player. A chave ali é o id da estação; o
 * companheiro comenta a escolha num balãozinho curto e volta a se calar.
 *
 * TOM (decisão do dono)
 * ---------------------
 * Leve e engraçado. Cada fala é uma frase curta, sem número inventado e sem
 * promessa de dado — o pet faz companhia, não afirma fato do portal.
 *
 * DECISÃO TÉCNICA
 * ---------------
 * Dado puro, sem `import` de React nem de `window`: o componente é de cliente,
 * mas este módulo também é seguro de importar em teste de nó (vitest) e em
 * qualquer render de servidor. Nada de IA no cliente.
 *
 * REGRA EDITORIAL
 * ---------------
 * As citações de terceiros (Frida Kahlo, Fernando Pessoa) vêm creditadas na
 * própria fala, como manda o AGENTS §7 — o pet é um personagem, mas a frase
 * de outra pessoa continua sendo dela.
 */

/**
 * Falas por slug de pet. Cada lista tem pelo menos uma frase curta.
 * A ordem não importa: o sorteio é aleatório dentro da lista.
 */
export const FALAS: Record<string, string[]> = {
  qiaowei: [
    "Pés, para que os quero, se tenho asas para voar? — Frida Kahlo",
    "Canto de manhã, reclamo do boleto à tarde.",
    "Liberdade é o único endereço que decoro.",
  ],
  "dingdong-chicken": [
    "Cocoricó! Levanta, que o dia não espera.",
    "Eu ia atravessar a rua, mas pensei melhor.",
    "Um ovo por dia é autocuidado.",
  ],
  "maodie-2": [
    "Soneca é meu esporte olímpico.",
    "Já vi tudo nesta vida — e dormi em cima.",
  ],
  "round-maodie-c63864e8": [
    "Redondo, feliz e sem pressa.",
    "Não é preguiça, é modo economia de energia.",
  ],
  meiqiu: [
    "Eu sou gato preto com orgulho. Azar é de quem tem superstição boba.",
    "Chego de fininho e deito no seu teclado.",
  ],
  "bubu-3": ["Miau. Cadê meu petisco?"],
  chompers: ["Nom nom nom. Você trouxe comida?"],
  wangcai: [
    "Au Au!",
    "Fogo nos Racistas - Djonga",
    "Amigo é coisa de cachorro.",
  ],
  bolt: ["Corri atrás do carteiro. Ele que começou."],
  chedarini: ["Queijo? Você falou queijo?"],
  capvolt: [
    "Pika-pika! Cuidado, estou carregado.",
    "Trovão fora de hora dá nisso.",
  ],
  capy: [
    "Se tá difícil, deita na grama comigo.",
    "Sou a capivara: amiga de todo mundo, até do jacaré.",
  ],
  whaledou: [
    "Blub! Nadar é minha terapia.",
    "Navegar é preciso; viver não é preciso. — Fernando Pessoa",
  ],
  "casey-cassette": [
    "Aperte o play, essa mixtape é boa.",
    "Lado B é sempre melhor.",
    "Rewind: quem lembra do walkman?",
  ],
  clippy: [
    "Parece que você está tentando ser produtivo. Quer ajuda?",
    "Sou o clipe que ficou. Nostalgia, né?",
  ],
  sprig: ["Fotossíntese e paz.", "Todo broto começa pequeno."],
  totoro: [
    "Chuva boa pra cochilar.",
    "Esperando o ônibus-gato. Atrasado, como sempre.",
  ],
  gabumon: ["Digivolve pra produtividade… amanhã."],
  saga: ["Hoje é só mais um capítulo."],
  daodun: ["Devagar e sempre.", "Devagar se vai ao longe."],
  nightleaf: [
    "Sou mais escuro que a noite — e mais calmo também.",
    "De dia eu existo. De noite eu brilho.",
  ],
  "kyle-kun": ["Konnichiwa! Vim fazer companhia."],
  theveller: ["Só passando pra dar um oi."],
};

/**
 * Fala de reserva para slug desconhecido. Tom acolhedor e genérico: se um pet
 * novo nascer sem fala cadastrada, ele ainda conversa em vez de sumir.
 */
export const FALAS_PADRAO: string[] = [
  "Oi! Eu moro por aqui.",
  "Passei só para te fazer companhia.",
];

/**
 * Fala curta do companheiro quando o leitor ESCOLHE uma rádio no player.
 *
 * A chave é o `id` da estação em `lib/radio/estacoes.ts` — o mesmo que viaja
 * em `cp:radio-tocar`/`cp:radio-estado`. O mapa é pequeno de propósito: só as
 * estações com um tempero próprio ganham frase; as demais caem em
 * `FALAS_RADIO_PADRAO`, para nenhuma escolha ficar muda. O tom continua o do
 * resto do arquivo: opinião leve do bicho, sem afirmar fato, número ou
 * promessa sobre a programação.
 */
export const FALAS_RADIO: Record<string, string> = {
  "radio-cumbia-mix": "Adoro cumbia!",
  "radio-yaravi": "Cumbia andina combina com preguiça boa.",
  "portal-roots-reggae": "Debocho legal com esse reggae.",
  "irie-fm": "Reggae na medida, sem pressa.",
  "radio-rebelde": "Son cubano e um café, por favor.",
  "radio-folclorllanero": "Joropo me deixa de bom humor.",
  "radio-clube-fm-recife": "Forró, brega e saudade boa.",
  "radio-favela": "Funk e rap: a quebrada fala.",
  "radio-mec-fm": "Clássica para acalmar o dia.",
  "radio-brasil-de-fato": "Informação popular no ar.",
};

/**
 * Falas genéricas de rádio, para estação sem frase própria. Curtas para caber
 * no balãozinho perto do pet, inclusive no celular.
 */
export const FALAS_RADIO_PADRAO: string[] = [
  "Boa escolha!",
  "Essa eu curto.",
  "Sintonizei!",
];

/**
 * Devolve a lista de falas de um slug, ou a lista padrão se ele for novo.
 *
 * @param slug Slug do pet (chave de `FALAS`).
 * @returns A lista de falas do slug, nunca vazia.
 */
export function falaPara(slug: string): string[] {
  return FALAS[slug] ?? FALAS_PADRAO;
}

/**
 * Escolhe a fala da rádio pelo id da estação. Se a estação tem frase própria,
 * ela vence; senão, sorteia uma genérica. O `aleatorio` é injetável para o
 * teste ser determinístico, como em `escolherFala`.
 *
 * @param id Id da estação (`lib/radio/estacoes.ts`).
 * @param aleatorio Fonte de aleatoriedade em `[0, 1)`; default `Math.random`.
 * @returns Uma fala curta, nunca vazia.
 */
export function falaParaRadio(
  id: string,
  aleatorio: () => number = Math.random,
): string {
  const propria = FALAS_RADIO[id];
  if (propria) return propria;
  const indice = Math.floor(aleatorio() * FALAS_RADIO_PADRAO.length);
  return FALAS_RADIO_PADRAO[indice] ?? FALAS_RADIO_PADRAO[0];
}

/**
 * Sorteia uma fala do slug. O `aleatorio` é injetável para o teste ser
 * determinístico; em produção usa `Math.random`.
 *
 * @param slug Slug do pet ativo.
 * @param aleatorio Fonte de aleatoriedade em `[0, 1)`; default `Math.random`.
 * @returns Uma fala da lista (a primeira, se a lista for de um só item).
 */
export function escolherFala(slug: string, aleatorio: () => number = Math.random): string {
  const lista = falaPara(slug);
  const indice = Math.floor(aleatorio() * lista.length);
  return lista[indice] ?? lista[0];
}
