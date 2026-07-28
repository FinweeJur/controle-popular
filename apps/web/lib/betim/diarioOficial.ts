export interface DiarioOficialInfo {
  ano: number;
  ultimaEdicao: string | null;
  ultimaData: string | null;
  totalAno: number;
}

/**
 * Info leve do Diário Oficial (Órgão Oficial) de Betim, do dataset de
 * dados abertos (`betim.mg.gov.br/portal/dados-abertos/diario-oficial/{ano}`).
 * O JSON lista as edições (número + data) mas NÃO traz link por edição —
 * o link individual do portal é `/diario-oficial/ver/{id_interno}`, um id
 * diferente do número da edição, que o dataset não expõe. Por isso o card
 * só mostra a última edição + total do ano e manda pro gazette oficial
 * (onde as edições abrem de verdade); não replica um diretório com links
 * quebrados.
 *
 * Best-effort com timeout curto: se o portal de Betim estiver fora, degrada
 * pra `null` e a página mostra só o link estático — nunca trava o render.
 */
export async function getDiarioOficialInfo(): Promise<DiarioOficialInfo | null> {
  const ano = new Date().getFullYear();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `https://www.betim.mg.gov.br/portal/dados-abertos/diario-oficial/${ano}`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        // Revalida de hora em hora (ISR) — não busca a cada request.
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { dados?: unknown[] };
    const dados = (json.dados ?? []).filter(
      (r): r is { edicao?: string; data?: string } => typeof r === "object" && r !== null
    );
    if (dados.length === 0) return null;
    const maisRecente = [...dados].sort((a, b) =>
      (b.data ?? "").localeCompare(a.data ?? "")
    )[0];
    return {
      ano,
      ultimaEdicao: maisRecente.edicao ?? null,
      ultimaData: maisRecente.data ? maisRecente.data.slice(0, 10) : null,
      totalAno: dados.length,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
