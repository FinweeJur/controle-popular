import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  atos_oficiais,
  contratos,
  escolas,
  licitacoes,
  obras,
  proposicoes,
  saude_estabelecimentos,
  servidores,
  vereadores,
  analises,
  analise_itens,
  vicios_legislativos,
  ambiental_licenciamento,
  ambiental_legislacao,
  copam_reunioes,
  copam_pauta_itens,
  feam_barragens,
  snisb_barragens,
  cap_autos_infracao,
  ibama_autos_infracao,
  direito_critico_normas,
  direito_critico_precedentes,
  proposicoesInCongresso,
  parlamentaresInCongresso,
  bancadasInCongresso,
  bancada_membrosInCongresso,
  orgaosInCongresso,
  votacoesInCongresso,
  analisesInCongresso,
  analise_itensInCongresso,
  vicios_legislativosInCongresso,
  tribunaisInJudiciario,
  magistradosInJudiciario,
  nomeacoesInJudiciario,
  ocupacoesInJudiciario,
} from "@/lib/db/schema";

/**
 * As contagens da página `/sobre`, medidas no banco a cada build — nunca
 * digitadas à mão.
 *
 * POR QUE UM ARQUIVO SÓ PARA UMA PÁGINA: `docs/APRESENTACAO.md` (a origem
 * do texto desta página) registra os mesmos números como prosa datada —
 * "conferido em 2026-08-12". Prosa datada envelhece sem avisar; a página
 * pública não pode carregar esse risco. Consultar de novo a cada build é o
 * que já se faz para `TAXA_ERRO_G0` e para `listarCidades()` — o padrão da
 * casa é "a tela lê a fonte", não "a tela copia um número que alguém
 * conferiu uma vez".
 *
 * DEGRADAÇÃO SEM BANCO: se `DATABASE_URL` não resolver (build sem Postgres,
 * como o `output: 'export'` sem banco local), a função devolve `null` em
 * vez de lançar — a página trata isso omitindo a seção de números, porque
 * publicar zero em vez de "sem esta medição" seria mentir por omissão.
 */
export interface EstatisticasPortal {
  municipal: {
    contratos: number;
    licitacoes: number;
    atosOficiais: number;
    proposicoes: number;
    servidores: number;
    vereadores: number;
    escolas: number;
    saudeEstabelecimentos: number;
    obras: number;
    contratosComAlerta: number;
    analises: number;
    analisesDeAtos: number;
    analisesDeProposicoes: number;
    analiseItens: number;
    analisesRequerRevisao: number;
    vicios: number;
  };
  congresso: {
    proposicoes: number;
    parlamentares: number;
    bancadas: number;
    bancadaMembros: number;
    orgaos: number;
    votacoes: number;
    analises: number;
    analiseItens: number;
    analisesRequerRevisao: number;
    vicios: number;
  };
  judiciario: {
    tribunais: number;
    magistrados: number;
    magistradosComNascimento: number;
    indicacoes: number;
    ocupacoes: number;
  };
  ambiental: {
    licencas: number;
    normas: number;
    normasComTema: number;
    reunioesCopam: number;
    itensPauta: number;
    barragensFeam: number;
    barragensSnisb: number;
    autosEstaduais: number;
    autosFederais: number;
  };
  direitoCritico: {
    normas: number;
    precedentes: number;
  };
}

const N = sql<number>`count(*)::int`;

export async function obterEstatisticasPortal(): Promise<EstatisticasPortal | null> {
  const db = getDb();
  if (!db) return null;

  const um = async (rows: Promise<{ n: number }[]>) => (await rows)[0]?.n ?? 0;

  const [
    contratosN,
    licitacoesN,
    atosN,
    proposicoesN,
    servidoresN,
    vereadoresN,
    escolasN,
    saudeN,
    obrasN,
    contratosAlertaN,
    analisesN,
    analisesAtosN,
    analisesProposicoesN,
    analiseItensN,
    analisesRevisaoN,
    viciosN,
    congProposicoesN,
    congParlamentaresN,
    congBancadasN,
    congBancadaMembrosN,
    congOrgaosN,
    congVotacoesN,
    congAnalisesN,
    congAnaliseItensN,
    congAnalisesRevisaoN,
    congViciosN,
    tribunaisN,
    magistradosN,
    magistradosNascimentoN,
    indicacoesN,
    ocupacoesN,
    licencasN,
    normasN,
    normasComTemaN,
    copamReunioesN,
    copamItensN,
    feamN,
    snisbN,
    capN,
    ibamaN,
    dcNormasN,
    dcPrecedentesN,
  ] = await Promise.all([
    um(db.select({ n: N }).from(contratos)),
    um(db.select({ n: N }).from(licitacoes)),
    um(db.select({ n: N }).from(atos_oficiais)),
    um(db.select({ n: N }).from(proposicoes)),
    um(db.select({ n: N }).from(servidores)),
    um(db.select({ n: N }).from(vereadores)),
    um(db.select({ n: N }).from(escolas)),
    um(db.select({ n: N }).from(saude_estabelecimentos)),
    um(db.select({ n: N }).from(obras)),
    um(db.select({ n: N }).from(contratos).where(sql`${contratos.alerta} = true`)),
    um(db.select({ n: N }).from(analises)),
    um(db.select({ n: N }).from(analises).where(sql`ato_id is not null`)),
    um(db.select({ n: N }).from(analises).where(sql`proposicao_id is not null`)),
    um(db.select({ n: N }).from(analise_itens)),
    um(db.select({ n: N }).from(analises).where(sql`status = 'requer_revisao'`)),
    um(db.select({ n: N }).from(vicios_legislativos)),
    um(db.select({ n: N }).from(proposicoesInCongresso)),
    um(db.select({ n: N }).from(parlamentaresInCongresso)),
    um(db.select({ n: N }).from(bancadasInCongresso)),
    um(db.select({ n: N }).from(bancada_membrosInCongresso)),
    um(db.select({ n: N }).from(orgaosInCongresso)),
    um(db.select({ n: N }).from(votacoesInCongresso)),
    um(db.select({ n: N }).from(analisesInCongresso)),
    um(db.select({ n: N }).from(analise_itensInCongresso)),
    um(db.select({ n: N }).from(analisesInCongresso).where(sql`status = 'requer_revisao'`)),
    um(db.select({ n: N }).from(vicios_legislativosInCongresso)),
    um(db.select({ n: N }).from(tribunaisInJudiciario)),
    um(db.select({ n: N }).from(magistradosInJudiciario)),
    um(db.select({ n: N }).from(magistradosInJudiciario).where(sql`data_nascimento is not null`)),
    um(db.select({ n: N }).from(nomeacoesInJudiciario)),
    um(db.select({ n: N }).from(ocupacoesInJudiciario)),
    um(db.select({ n: N }).from(ambiental_licenciamento)),
    um(db.select({ n: N }).from(ambiental_legislacao)),
    um(db.select({ n: N }).from(ambiental_legislacao).where(sql`cardinality(temas) > 0`)),
    um(db.select({ n: N }).from(copam_reunioes)),
    um(db.select({ n: N }).from(copam_pauta_itens)),
    um(db.select({ n: N }).from(feam_barragens)),
    um(db.select({ n: N }).from(snisb_barragens)),
    um(db.select({ n: N }).from(cap_autos_infracao)),
    um(db.select({ n: N }).from(ibama_autos_infracao)),
    um(db.select({ n: N }).from(direito_critico_normas)),
    um(db.select({ n: N }).from(direito_critico_precedentes)),
  ]);

  return {
    municipal: {
      contratos: contratosN,
      licitacoes: licitacoesN,
      atosOficiais: atosN,
      proposicoes: proposicoesN,
      servidores: servidoresN,
      vereadores: vereadoresN,
      escolas: escolasN,
      saudeEstabelecimentos: saudeN,
      obras: obrasN,
      contratosComAlerta: contratosAlertaN,
      analises: analisesN,
      analisesDeAtos: analisesAtosN,
      analisesDeProposicoes: analisesProposicoesN,
      analiseItens: analiseItensN,
      analisesRequerRevisao: analisesRevisaoN,
      vicios: viciosN,
    },
    congresso: {
      proposicoes: congProposicoesN,
      parlamentares: congParlamentaresN,
      bancadas: congBancadasN,
      bancadaMembros: congBancadaMembrosN,
      orgaos: congOrgaosN,
      votacoes: congVotacoesN,
      analises: congAnalisesN,
      analiseItens: congAnaliseItensN,
      analisesRequerRevisao: congAnalisesRevisaoN,
      vicios: congViciosN,
    },
    judiciario: {
      tribunais: tribunaisN,
      magistrados: magistradosN,
      magistradosComNascimento: magistradosNascimentoN,
      indicacoes: indicacoesN,
      ocupacoes: ocupacoesN,
    },
    ambiental: {
      licencas: licencasN,
      normas: normasN,
      normasComTema: normasComTemaN,
      reunioesCopam: copamReunioesN,
      itensPauta: copamItensN,
      barragensFeam: feamN,
      barragensSnisb: snisbN,
      autosEstaduais: capN,
      autosFederais: ibamaN,
    },
    direitoCritico: {
      normas: dcNormasN,
      precedentes: dcPrecedentesN,
    },
  };
}
