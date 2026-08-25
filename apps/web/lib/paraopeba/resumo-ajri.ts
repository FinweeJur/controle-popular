// GERADO por `scripts/gerar-resumo-ajri.mts` a partir dos 337 resumos
// auditados que vivem em `X:\DevCoder\_ajri\resumo\` (fora do repo, de propósito —
// dados de trabalho não são versionados ao lado do arquivo gerado). Não editar
// à mão: rode o script de novo quando a fase de conteúdo entregar resumo novo.
//
// ═══ O QUE É ESTE ARQUIVO ═══
//
// O resumo, em linguagem comum, de 337 dos 467 documentos da auditoria
// socioambiental independente (AECOM) do Acordo Judicial de Reparação Integral
// de Brumadinho. Os 130 sem resumo nunca foram baixados na fase de conteúdo —
// a ficha deles segue como antes (catálogo + link).
//
// O resumo é OBRA NOVA deste projeto, não o texto da AECOM: paráfrase em
// linguagem comum, quebrada em blocos com título, com a `citacao` literal que
// sustenta cada veredito — e só veredito quando a AECOM escreve o veredito
// textualmente (216 com-ressalvas, 114 nao-declarado, 6 satisfatorio, 1 insatisfatorio). As regras de conteúdo estão em `X:\DevCoder\_ajri\RUBRICA.md` e foram
// verificadas contra o texto-fonte em 3 passadas de crítico + rede de
// segurança determinística na fase de conteúdo; este script revalida o schema
// (mesmo `validar.py`) e a paridade com o catálogo antes de gravar.
//
// ═══ OBRA NOVA × ESPELHO DE PDF — A DECISÃO QUE AINDA É DO DONO ═══
//
// Os Termos de Uso do portal-fonte proíbem modificar e usar comercialmente o
// material da AECOM — por isso o espelho de PDF ficou fora desta entrega
// (`docs/planos/PLANO-ESPELHO-PDF-AJRI.md`) e `descricao` continua transcrita
// sem edição. A leitura adotada aqui é que o resumo é obra nova (paráfrase
// com citação travada), não modificação — mas a decisão final de PUBLICAR
// este arquivo é do dono, registrada em pendência. Até lá, o dado pode
// existir no repositório; a tela é que decide quando mostrar.
//
// ═══ POR QUE ARQUIVO SEPARADO, E SÓ NO CLIENTE ═══
//
// Os 337 resumos somam 2.03 MiB de JSON —
// colocar isso no array do catálogo (336 KiB) faria toda ficha do acervo
// carregar o peso dos 337, e o defeito que travou o deploy em 15/08/2026
// (`docs/_historico/HANDOFF-PAYLOAD-LEGISLACAO.md`: 4,7 MiB de texto viraram
// 35,5 MiB de payload, 7,5×) é exatamente esse. Vive aqui, em record chaveado
// por `codigo`, e é importado SÓ pelo componente de cliente
// (`AuditoriaClient.tsx`) — vira chunk de JS compartilhado, nunca prop de
// rota nem leitura de servidor. Se um dia virar rotina servidor, é este
// arquivo que precisa de fatia por-ficha antes.

/** O veredito que a AECOM escreveu — só existe quando ela escreve. */
export type VereditoAjri = "satisfatorio" | "com-ressalvas" | "insatisfatorio" | "nao-declarado";

export const VEREDITO_AJRI_LABEL: Record<VereditoAjri, string> = {
  "satisfatorio": "Satisfatório",
  "com-ressalvas": "Com ressalvas",
  "insatisfatorio": "Insatisfatório",
  "nao-declarado": "Não declarado",
};

/** Uma pessoa nomeada no exercício de função pública ou de gestão do contrato. */
export interface PessoaAjri {
  nome: string;
  cargo: string;
}

/** Uma instituição que participou do ciclo, com quem o documento nomeia. */
export interface ParticipanteAjri {
  sigla: string;
  nome: string;
  pessoas: PessoaAjri[];
}

/** Encontro datado dentro do período examinado — ver RUBRICA.md.
 * `data` é "AAAA-MM-DD"; vira "AAAA-MM" (só mês) quando o documento não dá o
 * dia — renderizar como "agosto de 2021", nunca como dia 1. */
export interface ReuniaoAjri {
  data: string;
  assunto: string;
}

/** Só número que está escrito no documento — nenhum é calculado. */
export interface NumeroAjri {
  o_que: string;
  valor: string;
}

/** Bloco com título curto (2–5 palavras) e parágrafo de 2–4 frases. */
export interface BlocoResumoAjri {
  titulo: string;
  texto: string;
}

/** O resumo em linguagem comum de um documento — obra nova, ver o cabeçalho. */
export interface ResumoAjri {
  codigo: string;
  /**
   * O período que o documento examinou; `null` quando a capa não declara.
   * `ate` pode ser `null` sozinho: nota técnica sem fim declarado.
   */
  periodo: { de: string; ate: string | null } | null;
  objeto: string;
  quem_participou: ParticipanteAjri[];
  reunioes: ReuniaoAjri[];
  veredito: VereditoAjri;
  /** O trecho literal que sustenta o veredito; `null` no não-declarado. */
  citacao: string | null;
  constatacoes: string[];
  pendencias: string[];
  numeros: NumeroAjri[];
  resumo: BlocoResumoAjri[];
}

/**
 * Cobertura literal, para páginas SERVIDOR mostrarem número sem importar o
 * record inteiro — mesma doutrina de `COBERTURA_AUDITORIA_AJRI`. A paridade
 * com o record é travada em `dados.test.ts`.
 */
export const COBERTURA_RESUMO_AJRI = {
  total: 337,
  semResumo: 130,
} as const;


/**
 * 2026-08-25: o registro (337 fichas, ~2 MB) saiu daqui e virou
 * `public/data/resumo-ajri.json` - asset estatico que o cliente busca via
 * `fetch` (`AuditoriaClient.tsx`) e o teste le em Node via
 * `resumo-ajri-dados.ts`. Motivo: teto de 3 MiB gzip do Worker Free
 * (erro 10027 no deploy de 2026-08-24).
 */