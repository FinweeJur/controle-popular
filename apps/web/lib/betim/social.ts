import * as q from "@/lib/db/queries/betim";

export interface BeneficioMes {
  competencia: string; // "YYYY-MM-DD" (dia 1 do mês)
  beneficiarios: number | null;
  valorTotal: number | null;
}

export interface BeneficioPrograma {
  programa: string;
  meses: BeneficioMes[];
  /** Mês mais recente disponível. */
  ultimo: BeneficioMes | null;
  /** Variação de beneficiários vs. 12 meses antes do último mês — null se não houver os dois pontos. */
  variacao12m: number | null;
}

export interface SocialData {
  configured: boolean;
  ok: boolean;
  programas: BeneficioPrograma[];
}

const VAZIO: SocialData = { configured: false, ok: false, programas: [] };

interface Row {
  programa: string;
  competencia: string;
  beneficiarios: number | null;
  valor_total: number | string | null;
}

/**
 * Novo Bolsa Família + BPC por mês (Portal da Transparência,
 * `etl/apis/beneficios_sociais.py`). A série do Bolsa Família começa em
 * março/2023 (quando o programa foi relançado com esse nome) — NÃO é uma
 * série contínua desde 2004, o programa mudou de nome duas vezes
 * (Bolsa Família → Auxílio Brasil → Novo Bolsa Família) e a API não
 * unifica o histórico. A página precisa dizer isso.
 */
export async function getSocialData(idMunicipio: string): Promise<SocialData> {
  try {
    const data = await q.beneficiosSociais(idMunicipio);
    if (!data) return VAZIO;

    const rows = data as Row[];
    const porPrograma = new Map<string, BeneficioMes[]>();
    for (const r of rows) {
      const lista = porPrograma.get(r.programa) ?? [];
      lista.push({
        competencia: r.competencia,
        beneficiarios: r.beneficiarios,
        valorTotal: r.valor_total != null ? Number(r.valor_total) : null,
      });
      porPrograma.set(r.programa, lista);
    }

    const programas: BeneficioPrograma[] = [...porPrograma.entries()].map(([programa, meses]) => {
      const ultimo = meses[meses.length - 1] ?? null;
      const idx12mAntes = meses.length - 13; // 12 meses antes do último = 13ª posição a partir do fim
      const mes12mAntes = idx12mAntes >= 0 ? meses[idx12mAntes] : null;
      const variacao12m =
        ultimo?.beneficiarios != null && mes12mAntes?.beneficiarios
          ? ((ultimo.beneficiarios - mes12mAntes.beneficiarios) / mes12mAntes.beneficiarios) * 100
          : null;
      return { programa, meses, ultimo, variacao12m };
    });

    return { configured: true, ok: true, programas };
  } catch {
    return { ...VAZIO, configured: true };
  }
}
