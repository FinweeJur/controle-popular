import { listarBancadasComContagem, membrosDaBancada, obterBancadaPorId, proposicoesDeAutores } from "@/lib/db/queries/congresso";
import { agregar, type PerfilAgregado } from "@/lib/congresso/agregado";
import type { Rotulo } from "@/lib/congresso/rubrica";

export type TipoBancada = "frente" | "bloco" | "federacao" | "partido";

export interface Bancada {
  id: string;
  casa_id: string;
  id_externo: string | null;
  tipo: TipoBancada;
  nome: string | null;
  legislatura: number | null;
  url_site: string | null;
}

export interface BancadaComContagem extends Bancada {
  membros: number;
}

export const ROTULO_TIPO: Record<TipoBancada, string> = {
  frente: "Frente parlamentar",
  bloco: "Bloco",
  federacao: "Federação",
  partido: "Partido",
};

export const DESCRICAO_TIPO: Record<TipoBancada, string> = {
  frente:
    "Grupos temáticos suprapartidários — é o que se costuma chamar de “bancada ruralista”, “bancada evangélica”, “bancada da segurança”. Não são órgãos do regimento, mas explicam por que parlamentares sem partido em comum votam junto num tema.",
  bloco: "Agrupamentos partidários formados para efeito de proporcionalidade nas comissões e no tempo de fala.",
  federacao: "União de partidos com vínculo obrigatório por no mínimo quatro anos, que funciona como um partido só.",
  partido: "Legendas com representação na casa.",
};

export async function listarBancadas(
  tipo?: TipoBancada
): Promise<BancadaComContagem[] | null> {
  const linhas = await listarBancadasComContagem(tipo);
  if (!linhas) return null;
  // A contagem de membros vem agregada do banco; a ordenação fica no JS
  // porque o desempate é `localeCompare(pt-BR)`, que a collation do
  // Postgres não reproduz igual.
  return (linhas as BancadaComContagem[]).sort(
    (a, b) => b.membros - a.membros || (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR")
  );
}

export interface MembroBancada {
  id: string;
  nome: string | null;
  partido: string | null;
  uf: string | null;
  url_foto: string | null;
  papel: string | null;
}

export async function obterBancada(id: string): Promise<{
  bancada: Bancada;
  membros: MembroBancada[];
  perfil: PerfilAgregado;
  proposicoes: {
    id: string;
    identificacao: string | null;
    ementa: string | null;
    rotulo: Rotulo | null;
    autores: string[];
  }[];
} | null> {
  const bancada = await obterBancadaPorId(id);
  if (!bancada) return null;

  const membros: MembroBancada[] = (await membrosDaBancada(id)).sort((a, b) => {
    // Coordenação primeiro; o resto em ordem alfabética.
    const peso = (m: MembroBancada) => (m.papel ? 0 : 1);
    return peso(a) - peso(b) || (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR");
  });

  const idsMembros = membros.map((m) => m.id);
  if (idsMembros.length === 0) {
    return { bancada: bancada as Bancada, membros, perfil: agregar([]), proposicoes: [] };
  }

  const autorias = await proposicoesDeAutores(idsMembros);

  const nomePorId = new Map(membros.map((m) => [m.id, m.nome ?? ""]));

  // Uma proposição assinada por 12 membros da mesma frente é UMA
  // proposição, não 12 — contar por vínculo inflaria o perfil de frentes
  // grandes e faria toda frente parecer mais ativa do que é.
  const porProposicao = new Map<
    string,
    { id: string; identificacao: string | null; ementa: string | null; data: string | null; rotulo: Rotulo | null; autores: Set<string> }
  >();

  for (const p of autorias) {
    const a = p; // o join devolve colunas planas: sem embed para desembrulhar
    const existente = porProposicao.get(p.id);
    const autor = nomePorId.get(a.parlamentar_id) ?? "";
    if (existente) {
      if (autor) existente.autores.add(autor);
    } else {
      porProposicao.set(p.id, {
        id: p.id,
        identificacao: p.identificacao,
        ementa: p.ementa,
        data: p.data_apresentacao,
        rotulo: (p.rotulo as Rotulo | null) ?? null,
        autores: new Set(autor ? [autor] : []),
      });
    }
  }

  const proposicoes = [...porProposicao.values()]
    .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""))
    .map((p) => ({
      id: p.id,
      identificacao: p.identificacao,
      ementa: p.ementa,
      rotulo: p.rotulo,
      autores: [...p.autores],
    }));

  return {
    bancada: bancada as Bancada,
    membros,
    perfil: agregar(proposicoes.map((p) => p.rotulo)),
    proposicoes,
  };
}
