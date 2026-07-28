import { getSupabaseClient, ID_MUNICIPIO_DEFAULT } from "@/lib/betim/supabase";

/**
 * Código de "caráter da internação" do SUS/SIH (manual técnico DATASUS,
 * conjunto pequeno e estável nacionalmente — não específico de Betim).
 */
export const CARATER_LABELS: Record<string, string> = {
  "1": "Eletiva",
  "2": "Urgência",
  "3": "Acidente de trabalho (local)",
  "4": "Acidente de trajeto ao trabalho",
  "5": "Outro tipo de acidente",
  "6": "Não se aplica",
};

export interface InternacaoAno {
  ano: number;
  qtdTotal: number;
  obitosTotal: number;
  permanenciaMediaGeral: number;
  porCarater: { carater: string; qtd: number }[];
}

export interface ArboviroseResumo {
  doenca: string;
  casosAnoAtual: number;
  nivelAlertaMax: number;
}

export interface MortalidadeCausa {
  grupo_causa: string;
  obitos: number;
}

export interface SaudeData {
  configured: boolean;
  totalEstabelecimentos: number;
  /**
   * NÃO EXIBIR sem antes corrigir `etl/bd/cnes.py` — confirmado ao vivo
   * 2026-07-21: soma pra 2.542.498, impossível pra uma cidade de ~440 mil
   * habitantes. `br_ms_cnes.profissional` provavelmente é uma tabela com
   * uma linha por profissional por competência (mês), então `COUNT(*)`
   * sem filtrar pra uma competência única conta o mesmo profissional
   * várias vezes. Mantido no tipo pra não perder o dado bruto, mas
   * `app/saude/page.tsx` propositalmente não renderiza este campo — ver
   * TODO.md.
   */
  totalProfissionais: number;
  internacoesPorAno: InternacaoAno[];
  arboviroses: ArboviroseResumo[];
  topCausasMortalidade: MortalidadeCausa[];
  anoMortalidade: number | null;
}

const EMPTY: SaudeData = {
  configured: false,
  totalEstabelecimentos: 0,
  totalProfissionais: 0,
  internacoesPorAno: [],
  arboviroses: [],
  topCausasMortalidade: [],
  anoMortalidade: null,
};

export interface CausaTendencia {
  grupo_causa: string;
  mediaRecente: number;
  mediaAnterior: number;
  variacaoPercentual: number;
}

export interface SaudeTendencias {
  configured: boolean;
  /** Causas de óbito com maior alta na média dos últimos 2 anos vs. os 2 anos anteriores. */
  causasEmAlta: CausaTendencia[];
  /** true se as internações de urgência (carater "2") subiram nos últimos 2 anos disponíveis vs os 2 anteriores. */
  internacoesUrgenciaEmAlta: boolean;
  variacaoInternacoesUrgencia: number;
  /** Aviso sobre a janela curta de dados do InfoDengue — não dá pra afirmar tendência sazonal com poucas semanas. */
  dengueJanelaCurta: boolean;
  dengueUltimasSemanas: { semana: number; casos: number }[];
}

const EMPTY_TENDENCIAS: SaudeTendencias = {
  configured: false,
  causasEmAlta: [],
  internacoesUrgenciaEmAlta: false,
  variacaoInternacoesUrgencia: 0,
  dengueJanelaCurta: true,
  dengueUltimasSemanas: [],
};

/**
 * Compara a média dos 2 anos mais recentes contra a média dos 2 anos
 * anteriores — sinaliza tendência real (não ruído de um único ano) sem
 * exigir uma regressão de verdade. `2020` (COVID) é propositalmente
 * excluído do cálculo de causas infecciosas/parasitárias pra não marcar
 * uma anomalia de pandemia como "tendência" — mas mantido pras demais
 * causas, já que ali o efeito foi menor.
 */
export async function getSaudeTendencias(): Promise<SaudeTendencias> {
  const supabase = getSupabaseClient();
  if (!supabase) return EMPTY_TENDENCIAS;

  try {
    const { data: mortData, error: mortError } = await supabase
      .from("mortalidade")
      .select("ano, grupo_causa, obitos")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .gte("ano", new Date().getFullYear() - 6);

    const { data: internData, error: internError } = await supabase
      .from("saude_internacoes")
      .select("ano, carater, qtd")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .eq("carater", "2")
      .gte("ano", new Date().getFullYear() - 6);

    if (mortError || internError) return { ...EMPTY_TENDENCIAS, configured: true };

    // Causas de óbito: agrupa por causa, pega os 2 anos mais recentes com
    // dado e os 2 anteriores a esses, ignora causas com poucos casos
    // (ruído estatístico) e ignora 2020 pra evitar confundir o pico de
    // COVID com uma tendência real.
    const anosPorCausa = new Map<string, Map<number, number>>();
    for (const row of (mortData ?? []) as { ano: number; grupo_causa: string; obitos: number }[]) {
      if (row.ano === 2020) continue;
      if (!anosPorCausa.has(row.grupo_causa)) anosPorCausa.set(row.grupo_causa, new Map());
      anosPorCausa.get(row.grupo_causa)!.set(row.ano, row.obitos);
    }

    const causasEmAlta: CausaTendencia[] = [];
    for (const [causa, anos] of anosPorCausa) {
      const anosOrdenados = [...anos.keys()].sort((a, b) => b - a);
      if (anosOrdenados.length < 4) continue;
      const [maisRecente1, maisRecente2, anterior1, anterior2] = anosOrdenados;
      const mediaRecente = (anos.get(maisRecente1)! + anos.get(maisRecente2)!) / 2;
      const mediaAnterior = (anos.get(anterior1)! + anos.get(anterior2)!) / 2;
      if (mediaAnterior < 20) continue; // causa rara, variação % não é confiável
      const variacaoPercentual = ((mediaRecente - mediaAnterior) / mediaAnterior) * 100;
      if (variacaoPercentual > 10) {
        causasEmAlta.push({ grupo_causa: causa, mediaRecente, mediaAnterior, variacaoPercentual });
      }
    }
    causasEmAlta.sort((a, b) => b.variacaoPercentual - a.variacaoPercentual);

    // Internações de urgência: mesma lógica dos 2+2 anos, sem excluir 2020
    // (internação por urgência não teve o mesmo efeito de distorção).
    const internPorAno = new Map<number, number>();
    for (const row of (internData ?? []) as { ano: number; qtd: number }[]) {
      internPorAno.set(row.ano, (internPorAno.get(row.ano) ?? 0) + row.qtd);
    }
    const anosIntern = [...internPorAno.keys()].sort((a, b) => b - a);
    let internacoesUrgenciaEmAlta = false;
    let variacaoInternacoesUrgencia = 0;
    if (anosIntern.length >= 4) {
      const [r1, r2, a1, a2] = anosIntern;
      const mediaRecente = (internPorAno.get(r1)! + internPorAno.get(r2)!) / 2;
      const mediaAnterior = (internPorAno.get(a1)! + internPorAno.get(a2)!) / 2;
      variacaoInternacoesUrgencia = ((mediaRecente - mediaAnterior) / mediaAnterior) * 100;
      internacoesUrgenciaEmAlta = variacaoInternacoesUrgencia > 5;
    }

    // Dengue: o InfoDengue só retorna uma janela recente de semanas, não
    // histórico completo — não dá pra calcular tendência sazonal real com
    // isso, só mostrar o que temos e avisar da limitação.
    const { data: dengueData } = await supabase
      .from("arboviroses")
      .select("semana_epidemiologica, casos, ano")
      .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
      .eq("doenca", "dengue")
      .order("ano", { ascending: false })
      .order("semana_epidemiologica", { ascending: false })
      .limit(8);
    const dengueUltimasSemanas = ((dengueData ?? []) as { semana_epidemiologica: number; casos: number }[])
      .map((r) => ({ semana: r.semana_epidemiologica, casos: r.casos }))
      .reverse();

    return {
      configured: true,
      causasEmAlta: causasEmAlta.slice(0, 3),
      internacoesUrgenciaEmAlta,
      variacaoInternacoesUrgencia,
      dengueJanelaCurta: dengueUltimasSemanas.length < 12,
      dengueUltimasSemanas,
    };
  } catch {
    return { ...EMPTY_TENDENCIAS, configured: true };
  }
}

export async function getSaudeData(): Promise<SaudeData> {
  const supabase = getSupabaseClient();
  if (!supabase) return EMPTY;

  try {
    const [estabRes, internRes, arboRes, mortAnoRes] = await Promise.all([
      supabase
        .from("saude_estabelecimentos")
        .select("profissionais_count", { count: "exact" })
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT),
      supabase
        .from("saude_internacoes")
        .select("ano, carater, qtd, obitos, permanencia_media")
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .order("ano", { ascending: false }),
      supabase
        .from("arboviroses")
        .select("doenca, ano, casos, nivel_alerta")
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .order("ano", { ascending: false }),
      supabase
        .from("mortalidade")
        .select("ano")
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .order("ano", { ascending: false })
        .limit(1),
    ]);

    const totalEstabelecimentos = estabRes.count ?? 0;
    const totalProfissionais = (estabRes.data ?? []).reduce(
      (acc: number, row: { profissionais_count: number | null }) =>
        acc + (row.profissionais_count ?? 0),
      0
    );

    const internacoesByAno = new Map<number, InternacaoAno>();
    for (const row of (internRes.data ?? []) as {
      ano: number;
      carater: string | null;
      qtd: number;
      obitos: number;
      permanencia_media: number;
    }[]) {
      if (!internacoesByAno.has(row.ano)) {
        internacoesByAno.set(row.ano, {
          ano: row.ano,
          qtdTotal: 0,
          obitosTotal: 0,
          permanenciaMediaGeral: 0,
          porCarater: [],
        });
      }
      const acc = internacoesByAno.get(row.ano)!;
      acc.qtdTotal += row.qtd;
      acc.obitosTotal += row.obitos;
      acc.porCarater.push({ carater: row.carater ?? "?", qtd: row.qtd });
    }
    const internacoesPorAno = [...internacoesByAno.values()]
      .sort((a, b) => b.ano - a.ano)
      .slice(0, 6);

    const anoRecenteArbo = arboRes.data?.[0]?.ano as number | undefined;
    const arboMap = new Map<string, ArboviroseResumo>();
    for (const row of (arboRes.data ?? []) as {
      doenca: string;
      ano: number;
      casos: number;
      nivel_alerta: number;
    }[]) {
      if (row.ano !== anoRecenteArbo) continue;
      if (!arboMap.has(row.doenca)) {
        arboMap.set(row.doenca, { doenca: row.doenca, casosAnoAtual: 0, nivelAlertaMax: 0 });
      }
      const acc = arboMap.get(row.doenca)!;
      acc.casosAnoAtual += row.casos;
      acc.nivelAlertaMax = Math.max(acc.nivelAlertaMax, row.nivel_alerta ?? 0);
    }

    const anoMortalidade = (mortAnoRes.data?.[0]?.ano as number | undefined) ?? null;
    let topCausasMortalidade: MortalidadeCausa[] = [];
    if (anoMortalidade) {
      const { data: mortData } = await supabase
        .from("mortalidade")
        .select("grupo_causa, obitos")
        .eq("id_municipio", ID_MUNICIPIO_DEFAULT)
        .eq("ano", anoMortalidade)
        .order("obitos", { ascending: false })
        .limit(5);
      topCausasMortalidade = (mortData ?? []) as MortalidadeCausa[];
    }

    return {
      configured: true,
      totalEstabelecimentos,
      totalProfissionais,
      internacoesPorAno,
      arboviroses: [...arboMap.values()],
      topCausasMortalidade,
      anoMortalidade,
    };
  } catch {
    return { ...EMPTY, configured: true };
  }
}
