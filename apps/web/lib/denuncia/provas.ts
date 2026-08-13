import type { TipoProva } from "@/lib/denuncia/tipos";

/**
 * Tabela de ferramentas de prova — transcrita de `docs/PLANO-ACAO-CIDADA.md`,
 * seção "Provas". Cada ferramenta foi checada por quem escreveu o plano
 * (link, o que é, o que faz) em 13/08/2026; este arquivo não pesquisa de
 * novo, só reproduz o que já foi verificado — mudar o texto aqui sem mudar
 * a fonte faria os dois divergirem.
 *
 * `garante` e `naoGarante` ficam sempre juntos, nunca um sem o outro: a
 * regra do plano é "o que a ferramenta NÃO garante vem ao lado, nunca em
 * rodapé à parte" — recomendar sem ressalva é dar falsa segurança.
 */
export interface FerramentaProva {
  situacao: string;
  ferramenta: string;
  link: string | null;
  garante: string;
  naoGarante: string;
}

export const FERRAMENTAS_PROVA: FerramentaProva[] = [
  {
    situacao: "Fotografar/filmar com metadado à prova de alteração",
    ferramenta: "ProofMode (Guardian Project / WITNESS — Android e iOS, código aberto)",
    link: "https://proofmode.org/",
    garante: "Autenticidade técnica da captura — difícil de forjar depois.",
    naoGarante:
      "Não é laudo pericial. E precisa estar instalado e ativo ANTES do fato — não resgata foto já tirada pela câmera nativa.",
  },
  {
    situacao: "Documentar para uso eventual em processo, com cadeia de custódia",
    ferramenta: "eyeWitness to Atrocities (International Bar Association — Android, gratuito)",
    link: "https://www.lexisnexisrolfoundation.org/projects/eyewitness.aspx?p=projects",
    garante:
      "Cadeia de custódia documentada — já usado como prova aceita em tribunal (RD Congo, 2018).",
    naoGarante:
      "Envia o arquivo a um servidor de terceiros fora do Brasil — é o oposto do \"não sai do aparelho\" deste facilitador, e precisa ser dito assim.",
  },
  {
    situacao: "Preservar uma página da internet antes que ela saia do ar",
    ferramenta: "Wayback Machine — \"Save Page Now\" (web.archive.org, gratuito, sem cadastro)",
    link: "https://blog.archive.org/2019/10/23/the-wayback-machines-save-page-now-is-new-and-improved/",
    garante: "Prova de que o conteúdo existia naquela URL naquele momento.",
    naoGarante:
      "Não captura conteúdo atrás de login, nem tudo que é JavaScript dinâmico; o site pode bloquear o robô do Archive.",
  },
  {
    situacao: "Gravar áudio",
    ferramenta: "Gravador nativo do celular + enviar cópia para um segundo lugar (e-mail, WhatsApp para si mesmo)",
    link: null,
    garante: "Registro do som, com data/hora do sistema do aparelho.",
    naoGarante:
      "Data do sistema é alterável no próprio aparelho — não é carimbo de tempo confiável sozinho; some se o aparelho for apreendido e a cópia não foi feita.",
  },
  {
    situacao: "Print de tela",
    ferramenta: "Print nativo",
    link: null,
    garante: "Rápido.",
    naoGarante:
      "Frágil por si só: sem metadado de captura, fácil de contestar como editado. Prefira \"Save Page Now\" para página da internet, e o print só como reforço.",
  },
  {
    situacao: "Foto de celular comum (sem ProofMode)",
    ferramenta: "Câmera nativa",
    link: null,
    garante: "Registra a imagem.",
    naoGarante:
      "Não é laudo. O metadado (localização, hora) existe no arquivo original, mas é removido pela maioria dos apps de mensagem ao compartilhar (WhatsApp, Telegram) — envie o arquivo original por e-mail ou USB, nunca só por print da conversa.",
  },
];

/**
 * "O oposto do que se espera": gravar prova também expõe quem grava — se um
 * agente do Estado é filmado e o telefone é apreendido no local, o vídeo
 * vira prova de que a pessoa estava lá. Texto do plano, verbatim na
 * intenção: dizer que a decisão tem custo, não dizer para não gravar.
 */
export const AVISO_GRAVACAO =
  "Gravar prova também expõe quem grava. Se um agente do Estado for filmado e o telefone for " +
  "apreendido no local, o vídeo vira prova de que você estava lá e gravou. Se for seguro, envie " +
  "a gravação para outro lugar (e-mail, nuvem) assim que puder, em vez de guardar só no " +
  "aparelho. Avalie se é mais seguro registrar depois, de memória, do que gravar no momento — a " +
  "decisão tem custo, e é sua, informada.";

export const TIPO_PROVA_LABEL: Record<TipoProva, string> = {
  foto_video: "Foto ou vídeo",
  print: "Print de tela ou de conversa",
  testemunha: "Testemunha que viu o que aconteceu",
  documento: "Documento (boletim, laudo, ofício, contrato)",
  audio: "Gravação de áudio",
  nenhuma: "Ainda não tenho nenhuma prova reunida",
};
